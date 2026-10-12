# YUNEX LÉGENDES FRANÇAISES 001 — Agent C picture handoff

**Date:** 2026-10-12  
**Owner:** Agent C, senior cinematic picture editor.  
**Repo:** `YunRah2103/Remotion-gpt-chat`  
**Editor branch:** `automotive-edits/french-icons-001/c-cinematic-edit`  
**Tracking issue:** [#28](https://github.com/YunRah2103/Remotion-gpt-chat/issues/28)  
**PICTURE:** editor-approved **for Agent D integration** after independent 60s decoded video review, not final publication clearance.

## Correct latest picture

- **Latest Agent C picture source commit:** `21fead83f90e6d368f72f1fd5f8dbbc3af7657ac`.
- **Verified actual render:** [GitHub Actions run 38188901152](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38188901152).
- **Actual artifact ID:** `11720519374`; [download page](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38188901152/artifacts/11720519374).
- Inside the artifact: `out/fr-legends-fast/FRENCH_LEGENDS_C_MUTED_FAST_1080P.mp4`, `FAST_FILM_QA.json`, `ffprobe.json`, `decoded_60sec_contact.jpg`, `source_validation.json`, and exact committed `shotmap.json`.
- **Picture SHA256:** `5cff7e636b45bd7081636883fea4b28052f3ac668f0e6b988461c5ca4cde83dd`.
- **File bytes:** `85,337,304`.
- **Video:** genuine selected camera clips, H.264 / yuv420p, **1920×1080**, **30 fps**, **exactly 1,800 frames / 60.000 seconds**, **NO AUDIO**.
- Combined verified source media: 42 native-resolution files, artifact `11713925779`, inner archive SHA256 `46073d50fb4efe246b3e7ee1adee1601eec025a3aa2a07df45f038731218c533`. The film actually uses **23 curated scenes**, not all 42.
- The video was independently **full-FFmpeg-decoded**, frame and geometry-probed, checked at 20 three-second contact frames, and inspected frame-by-frame at 2 fps for Peugeot, Alpine, and closing Bugatti sequences. No interview insert remains at Peugeot. No visible Peugeot footer credit in examined V5 frame strip. Clean full-car dusk Alpine and Chiron golden-road ending confirmed in proof. This is an editorial judgement based on sampled frames, not frame-by-frame human viewing of all 1,800 frames.

## Creative decisions and timing

Elegant French automotive history — 2CV / DS Paris night / original Alpine mountain rally / Renault 5 Turbo 2 / Peugeot 205 GTI / modern Alpine / Mégane / Alpine A290 / Bugatti Chiron and Bolide / elegant sunlit Chiron ending. No GT3-style aggressive transitions, glitch/HUD overlays, counterfeit footage, or artificial music replacement.

Measured music-dynamics anchors from the **real original user song**:
- `533 / 17.767s`: R5 Turbo to 205 GTI
- `699 / 23.300s`: historic Peugeot to modern Alpine
- `1262 / 42.067s`: modern Alpine to Chiron
- `1567 / 52.233s`: Chiron to restrained Bolide cameo

These anchors reflect waveform troughs, **not human-transcribed French phrase boundaries**. No unsupported claims of word-perfect lip/lyric synchronisation.

### Important V1–V4 rejection and V5 corrections

- Reject first original Remotion render **38186524230** as a master: based on earlier shotmap, not latest soundtrack dynamics.
- Reject fast V2 **38187607666**: C21 extended rear-wing macro and partial Peugeot watermark.
- Reject V3 **38187849505**: source-internal Peugeot interview and remaining footer.
- Reject V4 **38188400614**: rear original Peugeot source still starts on an in-car interview.
- **Accept V5** **38188901152**: 205 front limited to 56 frames before presenter; rear segment starts **2.0s into its original 9s source**, continuous actual driving for 116 frames; 1.16× top-focused landscape crop suppresses footer credit without image stretching; blue Alpine C22 clean whole-car segment; calm Hajar Chiron golden-hour finale. Across all versions no source audio is used in C's muted picture.

## Exact soundtrack — for Agent D only

User-original `sir..  [7623017441160891681].m4a` is separately attached to the initiating / Agent D ChatGPT file contexts and **must not be uploaded to this public Git repository**.

- Source audio SHA256 **`2334fc7c70a4320faf1b137b97ec9e2899ed325e01cc1fb954733a21d802ec55`**.
- Original 60.000 seconds, AAC stereo 44,100 Hz.
- Agent C also privately muxed V5 with exactly this soundtrack (48 kHz AAC, safety gain -1 dB, no speed/pitch modification, no added SFX), creating a **private musical review copy**, not the Agent D publish-ready master.
- Compared song original to private musical review at 2s, 30s, 55s: zero-lag correlations **0.99878 / 0.99993 / 0.99987**, best audio offset **0 ms at all three locations**. Private musical review checksum SHA256 **`817151b06d01ad8e92bc71c24d127b7adb98a500322c82772eed27f0600d8ed2`**, 1920×1080, H.264 + AAC 48 kHz, 60.000 seconds, 1800 video frames; fully decoded. Do NOT label this preview the production film and do NOT put it on a public repo.
- Audio / engine ambience / final 48 kHz AAC mastering / final publishable video QA **belong to Agent D**. Agent D already independently recovered the exact user soundtrack by matching SHA in issue #28.

## Reproducibility

Remotion editable composition ID: `FrenchLegendsLandscape` in `src/FrenchLegendsFilm.tsx` and `src/Root.tsx`. Master 1920×1080 at 30fps for 1800 frames. The fast picture artifact is an **FFmpeg edit conforming to the same shotmap**, not a frame-identical Remotion graphics render: original Remotion-only typography is not present in the FFmpeg picture artifact. If titles are required, D or C should render/merge explicitly and re-QA; do not assume they are present.

Picture source: `production/videos/french-icons-001/agent-c/shotmap.json`. Real-media FFmpeg pipeline: `agent-c/render_fast_picture.py`, native run workflow: `.github/workflows/fr-legends-c-fast-picture.yml`.

## Open quality and rights restrictions

- **NOT** a final user release: some third-party and manufacturer footage redistribution permissions are **not confirmed**. Confirm usage rights before social publication. This is editorial approval only.
- Source media 16:9 landscape for most clips, so do not falsely call portrait/native 9:16 approved. Vertical aspect requires distinct shot-by-shot recompose and QA.
- Although V5 is no longer interrupted by the original 205 interview or watermarked in sampled review frames, further independent visual art review by E remains important.
- D can download the exact validated muted picture via artifact `11720519374`, validate SHA, integrate the exact song, and post final evidence / output under issue #28.

**Handoff status:** **AGENT C PICTURE V5 LOCKED FOR D REVIEW AND INTEGRATION**, *not overall final production approval*.
