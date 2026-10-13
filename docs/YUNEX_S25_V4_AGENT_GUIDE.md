# YUNEX — Galaxy S25 Footage Worker V4: Instructions for Agents

**Canonical repository:** [`YunRah2103/Remotion-gpt-chat`](https://github.com/YunRah2103/Remotion-gpt-chat). **Do not use** the old `YunRah2103/yunus-video-lab` repository.

**Worker implementation branch:** [`experiments/s25-footage-worker-v4-10min-20261012`](https://github.com/YunRah2103/Remotion-gpt-chat/tree/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage). The V4 worker is **already installed on the owner's Galaxy S25 (Termux)**. Agents should not rebuild the worker, request installation, or ask for GitHub tokens.

This is the **agent-facing workflow** for requesting licensed YouTube footage through the existing phone worker, retrieving its real output and handing it to the video editor. Read the actual [V4 README](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/README_V4.md), [job helper](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/agent_jobs_v4.py), [source catalog](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/sources_v3.json) and [worker protocol](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/v4_worker.py) when implementing a job.

## Proven working vs. not yet proven

**Real S25 V4 PASS:** [issue #55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55) downloaded the previously approved CC BY 3.0 snowy-car **YouTube URL** `DqiKOr1aS9w` from the phone, producing an **8.008-second, 1920×1080 H.264 MP4 (9,179,358 bytes)**. Phone report: `YUNEX_PHONE_DONE_V4`, FFmpeg full decode PASS, SHA256 recorded. [Playable MP4](https://github.com/YunRah2103/Remotion-gpt-chat/releases/download/yunex-phone-v4-55/yunex-v4-55.mp4) and [JSON manifest](https://github.com/YunRah2103/Remotion-gpt-chat/releases/download/yunex-phone-v4-55/yunex-v4-55.json) are already in a GitHub Release.

**Not proven:** The two specific RS6 YouTube links were rejected by the V4 **approved-source registry before ever reaching the phone**. GitHub Actions separately hit YouTube's `Sign in to confirm you're not a bot` challenge. **Neither outcome establishes whether those RS6 URLs can download from the S25.** Do not say the phone failed or that those RS6 downloads worked.

## Agent checklist: source → approval → job → MP4 → edit

### 1. Pick the right acquisition route

- First prefer **known-working direct creator/manufacturer MP4s** when legitimately accessible and permitted, especially genuine 4K originals. GitHub Actions or the existing direct-media workflow can fetch these without involving the phone.
- Use **S25 V4 for rights-approved YouTube URLs**, especially when the cloud YouTube downloader is blocked. This worker is **not a general URL downloader** and does **not** support native 4K.
- Find genuine footage with useful **exact timecodes** and visually confirm the right vehicle, framing, motion and quality. A video URL, metadata-only run or contact sheet does **not** count as a playable deliverable.

### 2. Check source rights and the exact registry

Read `production/phone_footage/sources_v3.json` **on the V4 branch**; this is the authoritative approval list. The worker currently accepts canonical URLs shaped like `https://www.youtube.com/watch?v=VIDEO_ID`; arbitrary URLs (TikTok, Vimeo, direct MP4 and short-link variants) are not V4 queue inputs.

The current registry validator permits **CC0 1.0, CC BY 3.0 and CC BY 4.0** entries with an actual attribution/source/rights reference, max height 720 or 1080, `reviewed_by: "YunRah2103"` and `approved: true`. The worker does **not** accept an agent's unverified rights claim in an issue body.

If the wanted URL is missing, **do not create a fake approved issue, bypass validation or silently grant permission**. Prepare a source-review request for the owner containing:

- Exact canonical source URL and creator/owner.
- Proof of rights allowing public GitHub redistribution (original licence/grant URL and required attribution).
- Proposed excerpt start/end, actual source quality, 720p/1080p maximum.
- Why the shot is worth using and any editorial restrictions.

**Only after owner rights approval** should the reviewed entry be committed to the V4 branch registry. The phone's running loop attempts to **refresh this registry from GitHub each poll**; a registry-only update normally needs **no Termux reinstall/restart** if the refresh succeeds. If new permission is incompatible with the validator's allowed licences, obtain an explicitly reviewed worker/protocol change rather than falsifying the licence.

### 3. Generate an exact V4 job — do not invent JSON formats

In a checkout of the **V4 implementation branch**:

```bash
python production/phone_footage/agent_jobs_v4.py list
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=DqiKOr1aS9w' \
  --start 3 --duration 8 --height 1080 --orientation landscape
```

This example uses the **already approved test source**, **not an RS6 source**. For a production video, substitute its **approved exact URL** and verified timecodes. The command prints a **two-line issue body** of this form:

```text
YUNEX_PHONE_JOB_V4
{"url":"https://www.youtube.com/watch?v=DqiKOr1aS9w","start":3.0,"duration":8.0,"height":1080,"orientation":"landscape"}
```

The helper's `prepare` command **only validates and prints an issue body**. It does **not** submit the job or download the video. Use the GitHub issue-creation connector/action (authenticated **as `YunRah2103`**, the accepted issue author) to create an **open** issue:

- **Title:** `[YUNEX PHONE JOB] <meaningful clip description>`
- **Body:** paste the complete, exact output from `prepare` starting with `YUNEX_PHONE_JOB_V4`.
- **Repository:** `YunRah2103/Remotion-gpt-chat`.

The worker explicitly checks the **issue author's login**. A bot/other-account issue will not be accepted merely because its payload looks correct. If the connected GitHub account is not the owner, request owner-authored submission; don't claim the job is queued successfully.

**Constraints:** duration **2–600 seconds**, start offset **0–21,600 seconds**, output **720p or 1080p maximum**, `landscape` or `portrait`, height must not exceed the source's approved `max_height`. Request short shots by default. V4 checks storage budgets (potentially several GiB for long jobs), validates source resolution, transcodes H.264/AAC and full-decodes the finished MP4. **No 4K output.**

### 4. The phone runs independently

The user **already installed V4** and has run `~/yunex-v4 --loop`. While that process is actually active, it checks for jobs roughly every **60 seconds** and processes **one eligible issue at a time**. **Creating a GitHub issue does not remotely start Termux**. Android may suspend background tasks, and the owner can stop with `Ctrl+C` to save battery.

Agents **must not** ask the user to reinstall, paste a GitHub token, repeatedly run per-video commands, or keep the phone awake for jobs that have not yet been approved. If jobs are genuinely queued but the worker has stopped, a **single** request to run `~/yunex-v4 --loop` is enough for that session.

`No pending approved V4 jobs` is a **normal idle status**, not a failed download.

### 5. Get the real completion report

When the phone finishes, the owner-created issue receives a comment beginning with either:

- `YUNEX_PHONE_DONE_V4` — success; includes JSON with `status: PASS`, `mp4_url`, `manifest_url`, `source_url`, `width`, `height`, `duration`, `sha256`, `full_decode` and rights/attribution.
- `YUNEX_PHONE_FAILED_V4` — failure; read and report the **actual phone-side error**. Do not claim an MP4 exists.

Agents can inspect the issue comments through GitHub, or read the verified completion via the helper:

```bash
python production/phone_footage/agent_jobs_v4.py result --issue ISSUE_NUMBER
```

Then **open/download the actual MP4**, check `ffprobe`, compare the SHA256 with the manifest, and visually inspect moving frames and the relevant action. A GitHub issue alone, queued job, green Actions workflow or metadata dump is **not** a finished footage pack.

**Important publication detail:** the V4 worker currently creates a **public GitHub prerelease**, **not a private/draft review release**. Only request footage where public redistribution rights have been affirmatively reviewed. Do not send private, all-rights-reserved or permission-uncertain clips through this mechanism.

### 6. Handoff and continue editing

For every successful asset post the **issue number**, public **MP4 URL**, **source URL + exact timecodes**, **licence/attribution**, **native/resolved output dimensions**, **duration/fps where confirmed**, **checksum**, **decode status**, and brief **visual QA verdict** to the relevant production tracking issue (e.g. RS6 issue [#44](https://github.com/YunRah2103/Remotion-gpt-chat/issues/44)). Include exact strengths/limits: e.g. front-moving RS6 vs static grille; don't pad an edit with irrelevant footage.

Continue **direct MP4 / manufacturer-source acquisitions in parallel**, rather than holding up a production waiting for a YouTube/phone experiment. If a YouTube job legitimately fails on S25, capture the precise failure once, change source/method and move on. **Never report a cloud anti-bot failure as an S25 download failure.**

## One-screen agent decision tree

1. **Accessible licensed direct MP4?** Use existing GitHub Actions/direct media workflow; verify real file.
2. **YouTube-only source?** Check ownership, allowed licence and V4 registry on the implementation branch.
3. **Not approved?** Request owner review; work on other clips. **No issue that pretends approval.**
4. **Approved?** Run `agent_jobs_v4.py prepare`, create an **owner-authored open** `[YUNEX PHONE JOB]` issue.
5. **Phone loop active?** Wait for `YUNEX_PHONE_DONE_V4` / `YUNEX_PHONE_FAILED_V4`; don't confuse an idle loop with failure.
6. **PASS?** Inspect real Release MP4, manifest, checksum and visuals; hand off to editor.
7. **FAIL?** Report exact error and switch approach. Don't endlessly retry the same blocked route.

**Current verified test:** [issue #55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55) → [playable phone-acquired MP4](https://github.com/YunRah2103/Remotion-gpt-chat/releases/download/yunex-phone-v4-55/yunex-v4-55.mp4). Use it to understand the result protocol, **not** as Audi RS6 footage.
