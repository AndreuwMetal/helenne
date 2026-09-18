"""Saca de un vídeo de giro una vuelta completa, siempre en el mismo sentido.

Los vídeos generados no garantizan un giro limpio: a veces aceleran, se
paran o dan marcha atrás para volver a la postura del principio. Aquí se mide
hacia dónde se mueve la tela entre fotogramas (correlación de fase en la franja
central), se toma el tramo más largo que va siempre hacia el mismo lado y,
dentro de él, la vuelta que acaba donde empezó. Si la tela se mueve hacia la
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
    ['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H},format=gray,gblur=sigma=3', '-f', 'rawvideo', '-'],
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
# ruido: los saltos grandes de un solo fotograma son el patrón de la tela, no giro
# (por eso además se mide desenfocado: con cuadros o rayas, el patrón se repite)
# y solo cuenta un cambio de sentido que dure: suma móvil de 9 fotogramas
moving = np.convolve(np.clip(dxs, -12, 12), np.ones(9), 'same')
steps = np.where(np.abs(moving) > 3, np.sign(moving), 0)

# el tramo más largo en el que la tela no va hacia el otro lado
best = (0, 0, 1)
for sign in (1, -1):
    start = 0
    for i, st in enumerate(list(steps) + [-sign]):
        if st == -sign:
            if i - start > best[1] - best[0]:
                best = (start, i, sign)
            start = i + 1
lo, hi, sign = best

# dentro del tramo, la pareja de fotogramas más parecida que esté lo bastante
# separada como para ser una vuelta entera (el giro no para ni se repite antes)
small = frames[:, ::6, ::6]
span = hi - lo
cands = []
for s0 in range(lo, lo + max(1, span // 4)):
    for e in range(s0 + int(span * 0.55), hi + 1):
        cands.append((np.mean(np.abs(small[s0] - small[e])), s0, e))
if not cands:
    sys.exit(f'no hay una vuelta en un solo sentido (el tramo más largo es {lo}–{hi}); hay que regenerar el vídeo')
score, start, end = min(cands)
print(f'{len(frames)} fotogramas, tramo en un solo sentido {lo}–{hi}, '
      f'sentido {"derecha" if sign > 0 else "izquierda"}, vuelta en {start}–{end} (parecido: {score:.1f})')

# el bucle se cierra, así que puede empezar en cualquier fotograma: se empieza
# en la postura más parecida a la del principio del vídeo (la de la foto de
# producto), que es la que se ve en reposo
k = start + int(np.argmin([np.mean(np.abs(small[0] - small[i])) for i in range(start, end)]))
graph = (f'[0]trim=start_frame={k}:end_frame={end},setpts=PTS-STARTPTS[a];'
         f'[0]trim=start_frame={start}:end_frame={k},setpts=PTS-STARTPTS[b];'
         f'[a][b]concat=n=2' + (',reverse' if sign < 0 else ''))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', graph, '-an', '-c:v', 'libx264', '-crf', '12', dst], check=True)
print(f'{(end - start) / fps:.2f} s en {dst}, empezando en el fotograma {k}')
