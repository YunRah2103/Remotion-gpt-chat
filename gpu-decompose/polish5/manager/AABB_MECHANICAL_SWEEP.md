# GPU POLISH05 — independent mesh-bound mechanical sweep (B)

**Model:** exact successful A GLB binary SHA256 `254b6c0579f294c44598f4623a3b04a108d5bc728c44420dd43194f445f3a296`, artifact **11582001775**, source **a24aa7434e220f25eed580e93cd7b449c41deb1a**.

**Status:** preliminary AABB / rig-compatibility evidence, **not** triangle intersection certification or native visual authorization.

## Method

Parsed actual binary glTF v2 node graph and per-mesh `POSITION` accessor min/max bounds; recursively combined glTF local rest transforms and the precise approved 13 smoothstep position deltas at sample frames `0,90,115,135,151,159,167,180,210,225,250,270,310,329,365,415,449`. For each animated named hierarchy, recursively unioned 8-corner mesh AABBs in scene units, not hand-drawn proxies. Rotation deltas are zero in this motion JSON. AABB overlap is deliberately conservative and can register false geometric collisions (e.g. distant details in different X/Y positions and a box spanning them).

## Observed separating layer gaps in Z (scene units, conservative AABB)

| Snapshot | Central fan vs front shroud | Cold plate vs GPU die | PCB assembly vs backplate |
|---|---:|---:|---:|
| frame 0 assembled | +0.092 overlap | +0.007 overlap (contact expected) | +0.002 overlap (backplate contact expected) |
| frame 115 | **0.111 clear** | assembled contact | assembled contact |
| frame 135 | **0.659 clear** | assembled contact | assembled contact |
| frame 270 | **0.748 clear** | **0.166 clear** | assembled contact |
| frame 310 | **0.748 clear** | **0.062 clear** | **0.059 clear** |
| frame 329–449 | **0.748 clear** | **0.073 clear** | **0.723 clear** |

These values measure the *nearest Z-side AABB separation* for intentionally related hardware, not Euclidean closest-triangle distances. Fan extraction is conservatively past the front-shroud envelope after frame 115. Thermal contact becomes visibly separated by frame 270. Backplate stays attached until its release in frames 304–329, then separates.

**Open item:** broad `FRONT_SHROUD` and `HEATSINK` hierarchy AABBs overlap by about 0.099 scene units along Z at the exploded payoff, likely due full-card unions and grill/fins footprint: **potential overlap needs an actual native pixel review.** Also `HEATSINK` includes children `HEATSINK_FINS`, `HEATPIPE_BUNDLE`, `COLD_PLATE`, so no meaningful parent-child collision claim can be derived from their box intersection. Neither this script nor group AABBs prove physical part clearance along every polygon during swept motion.

## Mandatory follow-up

Review true rendered native moving clips at 75–105,130–165,190–220,245–285,315–355,395–449 from exact POLISH05 GLB, and 12 1080x1920 stills. Pay special attention to shroud/cooler separation and PCB silhouette at 225/270; if overlapping in the actual image, retune motion offsets, then rerender. Do not mark final geometry as intersection-free based on this preliminary bounding-envelope audit.

**Release gate remains `model-verified`: full 450-frame rendering NOT authorized until integrated pixel review passes.**
