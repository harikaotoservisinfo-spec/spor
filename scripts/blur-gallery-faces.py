#!/usr/bin/env python3
"""Blur all faces except the player near image center (#7)."""
import sys
from pathlib import Path

import cv2
import numpy as np

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("input.jpg")
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("output.jpg")
KEEP_INDEX = int(sys.argv[3]) if len(sys.argv) > 3 else None


def blur_region(img, x, y, w, h, k=51):
    x1, y1 = max(0, x), max(0, y)
    x2, y2 = min(img.shape[1], x + w), min(img.shape[0], y + h)
    if x2 <= x1 or y2 <= y1:
        return
    roi = img[y1:y2, x1:x2]
    kk = k if k % 2 == 1 else k + 1
    img[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (kk, kk), 0)


def main():
    img = cv2.imread(str(SRC))
    if img is None:
        raise SystemExit(f"Cannot read {SRC}")
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
  # smaller min neighbors = more detections for background
    faces = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(28, 28))
    if len(faces) == 0:
        raise SystemExit("No faces detected")

    cx, cy = w * 0.5, h * 0.38
    best_i = 0
    best_score = -1e9
    for i, (x, y, fw, fh) in enumerate(faces):
        fx, fy = x + fw / 2, y + fh / 2
        dist = ((fx - cx) / w) ** 2 + ((fy - cy) / h) ** 2
        area = fw * fh
        score = area * 1.2 - dist * w * h * 0.8
        if KEEP_INDEX is not None:
            continue
        if score > best_score:
            best_score = score
            best_i = i

    keep = KEEP_INDEX if KEEP_INDEX is not None else best_i
    out = img.copy()
    for i, (x, y, fw, fh) in enumerate(faces):
        if i == keep:
            continue
        pad_x = int(fw * 0.35)
        pad_y = int(fh * 0.45)
        blur_region(out, x - pad_x, y - pad_y, fw + 2 * pad_x, fh + 2 * pad_y, 65)

    # Extra background strip (spectators) — heavy blur upper-mid band
    y0, y1 = int(h * 0.02), int(h * 0.22)
    strip = out[y0:y1, :].copy()
    out[y0:y1, :] = cv2.GaussianBlur(strip, (99, 99), 0)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT), out, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
    print(f"faces={len(faces)} keep={keep} -> {OUT}")


if __name__ == "__main__":
    main()