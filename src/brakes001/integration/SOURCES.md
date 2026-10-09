# Source-locked specialist imports — Carbon-Ceramic 001

Agent E cherry-picked **blob-identical** files only, without modifying specialist-owned source. GitHub Git Trees entries use the original blob SHAs; import commit: \`138cb4cd3d8bc07c2c0e46ae5604fd8fe05aada6\`.

| Agent | Imported from live branch head | Handoff implementation sourceSha | Directories |
| --- | --- | --- | --- |
| A · hardware | \`3d02dfa264b1af51f8ae39f990e8815f5c20ecdf\` | \`a201cefa64cef0f797deba34ddfbd55c58967d33\` | \`src/brakes001/hardware/**\`, \`production/videos/carbon-ceramic-001/hardware/**\` |
| B · motion / thermal | \`37b661eaba75477de4d967f430da270c399818a7\` | \`4a815e73c4e3dbc28b686e20910fdfc8865cd1bc\` | \`src/brakes001/motion/**\`, \`production/videos/carbon-ceramic-001/physics/**\` |
| C · cinema / x-ray | \`09c6b0a4a8acd0e4625fa35cad50f3d10f37388e\` | \`eca01d9f937d059e21ad935396e4293fc784cbb5\` | \`src/brakes001/cinema/**\`, \`production/videos/carbon-ceramic-001/lookdev/**\` |
| D · graphics / rubric | \`e31ded3731014f9c2a22148f7a32408e92e38bdd\` | \`f8bdea2b6cb8f503b119621aaaaabe8034e6bafe\` | \`src/brakes001/graphics/**\`, \`production/videos/carbon-ceramic-001/qa/**\` |

Original specialist JSON and Markdown handoffs were also copied verbatim from each specialist branch.

## Integration wiring
- A \`BrakeAssembly\` receives B \`rotorAngleRad\`, per-face \`padGapMetres\` and illustrative \`heat01\` through E \`integrationStateAt\` adapter.
- A's \`RotorAssembly\` rotates about X; its \`RotorHat\` and \`Hub\` are descendants. A's \`CaliperBody\`, \`PadInner\`, \`PadOuter\` remain stationary or translate independently.
- C \`BrakeCameraRig\` + \`BrakeLighting\` frame-match five specified ranges. C \`GhostCarOutline\` appears only in intro; at the corner anchor \`[0.85,0.45,-1.42]\` the original A brake model is shown at physically consistent 1:1 scale.
- E adds annulus-only rotating translucent illustrative heat on both friction faces, X=±0.0158 m, and only during frames 270–629. Heat value comes from B, NOT arbitrary CSS timing.
- D \`TitleOverlays\` + \`PartLabels\` run atop the ThreeCanvas, with unverified leader lines disabled rather than pointing to false locations.
- E registers 1080×1920 / 30fps / 750 frames in \`src/Root.tsx\`, preserving every preexisting composition.

## Known gaps
A's Blender builder and manifest are design-time contracts and have **no verified native GLB, bounds report, close-up or Blender binary**. Until verified, integration cannot be declared ready for release. Native Remotion 61-frame clamp/thermal previews, five review stills and complete FFmpeg validation are required for E readiness and D independent signoff. E handoff must truthfully list CI runs and artifacts once verified.
