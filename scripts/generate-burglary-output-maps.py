from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib
import numpy as np
from PIL import Image


LIGHT_PROBABILITY = matplotlib.colors.LinearSegmentedColormap.from_list(
    "portfolio_burg_light",
    ["#dce4df", "#cedbd4", "#c2d1c9", "#cfccb8", "#c8ad91", "#b9876f", "#965e51"],
)
DARK_PROBABILITY = matplotlib.colors.ListedColormap(
    [
        "#0a1210",
        "#182320",
        "#2f2f29",
        "#463c33",
        "#5e493d",
        "#755647",
        "#8c6251",
        "#a46f5b",
        "#bb7c65",
        "#d3896f",
    ],
    name="portfolio_burg_dark",
)
OBSERVED_COLOURS = {
    "light": ("#d5dfda", "#a96556"),
    "dark": ("#35423d", "#c7816d"),
}


def render_probability(
    probabilities: np.ndarray,
    valid_mask: np.ndarray,
    threshold: float,
    low: float,
    high: float,
    scale: int,
    theme: str,
) -> Image.Image:
    del threshold
    normalised = np.clip((probabilities - low) / max(high - low, 1e-6), 0.0, 1.0)
    palette = LIGHT_PROBABILITY if theme == "light" else DARK_PROBABILITY
    colours = palette(normalised)[..., :3] * 255

    rgba = np.zeros((*probabilities.shape, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(colours, 0, 255).astype(np.uint8)
    rgba[..., 3] = np.where(valid_mask, 255, 0).astype(np.uint8)
    image = Image.fromarray(rgba)
    return image.resize((image.width * scale, image.height * scale), Image.Resampling.NEAREST)


def render_observed(
    labels: np.ndarray,
    valid_mask: np.ndarray,
    scale: int,
    theme: str,
) -> Image.Image:
    no_report, report = OBSERVED_COLOURS[theme]
    no_report_rgb = np.asarray(matplotlib.colors.to_rgb(no_report)) * 255
    report_rgb = np.asarray(matplotlib.colors.to_rgb(report)) * 255
    colours = np.broadcast_to(no_report_rgb, (*labels.shape, 3)).copy()
    colours[labels.astype(bool)] = report_rgb
    rgba = np.zeros((*labels.shape, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(colours, 0, 255).astype(np.uint8)
    rgba[..., 3] = np.where(valid_mask, 255, 0).astype(np.uint8)
    image = Image.fromarray(rgba)
    return image.resize((image.width * scale, image.height * scale), Image.Resampling.NEAREST)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--predictions", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--date", default="2025-03")
    parser.add_argument("--scale", type=int, default=8)
    args = parser.parse_args()

    saved = np.load(args.predictions, allow_pickle=False)
    dates = saved["dates"].tolist()
    if args.date not in dates:
        raise ValueError(f"{args.date} is not present in the saved rolling predictions")

    index = dates.index(args.date)
    probabilities = saved["probabilities"][index]
    labels = saved["labels"][index]
    valid_mask = saved["valid_mask"]
    threshold = float(saved["thresholds"][index])
    valid_probabilities = probabilities[valid_mask]
    low, high = np.percentile(valid_probabilities, [5, 95])

    args.output.mkdir(parents=True, exist_ok=True)
    for theme in ("light", "dark"):
        render_probability(
            probabilities,
            valid_mask,
            threshold,
            float(low),
            float(high),
            args.scale,
            theme,
        ).save(args.output / f"forecast-map-{theme}.png", optimize=True)
        render_observed(labels, valid_mask, args.scale, theme).save(
            args.output / f"observed-map-{theme}.png",
            optimize=True,
        )

    print(
        f"Rendered {args.date}: 5th percentile={low:.3f}, "
        f"threshold={threshold:.3f}, 95th percentile={high:.3f}"
    )


if __name__ == "__main__":
    main()
