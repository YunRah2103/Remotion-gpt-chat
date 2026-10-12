# French Legends — Agent D Audio and Delivery

## Locked input and current status

This branch implements the real original-song integration and QA pipeline. The actual original soundtrack was recovered from the user's ChatGPT Library. Its SHA256 is **2334fc7c70a4320faf1b137b97ec9e2899ed325e01cc1fb954733a21d802ec55** (60.000 seconds, AAC 44.1 kHz stereo). Do NOT publish the source soundtrack to this public repository.

The final edit is BLOCKED until Agent C delivers and confirms their 60-second 1920x1080 H.264 muted edit and shotmap. Source media: combined 42-clip [GitHub artifact 11713925779](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38169392715/artifacts/11713925779), not the old separated A/B packages. Source archive expiry 25 Oct 2026 19:46 UTC.

## How to execute

Install Python, FFmpeg and FFprobe. Optional packages: numpy (audio synchronization cross-correlation), Pillow (combined frame proof contact sheet).

Run from repository root:

    python3 production/videos/french-icons-001/agent-d/finalize.py --song "/private/source/sir..  [7623017441160891681].m4a" --out-dir /private/output/fr-legends-d

Without C video this generates an actual playable **60-second, 48 kHz stereo, 256 kbps AAC original-song audio master**, cue-sheet-and-qa.json and an explicit BLOCKED_WAITING_ON_AGENT_C_APPROVED_VIDEO status. This is NOT a final visual film.

When a real, technically valid C render and optional shotmap have arrived:

    python3 production/videos/french-icons-001/agent-d/finalize.py --song "/private/source/sir..  [7623017441160891681].m4a" --c-video /private/agent-c/approved-muted.mp4 --shotmap /private/agent-c/shotmap.json --out-dir /private/output/fr-legends-d

The script fails closed if the original song's SHA does not match, or if C's video is not H.264 yuv420p 1920x1080 30fps with exactly 1800 decoded frames over 60 seconds. It does not silently generate a fake replacement. Existing H.264 picture is stream-copied, avoiding a second generation of lossy encoding. Music starts at zero, runs to second 60, is not looped, rearranged or time-shifted. There is a documented -1 dB safety gain. No untethered engine sounds are added without real approved recording and shot-specific cues.

Actual finished MP4 QA includes re-probing duration, codecs, dimensions, sample rate and decoded frames; detecting black/silent intervals and integrated loudness; producing actual source-derived output SHA and decoded opening/closing, per-shot and transition frames; and comparing waveform synchronization at three different times against the exact user track. E must still independently review the final actual movie end-to-end and clear rights before publication.

## Exact verified audio evidence — 12 Oct 2026

- Original: 60.000s AAC 44.1k stereo, SHA256 2334fc7c70a4320faf1b137b97ec9e2899ed325e01cc1fb954733a21d802ec55.
- Prepared music-only master: 60.000s 48k stereo AAC, SHA256 f5d7dced2f6a6066ba6a303167f2cb094590dd7407aa45efe1a7a09068e87c42.
- Output sample peak -0.9 dBFS; mean -12.2 dBFS.
- Original song waveform matches at 2/30/49 seconds: correlation 0.99956/0.99960/0.99974, zero detected lag.
- Agent C full visual edit not yet on their branch as of this report: **no final MP4 exists**. This is a precise handoff, not a claim of finished film.

No media is committed to this public repo. GitHub connector cannot transfer the 672MB source archive due to its 512MiB file-download cap; a runner-side artifact download would be required for cloud integration. Creative intent: graceful, nostalgic French car heritage; original French vocals in the foreground; no aggressive GT3-style audio.
