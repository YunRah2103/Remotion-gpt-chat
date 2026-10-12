# Agent C — French prototypes, editor handoff and independent archive QA (12 October 2026)

## Two physical models now present: technical delivery PASS; premium footage gate PARTIAL

**Primary single ZIP:** [CYBER-FUTURE-001-C-TWO-REAL-MODELS-FAST — GitHub artifact 11746231515](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38246365150/artifacts/11746231515).
Successful [workflow 38246365150](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38246365150) built real media; archive was separately downloaded, unpacked and verified, not inferred from CI status.
The outer GitHub ZIP contains the inner `CYBER-FUTURE-001-C-TWO-REAL-MODELS.zip`.
**Inner ZIP integrity PASS**, 81 entries, 19 playable native **1920×1080 H.264 MP4s**, 57 decoded JPEG contacts, two genuine untouched original MP4 source films, manifest, QA report, README.

Independent verification after downloading:
- All 19 clip manifest SHA256 hashes independently recomputed and matched **19/19**; no mismatch.
- All **19/19 MP4s** independently re-probed as 1920×1080 H.264 and **fully FFmpeg decoded** with `-xerror`, zero failed decodes.
- Original physical R5 Corsica film SHA256: `edf970e4b3b6d407b4e84e85cc130ddf3c8b16aee8166da90735a57c6299f6f5`.
- Original Citroën Oli advert SHA256: `c72787a882b239b6967db7d6ec2f1596cffffd103a8a2ce71205c7db1dd68627`.
- Selected duration **25.4 seconds total**, source shots only, **18.68s Renault** + **6.72s Citroën**, not an edit. No upscaling or fabricated footage.
- Filming and publishing/derivative-use rights are **not independently established**.

### Renault 5 Turbo 3E (physical 2025 prototypes) — 11 genuinely distinct selected shots
**9 moving + 2 beauty** on real Corsica locations, clean, no baked branding/titles, preferred hero shots **C05, C07, C08, C15, C16**, remainder useful support. Individual duration ~0.8–2.1s. Source https://www.auto-medienportal.net/video/load/original/3469/ . Editor source original included. These images are *not* CGI-suspect 2022 R5 studio promo.

### Citroën Oli all-e (physical 2022 concept) — 8 real camera micro shots, heavy editorial caveats
The WHOLE original 168.64s film was independently sampled (~4-second cadence), and the eight precise picks were inspected again using three decoded source frames per listed time range. Real photographed exterior/garage/city footage is visually discernible in all 8 picks, unlike the film's earlier animated graphics.

| Clip | Source time (s) | Length | Observed real-car content | Main limitation |
|---|---:|---:|---|---|
| O01 | 55.15–56.05 | 0.90 | car/door outside wooded home | strong white text; not driving |
| O02 | 60.90–61.48 | 0.58 | rear loading section, outdoor family | white text; not driving |
| O03 | 61.65–62.42 | 0.77 | physical car travelling through garage | under 1s; lifestyle subjects |
| O04 | 150.53–151.47 | 0.94 | charge-port hands/body detail | white copy; not driving |
| O06 | 156.31–157.27 | 0.96 | city corner, rear three-quarter car moving | baked `[all-ē]` title |
| O07 | 158.28–159.02 | 0.74 | close physical-car side pass | large centered Citroën Oli title |
| O08 | 159.06–159.91 | 0.85 | physical-car rear-following street | O07/O08 belong to contiguous shot / movement, NOT two strongly independent cinematic setups |
| O09 | 160.00–160.81 | 0.81 | physical vehicle overhead moving through intersection | large centered model title |

**Editorial quality verdict:** Citroën clips are genuine camera video and enough to establish a *second filmed physical prototype model*, but all are **0.58–0.96s and contain strong baked promotional text**. **DO NOT present all eight as eight strong independently cinematic shots or as clean 2–5-second native B-roll**. These are *provisional micro-cut supports* only; priority is Renault R5 for unbranded hero footage. Technically two models met, **creative hard gate remains PARTIAL**, and these are native landscape HD only, not native 1080×1920 portrait.

### Additional Filante Record attempts (not in delivered editor pack)
1. True original Renault Swiss press documentary https://media.renault.ch/video-cdn/165350-renault-filante-record-2025.mp4 **was actually downloaded**, 114,978,612 bytes, **1920×1080/25fps/239.25s**, full decoder QA PASS, SHA256 `23135dde05c797522c86af3ab646b67a1aa2805775e94cfcbfd9e14c2bb52698`. [Evidence artifact 11746175394](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38245747296/artifacts/11746175394). Independent review of 60 original frames across the full 239 s: mostly interviews, vintage archive, engineering assembly, CGI/design screens, and *actual bare-chassis test driving* near opening and ~170s. Not a clean cinematic film of **finished streamlined Filante vehicle driving**; keep as internal source lead/technical context, **not editor's accepted Filante hero footage**.
2. Renault Cyprus hosted promo https://renault.com.cy/wp-content/uploads/2026/01/renault-filante-record-z41-concept-020.mp4 actually downloaded at **1280×720/25fps/15.06s**; native HD rule **REJECT**, no upscale. QA [artifact 11745986722](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38246498561/artifacts/11745986722).
3. Two Alpine Alpenglow Hy6 publicly exposed Dailymotion sources only **512×288**; **REJECT**. QA [artifact 11743518642](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38243770532/artifacts/11743518642).
4. DS E-TENSE Performance promoted original (1920×1080) was visually CGI-heavy; **REJECT**; details in [Agent C progress](./AGENT_C_PROGRESS_2026-10-12_CONTINUED.md).

## Recommended director status
**Delivered technically complete, two real physical model sources and 19 individually playable shot handles.** Honest grade: **PARTIAL for premium cinematic editorial requirements** due to very short branded Citroën source and unresolved publication rights. Preserve both prior R5-only clean editor pick package and new two-model ZIP. This branch does **not** authorize public posting, changing another agent branch, combining the master archive, or touching approved CYBER//FUTURE V1.
