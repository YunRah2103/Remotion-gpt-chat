---
name: yunex-v4-footage
description: Use for YUNEX automotive video/audio sourcing, Galaxy S25 Termux V4 YouTube phone jobs, GitHub private draft footage, importing real MP4/M4A assets, or handing verified footage to editors. Reuse existing assets and actions; do not ask the user to upload or reinstall things already working.
---

# YUNEX V4 — agent workflow

**Start here:** [60-second new-agent quick-start](../../../docs/YUNEX_V4_NEW_AGENT_START_HERE.md).
**Protocol reference:** [full agent guide](../../../docs/YUNEX_S25_V4_AGENT_GUIDE.md).
**Canonical repo:** `YunRah2103/Remotion-gpt-chat`, **not** `yunus-video-lab`.
**Working worker branch:** `experiments/s25-footage-worker-v4-10min-20261012` (do not assume the phone has the latest commit).
**Already-installed S25:** Do **not** reinstall/rewrite V4 or ask for tokens, Termux commands or media uploads unless a specific new phone job cannot proceed otherwise.

## Decide your role first

| If you are… | Your next action | Done when… |
| --- | --- | --- |
| **Editing video or mixing engine sound** | **Search for an existing completed V4 issue and import it** with `.github/actions/yunex-v4-import` in your **own Actions editing job** | You have the *real bytes*, inspected usable content and produced a tested new edit |
| **Searching for footage** | Check existing Releases/artifacts and legitimate direct creator MP4s; use V4 for YouTube sources only if necessary | You supply new playable source footage, checksums, framing and exact timecodes |
| **Submitting a new phone download** | Generate a valid owner-authored V4 issue using the source-branch job helper | A genuine phone `YUNEX_PHONE_DONE_V4` and downloadable draft/public asset exist |
| **Diagnosing access failures** | Use the proven reusable import action; check workflow permissions and job number | A real `asset_path` on the editing runner passes SHA256 + full FFmpeg decode |
| **Maintaining the worker** | **Only if explicitly assigned**: use the V4 implementation branch, tests and safe updater | CI passes; do not claim the phone process updated or restarted itself |

## 1. Already completed job? Import; don't reacquire.

First inspect GitHub issues/Release assets for the assignment. Proof examples:

- [#55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55): approved YouTube test, verified phone-acquired 1080p MP4.
- [#56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56): real 60-second AutoTopNL RS6 1080p phone recording, **owner-only draft**. The asset exists even though `mp4_url` is `null` (public link unavailable).
- [Import action smoke test PASS](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38470166071): private #56 recovered and SHA256 + full-decoded on GitHub Actions.

**Use the shared action**, not your own downloader or a request for the user's attachment. In your existing editing workflow:

```yaml
permissions:
  contents: write # proven requirement to read this repo's draft Releases
  issues: read
jobs:
  edit:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - id: phone
        uses: YunRah2103/Remotion-gpt-chat/.github/actions/yunex-v4-import@main
        with:
          issue_number: '56' # replace with YOUR verified completed issue number
          token: ${{ github.token }}
      - name: Use verified media
        env:
          SOURCE_FILE: ${{ steps.phone.outputs.asset_path }}
        run: |
          test -s "$SOURCE_FILE"
          # Now edit/mix from "$SOURCE_FILE" in this SAME job.
```

Action outputs: `asset_path`, `media`, `sha256`, `rights_status`, `release_visibility`. Keep rights-unverified footage private. **An imported source is not itself a rendered edit.**

If GitHub's text connector cannot fetch a 15MB private binary, **do not stop and demand the user attach it**; use this proven Actions import pathway.

## 2. No suitable asset? Submit a properly formed job.

1. Confirm the source is actually the requested car and sequence; select useful timecodes (prefer short clips). For direct original creator MP4s, use the normal lawful direct-media route, not the YouTube-only phone protocol.
2. For YouTube, normalize to exact `https://www.youtube.com/watch?v=VIDEO_ID` (11-character ID; no `&t=`, playlist, `youtu.be` or other host).
3. From the **V4 worker branch**, run the existing helper:

```bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=Exq6pB3IGyU' \
  --start 8 --duration 13 --height 1080 --orientation landscape
```

**Audio-only** (new mode; phone-side confirmation may still be required):

```bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=Exq6pB3IGyU' \
  --start 8 --duration 13 --media audio
```

Optional native UHD `--height 2160`: **CI-tested but not yet phone-proven**. Verify genuine source 4K pixels, phone version and storage first. No fake upscale; preserve 1080p default otherwise.

4. The `prepare` helper **prints a two-line body** starting `YUNEX_PHONE_JOB_V4`; it does **not** create an issue. Create an **open issue** in the canonical repo with title `[YUNEX PHONE JOB] <specific footage>`, exact printed body, and **GitHub issue author `YunRah2103`**. If your account cannot produce an owner-authored issue, state precisely what is required rather than impersonating the owner or faking a queued job.
5. Source licence details are **not** required to queue a private review job. Unknown-rights output remains a private **draft Release**, **not authorised for public posting**.
6. Wait for the owner's issue comment: `YUNEX_PHONE_DONE_V4` (success) or `YUNEX_PHONE_FAILED_V4` (read actual error). An idle Termux message is normal, not a failure; an issue is **not** proof of an MP4. GitHub cannot remotely start the owner's stopped Termux loop. Mention `~/yunex-v4 --loop` **only** when a real eligible job is queued and processing requires it.

## 3. Verify and deliver

- For a completed job, **use the import action** in the same job that edits it. Validate source content and exact timecodes by viewing/listening, in addition to action's byte count, SHA256, FFprobe and full FFmpeg decode.
- Video agent: report matching car/model, moving shots, framing, aspect ratio and clip quality; no invented native 4K claims.
- Audio agent: inspect actual AAC stream, timing and usable authentic engine segments; **don't substitute old unrelated samples**.
- Editor: preserve the user's approved shots, soundtrack, music synchronization, transitions and loop unless explicitly instructed; render a *new real playable MP4*, inspect visuals/audio and cite the exact artifact.
- Report: **issue number + source/timecodes + real authenticated media location + filename + rights status + dimensions or audio format + duration + SHA256 + media inspection verdict + final edit status**.
- Never publish rights-unverified source footage, expose a token, claim a private draft has a public URL, call a queued job a download, or send the task back to the owner for a manual upload when the GitHub asset already exists.

## Troubleshooting in one sentence

- **Cloud YouTube anti-bot:** GitHub Actions downloading failed, **not** necessarily S25.
- **Draft `mp4_url: null` / API 403:** expected private access barrier; import using the shared action and `contents: write`.
- **No phone completion:** check issue author/title/marker/URL, whether V4 is currently running, and only then request the smallest needed owner action.
- **Audio-only or native 4K request:** distinguish CI validation from actual phone proof; don't claim the feature is installed or proven without evidence.
- **User asks only for instructions/prompts:** do not queue media, modify code or render anything without that assignment.

**Source of truth:** follow the [new-agent quick-start](../../../docs/YUNEX_V4_NEW_AGENT_START_HERE.md) and [full protocol](../../../docs/YUNEX_S25_V4_AGENT_GUIDE.md) over old handoff notes.
