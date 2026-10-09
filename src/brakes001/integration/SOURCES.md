# Carbon-Ceramic 001 — exact specialist provenance

All ten A-owned Polish 02 blobs in E were compared by Git SHA with Agent A HEAD and matched **10/10 exactly**; none was edited by E. B/C/D also remain original specialist-source blobs. The film runs A's revised procedural Three.js component; the separate native Blender GLB is an independent geometry proof and is not loaded by Remotion.

| Agent | Imported source branch head | Implementation source SHA | Ownership |
| --- | --- | --- | --- |
| **A · Polish 02 hardware (CURRENT)** | `cbce3943e490fa3eddc245ca8c2c75b942225108` | `0bfc8ce52f15e6bf883cca0ad425fd4359d5af33` | `src/brakes001/hardware/**`, `production/videos/carbon-ceramic-001/hardware/**` |
| B · motion/thermal | `37b661eaba75477de4d967f430da270c399818a7` | `4a815e73c4e3dbc28b686e20910fdfc8865cd1bc` | `src/brakes001/motion/**`, `production/videos/carbon-ceramic-001/physics/**` |
| C · cinema/x-ray | `09c6b0a4a8acd0e4625fa35cad50f3d10f37388e` | `eca01d9f937d059e21ad935396e4293fc784cbb5` | `src/brakes001/cinema/**`, `production/videos/carbon-ceramic-001/lookdev/**` |
| D · graphics/QA | `e31ded3731014f9c2a22148f7a32408e92e38bdd` | `f8bdea2b6cb8f503b119621aaaaabe8034e6bafe` | `src/brakes001/graphics/**`, `production/videos/carbon-ceramic-001/qa/**` |

## Integration commits

- Previous A–D original source import: `138cb4cd3d8bc07c2c0e46ae5604fd8fe05aada6` (superseded for A only).
- Polish 02 A exact-source replacement: `a8f8d7504c4bd0f509b5a5b403ccfc095da0d615`.
- E 3/4 camera/lookdev adapter: `e945147daec275ff377f265aedf917b51e31ce90`.
- E 2.5mm physical travel adapter: `662532617da111568c2fb2fbaa8d4b0c70bbd4f2`.
- E reveal/hero polish with executed dedicated 750-frame tests: `d9e27ab383356c06f326bca0804c045c9f3646bf`.
- **Latest E film-code SHA:** `8b6ee9ccfc3151f44aaa56a4ff663ffbef1d934d`; hero framing recentered from previous left clipping; native exact-SHA re-render is still pending.
- Workflow-only dependency optimization: `683b97dea79590a7026bd2b89204ee8945f908ff`.

## Connection contracts

1. A's `RotorAssembly`, `FrictionRing`, `RotorHat` and `Hub` rotate as a rigid hierarchy about X. `CaliperBody` and `UprightSupport` remain static, `PadInner/PadOuter` move independently on X. All eight original root names retained.
2. B's original `brakeStateAt(frame)` controls rotor angle/speed, brake pressure and illustrative heat. **No B-owned source changes.** B's pad gap of up to 6mm was designed around a stand-in, so E's `padGapForHardware` maps B **pressure** to A's nominal 2.5mm physical release clearance and a conservative 0.15mm nonpenetrating contact clearance. Maximum commanded travel = 2.35mm, within the specified 2.5mm design stroke.
3. C's pure camera math and ghost car are unchanged. E's `IntegrationCameraRig` gives a true three-quarter caliper view and widens thermal perspective while preserving the five shot ranges. A's geometry and all C exports stay untouched.
4. D's titles/labels are unchanged; leader lines remain disabled unless true projected anchors can be proven. E annulus-only thermal false colour is linked to B's heat signal; no calibrated temperature claims.
5. Master owns full 750-frame acceptance. Agent D owns independent final artistic/technical QA; Agent F owns final 1080×1920 H.264 delivery.

## Polish 03 latest provenance — authoritative after A03 source reimport

- **E exact moving film-code SHA** (Remotion source, camera, B adapter and sector heat): `37e04ee309dc9f96e63ad1b4eda28f25fea3a96a`.
- **E proof run** [37976988034](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976988034), native film stills, two complete 61-frame clips; **E separate high-res/sweep** [37976988178](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976988178), real 1080×1920 macro, 11 benefits/12 thermal sweep stills, 41-frame benefits video.
- **A03 updated hardware lookdev READY:** branch HEAD `e619a94cde5c525bdd9f6dfc6ed5604d4ff39252`, A source `f22ba2e5b2498baa52d0a22121a2f05153d894a9`; E blob-identical import commit `c50056eeb86691b1d67dace94be4c2b2cefd231f`. Four changed A-owned blobs: A handoff JSON+MD, `hardware/build_brake.py`, new `hardware/lookdev_compare.py`. The live `src/brakes001/hardware/BrakeAssembly.tsx` and original mechanics are unchanged. A's native Cycles artifact [11638453325](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976686710/artifacts/11638453325) is authoritative for the corrected Blender material proof. Avoid describing the older A02 washout as the current A03 hardware.
- E E-only `FrictionHeatMap.tsx` visualizes B's normalized heat as pressure-following annulus sectors; supplies zero heat to A's global material tint and C's uniform amber light (purely photographic change, physics intact).
- E E-only `BrakePadMacroProof.tsx` replays original B film frames85–145, shows exact A pad gap and explicitly labelled caliper-hidden cutaway. Real geometric movement stays 2.35mm or less; do not pretend frames135–195 are a clamping-onset sequence.
- Latest provenance table and this addendum agree on A03 source and give the correct final film-code SHA.

## Final Polish04 in-film source lock
- **Film-code SHA:** `b53c264017a6e3f10f3cae0326b0ae9257e80966` (after JSX syntax correction and second side-profile pad revision); this is the exact source of native proof [37982072331](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37982072331).
- E owns `src/brakes001/integration/InFilmPadCutaway.tsx` and modifications in `CarbonCeramic001.tsx` / `IntegrationCameraRig.tsx`. A/B/C/D components and their original blobs remain unchanged. Frame100–147 real A two-pad mesh motion continues to use E's pressure-to-.0025m gap adapter; no new braking physics. Final hero uses continuous camera orbit while B rotor is stopped.
- P04 proof tooling: `.github/workflows/carbon-ceramic-001-e-polish04.yml`; workflow-only changes and later documentation commits must not be mistaken for film-code SHAs. Native artifacts: [pad](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37982072331/artifacts/11641465753), [hero+stills](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37982072331/artifacts/11641735972).

## Polish05 definitive film-code provenance

- **Latest native-verified P05 runtime source SHA:** `a8553b2c1af11d15eb0b8f6c96e0c3e53142f9aa`. Tests/workflow/doc changes after this runtime commit do not change its rendered bytes.
- Native proof GitHub Actions: [run 37990076113](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37990076113) / [artifact 11644577616](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37990076113/artifacts/11644577616).
- D-accepted P04 reference hero-camera body from `21c2b581b46251b0bd45028d32eb40b4341eeb2a` is tested **byte-identical** with P05 using real `git show` in workflow; no new hero render required solely for source equivalence.
- E owns geometry-preserving nine-frame two-`ThreeCanvas` dissolves and P05 camera/caption adapter. All physical hardware is still original A geometry under original B pressure and E's existing 2.35mm per-pad travel cap.
- A/B/C/D components and F release workflow remain unchanged; this P05 source is the only film-version SHA Master should hand to F once D approves the pad-crop/transition proof.
