# Carbon-Ceramic Brakes 001 — Agent D Polish 03 independent FULL CANDIDATE QA

**Decision: FAIL for public release; NOT READY to label an Agent F final render as approved.** The genuine existing 25-second candidate is mechanically plausible and technically sound, but the largely static final six seconds and insufficiently demonstrated opposing-pad clamp remain high-impact creative problems. **One focused Agent E composition/camera correction is warranted, not another hardware/Blender reconstruction round.** A diagnostic rerender may proceed, but must not be called release-approved.

**Visual quality rating of the actual full candidate: 5.8/10.** The newer E source is NOT assigned a full-film visual rating because its complete 750 frames have **not** been rendered and visually reviewed. A's separate Blender materials receive an independent *asset/lookdev pass*, not a film pass.

Reviewer: GPT-6 Agent D | Review: 2026-10-09 | Repo: `YunRah2103/Remotion-gpt-chat` | D branch: `automotive-brakes-001/d-graphics-qa`.

## Source and artifact provenance — never mix these SHAs

| Deliverable | Specific SHA and evidence |
|---|---|
| **Actual 750-frame candidate E source code** | `5b378202187748ce9b51d884f26bb7167285c946` |
| **Actual F candidate assembly workflow** | run [37978273707](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707), workflow head `dcc710b04478784233fda1743904cee9e7b057af`, SUCCESS |
| **Downloaded full genuine MP4** | [artifact 11639835454](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707/artifacts/11639835454), `carbon-ceramic-001-candidate.mp4`, 12,875,114 bytes |
| **Verified MP4 SHA256** | `e7ed2619ab6ed09087cdb50cfc2b4fb94e3262aa69da77b72e5142bcb51bec73` |
| **Newest actual E film-code commit supported by separate native proofs** | `37e04ee309dc9f96e63ad1b4eda28f25fea3a96a` |
| **Newest E documented branch HEAD at review** | `17448993b56d33ef4fbe416f266a0b9eda865691` (after film code, A-only Blender tooling/handoffs, integration report; not another complete movie) |
| **New E shot, heat, high-res clamp evidence** | [native 5 stills + 2 clips (11639302827)](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976988034/artifacts/11639302827); [1,080p clamp (11638383796)](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976988178/artifacts/11638383796); [benefits/thermal sweeps (11638918513)](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976988178/artifacts/11638918513) |
| **A Polish03 Blender** | code `f22ba2e5b2498baa52d0a22121a2f05153d894a9`; [native artifact 11638453325](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37976686710/artifacts/11638453325) |

Independent GitHub comparison: candidate source `5b378202...` → E native source `37e04ee...` changes **only** the E Polish03 workflow and `src/brakes001/CarbonCeramic001.tsx` (one-line benefit camera/framing adjustment) and `src/brakes001/integration/FrictionHeatMap.tsx` (small heat-map logic adjustment). E source `37e04ee...` → head `1744899...` changes only Blender-script/lookdev references and handoff reports; **no film runtime or hero camera replacement.** C's unchanged `brakeCameraAt` controls the final hero. Therefore the candidate's minimally changing hero is **not evidenced as fixed** by the newer E source.

## Independently executed QA and viewing method

