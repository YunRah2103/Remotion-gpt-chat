#!/usr/bin/env bash
# GitHub's ephemeral Ubuntu runners only. Keep mandatory real-media checks enabled.
set -euo pipefail
if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  # HTTP Azure mirror retries stalled recovered jobs for over twenty minutes.
  # Use Ubuntu's official HTTPS archive, retaining suites/components/signature checks.
  sudo python3 - <<'PY'
from pathlib import Path
paths=[Path('/etc/apt/sources.list'),*Path('/etc/apt/sources.list.d').glob('*.sources'),*Path('/etc/apt/sources.list.d').glob('*.list')]
for path in paths:
    if not path.is_file():
        continue
    original=path.read_text()
    changed=original.replace('http://azure.archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu').replace('http://archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu').replace('http://security.ubuntu.com/ubuntu','https://security.ubuntu.com/ubuntu')
    if changed!=original:
        path.write_text(changed)
PY
  options=(-o Acquire::Retries=2 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20)
  sudo apt-get "${options[@]}" update
  sudo apt-get "${options[@]}" install --no-install-recommends -y ffmpeg
fi
ffmpeg -version
ffprobe -version
