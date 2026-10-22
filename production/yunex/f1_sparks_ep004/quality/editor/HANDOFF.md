# YUNEX EP004 — Agent 13 master video editor handoff

**Main work assignment:** [GitHub issue #244](https://github.com/YunRah2103/Remotion-gpt-chat/issues/244)
**Branch:** `agent/ep004-13-master-editor` (this branch)
**PR target:** `production/yunex-ep004-quality-v2`.
**Task status at creation:** assigned only. This README is not a finished edit.

## Read and reuse, don't restart
- [Previous Agent6 source PR #223](https://github.com/YunRah2103/Remotion-gpt-chat/pull/223) / branch `agent/ep004-06-editor` has real EDL, `editor/timing.ts`, `editor/PictureEdit.tsx`, `editor/render-native.mjs`, `editor/native-qa.mjs`, `editor/PreviewScene.tsx`, local tests. Preserve old source branch; transplant/rewrite only approved useful pieces into `quality/editor/**` and independently compile/test.
- [Quality master #234](https://github.com/YunRah2103/Remotion-gpt-chat/issues/234), [original EP004 #215](https://github.com/YunRah2103/Remotion-gpt-chat/issues/215), original science A1–A5 are already present in quality V2 source branch.
- Model kit V2 is already part of your source. Its *generic* flat metal skids and animated contact spark emitter must NOT override authoritative EP004 A1 skid `getSkidDescriptors()` + A2 `sampleContactDrivenSparks()`.
- Live specialist PRs (check current status and handoff, review before use): A8 [#240](https://github.com/YunRah2103/Remotion-gpt-chat/pull/240), A9 [#241](https://github.com/YunRah2103/Remotion-gpt-chat/pull/241), A10 [#243](https://github.com/YunRah2103/Remotion-gpt-chat/pull/243), A11 [#242](https://github.com/YunRah2103/Remotion-gpt-chat/pull/242), A12 [issue #239](https://github.com/YunRah2103/Remotion-gpt-chat/issues/239) (no PR verified at creation).
- Only manager/owner approves visual PRs. Don't merge them, but prepare adapters so approved source can drop into the cut.

## Locked creative structure
1. Under 0.8s HUGE real contact sparks + driving F1 visible
2. Moving rear mystery
3. Genuine skid metal vs composite plank vs carbon floor reveal
4. Real aerodynamic compression / clearance
5. True A2 signed-gap contact spark macro
6. Fast, car-large-on-screen sparkling night racing payoff, confident finish.

All six shots move; track/car physics coherent; no blank roads, over-moving end cameras, clipped text, excessive arrows, grain or blurry low-quality visuals.

## Output source and voice gating
- Original EP004 Cedar audio **recorded file not confirmed in repository**, earlier cited duration **~25.248s**. Do not use EP003 voice or synthesize/generate substitute. Search authorized uploaded assets/previous handoff; otherwise owner needs to provide original MP3 to new Agent13 chat. Measure with FFprobe; valid word timestamps keyed to actual recording; record the transcript.
- Always provide genuinely moving video-only PREVIEW if audio blocked; do not claim the final narrated film is ready.
- Once audio verified: original recording dictates actual duration and frame count (`ceil(seconds*30)` ≈ 758 at 25.248s); exact 6 semantic cuts are word-triggered.
- A12 caption skin optionally REPLACES previous caption style; no simultaneous double captions; bottom-safe >=326px and 80px horizontal margins, no overlaps with real labels/camera track.
- Final pair: captioned 1080x1920@30 H264 MP4 + clean variant (both real same original VO) after approvals. Do full `ffprobe`, `ffmpeg -xerror`, audio stream verification, 3 real decoded image hashes in *each* shot, inspect opening/end/cut frames and listen.

## Source/test boundaries
Write only `production/yunex/f1_sparks_ep004/quality/editor/**`, `quality/tests/agent-13/**`, `quality/previews/agent-13/**`; do not touch original `editor/**`, A1–A12 code, EP003, main, kit PR #233 or old editor PR #223. Make new Remotion EP004-only entry in editor namespace, not global app overwrite.
Publish real logs/MP4 artifact/PR on new [Issue #244](https://github.com/YunRah2103/Remotion-gpt-chat/issues/244). Owner decides picture lock; a new audio specialist can then handle final mastering if original Agent7 chat is gone.

## Short agent start prompt
> YUNEX EP004 — Agent 13. Follow GitHub Issue #244 completely. Continue EP004 as the NEW master editor on your assigned branch, use Modelling Kit V2, reuse proven previous Agent6 edit/QA source without touching it, and combine approved upgrades from Agents8–12 into one premium 1080x1920 30fps six-shot moving F1 sparks film. Start with a huge real-contact spark hook; show true skid/plank/carbon and aero, beautiful night racing, original Cedar EP004 narration and word-synced subtitles without duplicates. Test/visually inspect actual MP4s, open your PR to the isolated V2 quality base, and post GitHub handoff. If original VO unavailable, produce an honestly labelled video-only review and record the blocker. Never merge or touch EP003.
