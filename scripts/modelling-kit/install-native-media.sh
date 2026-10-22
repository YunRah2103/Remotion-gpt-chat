#!/usr/bin/env bash
# GitHub's ephemeral Ubuntu runners only. Keep mandatory real-media checks enabled.
set -euo pipefail
if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  # HTTP Azure mirror retries stalled recovered jobs for over twenty minutes.
  # Use Ubuntu's official HTTPS archive, retaining suites/components/signature checks.
  sudo python3 scripts/modelling-kit/native_media_sources.py
  options=(-o Acquire::Retries=2 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20)
  timeout 5m sudo apt-get "${options[@]}" update
  timeout 8m sudo apt-get "${options[@]}" install --no-install-recommends -y ffmpeg
fi
ffmpeg -version
ffprobe -version