1. Downloaded the exact 15 MB Actions candidate ZIP and extracted real MP4, five full-res standalone sample PNGs, contact and machine reports. MP4 SHA256 matches its immutable source manifest; H.264 video stream `yuv420p`, **1080×1920**, 30/1 fps, **750 exact frames**, **25.000000s**, no audio stream.
2. **Independent local `ffmpeg -v error -xerror -i carbon-ceramic-001-candidate.mp4 -map 0:v:0 -f null -` full decode: PASS, all 750 frames processed**. Source F workflow reports native render chunk integrity; the local check independently verifies the delivered file but cannot reconfirm remote rendering decisions.
3. Extracted **75 full-film thumbnails every 10 frames** (0.333s apart) into five consecutive chronological contact sheets 0–149 / 150–299 / 300–449 / 450–599 / 600–749. Examined full-resolution frames 48,168,321,475,510,531,600,630,700,705,749 and shot transitions. Computed per-frame downsized grayscale differences on **all 750 frames**. **The available review environment does not provide continuous real-time video playback, so this is dense native frame-sequence review + complete decode, NOT a claim that the full 25s was viewed as normal-speed continuous playback.** This limitation does not erase the clear long-duration low-motion evidence; Master should also screen final full video in real-time.
4. Downloaded/extracted **three actual E video preview packages**: 61-frame 378×672 clamp 135–195, 61-frame 378×672 heat 300–360, **61-frame 1080×1920** extra pad-onset macro (film input frames 85–145) and **41-frame 540×960** benefits camera 510–550; independent FFmpeg **complete decode PASS for each**.
5. Viewed E thermal proof's 12 individual frames 270,290,305,321,345,365,395,425,445,470,515,605; benefits stills 450,465,480,500,510,531,550,575,600,620,629; genuine macro frames 0/10/20/30/45/60; and A's true Cycles before/after comparison and native image renders. Independently calculated A03 GLB SHA256: `645c4b7fbe11ea5c9715bed2eb979ae6e96ba3d3c34f85f74553b02f7ea977db`.
6. Checked actual E code, C camera math, E integration report, A handoff and F candidate manifest; do not confuse a separate Blender GLB and studio lighting with runtime's procedural Three.js `BrakeAssembly`.

### Full-film motion result — real frames, NOT assumed freeze

Per-frame absolute grayscale difference was evaluated at 144×256, excluding no pixels (large dark background dilutes the values; it is an indicator only).

| Candidate segment | Average mean pixel delta / consecutive frame | Proportion of frames delta < 0.25 | Interpretation |
|---|---:|---:|---|
| 120–269 (4.0–8.9s) | 1.574 | 0% | The reveal has real changing detail/rotation. |
| 270–449 (9.0–14.9s) | 1.521 | 0% | Camera/rotor changes; heat storytelling limited. |
| 450–599 (15.0–19.9s) | 1.303 | 4% | Measurable movement; not universally frozen. |
| 600–749 (20.0–24.97s) | **0.236** | **74%** | Approx. 6.7× lower motion than reveal; the image mostly holds. |
| 630–689 (21.0–22.97s) | 0.294 | 76.7% | Final hero appears near-static. |
| 690–749 (23.0–24.97s) | 0.219 | 68.3% | Final hero continues to barely move. |

The file is NOT a failed/static render: consecutive frames differ, the E source runs smooth camera/orbit math, slow changing rotor materials and fading text. This is an **artistic/readability** issue: the difference is too subtle for attention retention at phone size. The frozen-effect alerts at ~15.8–16.9, 18.2–19.1 and 19.1–24.8 are heuristic and not proof of identical frames; the detailed analysis separates 15–19 moving from 20–25 nearly still.

## Candidate chronology and prioritized defects

