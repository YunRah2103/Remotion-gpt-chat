#!/data/data/com.termux/files/usr/bin/bash
# YUNEX S25 phone worker, official Termux packages.
# This script never prints your GitHub token and does not post jobs itself.
set -euo pipefail
REPO="YunRah2103/Remotion-gpt-chat"
BRANCH="experiments/s25-autonomous-footage-worker-20261012"
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
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH/production/phone_footage/worker.py"
curl --fail --location --silent --show-error "$RAW" -o "$HOME/yunex-phone-worker.py"
echo "[YUNEX] Checking local prerequisites..."
python "$HOME/yunex-phone-worker.py" --doctor
echo "[YUNEX] Launching the queued 6-second YouTube phone test automatically..."
python "$HOME/yunex-phone-worker.py" --once
echo
echo "Ready. To check queue once: python ~/yunex-phone-worker.py --once"
echo "To leave agent worker active: python ~/yunex-phone-worker.py --loop"
echo "Leave Termux running; Samsung battery management may pause background workers."
