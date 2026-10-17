# A1 vehicle — suggested mobile camera anchors (for A4/A6)

All positions are metres in **right-handed Y-up, +Z vehicle forward** space. Look-at target generally (0,0.80,0). These are suggestions only; A4 owns production camera moves, A6 shot timing.

| Composition | Camera position | FOV | Why |
| --- | --- | --- | --- |
| Front three-quarter tracking | (-4.0,2.45,7.2) | 35° | Shows sculpted nose, roof and wheel assembly. |
| Low wheel pass | (-2.1,0.85,3.2) | 43° | Wheels and front intake occupy phone screen. |
| Side-body parallax | (-6.4,1.65,0.2) | 38° | Shows engine bay behind cockpit and coupe length. |
| Rear glowing LED payoff | (3.6,2.0,-6.5) | 38° | Wing, taillamps and wheel stance. |
| Engine reveal | (2.1,3.8,-2.65) | 32° | Uses `variant="reveal"`, `revealProgress` 0..1. |

## Lighting and A5 material hooks

Use camera-left cool key, camera-right amber rim to match shared contract. Keep hero car visible and avoid extreme contrast flattening the teal body. Original A1 preview uses neutral local lights solely for proof. Preserve clearcoat metalness + matte rubber and preserve emissive trim slots. No logos or exact real car geometry.

## Motion

For 30fps, illustrative speed `travelMeters=frame*0.24` gives 7.2 m/s (26 km/h). For final punchier car movement, increase consistently for road and wheel together; avoid separately spinning wheels. `VehicleWorld` uses deterministic frame-driven road wrapping. Road top y=0, tyre tangency y=0 exactly. Frame-based preview shows camera orbit and rear tracking.

## Known quality notes

Low-poly CGI aesthetics are deliberate (angular faceted road trees and auto body). Additional A5 shader/lighting treatment and A4 hero camera choreography are encouraged, but never overwrite this original A1 geometry during shared work.
