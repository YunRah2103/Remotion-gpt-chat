# Agent F — Lead Rendering Engineer handoff

**Status: BLOCKED (actual tooling implemented; final film not yet renderable).**

- Repository: `YunRah2103/Remotion-gpt-chat`
- Branch: `automotive-brakes-001/f-render`
- Verified tooling source commit: `2d9b1257f27dd09e4f0a4dfe5e3f44d73775c4a6`
- Work: added `render/SOURCE_LOCK.json`, `source_lock.py`, `verify_media.py`, `test_verify_media.py`, `README.md`, `REPORT.md`; enhanced the existing carbon-ceramic master render workflow.
- Infra tests: **9/9 PASS** in GitHub Actions (five temporary-Git source-lock tests and four synthetic 45-frame H.264 media checks); this is not native brake footage.
- Initial GitHub Actions smoke run [37944380254](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37944380254) failed because its runner lacked FFmpeg. Corrected workflow: runs [37944495862](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37944495862) and [37945011076](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37945011076) both **PASS**, latter verifies 9/9 tests and the fail-closed gate. Draft PR [#16](https://github.com/YunRah2103/Remotion-gpt-chat/pull/16).

## Source acceptance blockers

Agent A remains review: native Blender .blend/.glb, real render and hierarchy verification outstanding. Agent E remains review: integrated composition and moving previews/whole-film signoff outstanding. Master has not approved a specific E integration commit. Thus **`SOURCE_LOCK.json` remains pending and `master_gate.py --require-ready` must not be bypassed**.

## Candidate and independent QA

No honest final MP4, five native stills, moving clips, final FFprobe JSON, 750-frame FFmpeg decode, real film SHA256 or Actions film-artifact ID exists yet. No audio is invented. Agent D's independent final video review and Master's final creative acceptance are pending.

When the approved integration lands, follow [the runbook](../render/README.md), inspect the actual 25-second native candidate and complete [the technical report](../render/REPORT.md) with real artifact/run identity and defects.

**Do not mark Agent F ready from these source scripts alone.**
