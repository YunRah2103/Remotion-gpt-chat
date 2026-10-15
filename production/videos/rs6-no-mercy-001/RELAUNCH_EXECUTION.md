# YUNEX RS6 NO MERCY — FOOTAGE AGENTS RELAUNCH V2

**READ THIS FIRST. This replaces the execution workflow of the old A/B/C footage prompts** on these three *new* replacement branches. The original C8 vehicle identity and cinematic aesthetic in PRODUCTION_CONTRACT.md and STYLE_ANALYSIS.md remain mandatory. We are NOT restarting the edit, manager or audio project.

Project: C8-generation Audi RS 6 Avant, aggressive cold-blue / high-contrast / monochrome cinematic edit, ~13–16s. Repository `YunRah2103/Remotion-gpt-chat`, tracking issue **#44**. Do not work on `yunus-video-lab`.

## Why these replacements exist
The first A/B/C agent sessions mostly repeated DNS failures, legality notes and status comments. They did acquire low-resolution Audi previews and created some GitHub workflows, but they did not deliver suitable RS6 footage. A replacement agent should **act on tools**, not create a research report and quit.

The goal is to produce playable high-impact RS6 video shots or, where acquisition requires phone action, a **properly prepared authorised S25 V4 job**. A candidate-source review request is useful progress but is not the final delivery; keep pursuing independent sources while the review is open.

## On every active turn, make actual forward progress
1. Read project brief and own ROLE file, then inspect current issue #44 and other replacement agents' submissions to avoid overlap. **Immediately start discovery and executable acquisition**, not a lengthy planning-only response.
2. Use available browsing/search, official and creator sites, video platform metadata, direct MP4/CDNs, yt-dlp, FFmpeg and GitHub **Actions** runners. If the chat/container cannot reach external DNS, create/trigger a self-contained bounded-retry Actions workflow on your branch and check its run and artifacts. Do not retry the same dead endpoint 10 times.
3. Within the turn, try **materially different** available approaches if one fails: (a) direct original/creator CDN or downloadable licensed media, (b) GitHub Actions independent network and tools, (c) a different authorised source/creator, (d) YouTube via owner-reviewed S25 V4 bridge. You can change order for your source domain.
4. A source video URL is a *lead*, never proof of acquired footage. Real footage = actual playable media + native source metadata + decoded visual frames + SHA256 + linked GitHub artifact/release accessible to the manager. Native 1080p or better strongly preferred; source preview 620×348 is rejected.
5. Avoid endless low-quality candidates. For each 2–5s shot, require authentic C8 RS6, car or credible camera movement, usable 9:16 crop, high-end aesthetic and no distracting overlays. Rank by visual impact, not download count. Select 3–6 exceptional shots per role.
6. Log only concrete milestones on #44 (an executable workflow/run, new approved source request, real playable source, or verified footage asset). Don't flood it with repeated blocked notices. Tell the user what actually ran in this turn.
7. If progress involves external approval or Termux, **queue a concrete work item and continue other independent acquisition tasks**. Do not claim approval/download before confirmed. End a turn with the strongest delivered artifact(s) and the single next action only if there is a genuine unavoidable external dependency.
8. Agents are not persistent chat processes. **No instruction can force a chat to keep executing after its reply.** If unattended execution matters, commit/run a bounded GitHub Actions workflow/queue that can operate without another chat turn; do not claim continued autonomous ChatGPT thinking or downloading.

## Correct S25 V4 mechanism — NO MORE 'the catalog does not have RS6, so blocked'
Verified branch `experiments/s25-footage-worker-v4-10min-20261012`:
- Read `production/phone_footage/v4_worker.py`, `README_V4.md`, `sources_v3.json`, `agent_jobs_v4.py`.
- **Find footage first.** Identify exact YouTube watch URL, uploader, car generation/shot purpose, best start time, desired clip duration normally 6–40s, requested height 1080p, and publisher/rights evidence.
- Before authorised worker job, create a separate GitHub Issue titled **`[YUNEX RS6 SOURCE REVIEW] <creator> — <shot>`** with source, time ranges, reuse/public GitHub release rights evidence/link, attribution, C8 visual evidence, desired duration, potential variants. Link issue to #44. **Do not claim a review request is a download request.**
- Current worker rejects URLs absent from V4's verified `sources_v3.json`. An authorized owner/rights reviewer must approve the source and merge/update that **exact V4 branch's** registry, with `approved:true`, `reviewed_by:"YunRah2103"`, supported license CC0 / CC BY 3.0 / CC BY 4.0, proper supporting license URL; or choose another verified permitted source. **Do not falsify or self-assign owner review.** Mere personal YouTube accessibility/creator attribution does NOT grant public redistribution rights.
- **After** catalog approval, use the existing `agent_jobs_v4.py prepare --url ... --start ... --duration ... --height 1080` to generate `YUNEX_PHONE_JOB_V4` issue body. Create a separate owner-authored GitHub issue with title beginning `[YUNEX PHONE JOB]`. GitHub task creation doesn't start Termux. User runs `~/yunex-v4 --once` on the S25 if needed. V4 processes approved issue, saves genuine MP4 and JSON manifest to GitHub Release, reports `YUNEX_PHONE_DONE_V4`. Validate release bytes and visual quality; do not mark complete based on a queued job.
- V4 technical maximum 600s/1080p/512MiB; 600-second actual phone acquisition not proven. **No arbitrary YouTube or TikTok URLs are supported** by V4. TikTok is an alternate source only when permitted/technically supported by different acquisition method.
- If approval is unavailable, keep working on rights-cleared originals or creator-permission routes in parallel instead of endlessly restating source review as blocker. Keep rights-restricted previews ephemeral; do not publish in public Releases or artifacts.

## GitHub evidence & QA
- Working branch: your dedicated A2/B2/C2 branch. Include runnable acquisition source code or workflow, diagnostics, fallback attempts, metadata, contact sheets/FFprobe/full decode, manifest and checksums. CI success with only JSON diagnostic does **not** count as footage.
- For actual redistributable footage, upload a video-bearing GitHub Actions ZIP/release and provide its actual run/artifact ID. Videos must be lawfully redistributable through that destination.
- Keep Manager F on existing `automotive-edits/rs6-no-mercy-001/f-manager-qa` branch; it validates real shots. F is **not a prerequisite to source discovery, source requests or technical acquisition**. The original A/B/C branches remain unmodified historical evidence.
- No editor or audio duties. Do not oversell candidate sources or use AI-generated ersatz RS6 footage.
