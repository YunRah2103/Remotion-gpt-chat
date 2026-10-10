# Porsche Turbo 001 — yt-dlp to Agent A to Agent D handoff

This production bridge is installed on D's branch. It **does not claim** downloads
have already occurred. The successful main-branch yt-dlp CI runs are OFFLINE
synthetic footage tests and do not demonstrate real YouTube download access.

## Step 1: obtain individual authorised ORIGINAL moving source files

The public repository's default branch (`main`) contains:
`.github/workflows/youtube-footage-ingest.yml` and
`production/footage/yt_dlp_ingest.py`. The downloader and workflow have
passed their main-branch offline test:
https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38056857575

For a video you own or have permission to download, the repository operator
may use **GitHub > Actions > YouTube footage ingest > Run workflow**, enter
a single video URL, confirm rights and choose a minimum native resolution.
One run downloads **one** source video and emits a short-retention archive.
YouTube bot/rate-limit/region restrictions may still cause failures.
No DRM/sign-in bypass, browser-cookies transfer, or false copyright permission.
Public repository artifacts should NOT be assumed private: secure source
delivery must be arranged separately before uploading third-party footage.

Agent A has identified research candidates in
`production/videos/porsche-911-turbo-evolution-001/footage/source-candidates.json`.
The page URLs are not content licences. A sourced documentary may contain
multiple cars, static interviews and repeated camera angles. Even a 4K file
does not establish a unique moving Porsche Turbo shot.

## Step 2: import original files without any extra video encoding

Extract each permitted authorized-download artifact into a **private local**
folder. The source video (MP4/MKV/etc) must sit next to its `*.qa.json`
report. The report must contain a passing actual native full decode plus
original byte SHA256 matching the file. On the private render worker run:

```bash
python production/videos/porsche-911-turbo-evolution-001/integration/ingest_bridge.py \
  --import-root PRIVATE/downloads/source-1 \
  --import-root PRIVATE/downloads/source-2 \
  --beat-map production/videos/porsche-911-turbo-evolution-001/beat-map.json \
  --inventory-output PRIVATE/porsche-source-inventory.json \
  --selection-output PRIVATE/shot-manifest.working.json
```

The bridge checks authenticity of **source file bytes and ingestion reports
only**. It does not infer identities, permissions, source framing or 30 shots.
Its 30-entry selection template is deliberately incomplete and **BLOCKED**.

## Step 3: Agent A chooses and audits 30 genuine shots

Agent A must watch original sources and record **30 actually different moving
setups**, four 930, four 964, four 993, four 996, four 997, five 991, five
992; only the genuine Turbo/Turbo S coupe of each generation. For every slot,
fill source URL, creator, rights status, verified identity, source SHA256,
source in/out timecodes, visual motion evidence and unique camera shot key.
Consult `footage/AUDIT_README.md`. Run:

```bash
python production/videos/porsche-911-turbo-evolution-001/footage/audit_footage.py \
  --manifest PRIVATE/shot-manifest.working.json \
  --source-root PRIVATE/originals \
  --beat-map production/videos/porsche-911-turbo-evolution-001/beat-map.json \
  --output PRIVATE/audit-proof
```

Review each native JPEG, full original clip and 30-slot contact sheet. The
validator only checks motion heuristics, which cannot prove vehicle identity
or actual camera uniqueness. Do not infer permission from a public URL.

## Step 4: B/C/D footage-backed native master

Map A's verified source metadata to B's typed production props using
`src/porsche-turbo-evolution/edit/timeline.ts`. The user-approved 17-second
48kHz original WAV is stored **privately** in the user's editor pack.
Keep all original video and WAV out of public GitHub history.

D must inspect real 7-era moving proof at frames 0,70,138,208,280,355,460,
plus 24–60 and 420–485 moving windows. Use B's clean cuts and C's minimal
chapter effects. Then render 510 frames at 1080x1920/30fps/H264 CRF16 and
mux the audio with `-c:v copy -c:a aac -b:a 320k`. Full-pass verify the
result with `integration/verify_master.py`, inspect every beat and release
only a playable private MP4.

**Current status:** Pipeline code present, but **zero actual Porsche Turbo
footage files have been delivered**, so the finished movie remains blocked.
