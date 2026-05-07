#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render villager icon: red bust only, transparent background -> assets/villager.png"""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageDraw

# solid red, no shadow
FILL = (0xC6, 0x28, 0x28, 255)
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "villager.png")
TARGET = 128
# draw at 2x, downscale for cleaner edges
S = 256


def main() -> None:
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = S // 2
    head_top, head_w, head_h = 38, 108, 108
    d.ellipse(
        [cx - head_w // 2, head_top, cx + head_w // 2, head_top + head_h],
        fill=FILL,
    )
    neck = head_top + head_h - 6
    w_top, w_bot = 72, 150
    bottom = 232
    d.polygon(
        [
            (cx - w_top // 2, neck + 2),
            (cx + w_top // 2, neck + 2),
            (cx + w_bot // 2, bottom),
            (cx - w_bot // 2, bottom),
        ],
        fill=FILL,
    )
    out = im.resize((TARGET, TARGET), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    out.save(OUT, "PNG", optimize=True)
    ar = np.array(out)
    assert ar[:, :, 3].max() > 0
    print(OUT, out.size, "opaque_px", int((ar[:, :, 3] > 0).sum()))


if __name__ == "__main__":
    main()
