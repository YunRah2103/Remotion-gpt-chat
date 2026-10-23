# EP005 Agent9 cinematic audio source

Issue #273. Agent8 video editor: Issue #267 / PR #269. Master issue #247. Own isolated audio branch; NO MERGE.

STATUS: real provisional original NON-VOICE sound-design WAV stems and normalized audition MP3. The **private original Cedar binary is not available** in GitHub or CI. Do not claim a finished Cedar master or final film.

## Render

Install Python 3.11, NumPy, SciPy, SoundFile and FFmpeg, then:
python3 production/yunex/supercar_flames_ep005/agent9/build_soundtrack.py --out out/ep005-agent9

Outputs: engine_road.wav, exhaust_afterfire.wav, engine_science.wav, cinematic_score.wav, music_fx_bed_no_voice.wav (48 kHz stereo 24-bit PCM; 1,227,200 samples/ch; 25.566667 s), NONVOICE_BED_PREVIEW_ONLY.mp3, manifest.json. The MP3 is LOUDNESS NORMALIZED for audition only, not the final mix.

All audio is an original synthesized soundtrack from readable source code, with no sampled library audio, third-party recordings, copied score or narrator. This is a source-original working design, not a documented physical V8 recording. Synthetic vehicle realism requires critical listening.

## Correct seven-shot / 767-frame picture timeline

- Hook: f0-44 (0-45 exclusive)
- Front pursuit: f45-164
- Rear chase: f165-219
- Engine and exhaust science: f220-474
- Side driving: f475-564
- Rear proof: f565-674
- Flame finale: f675-766 (92 frames)

After analyzing the actual 45-frame and 92-frame V4 flame plates, transient sound events are aligned near visible flare clusters: f0, f15, f675, f695, f715, f736, f755. The final sound is faded cleanly at frame 767. These remain ear/eye review timings, not engine telemetry. Gear shifts are approximate: f79, f148, f525, f609, f706. The older 750f cue sheet is superseded.

## Cedar preservation + later muxing

Original user voice: SHA256 90dd2e299b1cdd9b7f2d3bc508b064c43dda7bfc36caa345b2f502ec13c200d8; MP3 duration 25.560 s / 24k mono. This source is PRIVATE; never upload it into public GitHub, GitHub Actions or public artifact storage.

All four WAV stems and the bed start at timestamp zero. Source code ducks music/effects against the editor's thirteen established speech phrases. Import the low-volume WAV bed under authorized ORIGINAL Cedar recording, with no speech time/pitch/content changes. Use a trusted local authorized renderer; mix and audition with narration first. Aim final integrated around -16 LUFS, <= -1.5dBTP true peak after full mix. Do not apply those final limits to the unvoiced bed alone.

Before claiming finished MP4, receive actual 767-frame 1080x1920/30fps owner-approved H264 video; preserve captions, visuals, colours, source cuts and duration. Verify MP4 is playable with FFprobe, full FFmpeg decode and real audiovisual synchronization/listening at all speech boundaries and all flame bursts. Preserve final sentence.

## Transparency

This is an original provisional design, not actual engine field recordings; visual flame onset telemetry and human listening have not been verified here. User should review and approve aesthetics before final owner lock. The branch/workflow contains ZERO Cedar binary; the preview audio alone does not constitute a final audio mix or final MP4.
## 23 October private owner-narrated review delivery (not GitHub hosted)

The owner explicitly re-uploaded the Cedar file into the active Agent9 chat. Its bytes were SHA256-matched to the original locked source and kept **strictly in the private conversation workspace**. Agent9 locally assembled 7 verified native picture segments at 767f and exact 13 phrase captions, mixed original Cedar + Agent9 timed bed, rendered H264 1080x1920@30 and AAC stereo 48k. No car/scene content changed from the source plates; this is **NOT Agent8's privately hosted V3 master**, but a faithful new source-plate review with added sound. Local MP4 SHA256 `9cd2c432fba3ecc04277ef5afe0a790b34730e1d7d64c755ac32aa512848e43e`, verified full 767-frame FFmpeg decode, loudness `-16.0 LUFS`, true peak `-1.7 dBFS`. Beginning/middle/final speech correlations against the original source confirm full original timing and delivery, no pitch/speed change. The owner has the playable file directly inside the chat; we have **NOT** attached the owner voice or narrated MP4 to GitHub, Actions, branch or PR. Owner aesthetic approval pending, no merge.
