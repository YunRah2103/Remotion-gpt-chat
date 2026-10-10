# BMW M5 G90 — Agent B production handoff · private review

**FINAL PRIVATE REVIEW DELIVERED: Native Remotion 20-second, 39-clip G90 saloon edit is rendered and independently QA-verified, and user's own music excerpt is muxed locally to a playable 1080×1920 MP4. No public release has been made.**

## Real footage integrated
Agent A final SHA `96a4cec9eac460d7ec44c625292b781dda6830b8`; Actions source run `38009881261`; media artifact `G90-PRIVATE-39-SHOTS` ID `11652333164`. Original source BMW Group PressClub PF0009730 scene 3 G90 sedan. Original SHA `59947dad266e74d92843cd90c2b2c90a3e118b277898f001c30c51e4e9b428a9`. All 39 individual 720p 30fps H.264 MP4 files have independent matching SHA256 and full clip frame counts, totalling precisely 600.

## Actual film
39 individual real moving G90 video clips are cut on the supplied beat frame-grid at 30fps (0, 16, 31, ... 589). No other car models or still substitutes. Edited for vertical 9:16 with car-position-aware crops, a moving defocused continuation of the same shot for the unused vertical scene area, restrained cinematic colour and minimal optical beat emphasis. **No captions, brand titles, intro cards, numbers, subtitles or generated text of any kind**. User's private 20-second song excerpt is muxed as AAC, not distributed through GitHub.

A complete local offline FFmpeg movie exists in the user's ChatGPT working environment: `/mnt/data/BMW_M5_G90_PRIVATE_REVIEW_20s.mp4`. SHA256 `6b7b5769841656f5998cd9efb2af7005efd35afeb3b961f468c7d2f4f8619684`; 9,628,136 bytes. FFprobe: H.264, 1080×1920, 30fps, 600 decoded frames, 20.000s, AAC 48 kHz stereo. Full FFmpeg decode: PASS; independent 39-shot actual-moving-video audit: PASS; worst optical frame pair mean difference 1.166 across each shot.

This is an independent offline FFmpeg proof, not the primary delivery. **The PRIMARY FINAL is the verified NATIVE REMOTION moving-video render, locally audio-muxed to** `/mnt/data/BMW_M5_G90_REMOTION_PRIVATE_FINAL_20s.mp4`. Final private Remotion MP4 SHA256 `15ed05c1df2fe5cddda990bfec65f5c50a54885edd4380d6abf71b1a4e7e6edb`, size 15,020,312 bytes. Real independently decoded 600 frames, 39/39 source clips and motion checked, H.264 1080×1920, 30fps square pixels, 20.000s, stereo AAC 48kHz. Native Remotion source lives in `src/bmw-m5-g90-beat/BeatFilm.tsx`, registered as composition `BmwM5G90Beat001`. GitHub Actions `38010694333` downloads and checks the same exact 39 clips, builds Remotion, renders full 600-frame visual-only master and uploads short-lived private-review artifact when completed. Native Remotion Action **SUCCESS**, final video-only artifact **11653571296** downloaded, soundtrack locally muxed and complete film reviewed.

## Rights
This is a **private technical/user review** of copyrighted BMW Group press footage and uploaded music. BMW press publishing rights and public music redistribution rights are unverified; **no public TikTok use, GitHub Release, or other public distribution is authorised by this handoff**. All binaries stay local or in one-day Actions artifacts.

See `production/videos/bmw-m5-g90-beat-001/editor/private-qa.json` and `editor/README.md` for independent checks and source provenance.
