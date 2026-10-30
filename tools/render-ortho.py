"""Tiny software rasterizer for offline inspection of the drain-pipe model.

Reads the triangle dump produced from model.json and writes PNG views so the
pipe layout can be checked without a browser (headless GPU is unavailable in
this sandbox).

  python tools/render-ortho.py .tmp/model-dump.json out.png --views front,side,top
"""
import json
import math
import sys

import numpy as np
from PIL import Image

VIEWS = {
    # name: (eye direction looking *at* the model, up vector)
    "front": ((0, 0, 1), (0, 1, 0)),
    "back": ((0, 0, -1), (0, 1, 0)),
    "right": ((1, 0, 0), (0, 1, 0)),
    "left": ((-1, 0, 0), (0, 1, 0)),
    "top": ((0, 1, 0), (0, 0, 1)),
    "iso": ((0.75, 0.5, 0.9), (0, 1, 0)),
}


def load(path):
    with open(path, encoding="utf-8") as fh:
        meshes = json.load(fh)
    tris, cols = [], []
    for m in meshes:
        color = np.array(m["color"], dtype=np.float32)
        for t in m["tris"]:
            tris.append((np.array(t["p"], dtype=np.float32), np.array(t["n"], dtype=np.float32)))
            cols.append(color)
    return tris, cols


def render(tris, cols, size, view="front", highlight=None, shade_by=None):
    d, up = VIEWS[view]
    fwd = np.array(d, dtype=np.float32)
    fwd /= np.linalg.norm(fwd)
    up = np.array(up, dtype=np.float32)
    right = np.cross(up, fwd)
    right /= np.linalg.norm(right)
    up2 = np.cross(fwd, right)

    allp = np.concatenate([t[0] for t in tris])
    proj = np.stack([allp @ right, allp @ up2], axis=1)
    lo, hi = proj.min(axis=0), proj.max(axis=0)
    span = np.maximum(hi - lo, 1e-6).max()
    scale = (size * 0.9) / span
    off = ((lo + hi) / 2)
    depth = allp @ fwd

    w = size
    img = np.full((w, w, 3), 0.13, dtype=np.float32)
    zbuf = np.full((w, w), -1e9, dtype=np.float32)
    light = np.array([0.4, 0.75, 0.55], dtype=np.float32)
    light /= np.linalg.norm(light)

    for (pos, nor), color in zip(tris, cols):
        p2 = (pos @ np.vstack([right, up2]).T - off) * scale + w / 2
        z = pos @ fwd
        if highlight is not None and highlight(pos) is False:
            continue
        n = nor.mean(axis=0)
        ln = np.linalg.norm(n)
        lam = 0.35 if ln < 1e-6 else 0.35 + 0.65 * abs(float(n / ln @ light))
        base = color * lam
        if shade_by is not None:
            base = shade_by(pos) * lam
        xs = p2[:, 0]
        ys = p2[:, 1]
        x0, x1 = max(int(np.floor(xs.min())), 0), min(int(np.ceil(xs.max())), w - 1)
        y0, y1 = max(int(np.floor(ys.min())), 0), min(int(np.ceil(ys.max())), w - 1)
        if x0 > x1 or y0 > y1:
            continue
        ax, ay = xs[0], ys[0]
        bx, by = xs[1], ys[1]
        cx, cy = xs[2], ys[2]
        den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(den) < 1e-9:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        l1 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / den
        l2 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / den
        l3 = 1 - l1 - l2
        inside = (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
        if not inside.any():
            continue
        zz = l1 * z[0] + l2 * z[1] + l3 * z[2]
        sub = zbuf[y0:y1 + 1, x0:x1 + 1]
        mask = inside & (zz > sub)
        sub[mask] = zz[mask]
        img[y0:y1 + 1, x0:x1 + 1][mask] = base

    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else ".tmp/model-dump.json"
    out = sys.argv[2] if len(sys.argv) > 2 else ".tmp/view.png"
    views = (sys.argv[3] if len(sys.argv) > 3 else "front,right,top,iso").split(",")
    size = int(sys.argv[4]) if len(sys.argv) > 4 else 460
    tris, cols = load(src)
    imgs = [render(tris, cols, size, v) for v in views]
    sheet = Image.new("RGB", (size * len(imgs), size))
    for i, im in enumerate(imgs):
        sheet.paste(im, (size * i, 0))
    sheet.save(out)
    print(out, sheet.size)


if __name__ == "__main__":
    main()
