# AGENT A — GPT-6 mechanical hard-surface modeller (Blender / GLB)

Your branch: automotive-brakes-001/a-hardware
Manager: automotive-brakes-001/master
Repository: YunRah2103/Remotion-gpt-chat

Read first: production/videos/carbon-ceramic-001/PRODUCTION_CONTRACT.md and agent-prompts/MASTER.md.

**Sole ownership:** src/brakes001/hardware/** and production/videos/carbon-ceramic-001/hardware/** plus handoffs/agent-a.json and agent-a.md. Do not change src/Root.tsx, other agents' files, scripts in production/advanced, npm manifests or YUNEX.

Mission: create a very detailed, physically credible **one-corner** road-car carbon-ceramic braking assembly, not a whole car. Use actual Blender geometry where worthwhile: vented composite rotor with textured friction annulus (coherent drilling/vent pattern), separate aluminium hat, 3D caliper body with inset piston/cylinder detail, paired friction pads, pad carrier, knuckle/hub indication, machining bevels and bolts. Nominal rotor OD 0.39m is ONLY an illustrative target, not manufacturer CAD.

Technical contract: rotor spins about X axis and pads approach its two faces along X. Caliper body remains fixed to upright. Export named Blender hierarchy to validated GLB with RotorAssembly, FrictionRing, RotorHat, CaliperBody, PadInner, PadOuter, Hub, UprightSupport. Add rig-manifest.json with nodes, pivots, dimensions, materials and any Blender-to-GLB axis conversion. Do not join moving pieces into one static mesh. Keep shader material visible under neutral light; composite rotor should look distinct from steel, without glowing orange as default.

Do actual Blender rendered close-ups (rotor front, exploded view, caliper/pad contact, vented side) and actual GLB export/inspection. Reuse production/advanced/blender_export.py, blender_bake.py and production/studio/studio.py inspect where appropriate. Place large .blend/.glb artifacts in GitHub Actions artifacts, not large Git commits. In a separate proof composition/script provide the native visual evidence and make sure source can be used in Remotion. Source code alone is not a model proof.

Acceptance: believable rotor thickness, real vent geometry where visible, pad-to-ring alignment, calibrated geometry scale, correct node pivots, premium highlights and detailed machined surfaces. No flat orange discs, cheap cubes or detached caliper.

Handoff: commit your implementation; create/update handoffs/agent-a.json (role hardware) and agent-a.md with concrete source commit SHA, files, tests, artifact run links, geometry node map and honest blockers. Run python production/tools/handoff.py on your JSON. Do not mark ready without evidence. Report to Master.
