# Agent B — IndyCar Transition Match | acquisition report
**Tracking:** [#37](https://github.com/YunRah2103/Remotion-gpt-chat/issues/37)
**Assigned branch:** `automotive-edits/turbo-indy-reality-001/b-indy-matches`
**State:** **BLOCKED — no playable video downloaded; no visual match verified**.

## Work actually executed
- Read the footage contract and the B-specific instructions on the shared contract branch.
- Developed [a runnable acquisition, transcode, contact sheet and manifest implementation](agent_b_acquire.py).
- Added [GitHub Actions workflow](../../../.github/workflows/yunex-agent-b-indy-matches.yml) (actual path: `.github/workflows/yunex-agent-b-indy-matches.yml`).
- [First CI run 38269213677](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38269213677): marked green incorrectly because the script was piped into `tee` without `pipefail`. This is **not success**. Video source count 0; the 4.6KB Actions artifact 11755588942 is **diagnostics only**.
- [Second CI run 38269604111](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38269604111): FFmpeg installed; exit correctly fails when acquisition fails. All three sources returned HTTP 429 from Wikimedia upload CDN. Video source count 0; artifact 11755839029 is **diagnostics only**, not footage.
- Fixed artifact naming so future unsuccessful runs are explicitly labelled `FAILED-download-DIAGNOSTICS` and a `verified-video` artifact is created **only on success**.

## Candidate original sources (NOT delivered)
1. **2024 Indianapolis 500 Sarah Stierch 01**, genuine Indianapolis pace lap, original 1920 × 1080, 15.843 seconds, own camera film CC BY 4.0:
   https://commons.wikimedia.org/wiki/File:2024_Indianapolis_500_-_Sarah_Stierch_01.webm
   Possible track-level/banked geometry, but pacing would feel slow next to a 200mph Turbo transition. **NOT visually reviewed frame-by-frame**.
2. **2022 Indianapolis 500 Sarah Stierch 08**, original listed 3840 × 2160, real pace lap:
   https://commons.wikimedia.org/wiki/File:2022_Indianapolis_500_-_Sarah_Stierch_08.webm
   Verify actual license individually before use; original download blocked. **NOT visually reviewed**.
3. **Indy5002025start**, real 2025 Indianapolis 500 start, original listed 1920 × 1080:
   https://commons.wikimedia.org/wiki/File:Indy5002025start.webm
   **LICENSING HOLD:** Wikimedia flags license review; no reuse clearance assumed. Original download blocked, no frame QA.

The above native resolutions originate from file metadata on hosting pages, **not** local FFprobe, since no bytes were received. No center (% frame), banking slope, direction, camera pan, usable match key, transition timecode, active area or codec has been established by decoded-frame analysis. Absolutely no genuine Turbo↔Indy transition has been verified.

## Blocker and required next action
GitHub-hosted runner `upload.wikimedia.org` received HTTP 429 from all sources, three attempts each, without downloaded playable frames. Direct official IndyCar/broadcaster footage typically requires permission; rebroadcast ripped from a third party is not a reusable rights-cleared deliverable. Other publicly indexed 'Indycar' stock shots proved misleading (one tagged 'Indycar' is a Porsche-style sports car paddock scene); do not substitute an incorrect vehicle.

Recommended unblocking: source owner/licensee provides a downloadable 1080p+ original via a source/CDN that genuinely allows downloading on a GitHub runner, or use specifically permission-cleared original motorsport creator footage. Then rerun the workflow, inspect decoded contact sheets, identify 1–3 precise physical match points against Agent A's supplied Turbo frames, and include real MP4 files in the ZIP. Do not commission a final edit before this footage gate.

## Result
| Requirement | State |
| --- | --- |
| Footage contract read | DONE |
| Dedicated scripts committed | DONE |
| CI run attempts | 2 run attempts, both **no footage** |
| FFprobe, decoded-motion QA | NOT POSSIBLE — zero bytes |
| 4–8 true independent IndyCar match angles | 0 |
| Paired Turbo-to-Indy frame matches | 0; Agent A still needs candidate frames |
| Real footage-filled GitHub Actions ZIP | **NOT DELIVERED** |
| Rights | CC BY 4.0 only as linked; separate review required for other candidates |
