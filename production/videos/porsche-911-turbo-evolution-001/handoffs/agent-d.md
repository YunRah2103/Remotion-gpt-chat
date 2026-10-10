# Agent D — Porsche 911 Turbo Evolution 001 master handoff

**Current status: BLOCKED — zero authentic real Porsche Turbo shots in hand.**

## Real integrated source code

- Current integrated master code commit before handoff-only updates:
  `3549043b1668168d2b1c7931f84ff1befba8f06e`.
- Master branch: `automotive-edits/porsche-911-turbo-evolution-001/d-master`.
- A's native FFprobe/FFmpeg source auditor, B's source-validated 510-frame edit,
  and C's restrained chapter effects are merged into the master without
  changing specialist-owned branches.
- The original `yt-dlp` importer, dependency pin, docs and native tests
  were copied **byte-identically** from the merged main branch using a Git
  tree commit `a4f57c19b0fa6c78aa76fe4e37e39821b3115c48`.
- New `integration/ingest_bridge.py` checks downloaded original bytes against
  the official downloader's signed-by-content SHA256 report, requires video
  quality and successful complete decode, and builds an incomplete 30-slot
  Agent A selection template. This import tool cannot assert the Porsche
  Turbo generation, licence or unique camera setup.
- Integration adapter tests with native original synthetic FFmpeg footage
  pass. Deliberate missing media and changed source SHA256 are rejected.
- Private user soundtrack has been supplied separately and verified as
  17.000-second 48kHz stereo PCM24 original master, SHA256
  `39b8d7eef63b1c67cb14108484de8a63508149f64b6d3b84b7f7252dcd0bcdc9`.
  Never upload this original private WAV to public GitHub Actions artifacts.

## Native CI evidence

- [38057166841](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38057166841):
  Passed typed Remotion editor, A/B/C system tests and D's native FFmpeg
  ingestion bridge sample source/checksum QA.
- [38057250242](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38057250242):
  Passed the real **public YouTube metadata/format probe** on GitHub Actions
  against an Agent A source candidate. This accessed format metadata only;
  **no footage bytes were downloaded**.
- Pinned imported yt-dlp code matches the exact upstream
  `production/footage/yt_dlp_ingest.py` blob SHA
  `56f23df2af45cb9accb48d114999f1c807fa0a62`.
- A real Porsche clip is **not** contained in the GitHub diagnostic frame
  artifact. Native QA of synthetic proof must not be reported as media approval.

## Next actual production action

For each specifically authorised video source, use the manual downloader
on main [YouTube footage ingest](https://github.com/YunRah2103/Remotion-gpt-chat/actions/workflows/youtube-footage-ingest.yml).
GitHub Actions requires an operator to enter the source URL and explicitly
confirm rights to download and use that video. This session's connector
does not provide a workflow-dispatch write action; it cannot honestly
claim a live download occurred.

**Be careful:** artifacts in the public repo are not guaranteed private.
Arrange an access-controlled media transfer when rights/permissions permit.
Place source videos and `*.qa.json` reports together and follow
`integration/YTDLP_HANDOFF.md`. A must manually identify and audit 30
different authentic Turbo/Turbo S coupe moving shots in correct chronological
chapters. Run Agent A's full native 30-slot contact-sheet audit and review
every moving beat.

Then D can stage private original sources, map B's source adapter, use C's
restrained effects and actual video-quality approval, render 510 frames
1080x1920 @30fps H264 CRF16, stream-copy video while muxing the user's
private 48kHz soundtrack to stereo AAC and verify complete FFmpeg decode.

**Do not claim final delivery until the real MP4 exists and has been watched.**
