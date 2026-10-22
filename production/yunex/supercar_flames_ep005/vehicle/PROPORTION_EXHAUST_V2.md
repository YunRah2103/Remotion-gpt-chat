# Agent 1 — EP005 v2 proportion and exhaust interface

Owner rejection addressed in **actual mesh geometry**, not cosmetic detail or framing alone.

## Body die
- Previous V3 `arched-body` actual vertices are deformed in `body-proportions.ts`: curved door-waist concavity, proud rear shoulder, front fender volume and bonnet transition. V3 `restVertices` and `restNormals` are reset to the new shape so native driving/damage sampling cannot overwrite it.
- All stock external roof/window-frame/windshield/rear-window surfaces are hidden **without** hiding the interior or articulated driver, and are replaced by a continuous curved 3D roof (peak approx 1.23m), curved windscreen, C pillars and rear glazing, and non-planar side windows.
- Curved 3D bonnet skin, real wheel-opening-preserving rear-haunch skins, no global Y-scale or replacement of rig, suspension, wheels/tyres, V8, cabin or car motion.
- Six silent moving review shots (300f/30fps): full rear 3/4, side/orbit, front 3/4, real cabin, V8, ending rear chase. Exact route same as EP005 `track`.

## Exhaust interface breaking **v2** — notify A2/A3/A5
- `exhaust-contract.json` version **2**; `mount:exhaust-tip-left/right` remain exact stable names and remain descendants of real V3 body-shell exhaust tubes.
- New mount body-local centers: `[-2.380,0.420,+0.570]`, `[-2.380,0.420,-0.570]` m.
- New unchanged outward node-local direction `[-1,0,0]`.
- Actual inner radius **0.044m** (88mm diameter) and outer radius **0.058m** (116mm diameter); surround outer radius **0.065m** (130mm diameter); former 0.085m/0.105m sizes **INVALID**. Feed pipe radius 0.034m, end x=-2.255; tapered transition to actual 44mm bore. No 210mm barrels, 262mm rings or retaining bolt halos.
- Read the **live new contract** or `resolveEp005ExhaustPorts(hero)`, NEVER hardcode old `.085` radii. A2 must size root plume diameter to the new 44mm bore while keeping independent first-second visual plume broad and natural.

## Acceptance gate
1. Strict TypeScript, authored exhaustive port tests, 6-shot frame arithmetic and all V3 project tools pass.
2. Full 300f, 1080×1920/30fps H264 moving video, silent. Native MP4 FFprobe, full FFmpeg decode, SHA256, first-second sampled unique frames; f0/15/29/side/front/cabin/V8/end visually inspected against former 883edd89 native MP4.
3. Physically evaluate wheel/bumper clearance, side wheel arches and dynamic frame-window port transforms for no occlusion.
4. Do not integrate as manager-approved final until #247 independently signs off SHA-pinned visual proof.

No merge; original #261 branch, no modifications to kit PR #233, EP003/EP004 or other agents. Native lens/looks are for review, never a substitute for actual geometry.
