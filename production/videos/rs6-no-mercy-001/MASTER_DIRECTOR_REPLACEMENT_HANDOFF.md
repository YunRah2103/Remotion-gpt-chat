# GPT-6 — YUNEX RS6 // NO MERCY 001
## Complete Replacement Master Director Handoff
**Date:** 13 October 2026  
**Role:** sole Master Automotive Cinematic Director, footage curator, creative editor, music-sync director, technical producer, renderer, independent visual QC.  
**Repo:** `YunRah2103/Remotion-gpt-chat`  
**Tracking:** https://github.com/YunRah2103/Remotion-gpt-chat/issues/44  
**Your own branch:** `automotive-edits/rs6-no-mercy-001/master-director-rescue` — branched from existing D editor to retain working edit scripts and workflow.  
**Never modify:** `YunRah2103/yunus-video-lab`. Keep all old agent branches intact.

## 1. WHY YOU ARE REPLACING THE MASTER DIRECTOR
The user makes premium short-form automotive edits for TikTok, Reels and Shorts under YUNEX. The user judges results by **whether they would watch or swipe**, not whether CI passed.

This production had 3 footage workers (A2/B2/C2), an editor (D), an audio engineer (E), and a manager (F). **Real footage was collected and a 13.167-second synced MP4 was actually rendered**, but the final creative approach felt **disconnected**, like clips from unrelated car films cut together. User has concluded splitting creative sourcing across multiple independent agents was a mistake.

The central correction: **one director now owns the entire film**. You do not need to feature all 30 gathered clips, keep the 15-shot sequence, reuse previous grading, maintain the reference timing rigidly or delegate to more agents. You have authority to radically re-cut or replace almost every shot after actually screening them. Preserve working acquisition/render/audio code where useful, not the failed editorial assumptions.

Do not stop at diagnosis or tell the user to create another chain of agents. **Produce a substantially better private, fully playable and inspected MP4 in this production turn if tools permit.** When blocked, try genuinely different methods using your tool access and GitHub Actions; be accurate about the final state. Chat sessions do not work in background between responses; only a configured GitHub Action/phone worker can continue running autonomously.

## 2. CREATIVE NORTH STAR — WHAT THE USER ACTUALLY WANTS
**Subject:** ONLY real C8-generation **Audi RS 6 Avant** (C8 standard or C8 performance). White/red **RS6 GT is visually a separate identity**; generally discard it unless a deliberately readable multi-car narrative justifies it. Absolutely no C7, imaginary newer generation, unrelated S/RS car, fake CGI or AI generated car.

**Reference:** user's original non-car aggressive edit, `193955.mp4`. It runs **13.165s**, 1080×1920, 50fps, with cold blue atmospheric scenery → savage high-contrast B&W action → carefully timed inverse flashes / brief black gaps → a powerful hard-cut crescendo. Aggression comes from **scene motion, rhythm, scale, silence/negative space, timing and a consistent visual world**, NOT a pile of generic transitions or monochrome filters.

Creative objective: make the RS6 feel dangerous, powerful, tactile and instantly recognisable. Cinematic, stylish, confrontational, precise. Strong moving car before 1s, powerful motion at drops, extraordinary final hero shot. No title, logo, HUD, outro, filler/parking-lot catalog, endless empty black/white or mechanical shake spam. The car must remain a recognisable hero; macro details should punctuate, not dominate.

**Important user feedback from earlier edits:** static details and dead space feel boring; video built from many unique clips can still feel disconnected; long filters do not substitute for editing; avoid repeating shots; do not crop so close the whole car disappears; ensure movement, cinematic continuity and intentional frame composition.

## 3. THIS PRODUCTION'S PRIMARY CREATIVE FAILURE
Different source families were assembled without one identity:
- A2: grey C8 RS6 driving through **bright mountains**, plus **white/red C8 RS6 GT**.
- B2: red C8 RS6 at **night** from THE-LOWDOWN original filmmaker footage.
- C2: isolated component macros in various light.
- Old D's script alternates **grey day → red night → grey B&W → interior controls → white/red GT → red night → grey mountain → GT**. This changes car, paint, environment, light and cinematographic language too often.
- Old D uses **15 cuts** and reuses `A2_GT_LOW_FRONT_SPEED_PASS.mp4` twice with partially overlapping source ranges; it also holds grille and RS MODE control through the **first major music drop**, withholding the moving-car payoff.
- E measured first major beat **frame 158 / 5.259s**, while previous D does not reveal main moving GT until **frame 179** (~0.7s late). The second major beat **frame 276 / 9.189s** is better matched.
- Smooth technical transitions cannot repair incompatible scenes and unmotivated location/time-of-day changes.

