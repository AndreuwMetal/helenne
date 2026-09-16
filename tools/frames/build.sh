#!/usr/bin/env bash
# Genera las secuencias de giro de assets/frames/<modelo>/ a partir de los vídeos.
# Requisitos: macOS 14+ (Vision), ffmpeg, jq, uv.
# uso: tools/frames/build.sh [modelo ...]     (sin argumentos: todos)
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
here="$root/tools/frames"
conf="$here/products.json"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

swiftc -O "$here/cutout.swift" -o "$work/cutout"

fps=$(jq -r .fps "$conf")
size="$(jq -r '"\(.width)x\(.height)"' "$conf")"
models=("$@")
[ ${#models[@]} -eq 0 ] && models=($(jq -r '.products | keys[]' "$conf"))

for m in "${models[@]}"; do
  video="$root/$(jq -r ".products.$m.video" "$conf")"
  segs=()
  i=0
  while read -r a b; do
    d="$work/$m/seg$i"
    mkdir -p "$d/in" "$d/cut"
    ffmpeg -nostdin -v error -y -ss "$a" -to "$b" -i "$video" -vf "fps=$fps" "$d/in/%04d.png"
    "$work/cutout" "$d/in" "$d/cut" >/dev/null </dev/null
    segs+=("$d/cut")
    i=$((i + 1))
  done < <(jq -r ".products.$m.segments[] | \"\(.[0]) \(.[1])\"" "$conf")

  out="$root/assets/frames/$m"
  rm -rf "$out"
  uv run -q "$here/matte.py" "${segs[@]}" --out "$out" --size "$size"
done
