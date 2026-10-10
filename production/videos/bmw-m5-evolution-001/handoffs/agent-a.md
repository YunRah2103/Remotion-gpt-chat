# AGENT A — GENUINE FOOTAGE RESEARCH HANDOFF (BLOCKED)

**Agent:** A · Automotive Footage Director  
**Repository/branch:** `YunRah2103/Remotion-gpt-chat` / `automotive-edits/bmw-m5-evolution-001/a-footage`  
**Actual code/source commit:** `174bd721c67e6b5ae4d18b038787e956450097e7` (before this handoff document)  
**Required final film:** 552 frames, 18.4 s, vertical 1080×1920, 30fps.  
**Status:** **BLOCKED. Candidate source pages: 20. Actual acquired moving clips: 0/42. Human-verified BMW M5 clips: 0/42. Actual source SHA256 video digests: 0.**  
**Do not use this handoff as license to mark footage READY or render with substitutions.**

## What was actually implemented

- Read the exact source contract, `beat-map.json`, Agent A instructions, existing video collage engineering, and existing schema/validator.
- Researched 20 labelled source-page candidates covering E28, E34, E39, E60, F10, F90, G90, with official BMW Group PressClub scene provenance and select original-channel links. `footage/source-catalog.json` is a **page research catalog only**; it contains no real downloaded media. The 12 direct BMW PressClub URLs in the catalog are candidates, not confirmed accessible downloads.
- `footage/shot-board.json` maps every beat to six unique camera-angle goals per generation, preserves all source-slot frames, explicitly marks every candidate `MISSING_VERIFIED_CLIP`.
- `footage/prepare.py` provides guarded official-original acquisition (preserve MOV; FFprobe; SHA256), real JPEG frame samples/contact sheets, strict manual sedan-identity/distinct-shot approval, timed-source extraction QA, near-duplicate detection, and refuses to generate verified manifest until 42 **actual** video files/approved time ranges are present. Do not misuse the code's synthetic test clips as real M5 footage.
- `footage/test_prepare.py` contains offline unit tests for boundary order, no false readiness, safe source URLs and native FFmpeg/FFprobe/probe/encoded-frame checks against a **synthetic** video fixture. `footage/validate_sources.py` now calls the test suite in the existing CI job. This validates the **machinery**, NOT a single BMW source video.
- No central workflow, Remotion editing code, Agent B/C file, shared pipeline or separate YUNEX repository was changed.

## Results and evidence

