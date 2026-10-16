# YUNEX Episode 003 — McLaren P1 active rear wing / airbrake
## Sole Footage Specialist — FINAL VERIFIED PRIVATE REVIEW HANDOFF, 16 October 2026

**Role separation:** this is an acquisition/verification package, not an edited film. Eight 1920×1080 H.264 selection MP4s with actual source timecodes, SHA256 hashes, FFmpeg full decode, contact sheets and portrait crop previews have been packaged in the footage agent's chat for the project owner. The actual third-party footage is intentionally NOT committed to this public repository.

### Most important new footage: authentic moving P1 wing
Phone [#112](https://github.com/YunRah2103/Remotion-gpt-chat/issues/112) PASS verified via authenticated GitHub Actions [38889962981](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38889962981) (private-review artifact ID 12040679258). Original 90 s phone MP4 is saved as **owner-only draft GitHub Release asset 647028735**.
- Creator / source: **Shmee150 / Tim Burton**, ["Putting the McLaren P1 into Race Mode"](https://www.youtube.com/watch?v=SsOChgy6ZPU).
- SHA256 of recovered ORIGINAL SOURCE (phone and independent Actions match): `6188773e4892ce8a728e5776794b77aed6df1d1522201f940794ee6b7b52310e`.
- Source file: 1920×1080 H.264, 25fps, 90s, AAC audio; full decode PASS, 35,580,810 bytes.
- **Exact selected source timeline: 156.00–165.00s**, corresponding to local #112 MP4 **66.00–75.00s**. The rear wing visibly rises over roughly source 158–164s. Before/after frame comparison confirms physical motion on the same stationary silver road P1. Extracted H.264/AAC selectable 9.0 s MP4, SHA256 `5b99bc8fc81fd4ed28ff61007e2bb5f4d33bfa61d67756d5e05714b0c057b209`; FFprobe and full FFmpeg decode PASS. Original ambient/narration audio preserved.
- **DO NOT mislabel** this as on-track braking airbrake. This is stationary Race Mode deployment; under actual braking the wing can pitch farther to an airbrake angle. No authenticated on-track braking wing pitch was found.
- Source has visible Shmee150 watermark, wide static camera/background; crop tighter on wing but preserve creator attribution and do not assume publication clearance. Portrait crop proof is real crop of 1920×1080, not native 1080×1920 photography.
- GitHub editor can retrieve #112 original privately via the existing `.github/actions/yunex-v4-import` action; original footage stays draft, not a public Release.

### Eight primary visual selections (all silver P1)
| ID | Source / original time (s) | Role and qualification |
| --- | --- | --- |
| 01 | McLaren Nürburgring `E9IWiTpWeiM` 131.60–135.35 | Rear wing track camera, wing position appears **static**, no brake proof |
| 02 | Same 79.08–79.83 | Low trackside silver P1 pass; great fast insert |
| 03 | Same 79.94–81.23 | Rear three-quarter corner exit |
| 04 | Same 105.60–108.55 | Aerial/hairpin driving |
| 05 | Same 114.75–118.05 | Overhead P1 road/track move |
| 06 | Same 161.00–163.87 | Long-lens close approach/flyby; strong final shot |
| 07 | Same 170.10–172.10 | Authentic in-car steering; no brake-pedal shot |
| **08** | **Shmee150 `SsOChgy6ZPU` 156.00–165.00** | **NEW ACTUAL WING RISE WHILE PARKED; preferred mechanical hook if clearly captioned** |

For 01/04/05/06, phone source issue #75, private draft asset **639908614**, source excerpt begins 105s. For 02/03 issue #74, asset **638215052**, source excerpt begins 45s. For 07 phone issue #76, asset **639897135**, source excerpt begins 165s. Private silver recordings originally verified in [Actions run 38543915087](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38543915087), artifact 11883841098; #74 separately in [38465916924](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38465916924), artifact 11849070032.

### Phone jobs and research
- #110: wing-specific YouTube URL unavailable; phone FAILED, avoid redundant retry.
- #111: Shmee source original 0–90s verified, visually shows controls and dashboard, **no exterior wing motion in this segment**.
- #112: Shmee source original 90–180s verified, authentic visible wing rise at original 158–164s. **Technical success and visual motion verified.**
- Previous #69 orange P1 footage is a weaker mismatched backup, *excluded* from primary eight.

### Editorial safety/quality & rights
**First second:** feature genuinely changing wing shape from 08, crop tight to emphasize mechanical motion; avoid a long static establishing image. Cut to real McLaren silver motion from #02/#03 then clear aero/downforce explanation supported by #01/#08 and #05; close on #06. Retention should be judged by director. Do not claim the Race Mode stationary clip shows braking. Manufacturer P1 handbook confirms airbrake mode pitches to maximum angle; rear downforce as well as drag is important.

**Publication rights have not been cleared** for either official McLaren or Shmee footage; files are provided for private review, not approved public redistribution. All 8 selections exist as playable MP4s in the owner's ChatGPT attachment package with contact sheets, true source in/out times, hashes and 9:16 still proofs. Public repo receives metadata only, never third-party MP4s.

**No film was edited or rendered by the footage specialist.**


## Final airbrake hunt result — #117 (16 October 2026)

Follow-up S25 [#117](https://github.com/YunRah2103/Remotion-gpt-chat/issues/117) **PASS**. Recovered actual original 120–360s of Shmee150's orange customer P1 source `https://www.youtube.com/watch?v=6fLjjnU7REQ`, 1920×1080 H.264, SHA256 `c5aec8c89df3dc15e9ac2229211192a88ad70362e4233800f58b5240ad86413d`, original phone draft asset 647140991. Private authenticated [Actions run 38895034269](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38895034269) FULL QA PASS. Contact sheets in artifact [12043112824](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38895034269/artifacts/12043112824) frame-sampled across all 240 seconds and visually inspected.

**Negative finding, important:** local 0–18s shows an orange P1 parked with raised wing, local 18–~160s is passenger-facing forward road footage without wing visible, local 160–180s is parked exterior and drive-off, local 180–240s is presenter/end cards. No shot proves wing pitch change *during real braking*. It would harm colour/visual continuity with the silver Nürburgring P1. **Reject for the 8-select final; do not imply this is a braking-airbrake shot.** This result supersedes the earlier pending #117 status.

Also source tests #113 Motor Trend private-video failure, #114 GTspirit invalid decode/metadata, and #115 BBC Spa HLS connection reset generated no usable footage. No more redundant jobs on failed URLs.

**Editor decision:** the eight existing silver P1 private-review clips are the final technical shortlist. Use mechanically authentic silver wing deployment (#112, original source 156–165s) as a truthful *stationary Race Mode deployment* visual, and an authentic silver track brake/turn-in performance shot for driving context. Manufacturer explanation of airbrake pitch and rear downforce may be narrated/diagrammed separately, but footage alone does not document a live track-braking wing pitch. Third-party redistribution rights for every candidate remain **unverified**.


## 16 October — refreshed 8-MP4 owner-only package, independently reverified in current ChatGPT session

The archived source MP4 bytes were recovered **from existing GitHub Actions artifacts only**, without new S25 downloads, and a refreshed private editor ZIP was created in the current ChatGPT working session: `YUNEX_EP003_P1_PRIVATE_EDITOR_READY.zip` (14,750,559 bytes, 31 ZIP members, archive test PASS). The ZIP is **delivered to the owner in ChatGPT**; it is *not uploaded into GitHub, and the sandbox path is not a persistent GitHub asset*. Folder structure: `MP4_SELECTS/` (eight H.264/AAC 1920x1080, 25fps excerpts), `CONTACT_SHEETS/` (4-point original timeline sheets plus wing before/after progression), `PORTRAIT_CROP_PROOFS/` (9:16 example stills), `EDITOR_READY_INVENTORY.csv`, `SOURCE_AND_HASH_MANIFEST.json`, `SHA256SUMS.txt`, `README_EDITOR_HANDOFF.md`. Every selection independently FFprobe checked, FFmpeg `-xerror` full decoded, SHA256 recalculated; all PASS. ZIP CRC/integrity PASS.

### Final verified selection manifest

| # | Exact original source interval | Duration | Context | SHA256 of **selection MP4** |
|---|---|---:|---|---|
| 01 | McLaren official `E9IWiTpWeiM` 131.60–135.35 | 3.76s | P1 wing visible during track footage; **NO verified on-road pitch change** | `af31c0fe043f448d6b6f0a1d7d16f1920c3291e59b9d3cca1502e35856c86356` |
| 02 | Same 78.66–79.14 | 0.48s | Recut: fast low rear trackside pass, preferred immediate driving action | `8cf3e9ad0fefe4c9ffd3538ceada803769900cb6cdc6c607f9339dbe0765d6e4` |
| 03 | Same 89.15–90.15 | 1.00s | Recut: fast rear 3/4 track pass from distinct camera; not proven braking | `00ccc45611c592c459ac81b5c8ca92c8b101bb2d59926bd583f5767e6026e0d0` |
| 04 | Same 105.60–108.55 | 2.96s | Aerial hairpin, conditionally poor 9:16 subject scale | `e3e1473e6488fc137140a87f09b77a0d2915bd434f4abf1dcf7fcafc97f89859` |
| 05 | Same 114.75–118.05 | 3.32s | Overhead genuine on-track movement | `839357c6fbdeb0c175a3ea26a2edd95c195382df9aaecd9349feec4d63c56bc9` |
| 06 | Same 161.45–163.50 | 2.08s | Recut: near-lens approach/flyby; recommended cinematic outro | `243931f5f621604f8ccd21e56233d7c0739d4407376bdd7e1cd3cc5677728891` |
| 07 | Same 170.10–172.10 | 2.00s | Authentic driver/steering; no brake-pedal proof | `a9cdbe511f14770b0e2b85633566b31d07e0fce20776809fb834052617055c2e` |
| 08 | Shmee150 `SsOChgy6ZPU` 156.00–165.00 | 9.00s | **Physical rear-wing rise confirmed from still sequence at 157–164s; P1 STATIONARY in Race Mode, NOT braking at speed** | `c9307330d90eaceb26880be558c69ee2d0aed0cf11f99794e7a14bbf128c60aa` |

Source original hashes independently matched the archive record: #74 `c31e3980735a2517ad7e3bb491b0db48a5b554a9ef3cffea9caa098752e9ca39`; #75 `9ec858abddc3182f195b40339f1ea9253cb785788879cdeb1bb57c7c357a0245`; #76 `e903e4070f41faf7d5adb144e9b16cc521f234a8383296a987bce9ac71387f40`; #112 `6188773e4892ce8a728e5776794b77aed6df1d1522201f940794ee6b7b52310e`. Native 25fps and 1920×1080 for these four source files. The footage was recoded at 25fps without misleading speed changes.

**Portrait limitation:** McLaren source has baked cinematic mattes and yields about 407×724 source-photo pixels after removing bars and composing 9:16; portrait stills are upscaled previews, *not* evidence of native 1080×1920 resolution. Tracked reframing required for fast passes. Stationary Shmee footage has no baked bars; crop is about 608×1080. **Creator watermark is retained**. Source redistribution rights remain unconfirmed; no upload of third-party video to public repository.

**Scientific/creative open dependency:** despite #113–#117 searches and live QA, **NO actual P1 wing pitch-change under real circuit braking has been authenticated**. The 0–1 second hook may show the fast genuine parked wing mechanism rising (clearly contextualized) or cut to the separate real driving footage; do not intercut deceptively as a single filmed on-track braking event.
