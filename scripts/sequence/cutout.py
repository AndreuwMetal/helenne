"""Recorta la pieza de un fondo liso conservando su sombra.

Dentro de la máscara de Vision: la pieza tal cual. Fuera: solo lo que el
fondo se oscurece (la sombra), como negro cálido semitransparente.
uso: cutout.py foto.png mascara.png salida.webp
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, msk, out = sys.argv[1:4]
rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
m = Image.open(msk).convert('L').filter(ImageFilter.GaussianBlur(0.8))
m = np.asarray(m).astype(np.float32) / 255
h, w, _ = rgb.shape
k = w / 720  # los radios están medidos a 720 px de ancho
odd = lambda n: int(n * k) // 2 * 2 + 1
lum = rgb @ [0.299, 0.587, 0.114]
# el fondo generado no es liso (degradados, viñeteo): se ajusta una superficie
# suave (polinomio de grado 3) a los píxeles lejos de la pieza y la sombra es
# solo lo que la imagen se oscurece respecto a esa superficie
# (las dilataciones se hacen a 180 px de ancho: igual a cualquier tamaño y rápidas)
small_size = (180, round(180 * h / w))
far = np.asarray(Image.fromarray((m > 0.02).astype(np.uint8) * 255).resize(small_size).filter(ImageFilter.MaxFilter(11)).resize((w, h))) == 0
yy, xx = np.mgrid[0:h, 0:w]
X, Y = xx / w - 0.5, yy / h - 0.5
terms = [X**i * Y**j for i in range(4) for j in range(4 - i)]
A = np.stack([t[far] for t in terms], 1)
coef = np.linalg.lstsq(A, lum[far], rcond=None)[0]
bgl = sum(c * t for c, t in zip(coef, terms))
shadow = np.clip((bgl - lum) / bgl * 1.6 - 0.035, 0, 0.6)
# lo blanco que Vision no ve (la cinta de la cremallera flotando) es más claro
# que el fondo y neutro, mientras que el fondo es crema (rojo > azul): también es pieza
neutral = np.clip((10 - (rgb[..., 0] - rgb[..., 2])) / 6, 0, 1)
bright = np.clip((lum - bgl - 6) / 10, 0, 1) * neutral
bright = Image.fromarray((bright * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(odd(5)))
m = np.maximum(m, np.asarray(bright).astype(np.float32) / 255)
# la sombra solo vale cerca y por debajo de la pieza: fuera de ahí son restos
# del fondo generado (manchas, degradados)
small = Image.fromarray((m > 0.5).astype(np.uint8) * 255).resize(small_size)
near = small.filter(ImageFilter.MaxFilter(21)).resize((w, h)).filter(ImageFilter.GaussianBlur(8 * k))
near = np.roll(np.asarray(near).astype(np.float32) / 255, round(0.04 * h), axis=0)
shadow *= near
# por si acaso, la sombra se apaga al llegar a los bordes del fotograma
edge = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]) / (0.06 * w)
shadow *= np.clip(edge, 0, 1)
# en el filo, cada píxel mezcla pieza y fondo crema: se le resta el fondo para
# que la pieza no arrastre un halo claro sobre las secciones oscuras
bgcol = np.median(rgb[far], axis=0)
bgrgb = bgcol * (bgl / (bgcol @ [0.299, 0.587, 0.114]))[..., None]
edge_m = np.maximum(m, 0.25)[..., None]
obj = np.clip((rgb - (1 - m)[..., None] * bgrgb) / edge_m, 0, 255)
SH = np.array([40, 32, 22], np.float32)  # tono de la sombra
alpha = m + (1 - m) * shadow
color = (obj * m[..., None] + SH * ((1 - m) * shadow)[..., None]) / np.maximum(alpha, 1e-4)[..., None]
rgba = np.dstack([np.clip(color, 0, 255), alpha * 255]).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(out, quality=88)
