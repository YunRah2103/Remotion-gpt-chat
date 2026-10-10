# HURACÁN STO V10 — Production contract (10 October 2026)

## Mission
Recreate the kinetic rhythm and mechanical-to-driving reveal of the user's supplied 16.207-second Lexus LFA reference, using a **Lamborghini Huracán STO** and the supplied 10.553-second MP3. Do not reproduce the source video's branding, overlays, shots, or engine audio. New film, same high-level structure. Extreme and cinematic, not cheap.

## Source materials (user-supplied, NOT yet uploaded into GitHub)
- Reference file: `192911.mp4`, 1920x1080, 60 fps, 16.207 s, SHA256 `70cbe209e0275b33419cfb52cf291964e4a8dc04a6d24cdeff24a3e414a73025`.
- Original music: `TikTok video #7690925557919403294 [7690925557919403294].mp3`, ~10.553 s, SHA256 `87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678`. The MP3 is only in the original user chat; do NOT pretend it is committed. Request it from the director or use the supplied media pack artifact when available. Do not render a "finished" video with substituted music.
- Visual analysis of reference: starts with rev-counter, physical exhaust/mechanical macro close-ups and tyre motion; later title and real track driving. User wants more aggressive editing than the reference, with genuinely distinct moving angles and engine audio mixed over music.

## Locked film format
- Exactly 316 frames at 30 fps = 10.533 s (the last 0.02 s of the supplied MP3 may be trimmed); 1080x1920 9:16.
- Car: Lamborghini Huracán STO, 5.2L naturally aspirated V10. The STO ONLY. Avoid substituting standard Huracán, EVO, Super Trofeo, Tecnica or Sterrato.
- Delivery: H.264 MP4, yuv420p, high-quality CRF 16–18 / slow or equivalent, AAC stereo 48 kHz, actual audio/music present.
- Key reveal around 2.60 s; select precise shots from waveform and native visual test, not guess-based automated beats.
- 10+ genuinely distinct *camera-angle* moving shots where footage permits; target 11–14. No fake angle by slicing one long stationary shot into different ranges.
- Prioritise true vertical crop detail (native 9:16 or ≥3840x2160 landscape preferred). A 1920x1080 landscape crop has only ~608x1080 useful pixels: do not mislabel upscaled footage as native 1080x1920.
- Style: mechanical tension → decisive full-car reveal → fast track rolling, rear-wing details, night reflections if available → hero finish. No large HUD, stats panel, glitch spam, copied Lexus branding or tacky text. Car ALWAYS hero.
- Music + authentic STO engine: real rev/start/acceleration/shift/downshift/cabin or exterior recordings; source/rights tracked. Start with punchy V10 rev and blend music without masking song; reintroduce engine transient at 2.6 s and key visual shifts. NEVER use another model engine and call it the STO.
- Existing tooling: Remotion 4.x, FFmpeg/FFprobe, existing Cinematic FX Toolkit (inspect actual integrated paths), footage-finder workflow. Do not write an alternative FX engine unless necessary.

## Shot rhythm (provisional; actual sources control)
0.00–0.45 tach/start button detail / rev + engine rise
0.45–1.15 exhaust/engine macro
1.15–1.85 aero/rear wing mechanical close-up
1.85–2.60 dashboard/wheel/pre-launch build
2.60–3.18 full front-three-quarter on-track reveal (major impact)
3.18–3.76 side rolling pursuit
3.76–4.48 head-on approach or corner exit
4.48–5.22 wheel/bodywork motion macro
5.22–6.08 hard acceleration rear three-quarter
6.08–6.86 fast high-angle/side camera (distinct source)
6.86–7.72 night/reflective street rolling shot IF source can be verified
7.72–8.55 fast sweeping corner/car-on-track
8.55–9.48 aggressive rear chase/low track camera
9.48–10.533 clean hero payoff / hard musical end
If no same-variant night footage, use distinctive twilight or dark-grade track footage instead; never claim daylight is night, never substitute the wrong model.

## Gates
**Gate A — footage**: 10+ genuine distinct moving angles, 4K or native vertical where possible; a real manifest identifying model, source URL, permission, exact in/out, FFprobe actual format and crop test. Packaging and preview contact sheets. FAIL if fewer than 8 usable distinct angles or obvious mismatch.
**Gate B — edit**: validated shot map, actual native frames/proof, transitions/music timing; no low-quality source, repeated angle or visual clutter. FAIL if only code/CI.
**Gate C — sound & output**: actual source WAV/MP3 and verified real STO engine, audible stems, rendered 1080x1920/30 H.264/AAC MP4, full-film decoded contact sheet, blackframe and silence inspection, unique shots. FAIL without playable media.
**Gate D — independent QA**: manager validates A/B/C artifacts and final playable film. Green CI alone proves neither quality nor completion. Report BLOCKED, NOT STARTED, IN PROGRESS, PASS honestly.

## Team
A: footage source + asset delivery. B: creative Remotion edit. C: sound mix, integration, final render. D: independent progress manager and last-look QA (does not overwrite workers).
Each agent has its own branch; all share this contract. No agent is auto-launched by GitHub branches; user must start connected ChatGPT chats or an explicitly configured automation.
Never modify `YunRah2103/yunus-video-lab`.
