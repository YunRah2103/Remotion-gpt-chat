# Agent 6 — Braking at 200 KM/H — VO-aligned first cut

This EDITOR branch targets `production/braking-200kmh-ep001-contract`. It does **not** copy or change any peer's source, vehicle kit, or existing approved scene. The full first cut dynamically composes original 3D assets from the five pinned PRs in an ephemeral GitHub Actions checkout. Only A1 constructs the car; world-kit constructs the track once; A4 enhances materials/light on the existing objects and adds dressing (not another track).

## Picture / supplied narration

- 1080 × 1920, 30 fps, 810 frames = **27.00 s**. No music; master music/SFX belongs to A7 after manager picture lock.
- User-supplied original spoken voiceover: `openai-fm-cedar-audio.mp3`, **25.512 s** (24 kHz mono MP3).
- The user MP3 is provided privately to the assistant in conversation and is **not** in GitHub. To avoid fabricating/redistributing the recording in repo, CI renders video-only native H.264; review/export mux should use **the actual provided MP3**, starting at t=0, AAC 192 kbps, without trimming words.
- Voice cue boundaries are estimated from actual audio energy and manually reviewed against user-supplied transcript (NOT a fabricated sample-specific transcription):

| Time (s) | Frames | Narrative & visual |
|---|---|---|
| 0.00–5.17 | 0–154 | 200 km/h opening + slam on brakes (spoken 0.0–4.8) |
| 5.17–10.17 | 155–304 | Where energy goes → true rotating disc/stationary caliper + pad pressure |
| 10.17–12.83 | 305–384 | Movement converts into heat, A2 brake-energy-sourced illustration |
| 12.83–16.67 | 385–499 | Tyre grip + front load transfer |
| 16.67–22.73 | 500–681 | A separately labelled **LOW-GRIP EXAMPLE**; pressure actually changes ONLY on A2's ABS intervention samples |
| 22.73–27.00 | 682–809 | Returns to dry-road physical stop and composed moving car ending, no outro |

The A2 low-grip interval is a distinct illustrative scenario, not a fake continuation of the dry-road stop. No fabricated stop distance or measured temperatures. Engineering pressure animation and rotor follow the sampled state. A3's six camera moves are used, A4's actual shared-object lighting and finish hook is mounted once, and A5's real-state graphics are external to ThreeCanvas.

## Source pins

- A1 PR #155: `395fa07113838999f0de485cb6ab545421b7e1cd`
- A2 PR #156: `4a6152c2035c8492171bf684b5a51670a3b2c56c`
- A3 PR #152: `9bf5a1d2d68ee609ae8c0ed5d9d4355ea82e6835`
- A4 PR #153: `192f2fddeec41c397a3524ec5c22e59a7d33124d`
- A5 PR #154: `228667a5e17d87d92d2435cfa6f358a1d0d549aa`

## Reproduce verified render

GitHub workflow `yunex-braking-a6-full-film.yml` runs physics/creative interfaces checks, six parallel native 1080×1920 H264 segments, lossless video concatenation, FFprobe, full FFmpeg decode and contact stills, and saves the MP4 in `YUNEX-BRAKING-200-A6-FIRST-CUT` Actions artifact.

You may mux the narration locally **after downloading the genuine video**:

```bash
ffmpeg -y -i YUNEX_BRAKING_200KMH_A6_PICTURE.mp4 \
  -i openai-fm-cedar-audio.mp3 \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k \
  -af 'aresample=async=1:first_pts=0' -t 27 \
  -movflags +faststart YUNEX_BRAKING_200KMH_A6_VO_PREVIEW.mp4
ffprobe -v error -show_streams -show_format -of json YUNEX_BRAKING_200KMH_A6_VO_PREVIEW.mp4
ffmpeg -v error -xerror -i YUNEX_BRAKING_200KMH_A6_VO_PREVIEW.mp4 -f null -
```

**Status**: FIRST-CUT ONLY until one fully watched, verified 27-second film receives manager approval. Do not self-authorize picture lock or Agent 7 final audio mix.
