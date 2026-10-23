#!/usr/bin/env bash
# GitHub's ephemeral Ubuntu runners only. Keep mandatory real-media checks enabled.
set -euo pipefail
retry_native_media() {
  local attempts=$1 status=1 attempt
  shift
  for ((attempt=1; attempt<=attempts; attempt++)); do
    if "$@"; then return 0; else status=$?; fi
    echo "Native media dependency attempt $attempt/$attempts failed ($status)" >&2
  done
  return "$status"
}
install_native_media() {
  if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
    sudo python3 scripts/modelling-kit/native_media_sources.py
    local options=(-o Acquire::Retries=2 -o Acquire::By-Hash=force -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20)
    retry_native_media 2 timeout 5m sudo apt-get "${options[@]}" update
    # Keep verified downloaded archives between bounded attempts.
    retry_native_media 2 timeout 8m sudo apt-get "${options[@]}" install --no-install-recommends -y ffmpeg
  fi
  ffmpeg -version
  ffprobe -version
}
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then install_native_media; fi