| Severity | Actual timestamp / exact frames | Genuine visual finding | Recommended owner/action |
|---|---|---|---|
| **MAJOR — key release blocker** | **19.0–25.0s; frames 570–749**, strongest **20–25s / 600–749** | Brake assembly occupies a nearly unchanging centre-left pose for roughly last 5+ seconds. Camera and hardware do change numerically, so this is *not* encoding corruption, but final hero lacks a satisfying visible orbit/reframing. Text dissolves while object stays nearly static. | **E:** one focused hero-camera adjustment with a visible but mechanically truthful 3/4 orbit/dolly push or profile-to-3/4 reveal during **630–749**; ensure entire brake stays in portrait-safe frame and fade/ending has visual payoff. Render hero-only 630/665/700/735/749 frames + short 630–749 H264 before one final full F render. Do NOT spin a stopped rotor just to add action. |
| **MAJOR — teaching clarity** | **0–120 (0–4s)** initial pressure onset and **120–269 (4–9s)** main reveal | Normal main film shows a spinning disc and fixed caliper, but close-to-realistic pad travel remains imperceptible at ordinary playback scale; two opposing pads clamping are not taught visually. This is NOT a mechanical geometry failure. | **E:** if quality goal is a comprehensible engineering explainer rather than a beauty-loop, insert a brief labelled axial/cutaway emphasis into main timeline using the already-proven `BrakePadMacro001` framing, without exaggerating actual travel; avoid making it a full new modeling round. F must render any inserted shot anew. |
| **MAJOR in candidate, corrected in new E native proof** | **10.0–14.9s / frames 300–449**, e.g. 321,360,395 | Candidate rotor broadly changes tan/warm tone across most of disc; doesn't demonstrate the physical pad-adjacent heat patch and recovery clearly. | **E correction already proven** in separate source `37e04ee`: native thermal 305→321→365 hotspot and 395→445 release/cooling show meaningful spatial heat; **no further thermal redesign requested**. Must appear in new final 750 frames before release signoff. |
| **MINOR** | **0–2.0s / frames 0–60**, especially 48 | Intro ghost car is thin/faint at phone scale, with significant unoccupied space. Title clear and within left/top UI-safe planning bounds. | **E/C** optional increase ghost contrast a little; do not build a whole car, and do not delay the decisive E hero revision. |
| **MINOR** | **6.7–8.8s / frames 200–265**, plus **23–24.5s / frames 690–735**, e.g. 705 | Part labels are tiny for mobile, and the hero `Caliper` label visually points toward lower rotor instead of upper-left actual caliper, because leader lines are disabled. `Carbon-Ceramic Disc` label faint. | **D/E** optional shorten and relocate callouts using measured anchors or omit low-contrast ambiguous names; never invent fake leader lines. |
| **MINOR** | **4–25s / frames 120–749**, especially hero 705 | Flat and somewhat boxlike caliper read, uniformly textured composite that can resemble stone, inconsistent specular separation; acceptable as original illustrative CGI, not premium photoreal automotive hardware. | **E lighting/camera** prioritize grazing/view angle, not wholesale remodeling. New **A Blender-only** lookdev is correctly dark but does **not automatically change procedural film materials**. |
| **MINOR / editorial** | **22–25s / 660–749** | High-contrast uppercase payoff legible; finish has no additional dramatic change, and candidate is silent. | **Master/F:** add only preapproved VO/audio when available; never fabricate narration. A silent review candidate is valid and not a technical failure. |

**Important correction to old QA:** Older Polish02 D review identified a left-border frame531 crop; **the actual F candidate frame531 inspected at 1080×1920 already retains the visible caliper within frame**, so do **not** falsely report the historical regression as a new F clipping defect. New E source improves benefits composition and sampled 531 further. The newer E 450–629 film native sweeps show caliper/ring fitting in all 11 checked frames, not guaranteed on every unsampled frame.

## Mechanical accuracy check / distinction from aesthetic weakness

