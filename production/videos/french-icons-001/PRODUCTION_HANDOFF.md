# YUNEX — LÉGENDES FRANÇAISES 001: editor/audio/manager handoff
Date 2026-10-12. Branch: `automotive-edits/french-icons-001/production-contract`. Tracker: https://github.com/YunRah2103/Remotion-gpt-chat/issues/28

## Creative brief — important updated decision
This is a **beautiful, elegant and cinematic** French automotive history/identity film. **NOT** the aggressive GT3 Nürburgring style. Gentle clean motion, evocative Paris/night, scenic Alpine/rural roads, authentic cars, nostalgic but modern premium grading, minimal text. Avoid violent whip-pan, big speed ramps, UI/HUD, flashy impacts, random glitches, hard EDM effects. Every French lyric/phrase ending is an *opportunity* for an elegant new car or visual match cut; not an obligation to change car on every syllable. Instrumental sections should breathe.

The user provided the EXACT French-language song `sir..  [7623017441160891681].m4a`, 60.000 s, AAC stereo 44.1 kHz, SHA256 `2334fc7c70a4320faf1b137b97ec9e2899ed325e01cc1fb954733a21d802ec55`. It is in the originating chat, **not in GitHub**; director made `FR_LEGENDS_ORIGINAL_AUDIO_PACK.zip` with original M4A, manifest and no substitute music. Agent C and D must obtain that exact audio, verify SHA and map/retain timing. If missing, C may create a provisional shotmap but may NOT certify vocal-sync; D cannot claim finished output.

## Canonical source footage
**42 actual native-quality, SHA256-validated video clips** from two footage agents, A=20 original classics, B=22 modern French icons. One combined ZIP:
- Actions run: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38169392715
- Direct artifact page: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38169392715/artifacts/11713925779
- Artifact ID **11713925779**, artifact expiration **2026-10-25 19:46 UTC**
- Combined inner archive **671,925,099 bytes**, SHA256 **46073d50fb4efe246b3e7ee1adee1601eec025a3aa2a07df45f038731218c533**; GitHub outer artifact size 671,925,315 bytes.
- Contains `Agent_A_Classics/`, `Agent_B_Modern/`, individual `clips/`, `contact_sheets/`, manifests, A `originals/`, `README_START_HERE.md`, `combined_manifest.json`.
- Original packs A V7: 20 classic shots across Citroën 2CV, classic Alpine A110, Renault 5 Turbo 2, Citroën DS, Peugeot 205 GTI. B Final: 22 modern across modern Alpine A110 variants, Mégane RS Trophy-R, Alpine A290 Rallye, Bugatti Bolide, Bugatti Chiron Pur Sport. **10 car families is the sum of labelled groups, not proof all 42 are 42 unique cinematic shots**.
- Only visual-usable cuts should enter final film. Detailed actual classic visual QA: `production/videos/french-icons-001/agent-a/CINEMATIC_QUALITY_AUDIT_2026-10-11.md` from source A branch. Six classic items 02/03/04/13/18/19 flagged poor primary choices, especially original 205 portrait cropped from 1920x1080 horizontal source and upscaled; source landscapes inside archive can be recomposed. Four beautiful DS nighttime Paris sequences only ~0.7–0.8 s, usable as short accents not held heroes.
- Modern B QA says avoid prior mislabelled Bugatti mastheads, CGI cutaway, watermarked/telemetry filler; FINAL B curated pack is what's in combined ZIP. All genuine full-quality source resolutions: the SOURCE story must be checked from manifest. No film was produced at ZIP-delivery time.

## Aspect/delivery contract
- First construct a **full-bleed 1920x1080 30fps H.264 high-quality 16:9 cinematic master**, which preserves majority of native landscape source composition and car completeness. Aim actual 60.000s = 1800 frames at 30fps, if audio exact 60.000s. AAC stereo 48k, keep exact source song timeline.
- Also **evaluate a full-screen 1080x1920 30fps vertical short-form master** because YUNEX distributes to TikTok/Reels/Shorts. Deliver it *if verified car framing and source pixel fidelity permit*. No blackletterbox, stretched cars, fake native 1080p claim or chopped bodywork; use separate shot reframing per cut, potentially alternative cuts. A 1920x1080 landscape original gives only ~608x1080 native pixels for 9:16 crop: report upscaling visibly and don't certify as original native full-HD vertical. Prioritise cinematic visual integrity over brute-force crop.
- No endless rendering if source is inadequate. D reports honest 16:9 result and portrait limitations; do not substitute fake 4K via upscale.

## Agents to start NOW (the two earlier footage agents are DONE)
- **C — Cinematic Editor**, branch `automotive-edits/french-icons-001/c-cinematic-edit`, detailed `AGENT-C-CINEMATIC-EDITOR.md`.
- **D — Sound, Integration & Render**, branch `automotive-edits/french-icons-001/d-audio-render`, detailed `AGENT-D-AUDIO-RENDER.md`.
- **E — Master Manager and Independent QA**, branch `automotive-edits/french-icons-001/e-manager`, detailed `AGENT-E-MANAGER.md`.

These roles do NOT change Agents A or B; do not modify `YunRah2103/yunus-video-lab` or existing GT3 productions. A/B contributed 42 source media files but creative acceptance is not 42 automatic passes; rights/permissions for some source films remain unconfirmed. Media package itself must be downloaded/opened by downstream agents. Green GitHub Actions alone does not sign off visual artistry, soundtrack sync or publication rights.

## Collaboration & evidence
- C is visual owner. Produce actual Remotion project, shotmap with original clip IDs and lyric phrase intervals, preview native frame/MP4 proof. Work on own branch only and hand exact SHA to D.
- D is audio/render owner. Work with exact M4A, tone of French soundtrack; subtle credible original engine/road ambiance only when fitting, no aggressive noisy overlay; bring C's approved edit and A+B media in proper render workspace; produce real rendered high-quality playable MP4 + audio technical QA. Commit on own branch and upload downloadable artifact.
- E is independent audit, issue status, actual combined-ZIP visual check, source QA and final playback approval. No worker code edits; factual progress only, not hypothetical auto-launched chats. Monitor source expiry.
- All agents report evidence to issue #28. Do not claim source packages are in Git source branches: large videos are in Actions artifact. No agent can assume the audio is attached to their independent chat until user provides audio pack.
