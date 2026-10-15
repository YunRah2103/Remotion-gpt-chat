# YUNEX CYBER//FUTURE 001 — Production stage, exactly TWO agents

Updated 2026-10-12. This is **not** the older French Legends, GT3 or HDR test. User directed exactly TWO remaining agents:
- E — Cinematic visual editor
- F — Original-audio sound designer, integration and final renderer

**No third manager agent**. Both own separate GitHub branches; do not modify earlier A/B/C/D footage branches or `YunRah2103/yunus-video-lab`.
Repository: `YunRah2103/Remotion-gpt-chat`; tracking issue: https://github.com/YunRah2103/Remotion-gpt-chat/issues/32

## Main artistic contract
21.08-second futuristic **real physical prototype** music edit. Atmospheric female vocal intro → impactful electronic section ~6.75s (confirm by listening/waveform, not hard-coded guess). Real unusual prototypes lit beautifully. Hero car large and recognizable; visually progressive, not cheap cyber HUD spam, random RGB glitches, 0.2s repetitive cuts or still-image slideshows. Smooth high-end cinematic motion, sharp quality, luminous cyan/violet reflections where actually present, selectively stronger cuts on the musical drop. No manufactured CGI driving or model mislabels.

Source soundtrack is **EXACTLY** the user-supplied original MP3 named `This lift view is insane 🥹 #fyp #hongkong #china #cyberpunk #guangzhou  [7695032862382345479].mp3`; 44.1kHz stereo, ~21.080816 s; SHA256 `d853d5209240bd9b84ebffc11aff9e68812df7a17eeb4aa266b8e028cd89784c`. The zip `YUNEX_CYBER_FUTURE_AUDIO_PACK.zip` is a *conversation attachment*, **not in GitHub**. User attaches to Editor E and Audio F, or provides it via an approved artifact. NO stock song, NO fabricated/incorrect soundtrack. Original music dominates; F may tastefully add sparse authentic car ambience/electric whine ONLY if real source supports it; no generic ICE engine roar on EV prototypes.

## Current A/B/C/D footage inventory, evidence and caveats (not a combined master)
A: [Hyundai expanded real source ZIP, Actions run 38189199803 artifact 11720534410](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38189199803/artifacts/11720534410), 16 handles across RN22e, N Vision 74, RN24. Real source filmed driving, manufacturer. **STRICT HD ACTIVE PICTURE BLOCKED**: original two 1920x1080 files contain baked bars, 1920x796 and 1920x820 active image. Only use with truthful non-native portrait grading; do not claim full-bleed native 1080p. Best A01/A03/A04/A07, RN24 S02/S04/S05/S06/S07; avoid repeated near angles. Source ZIP byte/hash details on issue #32.
B: Branch `automotive-edits/cyber-future-prototypes-001/b-europe-footage`, file `agent-b/review/CURATED_QA_SUMMARY.json` declares **10 curated BMW candidate clips** over BMW Vision M NEXT driving and i Vision Dee filmed plaza/studio, technically 1920x1080; gate PARTIAL, some studio scenes not driving and manufacturer digital effects possible. **No final shareable B artifact independently verified in issue #32 when this handoff was prepared.** E must discover actual newest workflow artifact/run and download/inspect it or mark B unavailable. Do not invent an artifact or assume 10 clips are fully approved.
C: [French two-model real footage ZIP Actions run 38246365150 artifact 11746231515](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38246365150/artifacts/11746231515), 19 handles, 11 genuine moving real photographed 2025 Renault R5 Turbo 3E Corsica (best C05/C07/C08/C15/C16), 8 real filmed Citroën Oli promo microshots, but the Oli ones have prominent baked text and are 0.58–0.96s (not premium heroes). C technical PASS, editorial quality PARTIAL. No fictional 2022 showroom CGI substitutions.
D: [Radical concept real footage ZIP Actions run 38192722509 artifact 11722461153](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38192722509/artifacts/11722461153), 10 real filmed shots: 6 Lotus Theory 1 manufacturer 4096x2160 and 4 Porsche Mission X 1920x1080, real physical **STATIONARY** concepts filmed by moving camera, **not car driving**. Hero design/macro details useful for intro/mid/ending. D technical PASS, actual vehicle-motion PARTIAL.
All links are tracked in #32. Sources are genuine media packages/handles reported verified by original workers, not yet cross-source unified or editorial-release cleared. Check GitHub Actions expiry. Do not turn downloaded-without-permission into a claim of cleared social publishing rights; record provenance briefly.

## Initial collaboration and dependency
E is also responsible for **collecting/reconciling available media archives into a local edit library**, because no master merged ZIP has been reported yet. Start editing with genuinely approved shots where possible while inspecting the four packages. Record global clip IDs/source origins, real vehicle motion vs static, cropped active image, and duplicate angles. Don't stall forever waiting for 100% footage perfection if enough real high quality shots can tell the 21s story. **DO NOT silently substitute bad footage to meet shot count.**
E develops Remotion visual timeline, scene map, native previews and editorial proof. F can begin authentic music/source-sound audit and rendering harness **in parallel**, but final mux/render requires E's exact visual SHA/real source assets.
E should share direct files/run artifact and render instructions, not a vague "ready".
F must provide a **real playable MP4**, actual downloaded/decoded frame and sound QA, master SHA, stream probe, and artistically valid audio sync. F owns final output. Without these, state BLOCKED/PARTIAL, not FINAL.
No manager agent for this round. E and F perform their own checks and cross-review before delivery.

## Export
Primary test: full-screen vertical 1080x1920, 30fps, around 21.07s (632 frames) to exact music; trim ~0.014s end if necessary. A separate cinematic full-frame 1920x1080 version is worthwhile given landscape original footage and weak 9:16 native pixel coverage. **Be honest that downsample/upsample from landscape originals may not be native full-resolution vertical**. Do not crop the car off-screen or add empty top/bottom black bars. If some shots cannot be cropped without losing car, replace in vertical version, or use aesthetically matched dark blurred moving extension behind a clean contained original **if explicitly appropriate**, not generic dead black bars.
H.264/yuv420p, high-quality encoding CRF16–18, AAC stereo 48k. Match original edit audio precisely, avoid accidental double playback or missing vocals.
Optional HDR10 only if real HDR footage truly exists; **never flag SDR sources as captured HDR or promise recovered original HDR highlights**.

## Definition of done
Downloaded source assets verified, real visual native frames inspected, edit pacing and car identity checked, exact original user soundtrack audible, no unintended black frames, final H.264/AAC full MP4 delivered with Actions artifact + SHA and manual visual/audio QA. GitHub source commits and workflows by themselves do NOT mean movie is complete.
