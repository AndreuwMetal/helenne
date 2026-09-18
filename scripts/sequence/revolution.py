"""Saca de un vídeo de giro una vuelta completa, siempre en el mismo sentido.

Los vídeos generados no garantizan un giro limpio: a veces aceleran, se
paran o dan marcha atrás para volver a la postura del principio. Aquí se mide
hacia dónde se mueve la tela entre fotogramas (correlación de fase en la franja
central), se busca el fotograma que vuelve a parecerse al primero sin que el
sentido haya cambiado y se recorta esa vuelta. Si la tela se mueve hacia la
izquierda, se invierte: en la web, arrastrar a la derecha tiene que mover la
cara de delante hacia la derecha.

uso: revolution.py <giro.mp4> <salida.mp4>
"""
import subprocess
import sys

import numpy as np

src, dst = sys.argv[1:3]
W, H = 480, 270
probe = subprocess.run(
    ['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', src],
    capture_output=True, text=True, check=True,
).stdout.strip()
num, den = map(int, probe.split('/'))
fps = num / den
raw = subprocess.run(
    ['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'],
    capture_output=True, check=True,
).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
band = frames[:, int(H * 0.35):int(H * 0.65), int(W * 0.25):int(W * 0.75)]
win = np.hanning(band.shape[2])[None, :]


def shift(a, b):
    fa = np.fft.fft2((a - a.mean()) * win)
    fb = np.fft.fft2((b - b.mean()) * win)
    cross = fa * fb.conj()
    r = np.fft.ifft2(cross / (np.abs(cross) + 1e-6)).real
    dx = np.unravel_index(r.argmax(), r.shape)[1]
    return -(dx - r.shape[1] if dx > r.shape[1] // 2 else dx)


dxs = np.array([shift(a, b) for a, b in zip(band[:-1], band[1:])])
sign = 1 if np.median(dxs) > 0 else -1
# el giro sigue siendo bueno mientras nada vaya claramente al revés
# (los saltos grandes de un solo fotograma son el patrón de las rayas, no giro)
against = [i for i, d in enumerate(dxs) if d * sign < -2 and abs(d) < 20]
usable = against[0] if against else len(dxs)

small = frames[:, ::6, ::6]
diff = np.array([np.mean(np.abs(small[0] - f)) for f in small])
lo = int(len(frames) * 0.3)
if usable <= lo:
    sys.exit(f'no hay una vuelta en un solo sentido (cambia en el fotograma {usable}); hay que regenerar el vídeo')
end = lo + int(np.argmin(diff[lo:usable + 1]))
print(f'{len(frames)} fotogramas, sentido {"derecha" if sign > 0 else "izquierda"}, '
      f'vuelta completa en 0–{end} (parecido al primero: {diff[end]:.1f})')

vf = f'trim=end_frame={end},setpts=PTS-STARTPTS' + (',reverse' if sign < 0 else '')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '12', dst], check=True)
print(f'{end / fps:.2f} s en {dst}')
