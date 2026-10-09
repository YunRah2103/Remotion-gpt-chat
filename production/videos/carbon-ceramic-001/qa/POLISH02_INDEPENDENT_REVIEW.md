# Carbon-Ceramic Brakes 001 — Agent D independent Polish 02 visual/engineering QA

**Verdict: CONDITIONAL PASS of the two source-locked 61-frame integration previews and five stills only. NOT RELEASE-APPROVED.**

Review conducted 2026-10-09. Reviewer: Agent D (independent of A, E and F implementation). This is a genuine artifact review, not a signoff from code tests or a preproduction layout illustration. **No complete 750-frame 1080×1920 release film has been viewed or certified.**

## Definitive source and artifact identity

- **Exact reviewed film-code SHA:** `8b6ee9ccfc3151f44aaa56a4ff663ffbef1d934d`.
- **Actual successful proof workflow HEAD:** `683b97dea79590a7026bd2b89204ee8945f908ff`, GitHub Actions run [37970589567](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37970589567), **completed/success**; both `hardware-native` and `integration-native` jobs succeeded.
- Independently compared `8b6ee9c…683b97d`: **only** `.github/workflows/carbon-ceramic-001-e-proof.yml` changed (no composition/hardware/graphics edits). Compared `683b97d…c8bdb9f`: **only** E documentation/handoff/report files changed. Therefore render 37970589567 verifies the **film code** that remains in E's latest documented HEAD `c8bdb9fd31f93364ae9ca263bd41ff439e777e14`; avoid representing the documentation SHA as the rendered commit itself.
- [Actual Polish 02 native film artifact 11636410211](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37970589567/artifacts/11636410211): five 540×960 stills (48/168/321/531/705), contact sheet, two 378×672 H.264 MP4 clips, and test/FFprobe logs.
- [Previous film artifact 11635221421](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37969454877/artifacts/11635221421): same film before the frame-705 reposition at code `d9e27ab383356c06f326bca0804c045c9f3646bf`.
- [Polish 02 real Blender source artifact 11633864744](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37968622756/artifacts/11633864744): `.blend`, `.glb`, four 900×900 Cycles close-up PNGs, rig/build reports. Structural GLB SHA256 independently recalculated: `261b11aa1c71610e52ad9fe25a57b179427f0de833dc6904d41d8da44013a5ac`. Its source is Agent A's `0bfc8ce52f15e6bf883cca0ad425fd4359d5af33`, imported unchanged by E.

## Independent inspection method and outcome

Downloaded and extracted the **actual GitHub Actions ZIPs**. Independently ran local `ffprobe` and `ffmpeg -f null -` on both new MP4s: **61/61 decoded frames each, H.264, 378×672, 30/1 fps, 2.033333 s, silent**, exit 0. Examined the native 540×960 five-frame outputs directly, all four native 900×900 Blender stills directly, and timeline strips sampled every third frame across **both** 61-frame clips; the entire 122 frames were decoded/processed. Visual motion assessment is a dense frame-sequence inspection, **not a claim of uninterrupted real-time playback**.

- **Clamp frames 135–195:** SHA256 `db0d38392262f1be71efab160ba4aa4a771c6fcd6610fce5c2f91c64c39e94b8`.
- **Heat frames 300–360:** SHA256 `83ce877f41a4159fa8e2b7917fd7f4b3db3841837e0c6ee598b8a41269d92556`.
- The latest clip files are **byte-for-byte identical to the previous d9 workflow** (the reframe affects hero, not these shots). Native stills 48,168,321,531 are also byte-identical; **only frame 705 changed**, with 149,483/518,400 pixels differing. This verifies the reframe was actually rendered, without implying every frame of the film has been reviewed.
- The Blender 4.0.2 `build-report.json` says `REAL_BLENDER_BUILD_PASS`; directly read the GLB with `trimesh` as **140 geometries, 149 graph nodes including world root**, agreeing with 148 asset nodes / 140 meshes; nine material slots reported by the build. The real rig manifest names independent fixed `CaliperBody`, two pads, rotating `RotorAssembly` with `FrictionRing`/`RotorHat`/`Hub`, X axle, Y up, 0.39 m outside diameter and 44 vanes. This proves file structure and declared rig metadata, **not physical validity of every pixel of the film**.

## Frame-specific visual findings / corrections

