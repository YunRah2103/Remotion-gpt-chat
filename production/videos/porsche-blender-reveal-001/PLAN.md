# Porsche Blender Reveal Implementation Plan

> Execution: inline in this session, as authorized by the user to continue production.

**Goal:** Deliver the approved Blender-to-cinematic Porsche edit with the exact reference soundtrack.
**Architecture:** Blender imports the hash-verified GLB, creates a forest road, animates camera/wheels, and renders paired solid/Cycles views. FFmpeg muxes the copied reference AAC.
**Tech Stack:** Blender 4, Python, Cycles, FFmpeg, GitHub Actions.
**Spec:** DESIGN.md

## Global Constraints
1080x1920, 30 fps, 479 frames; reveal at frame 214; approved model unchanged; original audio retained; no main-branch edits.

## Review Focus
- glTF coordinate conversion and true wheel spin axis.
- Ground contact and frame-safe camera shots.
- Lighting/car visibility in the final scene.
- Continuous motion across solid-to-Cycles reveal.
- Exact soundtrack and complete video decoding.

### Task 1: Scene and proof
- [ ] Build scene.py and asset download with SHA-256 verification.
- [ ] Validate Python syntax, render frames 0, 180, 213, 214, 270, 319, 369, 418.
- [ ] Inspect full-size proof/contact sheet and adjust visual faults.

### Task 2: Native animation
- [ ] Render 479 Blender frames using bounded GitHub jobs.
- [ ] Preserve scene.blend and source SHA in the downloadable artifact.
- [ ] Inspect moving preview and transition.

### Task 3: Audio and delivery
- [ ] Copy AAC from uploaded reference.
- [ ] Encode 479 frames H.264 yuv420p and mux audio with exact original timing.
- [ ] Compare audio packet hashes, decode whole MP4, FFprobe frame/resolution/fps check.
- [ ] Save and deliver MP4.
