# Agent C — verified scene boundaries and motion shortlist

GitHub Actions run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38313312380

Source: official Audi C8 RS 6 Avant performance MP4, SHA256 `320822a5a4f03ea38d25b99a0dc6107e3a1d4c3ccb369a85e64268d8508ca957`. Genuine 1280x720 H.264 at 25fps, 639.017 seconds, fully decoded.

**Automatic scene detection passed:** 90 scene-cut candidates at scene threshold 0.28. 90 2-second post-cut spans successfully profiled for luminance, contrast and visual motion.

Top five motion/contrast windows for actual visual review:

| Start | Motion score | Luma | Contrast |
|---|---:|---:|---:|
| 184.08s | 41.53 | 104.9 | 64.8 |
| 167.08s | 35.90 | 107.5 | 64.7 |
| 103.24s | 37.30 | 96.0 | 59.2 |
| 176.36s | 36.29 | 92.9 | 57.5 |
| 156.56s | 41.86 | 98.3 | 46.9 |

Other potential windows: 91.28, 160.12, 95.12, 70.68, 205.32, 531.88, 74.28 seconds.

**Important**: numerical motion/contrast ranks do not identify headlamps, wheels, grille, exhaust or even whether vehicle is driving versus camera moving. A visual inspector and actual moving-frame contact sheets must verify before scene labels or selection. This source does not meet native 1080p gate. Audi explicitly restricts reuse to journalistic purposes; do not publish copyrighted frames/videos to public GitHub artifacts without authorization.

No actual clip package delivered; this is reproducible source-level QA, not completion of Agent C.
