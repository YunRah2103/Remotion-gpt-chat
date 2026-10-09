# Agent D — carbon-ceramic 001 review rubric

**Status:** graphics implemented; integrated-film QA **PENDING**, not PASS. Do not treat an unregistered composition, frame-layout mockup, or isolated graphics as a fully rendered 25-second film.

## Evidence required before final sign-off

- Master provides full **750-frame** original Remotion output (1080×1920, 30 fps, exactly 25.0 s) linked to a full source SHA and identifiable Actions workflow run/artifact; must include all A/B/C/D integrated commits.
- Native evidence: at least full-res PNG frames **48, 168, 321, 531, 705**; independently examine motion ranges **135–195** and **300–360**, not five stills alone.
- ffprobe confirms codec, exact frames, dimensions, time base and playable MP4; ffmpeg full decode without errors; verify audio provenance if present.
- Inspect phone-safe crop, with top 145 px, left 70 px, right 190 px, bottom 410 px reserved for OS/platform UI; ring/pads remain heroes.

## Scene-specific review (state PASS / FAIL / NOT TESTED for each)

| Frames | Acceptance test | Failure examples |
|---|---|---|
| 0–119 | Outline secondary only, faint context rather than a complete CGI car; title legible and unobscured. | Giant low-quality silhouette; text overlaps front wheel. |
| 120–269 | Friction ring is ventilated and visibly thick; hat rotates WITH disc; caliper stays still; two pads approach opposite faces; labels identify actual parts. | Rotating caliper, only one pad, intersections, floating/misleading labels. |
| 270–449 | Friction band gains non-uniform **illustrative** thermal colour under pad contact, hub does not heat identically, cools when released. Disclaimer readable. | Whole disc red throughout, made-up exact temperature or flame gimmick. |
| 450–629 | Multiple brake applications visible; changing heat and speed; fade resistance qualified; generic cast iron comparison clearly non-quantitative. | Fixed speed or heat; unsupported stopping/weight statistics. |
| 630–749 | Detail-rich hero, stable 3D geometry, silhouette secondary, correct labels, portrait composition unclipped. | Dead white space, childish glow or cropped caliper. |

## Engineering acceptance

1. GLB scale: rotor outside diameter 0.39 m, rotor axis X, disc in YZ; Blender/glTF axes documented. Inspect actual A rig manifest.
2. Pads physically on opposite friction faces and move along axle X, not radially; caliper body and upright fixed.
3. Disc and hat angular velocity coupled; continuous deceleration to rest (no reverse/teleport); inspect B trace and moving native frames.
4. Qualitative heat tied to friction contact; cooling after release; automotive carbon-ceramic, not racing carbon-carbon.
5. No made-up temperature, universal stopping distance, absolute immunity to fade or unapproved VO.
6. No transition flashes, black frames, intersecting mesh faces, overlapping captions or fabricated subtitles.

## Required actual QA report

Record reviewer, integrated SHA, Actions run, media artifact URL, ffprobe metadata, decoded frame count, native screenshots, moving proof ranges, failure frame/time + image, severity (blocker/major/minor), final outcome **PASS / FAIL / PENDING**. Preserve unresolved issues to Master.

## Current preflight

Run \`python3 production/videos/carbon-ceramic-001/qa/check_graphics.py --cues src/brakes001/graphics/graphics-cues.json\`.
Checks cue windows, collision-free labels, allowed part names and portrait safe zones. It **does not** validate actual 3D footage.
