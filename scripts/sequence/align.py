"""Encaja una secuencia en otra: escala y mueve todos sus fotogramas para que
el primero coincida con el fotograma de referencia (misma caja de la pieza).
Así el despiece arranca justo donde está el giro, sin saltos.

uso: align.py <referencia.webp> <carpeta de la secuencia>
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ref_path, folder = sys.argv[1], Path(sys.argv[2])


def box(img):
    a = np.asarray(img)[..., 3] > 200  # solo la pieza, no la sombra
    ys, xs = np.nonzero(a)
    return xs.min(), ys.min(), xs.max(), ys.max()


ref = Image.open(ref_path)
frames = sorted(folder.glob('*.webp'))
rx0, ry0, rx1, ry1 = box(ref)
fx0, fy0, fx1, fy1 = box(Image.open(frames[0]))
s = ((rx1 - rx0) / (fx1 - fx0) + (ry1 - ry0) / (fy1 - fy0)) / 2
# se alinea por abajo y por el centro: la pieza apoya en el mismo suelo
dx = (rx0 + rx1) / 2 - (fx0 + fx1) / 2 * s
dy = ry1 - fy1 * s
for f in frames:
    img = Image.open(f)
    scaled = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    out = Image.new('RGBA', ref.size)
    out.paste(scaled, (round(dx), round(dy)))  # copia tal cual; admite desplazamientos negativos
    out.save(f, quality=88)
print(f'escala {s:.3f}, desplazamiento {dx:.0f},{dy:.0f}')
