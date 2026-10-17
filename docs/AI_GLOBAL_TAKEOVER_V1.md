# AI GLOBAL TAKEOVER / CINEMATIC 2.5D / EPISODE 001

**Status:** completed and QC verified in GitHub Actions run https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39046662421

**Native composition:** AiGlobalTakeoverFilm (src/tiktok/AiGlobalTakeoverFilm.tsx).
**Dimensions:** 1080×1920, 30fps, 1020 frames, 34.0s, H264 / AAC stereo.
**Geometry:** src/tiktok/aiTakeoverWorld.ts (simplified world geographic outlines).
**Audio:** original temporary instrumental only. User has requested a separate voiceover for the final touches.
**Status:** full native Remotion render successful, strict ffprobe validation and full FFmpeg decode passed.
**Final artifact:** AI-GLOBAL-TAKEOVER-PREVOICE-FINAL-QC (GitHub Actions).

## Proposed VO — time locked to reviewed video

Record in a calm, grounded, subtly ominous UK English documentary tone, around 140–150 words per minute.
Keep short cinematic pauses, particularly before the two final questions.

| Time | Scene | Exact voiceover |
|---|---|---|
| 0.00–4.18 | Isometric night city / robots | People imagine an AI takeover as robots marching through the streets. |
| 4.18–9.05 | Rotating AI network globe | But what if it starts quietly, through networks we barely notice? |
| 9.05–13.56 | Flyover, 2.5D city | First, AI begins coordinating our cities. |
| 13.56–18.40 | Traffic, energy, supply and health | Traffic. Energy. Deliveries. Systems making more and more decisions. |
| 18.40–23.95 | Connections spread across globe | Then those systems connect across continents, until the entire planet is sharing signals. |
| 23.95–28.40 | Glowing AI computation core | Every decision creates new data. Every new signal feeds the next. |
| 28.40–31.05 | WHO'S IN CONTROL? | So... who's in control? |
| 31.05–34.00 | WHO HOLDS THE KEYS? | And who holds the keys? |

Record dry mono WAV at 48kHz if possible, without baked-in music or effects.
When narration is approved and added, duck the original provisional music by ~8–12dB under speech, master the integrated mix around -16 LUFS and peak below -1 dBTP.

## Technical production

The native GitHub workflow .github/workflows/ai-takeover-25d.yml:
1. Installs Remotion and performs TypeScript checks.
2. Renders eight key stills and a genuinely moving preview.
3. Renders 6 x 170-frame full-resolution native chunks in parallel.
4. Generates its own provisional soundtrack with production/tiktok_ai/synth_score.py (no sourced music).
5. Concatenates, encodes H264 limited range yuv420p and AAC stereo, writes 34-second master.
6. Full-decodes the finished master and verifies 1020 frames, 1080x1920, 30fps, codecs and duration.

The creative theme is a speculative future, *not* a factual prediction of inevitable AI takeover. Real city names denote fictional visual network nodes, not an assertion that AI controls the relevant city.

The downloadable final visual master, cover image, and separate score have been provided in ChatGPT.
Existing YUNEX videos remain unchanged. Don't merge without reviewing the native master.
