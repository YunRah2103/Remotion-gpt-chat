# YUNEX Episode 003 — cinematic footage rescue V2 (16 October 2026)

**Scope:** footage acquisition/review only. The V4 19.10s documentary, narration, audio, graphics, and existing approved footage were NOT edited.

## Definitive private review

Four revised, playable H.264 source excerpts have been selected from two **new** professional video sources and delivered in the owner's ChatGPT session as `YUNEX_EP003_V2_CURATED_PRIVATE_EDITOR_HANDOFF.zip` (10,909,484 bytes, 19 files). The archive contains each actual source-selection MP4, its complete 9:16 crop video preview, sampled contact sheet, FFprobe report, SHA256, exact timeline metadata, and README. ZIP integrity, each clip's full FFmpeg `-xerror` decode and SHA256SUMS checks PASS. **Do not assume this ChatGPT download URL is persistent or a GitHub asset.**

| Role | Private MP4 filename | Original source interval | SHA256 | Editorial |
|---|---|---:|---|---|
| OPENING | `P1_C02_IMMEDIATE_FRONT_TRACKING.mp4` | Miller Motorcars `DOZ3HZSSU2Q` 74.20–77.00s | `13192e726212e8f747d9e5a79d0bde6a1f5a78c111231da800cc376e5201beea` | GO for **private edit experiment**, not global film approval |
| MIDDLE | `P1_C01_WOODED_LOW_APPROACH.mp4` | Same, 57.40–59.25s | `3c2aaf8bbf1b071315b35acc1bf3851b661387eeded4048daf593a86873f0177` | CONDITIONAL; removed earlier 56.3–57.4s MSO HS foreground |
| ENDING ALTERNATIVE | `P1_C03_AGGRESSIVE_NOSE_APPROACH.mp4` | Same, 89.20–90.70s | `071b85cf59c284dcaca10ccc9fa73c1b5f05f0ddc7582f445b317bdf83636c62` | CONDITIONAL; car visible instantly but too tightly cropped for a grand finale |
| MIDDLE ALTERNATIVE | `P1_C04_SUNSET_SIDE_DRIVE.mp4` | Blonde Films 50.00–54.50s | `35527c93dae29bb8d2969c6dac57ca5ffad2ef3073e00ffc4dab5628f0b44531` | CONDITIONAL; graceful sunset side drive, different car/location/lighting, small mobile subject |

### Provenance

- Miller Motorcars / McLaren Greenwich film: https://www.youtube.com/watch?v=DOZ3HZSSU2Q . S25 V4 phone job [#120](https://github.com/YunRah2103/Remotion-gpt-chat/issues/120) **PASS**, owner-only source draft asset 647540652; original reported 1920x1080 H.264, 120s, SHA256 `40be06a891a2473c0a2ffb43b9091c174bef8e6939513ca5563520705338ce49`; authenticated contact QA [run 38913870648](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38913870648), artifact 12051063373; high-res visual model-identity QA [run 38915638989](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38915638989), artifact 12051783467.
- Blonde Films original P1 Dubai brand film: https://weareblonde.com/mclaren-p1-dubai/ . Original producer-embedded film imported privately, FFprobe + complete decode and creator video frame proof [run 38913971263](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38913971263), artifact 12051009622. 1920x804 widescreen, 94s, source has creator branding.
- Raw five-candidate technical scout workflow [run 38916412028](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38916412028), artifact 12052657083 PASS. The *final owner-only ChatGPT archive* is more strictly curated: trims out HS, drops the weak Blonde B02 alternative, and shortens overly close ending.
- The decoded 1920x1080 Miller master itself has baked horizontal black mattes; photographed area approximately 1920x824. In genuine 9:16 framing it yields ~464x824 photographic pixels, not native vertical UHD. The Blonde film yields about 452x804. Preview MP4 pixels were deliberately upscaled to mobile 540x960 for evaluation, explicitly labelled as such.
- All third-party publication/reuse rights remain **unverified**. No source footage was publicly committed to repository. This is owner-only review and does NOT grant public-use licence.

### Quality gate / negative findings

