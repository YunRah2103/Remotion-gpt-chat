# Cedar voiceover — Carbon-Ceramic Brakes 001

Audio has been processed from the user's actual uploaded `openai-fm-cedar-audio (3).mp3`.

- Source runtime: **21.504s**, source 24kHz mono MP3.
- New edited runtime: **25.000s**, **48kHz stereo**.
- Original spoken speed and pitch remain unchanged. Silence/pause positioning is edited to create scene transitions; very subtle 65 Hz high pass and broadcast-appropriate voice loudness.
- Production master: `Carbon_Ceramic_001_Cedar_VO_25s_48k_master.wav`, 24-bit PCM.
- Small review file: `Carbon_Ceramic_001_Cedar_VO_25s_48k_preview.m4a`, AAC.
- WAV SHA256: `b5ee270bfa713400545c21fe04796181d08068dfd9aa4ac2d09e37571e8d237e`.
- AAC SHA256: `c9590da67cd7cc39eb904c620d69c296a053eab8cbb2b27996d743d4eb6ab15e`.
- Target final sequence: five voice phrases around 0.30–3.00, 3.93–8.11, 8.78–15.35, 16.08–18.88, 20.95–24.61s.
- Scene correspondence: ghost x-ray car → pad clamping → thermal load → lighter than cast iron → brake hero.
- Exact sentence cues: `cedar-sentences.srt` and `cedar-timeline.json`.
- Sentence cues are editorial approximations based on genuine source silence intervals, NOT forced alignment or actual word-level caption timings.

## Master integration instruction

1. **Obtain the actual WAV or AAC file** from the user's originating ChatGPT conversation, where it is offered as a downloadable file. It is **not attached to this GitHub repository or an Actions artifact** by merely committing this manifest.
2. Transfer the binary into a verified successful GitHub Actions artifact or other approved input path that your current Remotion audio mux step accepts. Never assume source audio is already available.
3. Verify exact SHA256 above, duration **25s**, **48kHz** audio track and full FFmpeg decode.
4. Align video to the actual voice timestamps from `cedar-timeline.json`, then trim/animate labels at sentence or independently aligned word boundaries; do not fabricate word timing.
5. Use this as the narration track if approved, and mix mechanical cues BELOW the voice with headroom. Avoid re-normalising or replacing the voice without justification.
6. Before final signoff, listen to the new WAV for transitions; review video with actual muxed audio for synchronisation, fading and technical clarity.
7. Do not declare an approved or published voiceover file exists in GitHub before staging and testing the actual bytes.

**No paid tools, voice cloning, or invented narration** were used for this edit. Only the provided recording.
