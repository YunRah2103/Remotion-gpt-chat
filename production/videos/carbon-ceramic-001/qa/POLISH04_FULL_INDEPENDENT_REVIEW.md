# CARBON-CERAMIC BRAKES 001 — AGENT D INDEPENDENT POLISH 04 FULL-FILM QA

**Final verdict: FAIL — precisely scoped Agent E pad-cutaway/transition correction required.** The candidate passes technical delivery QA and is substantially better than the previous candidate. It is **not yet ready for Master release approval** because its central in-film opposing-pad explanation is difficult to read and its 2-frame dark masks visibly interrupt continuity. **No repeat of A hardware work, thermography overhaul, or new final hero shot is requested.**

**Independent subjective scores:** Overall **6.6/10**, up from the previous full-length candidate's **5.8/10**. The new hero is a genuine creative improvement.

## Provenance (source-locked; not a newer film)

- Repo: \`YunRah2103/Remotion-gpt-chat\`; reviewer Agent D, 2026-10-09.
- Exact **Polish 04 film source**: \`21c2b581b46251b0bd45028d32eb40b4341eeb2a\` (E).
- Actual rendered/assembled media: **[GitHub Actions run 37983072846 / artifact 11641871804](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804)**.
- Exact extracted filename: \`carbon-ceramic-001-polish04-candidate.mp4\`.
- Independently recalculated full-file SHA256: \`fad39a08e151913792da0c827b7c621f511b817b17e4cf4559fdcefa31ae7fbb\`; matches both user-provided source-lock and F's manifest.
- F report: \`production/videos/carbon-ceramic-001/render/POLISH04_REPORT.md\`; F motion QA: \`render/POLISH04_MOTION_QA.json\`. Both reviewed, but visual verdict independently assessed, not inherited.
- Previous **distinct** Polish03 full candidate: \`5b378202187748ce9b51d884f26bb7167285c946\`; [run 37978273707/artifact 11639835454](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37978273707/artifacts/11639835454), independently compared.
- Separate original A03 Blender approval is **only native studio proof**, not a claim that its saved studio lights were used by the procedural Three.js runtime.

## Actual technical tests executed

| Test | Independently observed outcome |
| --- | --- |
| ZIP retrieval and extraction | **PASS**; real MP4 extracted from actual 11641871804 ZIP |
| SHA256 re-computation | **PASS** exact \`fad39a08e151913792da0c827b7c621f511b817b17e4cf4559fdcefa31ae7fbb\` |
| FFprobe | **PASS** H.264, 1080 × 1920, 30/1 fps, **750** frames, **25.000000** seconds, \`yuv420p\` |
| Full independent FFmpeg decode | **PASS**: \`ffmpeg -hide_banner -nostats -loglevel error -xerror -i ... -map 0:v:0 -f null -\`; 750 frames decoded with exit status 0 |
| Audio stream | None, as expected for silent candidate; approved final VO remains a separate Master gate |
| 750-frame independent grayscale comparison | **PASS as measurement**, not an aesthetic verdict: 180 × 320 grayscale proxy, frame-adjacent mean absolute differences for full old and new native decoded videos |
| Visually inspected frames | Actual chronological sampled stills throughout film, including native 1080 PNGs **48,95,98–101,105,107,110,117,125,132,140,145–150,168,269–270,305,321,345,365,395,405,449–450,475,500,510,531,550,575,600,620,629–630,640,650,660,675,690,705,720,730,740,749**. Sequential contact sheets span all five shots. |
| Normal-speed, uninterrupted viewing | **Not independently available** in current environment. This report does **not** claim literal continuous video playback: assessment is complete FFmpeg decode, dense chronological native frame review, explicit transition frame pairs and full-frame motion telemetry. Master should additionally screen full-speed video before release. |

**No black-screen corruption:** all frames decode; no whole-frame mean grayscale below 6 on 180×320 analysis. Dark cutaway masks are intentional source-owned overlays, not lost video packets.

## Visual-quality scores (reviewed source only)

| Category | /10 | Basis |
| --- | ---: | --- |
| Hardware | **7.0** | Detailed drilled/vented rotor and separated forged caliper/piston geometry; still stylized, composite surface somewhat coarse |
| Mechanical accuracy | **8.2** | Rotor rotation and fixed caliper apparent; opposed axial pad nodes, proper 2.5→0.15 mm clearance and 2.35 mm true travel source-tested; film does not clearly reveal both faces |
| Materials and lighting | **6.2** | Dark consistent metal/composite separation but limited specular shape and high dark negative-space proportion |
| Cinematography | **7.2** | Much stronger concluding parallax and side ventilation reveal; cutaway framing clips at right edge |
| In-film pad clarity | **4.6** | True 2.35 mm readout present but opposing pads still obscured; key rotor cropped and graphic overlays hardware |
| Thermal explanation | **7.1** | False colour localised to friction ring and illustrated release; segment boundaries remain faceted, but no bogus temperatures |
| Typography/phone safety | **6.0** | Main titles readable; micro captions and pad caveat too small for comfortable phone consumption; pad overlay crosses ring |
| Transitions/continuity | **4.6** | Geometry blacked out on precisely frames 99–100 and 147–148; rapid reappearance creates conspicuous abrupt cuts |
| **Overall** | **6.6** | Solid technically, genuine hero improvement, but pad proof/presentation still distracts from engineering story |

## Confirmed findings with exact times, severity and accountability

### MAJOR — frames 107–145 / 3.567–4.833s: pad teaching and crop

At **frame 117 (3.900s)**, a full 1080×1920 image shows the brake's **right exterior edge leaving the portrait canvas**. Frame 140 continues an awkward right-heavy profile. The caption \`BOTH PADS APPROACH THE DISC\` and dynamic **\`2.35 mm\`** readout are present and technically grounded, but the outer pad is not separable from the rotor/hub at normal viewing size. One pad-like slab remains visible; the opposing face is not made explicit, even though \`PadInner\` and \`PadOuter\` remain distinct real nodes in code. The title/underline line crosses the ring/hat, and the caveat text is small.

**Owner: E.** Keep *the real model and B motion exactly unchanged*; pull the in-film pad-camera target/scale back enough that **full ring and both physical pad faces fit**. Shift toward a more legible **axial or oblique separation** (actual near/away faces), add short direct labels to actual parts (without unverified leader endpoints), position the readout clear of hardware. Do **not** magnify or falsify the 2.35 mm physical stroke. Source-locked frame 105/107/117/132/140/145 stills plus moving 100–147 native proof required.

### MAJOR — frames 99–100 (3.300–3.333s) and 147–148 (4.900–4.933s): abrupt dark insert

These **four exactly identified frames** show a dark navy field with the 3D brake removed but titles/readout partially retained. Visually compared adjacent *real* frames **98→99→100→101** and **146→147→148→149**: a hard disappearance/reappearance, rather than continuous camera movement or an intentional fading dissolve. Confirmed in exact source \`CarbonCeramic001.tsx\` conditional overlay \`[99,100,147,148]\` at full opacity.

Independent full-frame grayscale change is elevated across these edits (e.g. frame **100→101 7.819**, **146→147 11.564**, **148→149 13.499**, 180×320 MAE). The change metric corroborates a real image discontinuity, but does not by itself measure user perception. This is **not an encoder freeze, missing frames or corruption**.

**Owner: E.** Remove fully opaque one/two-frame masks. Prefer a short smooth **6–10 frame** opacity/camera/dissolve transition that bridges the actual scene states without flashing to an empty field, or an intentional match-cut with material visible on both sides. Preserve 750 frames, source ownership and 25.0s duration.

### MINOR — frames 0–60 / 0–2.0s: subdued initial hook

Ghost outline is thin, moving but faint; ample dark negative space. The title is legible. Consider slightly brighter outline or larger front brake location only if naturally adjacent to E's cutaway work. **Do not build another car model.**

### MINOR — frames 320–365 and 505–575: faceted thermal orange panels

The orange patch is on the friction annulus and the centre hub remains cooler. Cooling is evident by ~395–449 and in 600s. Some sector boundaries read like angular colour plates rather than physically softened thermal spreading. No unsupported \`°C\` figure; disclaimer is legible on native canvas, small on phone. **No thermal overhaul requested.**

### MINOR — frames 630–749 / 21.0–25.0s: closing composition

**Previous near-static-hero major fault is corrected.** Matched source frames 630/660/690/705/730/749 now show unmistakable changing depth, a continuous sideward orbit and actual vane edge reveal, without obvious caliper intersection or winding rotor reversal. Hardware remains inside portrait, though the final near-edge-on angle at 749 makes the ring visually thinner and the rest of the portrait mostly empty. This is an artistic tradeoff, **not another E release blocker**. Small/misplaced lower part labels persist, optional only.

## Independent old versus new motion (full real MP4s, not F proxy copied)

All adjacent frame pairs sampled from actual videos using 180×320 grayscale proxy and OpenCV decode:

| Segment / metric | Old candidate | Polish04 | Interpretation |
| --- | ---: | ---: | --- |
| Last 150 frames (600–749), mean pair MAE | **0.1649** | **0.2526** | **+53.2%** genuine increase; matches direction and magnitude of F report |
| Last 150 frames, adjacent pairs under 0.15 | **108** | **25** | 83 fewer near-static pairs |
| Actual hero 630–749, mean pair MAE | **0.1294** | **0.2489** | Almost **1.92×** hero motion; visible structural parallax |
| 600–629 mean pair MAE | 0.1092 | 0.1082 | Last benefits hold is unchanged; not corrupted |
| 100–147 pad insert | Not in old candidate | **In full Polish04 video** | Important real structural improvement but rough presentation |

The motion proxy includes lighting/text/compression changes and cannot alone certify art direction; native frame sequence shows actual orbital depth changes. Unlike the old candidate, the close view finally exposes rotor edge and cooling vanes at the finish. No need to change C hero source or A hardware.

## Explicit engineering and attribution caveats

- \`RotorAssembly\`, \`FrictionRing\`, \`RotorHat\`, \`Hub\` rotate about X together; \`CaliperBody\` remains stationary in source. E's real frame-based \`padGapForHardware\` retains per-face **0.15–2.5 mm** clearance, giving a true maximum **2.35 mm axial travel per pad**, not a fabricated scaled gap. Actual contact under loaded pressure is an *illustrative near-contact*, not certified forces.
- The caliper-hidden macro uses genuine A pads but its framing/occlusion does **not** make both faces independently readable in the film. This is a creative pedagogy fail, **not** proof of physics failure.
- Carbon-ceramic road-car material illustration, not OEM CAD; thermal false colour **illustrative** not measured. No fake temperatures or guaranteed stopping distance.
- A Polish03 studio lookdev fixed overexposed Cycles PNGs; E's runtime continues to use procedural Three.js geometry and independent lighting. No new A reconstruction required.
- No approved VO present. Silent 25s film is appropriate for review, not proof of approved final sound.

## Required acceptance next (avoid endless polish)

**Exactly one tight E correction** owns \`InFilmPadCutaway\`, its in-film camera adjustment, E overlay and transitions; **not** hero, thermal redesign, hardware rebuild, F workflow or Master source lock.

Pass target: native full-res stills **98,99,100,101,105,107,117,132,140,145,146,147,148,149,150** show no full-geometry disappearance frames, **disc and both true pad faces intelligibly visible** without cropping, typography safe; actual moving proof **95–155** and **630–749** (hero regression only), real 750-frame source tests. Once E's source is verified, F produces exactly one new 750-frame final candidate; D/Master then review complete exact SHA and Master approves release (with approved narration only if provided).

**Verdict: FAIL on Polish04 as final creative release**, despite technical PASS. Required small Polish05 applies only to pad explanation and two dark cuts. Full 25-second normal-speed uninterrupted playback was not available to this review tool, and is explicitly not claimed; Master should inspect the final candidate in real time before approval.

**Annotated frame evidence**: see \`POLISH04_FRAME_EVIDENCE.md\` in this QA folder plus [source-locked artifact 11641871804](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/37983072846/artifacts/11641871804) for genuine original frames. Local analysis also created readable contact sheets of native time-coded frames and old/new hero; these are supplemental and do not replace source artifact.
