# A1 V5 Close-up camera handoff for A4/A6

Axes right-handed **+Y UP, +Z vehicle nose, +X right**, measured in metres. A1 proof-only camera values are inspected and deterministic. A4 may use these as starting points but owns the actual episodic cameras.

| Shot | Camera target (m) | Approx starting camera (m) | FOV | Preview frames |
| --- | --- | --- | --- | --- |
| FRONT_HEADLAMP_DUCT | (-0.48,0.70,1.83) | (-3.75,1.72,5.00) | 35 | 0–29 |
| WHEEL_BRAKES | (-0.858,0.355,1.47) | (-2.65,0.96,3.08) | 31 | 30–59 |
| REAR_ENGINE_REVEAL | (0,0.98,-1.51) | (-3.15,2.55,-4.28) | 37 | 60–89 |
| REAR_HERO | (0,0.81,-1.35) | (4.28,2.12,-6.32) | 38 | 90–119 |

## Integration details

- The preview employs separate 30-frame moving tracking cameras for checking model surfaces, **not** full film edit or approved picture timing.
- For engine detail, set `variant="reveal"` and animate `revealProgress` linearly 0..1 for a smooth-eased real hatch hinge. Engine parts are conditional, hidden with deck closed.
- For driving, `travelMeters=frame*.12` in review; wheel angle follows distance / 0.355m exactly. Avoid spinning an externally mounted wheel pivot a second time.
- Shared A5 lookdev references: deep teal `BODY_TEAL_ENAMEL`, `HEADLAMP_OUTER_CLEAR_LENS`, `HEADLAMP_INNER_SMOKED_OPTICS`, `ACTUAL_PERFORATED_BUMPER_FASCIA`, `RIM_MACHINED_SPOKE`, `DRILLED_BRAKE_DISC`, `ENGINE_INTAKE_PLENUM`, `ENGINE_BAY_BRACING`, `REAR_LED_CRIMSON`.
- Don't recreate giant warm floodlight that blows out teal; place camera-left cool key and camera-right warm rim, maintaining legibility at phone size.
- Low-poly stylisation is deliberate; A4/A5 should still check no visible floating optics, hardware clipping, wheel ground contact and hatch clearance with their own light rigs.
