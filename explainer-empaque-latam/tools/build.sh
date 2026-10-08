#!/usr/bin/env bash
# Full re-render: audio -> 4 videos -> captions -> contact sheet. Requires node, ffmpeg, playwright (chromium), python3 + Pillow.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/tmp

node tools/render.mjs audio --out out/tmp/bed_raw.wav
# static gain to ~-16 LUFS integrated (measured: raw mix is -18.67 LUFS)
ffmpeg -hide_banner -loglevel error -y -i out/tmp/bed_raw.wav -af "volume=2.67dB" -c:a pcm_s16le out/tmp/audio.wav

node tools/render.mjs video --fmt 16x9 --audio out/tmp/audio.wav --out out/master_16x9.mp4 &
node tools/render.mjs video --fmt 9x16 --audio out/tmp/audio.wav --out out/cut_9x16.mp4 &
wait
node tools/render.mjs video --fmt 1x1 --audio out/tmp/audio.wav --out out/cut_1x1.mp4 &
node tools/render.mjs video --fmt 16x9 --reduced --audio out/tmp/audio.wav --out out/master_16x9_reduced_motion.mp4 &
wait

node tools/srt.mjs
node tools/render.mjs stills --fmt 16x9 --beats 0.5,7.5,9,14,17,21,25,32,38,41,44,49,52,57,62,69,72,78,84,88,93,100
python3 tools/contact.py stills/16x9 contact.png 640 4
