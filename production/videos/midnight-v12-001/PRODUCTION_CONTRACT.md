# EXOTIC AFTER DARK — LOCKED PRODUCTION CONTRACT (existing project slug: midnight-v12-001)

**Director:** GPT-6 master (concept + approvals)
**Date:** 2026-10-10
**Repository:** YunRah2103/Remotion-gpt-chat
**Production base branch:** `automotive-edits/midnight-v12-001/contract`
**Project:** `production/videos/midnight-v12-001/`

## Source references
- User-supplied visual reference: `192907.mp4`, approx 29.1s, 1920x1080, dramatic Lamborghini-style night driving, blue tunnel light / dark industrial beauty scene.
- User-supplied **audio**: `TikTok video #7690925557919403294 [7690925557919403294].mp3`. Original private attachment **is NOT checked into this repository**.
- Audio SHA-256 (actual uploaded bytes): `87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678`.
- Probed audio: 10.553469s MP3-container duration (10.52735s decoded PCM), stereo, 44,100Hz; may contain MP3 encoder delay. Beat map uses decoded effective length.
- To render with music, Master Agent D must obtain the **same attachment via the user's private agent chat/private authorised transfer** and verify SHA-256. Never substitute another song.
- User's reference video is **a style reference only** and never an assumed footage licence. Do not take its frames or audio as source by default.

## DIRECTOR OVERRIDE — 10 October 2026: EXOTIC AND AGGRESSIVE
The user explicitly corrected the direction: **NOT a subdued Lamborghini night documentary or luxury-car beauty film.** Build a 10.53s **ferocious, exotic hypercar edit**: extraordinary wing/active-aero silhouettes, raw acceleration, aggressive low tracking, brutal front and rear angles, clean speed ramps, precisely beat-hit whip/zoom crashes, impact highlights and continuous kinetic energy. The sung second act stays **aggressive**, not dreamy/slow.

**Hero hypercar selection is OPEN until Agent A verifies genuine usable moving footage.** Scouting shortlist: **Koenigsegg Jesko Attack, Apollo Intensa Emozione, Pagani Huayra R, McLaren Senna GTR, Lamborghini Veneno / Sián**. These are creative candidates only, not claims of footage availability or usage rights. Choose **one consistent, recognisable hypercar** with best proven licensable footage, >=11 genuinely distinct motion angles and high-quality vertical framing. If dream car lacks footage, rank realistic ultra-exotic alternatives with evidence; never silently default to ordinary dark Aventador shots. Track, tunnel, urban night or dramatic dusk are all acceptable if the real footage looks incredible. No enforced V12 engine or night scene; historical project folder name is just a technical identifier.

**Editing intensity:** decisive motion-matched cuts, selective 2–4-frame whips, brief zoom-crash transitions, expressive speed ramps, rare 1–2-frame impact flash, high contrast paint/wing highlights. Never obscure the car or resort to tacky HUD or incessant RGB glitches. Main transition at **frame 77** stays fixed to the user's soundtrack. Final hero hold only at end.

## Final creative specification
- Format: 1080x1920, vertical 9:16, CFR 30fps; 316 video frames (10.533333...s).
- Film duration aligns to effective 10.527s audio within final frame. No invented 29s music loop or padding more than one frame.
- One visual identity: **ultra-exotic, visually aggressive hypercar chosen by verified footage**; no mandatory model, make, colour or engine type. Exact identity must be visually established.
- Look: fierce exotic aero, striking silhouette, real speed, photogenic surfaces and strong light; setting follows actual best footage rather than a mandatory dark tunnel.
- Language: *no large captions, faux telemetry HUD, watermark overlay, random glitch pack, loud typography or motion-graphic clutter.* The car must dominate.
- Sonic act I, 0–2.56s: aggressive distorted/noisy intro; reveal lights/engine, accelerate into punch.
- Sonic act II, 2.56–10.53s: melodic/vocal audio but **relentless hypercar motion** and exciting angles, building to an explosive hero payoff. Primary change near frame **77** is LOCKED.
- About **11 genuinely distinct shots**, no repeated source shot masquerading as a new angle, no static-image animation passed off as footage, no AI-faked source unless user explicitly agrees.
- Transitions: punchy precision—matched velocity cuts, fast direction whips, controlled 2–4f smear, selective zoom crash and power ramps on real musical hits. Keep the exotic car crisp/readable; no cheap effect clutter.
- Frame map: `beat-map.json` is the shot plan with half-open frame ranges [in, out). Frame ranges must partition 0..316 exactly, no gaps or overlaps.
- Aim at visual quality matching the night Lamborghini reference: cinematic source image first, effects second.

