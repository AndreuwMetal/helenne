#!/usr/bin/env bash
# Giro de una pieza de principio a fin: una vuelta en un solo sentido y sus
# fotogramas a 720 y 1280 px en public/seq/<pieza>/.
#
#   scripts/sequence/piece.sh <pieza> <giro.mp4> [fotogramas]
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
slug=$1 video=$2 count=${3:-96}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
uv run -q --with numpy "$here/revolution.py" "$video" "$tmp/vuelta.mp4"
for w in 720 1280; do
  rm -rf "public/seq/$slug/$w/turn"
  "$here/build.sh" "$tmp/vuelta.mp4" "public/seq/$slug/$w/turn" "$count" "$w"
done