**Fix:** commit to a PRIMARY visual identity **before** your shot sequence. Proposed strongest identity to test first: **dark/red C8 RS6 from THE-LOWDOWN**, cold monochrome/night steel grading, red tail/LED accent, aggressive moving full-car footage. But DO NOT mandate this if reviewing actual footage reveals it cannot support the runtime or vertical crop; the native 4K **grey C8** mountain driving may be a more coherent main family. Pick one source-world whose motion, lens, light, car colour and screen direction belong together. Use contrasting clips only as deliberate, motivated, visually matched punches. No requirement to use GT at all.

Make a film with progression, not a 13-second inventory. Moving hero footage should be the majority. Use no more than a few sharp 0.2–0.5s detail accents and no stretches of static macros. Grade to unify footage but do not crush car into darkness, pretend 720p is 4K, or invert for seconds at a time. Negative flashes/black gaps should be rhythmic, extremely intentional, usually 1–3 frames.

## 4. WHAT ALREADY EXISTS — DO NOT START FROM ZERO
Tracking issue: https://github.com/YunRah2103/Remotion-gpt-chat/issues/44
Existing creative contract: `production/videos/rs6-no-mercy-001/PRODUCTION_CONTRACT.md`, `STYLE_ANALYSIS.md` on `automotive-edits/rs6-no-mercy-001/production-contract`.

**A2 source — SIX verified playable 1080×1920 moving clips, from genuine 4K Audi originals:**
Owner-only unpublished draft: https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/untagged-a0e99c9da0ad8926b311
- `A2_C8_RS6_FAST_APPROACH.mp4` — real grey C8, 1.40s, original source 205.91–207.30s.
- `A2_C8_RS6_HAIRPIN_REVEAL.mp4` — real grey C8, 1.33s, source 39.40–40.73s.
- `A2_C8_RS6_MOUNTAIN_SWEEP.mp4` — real grey C8, 1.07s, source 96.34–97.38s.
- Three additional white/red C8 RS6 GT driving/track shots; different car/identity; don't use casually.
- A2 also created a **4.57s red THE-LOWDOWN original filmmaker night-motion proof** and clips in this draft; can inspire stronger continuous dark edit.
- Source and manifest: `agent-a2/A2_FINAL_SIX_PLAYABLE_MEDIA_HANDOFF.md` on A2 branch.

**B2 source — NINE original filmmaker clips, plus actual 6.17s moving-car proof:**
Owner-only draft: https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/untagged-bb9ec6e780482036394f
- Authentic **THE-LOWDOWN** red C8 RS6, filmmaker source https://www.the-lowdown.com/audi-rs6/ ; original is 34.325s, 1920×1080 landscape, 29.97fps. Key windows ~14.02–14.87s moving LED; ~21.92–24.02s rolling; ~29.10–30.70s night/front/haze.
- Native source is **landscape 1080p**, not original 1080-wide portrait: hard vertical crops may be softer/lose car. Some night side shots were severely underexposed; inspect, don't simply amplify noise.
- Actual 6.1667s `YUNEX_RS6_B2_SIX_SECOND_ACTION_PROOF.mp4`, run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38380604767 , QA artifact 11803570083; useful **technical** proof, not approved film.
- B2 editorial report: `B2_SIX_SECOND_VISUAL_QA_HANDOFF.md` on B2 branch.

**C2 source — FIFTEEN genuine C8 detail clips:**
Owner-only draft: https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/untagged-3c7ddbde3865a6f7f945
- Best candidates: `UHD_MATRIX_LED_FRONT_CORNER.mp4`, `RS6_C8_NATIVE4K_AUDI_GRILLE.mp4`, `UHD_RS6_RED_BRAKE_CALIPER.mp4`, `UHD_RS6_OVAL_EXHAUST_REAR.mp4`, `UHD_RS6_REAR_LED_SIGNATURE.mp4`, `UHD_RS6_STEERING_MODE_CONTROL.mp4`.
- Most are **stationary/short**, so don't fill timeline with them merely because they are high-resolution.
- Manifest: `agent-c2/C2_FINAL_RELEASE_HANDOFF.md` on C2 branch.

