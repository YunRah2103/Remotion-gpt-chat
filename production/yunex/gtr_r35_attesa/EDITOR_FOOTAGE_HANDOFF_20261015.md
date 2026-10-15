# YUNEX — Nissan GT-R R35 ATTESA E-TS | footage specialist handoff
**15 October 2026 — sole footage acquisition/technical verification.**

## Status and truth-in-labeling

**DELIVERED: Nine playable, muted H.264 1920×1080 MP4 source-scene candidates, 37.32 seconds total, all individually FFprobe-checked, full-decoded and SHA256 recorded.** Source rights are **not verified** and both source originals and clipped excerpts are in **owner-only GitHub DRAFT Releases**. **The extracted nine shots are technical candidate scenes, NOT yet visually approved as correct angles / attractive 9:16 crops.** This handoff is not a final film or publication authorization.

- **9-clip private ZIP**: [DRAFT Release `yunex-gtr-r35-private-extracts-38728047124`](https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/yunex-gtr-r35-private-extracts-38728047124). Contains all nine playable muted MP4s, full per-clip SHA256/FFprobe `manifest.json`, README. **Owner-only access.**
- **Independent 3-source import + review**: [GitHub Actions PASS run 38727500982](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38727500982); [private draft contact-sheet ZIP](https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/yunex-gtr-r35-private-qa-38727500982), with original landscape and center 9:16 comparison frames.
- **Actual extraction/render QA**: [GitHub Actions PASS run 38728047124](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38728047124), each excerpt SHA, bytes, source start/out, FFprobe and full FFmpeg decode in the workflow logs.
- No originals, clips or contact frames committed to the public Git history or uploaded as public workflow artifacts.

## Three verified originals

