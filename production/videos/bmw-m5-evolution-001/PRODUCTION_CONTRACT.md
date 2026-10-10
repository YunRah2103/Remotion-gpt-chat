# BMW M5 EVOLUTION 001 — THREE-AGENT PRODUCTION CONTRACT
## Seven real M5 generations. One new moving shot PER detected music beat.

**Repository:** YunRah2103/Remotion-gpt-chat
**Base source:** `e8f17c9ef5cc48b143b21d3cc4d8007861097464`, reusing the existing real-video collage engineering.
**Never access or modify** `YunRah2103/yunus-video-lab`.
**Video:** 18.400 seconds / **552 frames** / 30fps / 1080×1920 vertical / H.264; 48k AAC audio only with authorized sound input.
**Original audio:** user-uploaded 18.468571s MP3, SHA256 `747ef310fd083128819df199a87e95b9d107a73cb4ea393cc28094d000d245de`. It is PRIVATE, not in GitHub. Private 18.4s 48 kHz WAV master SHA256 `47713ca53679b6011f7482232092daa4414e11a0e5c598007bf3fef31b5bb449`. Master must obtain actual bytes from the user/editor pack. Do not fabricate audio access.

### Authentic M5 chronological order: exactly 7 sedan generations

BMW M official overview: https://www.bmw-m.com/en/topics/magazine-article-pool/the-generations-of-the-bmw-m5-an-overview.html
- Gen 1 **E28 (1985)** — slots 01–06, frames 000–070
- Gen 2 **E34 (1988)** — slots 07–12, frames 071–150
- Gen 3 **E39 (1998)** — slots 13–18, frames 151–230
- Gen 4 **E60 (2005)** — slots 19–24, frames 231–310
- Gen 5 **F10 (2011)** — slots 25–30, frames 311–389
- Gen 6 **F90 (2017)** — slots 31–36, frames 390–469
- Gen 7 **G90 (2024)** — slots 37–42, frames 470–551

Exclude ordinary 5 Series, M535i, M3/M4, E61 Touring, E34 Touring, G99 M5 Touring, concept renders, random performance cars and mislabeled thumbnail stock. Prefer actual identifiable moving M5 *saloon* footage. Label generation text accurately; 2024 is G90 launch, model-year naming can vary by market.

### Beat-to-shot rule — new REAL clip every beat

The attached `beat-map.json` contains **42 unique source-slot start frames** derived from real audio at ≈136 BPM. First ~0.21s is introductory pickup, thereafter roughly 0.44s per detected beat. A cut MUST change the *actual moving footage content* on every slot. No identical repeats, no forward/reverse reused segment, no looping one source five times under different crops. Using separate non-overlapping segments from a long source is permissible ONLY when the shot's actual content/camera angle visibly changes; do not fraudulently split an unchanging shot into six fake sources. One 18s song ≠ 18s generic M5 repeated.

Seven generations occupy **six distinct video clips each**. The chapter step happens on the approved beat-grid; transitional style may match vehicle grilles/wheels/profiles across generations, but never show the wrong generation under a label. Agent B may adjust exact cut frames by ±1–2 frames after listening with evidence and updating the committed map consistently; major changes require C approval.

### TOP PRIORITY — image quality over cheap/compressed placeholders

- **Source resolution:** ideally native 4K (3840×2160) landscape or native 1080×1920 portrait/greater. For full-height crops from 16:9 footage, start with UHD to avoid magnifying a 608px-wide centre crop from low-res 1080p video. Good original archival footage may be less than 4K for early models; inspect it at native size and use editorial framing **without excessive upscaling** rather than pretending old footage is sharp.
- Keep original source copies and SHA256 checksums; archive shots in high-quality mezzanine (ProRes or x264 CRF 14–17/preset slow if resources allow), but **avoid unnecessary intermediate re-encodes**. Final H.264 high-profile / yuv420p, high quality ~CRF 16–18, ideally 16–25 Mbps average where scene complexity demands it, and preserve detailed surfaces/vehicle badges.
- Reject visibly blurry/watermarked sources, extreme noisy reuploads, obvious 240/480/720p clips stretched to full 1080×1920; prevent overaggressive denoise/sharpen, zoom blur, fake 60fps frame interpolation and frame duplication.
- Check source orientation and source shot ID. For vintage M5, high-quality authentic source content may be rare; **don't promise impossible 4K**, don't fabricate footage or silently replace a generation.
- **Strong visual evolution:** older cars begin with atmospheric/classic lighting and quieter cuts; build toward intense motion and colour contrast, ending G90 with best hero footage. Camera-matched grille/wheel transitions, restrained speed ramps and micro flash accents only where actually justified, professional consistent grading, sparse `E28`...`G90` generation text with correct year, no constant HUD spam.