These draft Releases are **owner-private/unpublished**. Use authenticated `gh release download` or supported connected GitHub methods where available. Unauthenticated HTTP may 404. Do not leak GitHub credentials. Verify actual MP4 file, frames and native metadata before using it.

## 5. EXISTING FULL EDIT AND AUDIO — REAL, BUT NOT CREATIVELY APPROVED
**Picture cut**: D branch `automotive-edits/rs6-no-mercy-001/d-cinematic-editor`, source `production/videos/rs6-no-mercy-001/d_full_private_picture.py`, workflow `.github/workflows/rs6-d-private-full-film.yml`. Real picture run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38383804317 , artifact **11804532993**; 395 frames, 1080×1920/30, silent H264, full decode PASS.

**Audio**: E branch `automotive-edits/rs6-no-mercy-001/e-audio-engineer`, measured beat map `production/videos/rs6-no-mercy-001/agent-e/beat_map.json`, soundtrack composer/workflows. E measured original reference track **~122.0526 BPM**; major attacks:
- frame **85** / 2.839s
- **120** / 3.988s
- **158** / 5.259s — FIRST FULL-CAR DROP; do not waste on a grille or steering button
- **180** / 5.997s
- **202** / 6.734s
- **231** / 7.715s
- **246** / 8.208s
- **276** / 9.189s — SECOND FULL-CAR PEAK
- **298** / 9.927s
- **320** / 10.664s
- **342** / 11.401s
- closing accents **350, 364, 372, 379, 386, 394**.
E made a **new independently composed** track inspired by measured rhythm, **NOT THE ACTUAL REFERENCE SONG**. The original unmodified reference audio `YUNEX_RS6_Reference_Audio.m4a` was extracted in originating user chat, 13.165011s, SHA256 `5ea5b0250728557eca23ea4123665ba01e5bc4ab3eba4689e7bfefc7b0e6e55b`; do NOT claim it is checked into GitHub. For a private visual reference cut you may work with user-supplied actual audio; public music release needs rights clearance or independently cleared substitute. If replacement score weakens energy, recompose creatively rather than dogmatically keep E's track.

**Real full D+E private MP4 already exists:**
https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/untagged-987f1a4443c8ce1611df
Filename `YUNEX_RS6_NO_MERCY_001_D_E_PRIVATE_REVIEW.mp4`, **13.166667s**, 395 frames, 1080×1920/30, H264 + AAC 48kHz stereo; **SHA256 `e8511a0f6f139253276e401a27653742b91739b2eb13b11742e11cba46efb9a4`**. Run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38384253333 , actual Actions artifact **11804024122**. Full decode PASS, but **no independent user creative approval and no public-use footage permission**. Treat as baseline to diagnose, **NOT** an approved edit, template or shot list. A new director must watch the whole actual film and decide what to keep.

