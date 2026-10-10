# YouTube footage importer (yt-dlp + FFmpeg)

**Optional, permission-gated tool for original or authorised footage.**
Does not modify completed Remotion films. It uses a separate Python dependency;
there is no Node package or Remotion lockfile change.

## Installed components

- yt-dlp **2026.08.19** with its `default` extra (includes `yt-dlp-ejs`).
- Node.js **22** for the YouTube JavaScript challenge runtime. The importer
  explicitly passes `--js-runtimes node` (yt-dlp normally enables Deno only).
- FFmpeg/FFprobe for original-stream container merging, quality metadata, and a full decode check.
- `production/footage/yt_dlp_ingest.py` with video-only URL validation,
  1080p/24fps default quality gates, source SHA-256, and JSON metadata.

**Source-quality policy:** Select yt-dlp's best available source streams.
Remux using FFmpeg if separate tracks need combining, usually MKV. Do NOT
pretend that renaming or upscaling improves resolution. Some source codecs
(e.g. VP9/AV1) and MKV containers may require later **explicit**
transcoding to H.264/AAC MP4 for Remotion's Chromium playback. The original
high-quality source should remain available. Source video is never
transcoded by this importer.

## Run locally

Install Python 3.11+, FFmpeg and Node 22 (or newer supported Node) first.
From repository root:

```bash
python -m pip install -r production/footage/requirements.txt
python -m yt_dlp --version
ffmpeg -version
node --version

python production/footage/yt_dlp_ingest.py fetch \
  --url "https://www.youtube.com/watch?v=YOUR_VIDEO_ID" \
  --output out/footage-import \
  --min-height 1080 \
  --min-fps 24 \
  --max-mb 600 \
  --max-duration 1800 \
  --rights-confirmed
```

Downloads are intentionally **one video per command** (no playlists).
The output includes the original-format video or remuxed MKV, yt-dlp's
`.info.json` source information and an additional `.qa.json` containing
actual dimensions, FPS, codec, filesize, duration and SHA-256. Failed
quality checks return a nonzero exit status instead of silently using low
quality. For older 720p archive footage, specify `--min-height 720` and
evaluate its real quality yourself.

The `--rights-confirmed` switch requires that you own the footage or
have permission to download and use it. Never use this tool to evade DRM,
sign-in restrictions, or copyright protections. YouTube may rate-limit
cloud-hosted GitHub runners; failed extraction doesn't mean footage does
not exist.

### Dry-run to inspect the exact command

```bash
python production/footage/yt_dlp_ingest.py fetch \
  --url "https://youtu.be/dQw4w9WgXcQ" \
  --rights-confirmed --dry-run
```

Dry-run prints the yt-dlp command without contacting YouTube.

## GitHub Actions usage

Workflow: `.github/workflows/youtube-footage-ingest.yml`

- On commits / pull requests: installs official pinned yt-dlp package,
  Node 22, FFmpeg and runs real **offline synthetic video** QA; it does
  **not** download from YouTube just to test the software.
- After the workflow reaches the repository's **default branch**, navigate
  to GitHub **Actions → YouTube footage ingest → Run workflow**, enter one
  video URL, confirm rights and choose minimum height.
- A successful manual run uploads a named artifact containing the retrieved
  source file plus quality/source metadata, with **one-day** retention and
  compression disabled. Download it only if you have permission to use
  the source. Do not treat GitHub Actions artifacts as secure private
  archival storage, especially in a public repository.
- A workflow introduced on a nondefault branch cannot be dispatched
  manually through GitHub UI until that workflow exists on the default
  branch. You can still run the importer locally from the feature branch.

No external authentication cookies, logins, user music or unlicensed
video are supplied to the smoke tests.

## Verify an existing source without yt-dlp or a network connection

```bash
python production/footage/yt_dlp_ingest.py verify \
  --input path/to/authorised-source.mp4 \
  --min-height 1080 --min-fps 24 \
  --manifest out/footage-verification.json
```

## CI tests

```bash
python -m unittest discover -s production/tests -p test_yt_dlp_ingest.py -v
```

The tests exercise URL-allowlisting, rejection of playlist/channel links,
command argument safety, source path confinement, native FFmpeg probe and
strict lower-resolution rejection. Full quality evaluation of actual
YouTube-hosted footage must be repeated on a source the operator is
authorised to acquire; the public synthetic test cannot guarantee
YouTube accessibility.