## Critical original-footage fidelity
- Ideal: **real 4K landscape or native >=1080x1920 vertical**, 30fps or higher; verify *effective* vertical crop quality.
- A source that is only 1920x1080 becomes ~608x1080 on central 9:16 crop, needing major upscale; do not call that full-resolution footage.
- For 3840x2160 landscape, central 9:16 crop is 1215x2160, sufficient for 1080x1920.
- Review every chosen shot for correct model, livery/color continuity, low-light readability, genuine camera movement, sharpness, compression, crop margins and permission to use.
- yt-dlp importer exists at `production/footage/yt_dlp_ingest.py` with README; downloader success does not grant reuse rights.
- Never assume a YouTube source is downloadable on CI or usable for public posting. Make legal/provenance records per clip; do not use DRM, bypass protections or private cookies.
- No third-party source footage or TikTok audio committed into this public repo; large licensed assets via permitted short-lived private artifacts or source-approved storage, with explicit receipt and SHA-256s.
- Deliver source-original or remuxed mezzanine files first. Use high-quality FFmpeg intermediate (e.g. ProRes or visually lossless H.264 CRF<=15) only if playback/format requires it; do not repeatedly transcode in stages.

## Agent hierarchy and dependency gates
1. **Agent A / Footage Director — START FIRST.** Identify and acquire an eligible 11-shot source pool, confirm a single hero vehicle, validate sharpness/rights/availability and publish an actual handoff with artifact URLs/IDs.
2. **Agent B / Edit Director — START after A source manifest and playable footage exist.** Remotion shot structure, choreography, frame-accurate timing and cinematic transitions. Do not repeat clips.
3. **Agent C / Look / Sound / FX Engineer — can build technical tools in parallel after A's confirmed vehicle/look, but final source-specific grades depend on footage.** Own grading/FX/audio sync and independent visual QA, not B's edit file.
4. **Agent D / Master Integrator / Final QA — START integration after A, B and C handoffs.** Merge branch work, inspect **actual decoded final MP4**, fix issues, final native export and user delivery.

**No agent self-starts in ChatGPT.** Branches and prompts represent readiness; users must separately send the role prompt to each agent/chat. Master may coordinate after verified handoffs; claims of agent work must cite actual commits, CI and artifacts.

## Gates
- Gate 0: Director contract / beat map / all agent prompts in GitHub.
- Gate 1 (A): Per-shot real video identity and visible native contact sheet; license/use permission record, actual source SHA, playable source footage available.
- Gate 2 (B/C): Code/tests, 316-frame timeline, proof MP4/stills, independent technical review.
- Gate 3 (D): Whole 316-frame master + original user audio, 1080x1920/30fps, H.264 yuv420p high bitrate quality, AAC 48kHz stereo, zero black unintentional frames, no source repeats, all beat cuts aligned, full FFmpeg decode PASS.
- Output: `midnight-v12-001-final.mp4` and QC report with frame count/dimensions/duration/audio verification/source SHA/artifact id. Keep video compressed sparingly, no artificial sharpening halos.

## Privacy / rights
Even for private review, sourcing and use permissions matter. For public TikTok publishing, confirm soundtrack rights and video licences independently. The user-supplied soundtrack stays outside public GitHub history and public CI logs.