1. **Opening replacement:** Miller original 74.2–77.0 P1 front tracking, has car prominent immediately. A clear improvement over rejected V4 parked industrial-building shot, but narrow mobile crop cannot fully contain the wider car; try 1–2 second placement with motion-aware reframing. No claimed airbrake operation.
2. **Middle:** clean moving P1 from 57.4–59.25 rather than V4 distant aerial repetition; Blonde silver P1 desert silhouette as a contrasting cutaway only, not visual continuation.
3. **Ending:** close real P1 89.2–90.7 removes V4 empty-corner delay; **still not breathtaking on phone** because the nose fills and clips the narrow crop. A cinematic full-car flyby remains an unresolved blocker.
4. **Vehicle identity:** Miller film also includes an MSO HS. Frame review identified false car inclusion in the original 56.3–59.3 selection; amended to 57.4–59.25. Reject original MSO HS car closeups outright.
5. **Weak rejected Blonde shot:** 63.3–66.6 has baked engineering copy/graphics and loses the P1 from centered portrait framing; removed from curated archive.
6. **Failures, no retries:** Ricky Blackwell [#119](https://github.com/YunRah2103/Remotion-gpt-chat/issues/119) phone failed HTTP 403; Brennan Wright [#121](https://github.com/YunRah2103/Remotion-gpt-chat/issues/121) lacks genuine 1080p. Do not rerun automatically.
7. **No real filmed on-track P1 wing pitch change under braking authenticated.** Prior Shmee [#112] visible rise is STATIONARY entering Race Mode. Do not substitute a static high wing/other McLaren.
8. The rejected V4 original MP4 itself was not retrievable in the executing working container. Its documented GitHub EDL and user review described weak frames, but actual side-by-side V4 still comparison was therefore **not** fabricated.

**Final gate: LIMITED GO** to test a substantially stronger opening and some middle shots. **NO-GO** on claiming an outstanding complete replacement package or resolved final breathtaking ending. No documentary edit was made. The final editor owns all picture/audio assembly and publication decisions.

## Final continuation audit — jobs #122 and #123 (16 October, after original curated handoff)

**Both queued S25 jobs have terminal outcomes.** This is the definitive closeout of the bounded V2 footage rescue, not evidence of a new quality-approved final film.

- [Phone job #122](https://github.com/YunRah2103/Remotion-gpt-chat/issues/122), CarSpotterQVS source `https://www.youtube.com/watch?v=TJtYYbZbsA4`, 0–120s: **FAILED**, worker said `Decoded video codec, dimensions or duration invalid`. No genuine playable MP4 was delivered. Do not rerun an unchanged URL.
- [Phone job #123](https://github.com/YunRah2103/Remotion-gpt-chat/issues/123), Visual Car Reviews source `https://www.youtube.com/watch?v=Z2CHtZZFTDY`, 0–120s: phone **PASS**, 1920×1080 H.264, 120s, 82,458,599 bytes. Original SHA256 `2d5cc25fb9dc3aa0f3abf12019fca9322daeb83a4216f23a19c2c3e69e7480a2`; draft release asset ID **647642651**, reuse rights unverified.
- First full-source private QA run [38918933187](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38918933187) has overall workflow **FAIL** because its matrix improperly included the *failed* #122; the #123 job itself completed **SUCCESS**, FFprobe/full decode and contact-frame artifact **12054221005**.
- Dedicated microflyby QA [38921562514](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38921562514) **SUCCESS**; review artifact **12054449422** includes real playable 7.0–12.5s and 23.0–30.0s original-timeline MP4 extracts and 540×960 9:16 crops, FFprobe reports, SHA256 records and **6fps** contact grids. All four sample video files full decode PASS. This is *private owner-only research*, not redistributed/publicly cleared footage.
- **Observed frames:** Real road-going silver P1 low-ish Nürburgring corner approach/trackside pass around original ~9–11s and ~27–29s, but car prominent/visually valuable for **under one second per pass**; landscape framing requires crop tracking and closest subject becomes cropped from the portrait window. Most surrounding samples show **empty circuit**, distant P1, or amateur back-of-car road chase filmed through another vehicle, with creator attribution. No legitimate filmed on-track rear-wing pitch change while braking.
- **Editorial NO-GO for #123 as a new hero replacement.** Neither brief close pass establishes the extraordinary uninterrupted first-second hook or ending requested. They are technically verified *optional very short flash inserts* only, not additions to the four-clip V2 premium shortlist.
- Prior curated `YUNEX_EP003_V2_CURATED_PRIVATE_EDITOR_HANDOFF.zip` still has four independent, technically verified private MP4 selections. Its front tracking from #120 remains the best potential opening. It does **not** solve a breathtaking full-car closing shot or rights clearance. Nothing altered in V4 documentary/approved soundtrack.
- Additional external filmmaker/stock queries were checked: examples are the *already-reused* `E9IWiTpWeiM` film, a P1 GTR/LM (not the road model), animated launch films, or rights-gated footage. No authenticated, new, visually superior shot obtained.

**FINAL STATUS: FOOTAGE INVESTIGATION COMPLETE; PREMIUM RESCUE GOAL NOT ACHIEVED.** Do not claim 4–7 world-class replacement shots or a successful cinematic V5. The editor may test the curated #120 opening and 1–2 conditional middle alternatives, but the main ending blocker remains. For a genuinely higher-quality film, next attempt should pursue licensed original filmmaker/production-company master footage with clean 4K/native vertical-friendly composition; don't keep retrying the same low-quality Nürburgring reuploads.
