# A1 V6.3 Camera Hand-off for Agent 4

A1 contract: metres, +Y up, +Z nose, +X vehicle right. A1 proof cameras are deterministic and isolated; A4 controls final shot composition, focal length, pacing and lighting.

## Verified moving front three-quarter hero

Native `A1V6FrontThreeQuarterHero`, 120 frames / 4 seconds / 30fps, verified in [run 39065514179](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39065514179), [downloadable proof MP4](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39065514179/artifacts/12112793802).

- Frame 0 camera: `(-5.60, 1.57, 7.50)`, aim `(0, 0.76, 0.85)`, perspective FOV 44.
- Frame 119 camera: `(-3.60, 1.45, 6.40)`, same aim and FOV.
- Transform via cubic smoothstep frame/119 and correct `camera.lookAt`; no inter-frame discontinuity.
- Render with `VehicleWorld frame={frame} variant="hero" travelMeters={frame * 0.14}` to keep wheels/road physically synchronous.
- First V6 hero lens/lip inspection rejected because front bumper was clipped. Wider camera and higher aim corrected front body visibility. Confirmed frames 0,15,30,45,60,75,90,105,119.

## Existing four-shot inspection rig

| Shot | Aim (m) | Opening camera (m) | FOV | Frames |
| --- | --- | --- | --- | --- |
| FRONT_HEADLAMP_DUCT | (-.48,.70,1.83) | (-3.75,1.72,5.0) | 35 | 0–29 |
| WHEEL_BRAKES | (-.858,.355,1.47) | (-2.65,.96,3.08) | 31 | 30–59 |
| REAR_ENGINE_REVEAL | (0,.98,-1.51) | (-3.15,2.55,-4.28) | 37 | 60–89 |
| REAR_HERO | (0,.81,-1.35) | (4.28,2.12,-6.32) | 38 | 90–119 |

Visual risks for Agent 4: avoid the more frontal dead-center long lens that flattens the front fascia; keep a low off-axis angle that shows the new haunch and wheel arch. Test headlamp readability under A5 lookdev at final target resolution. Never cover the new apertures with extra bonnet decals. The rear hatch remains `variant="reveal"` plus `revealProgress`; the actual mechanical pivots, wheel angle, +Z forward anchors and wheel radius are unchanged. No manager creative approval is asserted in this handoff.
