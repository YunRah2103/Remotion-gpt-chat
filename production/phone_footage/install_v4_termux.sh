#!/data/data/com.termux/files/usr/bin/bash
# Safe V4 updater. Proven V1/V2 workers and private token remain unchanged.
set -euo pipefail
umask 077
REPO="YunRah2103/Remotion-gpt-chat"
BRANCH="experiments/s25-footage-worker-v4-10min-20261012"
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH/production/phone_footage"
ROOT="$HOME/.local/share"
TARGET="$ROOT/yunex-v4"
STAGE="$ROOT/.yunex-v4-stage-$$"
BACKUP="$ROOT/.yunex-v4-backup"
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
    echo "[YUNEX] Existing GitHub token not found; leaving all installations untouched."
    exit 1
fi
# Never replace Python modules while a footage job is running. This uses the
# same advisory lock as the worker, with no new Termux dependencies.
python - "$HOME/.cache/yunex-phone-worker.lock" <<'PY'
import fcntl, os, sys
lock = sys.argv[1]
os.makedirs(os.path.dirname(lock), exist_ok=True)
with open(lock, "a+") as handle:
    try:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("[YUNEX] V4 is still running. Stop the loop with Ctrl+C, then re-run the updater.")
        sys.exit(2)
PY
mkdir -m 700 "$STAGE"
for filename in v4_worker.py sources_v3.json agent_jobs_v4.py; do
    curl --fail --location --silent --show-error "$RAW/$filename" -o "$STAGE/$filename"
done
python -m py_compile "$STAGE/v4_worker.py" "$STAGE/agent_jobs_v4.py"
python - "$STAGE" <<'PY'
import importlib.util, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
with (root / "sources_v3.json").open() as handle:
    data = json.load(handle)
assert data and all(x.get("approved") is True and
                    x.get("reviewed_by") == "YunRah2103" for x in data.values())
spec = importlib.util.spec_from_file_location("staged_v4", root / "v4_worker.py")
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
def accepted(media):
    body = worker.MARKER + "\n" + json.dumps({
        "url": "https://www.youtube.com/watch?v=Exq6pB3IGyU",
        "start": 0, "duration": 6, "height": 1080, "media": media})
    return worker.parse_job({"body": body})
assert accepted("video") and accepted("audio")
print("[YUNEX] Staged V4 verified: video, audio and optional source registry")
PY
if [ -d "$BACKUP" ]; then rm -rf "$BACKUP"; fi
if [ -d "$TARGET" ]; then mv "$TARGET" "$BACKUP"; fi
if ! mv "$STAGE" "$TARGET"; then
    echo "[YUNEX] Update failed; restoring previous worker." >&2
    if [ -d "$BACKUP" ]; then mv "$BACKUP" "$TARGET"; fi
    exit 1
fi
trap - EXIT
cat > "$HOME/yunex-v4" <<'SH'
#!/data/data/com.termux/files/usr/bin/bash
exec python "$HOME/.local/share/yunex-v4/v4_worker.py" "$@"
SH
chmod 700 "$HOME/yunex-v4"
echo "[YUNEX] V4 updated; existing token and V1/V2/V3 preserved."
"$HOME/yunex-v4" --doctor
if [ "$#" -gt 0 ] && [ "$1" = "--once" ]; then
    "$HOME/yunex-v4" --once
elif [ "$#" -gt 0 ] && [ "$1" = "--loop" ]; then
    "$HOME/yunex-v4" --loop
else
    echo "[YUNEX] Check queue: ~/yunex-v4 --once"
    echo "[YUNEX] Poll queue: ~/yunex-v4 --loop"
fi
