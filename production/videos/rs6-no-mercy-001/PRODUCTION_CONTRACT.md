# YUNEX — RS6 // NO MERCY 001 — LOCKED PRODUCTION CONTRACT

Repository: YunRah2103/Remotion-gpt-chat
Issue: https://github.com/YunRah2103/Remotion-gpt-chat/issues/44
Shared contract branch: automotive-edits/rs6-no-mercy-001/production-contract
Project path: production/videos/rs6-no-mercy-001
Car: C8-generation Audi RS 6 Avant (including standard/performance trims if footage is authentic and visually coherent; NOT prior C7, speculative successor, RS3/RS4, or GT unless manager marks a distinct exception).
Output target: 1080×1920 portrait, H.264 yuv420p, 30fps, AAC stereo, ~13–16 seconds.


## Intent
Make a striking, **aggressive cinematic edit starring a real C8 Audi RS 6 Avant**, inspired by the user's actual uploaded non-car reference `193955.mp4`. This is a new aesthetic, NOT the Turbo project, NOT a documentary, NOT a slideshow of glamour shots. User confirmed **C8 generation**. The **RS 6 Avant performance** variant is a desirable option where authentic footage exists, but C8 is the core requirement and standard C8 RS 6 Avant is acceptable. Keep physical spec/paint/wheels coherent across edits when possible; variety of cars can work if intentionally cut, not disguised as a single car.

## Verified reference asset and aesthetic
- Uploaded video: `193955.mp4`, 13.165011s, **1080×1920**, 50fps, HEVC video, AAC 44.1kHz stereo. SHA256 `fdcf9b7777b50237939cf3621d515080339112d9d7d4384ac261681d4cf7270f`.
- Extracted exact reference audio: `YUNEX_RS6_Reference_Audio.m4a`, AAC stereo 44.1kHz, 13.165011s; SHA256 `5ea5b0250728557eca23ea4123665ba01e5bc4ab3eba4689e7bfefc7b0e6e55b`. **Not uploaded to public GitHub.** Present in the user's originating chat; user can attach to E/audio agent later. Do NOT claim the file is in the repository.
- Reference video grammar (actual frame review): first ~3s cold, slightly desaturated blue, snowy mountain establishing views framed in a deliberate small letterbox; ~3s snap into stark near-monochrome active snowboarder; sections of 0.2–0.5s dynamic shots, freeze/repeats, brief full-black rhythmic interruptions (~4.7–5.3 and ~7.7–8.2), occasional high-contrast negative-image flashes around ~4.0/~6.75; no logo/text; gritty, confrontational feeling.
- Main musical energy surges around ~5.5–6s and ~9.5–10s. E should map **actual beats by measurement** and D use that measured map; times above are reference observation, not precise rhythmic grid.
- **Adapt, do not copy**: bright cold-blue textured night/tunnel/wet tarmac → severe B&W RS6 close-ups → violent bass-synced dynamic rolling sequences → a few calculated negative pulses / 1–3 frame black stutters → decisive final drive-away / headlight impact. Do not reproduce mountains/snowboarder footage or slap generic monochrome filters everywhere.

## Cinema standards
- Opening within 1 second must intrigue; subject/car must be strong and readable, not just a static road.
- A bold creative payoff every several seconds; clear sense of movement, weight, speed and tactile materials.
- Clean handoffs among low road tracking, wheel, headlights, diffuser/oval exhaust and side/rear drive-bys. Real motion / camera motion, not fake slideshow zooms.
- Avoid cheap shake spam, text titles, AI fake cars, ubiquitous HUD graphics, random glitch overlays, long dead black bars, repetitive shots, poor vertical cropping, fake HDR labels.
- **Black flashes are intentional rhythmic micro-cuts**, not accidental >0.4s blank patches. Reference has longer black holds; adapt thoughtfully for audience retention rather than copying empty space.
- Preserve score rhythm. Real C8 4.0L twin-turbo V8 audio accents only where they match the visual. No unrelated V8/GT3/F1 fake-engine layers, random metal clicks or unsynced pit sound.
- Native **1080p+** source preferred; 4K source allows reframing to portrait. Do not call 720p-upscaled 1080p "native". Remove source watermarks only when rights permit; avoid social platform overlays.
- Rights: source accessibility, YouTube/TikTok download ability, and technical MP4 ownership do **not** imply public redistribution permission. Log content reuse rights; do not bypass DRM, auth or access restrictions. Any production intended for public release requires rights review. For reference soundtrack, confirm licence or replace with cleared music at a comparable measured tempo.

