# BMW M5 Evolution 001 — Agent A source delivery V2

**Agent:** A, Automotive Footage Director  
**Repository:** `YunRah2103/Remotion-gpt-chat`  
**Branch:** `automotive-edits/bmw-m5-evolution-001/a-footage`  
**Source implementation SHA:** `8cc2e07a0bfa10a3867b5972c49e4740f7778816`  
**Handoff:** **REVIEW (not READY)**

## Actual deliverables

**[Download actual improved 42-clip bundle — GitHub Actions artifact 11668682025](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38048763831/artifacts/11668682025)**

**[View run 38048763831, SUCCESS](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38048763831)**

The artifact includes 42 unique video **files** named `clips/e28-01.mp4` through `clips/g90-06.mp4`, `MANIFEST.json` (each source slot, SHA256, actual resolution, actual FPS, duration, source in-point, motion score and limitations), `CONTACT-42-V2.jpg`, `SHA256SUMS.txt`, and `README.md`.

This is a real moving source asset pack, not a planning placeholder, a repeated static image, or a public release. Files were byte-copied from actual earlier prepared high-quality video segments and **not re-encoded during V2 assembly**.

## Exact native resolution by generation

| Generation | Era | Slot numbers | Actual native source excerpt pixels | Comment |
|---|---|---|---|---|
| E28 | 1985 | 01–06 | 1920×1080 | Dedicated moving BMW M5 heritage archive |
| E34 | 1988 | 07–12 | 720×576 | Genuine original group-driving archive. **Not acceptable as clean solo E34 footage throughout.** |
| E39 | 1998 | 13–18 | 720×576 | Original circa-2000 BMW M5 Nürburgring footage, six different movement scenarios |
| E60 | 2005 | 19–24 | 720×576 | Original BMW M5 driving-alongside footage |
| F10 | 2011 | 25–30 | 1920×1080 | Upgraded from 540×304 preview to genuine original HD |
| F90 | 2017 | 31–36 | 1920×1080 | Genuine BMW F90 track driving footage |
| G90 | 2024 | 37–42 | 3840×2160 | Genuine BMW G90 launch driving footage |

**Quality improvements from V1:** E34/E39/E60 now use native 720×576 masters instead of scaled-down 480×360 previews, while F10 now uses native 1920×1080 instead of a 540×304 compressed preview. E28, F90 and G90 preserve their verified video originals.

## Measured QA — actual GitHub native run

- **42/42 full FFmpeg video stream decodes PASS.**
- **42/42 moving-video temporal difference tests PASS.**
- **42/42 non-identical video SHA256 files PASS.**
- All seven generations represented in the six-cut chronological timeline.
- Real frame contact sheet was extracted directly from all 42 delivered video files.
- The source runner did not silently upscale historical material or reuse a file byte-for-byte under another name.
- **This mechanical QA does not prove 42 distinct creative camera angles or correct car dominance on every E34 shot.**

## Editorial blockers that must not be concealed

**E34 — do not sign off as clean or fully unique.** The BMW 2005 footage is a formation and wet-course montage featuring E28, E34, E39 and E60 cars. For the six E34 selections, other generations sometimes remain visible in background/foreground, and two wet-course takes have related camera framing. The authentic E34 is visible in several samples, but this cannot honestly be certified as six perfectly isolated unique E34 shots. Agent B/C must replace or repair these before presenting the film as final.

**Vintage resolution.** E34/E39/E60 truly originate from 720×576 masters (25 fps). They cannot fill a 1080×1920 vertical crop at modern sharpness. Use refined archival panels/intentional composition instead of invented 4K or aggressive sharpening.

**Usage rights.** BMW Group copyright and the user-provided private music require rights review before public distribution. Only private inspection was authorized; no public GitHub Release was made.

## Sources, reproducibility, and previous runs

The production source and exact forty-two slot timepoints are committed at `footage/provisional-cuts.json`, `footage/assemble_v2.py`, `footage/build_review_bundle.py`, and `footage/e34_focused.py`. V2 generated via a dedicated GitHub Actions runner, retrieving source artifacts:

- [Initial verified-motion 42-source cut pack](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38047298176/artifacts/11668700332).
- [Native E28 1080p historical master](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38046928757/artifacts/11666924618).
- [E34 native 720×576 focused selects](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38048499011/artifacts/11668118626).
- [Native E34/E39/E60 archival extracts](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38047591610/artifacts/11668242116).
- [Native 1920×1080 F10 new extracts](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38047365846/artifacts/11667807177).

The run artifact is temporary (7-day retention) and may require repository access. The full-size source originals remain outside Git history; only scripts, manifests and handoffs are Git-committed.

## Action for Agent B and Agent C

Fetch **artifact ID `11668682025`**, run **`38048763831`** from the A branch; verify `SHA256SUMS.txt` and `MANIFEST.json`, use clips 01–42 at their chronological beat-map positions, and handle E34 as **editorial BLOCKED** until identity/camera uniqueness is defensible. The film's actual 18.4-second cut timing, audio mix, full visual inspection and final delivery belong to B/C. Do not use initial inaccurate low-resolution preview sources or claim final quality without these corrections.
