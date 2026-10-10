# Huracán STO V10 — Agent A native visual QA (10 October 2026)

> **FORMAT OVERRIDE — latest user instruction (10 October 2026): ALL SOURCE SHOTS AND THE ENTIRE FINISHED FILM MUST BE LANDSCAPE 16:9. FINAL OUTPUT 1920×1080, 30fps, 316 frames.** This supersedes ALL earlier vertical/portrait source-quality verdicts and instructions below. The three Phantom 1920×1080 landscape sources NOW PASS NATIVE OUTPUT-RESOLUTION CHECKS without cropping/upscaling. Monaco 1280×720 is landscape but has a lower-resolution warning. Six LA Modz 720×1280 portrait sources are EXCLUDED from landscape edit production. **Gate A still NOT PASSED** because distinct fast-moving STO camera angles remain insufficient/unverified, despite three technically acceptable FHD landscape sources. Historical results below reflect the earlier vertical requirement and are preserved as an audit trail.


## Audited deliverable

**Run:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38089620500

**Single-ZIP artifact:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38089620500/artifacts/11683553050

**Artifact ID:** 11683553050 · **artifact bytes:** 183,984,200 · **ZIP inside artifact:** 183,975,615 bytes. The ZIP includes original downloaded sources, manifest JSON, and LEFT/CENTRE/RIGHT preview contact sheets. It was downloaded from Actions and opened locally for independent visual review; not merely inferred from the workflow's success.

All actual video files were FFprobed, SHA-256 hashed, and each preview opened. Additional 1 fps shot boards for the three Phantom sources were rendered and reviewed independently.

## Actual media assets

| Publisher ID | SHA256 | Actual video | Source crop pixels for vertical 9:16 | Visual findings |
|---|---|---|---|---|
| phantom-sto-primary | dba560aea7cbdf0f64f7e7bb647ae2d43cabcf03a7af9a6a7a445122caa43f33 | 1920×1080, 25 fps, 21.24 s | **606×1080** | Blue/yellow STO, front and rear angles, aero, wheels, exhaust, cabin, a little genuine street motion. Branded throughout + black logo end card. |
| phantom-sto-lambo | 62deb84ce58be337c61402b8d1534b369d2d41c0b1797d0577cfdfe07365d502 | 1920×1080, 60 fps, 29.65 s | **606×1080** | Same blue/yellow STO; front/rear 3/4s, low side, aero and some slow movement on paved road. Publisher watermarks and end card. |
| phantom-sto-huracan | d4d34a89be7b27f50e5f1a82a28521eae2fae9ac28e78613a847b0ef36564697 | 1920×1080, 60 fps, 31.40 s | **606×1080** | Same STO at indoor static display, camera pans/drone high angle, wing macro. Mostly stationary car and distracting rope barrier/shoppers. |
| monaco-island-sto-720 | 6ca76917c22a153af448e942ec070d5151eff10c83364d7bf6d5d2607832bd56 | 1280×720, 25 fps, 225.48 s | **404×720** | Mixed feature/marketing video with verified studio shots of pale-blue/orange STO plus presenter and track footage. Racing shots need *individual* verification; don't mislabel Huracán Super Trofeo racing model as STO. |

**Fifth source:** generic Phantom WhatsApp video technically rejected as too short/slow; exclude.

**Resolution note:** 1920×1080 landscape yields only 606×1080 actual center-crop pixels. Scaling that to 1080×1920 is upscaling, not preserving native 1080p TikTok detail. Monaco only supplies 404×720 crop pixels. No acquired video qualifies as sharp native 1080×1920 vertical or 4K-landscape. This is an important premium-quality blocker.

## Provisional usable source ranges — *not* approved 10 shots

Timings are visual frame-board samples, not certified source in/out points. Candidate seconds:

- Primary: 0–1.4 low front 3/4; 3–4 STO badge; 4–5 rear wing; 6–7 exhaust macro; 7–11 cockpit/dashboard/interior; 12–13 bodywork/wheel; 14–16 low rear shot; 17–19 **real vehicle movement**. Do not count end-logo seconds 19–21.
- Lambo: 0–3 first exterior shot/front and rear; 4–10 headlight, side and aero details; 11–13 wheel close-up; 14–16 low rear angle; 17–27 several **slow exterior moving/car-moving views**. Exclude logo end card.
- Huracan: 3–13 indoor showroom car angles; 13–20 overhead shot of mostly stationary car; 21–27 wing/body close-ups. Do not claim these are fast track-driving footage.
- Monaco: ~22 seconds studio STO profile, ~67 seconds studio 3/4, ~112 seconds interior, ~157 seconds circuit footage requiring exact model/identity verification, ~202 seconds street/presenter. Some footage is visibly lower quality and not suited to sharp TikTok crop.

These ranges are only for **research and editor scouting**. Shot-by-shot model identity, car motion, camera-angle distinctness, crop safety and duplicates must be independently approved. Distinct *scene cuts* are not necessarily distinct *camera angles*.

## Gate result

**Gate A: NOT PASSED (premium delivery quality BLOCKED).** Four acquired sources, several genuine moving segments, but **zero approved 1080p-portrait crop sources** and no certified 10 distinct moving-car angles. Do not overstate 15+ detected scene cuts as validated shots.

## Second acquisition pass

[Commit 6887f2e](https://github.com/YunRah2103/Remotion-gpt-chat/commit/6887f2ecd1eed1fd187d25eb56fb465775e6cf2d) adds six STO-tagged workshop video files officially embedded in LA Modz's 2021 STO tinting blog. These may supply native portrait detail footage but likely little genuine driving. Their download/FFprobe/manual status is separate from the initial successful artifact.

## Priority before final B handoff

1. Obtain genuine 4K/portrait **driving** shots of the Huracán STO, not an EVO or racecar substitute.
2. Apply source-ID + true pixel-crop checks to each selected timestamp.
3. Exclude branded end cards, overlays, static shots pretending to be racing.
4. Agent D should review the actual ZIP images, not only this report or CI.


## Final second-pass results (independently reviewed)

GitHub [run 38089913965](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38089913965), [artifact 11683039237](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38089913965/artifacts/11683039237), delivered **10 actually downloaded MP4 source files**, one inner source ZIP of **219,502,368 bytes**. All ten files were FFprobed and SHA-256 hashed and their generated real frame contact sheets reviewed. A further (eleventh) Phantom URL was technically rejected, not counted.

The added **six** LA Modz STO workshop videos are all **720×1280 portrait, ~3.0–15.0 seconds, ~29.6–30 fps**. Visual review confirms a genuine dark grey/black STO, wing and brake/bodywork details and a tinting demonstration, but they contain installer/person/text/brand overlays and nearly all portray a **stationary** car. They cannot be counted as six premium racing/rolling shots. They are not true 1080×1920 footage.

Further detailed review of Monaco Island's feature at 5-second intervals confirms that most apparent high-speed race clips depict racing-spec Huracáns with racing liveries, **not demonstrably the road-going STO**. Therefore none of those are certified as STO track-driving clips.

### Final Agent A sign-off

- Download/package functionality: **PASS (10 real MP4s, ZIP, native checks, actual preview images)**.
- Car-specific technical QA: **partial**; the initial three Phantom videos and six LA Modz clips depict genuine road STOs; the Monaco source mixes models and cannot be approved wholesale.
- Sharp 1080×1920 footage: **FAIL: 0/10 native or crop-resolution qualified**.
- 10 distinct high-quality moving **road STO** shots: **FAIL / UNVERIFIED**. Scene cuts, installer camera moves and repeated slow drive-bys are not automatically different dynamic driving shots.
- **Gate A final status: FAIL for premium edit release**. Hand off the package for research only. Do not declare a publish-ready footage set or request final render based on this dataset.

Recommendation: acquire a single original 4K/vertical cinematic Huracán STO source with genuinely different road/track camera angles (creator-provided master/press package); inspect and approve individual frame ranges before promoting to Gate A PASS. If a premium licensed package is acceptable, creators have sold native 4K vertical STO angle sets; payment/user approval required, never implied.