## Production team (six separate user-launched ChatGPT chats)
- A — Official / hero RS6 footage: `automotive-edits/rs6-no-mercy-001/a-official-footage` — `AGENT-A-OFFICIAL.md`.
- B — Creator / motion RS6 footage: `automotive-edits/rs6-no-mercy-001/b-creator-driving` — `AGENT-B-CREATOR.md`.
- C — Details / atmospheric RS6 footage: `automotive-edits/rs6-no-mercy-001/c-details-atmosphere` — `AGENT-C-DETAILS.md`.
- D — Cinematic Editor: `automotive-edits/rs6-no-mercy-001/d-cinematic-editor` — `AGENT-D-EDITOR.md`.
- E — Audio Engineer: `automotive-edits/rs6-no-mercy-001/e-audio-engineer` — `AGENT-E-AUDIO.md`.
- F — Manager and independent visual/audio QA: `automotive-edits/rs6-no-mercy-001/f-manager-qa` — `AGENT-F-MANAGER.md`.

**Phase 1:** Start A, B, C and F. Let F collect/inspect ACTUAL video-bearing deliverables. **Phase 2:** Start D and E when F verifies enough complementary usable shots. Agents do not auto-launch when branches are created.

## S25 Phone Worker V4: required alternative acquisition route
Repo branch: `experiments/s25-footage-worker-v4-10min-20261012`; read `production/phone_footage/README_V4.md`, `sources_v3.json`, `agent_jobs_v4.py`. Phone bridge V4 supports **up to 600 sec, 1080p, 512 MiB**, with 15 passing offline tests; real previous S25 six-second **1920×1080** acquisition proven by issue #41 on earlier worker, but V4 long-duration phone test is **NOT** proven. Default practical 6–40s excerpts. 
If direct original MP4/CDN is unavailable, do not automatically give up on YouTube: find promising real sources, verify authorisation/rights evidence and approved catalog status, then prepare valid `YUNEX_PHONE_JOB_V4` Issue. The registry currently lists only two tested licensed sources (neither an RS6); **do not self-approve** arbitrary RS6 YouTube, manufacturer or TikTok material. User runs `~/yunex-v4 --once` in Termux when there is an approved queued job. Require completed `YUNEX_PHONE_DONE_V4` release report, MP4 checksum, FFprobe, full frame decode and contact sheets. A queued job is NOT acquired footage. GitHub Release assets are PUBLIC, so only rights-cleared media can be uploaded.

## Quality gates
A/B/C each actually download candidate moving video, evaluate and deliver a real video-bearing ZIP through GitHub Actions with sample MP4s (or direct approved GitHub Release assets), source and rights manifest, duration/native resolution/fps, SHA256, contact sheets and honest rejects. 4–7 outstanding complementary shots per source role is more useful than 30 generic clips. Manager F eliminates duplicates, rejects irrelevant RS variants and inspects visual/frame quality. D produces 2–4s visual proof / draft before committing to whole film. E measures true beat/timing and places only authentic identifiable engine audio, then F independently inspects **real finished playable MP4** (full decode, sound, cuts, crops, black frames, identity/rights). No claims of finished video before there is an actual downloadable file. 

Project issue #44 is the central reporting ledger. Do NOT read or modify `YunRah2103/yunus-video-lab`. Keep all work on dedicated branches; do not alter other projects. 
