# YUNEX EP004 — Agent 0 verified source status (20 Oct 2026)

**Dashboard:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/215
**Episode base:** `production/yunex-ep004-base` (manager CI update `152d13553757e521193ffc7d437e5da188323762`).
**States:** NOT STARTED → WORKING → PREVIEW READY → REVIEWED → APPROVED → INTEGRATED. No unverified preview can advance beyond WORKING.

## Live branch + PR ledger

| Agent | Issue | Draft PR | Latest observed head SHA | Actual source status | Verified native EP004 moving MP4s | Next manager action |
|---|---|---|---|---|---|---|
| 1 — F1 car, plank/skids | #216 | #225 | `78e5f4eb43cb028da2d8b97f934fc6d77fd09116` | **WORKING** | **none** | Native renders of Underfloor/CarContext, independently verify skid nodes and suspension |
| 2 — coupled contact sparks | #217 | #222 | `5f77741e9d94cd70ce4404546dd195ccfb06d6da` | **WORKING** | **none** | Replace fixture with #225 actual skid descriptors; contact tests + two MP4s |
| 3 — cinematography | #218 | #226 | `79878b116e01a5176c6d1fee556b97683200e1e0` | **WORKING** | **none** | Native 5s hook + 11s continuity review; remove fixture sparks before approval |
| 4 — circuit/look | #219 | #227 | `f5154cf4c7295af41a571b596502926d7b51772e` | **WORKING** | **none** | Native Trackside/RaceFollow; verify visual asphalt height matches shared track |
| 5 — story/captions | #220 | #224 | `076de10c48f33ae6745f8944b583dd18f7f91824` | **WORKING** | **none** | Native story fixtures and eventual truthful 1–4 integration before signoff |
| 6 — picture/VO scaffold | #221 | #223 | `4b68de5d64655268cfd98e150c0267a0dfb2650c` | **PREPARATION ONLY; PICTURE BLOCKED** | **none** | Wait for accepted integrated five visual sources and original recorded EP004 speech |
| 7 — soundtrack | not started | none | — | **BLOCKED** | none | Wait for original-VO picture lock |

All five visual agents have pushed real code and opened separate draft PRs. All the draft PRs target `production/yunex-ep004-base` and are not merged. Per specialist PR handoffs, native original Remotion MP4s were still absent at this review; partial locally generated non-native moving blockouts and unrelated baseline `GpuDriveFilm` CI do not qualify.

## Manager 0 infrastructure correction
- Added a `specialist-native` GitHub Actions job to the existing isolated `.github/workflows/yunex-ep004-review.yml` on the episode base. It maps each Agent 1–5 branch to its real two local Remotion composition IDs, runs specialist unit tests, **renders both full portrait clips at 1080×1920/30fps H.264**, ffprobes exact frames, fully decodes, generates actual 0/middle/end JPEGs and checks sampled frame-hash diversity, then uploads accessible `YUNEX-EP004-Agent-N-Native-MP4-Review` artifacts.
- This job is triggered on specialist PR `synchronize` events. Existing PRs need a *new commit or deliberate branch sync from the latest episode base* to run the new workflow version; Agent 0 cannot fabricate that event. Agent 0 posted next steps directly in all five child issues.
- This manager workflow modification is isolated to EP004 base; no `main`, EP003 or world-kit changes, no automatic merge or approval.
- If native job reports Remotion rendering, type, memory, performance or geometry failure, specialist owns fixing their source and rerunning through their PR. A green GitHub job does not equal a positive visual review until actual MP4s are viewed.

## Interfaces and remaining dependency gates
- Agent 1 already handed Agent 2 provisional `getSkidDescriptors()` and `SKID_LAYOUT` in #217: bottom points `forward [1.18, 0.065, 0]`, `middle [0.10,0.065,0]`, `rear [-1.03,0.065,0]` in metres. **Never duplicate these constants** in contact logic; import exact approved Agent 1 source after integration. Forward metallic skid is mandatory under FIA 2026 C3.6, middle/rear optional.
- Agent 4 asphalt mesh and Agent 2 road sampler must use the identical `sampleTrackSurface` value. Contact sparks must only be born at active metal-road point with signed gap <=0, even if older particles still move through no-contact interval.
- Agent 3 receives Agent 2 authoritative world pose, camera safety is portrait first and must show entire moving car. Agent 5 labels actual metal and captions safe above bottom frame margin.
- Only after two genuinely moving previews per agent and frame review should the manager approve their PRs and integrate them in compatibility-safe sequence. Film assembly by Agent 6 and final audio by Agent 7 remain blocked.

## Current instruction
Agents 1–5: sync the latest episode-base manager-only workflow onto your branch (without editing it), commit any specialist corrections; the PR synchronize event triggers native review on the next push. Include direct Actions run/artifact URLs, real probe/decode and visible frame proof in your agent issue. Remain WORKING until manager evidence-based REVIEW.