| Origin | Source / creator | Phone job | Technical result | Rights |
| --- | --- | --- | --- | --- |
| A: Cinematic modified GT-R R35 (871-hp custom build — **not stock**!) | [FAREWELL GODZILLA / 870 HP R35 GTR (4K)](https://www.youtube.com/watch?v=jbh6-hl5YD4) — **Oliveri's Life** | [#97](https://github.com/YunRah2103/Remotion-gpt-chat/issues/97) | 45.003s / 1920×1080 / 23.976fps / H.264 / SHA256 `74d9eac870837eb39630328468d1ee1fbd0ea14029b27ab1f7fa8501abe58ca8` / full decode PASS | unverified / private draft |
| B: 2021 GT-R acceleration and launch testing | [NEW NISSAN GT-R 35 2021 / 0–100 + 100–200](https://www.youtube.com/watch?v=-v4aPSbde8w) — **Mécanique Sportive** | [#98](https://github.com/YunRah2103/Remotion-gpt-chat/issues/98) | 50.017s / 1920×1080 / 29.97fps / H.264 / SHA256 `ce429cd9872420504decbf8cbf4ff20abf223831312e2cb5d4ad854822b22ec7` / full decode PASS | unverified / private draft |
| C: manufacturer R35 legacy film | [Farewell to a Legend: Celebrating the R35 GT-R legacy](https://www.youtube.com/watch?v=hJqJPW7FdQk) — **Nissan** | [#99](https://github.com/YunRah2103/Remotion-gpt-chat/issues/99) | 100.000s / 1920×1080 / 25fps / H.264 / SHA256 `6556a1b2453753895b5cf6d04dc53c0f47633da926ded0b1ec257f5963df554b` / full decode PASS | manufacturer copyright / no reuse rights established |

Original source MP4s accessible from owner-only V4 draft Releases by the repository's verified `.github/actions/yunex-v4-import/action.yml` action. **Do not re-download them from YouTube.**

## Nine candidate clips — exact source scene times (not user-edit timeline)

Timings below **are real FFmpeg cut points in the original video**; they sit within machine-detected coherent scenes. The purpose column indicates an **editorial target**, not a human-confirmed camera angle. Timecodes refer to downloaded phone source from 0 (all three source windows start at 0).

| Clip in private ZIP | Job | Source in → out | Duration | Target only; verify using contact sheet |
| --- | --- | --- | --- | --- |
| `A01_97_scene02.mp4` | #97 | **00:05.820 → 00:08.900** | 3.086s | Potential opening |
| `A02_97_scene03.mp4` | #97 | **00:10.000 → 00:13.600** | 3.629s | Cinematic R35 movement |
| `A03_97_scene04.mp4` | #97 | **00:19.000 → 00:22.500** | 3.504s | Exterior / bodywork option |
| `A04_97_scene05.mp4` | #97 | **00:29.000 → 00:33.100** | 4.129s | Rolling / grip background option |
| `A05_97_scene06.mp4` | #97 | **00:38.450 → 00:42.300** | 3.879s | Closing option **LOW 276 kB FILE SIZE: potentially static/dark; visually inspect before use** |
| `B01_98_scene02.mp4` | #98 | **00:06.550 → 00:11.100** | 4.571s | Launch/control candidate |
| `B02_98_scene06.mp4` | #98 | **00:27.000 → 00:31.000** | 4.004s | Acceleration / cockpit candidate |
| `C01_99_scene11.mp4` | #99 | **00:09.450 → 00:14.150** | 4.720s | Manufacturer insert, potential front-wheel/identity |
| `C02_99_scene88.mp4` | #99 | **01:26.000 → 01:31.800** | 5.800s | Manufacturer insert / closing candidate |

**Verification:** All nine extracted clips are H.264 1920×1080, audio removed, FFmpeg full-decode PASS, checksum per manifest. Together: **37.321775 seconds** of extract media and **15,563,146 MP4 bytes** (about 14.84 MiB before ZIP compression).

## Editorial intent (after actually reviewing private contact sheets)

Proposed calm explanatory order, subject to final actual shots: clean front 3/4 hero → rear-biased acceleration → visible tyre or wheel → actual launch → front wheel/torque-forward diagram → corner exit → cockpit/tachometer → elegant rear 3/4 closing. Overlay graphics must correctly explain power routing, not assert that the visible tyre proves a torque split.

**Do not confuse the modified 871-hp #97 car with factory specification.** Cite official Nissan R35 documentation for ATTESA facts rather than the modified car's acceleration figures. Nissan documents that the factory R35 normally uses a 0:100 front:rear torque split and can vary up to 50:50 depending on conditions, via a rear-mounted transaxle and electronic control: https://usa.nissannews.com/en-US/releases/us-2017-nissan-gt-r-press-kit

**Source visual limitation:** This agent confirmed actual source streams, scene-cut positions, private contact-sheet generation, true timestamps, MP4s and checksums, but **did not personally inspect the private contact-sheet pixels** via a suitable image viewer. Therefore NO claim that the nine clips already contain the specified exact camera angle or that the centred 9:16 crop is artistically sound. The draft ZIP previews are there for genuine frame review. In a 1920×1080 landscape source, an unscaled centre 9:16 crop is only ~608×1080 pixels, so treat full portrait UHD claims as invalid. Recommend subject-tracked reframing in editor rather than blind central crop.

**Rights gate:** Private technical copying and owner-only review does NOT give YUNEX publication rights. Obtain permission/replacement cleared media before posting to TikTok, Instagram or YouTube.

## Final completeness matrix

- Three original 1080p phone recordings: **PASS / verified SHA256 / private**
- Nine coherent machine-scene-selected extract videos: **PASS / real playable / private**
- Exact start/end scene timestamps: **PASS**
- Silent source excerpts avoiding embedded original soundtrack: **PASS**
- Contact-sheet generation + landscape/center 9:16 preview: **PASS (generated privately)**
- Human judgement on angles/car proportions/colour/crop/shot beauty: **NOT YET VERIFIED**
- Reuse/publication permission: **NOT YET VERIFIED**
- Final film/voiceover/edit: **OUT OF SCOPE**
