# Agent B — Galaxy S25 Worker V4: true IndyCar source-gate report
Date: 12 October 2026  
Tracking: [#37](https://github.com/YunRah2103/Remotion-gpt-chat/issues/37)  
Rights-review handoff: [#43](https://github.com/YunRah2103/Remotion-gpt-chat/issues/43)  
Agent branch: `automotive-edits/turbo-indy-reality-001/b-indy-matches`.

## V4 verified workflow
Read `production/phone_footage/README_V4.md`, `sources_v3.json`, `agent_jobs_v4.py`, `v4_worker.py` from branch `experiments/s25-footage-worker-v4-10min-20261012`. V4 requires an owner-authored `[YUNEX PHONE JOB]` issue with a `YUNEX_PHONE_JOB_V4` body containing a specific *approved registry URL*. It checks native 1080p, full decode and output SHA and uploads a public release MP4 on actual Galaxy S25 execution. V4 CI validates logic; it does not prove specific YouTube footage is permitted or obtainable.

**Current registry contains only two previously approved CC BY test YouTube sources** (Big Buck Bunny 720p and a 1080p aerial forest-driving clip). Neither is IndyCar. No owner-reviewed source record for an IndyCar video exists on V4 branch. Agents must not forge `reviewed_by=YunRah2103` or bypass source checks to force a job into V4. The user's general approval to evaluate V4 is **not** a rights license for a third party's race broadcast.

## Actual YouTube scouting execution
Source metadata scan:
- [Successful GitHub Actions run 38300375255](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38300375255), branch code SHA `47c8105894b49492bb50c94841e72ea35ef7770b`.
- [Artifact 11770298417](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38300375255/artifacts/11770298417) contains `candidates.json`, `searches.json`, `license_audit.json`, `READ_ME.txt`. **Metadata only — no footage bytes**.
- Eight targeted YouTube search phrases yielded 40 unique candidate video IDs, many not actually IndyCar (NASCAR, sim footage, go-karts, other races).
- Twelve full-video license/format metadata checks **12/12 blocked** by YouTube sign-in-to-confirm-you-are-not-a-bot. No source-by-source license or native 1080+ confirmation resulted, and no exact 6–40s camera-matched segment could legitimately be selected.
- Potential *research* (NOT approved): [Arrow McLaren IndyCar Team 36-sec Jacques Villeneuve IMS](https://www.youtube.com/watch?v=BhMCyVtRsHY); [USA TODAY 33-sec VR Indy 500](https://www.youtube.com/watch?v=ZcEq_NzxWrk). Neither license, camera framing nor sample frames verified; no proposal to add them to reviewed registry.

## High-value camera type identified
FOX/IMS Productions introduced a new **2026 Indy 500 Buckeye camera** mounted externally on the rear/side of IndyCars, able to see rear tyre, suspension and distance to the wall. Technical account by Sports Video Group:
https://smt.com/fox-sports-ims-productions-scale-up-indy-500-production-with-new-in-car-cameras-ar-graphics-cinematic-sets/

- Turbo **A01** calls for near-wheel, exterior, right-side pale wall and catch-fence with screen-aligned high velocity.
- **A05** demands moving giant tyre/undercarriage occlusion and asphalt-level motion.
- **A02** calls for low side-pan on a banked Indy oval racing pack.
- Buckeye *could plausibly* match A01/A05 in lens location, but this is **theoretical until actual decoded shot frames are obtained**. No exact YouTube Buckeye video/timecode was found. Official FOX/IMS content is not licensed to YUNEX simply because it is publicly viewable.
- 2026 INDYCAR footage use guidance:
https://www.indycar.com/-/media/Files/2026/Imagen-Only/INDYCAR-Photo-Video-Policy-2026.pdf
- Official licensing form:
https://www.imsproductionstv.com/footage-licensing
- The form is a proposal; rights attach only after a license agreement.

## Work actually committed
- `production/videos/turbo-indy-reality-001/agent_b_v4_youtube_discovery.py`: metadata-only search and rights audit; *no download* and not source authorization.
- `.github/workflows/yunex-agent-b-v4-youtube-discovery.yml`: actual Actions execution for reproducible source research.
- Created [rights-review issue #43](https://github.com/YunRah2103/Remotion-gpt-chat/issues/43) as an **explicit NONPHONE task**. It is intentionally not titled `[YUNEX PHONE JOB]` nor prefixed `YUNEX_PHONE_JOB_V4` so the phone worker will not process unauthorised media.

## Outcome and unblocking
| Request | State |
| --- | --- |
| Read V4 worker & source registry | DONE |
| Search original YouTube leads | DONE (40 IDs; quality / license unverified) |
| Identify wheel-level camera mechanism | DONE (FOX/IMS Buckeye) |
| Confirm YouTube candidate CC BY license and specific 1080p timecode | **FAILED / NOT ESTABLISHED** |
| Obtain owner approval and event/public-release reuse clearance | **NOT DONE** |
| Add source to reviewed allowlist | **NOT DONE; no approved candidate** |
| Actual runnable V4 issue | **NOT CREATED; would be invalid** |
| S25 Termux run / YUNEX_PHONE_DONE_V4 | **NOT RUN; no job** |
| New verified IndyCar MP4 / A01/A02/A05 match | **NONE** |

**Decision required:** Rights owner/licensee supplies permitted camera footage or formal 2026 INDYCAR clearance and authorizes public GitHub Release reuse of a specific original video. Then source must receive the repository owner's *actual review* in V4 catalogue; generate the new runnable issue via `agent_jobs_v4.py prepare` and tell owner to run `~/yunex-v4 --once`. Only a `YUNEX_PHONE_DONE_V4` with playable released MP4, actual SHA/native dimensions/full decode and side-by-side frame QA will satisfy Agent B.

No fake CC approvals, no bypass of sign-in/DRM, no irrelevant YouTube download, no deceptive phone job, no extra editing.
