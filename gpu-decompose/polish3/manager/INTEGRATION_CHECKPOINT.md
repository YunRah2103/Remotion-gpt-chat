# GPU POLISH 03 — C manager integration readiness / production checkpoint

**Repository:** YunRah2103/Remotion-gpt-chat, exclusively. **Branch:** gpu-polish3/c-master. Date 2026-10-08.

## Completed by Agent C
- Published shared correction contract at `gpu-decompose/polish3/PRODUCTION_CONTRACT.md`, initial authoritative commit `8d4748af2d239177a9a6f44f07e9472b95f33d9f`.
- Downloaded, unpacked, ffprobed, fully decoded and actually visually inspected old released film, original workflow `37821956618`, artifact `11570565750`. Compared native original chunk artifact `11569408516` to old final. See `gpu-decompose/polish3/manager/BASELINE_VISUAL_AUDIT.md` for hard colour failure and shot-by-shot deficiencies. Original full MP4 SHA256: `c08da0aaaa20e99ac95219815d382911de4b63baf480d2400650ff9ca2acb646`.
- Created fail-closed GLB anchor/motion/sha verification `gpu-decompose/polish3/manager/verify_polish3.py`. It rejects old GLB and old motion hashes, enforces 19 anchor names and separation endpoints, stage locks and all actual new scene-file hashes.
- Created independent `.github/workflows/gpu-polish3-c-production.yml` without touching prior release workflow. Uses locked artifact run/name/numeric ID, stages a **new versioned GLB**, native 1080x1920 moving/still proofs, separate gated 5×90-frame full rendering, FFprobe, full decode and RGB identity comparisons. **Removed old Manim screen blend** to prevent magenta colour corruption.
- Created `RELEASE_LOCK.template.json`. Deliberately did **NOT** create an operative `RELEASE_LOCK.json`: no A+B immutable completed handoffs or approved native proofs yet. This prevents accidental premature full rendering.

## Latest A/B source observation (not an approval)
- A branch `gpu-polish3/a-hardware` contains genuine `gpu-decompose/agent-a/polish3_detail.py` detailed fins/pipes/memory/VRM/fan-stator work and a separate native build workflow. The current `gpu-decompose/agent-a/generate_motion.py` has fans +Z .93/1.03/.93 and shroud +Z .31; satisfies the explicit *endpoint* ordering intention, subject to real Blender/Remotion moving proof.
- B branch `gpu-polish3/b-cinematography` contains versioned `src/gpu-polish3/GpuDecompositionPolish3.tsx`, `cinema.ts`, controlled material lighting and bounds-fit camera, preserving legacy source under `GpuDecompositionBaseline`. B's implementation document cites C contract and acknowledges the old postmux purple corruption.
- **A/B branch presence and source updates alone are not acceptance.** Still missing: their final verified remote SHAs, A successful workflow + artifact ID + GLB/motion hashes, B successful moving proof + artifact ID and visual handoff.

## Integration sequence after both handoffs
1. Verify exact **full remote A and B commits**, changed-path ownership and pushed deliverables. Integrate B's scene and `src/gpu-polish3/**` into C by targeted path selection; do not ingest A-model unrelated branch history.
2. Verify A model run/artifact, canonical `xfx_swift_rx9060xt_polish3.glb`, `decomposition.json`, source manifest and Blender moving proof. Confirm GLB hash nonbaseline; compare physical hierarchy and axes; check fan/shroud clearance at real intermediate frames.
3. Stage new model using the manager CI only; validate runtime B code expects `public/gpu-decompose/xfx_swift_rx9060xt_polish3.glb`.
4. Determine SHA256 of A GLB, A motion, B main scene, B cinema.ts, B wrapper source. Create **real** `RELEASE_LOCK.json` with `status=proofs` and fully verified source/artifact values. Trigger proof Actions on C branch and inspect actual stills 0/45/89/120/179/240/329/385/449 and moving clips.
5. Compare new real proofs to old raw Remotion and released purple film, record independent visual acceptance or request targeted owner corrections. A successful npm check/Blender render is insufficient.
6. Only after PASS, edit lock `status=release`, `renderApproved=true`, `approvedProofRunId`, `approvedProofArtifactId`, `independentVisualQa=PASS`. The same workflow will render real 450 frames, mux clean AAC 48 kHz, produce 3 PNG hero/mid/exploded, assert full file decode and no color regression.
7. Download finished candidate artifact, **inspect entire actual MP4 and key decoded frames**; if it looks broken, fix and rerender rather than claim release. After actual final review, write manager `FINAL_VISUAL_REVIEW.md` with before/after evidence and publish exact C remote SHA, render run ID/artifact ID/MP4 SHA256 and remaining CAD approximations.

## Do not infer
No POLISH 03 final MP4, final hash, successful CI run, or visual PASS is claimed at this checkpoint. Existing historical video stays untouched; never access yunus-video-lab.
