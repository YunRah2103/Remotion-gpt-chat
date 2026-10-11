# Agent C — V14 corrected 3-second sound and *actually retimed the video*

11 October 2026 · Agent C · YUNEX GT3 Multi-Car 001 · User review, not final approved.

## User feedback and correction

User clarified that the disliked mechanical sound occurs **at three seconds** (not *the third sound*). Removed the previously added BMW / GT3 source-audio excerpt **3.433–4.333 seconds** entirely. The new engine stem is numerically ZERO over 3.000–4.330 seconds. That visual segment uses **music only**.

User also explicitly requested video cuts be touched so the movie synchronizes to the soundtrack. Accordingly this release is **not an audio-only remux**: 16 actual clip boundaries were reconformed and the moving video was fully re-encoded at native 1920×1080.

## Physical deliverable

- Actual MP4 produced: `YUNEX_GT3_V14_BEATLOCK_NO_3SEC_MECHANICAL_1080P.mp4`
- MP4 SHA-256 `1878537fa9e8b048fb7715c9af6df9f025a67dee8057005a311f4b41b7f7b637` · 21,433,457 bytes.
- H264/yuv420p **1920×1080 @ 30 fps**, 466 video frames / 15.5333 seconds · AAC stereo **48kHz 320kb/s**.
- Full FFmpeg audio+video decode **PASS**; no blackdetect intervals >= 0.07s.
- Actual video and 31.61MB handoff ZIP delivered through ChatGPT; **not** GitHub Actions video artifacts. Handoff ZIP SHA-256: `e5da7db20efed809e713886286518fbea01848cf5560cb82389fa4427011b2ab`.

## Moving video cut re-timing

**Sixteen** shot cuts moved by 1–3 frames to detected original soundtrack spectral-flux accents, without reordering or replacing race footage. Edited frame pairs (old→new):

`34→35; 43→44; 76→77; 86→87; 103→105; 130→131; 155→156; 261→263; 279→280; 296→297; 311→313; 327→328; 344→342; 367→368; 400→398; 447→446`.

The **median absolute music-accent error on moved cuts decreased from 1.3 to 0.3 frames** (at 30fps). Each shot has been recomposed to its new length using ordinary temporal resampling without transitions, image generation or scene reordering. Entire movie remains **466 frames**.

Agent B V11's four already-beatlocked Porsche pit edit anchors **174, 201, 227, 246** remain **unchanged** so arrival → pneumatic wheel service → pit exit → racing return retain their audio sync.

## Music, approved pit audio, real racing engines

- User's original Agent B V11 chosen song, original beat times untouched.
- Keep the previously liked Porsche pit/wheel FX from Agent C V10 at **5.8–7.5 seconds**.
- Only three sparse real trackside GT3 racing-pass snippets: Ford on screen frames **17–34**, Mercedes-AMG frames **263–279**, Aston Martin frames **385–397**.
- No mechanical sound cue at 3s, no synthetic engine FX, whooshes, bass hit FX, extra vocals or replacement soundtrack.
- Racing snippets derive from Freesound 556039 CC0 ZOOM H6 GT3 race *multi-car* recording (SHA256 `10a9fcc79de6a003eecd575518b4498ba75b52e1ff04c19907d1b44d3e8bd14a`). They are genuine recorded race audio but cannot be identified as the exact same individual cars as the visuals.

## Reproducibility and status

ChatGPT handoff ZIP contains the full user-review video, 24-bit 48kHz separate stems (music, engines, pit), mix, full source code `build_v14_cut_sync.py`, FFmpeg cut filtergraph, 25-shot visual QA contact and JSON machine-readable cut-shift QA.

**Status: RENDERED, FULL DECODE PASS, USER AUDIO/VISUAL APPROVAL PENDING.** Do not treat a passing technical gate as subjective approval. Do not reintroduce the rejected 3.433–4.333s mechanical sound.
