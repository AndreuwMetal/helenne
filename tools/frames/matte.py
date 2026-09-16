# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "pillow", "scipy"]
# ///
"""Convierte recortes RGBA (salida de cutout.swift) en una secuencia lista para la web.

Por cada fotograma:
  - se queda con la pieza principal (fuera motas y restos del estante),
  - suaviza el borde y le quita el halo del color de la pared,
  - centra y escala la pieza con una media móvil (sin saltos de cámara),
  - le pone debajo una sombra de contacto para que no parezca flotar.
Entre tramos distintos genera un fundido.

uso: matte.py <carpeta_tramo> [<carpeta_tramo> ...] --out <carpeta> --size 960x600
"""
import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage

BLEND_FRAMES = 6      # fotogramas de fundido entre tramos
SMOOTH = 7            # ventana de la media móvil del encuadre
PIECE_H = 0.62        # alto de la pieza respecto al lienzo
PIECE_W = 0.86        # ancho máximo
BASELINE = 0.80       # altura del suelo


def refine(rgba):
    """Devuelve (rgb float, alpha float 0..1) con el borde limpio."""
    rgb = rgba[..., :3].astype(np.float32)
    a = rgba[..., 3].astype(np.float32) / 255

    solid = a > 0.5
    lab, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = lab == (np.argmax(sizes) + 1)
        a[~ndimage.binary_dilation(keep, iterations=3)] = 0

    # borde: 1 px hacia dentro y suavizado, como una foto de estudio
    a = ndimage.grey_erosion(a, size=3)
    a = ndimage.gaussian_filter(a, 0.9)

    # halo: el color del borde pasa a ser el del tejido más cercano
    inner = a > 0.92
    if inner.any():
        _, idx = ndimage.distance_transform_edt(~inner, return_indices=True)
        edge = ~inner
        rgb[edge] = rgb[idx[0][edge], idx[1][edge]]
    return rgb, a


def bbox(a):
    ys, xs = np.where(a > 0.5)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def moving_average(values, window):
    pad = window // 2
    v = np.pad(np.asarray(values, dtype=np.float64), pad, mode="edge")
    return np.convolve(v, np.ones(window) / window, mode="valid")


def shadow_for(alpha, baseline_y):
    """Sombra de contacto: dos elipses difuminadas bajo la huella de la pieza."""
    h, w = alpha.shape
    cols = np.where(alpha[max(0, baseline_y - int(h * 0.08)):baseline_y].max(axis=0) > 0.5)[0]
    if not len(cols):
        return np.zeros_like(alpha)
    cx = (cols[0] + cols[-1]) / 2
    rx = (cols[-1] - cols[0]) / 2
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    out = np.zeros_like(alpha)
    # (ancho, alto, opacidad): una sombra de contacto nítida y otra ambiental amplia
    for kx, ry, strength in ((0.95, h * 0.016, 0.42), (1.25, h * 0.05, 0.16)):
        d = ((xx - cx) / (rx * kx)) ** 2 + ((yy - baseline_y) / ry) ** 2
        out = np.maximum(out, np.exp(-2.2 * d) * strength)
    return out


def compose(rgb, a, box, center_x, height, W, H, fit):
    x0, y0, x1, y1 = box
    piece = np.dstack([rgb[y0:y1, x0:x1], a[y0:y1, x0:x1] * 255]).astype(np.uint8)
    img = Image.fromarray(piece, "RGBA")
    s = fit / height
    img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)

    canvas = Image.new("RGBA", (W, H))
    base = int(H * BASELINE)
    left = round(W / 2 - (center_x - x0) * s)
    canvas.alpha_composite(img, (left, base - img.height))

    arr = np.asarray(canvas).astype(np.float32)
    sh = shadow_for(arr[..., 3] / 255, base)
    # sombra (negro translúcido) por debajo de la pieza
    pa = arr[..., 3] / 255
    out_a = pa + sh * (1 - pa)
    out_rgb = np.where(out_a[..., None] > 0,
                       arr[..., :3] * pa[..., None] / np.maximum(out_a[..., None], 1e-6), 0)
    return Image.fromarray(np.dstack([out_rgb, out_a * 255]).astype(np.uint8), "RGBA")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("segments", nargs="+")
    ap.add_argument("--out", required=True)
    ap.add_argument("--size", default="960x600")
    args = ap.parse_args()
    W, H = (int(v) for v in args.size.split("x"))
    os.makedirs(args.out, exist_ok=True)

    frames = []  # (rgb, a, box) de todos los tramos, con marca de inicio de tramo
    starts = []
    for seg in args.segments:
        starts.append(len(frames))
        for name in sorted(f for f in os.listdir(seg) if f.endswith(".png")):
            rgba = np.asarray(Image.open(os.path.join(seg, name)).convert("RGBA"))
            rgb, a = refine(rgba)
            if (a > 0.5).sum() < 500:
                continue
            frames.append((rgb, a, bbox(a)))

    boxes = np.array([f[2] for f in frames], dtype=np.float64)
    cx = (boxes[:, 0] + boxes[:, 2]) / 2
    hh = boxes[:, 3] - boxes[:, 1]
    ww = boxes[:, 2] - boxes[:, 0]
    # suavizado por tramo: no se mezcla el encuadre de dos tomas distintas
    bounds = starts + [len(frames)]
    for s, e in zip(bounds, bounds[1:]):
        cx[s:e] = moving_average(cx[s:e], min(SMOOTH, e - s) | 1)
        hh[s:e] = moving_average(hh[s:e], min(SMOOTH, e - s) | 1)

    # una sola escala por tramo para que la pieza no "respire"
    target = []
    for s, e in zip(bounds, bounds[1:]):
        fit = min(H * PIECE_H, W * PIECE_W * np.min(hh[s:e] / ww[s:e]))
        target += [fit] * (e - s)

    out = []
    for i, (rgb, a, box) in enumerate(frames):
        img = compose(rgb, a, box, cx[i], hh[i], W, H, target[i])
        if i in starts[1:] and out:
            prev = out[-1]
            for k in range(1, BLEND_FRAMES + 1):
                out.append(Image.blend(prev, img, k / (BLEND_FRAMES + 1)))
        out.append(img)

    for n, img in enumerate(out):
        img.save(os.path.join(args.out, f"{n:03d}.webp"), "WEBP", quality=82, method=6)
    print(f"{args.out}: {len(out)} fotogramas")


if __name__ == "__main__":
    main()
