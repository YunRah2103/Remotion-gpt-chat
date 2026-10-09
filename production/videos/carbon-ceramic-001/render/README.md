# Carbon-Ceramic 001 — Agent F render tooling

This is **render infrastructure, not a completed film**. Agent E's latest reported handoff is blocked, Agent A's native Blender/GLB review remains outstanding, and Master has not approved an integrated source SHA. Never use these tools to claim the final MP4 exists before an actual native 750-frame render.

## Release sequence

1. E integrates A–D, registers `CarbonCeramic001`, commits native proof, publishes a **ready** handoff and PR. A's real Blender asset proof and Master acceptance must be resolved.
2. Master accepts the **exact integration commit**, giving an inspectable GitHub approval URL.
3. On F's branch, replace `SOURCE_LOCK.json`'s `status` with `approved`, `integrationSourceSha` with that approved 40-character commit, and `masterApprovalUrl` with actual approval evidence. The lock cannot be approved based on E's branch name or template handoff alone.
4. Master merges the integrated source and F render tooling into `automotive-brakes-001/master`. The source must remain unchanged relative to the lock in all checked source paths. Run `python production/videos/carbon-ceramic-001/render/source_lock.py --require-approved` and **do not bypass** `master_gate.py --require-ready`.
5. Trigger `Carbon Ceramic 001 - Master proof and final rendering` from the **Master** branch with `mode=proof` or `moving` first and independently view actual frames 48/168/321/531/705 and clips 135–195/300–360. Trigger `mode=final` only for reviewed native integration. No unrelated compositions or schematic substitutes.
6. Native final render: 750 frames, 1080x1920, 30 fps, H.264 yuv420p using existing `production/tools/render.py`. The workflow also invokes `verify_media.py`, which saves the full raw FFprobe JSON, counts fully decoded FFmpeg frames, computes SHA256, and warns about suspicious black/frozen intervals. **Human review is still mandatory.**
7. Download the workflow's named Actions artifact containing MP4, stills, two clips, contact sheet, source-lock/readiness reports, and all technical QA. Record actual workflow run/artifact ID, candidate SHA256, any warnings and D's film-level review in `REPORT.md` and `agent-f.json`.
8. Submit the source-locked render candidate to Master; Master alone creatively approves and distributes.

Infrastructure unit smoke (synthetic test pattern, **not** film footage):
```bash
python -m unittest discover -s production/videos/carbon-ceramic-001/render -p 'test_*.py' -v
```

Inspect any MP4 independently:
```bash
python production/videos/carbon-ceramic-001/render/verify_media.py out/carbon-ceramic-001/carbon-ceramic-001-master.mp4 --report out/carbon-ceramic-001/full-media-verification.json
```

No narration or transcript is manufactured. Without the approved user voiceover, report a silent visual master. Keep all large binaries in Actions artifacts, **not Git**.
