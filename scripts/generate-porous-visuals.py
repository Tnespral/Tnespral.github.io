"""Generate crisp, data-derived assets for the porous-media portfolio page.

The source arrays remain outside the website. Only a handful of rendered
32 x 64 examples are written to ``public/figures/porous-media``.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image


ROWS = 32
COLS = 64
CELL_SIZE = 20
OUTPUT_SIZE = (COLS * CELL_SIZE, ROWS * CELL_SIZE)

# Distinct examples keep the page from repeating one matrix throughout.
SAMPLES = {
    "field": 684,
    "masking": 363,
    "symmetry": 504,
    "architecture": 619,
    "preview": 489,
}


def flow_scale(parameters: pd.Series) -> float:
    return float(
        parameters["delta_p"]
        * parameters["delta_A"]
        / (parameters["visc"] * parameters["L"])
    )


def save_grid(rgb: np.ndarray, path: Path) -> None:
    """Save one flat colour per simulated pixel without interpolation."""

    pixels = np.asarray(rgb, dtype=np.uint8)
    enlarged = np.repeat(np.repeat(pixels, CELL_SIZE, axis=0), CELL_SIZE, axis=1)
    Image.fromarray(enlarged).save(path, optimize=True)


def mask_rgb(mask: np.ndarray) -> np.ndarray:
    dark = np.array([6, 8, 8], dtype=np.uint8)
    light = np.array([246, 245, 239], dtype=np.uint8)
    return np.where(mask[..., None] > 0.5, light, dark)


def flow_rgb(field: np.ndarray, mask: np.ndarray | None = None) -> np.ndarray:
    import matplotlib

    positive = field[field > 0]
    ceiling = float(np.percentile(positive, 98)) if positive.size else 1.0
    normalised = np.clip(field / max(ceiling, 1e-12), 0.0, 1.0)
    colours = (matplotlib.colormaps["coolwarm"](normalised)[..., :3] * 255).astype(np.uint8)
    if mask is not None:
        colours[mask <= 0.5] = np.array([58, 70, 105], dtype=np.uint8)
    return colours


def extend_into_solid(field: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Create a schematic pre-mask field by diffusing nearby open-pixel values."""

    values = field.copy()
    weights = mask.astype(np.float64).copy()
    for _ in range(10):
        value_sum = values.copy()
        weight_sum = weights.copy()
        for axis in (0, 1):
            value_sum += np.roll(values, 1, axis=axis) + np.roll(values, -1, axis=axis)
            weight_sum += np.roll(weights, 1, axis=axis) + np.roll(weights, -1, axis=axis)
        values = value_sum / np.maximum(weight_sum, 1.0)
        weights = np.clip(weight_sum, 0.0, 1.0)
    return values


def sharpen_existing_result(path: Path) -> None:
    """Recover the 32 x 64 colour cells from an older interpolated render."""

    with Image.open(path) as image:
        source = np.asarray(image.convert("RGB"))
    height, width = source.shape[:2]
    if height % ROWS or width % COLS:
        raise ValueError(f"{path.name} is not divisible into a {ROWS} x {COLS} grid")
    cells = source.reshape(ROWS, height // ROWS, COLS, width // COLS, 3).mean((1, 3))
    save_grid(cells, path)


def crop_result_detail(source_path: Path, target_path: Path) -> None:
    """Enlarge a genuine 16 x 32 region from the sparse validation result."""

    with Image.open(source_path) as image:
        source = np.asarray(image.convert("RGB"))
    height, width = source.shape[:2]
    cells = source.reshape(ROWS, height // ROWS, COLS, width // COLS, 3).mean((1, 3))
    detail = cells[4:20, 22:54]
    enlarged = np.repeat(np.repeat(detail, 40, axis=0), 40, axis=1)
    Image.fromarray(np.asarray(enlarged, dtype=np.uint8)).save(target_path, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument(
        "--details-only",
        action="store_true",
        help="Regenerate only the enlarged sparse validation detail from existing renders.",
    )
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    if args.details_only:
        for panel in ("mask", "truth", "prediction", "error"):
            crop_result_detail(
                args.output_dir / f"sparse-{panel}.png",
                args.output_dir / f"detail-{panel}.png",
            )
        return

    inputs = np.load(args.data_dir / "train_inputs.npy")
    labels = np.load(args.data_dir / "train_labels.npy")
    parameters = pd.read_csv(args.data_dir / "train_params.csv")
    for prefix, index in SAMPLES.items():
        mask = inputs[index]
        dimensionless = labels[index] / flow_scale(parameters.iloc[index])
        save_grid(mask_rgb(mask), args.output_dir / f"{prefix}-mask.png")
        save_grid(flow_rgb(dimensionless, mask), args.output_dir / f"{prefix}-flow.png")

        if prefix == "masking":
            raw = extend_into_solid(dimensionless, mask)
            save_grid(flow_rgb(raw), args.output_dir / "masking-raw.png")
            save_grid(flow_rgb(dimensionless, mask), args.output_dir / "masking-valid.png")

    # Preserve the recorded prediction colours while removing interpolation blur.
    for prefix in ("dense", "sparse"):
        for panel in ("mask", "truth", "prediction", "error"):
            sharpen_existing_result(args.output_dir / f"{prefix}-{panel}.png")

    # The complete sparse case is mostly empty at portfolio scale. The detail
    # preserves the recorded target, prediction and error while making its
    # informative region legible.
    for panel in ("mask", "truth", "prediction", "error"):
        crop_result_detail(
            args.output_dir / f"sparse-{panel}.png",
            args.output_dir / f"detail-{panel}.png",
        )


if __name__ == "__main__":
    main()
