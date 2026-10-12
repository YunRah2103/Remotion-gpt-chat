# YUNEX HDR CINEMATIC 001 — Agent A final source inspection and edit handoff

**Source:** Falken Nürburgring 24H HDR Director’s Cut, official Falken Tyres / MOTIONCTRL producer original. 
**Production:** 6K/8K RAW-origin cameras as documented by producer; 4K finished master.
**Original download:** https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4
**Rights:** Official press availability is not proof that derivatives may be publicly uploaded. Confirm usage licence before publishing.
**Source SHA-256:** `389a5e6c367466de1896076a137e9ae475f1b8062ed70bdf08ed70a47225c9ad`
**Technical status:** PASS — source was actually downloaded and decoded, 3840x2160, H.264 High 10, 25fps, yuv420p10le, BT.2020 primaries, PQ/ST2084, BT.2020nc, 338.04s.

## Creative status: HOLD — not approved as the final YUNEX HDR spectacle

**User reviewed the preview on 12 October 2026 and explicitly rejected its appearance. Do not treat this film as edit-approved, regardless of its technical HDR checks.**\n\nA second independent **16-frame native 4K 10-bit Y plane scan** across the original found **max PQ Y code value 470/1023**, with **zero pixels over code 600 in all 16 sampled frames**. This is luminance-code evidence of a restrained HDR grade, not proof of the entire film’s scene luminance and does not rule out bright RGB primaries. It does, however, make the requested bright HDR demonstration doubtful.

The inspected 4x4 frame contact sheet shows documentary-style endurance racing, daylight track/paddock, some night pits, aerials, and sunset. Multiple distinct camera angles **do** exist, and source is real moving footage, but it lacks the consistent glossy supercar reveals, lit wet roads, and aggressive specular reflections envisioned by user. **Do not equate a genuine HDR technical file with impressive HDR peak-brightness.** No SDR-to-HDR regrading has been performed.

## Candidate shots / seek a few seconds around these frames

These are real inspected frame timestamps, not assertions that full adjacent intervals contain continuous clean usable footage. Editor must review motion, in/out points, cutoffs, and actual signal before approval.

| Time | Visible frame content | Suggested use |
| --- | --- | --- |
| 00:10.6 | Teal/blue BMW race car head-on | Hero approach, if moving cleanly |
| 01:35.1 | Falken Porsche race car in crowded paddock | Car reveal / contrast |
| 01:56.2 | Porsche #44 close-up quarter / side | Livery, wheels, premium detail |
| 02:38.5 | Two fast race cars on track | High-speed motion |
| 04:03.0 | Blue race car and crew at illuminated night pit | Night atmosphere / brighter rear lights |
| 04:24.1 | Mechanics attending to wheel and car | Authentic pit detail, not primary hero |
| 05:06.4 | Scenic tree-lined circuit at golden hour | Atmospheric transition |
| 05:27.5 | Long sunset race-circuit view | Calm end card, not primary hero |

This footage is an archival technical fallback only. **Do not start an edit with this film: the user rejected it.** Obtain another visually spectacular original HDR source with independently checked provenance and decoded frames.

## Device QA

- The source is original H.264 **High 10**, which may lack native hardware support on the Samsung Galaxy S25 despite proper PQ metadata. The original untouched 6-second stream-copy sample is included in the master artifact.
- A separate derivative HEVC Main 10, 1920x1080, BT.2020/PQ 5s sample is in the second QA artifact. This is clearly a compatibility **transcode**, not the source.
- Phone screen HDR UI switching / sustained display peak brightness **was not independently verified** from a physical Galaxy S25.

## Verifiable artifacts

1. Original HDR source and QA ZIP — https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38250029381/artifacts/11747528274
2. Second-pass 16-frame native 4K PQ scan, real contact sheet, HEVC phone sample — https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38251429991/artifacts/11748420677
3. GitHub tracking issue: https://github.com/YunRah2103/Remotion-gpt-chat/issues/36

No footage edited, and no unrelated repository touched.
