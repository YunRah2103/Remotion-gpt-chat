# BMW M5 G90 — BEAT CUT EDIT 001
## Contract · two specialist agents · 20-second actual TikTok video

**Repository:** YunRah2103/Remotion-gpt-chat. **YUNEX off-limits:** never access/modify YunRah2103/yunus-video-lab.
**Proven existing moving-video source:** automotive-edits/car-video-collage-001 @ e8f17c9ef5cc48b143b21d3cc4d8007861097464.
**Working branches:** Agent A automotive-edits/bmw-m5-g90-001/a-footage; Agent B/editor+integrator automotive-edits/bmw-m5-g90-001/b-editor-master.

### NON-NEGOTIABLE creative requirement: ONLY BMW M5 G90 SALOON

Use actual **latest-generation BMW M5 G90 sedan/saloon** (seventh generation, introduced for 2025). Distinguishing cues include broad rear arches, G90-style front/rear, updated large BMW kidney grille, current M5 lights. Explicitly NO previous F90, NO G99 Touring/wagon, NO M4, no other brand. Maintain consistent paint/finish if source choices permit. Never add footage of another car during transitions.

Reference only for accurate generation identification: https://www.press.bmwgroup.com/usa/article/detail/T0443395EN_US/the-all-new-2025-bmw-m5 and https://www.bmw-m.com/en/all-models/overview-m-and-m-performance/bmw-m5-sedan/2024/bmw-m5-sedan.html . This reference does NOT grant rights to redistribute BMW press footage.

### Video and music

20.000s, 1080x1920, 30fps, exactly 600 frames, H.264 MP4 with AAC only when rights allow.
User supplied 61s music MP3 in their ChatGPT conversation; do not assume the file exists in GitHub.
Candidate music trim: original timestamp 12.21s → 32.21s (20.00s) for a strong ~117.45 BPM section.
A **real detected beat frame-grid is committed in beat-map.json** (39 cuts; clips change every ~15–16 frames). These timings are editorial first-pass candidates, not guaranteed ear-perfect sync; Agent B must inspect actual audio and correct grid only with evidence, preserving cut-on-every-beat.
Original uploaded MP3 SHA256 f3ef6669a88ebe0420587067bf0b03d03e949f73b2fd0fd6567b4bf33e299f0d.
**Licensing:** user's possession/upload is NOT proof of rights for public music redistribution. Do not commit copyrighted sound to public repo or publish soundtrack publicly without authorization. A render with only visual footage may be delivered first, plus an offline/local synced version if appropriate.

### Cut sequence / visual identity

**0–4 seconds:** breathtaking M5 G90 introduction; begin on distinctive front lights/grille; mix full-frame power angles, rear, side tracking. Immediate movement in every frame.
**4–9 seconds:** fast rolling/driving hero footage, close wheel & rear diffuser, front three-quarter; dynamic matched direction cuts.
**9–14 seconds:** energetic montage, controlled zoom punches, acceleration, tonal flashes on 4/8-beat accents while still changing clip on *every* beat.
**14–18 seconds:** strongest kinetic section; dramatic night/city/track-looking footage only if authentic/authorized, don't fake locations.
**18–20 seconds:** two-to-four final beat swaps finishing on a magnificent M5 G90 hero motion shot. Clear punchy out.

Premium automotive editorial styling inspired by prior photo + moving-video collages in this repo: deep shadows, refined charcoal/titanium grading, intentional asymmetric panels only where they help rhythm, high contrast, understated one-word M5/G90 accents, no constant repeated templates, avoid dead space and unreadable HUD.
A new clip/shot/angle must replace visual content ON EVERY BEAT. Avoid stale frames, disguised photo animation, fake slow-motion duplicates or repeating identical 0.5s loops. Beat transitions can vary (hard cut, cut-on-motion, masked wipe, restrained whip, half-frame flash), but never obscure the car.

### Task ownership and interfaces

A — footage sourcing, generation verification and source licensing. Own only production/videos/bmw-m5-g90-beat-001/footage/**, handoffs/agent-a.json + .md. Publish real video source URLs, original owner/license, model ID confidence/evidence, clip properties, SHA256s, approved direct URLs/artifact IDs, exact 39-slot shot assignment, and honest missing slots. Save binary clips as workflow artifact, not Git history. Source URLs are not sufficient for reuse rights; evidence must show intended video redistribution is licensed. No full final render.
B — Remotion editorial direction, beat-sync, scene composition, FFmpeg, render/QA, integration; own src/bmw-m5-g90-beat/**, per-film editor tooling, handoffs/agent-b.json + .md, and ONLY B edits src/Root.tsx and any central rendering workflows. Reuse Remotion/FFmpeg from the car-video collage branch. Wait for verifiable footage handoff. Render full 600 frames with correct cut grid + clean audio mixing if permissions established. Independently QA the 39 cuts, motion within each clip, car generation identity, no black frames, decoder and audio sync.

### Hard integration checks

- Each of 39 beat slots maps to a real, approved and G90-verified driving shot, with visible motion and sufficient source FPS.
- Split up source videos into different legitimate segments rather than reusing identical 0.5-second chunks; all source URLs/creators/licences recorded.
- Dedicated frame-accuracy checker validates cut IDs, no gaps and exact last frame 599. Beat-slop within 1 source video frame is acceptable only when reviewed against true kick/snare.
- Mandatory representative stills and actual 20s video review, with phone-safe zones for type/important car elements.
- No public release of an unlicensed commercial soundtrack. Do not claim access to uploaded private audio from GitHub.
- Final 20s 1080×1920 @30fps native MP4, decoded FFmpeg and real GitHub Actions artifact, source SHA and 2 completed handoffs. Video cannot be called delivered before a validated file exists.
- If licensed G90 sources cannot be secured, report the blockage instead of lying that another BMW is the G90.

**Both AI agents must be launched explicitly in separate ChatGPT sessions.** Branches and prompts do not auto-start work.