## 6. YOUR SOLO RESCUE WORKFLOW
1. Read the source records above and the actual D/E build. Download/inspect the **real private current MP4** and footage clips; use frames/video inspection, not metadata-only opinions. Look at pacing, weak cuts, color jumps, repeated angles, black-frame duration and framing. Don't rely on a 25-frame contact sheet to certify the entire film.
2. Identify no more than **one or two compatible source families** and settle the hero car, colour palette, primary lighting, camera language and motion direction. Choose the full visual concept first. If footage cannot sustain 13s coherently, reduce runtime or selectively obtain better **authorised** material from the chosen visual family. No quota to use all three agents.
3. Write a lean **shot-to-shot timeline** in frames explaining why each transition works: direction, camera height, subject scale, color, edit beat. Use the existing 395-frame / 30fps map if soundtrack ~13.165s. For every major music attack, show a visibly moving/recognisable C8 RS6. Especially correct frame 158.
4. Build with working D/FFmpeg/Remotion/GitHub Actions code, but **replace the old SHOTS sequence** rather than add effects on top of incoherent source ordering. Make contrast a story: deliberate cold blue build → sharply timed grayscale violent movement → motion-heavy crescendo with controlled positive/negative flashes. Avoid unexplained day/night/GT switches.
5. Evaluate soundtrack **as a creative component**, not just a passed waveform test. Music should feel similar in kinetic structure to user's actual reference, but don't mislabel E's replacement as exact original. Blend authentic C8 V8 accents only when licensed and synced to a true acceleration shot; music-only is better than cheesy SFX.
6. Make a first full-length **private review** render; do not require new mini-proof if you can actually produce the whole 13s. Render at **1080×1920, 30fps, H264 yuv420p + AAC 48k stereo**, close to 395 frames when preserving track.
7. **Personally review the whole rendered film**: full playback, inspect each transition and selected 9:16 frames, detect near-black unreadable car, looping/reused frames, accidental freezes, mismatched car colour/variant, noisy upscales, cuts not on intended hits, grade continuity, audio/video sync. Run FFprobe, complete FFmpeg decode, SHA256. Fix weak segments and render again within available execution context; do not declare success merely because CI is green.
8. Deliver an actual playable private MP4 through a GitHub Actions artifact or **unpublished owner-only draft** release. Post source commit/run/artifact, technical details and precise creative decisions to issue #44. Do not publish drafts or media with unresolved licenses. Provide user a direct playable download/review path if supported, not a promise of future work.
9. Keep user feedback as ultimate creative gate. Quality means a film that is coherent, exciting and visually exceptional; if the first rescue cut looks mediocre, improve rather than defend technical correctness.

## 7. TOOLS, YOUTUBE/S25 AND REAL LIMITS
Use GitHub connector, GitHub Actions independent network, authenticated GitHub releases, Python/FFmpeg/FFprobe, Remotion when materially helpful; use visual inspection. The old agents had local DNS failures but GitHub Actions and direct **THE-LOWDOWN/Audi original MP4s** succeeded. **Use existing footage first**; no need for another large agent swarm or endless YouTube research. If one missing shot is indispensable, find the specific related creator-source shot and try appropriate legitimate acquisition.

**S25 Worker V4 actual facts**: branch `experiments/s25-footage-worker-v4-10min-20261012`, 600s/1080p/512 MiB ceiling. A **REAL S25 1080p YouTube acquisition PASS** was proven in issue https://github.com/YunRah2103/Remotion-gpt-chat/issues/55 with public phone MP4 release https://github.com/YunRah2103/Remotion-gpt-chat/releases/tag/yunex-phone-v4-55 — but the video was a CC-BY **non-RS6 snow-forest car**, not RS6. No real RS6-specific S25 proof. V4 rejects videos absent from its owner-reviewed source registry. The current RS6 YouTube candidates #46/#49/#51/#54 lacked required permission and were not approved; do not bypass the registry, invent rights or queue invalid URLs. Agents can submit **source-review proposals** with exact URL/timestamps/evidence; only an approved source may become a V4 job. The S25 worker was already running in prior tests; don't ask user to reinstall/restart without evidence of a current need. Phone requests create future work, not immediately available footage.

**Licensing distinction:** Audi AG official video and THE-LOWDOWN filmmaker materials in old draft releases have no confirmed social-recut rights. Accessible media and technically verified GitHub MP4 are not authorization to distribute publicly. Preserve owner-private working review, obtain creator/rights-holder permission if planning public release or replace with appropriately licensed sources. Likewise verify music rights separately.

## 8. THE DIRECTION FOR FUTURE YUNEX FILMS
One master director owns footage scouting, aesthetics, assembly, audio direction and final quality. Additional narrow specialist tasks only if genuinely necessary, and must follow the director's **single shot language / identity brief**. Never let three parallel scouts independently define visual worlds and then demand one editor include everything. **Fewer outstanding compatible moving shots beat 30 disconnected clips.** Film-first creative judgment, source authenticity and a real delivered MP4 are the priorities.

## 9. EXACT STARTING ACTION
Start by fetching **issue #44**, the full **existing D+E private MP4** from artifact **11804024122** or draft release above, the actual A2/B2/C2 MP4s, and the beat map. Screen them. Then personally decide whether to base the rescue on **dark red THE-LOWDOWN** or **coherent 4K grey C8 Audi** footage; discard the remaining car/lighting families if they disrupt identity. Build and render a replacement rather than writing another giant plan.

**Do not ask the user to restate the vision. Do not claim work will continue invisibly after chat ends. Deliver the strongest actual result you can during this response.**
