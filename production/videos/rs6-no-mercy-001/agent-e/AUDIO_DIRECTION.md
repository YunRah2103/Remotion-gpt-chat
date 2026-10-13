# AGENT E — MEASURED AUDIO DIRECTION
Reference AAC SHA256: 5ea5b0250728557eca23ea4123665ba01e5bc4ab3eba4689e7bfefc7b0e6e55b. Actual decoded waveform analysed; no speculative beats. Detected major transient grid **122.0526 BPM**, quarter **0.491591 seconds**, anchor **5.258586 seconds**; average fit deviation 1.7ms. Original 13.165011s, output **395 frames/30fps = 13.166667s**.

## Editor D: must-cut audio moments
- **f158 / 5.259s**: DROP A, an actual moving RS6 shot hits bass.
- **f202 / 6.734s**: sharp accent; optional 1-frame inversion.
- **f231 / 7.715s**: strong transition; black microstroke, never long blank.
- **f246 / 8.208s**: section returns; show RS6 clearly.
- **f254 / 8.458s**: secondary LED/rolling shot cut.
- **f276 / 9.189s**: DROP B, strongest fast full-car moving payoff.
- **f298 / 9.927s**, **f305 / 10.176s**: strong bass passage.
- **f320 / 10.664s**: hard section transition.
- **f342 / 11.401s** to **f394 / 13.125s**: late pattern with hits every ~0.246sec.
Use additional event timings in beat_map.json. Musical peak energy is roughly 5.26–6.3 and 9.2–10.2 seconds; reference visual black does NOT mean the soundtrack is silent. Opening RS6 moving within 1 second, no generic technical HUD, no text/outro, no extra unmotivated SFX.

## Music rights and build
The exact reference audio exists in a private user file only, rights to publish unknown, DO NOT upload to GitHub. An independent custom replacement track has been **actually composed** using synthesized sound only; no copied audio samples, no engine sounds from other cars. Local validation: 48kHz stereo WAV master 395 frames duration; AAC 48k stereo, 13.166s MP4 container, peak -0.77dBFS after AAC decoding, full decode PASS, no clipping/no extended silence. The alternative track is different music inspired only by the measured energy/dynamics/timing. Needs creative approval. Never imply original reuse rights.

## D to E final sync
Once D produces real video MP4, use exact 395f target for this first cut; E muxes approved score to picture, checks AAC 48K stereo/H264 yuv420p, complete FFmpeg decode/FFprobe, confirms rhythmic impact frames by visual inspection. No D picture file currently verified: no final combined MP4 claimed. Avoid fake engine sounds; genuine cleared C8 RS6 engine audio may be integrated only for matched actual acceleration after license verification.
