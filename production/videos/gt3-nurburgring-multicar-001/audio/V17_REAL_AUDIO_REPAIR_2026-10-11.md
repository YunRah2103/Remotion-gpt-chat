# Agent C replacement — V17 restrained real-audio repair (11 Oct 2026)

**Actual user-downloadable output** generated in ChatGPT and verified locally, **not uploaded as a GitHub Actions media artifact**. Do not mistake GitHub C's existing unit-test artifacts for this actual film.

## Picture/source

- Source: Agent B approved V11 `YUNEX_GT3_MULTICAR_AGENT_B_V11_BEAT_SYNC_1080P.mp4`, SHA-256 `902ba73054529ee5a37d69b472585f0456b3684bc072d21894b6c46ca239f74c`.
- Video bitstream SHA-256 source/output both `SHA256=d724f82f45d394b4b468fbf323416622838f713c0f8875e6e3beceab6b2aac09`, **identical**. No edit cuts moved.
- Music directly decoded from original user `192909.mp4`, original relative sample timing preserved, trim first 466/30s, fixed initial gain -2dB, local ducking -1.6dB under engines, -2.1dB under wheel event. Global safety attenuation -0.71 dB.

## Raw real audio event mapping (timeline 30fps)

| Video frames | Seconds | Visible action | Audio provenance |
|---|---|---|---|
|18–33|0.600–1.133|Ford Mustang GT3 #64 close driving pass|Moscow GT3 field-recorded actual car passage, source time 12.25s|
|46–59|1.533–2.000|Aston Martin GT3 approaching corner|Same original field recording, *different excerpt* source 31.93s|
|201–217|6.700–7.267|Porsche Falken #33 pneumatic wheel tool operating|Real Red Bull Racing pit-stop original footage audio, source time 6.10s|
|386–397|12.867–13.267|Aston Martin Vantage GT3 driving corner exit|Different real GT3 field excerpt source 46.52s|

**Excluded:** Any additional sound at 3–4s, cars not actively moving, static 8.7s Mercedes front shot; synthetic FX; all V9–V15 pre-mixed engine/pit layers; unrelated source-video soundtracks. No claimed exact source recording model ID; full GT3 race original includes multiple marques, individual passage makes not labelled. Pit source is an actual F1 servicing film, not same Nürburgring GT3 team.

Raw source field recording: Freesound 556039, uploader Walking.With.Microphones, ZOOM H6 Moscow Raceway GT3, SHA `10a9fcc79de6a003eecd575518b4498ba75b52e1ff04c19907d1b44d3e8bd14a`. Pit recorded film: `Pure Pit Stop Perfection 👌 [4qQp-P5PpFM].webm`, SHA `368c5f7c39e2edbcedee4b03ab36d165b79f1f456f4d3e9b496effdbf6dd1230`.

## Exact result, user review pending

- MP4: `YUNEX_GT3_V17_AUTHENTIC_AUDIO_REPAIRED_1080P.mp4`, 43,334,716 bytes, SHA-256 `6f2fa496542608b216f999a97118de082a37472f49710a50dcf68e1a6c71ca42`.
- Format: H.264 1920×1080, 30fps, **466 frames**, 15.533333s, AAC stereo 48k 320kbps.
- Complete FFmpeg video+audio decode **PASS**; no audio clipping (48k float premix peak 0.891251).
- ZIP: `YUNEX_GT3_V17_EDITABLE_AUDIO_STEMS_QA.zip`, 58,945,009 bytes. Includes final MP4, 24-bit 48k stereo original music/engine/pit/mix WAV stems, original sound-source snippets/field recording, cue CSV, build script, contact sheet, and detailed JSON QA. ZIP CRC passed.
- **Manual auditory audition not performed by this execution environment.** User audio approval remains **PENDING**. Verify whether the actual recorded audio timbre/pit ambience are acceptable by listening to the delivered MP4 before calling it final. Do not mark Agent C as user approved.
- **Storage caveat:** Actual MP4/ZIP are ChatGPT sandbox artifacts and have not been uploaded to GitHub Actions; this GitHub file is the issue-linked evidence ledger.