### Footage, copyrights and private review

User says prioritize footage **regardless of copyright clearance delays**. Honor the creative intent by prioritizing authentic high-resolution footage and a **PRIVATE evaluation edit**. Agent A must still record **where each clip came from** and its rights/credit status. Do not forge a license or assume publicly viewable videos may be publicly redistributed. Do not bypass DRM or access-controlled media. Music and any footage without redistribution permission must **not be auto-published to GitHub Releases, a public Pages site, TikTok or YouTube**. Prefer approved/usable footage for future publishing, but don't hold up private prototyping simply because commercial release rights are unknown.

### Three-agent ownership and handoffs

**A — Video research / visual sourcing:** Branch `automotive-edits/bmw-m5-evolution-001/a-footage`; exclusively `production/videos/bmw-m5-evolution-001/footage/**`, plus its own `handoffs/agent-a.{json,md}`. Own 42 verified moving slots across 7 gens; original source provenance, contact sheets, motion/identity confidence, source files/artifacts. No Remotion final implementation.

**B — Cinematic editorial / typography / transitions:** Branch `automotive-edits/bmw-m5-evolution-001/b-creative`; exclusively `src/bmw-m5-evolution/**`, `production/videos/bmw-m5-evolution-001/edit/**`, plus its own `handoffs/agent-b.{json,md}`. Own frame-accurate shot composition, score-led cuts, grade, transitions and readable labels. Build with diagnostics/placeholder visuals while A sources real clips, but never present placeholders as final. Only C may edit `src/Root.tsx` or central package manifests.

**C — Master integration / audio / render / independent QA:** Branch `automotive-edits/bmw-m5-evolution-001/c-master`; exclusive final assembly, shared workflows and `src/Root.tsx`, private audio staging, 552-frame native full render, final FFprobe + full FFmpeg decode + video review, credit/rights report and downloadable **private-review MP4 artifact**. Integrate real verified A and B code and confirm no wrong or duplicate model across 42 cuts.

Use the existing `production/tools/handoff.py` schema. Each agent supplies exact source SHA, owned file changes, evidence, actual run/artifact links and honest blockers. Agent A owner=`research`, B owner=`director`, C owner=`release`. Initial handoffs are **BLOCKED placeholders**, not falsely completed.

### Mandatory QA — no false signoff

1. Check **42 chronological, unique shot segments** are correctly mapped and show visible real motion. Watch entire film and verify generation in all slots.
2. Review side-by-side frame contact sheets at actual source detail and final native output; independently detect recurrence/near-duplicate shots and over-sharpening.
3. Check exact all-frame timeline coverage (552 frames), first/last frame, all beat cuts and naturally synced music; any sound drift or beat misses must be corrected.
4. Ensure old-gen footage visually readable, transitions never obscure an M5, G90 finale truly looks premium and sharp.
5. Validate 1080×1920, 30fps, H.264 and complete decode with source SHA + SHA256; verify 48k stereo AAC if audio mixed privately.
6. **Do not publish unlicensed copyrighted music/footage publicly**. Keep artifact private to authorized review. Report actual distribution-rights uncertainty.
7. Report what really succeeded. Each agent is a separate user-started ChatGPT agent; creating markdown profiles does not launch them.

**Status: PREPRODUCTION. No source footage has been fetched or final video rendered as part of this planning branch.**
