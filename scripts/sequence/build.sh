#!/usr/bin/env bash
# Convierte un vídeo de la pieza sobre fondo liso en fotogramas con
# transparencia y sombra, listos para public/seq/<pieza>/<tramo>/.
#
#   scripts/sequence/build.sh <video.mp4> <salida> [fotogramas] [ancho]
#
# Requiere macOS (Vision recorta la pieza), ffmpeg y uv.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
video=$1 out=$2 count=${3:-72} width=${4:-720}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

[ -x "$here/.mask" ] || swiftc -O "$here/mask.swift" -o "$here/.mask"

# fotogramas repartidos por todo el vídeo, al ancho pedido
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$video")
ffmpeg -v error -i "$video" -vf "fps=$count/$dur,scale=$width:-2:flags=lanczos" -frames:v "$count" "$tmp/%03d.png"

mkdir -p "$out"
for f in "$tmp"/*.png; do
  n=$(printf '%03d' $(( 10#$(basename "$f" .png) - 1 )))
  "$here/.mask" "$f" "$tmp/m.png"
  uv run -q --with numpy --with pillow "$here/cutout.py" "$f" "$tmp/m.png" "$out/$n.webp" >/dev/null
done
echo "$(ls "$out" | wc -l | tr -d ' ') fotogramas en $out"
