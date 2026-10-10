# Porsche 911 Turbo Evolution 001 — four-agent production contract

**Mission:** Produce an extraordinary, high-detail, beat-accurate 17-second vertical video evolution edit through Porsche **911 TURBO** chassis eras. Four separate agents total: A authentic footage, B creative Remotion timeline, C transitions/grade/technical polish, D master integration and final 510-frame output.

**Repository:** `YunRah2103/Remotion-gpt-chat`. **Never access or modify** `YunRah2103/yunus-video-lab`.
**Approved creative reference:** BMW M5 V2 clean private review, base branch `automotive-edits/bmw-m5-evolution-001/c-master`, commit `e8f31e0872f6adef3796963a99078b6a8b21bdd6`. Reuse its reliable moving-video shot validation, detail-preserving vertical crop strategy and original frame-accurate cut design. **DO NOT copy the BMW itself, its clips, audio, completed film or BMW labels.**
**Film:** 510 native frames, 17.000 seconds, 1080×1920, 30fps, H.264, AAC 48k when approved audio is supplied.
**Song:** user's uploaded True Adam MP3 (17.057959s). Original SHA256 `5c83d4d0e1d8dbd86bb141855c21e56c627b2fce5b5cf62ddef75432c3f4d52c`. Selected 17-second original-speed 48kHz master SHA256 `39b8d7eef63b1c67cb14108484de8a63508149f64b6d3b84b7f7252dcd0bcdc9`. Audio binary is available only by separate user-supplied private pack, NEVER automatically from this GitHub repo.

## 1. Authentic Porsche Turbo eras, oldest to newest

Porsche newsroom Turbo history: https://newsroom.porsche.com/en/press-kits/50-years-porsche-turbo/The-911-Turbo-generations.html
Porsche history: https://www.porsche.com/stories/innovation/brief-history-of-porsche-911-turbo/

- **930** (introduced 1974): slots 01-04, 4 unique moving shots
- **964** (introduced 1991): slots 05-08, 4 unique moving shots
- **993** (introduced 1995): slots 09-12, 4 unique moving shots
- **996** (introduced 2000): slots 13-16, 4 unique moving shots
- **997** (introduced 2006): slots 17-20, 4 unique moving shots
- **991** (introduced 2013): slots 21-25, 5 unique moving shots
- **992** (introduced 2020): slots 26-30, 5 unique moving shots

These are seven **chassis eras**, not a claim Porsche officially counts only seven Turbo iterations. Porsche also distinguishes early 930 3.0/3.3 among its eight Turbo generations; both can appear only when correctly identified as 930. The first year is an introductory reference, not necessarily the date of each source video. The G-model Turbo was introduced in 1974. Use 992.1 or 992.2 Turbo/Turbo S based on actual footage and correct identification, not speculative new 993 or GT3.

STRICT: only real Porsche 911 **Turbo or Turbo S** coupes of the correct chassis era. No Carrera (including 4S), GT3, GT3 RS, GT2, Boxster, Taycan, replicas, unrelated 911, still-photo CGI zoom, Gran Turismo/BeamNG game footage unless user explicitly authorises that creative change. Exclude open-top variants for identity continuity except where specially accepted by Master.

## 2. Audio-derived beat map: measured, not guessed

Music detected ~**103.36 BPM**, ~**0.575s beat spacing**. 30 slots at 30fps; exact frame starts and generation assignment in `beat-map.json`, no gaps, end at frame 509. Clip change every beat (including first intro frame). Frames are rounded candidates; D must genuinely listen/inspect the actual audio waveform to confirm perceived kicks/snare/phrase and adjust ±1–2 frames if needed, documenting adjustments and updating validators. Do not move a generation transition off-beat or insert an extra still frame. This is an audio-led edit, not seven slow slideshow sections.

## 3. Film aesthetics — match the successful BMW M5 V2

- **Footage first**: real, different moving Porsche per beat, never repeat the same shot under a new crop or fake still animation. A must provide 30 visually different sources or camera setups/time periods; six near-identical slices of one source are NOT six unique shots. Video motion must be visible.
- **Simple clean labels**: `930`, `964`, `993`, `996`, `997`, `991`, `992`, plain white, small, upper left; change ONLY at chassis era chapter start. NO intro slogans, bars, box outlines, progress counters, background HUD, techno interface, noisy graphics, oversize title, huge year text.
- **Beat-perfect edits**: primary cut to next real moving video on every beat, with occasional **restrained and non-disruptive** camera-matched micro-transition on selected chapter changes. For tiny clip durations (14–18 frames), excessive blur/whip/crossfade hides the next car, so require at least half the shot visibly clear.
- Match nose → nose, side → side, tail → tail, rotating wheel → wheel when authentic source allows; dramatic 930 old-school introduction, natural intensification to modern 992.
- Keep vintage source detail intact. Early 930/964/993 footage may be inherently low-res: **don't stretch SD to fake 4K**. Center moving picture, use dark softly blurred SAME-SOURCE background when necessary. Minimise extra transcodes, preserve 4K source as high as possible, target clean x264 CRF 15–17 / preset slow where compute permits; final AAC 48k 256–320kbps. Strict subjective sharpness QA.
- Avoid heavy global teal/orange LUT, artificial oversharpen, overcompressed flats, repeated footage, ghosting and black frames. Grade vintage naturally; keep 992 modern detail vivid.

