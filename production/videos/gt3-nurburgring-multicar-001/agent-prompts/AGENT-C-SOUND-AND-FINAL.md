# GPT-6 — AGENT C: MULTI-CAR GT3 Sound Engineer + Final Render

Repo: `YunRah2103/Remotion-gpt-chat`
Own branch: `automotive-edits/gt3-nurburgring-multicar-001/c-audio-final`
Contract branch: `automotive-edits/gt3-nurburgring-multicar-001/contract`
Read `PRODUCTION_CONTRACT.md` and teammates' actual verified handoffs. This is NOT a single Lamborghini V10 edit.

### Exact music
Use the exact user's song `TikTok video #7690925557919403294 [7690925557919403294].mp3` (~10.553469 sec, SHA256 `87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678`). It is available in the director's `GT3_MULTICAR_REFERENCE_AUDIO_PACK.zip`, which user/director must attach to this chat or upload as artifact. Verify SHA before you begin final mixing; never use replacement pop/melodic music or source reference soundtrack instead.
- Fit to 316 frames @ 30fps = 10.533s by clean tail trim; no abrupt cut or out-of-sync drop.

### Real race-car audio design
- Acquire/authenticate real motorsport engine sound effects as audio stems, ideally same source footage's original engine sound (avoid spoken commentary and unrelated music). Vehicle match: Porsche flat-six, BMW M4 GT3 inline-6, Mercedes-AMG GT3 V8, Lamborghini GT3 V10, Ferrari 296 GT3 V6 turbo, Audi R8 GT3 V10, Aston Martin Vantage GT3 V8, McLaren 720S GT3 V8. Don't put fake STO V10 rev behind a Ferrari GT3 shot and pretend authenticity.
- Layer revs and throttle cuttings only with actual driving clips. Trackside Doppler flyby aligned with pass; onboard engine and gearbox sound for cockpit shots; downshift when entering curve. Don't play a rev at constant pitch for the entire edit. Mix with gentle gain rides and equalisation so user's song remains dominant and engine punches feel intense but complementary.
- Output 48k stereo WAV mix and optional stems, an edit decision sheet marking song beats and sound cues. Do not run static synth tones as replacement engines.

### Render/QA
- Bring actual vetted A footage archive and B's Remotion project together in your branch; preserve original A/B SHAs and copies in temporary render workspace, don't commit huge media into Git.
- Export real final **1920x1080 full-frame landscape**, 316 frames, 30fps, H.264 yuv420p high quality (CRF16-18), AAC 48 kHz stereo, no black bars, no opening accidental black frames, no audible song gaps, no off-beat cuts.
- FFprobe duration/resolution/FPS, decode ALL frames and compare source shot/colour/legibility from contact sheets; blackdetect, per-shot picture review, verify actual engines and music by listening to real audio mix and silence/peak checks.
- Deliver an actual MP4 artifact downloadable from GitHub Actions, checksum, run + artifact ID, sound mix WAV, sample contact sheet, metadata tests and a realistic PASS/BLOCKED status to manager D. Don't call it complete before the actual playable MP4 has been downloaded/reviewed.

If any upstream files or song are missing, proceed as far as possible and explicitly mark the final render BLOCKED, rather than substituting an unapproved audio/video.
