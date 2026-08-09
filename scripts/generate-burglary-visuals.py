from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image, ImageDraw
from pyproj import Transformer


BACKGROUND = np.array([10, 18, 16], dtype=np.float32)
VALID_LOW = np.array([24, 35, 32], dtype=np.float32)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepared-data", type=Path, required=True)
    parser.add_argument("--events", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--month", default="2025-02")
    return parser.parse_args()


def normalise(values: np.ndarray, mask: np.ndarray) -> np.ndarray:
    selected = values[mask]
    low, high = np.nanpercentile(selected, [2, 98])
    if not np.isfinite(low) or not np.isfinite(high) or high <= low:
        return np.zeros_like(values, dtype=np.float32)
    return np.clip((values - low) / (high - low), 0, 1).astype(np.float32)


def render_field(
    values: np.ndarray,
    mask: np.ndarray,
    high_colour: tuple[int, int, int],
    output: Path,
    binary: bool = False,
    signed: bool = False,
) -> None:
    if signed:
        scaled = (values.astype(np.float32) + 1.0) / 2.0
    else:
        scaled = values.astype(np.float32) if binary else normalise(values, mask)
    scaled = np.clip(scaled, 0, 1)[..., None]
    high = np.array(high_colour, dtype=np.float32)
    rgb = BACKGROUND[None, None, :].repeat(values.shape[0], axis=0).repeat(values.shape[1], axis=1)
    rgb[mask] = VALID_LOW + scaled[mask] * (high - VALID_LOW)
    rgb = np.flipud(np.clip(rgb, 0, 255).astype(np.uint8))
    image = Image.fromarray(rgb, "RGB").resize((784, 688), Image.Resampling.NEAREST)
    image.save(output, optimize=True)


def render_reports(
    events_path: Path,
    month: str,
    mask: np.ndarray,
    x_min: float,
    y_min: float,
    grid_size: int,
    output: Path,
) -> None:
    rows: list[pd.DataFrame] = []
    for chunk in pd.read_csv(
        events_path,
        usecols=["Month", "Longitude", "Latitude"],
        chunksize=150_000,
        low_memory=False,
    ):
        keep = chunk[chunk["Month"].astype(str).str.slice(0, 7) == month]
        if not keep.empty:
            rows.append(keep.dropna())
    events = pd.concat(rows, ignore_index=True) if rows else pd.DataFrame()

    base = np.broadcast_to(BACKGROUND.astype(np.uint8), (*mask.shape, 3)).copy()
    base[mask] = VALID_LOW.astype(np.uint8)
    image = Image.fromarray(np.flipud(base), "RGB").resize((784, 688), Image.Resampling.NEAREST)
    draw = ImageDraw.Draw(image)
    if not events.empty:
        transformer = Transformer.from_crs(4326, 27700, always_xy=True)
        eastings, northings = transformer.transform(
            events["Longitude"].to_numpy(), events["Latitude"].to_numpy()
        )
        columns = (np.asarray(eastings) - x_min) / grid_size
        rows_y = (np.asarray(northings) - y_min) / grid_size
        sx = image.width / mask.shape[1]
        sy = image.height / mask.shape[0]
        for column, row in zip(columns, rows_y):
            if not (math.isfinite(column) and math.isfinite(row)):
                continue
            x = column * sx
            y = image.height - row * sy
            if 0 <= x < image.width and 0 <= y < image.height:
                draw.ellipse((x - 2.2, y - 2.2, x + 2.2, y + 2.2), fill=(216, 145, 119))
    image.save(output, optimize=True)


def main() -> None:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    saved = np.load(args.prepared_data, allow_pickle=False)
    features = saved["features"]
    labels = saved["labels"]
    dates = saved["dates"].tolist()
    names = saved["feature_names"].tolist()
    mask = saved["valid_mask"].astype(bool)
    index = dates.index(args.month)

    render_reports(
        args.events,
        args.month,
        mask,
        float(saved["x_min"]),
        float(saved["y_min"]),
        int(saved["grid_size"]),
        args.output / "reports-feb-2025.png",
    )
    render_field(labels[index], mask, (211, 137, 111), args.output / "target-feb-2025.png", binary=True)

    selections = {
        "month-sin.png": ("month_sin", (190, 166, 118), False, True),
        "month-cos.png": ("month_cos", (190, 166, 118), False, True),
        "previous-month.png": ("lag_1", (211, 137, 111), True, False),
        "three-month-mean.png": ("lag_3_mean", (211, 137, 111), False, False),
        "neighbour-activity.png": ("avg_neighbor_lag_1", (211, 137, 111), False, False),
        "temperature.png": ("mean_temperature", (127, 165, 160), False, False),
        "rainfall.png": ("rainfall", (127, 165, 160), False, False),
        "daylight.png": ("daylight", (127, 165, 160), False, False),
        "households.png": ("households", (184, 125, 103), False, False),
        "deprivation.png": ("deprivation", (184, 125, 103), False, False),
        "house-price.png": ("house_price", (184, 125, 103), False, False),
        "young-share.png": ("young_share", (184, 125, 103), False, False),
    }
    for filename, (name, colour, binary, signed) in selections.items():
        render_field(
            features[index, names.index(name)],
            mask,
            colour,
            args.output / filename,
            binary=binary,
            signed=signed,
        )

    for month in ("2024-12", "2025-01", "2025-02"):
        month_index = dates.index(month)
        render_field(
            features[month_index, names.index("lag_1")],
            mask,
            (211, 137, 111),
            args.output / f"history-{month}.png",
            binary=True,
        )


if __name__ == "__main__":
    main()
