# YUNEX / GT3 ENDURANCE MONTAGE 001 — Locked production contract

Date: 2026-10-11. This is a **MULTI-CAR GT3 RACING MONTAGE**, **NOT a Mercedes-only or Lamborghini-only edit**.

## Inputs & artistic goal
- New user-supplied multi-car GT3 Nürburgring reference: `192909.mp4`: 23.312993 seconds, 1280x720 / 30fps HEVC; SHA256 `e465faaf298874ace0d877a231ad07fac4df56557504c6648b650f769851dfa9`. Style/reference ONLY; source originals independently.
- REUSE exactly the user's previously supplied song: `TikTok video #7690925557919403294 [7690925557919403294].mp3`, duration 10.553469 seconds, SHA256 `87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678`. Original MP3 is in the user's current ChatGPT conversation, **NOT stored in repo**. Download `GT3_MULTICAR_REFERENCE_AUDIO_PACK.zip` attachment from project director/user before the final render; the ZIP includes both inputs and a manifest. Absolutely no soundtrack substitutions.
- Multi-manufacturer GT3 racecar grid: Porsche 911 GT3 R (992), BMW M4 GT3 EVO, Mercedes-AMG GT3/GT3 EVO, Lamborghini Huracán GT3 EVO2, Ferrari 296 GT3, Audi R8 LMS GT3 evo II, Aston Martin Vantage GT3, McLaren 720S GT3 EVO, when actual footage exists. 6+ different makes preferred; NO single-model hero throughout.
- Mood: Nürburgring / 24h endurance, noisy, fast, raw, dramatic. Blend long-lens trackside pans, close flybys, cockpit POV, moving pit lane, pack races, night headlights, sunset silhouettes, rear wing, slow-motion and brutal corner exits. Minimal/no text, no oversized HUD, no repetitive angles, no unrelated stock cars, no source watermarks in finished composition.
- The attached reference has many race teams/camera positions, varied daytime, twilight, night, pit, POV and race fan scenes. Use composition and rhythm as inspiration, NOT its watermarked video or exact sequence.

## Output
1. PRIORITY **1920 x 1080 full-bleed landscape, 16:9**, 30 fps, 10.533 seconds (316 frames), H.264 yuv420p AAC 48k. The reference is landscape and prior user rejected black bars; no letterboxed 16:9 inside 9:16.
2. OPTIONAL separate **1080 x 1920 native vertical full-bleed** version only when high-res sources allow reframing without major loss. DO NOT distort aspect ratio or add artificial black bars. Native vertical sources are accepted in library, but for the landscape master they need an approved full-bleed 16:9 crop without materially reducing real source detail.
3. Footage sources: minimum *real decoded* 1920x1080 for landscape or native 1080x1920 for portrait; prefer 3840x2160 / 2160x3840. Upscaling a 720p video DOES NOT meet the 1080p acquisition gate. Inspect actual original clip with ffprobe.
4. Aim source package **30–40 distinct verified moving SHOTS** (distinct camera positions/content, not splitting identical angle into 40 segments); at least 24 usable shots, across >=6 marques and >=3 distinct acquisition films/events or camera feeds, preference for more independent footage. No editorial claim of 30+ unless real assets.
5. Final 10.533s edit aims 18–26 visually unique shots based on actual musical phrase and frame-level transitions; no excessive >1sec dead/static space, no 5 shots recycled.
6. Real vehicle-matched engine sounds: V8/V6/V10/flat-six distinct; use original racing car acceleration, throttle blips, shifts, flybys, pit limiter where visuals match. Be careful not to label generic V10 audio as Ferrari 296 GT3 (V6) or Porsche 911 GT3 R (flat-six). Music stays clear; engine accents punch in only when motivated by visible racing action.
7. Compression: high-quality H.264 CRF 16-18, preset slow or similar; minimize generations of re-encoding. Correct aspect, duration, FPS and soundtrack; run video decode QA + shot-by-shot contact sheets + audio checks before PASS.

## Four-agent ownership (three workers + one manager)
- A: SOURCE + acquire originals, exact car model and quality proof, 30-40 shot package, one ZIP + manifest.
- B: VISUAL + actual Remotion 1920x1080 landscape master project and effects + native shot previews + tests.
- C: SOUND/FINAL + original exact user MP3, appropriate genuine GT3 engine layers, integrate A+B, final MP4 with real QA.
- D: MANAGER + independently track agent evidence, prevent source duplications, verify real final film and update issue/dashboard.

## Critical sequencing
A and B can proceed in parallel. B must not claim visual PASS on sample placeholders. C can assemble a provisional mix with song and sourced engine audio but final render is BLOCKED until A's actual clips, B's implementation and exact song are available. D must treat CI pass and docs-only commits as INCOMPLETE.

## Discrete reference beat framework (adjust upon actual waveform inspection)
0.00–1.30: aggressive high-energy rapid racing opener, 3-4 unique car closeups/flybys
1.30–2.60: cockpit / night / pitlane / fast-pack cut acceleration, 2-4 angles
2.60–3.15: strongest music impact = dramatic full-car or multi-car flyby, major cut
3.15–5.20: camera whip / Nürburgring sweeps / manufacturer intercuts, 4-6 unique angles
5.20–7.25: ultra-intense onboards, close overtakes, curb strikes, sunset highlight, 4-6
7.25–9.40: high-energy climactic montage, 4-6 unique angles
9.40–10.533: clean iconic final car shot, short engine swell or shift timed to music end
This storyboard must follow audio after waveform analysis, not override it.

## Gate definitions
- **A FOOTAGE PASS**: actual 24+ usable full-res diverse shots in one downloadable ZIP + source SHA + model/camera verification + contact sheets. No pretend download/low-res hidden 720p.
- **B EDIT PASS**: real native visuals inspected against source assets, no visible low-res, clipping, duplicate shots, black frames, unnecessary UI.
- **C SOUND/RENDER PASS**: actual exact user music + engine audio + playable final 1080p 30fps MP4, probe/decode/visual/audio QA, true download link.
- **D MANAGER PASS**: independent final-media audit, evidence-backed public progress tracking.
- If above conditions are not met, explicitly report BLOCKED/FAIL, never 'done' just because CI completed.

No file modifications in `YunRah2103/yunus-video-lab`; operate only in `YunRah2103/Remotion-gpt-chat`. Use a new project; don't overwrite older STO, BMW or Porsche work.
