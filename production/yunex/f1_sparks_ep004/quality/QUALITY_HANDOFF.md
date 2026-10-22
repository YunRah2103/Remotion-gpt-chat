# EP004 QUALITY V2 — Handoff for director and existing editor
**22 Oct 2026: coordination infrastructure only; NO agents automatically started and NO new renders claimed.**

- Dashboard: https://github.com/YunRah2103/Remotion-gpt-chat/issues/234
- Kit V2 (genuine current source): https://github.com/YunRah2103/Remotion-gpt-chat/pull/233 (base commit `d5816b9856314fd5f2d46335ee6ae9b8182ab71f`, source is included in the isolated branch)
- Quality base: `production/yunex-ep004-quality-v2` (contract commit `1c3181ef90f0572b08eb49a01bfd36699d023091`)
- Quality contract: `quality/QUALITY_CONTRACT.md`
- Existing EP004 source A1–A5 on parent manager dashboard #215; existing Agent 6 editor PR #223; original accepted six-shot silent film GitHub Actions run #39620074977, 420 frames. It is NOT a finished original-VO film.
- The owner-supplied **original EP004** Cedar MP3 duration 25.248s has NOT been made available in the repo/workflow; user was provided a prior handoff ZIP. Estimated transcript timing is not a verified forced word alignment. Preserve original voice; do not fake it.

## Five independent workstreams
1. **Agent 8** Issue #235, branch `agent/ep004-08-kit-hero`. PREMADE kit `createCinematicVehicle/animateCinematicVehicle`, real cinematic Formula hero, original EP004 metal skid geometry adapter. `quality/vehicle/**` owner.
2. **Agent 9** Issue #236, branch `agent/ep004-09-spark-look`. Render only real A2 particles/signed-gap metal skid impacts, no kit contact-sparks. `quality/sparks/**` owner.
3. **Agent 10** Issue #237, branch `agent/ep004-10-camera-action`. Six moving 9:16 director rigs with strong opening/payoff, no blank asphalt, real V2 hero and authentic contact. `quality/cinema/**` owner.
4. **Agent 11** Issue #238, branch `agent/ep004-11-night-world`. Kit V2 night environment + premium lighting while preserving *only* Agent4 physical drivable road, no duplicate track. `quality/look/**` owner.

**New agents = separate ChatGPT sessions**, not automatically scheduled processes or magical GitHub issue-triggered builds. Start prompts in `quality/LAUNCH_PROMPTS.md`.

## Source integration approval
- Agent 0 evaluate actual PR source, test, native moving MP4, high-resolution screenshots from first/middle/end, motion hashes, before/after film; **reject** technical-only passes with weak visual results. No automatic approval.
- Agent 0 can selectively approve & merge five PRs into isolated quality base only after each is reviewed; leave upstream kit branch #233 and original EP004 base unmodified.
- The four agents must expose reusable interfaces and honour one authoritative vehicle pose, science skid descriptors, contact physics and route. Integration test physics signed-gap vs visible skid vs road geometry. Verify full film before handing to editor.
- Existing **Agent6** PR #223 receives approved quality modules via a **non-destructive source sync**, keeps actual original voice, validated per-word cues, ~758 native frames for 25.248 seconds at 30fps, both captioned/clean with ffmpeg full decode/audio correlation/safe subtitles. Never just attach the 25s voice to 420 frames or use estimated word timings as verified.
- Owner needs to judge full moving picture before picture lock; only then original Agent7 sound design and final mastered MP4 with stems.

5. **Agent 12** [Issue #239](https://github.com/YunRah2103/Remotion-gpt-chat/issues/239), branch `agent/ep004-12-motion-graphics`. Premium subtitle styling / minimal data-grounded 3D material callouts / aero and skid-contact UI. `quality/graphics/**` exclusively; all other original A5 and A6 text interfaces remain intact.

**Important caption integration rule for Agent 6:** Agent12 `QualitySubtitleOverlay` must be a *single optional substitution* for the pre-existing `PictureEdit` word subtitle output, never additive simultaneous duplicate captions. Take **only verified word timing from genuine original Cedar EP004 25.248s recording** with intended `PicturePlan.words` once available; if not available, label sample timings provisional and block native full-VO approval. `QualityScienceCallouts` takes existing approved geometry projection/real metal-road contacts and must not overlap the 326px bottom subtitle reserve. Renderer hooks are adapter suggestions, not already-built exports. Five quality PRs (8–12), all independently reviewed and authorized, constitute the upgrade gate.

## Active editor replacement: Agent 13 (22 Oct 2026)
Owner has retired earlier ChatGPT production agent chats and requested a **new video editor**. Original Agent6 [#221](https://github.com/YunRah2103/Remotion-gpt-chat/issues/221) / PR #223 remains a valuable **read-only code reference**, NOT the active edit assignment. The active editor is [Agent13 issue #244](https://github.com/YunRah2103/Remotion-gpt-chat/issues/244) on existing `agent/ep004-13-master-editor` branch targeting `production/yunex-ep004-quality-v2`; source handoff [quality/editor/HANDOFF.md](https://github.com/YunRah2103/Remotion-gpt-chat/blob/agent/ep004-13-master-editor/production/yunex/f1_sparks_ep004/quality/editor/HANDOFF.md).

- On 22 Oct, new specialist PRs exist: **A8 #240, A9 #241, A10 #243, A11 #242**. These are **NOT** automatically integrated or approved. **A12 #239** graphics PR not yet confirmed. Before accepting any source/preview, inspect current GitHub issue/PR/runs/actual moving frames; status may have changed.
- Agent13 must recover previously validated original Agent6 editor/VO-caption/native-QA machinery non-destructively from old PR #223 while preserving actual source tree of V2 in isolated quality branch. Own only `quality/editor/**`, `quality/previews/agent-13/**`, `quality/tests/agent-13/**` and its editor-local entry. Agent0 approves source before integration. DO NOT touch old PR, EP003 or main.
- Real EP004 Cedar original MP3 reportedly ~25.248s was provided in another chat but **not confirmed present/accessible in repository**; valid final-voice rendering needs actually accessible voice, ffprobe duration and real verified word times. Video-only moving preview is permitted as **WIP**, never represented as final VO film. No EP003 media, invented dialogue, forged captions or double subtitle layers. 
- **Previous references to handoff to Agent6/Agent7 above are historical; this section supersedes them.** Agent13 delivers the 6-shot 1080x1920 30fps captioned/clean original-VO film to owner after true approval. If old Agent7 chat is gone, a future new audio master role can be assigned after picture lock.
