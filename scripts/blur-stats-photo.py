#!/usr/bin/env python3
"""Blur teammate faces; keep #7 (center) face sharp."""
from pathlib import Path

from PIL import Image, ImageFilter

SRC = Path("/home/ubuntu/.cursor/projects/workspace/assets/92bd2746-891b-4712-8b75-4b3fff7a1514.jpg")
OUT = Path("/workspace/site/photos/kuzey-istatistik-kutlama.jpg")

# Yüz odaklı kutular (x0,y0,x1,y1) — 7 numara ~merkez, bu kutuların dışında
KEEP_CLEAR = (0.36, 0.18, 0.64, 0.48)  # #7 yüzü

FACE_BOXES = [
    (0.02, 0.04, 0.16, 0.16),
    (0.18, 0.04, 0.32, 0.15),
    (0.62, 0.04, 0.76, 0.15),
    (0.82, 0.04, 0.97, 0.16),
    (0.00, 0.24, 0.13, 0.36),
    (0.18, 0.28, 0.32, 0.42),
    (0.82, 0.28, 0.96, 0.44),
    (0.88, 0.26, 0.99, 0.38),
]


def intersects(a, b):
    return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])


def blur_box(img: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    x0, y0, x1, y1 = box
    if x1 - x0 < 8 or y1 - y0 < 8:
        return
    crop = img.crop((x0, y0, x1, y1))
    crop = crop.filter(ImageFilter.GaussianBlur(radius=radius))
    img.paste(crop, (x0, y0, x1, y1))


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    keep = tuple(int(KEEP_CLEAR[i] * (w if i % 2 == 0 else h)) for i in range(4))
    for fr in FACE_BOXES:
        box = (int(fr[0] * w), int(fr[1] * h), int(fr[2] * w), int(fr[3] * h))
        if intersects(keep, box):
            continue
        blur_box(img, box, radius=28)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "JPEG", quality=90, optimize=True)
    print(OUT, img.size)


if __name__ == "__main__":
    main()