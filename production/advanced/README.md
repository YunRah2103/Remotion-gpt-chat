# Advanced 3D Production — six additional tools

**Scope:** \`YunRah2103/Remotion-gpt-chat\` only. Never access, copy or modify \`YunRah2103/yunus-video-lab\` or YUNEX assets. These are optional additions, not edits to existing films.

## 1. Blender-to-Remotion asset pipeline

A **real** Blender scene file (\`.blend\`) can be exported to self-contained binary glTF 2.0 (\`.glb\`) without applying/destructively baking away object origins or named animation pivots.

- Config: \`production/advanced/contracts/rotor-demo.json\` (replace the example object names and units).
- Contract validator: \`python production/advanced/asset_contract.py ...\`.
- Real Blender GLB exporter: \`production/advanced/blender_export.py\`. Includes source object hierarchy, custom attributes in glTF extras, Blender-exported animation and a SHA256 pivot manifest.
- Existing \`studio.py inspect\` additionally generates node and material inventory.
- Run GitHub Actions **Advanced Studio — Blender export, AO bake and clearance proof** with an Actions artifact containing an original approved \`.blend\`. The exporter uses \`--disable-autoexec\` and has file-size bounds.
- Outputs are **Actions artifacts**, not committed to the repository automatically. For permanent use: review the GLB visually and technically, then put the **approved asset** at \`public/mechanics/<name>.glb\` in a separate PR. Use \`src/advanced/ImportedMechanism.tsx\` inside a ThreeCanvas; its named-pivot animation uses the Remotion frame, not wall-clock animation.
- No claim of automatic manufacturer-accurate CAD, tracked-source access, or visual signoff.

The exporter uses the standard Blender glTF operator with \`export_format='GLB'\`, \`export_extras=True\`, \`export_animations=True\`, \`export_yup=True\`. The unit convention is specified in the contract; verify real-world dimensions after Blender's glTF axis conversion.

## 2. Interactive shot comparison

Pages route \`/compare/\` is a browser-only A/B studio. Use two locally selected MP4/WebM files. You can play/pause them together, seek through both, set offset and playback speed, zoom in, export one side-by-side PNG and save timestamped review notes to a JSON file. **The files remain local**; they are not secretly uploaded. This isn't an AI vision engine and does not replace watching the native footage.

The existing \`production/portal/build.py\`, video catalogue and Pages deployment have been updated to include the comparison UI.

## 3. Real sampled collision / clearance audit

- \`production/advanced/blender_clearance.py\` collects real **evaluated world-space AABB bounds** of Blender parts over an explicitly selected set of animation frames; output \`world-aabb.json\`.
- \`production/advanced/clearance.py\` calculates axis-aligned overlap volumes and reports specific part-pair/frame warnings.
- Config \`production/advanced/contracts/clearance-demo.json\` controls object names, frame samples, tolerances and **allowed contact pairs** (disc/caliper intentional proximity etc.).
- This is conservative **broadphase**, not exact triangle collision, tyre-ground dynamics, contact forces or full-range clearance certification. Adjacent but disjoint concave meshes can produce false positives. Inspect warnings in Blender/native videos.

## 4. Source-locked render recovery

Use **Production — repair only missing native render chunks** workflow with the run ID of a real \`Production - automated preflight, 3D proofs and final master\` production run.

- Verifies the **same GitHub repository**, originating workflow name and immutable source commit SHA.
- Downloads the successful preflight plus available original five-part render artifacts. FFprobes each against its expected frame range and 1080×1920 30 fps geometry; invalid or absent chunks are considered missing.
- Dispatches only those missing parts in a matrix job at the **original source SHA** with the original props; untouched valid chunks are reused.
- Concatenates all five, confirms exact frame counts, runs a complete FFmpeg decode, writes a SHA256 proof and returns a **recovered visual-only candidate** artifact.
- **Does not silently mix another revision's chunks.** Narration must be muxed separately again when originally requested.
- Requires the original run's Actions artifacts not to have expired. It cannot recover work that never had a preflight artifact. A completely broken Blender/Remotion model still needs a code fix, not only a rerun.

Recovery logic has unit tests; full live recovery requires a suitably failed production run and should not be claimed validated merely because a smoke test succeeds.

## 5. Real AO + tangent-space normal texture baking

Headless \`production/advanced/blender_bake.py\` produces real texture PNG maps from UV-unwrapped original Blender meshes, with SHA256 provenance. Opt-in modes:

- \`mode: "ao"\` — real Cycles ambient-occlusion bake of named target meshes.
- \`mode: "normal"\` — genuine tangent-space selected-high-to-active-low normal bake from explicit \`highSources\`.
- \`mode: "both"\` — both maps and a manifest.

Examples: \`bake-demo.json\`, \`normal-demo.json\` in \`production/advanced/contracts/\`.

Maps are **not automatically wired to glTF occlusion/normal nodes**. An artist must review UV seams, bake quality, texture colour spaces, normal directions and exported materials before publishing; export preserves original .blend file.

## 6. Native two-environment MP4 generator

New shared original 3D Remotion composition: **\`EngineeringDualVersion\`**, with \`variant: "studio"\` or \`"circuit"\`. Both contain the same mechanical demonstration and frame-based animation. They use genuinely different geometry around the scene (studio floor versus asphalt/kerbs/barriers), technical lighting and camera angles. This is a **schematic rotating brake assembly test**: not a complete automobile, ABS dynamics simulation or completed episode.

Workflow **Advanced Studio — produce both 3D environment versions** renders both variants in parallel from the same immutable Git commit. **Proof** mode generates 36-frame preview MP4s; **final** mode generates two 750-frame 1080×1920 H.264 MP4 candidates, each individually decodable and SHA256-hashed. It does not invent narration, auto-publish or replace the separate YUNEX brand.

For adapting an *existing* film, replace the schematic mechanism with the approved shared model/source composition and verify both environments and shot requirements before calling them finished films.

## Verification

GitHub Actions **Advanced Studio — six-feature native integration tests** runs:
- Python unit tests for rig contracts, scene-clearance warnings and exact render-recovery intervals.
- Browser comparison JS syntax and actual static Pages build.
- Native Blender-generated source .blend, GLB export and hierarchy inspection.
- Real Blender sampled bounds + broadphase clearance review.
- Real Cycles AO and selected-high-to-low tangent-space normal-map baking.
- Remotion TypeScript compilation and **two visibly different** native short MP4/PNG proofs.

**Important:** A passed 3-frame proof is not a completed final 750-frame video. Full Blender export from arbitrary user assets, full render recovery and 750-frame dual-version final output are still separate production tasks and may encounter source-specific geometry/resource issues. Check the exact Actions run and outputs.

Tools are standalone and do not deploy AI workers or paid GPU compute. The GitHub Copilot custom agent profiles remain instruction files only until activated by the owner.
