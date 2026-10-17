# AI Glaze — Satirical TikTok V3

**Video:** AI IS THE BEST (Glaze Labs)
**Format:** 1080 × 1920 | 30 fps | 909 frames | 30.3 seconds
**Composition:** AiGlazeTikTokV3
**Source:** src/tiktok/AiGlazeTikTokV3.tsx
**Separate from YUNEX:** This is a standalone comedy composition. All other videos remain intact.

## Narration

The user supplied a 30.048-second OpenAI Cedar MP3. This V3 animation is timed around the exact read:

| Time | Spoken section | Visual |
|---|---|---|
| 0.00–1.45 | Breaking news | Breaking headline |
| 1.45–4.85 | Greatest invention | AI greatest ever |
| 4.85–6.05 | And I can prove it | Proof stamp |
| 6.05–8.11 | I asked AI / It agreed | Satirical chat |
| 8.11–9.50 | Scores are in | AI-certified results |
| 9.50–11.63 | AI, ten out of ten | Lime 10/10 bar |
| 11.63–14.22 | Humans, two. Generous. | Red 2/10 bar |
| 14.22–17.30 | Emails done / Ideas done | Productivity checks |
| 17.30–19.90 | Ego bigger than mine? Impossible. | Red impossible callout |
| 19.90–23.78 | Three AI peer reviewers / unanimous | Three AI badges |
| 23.78–27.37 | Humanity installing common sense | Progress stuck at 2% |
| 27.37–30.30 | Think I'm wrong? Please explain in comments | CTA |

The audio was uploaded **in ChatGPT**, not committed to GitHub. The downloadable final MP4 provided in the conversation already includes the real Cedar recording and music. The GitHub workflow renders and validates VISUALS ONLY until the exact MP3 is intentionally placed in the repository.

To reproduce the voiceover-based version in Remotion:

1. Put the supplied Cedar MP3 at public/ai-glaze-cedar.mp3 in a working checkout.
2. Run: npx remotion render src/index.ts AiGlazeTikTokV3 out/AI-GLAZE-V3-WITH-CEDAR.mp4 --props '{"includeCedar":true}' --codec=h264 --pixel-format=yuv420p
3. Add original background rhythm with FFmpeg if desired, ducked below the voice.

Local preview: npm run studio, then select AiGlazeTikTokV3.

## Quality contract

- The comparison is satirical hype, not a factual scientific claim.
- Maintain full-frame 9:16 typography and safe margins.
- Sync visuals to actual provided narration.
- Avoid external footage and brand logos.
- Do not modify existing automotive compositions.
- Verify MP4s with FFprobe and a complete FFmpeg decode.
