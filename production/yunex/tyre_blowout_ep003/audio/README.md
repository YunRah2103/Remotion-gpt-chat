# YUNEX EP003 V4 — Agent 7 Final Cinematic Audio
Audio-only department for Issue #213. This package deliberately never changes editor or specialist picture source. Input is the user-approved V4 master, SHA256 `5059a0f66fc2c91316e1b5cf190ad4554feaafd2fb4e13980cb05a8069e762dd`, not V3. Exact 26.6667s / 30fps / 800 frames / 1080x1920.

## Reproducible export
From the repo root (Python 3.11+, pip install numpy scipy soundfile, ffmpeg installed):

```bash
python production/yunex/tyre_blowout_ep003/audio/mix_ep003_v4.py --input /verified/path/YUNEX_TYRE_EP003_V4_PICTURE_CEDAR.mp4 --out ./agent7-output
```

The script **refuses a source hash mismatch**. The original Cedar AAC is demuxed to `ORIGINAL_VO_REFERENCE.wav` (24-bit mono). All other sounds are deliberately original synthesis: smooth rubber pressure release 1.89–3.40s; real road/engine undercurrent; wheel lateral scrub 12.92–14.42s; metal guardrail at 13.64s with bending/debris; reversing sound 14.44–15.83s; stabilized moving-road bed from 16.015s; minimal A minor → C major color score. No sampled assets or third-party licensing claims.

24-bit 48k PCM stem outputs `SFX_STEMS.wav`, `MUSIC_STEM.wav`, `FINAL_MIX.wav` and `ORIGINAL_VO_REFERENCE.wav`; AAC 320k stereo export `YUNEX_TYRE_EP003_V4_FINAL_AUDIO.mp4` uses `-c:v copy`. 16 original VO cues remain locked; no new speech/no timing edits.

### Actual verified local master
- Final MP4 SHA256: `052c057c85d128bb843371475cc7383e986dbfebacd58f889046d7cffe9db065`.
- Original/final H264 elementary stream SHA256 both: `9206d1b75e5b5253733c76652be447785428ad5e471b611783c7813cfcaf2b36`.
- Native 1080×1920 30fps, 800/800 frames, A/V decode PASS, mono check PASS, narration zero offset, V4 original picture unchanged.
- Integrated **−16.3 LUFS**, true peak **−1.2 dBTP**, LRA **3.3 LU**; user VO correlation in mono mix 0.99273.
- Delivered master and WAV stems independently in the ChatGPT conversation (not committed as large/binary repository files). User subjective audition remains necessary; quantitative verification alone cannot substitute for listening.

### Creative cues
| Time (s) | Sound design |
|---|---|
| 0–1.89 | Engine, tyre/road, air movement, barely-audible score |
| 1.89–3.40 | Pressure release, torn tyre flutter |
| 3.81–11.20 | Lateral tyre resistance and developing low pulse |
| 11.665–12.83 | Tension without premature crash cue |
| 12.92–13.64 | Road scrub during bad choice |
| 13.64–14.44 | Visible guardrail metal, impact weight and loose debris |
| 14.44–15.83 | Rewind whoosh, reversing debris |
| 15.925–23.80 | Restored incident, steadily easing but still-moving road texture |
| 23.80–26.667 | Gentle harmonic resolution with moving-car air |
