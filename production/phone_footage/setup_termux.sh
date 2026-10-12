#!/data/data/com.termux/files/usr/bin/bash
# YUNEX S25 phone worker, official Termux packages.
# This script never prints your GitHub token and does not post jobs itself.
set -euo pipefail
REPO="YunRah2103/Remotion-gpt-chat"
BRANCH="experiments/s25-footage-worker-v2-20261012"
echo "[YUNEX] Installing official yt-dlp, Node.js and FFmpeg for Android..."
pkg update -y
pkg install -y python python-pip nodejs ffmpeg curl
python -m pip install -U "yt-dlp[default]"
mkdir -p "$HOME/.config/yunex"
chmod 700 "$HOME/.config/yunex"
TOKEN_FILE="$HOME/.config/yunex/github-token"
if [ ! -s "$TOKEN_FILE" ]; then
  echo
  echo "Paste a fine-grained GitHub token for ONLY $REPO."
  echo "Permissions: Issues read/write + Contents read/write."
  echo "It will be stored locally on your phone, never committed or printed."
  read -r -s -p "GitHub access token: " YUNEX_PERSONAL_TOKEN
  echo
  if [ -z "$YUNEX_PERSONAL_TOKEN" ]; then
    echo "No token supplied; exiting without enabling worker."
    exit 1
  fi
  umask 077
  printf '%s' "$YUNEX_PERSONAL_TOKEN" > "$TOKEN_FILE"
  unset YUNEX_PERSONAL_TOKEN
  chmod 600 "$TOKEN_FILE"
fi
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH/production/phone_footage"
curl --fail --location --silent --show-error "$RAW/worker.py" -o "$HOME/yunex-phone-worker-v2.py"
curl --fail --location --silent --show-error "$RAW/approved_sources.json" -o "$HOME/approved_sources.json"
echo "[YUNEX] Checking V2 prerequisites; this does NOT replace your working V1 script..."
python "$HOME/yunex-phone-worker-v2.py" --doctor
echo "[YUNEX] V2 staged for manual pilot; no phone downloads started."
echo "Check authorised queue without side effects: python ~/yunex-phone-worker-v2.py --once --dry-run"
echo "When pilot job is approved, run once: python ~/yunex-phone-worker-v2.py --once"
echo "For continued queue checks after validating: python ~/yunex-phone-worker-v2.py --loop"
echo "Leave Termux running; Samsung battery management may pause background workers."
