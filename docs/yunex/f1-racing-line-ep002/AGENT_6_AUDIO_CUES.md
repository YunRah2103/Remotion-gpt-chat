# YUNEX F1 EP002 — Agent 7 picture / sound handoff

**Film:** WHY DO F1 CARS TAKE THIS RACING LINE?  
**Picture:** 26.000 seconds; 780 frames; 30fps; 1080 × 1920; native Remotion 3D.  
**Status:** first-cut picture source, NOT an approved sound master. NO spoken VO or licenced engine SFX shipped by Agent 6.

## Suggested natural, concise narration (subject to A7 performance and picture lock)

> Why take the longer way around a corner? Watch the teal car cut straight in. It saves distance — but that sharp turn forces it to slow down. The amber car enters wide and clips a gentler arc. With more speed through the corner, it accelerates harder onto the straight. Same car. Same corner. Our simulation gives the longer line a faster finish, by just over a tenth. The shortest route isn't always the quickest.

~60 words. **A7:** record human-sounding natural VO and edit for breath; avoid talking continuously through major engine moments. If narration cannot fit, simplify, don't speed it up. Never imply true measured F1 lap telemetry.

## Frame-accurate sound and dialogue marker sheet

| Film time | Frame(s) | Picture | VO / engine / music treatment |
|---|---:|---|---|
| 00:00–00:02 | 000–059 | Low head-on / two-colour ghost comparison hook | Opening racing-engine rise immediately, tight whoosh on the first cut. VO: "Why take the longer way around a corner?" |
| 00:02–00:04 | 060–119 | Teal shortcut pursuit | Tone down engine below narration. VO: "Watch the teal car cut straight in." Brake onset, downshift, restrained tyre load |
| 00:04–00:06 | 120–179 | Tight apex-side shot | Low brake/throttle surge from A2 state. VO: "It saves distance — but that sharp turn forces it to slow down." |
| 00:06–00:08.33 | 180–249 | Amber wider entry tracking | Gentle stereo pan and coherent spatial engine pass. VO: "The amber car enters wide..." |
| 00:08.33–00:10.07 | 250–301 | Aerial curve reveal | Soft spectral transition, no artificial impact. VO: "...and clips a gentler arc." |
| 00:10.07–00:11 | 302–329 | Onboard-inspired cut | Air/wind rush, avoid clipped VO tail |
| 00:11–00:13.40 | 330–401 | Tyre force/corner-radius reveal | Instrumental dip for explanation. VO: "With more speed through the corner..." |
| 00:13.40–00:16 | 402–479 | Apex comparison | VO: "...it accelerates harder onto the straight." Crescendo to timing reset |
| 00:16–00:18 | 480–539 | Real-time A2 start, paired race | Music pulse on exactly frame 480. **Reset engine motion from source t=0**; clearly a fresh timing replay, not a continuous camera feed |
| 00:18–00:19.60 | 540–587 | Matched race overhead | Speed/engine modulation must read actual A2 speedMps; no invented gear count |
| 00:19.60–00:21.80 | 588–653 | Physically timed finish | Builds to B finish at approx picture 21.594s (frame ~648); A finishes ~21.726s (frame ~652). The advantage is only 0.132s. Do NOT add a car-length pass or a timing exaggeration |
| 00:21.80–00:23.90 | 654–716 | Final car hero replay | VO: "Same car. Same corner. Our simulation gives the longer line a faster finish, by just over a tenth." Downbeat resolve at 21.80 |
| 00:23.90–00:26.00 | 717–779 | Final accelerating cinematic exit replay | VO: "The shortest route isn't always the quickest." End with musical cadence and car accelerating into frame; avoid a static outro |

### Editorial rules for Agent 7

- **Physics audio:** sample true A2 `sampleRaceFrame` at the matching *source* timestamps from `editor/timeline.ts`, never continuous film time during earlier explain/replay shots.
- **Tyres:** restrained tyre deformation/road hiss, **not** a prolonged skid. Driver is grip limited, not drifting.
- **Gear changes:** add only if they are a plausible embellishment; there is no authoritative gearbox state, so never claim precise gear or RPM telemetry.
- **Identity:** teal = A shortcut; amber = B wider racing line. Same representative vehicle and input assumptions.
- **Mix:** preserve clear natural narration and mono compatibility; handle peaks and final LUFS analysis after A7 audio assets are introduced. Agent 6 is a **silent picture**, not a final `_FINAL.mp4`.
- **Last frame:** video is motion-based. Do not replace with a branded logo or a static slide.