| Severity | Evidence | Finding | Owner / requested correction |
|---|---|---|---|
| **MAJOR** | Four Blender Cycles 900×900 proofs, particularly `pad-contact.png`, `rotor-front.png` | Rotor and caliper render very pale, with overexposed reflective highlights; dark composite and forged material distinctions largely disappear. Genuine geometry detail exists but material proof is **not acceptable as final lookdev**. | **A:** lower exposure/highlights, rebalance fill/key/specular, preserve dark carbon composite and metal separation. Rerender all four native proof PNGs **from final source**, check material visibility before reporting hardware lookdev PASS. |
| **MAJOR** | **Frame 531 (17.700 s)**, latest 540×960 still | Extreme brake close-up crops the caliper **through the left edge** and nearly pushes the friction ring into both edges. Looks accidental in the context of a precision technical explainer, and hides hardware. | **E:** ease the 450–629 benefits/thermal framing back or orbit into intentional macro, retain full caliper and a readable rotor perimeter at shot checks 480/531/600. Produce new native still and moving transition proof. |
| **MAJOR / UNPROVEN** | **Frames 135–195 (4.500–6.500 s)**, 378×672 MP4 | Rotating brake and camera reveal visibly change. Caliper is not observed spinning with the rotor. **Pad closure/contact cannot be independently resolved** at this proxy scale: nominal physical stroke is only 2.35 mm, and the image stays near face-on. Do not claim visual mechanical clamp PASS. | **E:** add a high-resolution **1080×1920** axial/three-quarter close-up covering pre-pressure and full pressure, with labeled opposing pads and clearance visible; keep the true 2.35 mm physical stroke, **do not exaggerate actual pad translation**. Include paused full-res before/after plus a moving clip. **A** only if close-up reveals geometry mismatch. |
| **MODERATE** | **Frames 300–360 (10.000–12.000 s)** and still 321 | False colour stays largely uniform orange across the whole annulus, not strongly localised around the pad friction patch; changes over time are subtle in the proxy. Disclaimer is present and correctly says illustrative, and the hub is not orange. | **E:** communicate pad-generated heat by temporal ramp/patch or sweep around the swept friction track, and show clear cooling in a subsequent release interval. Stay non-quantitative; no fixed °C claims. |
| **MINOR** | **Frame 48 (1.600 s)** | Ghost sports-car line art is very faint and reads as sparse, intersecting curves; front brake is tiny relative to very large empty upper/lower space. Title is legible. | **E/C via E integration:** refine context framing, simplify stray lines, increase legible front corner without building a full car. |
| **MINOR** | **Frame 705 (23.500 s)** | **Correction verified:** the new caliper is fully inside the left border after the previous clip. However the faint `Carbon-Ceramic Disc` callout is barely visible, and a caliper label is located near bottom/right of disc with leader lines disabled rather than next to the caliper. | **D + E:** tune label onset/contrast and place relative to verified projected parts, or omit the ambiguous callout. Do not draw fabricated leader points. |
| **MINOR** | **Frame 168 (5.600 s)** | Carbon face texture reads speckled/pitted, and caliper remains quite planar/blocky at phone scale despite more sculpted bridges and piston details. Labels `Carbon-Ceramic Disc` and `Rotor Hat` are legible at native 540px but small in the 378px moving proxy. | **E/A:** more grazing light, additional visible profile or camera orbit; keep graphics readable at delivery size. |

**Frame 705 regression resolved:** the original `d9e27ab` frame cropped the caliper past the left edge. The `683b97d` native render shows full caliper and no left-border intersection. The camera fix is **PASS for that frame**, not proof that the complete 630–749 orbit is safe.

## Independent engineering checks

| Requirement | Evidence-based result | Scope/limitation |
|---|---|---|
| Rotor/hat/hub rotate as a unit around axle X | **STRUCTURAL PASS** (GLB rig + film source) | Rotor/spoke orientation changes through sample frames; not a fully tracked 3D motion capture. |
| Caliper/body and upright remain fixed | **STRUCTURAL PASS** (scene graph and stationary sibling in A/E sources); **visually plausible** | Moving camera complicates a pure image-space stationary test. |
| Both pads oppose friction faces, translate along X and never intersect | **SOURCE/BOUNDS PASS:** E's pressure adapter maps each face gap 2.5 mm released to 0.15 mm minimum; max stroke 2.35 mm. GLB has separate inner/outer pad nodes and six piston parts. **VISUAL CONTACT PENDING** | Too little resolution/profile in native clip to inspect exact lining-to-face contact. The finite gap means near-contact, not zero-distance collision. |
| Heated zone confined to swept disc and cools | **PARTIAL:** visible false-colour annulus and unheated hub; disclaimer shown. | Later cooling cycle/heat reset cannot be confirmed from the 300–360 preview alone; heat has uniform look. |
| Materials and proportions appropriate for road-car composite | **STRUCTURAL PASS, LOOKDEV FAIL:** ventilated 390 mm disc, 44 vanes, drilled faces, fixed six-piston caliper; Blender lighting destroys dark material read. | Generic/non-manufacturer-specific original engineering illustration; not OEM CAD or physical simulation. |
| Typography 9:16 | **BASIC PASS** for 48/168/321/705 titles within portrait; **MINOR** callout issues above. | No final 1080×1920 phone UI proof / full 750-frame collision audit yet. |
| Accurate braking claims | **PASS in reviewed titles**: no invented stopping distance, material temperature, or immunity claim; heat explicitly illustrative. | Final voiceover has not been audited as a delivered waveform in a final film. |

## Recommendation / release gate

**CONDITIONAL PASS for the inspected prototype integration only. DO NOT approve a release build or claim Agent D full-film QA PASS.** The new hero reframe is now genuinely source-verified (good). But **major unresolved issues** remain: Blender washout, frame 531 benefit-shot truncation, and the impossible-to-see pad-clamp action at native preview resolution. Improve heat storytelling and secondary labels as above.

Before Master requests Agent F's final delivery, have **A** rerender dark, legible real Cycles hardware previews; have **E** repair benefits framing and provide actual 1080×1920 axial clamp motion and cooling/repeated-brake proof; have **D** re-review those new source-SHA-identified frames. **Master** must accept the exact film SHA. **F** then supplies a new source-locked full **750-frame / 25.0-second / 1080×1920 / 30fps** H.264 final, exact FFprobe frame count, complete FFmpeg decode, phone-safe frame review across all shots, actual approved audio provenance, and actual moving full-length inspection. **No 750-frame final MP4 was reviewed here.**

Artifact authenticity here is supported by actual downloaded archives, local native video decode, source diff checks, recomputed hashes, GLB parsing and direct image inspection; a successful GitHub workflow alone is not cited as proof of artistic quality.
