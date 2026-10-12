# Agent B — Turbo→IndyCar real footage acquisition and decoded visual QA

**Date:** 2026-10-12  
**Status:** **PARTIAL REAL MEDIA DELIVERED. Seamless transition NOT visually approved. License review pending.**  
**Issue:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/37  
**Source commit:** `6d243a13c34e75b7e0d2f0eb3b69501eed56e04c`  
**Successful Actions run:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38272031857  
**Artifact:** https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38272031857/artifacts/11757143285  
**Artifact ID:** `11757143285`, `yunex-turbo-indy-agent-b-verified-video-38272031857`. Total 9,831,213 bytes. Outer artifact SHA-256 `d5561257b6eb6c3bfb5283d0c0cc58f55a18f2f878eedc78d74a6eb093f65a41`.

## Actual downloaded playable media and checks

The Action downloaded original **genuine camera-filmed 2025 Indianapolis 500 spectator footage**, used FFprobe on the original streams, decoded frames and re-encoded three 2.5-second H.264 moving extracts. Downloads used Wikimedia Commons publicly available uploads. This is **not** AI, CG, a simulation, or a slideshow. The delivered three cuts are from **two original sources**, and show the same elevated-spectator perspective: **not three different match angles**.

Files inside `out/YUNEX_TURBO_INDY_AGENT_B_MATCHES.zip`:
- `clips/indy25_start.mp4` — `Indy5002025start.webm`, original approx t=3.5–6.0 s, **1920×1080 H.264 2.50 s**. SHA256 in `SHA256SUMS.txt`. Visual QA: distant curved circuit with large foreground crowd and fencing; track open in inspected frames, no convincing car subject at cut. **REJECT as transition.**
- `clips/indy25_start_middle.mp4` — same original source, t=10.5–13.0 s, **1920×1080 H.264 2.50 s**. QA: cars briefly enter lower-right of distant oval, but crowd, phones and catch-fence dominate, subject too small/obstructed. **Marginal perspective reference only; not a seamless match.**
- `clips/indy25_parade.mp4` — `2025Indy500parade.webm`, t=1.0–3.5 s, **1920×1080 H.264 2.50 s**. QA: real parade from spectator camera; no high-speed IndyCar match, occasional white vehicle. **REJECT for transition.**

Every MP4 was independently extracted from downloaded artifact and locally FFprobed: **1920×1080**, **H.264**, **2.50 s**, three per-file SHA-256 checks matched `manifest.json`. Both outer and inner archives were readable, the inner ZIP integrity test passed. GitHub Actions ZIP contains a nested ZIP `out/YUNEX_TURBO_INDY_AGENT_B_MATCHES.zip`; the editor must unpack the inner ZIP to access media. All manifests and frame contact sheets are inside.

**Single-level inner ZIP SHA256:** `055de2cf73a7eb9ad466d3b9911c3c81e11f3143babb323d82b89b33c29ba6af`; size 9,591,847 bytes.  
**Two originals:** `https://commons.wikimedia.org/wiki/File:Indy5002025start.webm` and `https://commons.wikimedia.org/wiki/File:2025Indy500parade.webm`.

## Licensing — not cleared for publication
Both sources are claimed by their uploader `Waluigithewalrus` to be their own public-domain works, **but Wikimedia identifies them as "License review needed (video)"**, so provenance and uploader rights are not independently confirmed. Furthermore, **INDYCAR's 2026 photography/video policy requires event-footage permission and restricts social-media reuse**, including third-party content. These files are **reference / evaluation only** until permissions are confirmed; no assumption that uploader license assertion alone authorizes YUNEX publication.

## Tried and ruled out
- Wikimedia direct 2024/2022 URLs on earlier workflow: HTTP 429 across three sources.
- DVIDS public HD download buttons: direct MP4 returned HTTP 403 for all variants.
- Pexels/Pixabay official REST APIs: repository lacks `PEXELS_API_KEY` and `PIXABAY_API_KEY` GitHub Actions secrets. Thus no API search/download performed.
- Adapted the technically successful Agent D `requests` + Wikimedia metadata/original API path; this **did successfully acquire two new 2025 sources**.
- Excluded `2024 Indianapolis 500 - Sarah Stierch 01.webm` from final package because Agent D had already delivered it; do not double count.

## Transition matching / next gate
Agent A's Turbo `Race to the Finish` source near t103–125 s shows fictional IndyCars and possible spin / incident scenes, but Agent B's live-camera 2025 race-start footage has elevated spectator perspective, cars far too small, and obstructions. **No physical A/B match has been proven; zero visually approved transition shots.** To satisfy the assigned 4–8 distinctive low banked/sidetrack driving clips from at least two angles requires genuine track-level originals (and legal permission) from the rightsholder or accredited creators. Do not green-light an edit based on this partial source ZIP.