## 4. Four-agent branch responsibilities and conflict isolation

**Agent A — Footage Director:** `automotive-edits/porsche-911-turbo-evolution-001/a-footage`. Own `production/videos/porsche-911-turbo-evolution-001/footage/**` + `handoffs/agent-a.{json,md}` only. Find source footage, verify generations and Turbo spec, prove **30 unique actual moving views**, record highest-available source resolution/URL/provenance/rights/clip interval/SHA256, create actual artefacts/contact sheets. Prefer 4K originals for full-height landscape crops. Authentic old-gen sources may be lower-resolution; preserve natural quality without fabrication. No fake media links.

**Agent B — Creative Film Editor:** `automotive-edits/porsche-911-turbo-evolution-001/b-creative`. Own `src/porsche-turbo-evolution/edit/**`, `production/videos/porsche-911-turbo-evolution-001/edit/**`, `handoffs/agent-b.{json,md}`. Build real Remotion timeline, per-frame cut system, clean upper-left generation labels, depth/crop direction, selective chapter jump cuts; expose typed clip manifest adapter and code tests. Can build diagnostics pending A, but diagnostic frames must never be labeled finished video.

**Agent C — Transition / Grading / Visual Quality:** `automotive-edits/porsche-911-turbo-evolution-001/c-transitions`. Own `src/porsche-turbo-evolution/polish/**`, `production/videos/porsche-911-turbo-evolution-001/qa/**`, `handoffs/agent-c.{json,md}`. Build footage-independent deterministic edit effects and safe colour tools (match cut alignment, minimal punch/flash controls). Compare early/late era shots, prevent chroma/ringing/compression, frame crop/quality regression. Provide **native actual proof** when source accessible. Do not overdecorate accepted clean V2 look.

**Agent D — MASTER final integrator and delivery:** `automotive-edits/porsche-911-turbo-evolution-001/d-master`. Only D owns `src/Root.tsx`, shared integration scene, central package/workflow changes, audio synchronization, final render and release QA. Validate the 3 specialist handoffs; integrate exact commits/artifacts, stage private audio (only via explicit user transfer, no fake GitHub access), create actual full 510-frame 1080x1920 H.264 MP4, inspect full video + frames, fix issues and deliver real downloadable PRIVATE REVIEW artifact. D must not pretend to have automatic tool-to-tool files unless actually acquired.

## 5. Source and publishing constraints

This is a **private review** first. User previously preferred obtaining excellent real footage without delaying production for licensing research. Prioritise real source quality but record source identity, source URLs, creator/rights. Public website videos and commercially released soundtracks are NOT automatically free for redistribution; no public GitHub Release, TikTok, YouTube, or repo binary commit unless rights are confirmed. No DRM circumvention, paywall bypass, site-access circumvention or false licenses. Source provenance is not legal clearance.

## 6. Concrete QA gates

A: 30 visual camera setups that differ (not just non-overlapping timecodes), 7 Turbo chassis identity proven; 30 moving clips accessible as verified private GitHub Actions artifacts or user-approved transfer. FFprobe source format/dimensions/fps, original SHA, contact sheets at full source quality.
B: 510 contiguous frames, 30 beat-slot changes, correct codes upper-left, source-file provenance checks, truly moving `OffthreadVideo` not stills, usable frame crop for SD and UHD, native Remotion proof.
C: native edit effects preview, A/B shot detail review, colour grading prevents oversharp/watermark, actual source sharpness graded honestly; no unreviewed showy transition.
D: checks exact combined source SHAs, duration 17.0 seconds, 1080x1920 @30fps, frame count 510, complete FFmpeg decode, 48k stereo AAC if audio present, source rights, every beat cut actually changes to a different visible moving shot, no off-gen Porsche, no black/frozen frames, M5-grade typography (only white small label), final original music sync. **Watch the actual video**; tests alone are never artistic approval.

Handoff JSON must comply with `production/tools/handoff.py`: owner A=`research`, B=`director`, C=`qa`, D=`release`, actual post-work SHA, genuine evidence and links. Placeholder handoffs initially BLOCKED, no fictitious completion.

**Agent profiles and branches don't start agents automatically.** User launches four separate GPT-6 sessions, using the committed agent prompts. The initial project setup is NOT a finished MP4.
