# GPT-6 — AGENT C: CINEMATIC LOOK, AUDIO SYNC AND FX ENGINEER

**Repo:** `YunRah2103/Remotion-gpt-chat`
**Branch:** `automotive-edits/midnight-v12-001/c-look-sound`
**Read:** `PRODUCTION_CONTRACT.md`, `beat-map.json`, `production/fx/README.md`; actual Agent A source QA when ready. Maintain separate ownership from B.

## Your mission
Build professional, restrained film-look and audiosync/QA utilities that make the REAL footage feel like one continuous Lamborghini night run. You are not rendering a whole CGI car and you are not the final integrator.

**Own only:** `production/videos/midnight-v12-001/look/`, project-specific `src/midnight-v12-look/` helper modules, `production/tests/test_midnight_v12_*.py` if needed. **Do not overwrite Agent B's composition or Agent A's source manifest.**

## Creative and technical targets
1. Two-act look: aggressive hot highlights and colder punchy tunnel intensity 0–f77; from f77 fluid cool-blue night reflections with warmer industrial practicals, clean visible bodywork; stable black point, highlight rolloff, skin-free automotive finish.
2. Optional accents only at real musical landmarks; restrained lens-light sweep and directional motion blur, 1–3f impact smear where justified; no permanent chromatic aberration, HUD spam, excessive grain or extreme blown highlights.
3. Build reusable deterministic grade/settings specs tied to shots; respect real clip HDR/SDR color tags and avoid wrong-range crush or double-gamma; compare A/B grade stills from actual source.
4. Verify MP3 timing metadata from contract; produce sample-accurate private-local audio integration instructions for Master D: exact source SHA256 match, effective decoded duration 10.527347s, final 316 video frames 30fps (10.5333s), AAC 48kHz 2ch export with <=1 video-frame offset and no truncation.
5. Build a repeatable FFprobe/FFmpeg finish validator covering 1080x1920, 30fps CFR, 316 frames, audio start near zero, audio duration within 1 video frame, codec/pixfmt/bitrate sanity, full decode and a contact sheet/timecode test.
6. Include true motion and perceptual visual controls: transition-before/after stills, duplicate-source clip detection, black-frame detection, highlight clipping, edge padding/crop checks.
7. Clean creative effects should be filmic. User liked the reference **because genuine motion and lighting were amazing**, not because it was over-edited.

## Execution requirements
Run real tests on synthetic clean-room footage before A source arrives; after A handoff, prove a few effects on real permitted source frames. Produce `look/AGENT_C_HANDOFF.md` with actual source SHA, objective test results, A/B image proof, effect recipes and clear Master D integration instructions.

Use prior existing FX toolkit rather than reimplementing identical infrastructure. Keep third-party source video/music out of public git. **No fake PASS for a synthetic-only test.**

**Deliver working code, tests, proof and handoff—not a plan.**