- **PASS structural:** Real A03 GLB rig has `RotorAssembly`, `FrictionRing`, `RotorHat`, `Hub` rotating around X, and independent `CaliperBody`, `PadInner`, `PadOuter`, `UprightSupport`; 390 mm illustrative road-car disc, 44 vanes, ventilated dual faces, stationary caliper and translating opposing pads. A03 geometry unchanged from A02; `.glb` proof SHA verified.
- **PASS model constraints/code, limited image visibility:** Actual E pad gap maps pressure to 2.5mm rest / 0.15mm near-contact, **2.35mm real axial travel per side**. Standalone 1080 macro shows both pad faces with explicitly disclosed hidden-caliper cutaway and measured readout; the main film still lacks clear communication of the mechanism. Don't claim in-film pad travel is visually obvious.
- **PASS visually plausible rotor rotation:** Rotating rotor/drilled face details change through film reveal and heat sequences; caliper position appears fixed relative to assembly, allowing camera motion. Cannot independently measure 3D contact force/friction/temperature from a flat MP4.
- **PASS illustrative/qualified thermal:** Disclaimer reads `THERMAL VISUALISATION — ILLUSTRATIVE` and no made-up exact disc temperature or stopping distance. New source improves qualitative pad-track heat and cooling; no thermodynamic simulation or certified measured values claimed.
- **PASS A03 lookdev artifact, NOT in-film automatically:** Actual four native 900×900 Blender Cycles PNGs visibly resolve Polish02 blown-out materials. A03 GLB hash `645c4b7fbe11ea5c9715bed2eb979ae6e96ba3d3c34f85f74553b02f7ea977db` verified; rotor and caliper real PBR materials remain distinct. E's film source still imports procedural `BrakeAssembly.tsx` rather than this binary GLB and uses independent Three.js lights. Claiming full film now has A03 Blender lighting would be misleading.
- **No verified CRITICAL mechanical/safety defect** in reviewed media; no pad clipping/intersection conclusively observed. Strong creative flaws remain major, not critical.

## Newer source correction checklist (source-specific)

1. **Benefits 450–629:** new E `37e04ee` sampled native benefits 450/465/480/500/510/531/550/575/600/620/629 and 41-frame 510–550 MP4 show no historic left caliper border crop; **PASS within tested evidence**.
2. **Heat/cooling 270–629:** localized friction sectors and cooling in actual E stills 305/321/345/365/395/425/445, hub stays dark; **PASS within tested evidence**, aesthetic sector edges slight.
3. **Pad onset:** real separate full-resolution macro from frames85–145, 61/61 native decoded frames; **PASS supplementary illustration but NOT integrated into main 25-second composition**.
4. **A03 Blender:** real rebuilt .blend/.glb/four dark-contrast Cycles PNGs; **PASS native asset lookdev only**. Geometry unaffected and real film uses procedural Three.js.
5. **Hero 630–749:** **NOT corrected by available latest source**. C hero camera plan unchanged; candidate full movie reveals extremely slow view changes and no E hero-motion fix is among GitHub diff. **Major unresolved**.
6. **Final complete E03 source 750 frames:** **NOT RENDERED/REVIEWED**. Do not misrepresent F candidate `5b378...` as `37e04ee...` or `174489...`.

## Release decision for Master

**FAIL the present full-length candidate for release quality (5.8/10).** Its technical specs and decode PASS. There are no critical physics defects requiring a new model or renewed A work. E's latest genuine native proof has already corrected camera cropping and heat presentation, while A's studio asset lookdev is READY.

**Do not commission an 'approved final MP4' against unchanged E head yet if aiming for a polished film.** Direct E to make **one focused short hero motion/reframe correction (frames 630–749)**. If time allows, use the existing 1080 pad cutaway to make the true two-pad action comprehensible **inside the film**; if schedule requires release ASAP, Master can explicitly waive the pad pedagogy issue while acknowledging quality limitations. No broad Polish04/model rebuild is needed. Once E supplies a new film-code SHA and a native hero clip with clearly stronger motion, **F can perform the one definitive 750-frame source-locked full 1080×1920 render**. D/Master must then inspect actual corrected complete footage, verify FFprobe/FFmpeg and phone-safe text, and only then approve release. The candidate's silence is expected absent approved user narration.

**Reviewer honesty:** full-speed, uninterrupted playback was unavailable in the current native inspection environment. Independently verified full 750-frame decode, visually analysed chronological dense frame samples and actual native stills, 750-frame motion telemetry, and both genuine E motion proofs. This is sufficient to identify the unconvincing final hold, but Master should still screen the finished continuous render at normal rate before release.