- **PASS — initial GitHub Actions metadata/chronology CI**: [run 38014240348](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38014240348) at source `4aa7692b2ff508dfe7308353711da753e2ceda0a`; logs show 42 planned cuts, 552 frames, seven required generations, **actualVerifiedClips: 0**.
- **Added after initial run:** new dedicated synthetic FFprobe tests at `174bd721c67e6b5ae4d18b038787e956450097e7`; confirm an Actions green run for this subsequent commit separately. Do NOT describe any native real-footage validation as passing.
- [Research commit e1fe940](https://github.com/YunRah2103/Remotion-gpt-chat/commit/e1fe940dfde8817f485ca58887bda750e6461dd8) and [native test commit `174bd721c67e`](https://github.com/YunRah2103/Remotion-gpt-chat/commit/174bd721c67e6b5ae4d18b038787e956450097e7).
- There is no real contact sheet, MP4 source, video SHA256 list or private downloadable footage artifact. Evidence artifacts and private-audio content must **never** be invented.

## BMW M5 identification and image quality

BMW official generation sequence is E28 (1985), E34 (1988), E39 (1998), E60 (2005), F10 (2011), F90 (2017), G90 (2024). All footage must show genuine **M5 saloon**, not 520i/535i/M535i, ordinary 5 Series, M3/M4, a wagon/Touring, a race silhouette or CG. Confirm via generation-correct exterior, bumpers, wheel arches/wheels, era-specific trims and M5 badging, model/source description and angle continuity **on the moving frames themselves**. Separate timecodes from one long unchanging shot are NOT unique camera setups.

Research reveals that early official BMW archive master listings may be **720×576** (2005 archive group and E60) or **1024×576** (E39 historic). Even a 'HD' download button does not magically confer modern native 4K. Treat old images in deliberate editorial framing with honest sharpness, not full-height low-res portrait crop. F10/F90 BMW PressClub lists 1920×1080; for 1080×1920 centre crop expect limited pixels. Seek new native UHD 4K independent originals to make each generation strong. G90 official 2024 master is high-res but several GB and must be fetched using a runner with actual access and archive handling.

**Source rights:** BMW Group and individual videographers retain rights; copyright status for external reuse is *unknown*. Research and private-review preparation do not imply public publishing permission. Keep originals, credit/source URLs, note restrictions. No prohibited logins, DRM bypass, or publication to a public Release.

## Exact 42 source slots — ZERO finished selections

**Important:** The camera setups below are **visual shot requests**, not verified available footage, accurate clip timecodes, or even proof the camera angle exists in any candidate. Agent C must not treat these as media. Each of these 42 rows is missing an actual file and trusted `sourceInSeconds`/`sourceOutSeconds`.

| Slot | Generation | Film frames (30fps) | Requested unique camera setup | Candidate source IDs — not yet selected |
|---:|---|---:|---|---|
| 01 | E28 (1985) | 0–5 | front three-quarter approach | E28-chris-harris, E28-btmedia, E28-2005-m5-parade, E28-heritage-2019 |
| 02 | E28 (1985) | 6–17 | side-on moving tracking | E28-chris-harris, E28-btmedia, E28-2005-m5-parade, E28-heritage-2019 |
| 03 | E28 (1985) | 18–30 | wheel visibly rotating close | E28-chris-harris, E28-btmedia, E28-2005-m5-parade, E28-heritage-2019 |
| 04 | E28 (1985) | 31–44 | rear three-quarter pursuit | E28-chris-harris, E28-btmedia, E28-2005-m5-parade, E28-heritage-2019 |
| 05 | E28 (1985) | 45–58 | dynamic pass-by | E28-chris-harris, E28-btmedia, E28-2005-m5-parade, E28-heritage-2019 |
| 06 | E28 (1985) | 59–70 | environmental / hero motion | E28-chris-harris, E28-btmedia, E28-2005-m5-parade, E28-heritage-2019 |
| 07 | E34 (1988) | 71–84 | front three-quarter approach | E34-2005-m5-parade, E34-bmw-generations-2017 |
| 08 | E34 (1988) | 85–97 | side-on moving tracking | E34-2005-m5-parade, E34-bmw-generations-2017 |
| 09 | E34 (1988) | 98–110 | wheel visibly rotating close | E34-2005-m5-parade, E34-bmw-generations-2017 |
| 10 | E34 (1988) | 111–123 | rear three-quarter pursuit | E34-2005-m5-parade, E34-bmw-generations-2017 |
| 11 | E34 (1988) | 124–137 | dynamic pass-by | E34-2005-m5-parade, E34-bmw-generations-2017 |
| 12 | E34 (1988) | 138–150 | environmental / hero motion | E34-2005-m5-parade, E34-bmw-generations-2017 |
| 13 | E39 (1998) | 151–163 | front three-quarter approach | E39-launch-nurburgring-2000, E39-launch-road-2000, E39-2005-parade |
| 14 | E39 (1998) | 164–177 | side-on moving tracking | E39-launch-nurburgring-2000, E39-launch-road-2000, E39-2005-parade |
| 15 | E39 (1998) | 178–190 | wheel visibly rotating close | E39-launch-nurburgring-2000, E39-launch-road-2000, E39-2005-parade |
| 16 | E39 (1998) | 191–203 | rear three-quarter pursuit | E39-launch-nurburgring-2000, E39-launch-road-2000, E39-2005-parade |
| 17 | E39 (1998) | 204–216 | dynamic pass-by | E39-launch-nurburgring-2000, E39-launch-road-2000, E39-2005-parade |
| 18 | E39 (1998) | 217–230 | environmental / hero motion | E39-launch-nurburgring-2000, E39-launch-road-2000, E39-2005-parade |
| 19 | E60 (2005) | 231–243 | front three-quarter approach | E60-country-2005, E60-tracking-2005, E60-helicopter-2005, E60-night-2005 |
| 20 | E60 (2005) | 244–256 | side-on moving tracking | E60-country-2005, E60-tracking-2005, E60-helicopter-2005, E60-night-2005 |
| 21 | E60 (2005) | 257–270 | wheel visibly rotating close | E60-country-2005, E60-tracking-2005, E60-helicopter-2005, E60-night-2005 |
| 22 | E60 (2005) | 271–283 | rear three-quarter pursuit | E60-country-2005, E60-tracking-2005, E60-helicopter-2005, E60-night-2005 |
| 23 | E60 (2005) | 284–296 | dynamic pass-by | E60-country-2005, E60-tracking-2005, E60-helicopter-2005, E60-night-2005 |
| 24 | E60 (2005) | 297–310 | environmental / hero motion | E60-country-2005, E60-tracking-2005, E60-helicopter-2005, E60-night-2005 |
| 25 | F10 (2011) | 311–323 | front three-quarter approach | F10-track-2011, F10-seville-2011 |
| 26 | F10 (2011) | 324–336 | side-on moving tracking | F10-track-2011, F10-seville-2011 |
| 27 | F10 (2011) | 337–349 | wheel visibly rotating close | F10-track-2011, F10-seville-2011 |
| 28 | F10 (2011) | 350–363 | rear three-quarter pursuit | F10-track-2011, F10-seville-2011 |
| 29 | F10 (2011) | 364–376 | dynamic pass-by | F10-track-2011, F10-seville-2011 |
| 30 | F10 (2011) | 377–389 | environmental / hero motion | F10-track-2011, F10-seville-2011 |
| 31 | F90 (2017) | 390–402 | front three-quarter approach | F90-country-2017, F90-track-2017 |
| 32 | F90 (2017) | 403–416 | side-on moving tracking | F90-country-2017, F90-track-2017 |
| 33 | F90 (2017) | 417–429 | wheel visibly rotating close | F90-country-2017, F90-track-2017 |
| 34 | F90 (2017) | 430–442 | rear three-quarter pursuit | F90-country-2017, F90-track-2017 |
| 35 | F90 (2017) | 443–456 | dynamic pass-by | F90-country-2017, F90-track-2017 |
| 36 | F90 (2017) | 457–469 | environmental / hero motion | F90-country-2017, F90-track-2017 |
| 37 | G90 (2024) | 470–482 | front three-quarter approach | G90-launch-2024, G90-automann-2025, G90-joeachilles-2024 |
| 38 | G90 (2024) | 483–495 | side-on moving tracking | G90-launch-2024, G90-automann-2025, G90-joeachilles-2024 |
| 39 | G90 (2024) | 496–509 | wheel visibly rotating close | G90-launch-2024, G90-automann-2025, G90-joeachilles-2024 |
| 40 | G90 (2024) | 510–522 | rear three-quarter pursuit | G90-launch-2024, G90-automann-2025, G90-joeachilles-2024 |
| 41 | G90 (2024) | 523–537 | dynamic pass-by | G90-launch-2024, G90-automann-2025, G90-joeachilles-2024 |
| 42 | G90 (2024) | 538–551 | environmental / hero motion | G90-launch-2024, G90-automann-2025, G90-joeachilles-2024 |

## Candidate primary sources and cited owner pages

| Era | Evidence source | Candidate URL | Native specification / verified status |
|---|---|---|---|
| E28 | BMW Group — E28-heritage-2019 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0007062/90-years-of-bmw-automobiles | 1920×1080 (catalog page only); NOT FFprobed or inspected |
| E28 | BMW Group — E28-2005-m5-parade | https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2 | 720×576 (catalog page only); NOT FFprobed or inspected |
| E28 | The Drive / Chris Harris — E28-chris-harris | https://www.youtube.com/watch?v=FzOPR7STqrQ | unknown; NOT FFprobed or inspected |
| E28 | BT Media — E28-btmedia | https://www.youtube.com/watch?v=eQ59Ptr0HwI | unknown; NOT FFprobed or inspected |
| E34 | BMW Group — E34-2005-m5-parade | https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2 | 720×576 (catalog page only); NOT FFprobed or inspected |
| E34 | BMW Group — E34-bmw-generations-2017 | https://www.press.bmwgroup.com/global/video/detail/PF0005757/clip-bmw-m5-generations | unknown; NOT FFprobed or inspected |
| E39 | BMW Group — E39-launch-nurburgring-2000 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0003267/der-neue-bmw-m5?language=en | 1024×576 (catalog page only); NOT FFprobed or inspected |
| E39 | BMW Group — E39-launch-road-2000 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0003267/der-neue-bmw-m5?language=en | 1024×576 (catalog page only); NOT FFprobed or inspected |
| E39 | BMW Group — E39-2005-parade | https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2 | 720×576 (catalog page only); NOT FFprobed or inspected |
| E60 | BMW Group — E60-country-2005 | https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2 | 720×576 (catalog page only); NOT FFprobed or inspected |
| E60 | BMW Group — E60-tracking-2005 | https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2 | 720×576 (catalog page only); NOT FFprobed or inspected |
| E60 | BMW Group — E60-helicopter-2005 | https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2 | 720×576 (catalog page only); NOT FFprobed or inspected |
| E60 | BMW Group — E60-night-2005 | https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2 | 720×576 (catalog page only); NOT FFprobed or inspected |
| F10 | BMW Group — F10-track-2011 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0003177/the-new-bmw-m5-model-year-2011/5?forceSitePreference=DESKTOP | 1920×1080 (catalog page only); NOT FFprobed or inspected |
| F10 | BMW Group — F10-seville-2011 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0003177/the-new-bmw-m5-model-year-2011/5?forceSitePreference=DESKTOP | 1920×1080 (catalog page only); NOT FFprobed or inspected |
| F90 | BMW Group — F90-country-2017 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0005589/the-new-bmw-m5-with-m-xdrive?forceSitePreference=DESKTOP | 1920×1080 (catalog page only); NOT FFprobed or inspected |
| F90 | BMW Group — F90-track-2017 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0005589/the-new-bmw-m5-with-m-xdrive?forceSitePreference=DESKTOP | 1920×1080 (catalog page only); NOT FFprobed or inspected |
| G90 | BMW Group — G90-launch-2024 | https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009730/the-new-bmw-m5 | unknown; NOT FFprobed or inspected |
| G90 | Automann-TV — G90-automann-2025 | https://www.youtube.com/watch?v=sEty8t1D0ek | unknown; NOT FFprobed or inspected |
| G90 | Joe Achilles — G90-joeachilles-2024 | https://www.youtube.com/watch?v=cM1Dv5oRGVk | unknown; NOT FFprobed or inspected |

## Remaining blockers — what Agent C must receive before integration

1. Download at best authentic available quality (retain original file SHA, real FFprobe dimensions/FPS/duration) on a **network-enabled authorized workstation or private worker**. The present chat container cannot reach external media; the attached GitHub connector cannot transfer or host multi-GB originals; the repository's existing BMW workflow only validates text/contracts, and its generic media bridge is both restrictive and outside Agent A's allowed ownership.
2. Visually inspect moving frames of **each** possible shot and ensure generation/vehicle identity is unmistakable. Document original source page, creator, native dimensions/FPS, temporal content, source in/out timestamps, and rights. Ensure 42 visually distinct moving shots — six per generation — with separate camera angle/content and no fake crops/looped footage. Fail hard on duplicates.
3. Use `python production/videos/bmw-m5-evolution-001/footage/prepare.py fetch ...` for verified official direct MOV links; `probe`, `contact`, then `verify <approved-cuts.local.json>` for 42 real, manually approved records. Invoke `footage/validate_sources.py <generated_manifest> --require-ready` to confirm metadata. Do not mark ready until the actual playable footage has passed inspection.
4. Deliver actual private bytes through an authenticated, bounded worker artifact or user-approved secure location with real artifact URL and SHA list. No public GitHub Release containing uncleared media. Agent C then combines with B and separately checks 552-frame final render with real private audio.

**Do not claim the project is footage-ready.** Current Agent A contribution is reliable research/validation engineering and actionable source-page links, not the 42-clip deliverable.
