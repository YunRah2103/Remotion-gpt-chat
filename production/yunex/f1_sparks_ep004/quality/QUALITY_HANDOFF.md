# EP004 QUALITY V2 — Handoff for director and existing editor
**22 Oct 2026: coordination infrastructure only; NO agents automatically started and NO new renders claimed.**

- Dashboard: https://github.com/YunRah2103/Remotion-gpt-chat/issues/234
- Kit V2 (genuine current source): https://github.com/YunRah2103/Remotion-gpt-chat/pull/233 (base commit `d5816b9856314fd5f2d46335ee6ae9b8182ab71f`, source is included in the isolated branch)
- Quality base: `production/yunex-ep004-quality-v2` (contract commit `1c3181ef90f0572b08eb49a01bfd36699d023091`)
- Quality contract: `quality/QUALITY_CONTRACT.md`
- Existing EP004 source A1–A5 on parent manager dashboard #215; existing Agent 6 editor PR #223; original accepted six-shot silent film GitHub Actions run #39620074977, 420 frames. It is NOT a finished original-VO film.
- The owner-supplied **original EP004** Cedar MP3 duration 25.248s has NOT been made available in the repo/workflow; user was provided a prior handoff ZIP. Estimated transcript timing is not a verified forced word alignment. Preserve original voice; do not fake it.

## New four independent workstreams
1. **Agent 8** Issue #235, branch `agent/ep004-08-kit-hero`. PREMADE kit `createCinematicVehicle/animateCinematicVehicle`, real cinematic Formula hero, original EP004 metal skid geometry adapter. `quality/vehicle/**` owner.
2. **Agent 9** Issue #236, branch `agent/ep004-09-spark-look`. Render only real A2 particles/signed-gap metal skid impacts, no kit contact-sparks. `quality/sparks/**` owner.
3. **Agent 10** Issue #237, branch `agent/ep004-10-camera-action`. Six moving 9:16 director rigs with strong opening/payoff, no blank asphalt, real V2 hero and authentic contact. `quality/cinema/**` owner.
4. **Agent 11** Issue #238, branch `agent/ep004-11-night-world`. Kit V2 night environment + premium lighting while preserving *only* Agent4 physical drivable road, no duplicate track. `quality/look/**` owner.

**New agents = separate ChatGPT sessions**, not automatically scheduled processes or magical GitHub issue-triggered builds. Start prompts in `quality/LAUNCH_PROMPTS.md`.

## Source integration approval
- Agent 0 evaluate actual PR source, test, native moving MP4, high-resolution screenshots from first/middle/end, motion hashes, before/after film; **reject** technical-only passes with weak visual results. No automatic approval.
- Agent 0 can selectively approve & merge four PRs into isolated quality base only after each is reviewed; leave upstream kit branch #233 and original EP004 base unmodified.
- The four agents must expose reusable interfaces and honour one authoritative vehicle pose, science skid descriptors, contact physics and route. Integration test physics signed-gap vs visible skid vs road geometry. Verify full film before handing to editor.
- Existing **Agent6** PR #223 receives approved quality modules via a **non-destructive source sync**, keeps actual original voice, validated per-word cues, ~758 native frames for 25.248 seconds at 30fps, both captioned/clean with ffmpeg full decode/audio correlation/safe subtitles. Never just attach the 25s voice to 420 frames or use estimated word timings as verified.
- Owner needs to judge full moving picture before picture lock; only then original Agent7 sound design and final mastered MP4 with stems.
