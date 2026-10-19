# EP002 — Camera polish for the approved shorter 23.2s edit

**Source branch:** `agent/f1-ep002-08-camera-polish`, based directly on the
user's previous Agent 7 audio/ending edit `agent/f1-ep002-07-voice-engines-sfx`.

**Purpose:** Make the picture feel like premium racing footage without moving
any physical car, fabricating a faster lap, adding camera-shake nausea, or
reintroducing the previous grain/washed-out look.

## Camera work actually implemented

- **Opening:** immediate lower, sweeping oncoming three-quarter tracking with
  subtle optical push; both cars remain on screen within the 9:16 safety frame.
- **Teal short line:** lower pursuing dolly with advancing side parallax,
  showing the hard braking and tighter apex.
- **Apex:** car/kerb proximity, less constant fixed viewpoint, no cropped tyres.
- **Amber wide entry:** opposite tracking angle with smoother sweep and enough
  surrounding circuit to see the longer radius.
- **Comparison overhead:** purposeful crane transition showing the racing
  ribbons attached to the real Agent 1 track.
- **Onboard:** stable halo-height view, small deliberate steering-follow feel.
- **Force/explanation:** steadier oblique framing to preserve visual teaching.
- **Race payoff:** lower chase view and greater speed perspective, with
  exact 16–21.8s Agent 2 real-time source intact.
- **Ending:** shortened 23.2s cut with a controlled rising hero reveal; does
  not return to the old 26s silence-filled ending.

## Technical safety

`editor/premiumCamera.ts` uses deterministic relative camera offsets within
the original 14 cuts. `portraitProtect` reprojects actual 3D Formula tyre and
wing bounds and pulls back only as needed to avoid truncating cars in 9:16.
All pitch, A2 physics, waypoints, exact 0.132s illustrative timing, race
telemetry, original car models, original 26-second edit, music-free audio
assets, typography and rendering colour pipeline are retained.

The new native compositions are:

- `YUNEXF1EP002Premium23s2`: 1080x1920, 30fps, **696 frames / 23.2s**.
- `YUNEXF1EP002Premium23s2Preview`: 540x960, 30fps, **696 frames / 23.2s**.

The original 780-frame composition IDs remain unchanged.

## Verification

Automated `tests/f1-line-ep002/agent-8.premium-camera.test.mjs` covers
frame continuity, source reset, real 0.132s delta, deterministic seeking,
distinctive camera changes, and projected Formula wing/tyre crop margins.

GitHub Actions `f1-ep002-agent-8-cameras.yml` performs actual native software
WebGL renders to 540p and 1080p, original Agent 6 colour-safe BT.709 limited
H.264 picture encoding, 696-frame FFprobe validation, full FFmpeg decoding,
moving-frame uniqueness, black-frame detection and frame still inspection.

**Important:** Source action outputs are SILENT picture-only masters. The
user-provided Cedar voiceover and no-music, non-buzzy effects master remain
in the ChatGPT workspace from V3. To create a real deliverable, use a
successful and visually reviewed native 1080p picture render and stream-copy
the 23.2s audio track from the user's existing V3 review MP4, preserving
its exact audio encoding, timing and loudness. Do not call a full final film
finished before that mux and verification step actually completes.
