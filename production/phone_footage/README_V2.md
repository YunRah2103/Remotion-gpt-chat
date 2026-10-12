# YUNEX S25 worker V2 — reviewed experiment (not installed on phone)

Branch: `experiments/s25-footage-worker-v2-20261012`. Original successful V1 remains `experiments/s25-autonomous-footage-worker-20261012`; **no change to running Termux software** unless you explicitly install or update the script.

## Changes from proven V1
- Sources stored in `approved_sources.json` rather than hardcoded in Python. Additional URLs require explicit review, verifiable rights, accurate author/license and a commit; **GitHub Issue assertions alone do not confer authorization**.
- Backward compatible V1 job: `YUNEX_PHONE_JOB_V1\n{"url":"...","seconds":6,"license":"CC-BY-3.0"}` defaults to `height=720`.
- V2 pilot optional `"height":1080` **only** when the registry authorizes 1080. The issue must begin with the distinct `YUNEX_PHONE_JOB_V2` marker so the old V1 script ignores it. V2 continues accepting V1-format 720p jobs. The car-in-snow Creative Commons sample is presently authorized for a **test attempt**, not shown to actually offer 1080p on YouTube. Requesting 1080p fails rather than falling back to mislabeled 720p if source lacks 1080 frames.
- Input media probed before transcode; output resolution checked; entire video decoded with FFmpeg rather than first four seconds.
- Local Termux advisory lock prevents multiple phone shells competing for the same job. Worker checks release tag before uploading again, preventing accidental duplicate GitHub release writes.
- Preserves limits: owner-only Issues, verified CC BY catalog, six seconds per job, max 1080p, 30 MiB and a public GitHub prerelease. No unapproved large batches/HDR/movie footage supported.

## Validation
GitHub Actions offline tests validate registry, height gate, source checks and real H264 encoding. **These tests do not prove 1080p YouTube extraction on the phone.** No new physical-phone download has been attempted by this branch alone.

## Pilot
For the authorised 1080p trial, the Issue body must be exactly:

```text
YUNEX_PHONE_JOB_V2
{"url":"https://www.youtube.com/watch?v=DqiKOr1aS9w","seconds":6,"license":"CC-BY-3.0","height":1080}
```

The original V1 worker ignores this different marker. **Never post a 1080p request with the V1 marker**, or V1 could accept the old job and download only 720p.

Once cloud tests pass: run one 720p V1 backward-compatibility check if needed, then issue a CC BY car clip test with `"height":1080` from an approved source, **while using the V2 script on the phone**. Check Issue completion comment, GitHub Release asset, real dimensions, full frame decode and checksum. If 1080p unavailable, report failure and find a different licensed source. Do not claim 1080 success just because an offline synthetic test passes.

## Android manual upgrade (only after review)
Already installed V1 token remains in `~/.config/yunex/github-token`; NEVER paste it in a chat. To install V2, fetch `production/phone_footage/worker.py` from this branch into `~/yunex-phone-worker.py` and ALSO put `approved_sources.json` alongside it in the same Termux directory (registry lookup is sibling of script). Old V1 setup still exists on its own branch. V2's setup script fetches only Python script — so use the manual two-file commands below:

```bash
BASE='https://raw.githubusercontent.com/YunRah2103/Remotion-gpt-chat/experiments/s25-footage-worker-v2-20261012/production/phone_footage'
curl -fLsS "$BASE/worker.py" -o ~/yunex-phone-worker-v2.py
curl -fLsS "$BASE/approved_sources.json" -o ~/approved_sources.json
python ~/yunex-phone-worker-v2.py --doctor
python ~/yunex-phone-worker-v2.py --once --dry-run
```

The new pilot script stays a **different filename** from the working V1, so experimenting cannot silently break V1. Run `--once` only when an authorized job has been prepared and you choose to test.

## Known limits
No HDR, 4K, arbitrary YouTube source, licence bypass or locked-screen unattended guarantee. The lock protects one phone, not a cluster of devices. Release tag conflict protection guards completed tags, but not simultaneous separate phones. Preserve public-release copyright restrictions and only schedule footage that has actual reuse permission. Do not use protected 2013 DreamWorks Turbo movie clips through this CC BY test workflow.
