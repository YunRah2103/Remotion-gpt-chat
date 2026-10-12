# YUNEX Turbo → IndyCar 001 | Agent D visual review and acquisition report

**Reviewed:** 2026-10-12. **Status: PARTIAL / EDITORIAL QUALITY GATE NOT MET.**
**Project issue:** #37. **Agent D branch:** `automotive-edits/turbo-indy-reality-001/d-indy-cinematic`.

## Real delivery and validation

- GitHub Actions run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38270454592
- Artifact ID: `11756089514`, name `YUNEX-TURBO-INDY-AGENT-D-CINEMATIC`.
- Download: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38270454592/artifacts/11756089514
- Contains four actual 2.5-second H.264 MP4 footage files, FFprobe records, screenshots of three decoded frames per clip, SHA-256, licensing and source manifest, and failure log.
- The clips **have not** achieved the D assignment's requested six to ten spectacular distinct IndyCar onboard, wheels, grid and pit shots. FFprobe success alone is not editorial acceptance.

| Clip | Original | Frame-reviewed imagery | Decision |
|---|---|---|---|
| `indy24_01.mp4` | 1920×1080 | Genuine Indianapolis pace-lap cars from elevated spectator seats, some crowd. | Valid formation context. NOT onboard, NOT an extraordinary cinematic camera angle. **Potential overlap with Agent C**, whose source list includes the same `2024...01.webm`; coordinate and omit one if C delivers it. |
| `indy22_08.mp4` | 3840×2160; 1920×1080 downsample | Genuine Indy 500 circuit, spectators and fencing; distant cars visible, raised arms partially obscure shot. | Only emergency track/crowd texture, weak for a hero shot. |
| `indy24_11.mp4` | Native 1080×1920 | Borg-Warner trophy travels in pickup truck before 2024 Indy 500. | Optional sub-second pre-race cultural detail. No IndyCar driving or pit action. |
| `indy24_04.mp4` | Native 1920×1080 | Nearly empty grandstands and race control tower, distant. | Reject from cinematic final; atmosphere fallback only. |

## Source licenses

- `2024 Indianapolis 500 - Sarah Stierch 01.webm` — Sarah Stierch, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2024_Indianapolis_500_-_Sarah_Stierch_01.webm), CC BY 4.0, attribution required.
- `2022 Indianapolis 500 - Sarah Stierch 08.webm` — Sarah Stierch, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2022_Indianapolis_500_-_Sarah_Stierch_08.webm), CC BY 4.0, attribution required.
- `2024 Indianapolis 500 - Sarah Stierch 11.webm` — [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2024_Indianapolis_500_-_Sarah_Stierch_11.webm), CC0.
- `2024 Indianapolis 500 - Sarah Stierch 04.webm` — [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2024_Indianapolis_500_-_Sarah_Stierch_04.webm), CC0.

Full resolved original media URLs, FFprobe dimensions, timecodes and SHA256 recorded in artifact `manifest.json`. These are **real video bytes**, not stills.

## High-value verified leads that failed native-resolution or access gates

IndyCar official pages expose these actual JW Player clips, and GitHub Actions successfully enumerated download formats:
- **Josef Newgarden 2025 Indy 500 practice helmet-cam** — https://cdn.jwplayer.com/players/xl5UM3Ts-Z6BVOjjc.html
- **Alex Palou 2025 Indy 500 Carb Day helmet-cam** — https://cdn.jwplayer.com/players/6ga4Meiv-Z6BVOjjc.html
- **2025 Indy 500 Pit Stop Challenge: official highlights** — https://cdn.jwplayer.com/players/Ie7gtLpi-Z6BVOjjc.html

All three offered no more than **1280×720** in the publicly exposed JW Player formats; **not acceptable under the locked native-1080p rule**. Also INDYCAR content is rights-reserved; public streaming is not a reuse license. No 720 footage was upscaled or claimed as 1080p.

Pexels motorsport sources [9737951](https://www.pexels.com/video/9737951/), [9737952](https://www.pexels.com/video/9737952/), [9737840](https://www.pexels.com/video/9737840/) and [9737948](https://www.pexels.com/video/9737948/) returned HTTP 403 / Cloudflare challenge to GitHub Actions; corresponding direct public-CDN guesses returned HTTP 403, so no accessible verified video bytes were obtained. No access controls were circumvented.

Wikimedia 2024 Indy sources began returning HTTP 429 after several legitimate public requests; error diagnostics preserved.

## Next step

**Do not mark Agent D complete or authorize final transformation film on the strength of this package.** To satisfy D, acquire true native-HD close-ups/helmets/working pit media from separately licensed press material, or obtain permitted 1080p original team clips. Only cite the real clips currently present as partial B-roll fallback; do not assign Agent C's other racing coverage to D.
