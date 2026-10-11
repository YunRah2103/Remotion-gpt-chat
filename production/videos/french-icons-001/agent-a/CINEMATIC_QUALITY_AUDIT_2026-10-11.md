# YUNEX French Legends 001 — Agent A CINEMATIC footage audit

**Updated brief:** The edit must be **beautiful, graceful, cinematic French automotive history — NOT aggressive or motorsport-hype.** Prior suggestions of aggressive motion, rapid beat cuts, crash zooms, hard impacts or whip effects **do not apply** to this project.

## Verified audit basis

I extracted and visually inspected one decoded midpoint from each of the **20 playable V7 video clips** in the actual ZIP, alongside a source storyboard for the 4K Citroën 2CV convoy, the original 2013 Alpine A110 film, and the 2CV meeting original. This is a **creative shot-composition audit** separate from technical video integrity, not a claim about rights. All 20 were technically hash-checked in V7.

### Retain as core cinematic source choices

| ID | Clip | Decision | Reason |
|---|---|---|---|
| 01 | `2cv-convoy-original-4k` | KEEP as short heritage introduction | Original 4K 2CV rolling on a sunny country road; fixed roadside camera, not a premium tracking shot. |
| 07 | `a110-mountain-front-bend` | KEEP | Attractive historic Alpine, recognizable whole car and mountain road. |
| 08 | `a110-mountain-head-on` | KEEP | Strong frontal perspective, car well framed, cinematic sense of approach. |
| 10 | `a110-fender-driving` | KEEP | Clear, well-composed exterior Alpine movement. |
| 11 | `a110-snow-hairpin` | KEEP | Authentic mountain hairpin, motion and sense of place. |
| 12 | `a110-snow-acceleration` | KEEP | Unusual snow scenery and vehicle motion. |
| 14 | `renault-5-turbo2-black-side-rolling` | KEEP | Smooth rolling/tracking side angle with identifiable original Renault 5 Turbo 2. Note non-standard wheels/livery. |
| 20 | `ds-rally-front-under-archway-night` | KEEP as brief accent | Beautiful framed iconic Citroën DS frontal night composition, but source is ~0.75 sec and cannot be held for a long edit. |

### Potentially useful but not hero footage

| ID | Decision | Reason |
|---|---|---|
| 05 `a110-city-crowd-overhead` | SUPPORT ONLY | Crowd and event atmosphere dominate; whole car is fairly small. |
| 06 `a110-city-rollout` | SUPPORT ONLY | Blue Alpine is close but frame busy/soft with spectators. |
| 09 `a110-mountain-rear` | SUPPORT ONLY | Authentic but vehicle occupies small portion of scenic frame. |
| 15 `ds-paris-black-side-night-pass` | CONDITIONAL | Elegantly positioned DS, but very dark and only 0.8 seconds. |
| 16 `ds-paris-red-side-night-pass` | CONDITIONAL | Nice red DS against monument, 0.7 seconds, motion subtle. |
| 17 `ds-paris-black-rear-night-drive` | CONDITIONAL | City ambience, rear moving car, 0.75 seconds. |

### REPLACE as primary cinematic clips

| ID | Problem | Replacement target |
|---|---|---|
| 02 `2cv-daytime-driving` | Wide rough campsite/event scene, 2CV barely visible | Real 2CV in a scenic road/rolling film, 3–6 sec sustained car subject. |
| 03 `2cv-night-headlights` | Parked/stationary event car with headlights; not a compelling driving shot | Night city street 2CV **actually driving**, or remove entirely. |
| 04 `2cv-colourful-convoy` | Parked field/tents/picnic setup, subject obscured | Clean golden-hour or countryside 2CV car tracking angle. |
| 13 `a110-rally-village` | Busy roadside assembly/town sign blocking car | Clean longer on-road Alpine movement; existing original has scenic road footage but captions must be inspected. |
| 18 `peugeot-205-gti-front-oncoming` | Portrait crop cuts most of the 205's front and body out of shot | Use native **uncropped** 1920×1080 landscape source already inside V7 ZIP (source ID `peugeot-205-gti-front-205-oncoming-source-1920x1080.mp4`). Editor to compose full vehicle within 9:16 final. |
| 19 `peugeot-205-gti-rear-tracking` | The 205 appears too small within a thin 9:16 road frame | Start from original **uncropped** 1920×1080 film included in ZIP (source ID `peugeot-205-gti-rear-205-tracking-source-1920x1080.mp4`), select a tighter full-car part if available. |

## Hard cinematic editing rules for downstream B/C/D

- Car is the hero: obvious model identity, whole-car framing (or intentional detail shot), foreground/background separation, scenery supporting the car.
- Premium gentle movement: smooth tracking, low-speed rolling, beautiful wide scenic road composition. Avoid rapid action-film cuts, excessive speed ramps, chromatic aberration, stutters, HUD graphics, violent camera shake, whip transitions, or hard-impact flashes.
- Let truly strong shots breathe at ~2–5s where originals permit. Night DS 0.7s shots are **brief transition accents only**, never falsely extend with frozen frames.
- Historical vintage tone: natural colors, rich blacks with retained car detail, balanced contrast and film texture if subtle; don't obliterate shadow detail.
- In 9:16 edit, prefer intentionally recompose **from full landscape originals** to avoid severed bumpers/doors; do not pretend a 1080x1920 upscale crop is native portrait capture.
- Clean music-led pacing and subtle natural engine/road ambiences where aesthetically appropriate, rather than aggressive track sounds.

## Gate correction

**V7 passes only objective coverage and file integrity (20 video files / 5 models). It does NOT yet pass this stricter cinematic footage-quality gate.** The 20 count includes event/campsite and crop-weak shots. For a high-end finished French Legends film the six replacement flags need stronger source clips. Do not imply cinematic gate PASS without visually reviewing actual replacement footage, and do not publish unlicensed original-film content without reuse permission.

### Replacement acquisition

Target more genuinely moving 2CV country-road stock/video and clean exterior Peugeot/Alpine footage; keep the public 4K 2CV convoy as one supporting real motion shot. First Pixabay HD 2CV travel film lead (`https://pixabay.com/videos/woman-ride-weekend-school-holidays-125177/`) was accessed in published listing but GitHub `yt-dlp` received an HTTP 403 Cloudflare challenge, so **no new film was acquired** through this lead. Look for publisher direct authorized videos; do not bypass platform access controls or misrepresent availability.

### Audited source

V7 GitHub run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38163880872

V7 video artifact: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38163880872/artifacts/11711760852

Use this document to steer improvement, **not** as a finished V8 footage package.
