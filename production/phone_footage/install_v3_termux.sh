#!/data/data/com.termux/files/usr/bin/bash
# Safe V3 updater. Proven V1/V2 workers and private token remain unchanged.
set -euo pipefail
umask 077
REPO="YunRah2103/Remotion-gpt-chat"
BRANCH="experiments/s25-footage-worker-v3-20261012"
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH/production/phone_footage"
ROOT="$HOME/.local/share"
TARGET="$ROOT/yunex-v3"
STAGE="$ROOT/.yunex-v3-stage-$$"
BACKUP="$ROOT/.yunex-v3-backup"
mkdir -p "$ROOT"
trap 'rm -rf "$STAGE"' EXIT
if ! command -v python >/dev/null || ! command -v ffmpeg >/dev/null || ! command -v node >/dev/null; then
    echo "[YUNEX] Installing prerequisites..."
    pkg install -y python python-pip nodejs ffmpeg curl
fi
if ! python -m yt_dlp --version >/dev/null 2>&1; then
    echo "[YUNEX] Installing yt-dlp..."
    python -m pip install -U "yt-dlp[default]"
fi
if [ ! -s "$HOME/.config/yunex/github-token" ]; then
    echo "[YUNEX] Stored GitHub token missing. Run the original V1 setup first."
    exit 1
fi
mkdir -m 700 "$STAGE"
for filename in v3_worker.py sources_v3.json agent_jobs_v3.py; do
    curl --fail --location --silent --show-error "$RAW/$filename" -o "$STAGE/$filename"
done
python -m py_compile "$STAGE/v3_worker.py" "$STAGE/agent_jobs_v3.py"
python - "$STAGE/sources_v3.json" <<'PY'
import json,sys
with open(sys.argv[1]) as handle:
    data=json.load(handle)
assert data and all(x.get("approved") is True and
                    x.get("reviewed_by") == "YunRah2103" for x in data.values())
print("[YUNEX] Reviewed source catalog parsed")
PY
if [ -d "$BACKUP" ]; then rm -rf "$BACKUP"; fi
if [ -d "$TARGET" ]; then mv "$TARGET" "$BACKUP"; fi
mv "$STAGE" "$TARGET"
trap - EXIT
cat > "$HOME/yunex-v3" <<'SH'
#!/data/data/com.termux/files/usr/bin/bash
exec python "$HOME/.local/share/yunex-v3/v3_worker.py" "$@"
SH
chmod 700 "$HOME/yunex-v3"
echo "[YUNEX] V3 installed without changing V1 or V2."
"$HOME/yunex-v3" --doctor
if [ "$#" -gt 0 ] && [ "$1" = "--once" ]; then
    "$HOME/yunex-v3" --once
elif [ "$#" -gt 0 ] && [ "$1" = "--loop" ]; then
    "$HOME/yunex-v3" --loop
else
    echo "[YUNEX] Check queue: ~/yunex-v3 --once"
    echo "[YUNEX] Poll queue: ~/yunex-v3 --loop"
fi
