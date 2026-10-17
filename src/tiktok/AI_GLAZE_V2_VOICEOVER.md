# AI Glaze TikTok — V2 voiceover (satirical)

Target: 24 seconds, vertical 1080x1920, 30fps. Deliberately absurd AI fanboy persona; jokes are not factual claims.

| Start | Spoken line | Visual |
|---|---|---|
| 0.2 | Breaking news: AI is officially the greatest invention in human history. | AI IS THE BEST |
| 3.2 | And I can prove it. I asked AI. It agreed. | HOW DO I KNOW? |
| 6.5 | The scores are in: AI, ten out of ten. Humans? Two. Generous. | SCOREBOARD |
| 10.2 | Emails? Done. Ideas? Done. An ego bigger than mine? Impossible. | 24/7 GENIUS |
| 13.7 | It's even peer reviewed. By three other AIs. Unanimous. | PEER REVIEWED |
| 17.1 | Meanwhile, humanity is still downloading its common sense update. | HUMANS NEED AN UPDATE |
| 20.7 | Think I'm wrong? Please explain in the comments. | DISAGREE? |

Direction: Fast, deadpan, comically confident, with a short pause after punchlines. Avoid passing off the scoreboard or review as real research. Use a high-quality neural voice if available; robotic local speech is a fallback, not a final-quality humanlike voice. Duck music 6-10 dB under dialogue, preserve clean consonants, and check for overlap at scene boundaries.

To render the editable source:
```bash
npm install
npm run check
npx remotion render src/index.ts AiGlazeTikTok out/AI-GLAZE-V2-silent.mp4 --codec=h264 --pixel-format=yuv420p
```
