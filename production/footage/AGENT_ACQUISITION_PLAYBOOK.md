# YUNEX — Footage Acquisition Playbook for FUTURE Agents

Last checked: 2026-10-11. Applies to **future automotive projects**; do not rewrite active production footage assignments merely by adding this documentation.

## Objective

Obtain actual moving original car footage in **native >=1920x1080 landscape or >=1080x1920 portrait**, up to 3840x2160 / 2160x3840 as requested. The fact that video downloads successfully does not mean it meets these quality gates. Verify native decoded dimensions, framing, visual identity, sharpness, uniqueness, duration and cinematic suitability before marking a clip PASS. Full-size originals only: no fake 1080p by upscaling lower-res sources, no black bars, no stills posed as moving video. Model/track specifics depend on each project's contract.

For the highest-quality footage collection, use the following **practical order**:

1. **Direct original MP4/CDN files** from manufacturer, motorsport teams, press media and willing filmmakers where available; `curl -fL` or `wget`. Inspect actual stream. Strong option for clean, high-bit-rate 1080p–4K if source exists; successful transport by itself is not proof of high resolution.
2. **TikTok**, when the individual post has genuinely native full HD. Verified actual Porsche/Lamborghini-related automotive downloads and a Lamborghini STO post at **1080x1920** on a GitHub runner. Some other tested posts were only 576x1024: reject these for the 1080p gate.
3. **Instagram**, when the individual Reel has genuinely native full HD. One successful Reel at **1088x1936**, others at 720x1280, and some block access. Check before promising.
4. **X/Twitter and Pinterest** for extra candidate discovery. Downloads worked on test posts, but those particular best streams were **1280x720 and/or 720x1280**, which FAIL the required 1080p/4K native footage gate. Only accept an independent post actually proven to meet requirements; do not upscale.
5. **Twitch Clips** for racing/sim-racing where that content suits the project. Proven download **1920x1080, ~60 fps**. This was a *gaming* test, not a proof of real-world car footage. Avoid representing simulator gameplay as authentic real car cinematography.
6. **Snapchat Spotlight** works on some posts but samples mostly **540x960**, below our quality threshold. **Bluesky** 1280x720 trial worked but best-quality remux/decoding was inconsistent. **Dailymotion** extraction transport works, but tested samples were low quality. Low-priority options under the 1080p minimum.
7. **Facebook Reels** and **Reddit** failed public-sample GitHub-hosted attempts. Don't sink hours into repeating the same failures.
8. **YouTube / Shorts DO NOT WORK RELIABLY** in this tested GitHub Actions environment. Multiple yt-dlp client approaches, platform impersonation, cross-runner attempts and public API mirrors failed sign-in/bot checks. Prefer official publisher downloadable files or request filmmaker originals instead of treating a YouTube watch URL as an attainable MP4. This is an environmental observation, not a universal impossibility.

The recommended *short-form/social sequence* is therefore **TikTok → Instagram → X/Pinterest discovery → direct original MP4**; however **direct original MP4 first** is generally best when a genuine clean 4K publisher file already exists. Always rank the file itself, not the platform name.

## Existing tested code / branch reality

The new experimental multi-source downloader is at:

- Branch: `feature/footage-rescue-multisource-20261011`
- Program: `production/footage_rescue/acquire.py`
- Workflow: `.github/workflows/footage-rescue.yml`
- Full live platform proof: `production/footage_rescue/LIVE_PLATFORM_AUDIT_2026-10-11.md`
- Seven-platform followup: `production/footage_rescue/LIVE_EXTRA_SOCIAL_AUDIT_2026-10-11.md`
- General experimental guide: `production/footage_rescue/README.md`

Supports TikTok, Instagram, YouTube, Dailymotion, Snapchat, Pinterest, Twitch, X/Twitter and Bluesky links; bounded retry fallback through `yt-dlp` then Chrome impersonation, with `gallery-dl` for applicable sources, and configurable additional permitted engines where documented. New allowlist tests reported passing. **This code was NOT merged into main at the time of this playbook.** Branch-scoped workflow may not appear in standard Actions manual dispatch. Do not pretend the experimental tool is installed on `main`. Inspect current branches and verify actual installed paths at the start of each new assignment. No future agent should auto-merge experiment code or modify unrelated finished videos.

Recorded proof:
- [Main full platform audit](https://github.com/YunRah2103/Remotion-gpt-chat/blob/feature/footage-rescue-multisource-20261011/production/footage_rescue/LIVE_PLATFORM_AUDIT_2026-10-11.md)
- [Additional social audit](https://github.com/YunRah2103/Remotion-gpt-chat/blob/feature/footage-rescue-multisource-20261011/production/footage_rescue/LIVE_EXTRA_SOCIAL_AUDIT_2026-10-11.md)
- [TikTok/Instagram actual vehicle extraction](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38159913823)
- [Best stream and Twitch tests](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38160590802)
- [Additional multi-platform Porsche samples](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38162011170)
- [Platform allowlist smoke tests](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38162130435)

## Agent execution protocol — NO endless downloader loops

1. Inspect production contract and **actual existing GitHub branches**. Confirm which workflow/script exists on your working branch.
2. Research multiple **real** original sources for each exact car model before retrying blocked hosts. Acquire video bytes, not URLs/metadata and not fake frames.
3. Prefer a couple of bounded attempts per source, e.g. standard `yt-dlp` then Chrome impersonation, then `gallery-dl` on supported sites. If access is blocked, source quality fails or content has watermark, immediately move to a different source. Do not do long cookie/API/YouTube workarounds.
4. Record FFprobe width/height, FPS, codec, duration, bitrate; fully decode or sample widely with FFmpeg; confirm real model, actual movement, no distracting watermark, usable composition; calculate SHA-256, in/out ranges and duplicate-angle comparisons. Audio recordings must match the actual car when later used.
5. Preserve original media where feasible; source ZIP contains actual downloaded **1080p or 4K** MP4/MOV/MKV bytes, not upscaled or tiny proof samples. Audio and permission/provenance information belong in manifest as applicable.
6. **GitHub Actions artifacts are a VERIFIED WORKING transfer mechanism**. Create exactly one consolidated footage ZIP per worker where reasonable, with `clips/`, source manifest JSON/CSV, decoded contact sheets, QA and README. Provide exact Actions run/artifact ID and expiry. A green Action is not proof that the clips exist or are cinematically usable.
7. Give truthful **PASS / PARTIAL / BLOCKED** with actual unique-camera-angle count, native resolution, cars identified, original source files and deficits. Never inflate clip counts by slicing one perspective repeatedly.

## Starter instructions to insert into new footage agents

> Read `production/footage/AGENT_ACQUISITION_PLAYBOOK.md` on the `docs/yunex-footage-playbook-20261011` branch (or its later merged location), alongside your production contract. Newer platform downloader code is experimental on `feature/footage-rescue-multisource-20261011`, not automatically on main. Prefer direct original 1080p/4K MP4s and successful TikTok/Instagram sources, use X/Pinterest for leads, Twitch for appropriate landscape simulator racing, and avoid repeating blocked YouTube/Facebook/Reddit attempts. Validate **each source's native dimensions** with FFprobe and decoded sample frames before claiming usable footage. Deliver actual files in a GitHub Actions ZIP with provenance, manifest and SHA-256, not just URLs or a green CI badge.

This playbook is additive, not a transfer of existing tasks, no new agents were launched, and no existing film or rendering workflow was modified.
