# GPT-6 — AGENT C: CINEMATIC LOOK, AUDIO SYNC AND FX ENGINEER

**Repo:** `YunRah2103/Remotion-gpt-chat`
**Branch:** `automotive-edits/midnight-v12-001/c-look-sound`
**Read:** `PRODUCTION_CONTRACT.md`, `beat-map.json`, `production/fx/README.md`; actual Agent A source QA when ready. Maintain separate ownership from B.

## Your mission
Build professional high-impact, aggressively cinematic grade/FX/sound QA utilities for a **rare exotic hypercar**, not a slow Lamborghini night luxury film. You are not rendering a whole CGI car and you are not the final integrator.

**Own only:** `production/videos/midnight-v12-001/look/`, project-specific `src/midnight-v12-look/` helper modules, `production/tests/test_midnight_v12_*.py` if needed. **Do not overwrite Agent B's composition or Agent A's source manifest.**

## Creative and technical targets
1. Two-act look: harsh aggressive intensity until f77; after f77 keep the energy and exotic aero spectacular despite melodic vocals. Base grade on the REAL source location (night/track/urban), not a compulsory blue tunnel.
2. Build audacious but clean impacts: 2–4f whip/zoom crash, speed ramp, tight 1–2f flashes, strong lighting transitions on real beats. Do not conceal the car; avoid cheap constant glitches, permanent RGB offsets, HUD spam or blown highlights.
3. Build reusable deterministic grade/settings specs tied to shots; respect real clip HDR/SDR color tags and avoid wrong-range crush or double-gamma; compare A/B grade stills from actual source.
4. Verify MP3 timing metadata from contract; produce sample-accurate private-local audio integration instructions for Master D: exact source SHA256 match, effective decoded duration 10.527347s, final 316 video frames 30fps (10.5333s), AAC 48kHz 2ch export with <=1 video-frame offset and no truncation.
5. Build a repeatable FFprobe/FFmpeg finish validator covering 1080x1920, 30fps CFR, 316 frames, audio start near zero, audio duration within 1 video frame, codec/pixfmt/bitrate sanity, full decode and a contact sheet/timecode test.
6. Include true motion and perceptual visual controls: transition-before/after stills, duplicate-source clip detection, black-frame detection, highlight clipping, edge padding/crop checks.
7. Director override: EXOTIC + AGGRESSIVE, not a subtle lifestyle spot. Rare hypercar form and fiercely exciting real motion come first, effective hard impacts second.

## Execution requirements
Run real tests on synthetic clean-room footage before A source arrives; after A handoff, prove a few effects on real permitted source frames. Produce `look/AGENT_C_HANDOFF.md` with actual source SHA, objective test results, A/B image proof, effect recipes and clear Master D integration instructions.

Use prior existing FX toolkit rather than reimplementing identical infrastructure. Keep third-party source video/music out of public git. **No fake PASS for a synthetic-only test.**

**Deliver working code, tests, proof and handoff—not a plan.**
