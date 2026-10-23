# YUNEX V4 implementation brief

The user explicitly authorizes implementation without another plan-only stop. Continue PR233 from ca8260f, preserving its 62 commits, 36 vehicle IDs, 20 environments, original APIs and all episode branches. No force push or merge.

## Selected architecture

Add an opt-in `bodyDetail:'studio'` source-owned section-loft construction for the three flagship families (supercar, coupe, rally-hatch), keeping both legacy and existing coachbuilt variants. Replace the actual body and cabin surfaces together rather than stacking decorative panels on the rejected shell. Preserve wheel pivots, driver/control hardpoints, deterministic rig, damage/cutaway integration and existing part factories. The loft supplies coherent adjoining glazing/pillars/roof, actual arch apertures, editable doors, sculpted fascia and recessed exhaust hardware. Models remain original generic vehicles, not CAD replicas.

Provide stable exhaust outlet mounts with default 112mm diameter, documented opt-in transform adapter; never mutate EP005 v2. Improve automotive reflection lighting for day/dusk/night. Extend existing recipes with deterministic camera start/end poses and explicit speed scaling. Add small structured production helpers and three complete editable proof projects through the original renderer. Preserve supplied audio/timing exactly; new proofs are silent.

## Verification

New behavioral tests first; broad Node/TypeScript/Python checks after integration. Measured geometry checks and native full decode/frame/motion/exposure checks are distinct from moving visual acceptance. Render proofs at actual 1080x1920/30fps H.264 after source checkpoint. Review actual timeline and matching baseline views; record hashes and findings. Aesthetic success is never inferred from passing CI. Existing pipeline and demonstrations remain available.

## Implementation ownership

Root: recovery, loft geometry, integration, git checkpoints and renders. Isolated specialists: automotive lighting, structured proof authoring, camera/recipe motion, exhaust system, perceptual QC. No overlapping writes. Integrate via normal expected-head branch update; inspect any unexpected remote advance.

## Ordered milestones

1. Recover baseline and inspect existing code/evidence.
2. Implement/test flagship loft geometry and exhaust compatibility; checkpoint.
3. Integrate lighting, camera/recipe and production helpers; broad checks/checkpoint.
4. Render and inspect three native proofs and matched comparisons; correct observed defects.
5. Save media, source evidence and recovery handoff; update PR233 with exact source and limitations.

## Limits

Illustrative mechanics/visual dynamics remain distinct from calibrated simulation. No promised photorealism, fully realistic tyre physics, licensing of third-party meshes or fabricated narration. Prioritize actual visible flagship improvements and practical workflow over nominal feature count.
