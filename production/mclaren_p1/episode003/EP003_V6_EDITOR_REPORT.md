# YUNEX EP003 — V6 Orange Night McLaren P1 — private-review handoff

**Date:** 2026-10-16. **Status:** Actual V6 MP4 rendered, full audio/video decode QA PASS. User's creative approval and third-party reuse rights remain pending.

## Exact deliverable
- `YUNEX_EP003_V6_McLaren_P1_ACTIVE_AIRBRAKE_PRIVATE_REVIEW.mp4`
- SHA256: `601cd3b8cd689b3a6988ddbe8dd4583cac348d0261abee12f252f42f3531465f`
- 19.100 seconds, **573 frames**, 1080 × 1920 true 9:16 encoded frame, 30 fps, H.264, AAC stereo 48 kHz. Source footage itself remains native landscape (portrait reframed/upscaled), not originally photographed at portrait 1080p.
- Full `ffmpeg -xerror -i V6.mp4 -f null -` returns success; inspected full film contact sheet and individually inspected denser final-three-seconds proof. No empty road outro.
- Existing owner-approved V5 AAC preserved **bit-for-bit at the compressed stream level**. Both V5 and V6 audio streamhash = `d6cf5c14568074df930c36635f332292bce120889a118cc94cdd3b6bcf11626c`; 897 AAC frames, 19.100 s. Cedar narration, jazz music and engine FX left unchanged.
- Owner-private MP4 delivered through ChatGPT session. **No original source MP4/audio or derivative film is being published through the public repository.**

## V5-to-V6 surgical changes
1. **0–1.73 s opening:** Recomputed dynamic horizontal extraction from approved Remnant #124 orange P1 low-front footage. Gently widens crop as car approaches, preserving motion, headlights, blue reflections and restrained V5 title.
2. **5.47–8.47 s mechanism:** Retained the animated 3D wing-pitch depiction but **eliminated the disconnected black-background cutaway**. Reframed metallic wing model into negative space above genuine orange P1 moving night footage, faded cutaway in/out, retained natural real-world lighting, subtly animated airflow. Separate small readouts for **increased drag** and **increased rear downforce at speed**. Explicit `ILLUSTRATIVE / NOT LIVE BRAKING` text; no claim of actual recorded track braking or verified McLaren CAD/CFD.
3. **~11.5–13.47 and 14.8–16.9 s:** Minor source-continuous dynamic reframing for pacing and second-half variety. The established blue-orange driving shots, editorial order and source timestamps remain approved V5 material. No silver/daytime mismatch or fake repetitions to extend runtime.
4. **16.9–19.1 s ending:** Reframed the existing approved Remnant red-blue moving rear/side shot from the original 1080p film excerpt rather than zooming into the already narrow portrait. Restored wider car silhouette and strong practical red road reflection, no logo, empty road or extended fade. Same exact shot sequence and timing.

## Production / provenance
- V5 exact baseline master `195550.mp4` has SHA256 `7fc67e56406e6e058a62085b0b6f484ca967a15269ffd4fb45790f26491b9322`.
- Recovered owner's V5 editing/QA archive and both verified Remnant #124 owner-only original-frame footage packages via ChatGPT Library.
- V5 and V6 are grounded in the real **OpenCV/VTK/FFmpeg** V5 conform, not claimed to be native Remotion projects. V6 picture assembled with OpenCV and FFmpeg H.264, final film at 1080 × 1920 with original V5 AAC stream-copied. Existing V5 assets untouched.
- V6 source code and frame review contacts held in private ChatGPT-session work product rather than publishing third-party footage to GitHub.

## Honest limitations
- Source filmmaker Remnant Media reuse/commercial publication rights **not independently verified**. PRIVATE OWNER REVIEW ONLY until rights cleared.
- Airbrake's physical animation is **conceptual**, not documented real on-track P1 wing movement. Existing actual orange wing detail is stationary, already raised.
- The constrained 1080p landscape crop and a source-contained limited selection still cap achievable portrait detail and genuine shot diversity. **Creative rating is not asserted** by technical QA; owner should review V6 versus V5 before posting.
