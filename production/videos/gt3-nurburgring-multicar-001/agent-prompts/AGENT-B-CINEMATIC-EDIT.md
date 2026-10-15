# GPT-6 — AGENT B: MULTI-CAR GT3 Creative Cinematic Editor

Repo: `YunRah2103/Remotion-gpt-chat`
Own branch: `automotive-edits/gt3-nurburgring-multicar-001/b-cinematic`
Contract: `automotive-edits/gt3-nurburgring-multicar-001/contract`. Read project `PRODUCTION_CONTRACT.md` and `FOOTAGE_DISCOVERY.md`, and inspect existing Remotion components and Cinematic FX Toolkit. Do not touch separate repo `YunRah2103/yunus-video-lab`.

Build a true high-end 16:9 **MULTIPLE GT3 CARS** edit, NOT a single car highlight.

### Design
- Source reference: `192909.mp4` (23.31sec 1280x720 Nürburgring multi-car montage) in user's `GT3_MULTICAR_REFERENCE_AUDIO_PACK.zip`. Inspiration for structure only; do not directly use watermark-bearing reference frames.
- FINAL FIRST MASTER: 316 frames, 30fps, 1920x1080 full-bleed, no black bars. Original user soundtrack is ~10.553s and C will handle it; B must stay beat-aware.
- 18–26 unique genuinely DIFFERENT race action shots across 6+ different GT3 makes, supplied by A. Fast montage that alternates Porsche, BMW, Mercedes, Lamborghini, Ferrari, Audi, Aston Martin, McLaren according to best actual footage, with look variety (night, sunset, pit, cockpit, pack, flyby). No 5 shots repeated, no fake pan on still images. Edit should move and feel FAST.
- Premium transitions: cut-on-motion, trackside whip, right/left directional movement match, 2–3-frame impact flashes only on big accents, adaptive speed ramps, tasteful crash zoom, lens-bloom/grade, slight filmic motion blur, occasional tasteful monochrome bridge. Do NOT add big label cards, expensive-looking but tacky HUD or cycling manufacturer logos.
- Start visually hard, quickly build to explosive first big reveal near ~2.6s. End on a dramatic clean shot synced to the actual song.
- Colour/brightness balance coherent across disparate camera sources; explicitly sample nighttime shots to ensure real blacks, not murky pixels. Preserve true source dynamic range and avoid too-strong sharpen.
- Reuse actual FX toolkit only after inspecting its current repository paths. No new toolkit rewrite.
- Develop data-driven shotmap including actual file path, marque, lens/camera type, time in/out, crop, positional motion, exact beat frame/crossfade semantics. Check clip existence/duration, trim buffers, uniqueness, output frames, aspect, model mix, and proper transitions.
- Render representative native frame strips and visual sample, only mark Gate B PASS after real Agent A assets are integrated/inspected. Placeholder visual tests PROVISIONAL. Commit real code/QA evidence and handoff to C with exact branch SHA, steps and artifact paths. Report to D.

Note: native portrait clips are allowed in source collection, but do not introduce pillarboxing. Use an uncropped landscape composition only when quality allows; otherwise leave it for a separately rendered 9:16 alternate.
