# AI ERA — genuine-source TikTok edit

**Project:** Real YouTube product/robotics footage, music-synchronised Remotion edit, no fabricated images or 3D landscapes.

## Current status

- Audio **verified**: user-uploaded MP3 is 35.604898 seconds; SHA256: `49c31510000ef0e92f644f8b1013192d566c805ea569f603db15f16f065f1f15`.
- Native Remotion composition: `AIEraRealFootage`, 1080 x 1920, 30fps, 1068 frames.
- **Seven valid Galaxy S25 V4 owner-authored jobs queued.** A queued job is not a download or a finished film.
- Main source clips are downloaded by the existing Samsung V4 worker; no separate cloud YouTube downloader or worker modification.
- The actual edit cannot render until every imported MP4 has a confirmed `YUNEX_PHONE_DONE_V4` on its issue.

## Real source registry

| Filename staged by editor | V4 issue | Real YouTube source and producer | Requested excerpt | Rights |
| --- | --- | --- | --- | --- |
| `chatgpt.mp4` | [#172](https://github.com/YunRah2103/Remotion-gpt-chat/issues/172) | [OpenAI — Introducing ChatGPT agent](https://www.youtube.com/watch?v=Wgn4JeYI9lY) | 0–16s | Not verified |
| `claude.mp4` | [#173](https://github.com/YunRah2103/Remotion-gpt-chat/issues/173) | [Anthropic — Claude computer-use demo](https://www.youtube.com/watch?v=vH2f7cjXjKI) | 0–16s | Not verified |
| `gemini.mp4` | [#174](https://github.com/YunRah2103/Remotion-gpt-chat/issues/174) | [Google — Gemini Omni official launch](https://www.youtube.com/watch?v=KUyRq7szZsM) | 0–16s | Not verified |
| `kimi.mp4` | [#175](https://github.com/YunRah2103/Remotion-gpt-chat/issues/175) | [Kimi AI — Agent Swarm](https://www.youtube.com/watch?v=v7IJ8JNUNQ8) | 0–16s | Not verified |
| `qwen.mp4` | [#176](https://github.com/YunRah2103/Remotion-gpt-chat/issues/176) | [Alibaba Cloud — Qwen/Wan brand film](https://www.youtube.com/watch?v=-Ow33hK8RTc) | 0–16s | Not verified |
| `deepseek.mp4` | [#177](https://github.com/YunRah2103/Remotion-gpt-chat/issues/177) | [ProgrammingKnowledge2 — actual DeepSeek UI demo](https://www.youtube.com/watch?v=u1fVxQjHL60) | 20–36s | Not verified |
| `grok.mp4` | [#178](https://github.com/YunRah2103/Remotion-gpt-chat/issues/178) | [MattVidPro — Grok 4 hands-on](https://www.youtube.com/watch?v=L4FfWXujcUQ) | 7:49–8:05 | Not verified |

**Source-selection caveat:** The YouTube titles/channels are verified, but the exact downloaded frames are **not** yet visually reviewed. After V4 import, watch each 16-second excerpt and confirm its content. Replace weak intros/brand cards with better genuinely captured moments, using new V4 issues as necessary. Do not describe software UI or demo video as physical robot footage.

## Rendering pipeline

1. Galaxy S25 V4 running with `~/yunex-v4 --loop` processes eligible owner-authored issues. It is not remotely activated by GitHub.
2. For each `YUNEX_PHONE_DONE_V4`, `.github/actions/yunex-v4-import@main` retrieves the verified private/public Release MP4 on a GitHub Actions runner, checking SHA256 and full FFmpeg decode. It does not expose draft source URLs.
3. `.github/workflows/ai-era-real-footage.yml` stages seven clips to `public/ai-era/`, fetches the identical originally uploaded audio (SHA256 checked), and runs the native Remotion composition.
4. FFprobe, a full FFmpeg decode, SHA256, first-impact and finale-impact thumbnails test the output. Manual full-screen/audio judgement is still required.
5. The workflow will only publish a downloadable MP4 artifact if the owner confirms they have reuse/publication rights to the sources and music.

Run from **Actions → AI ERA — Real S25 V4 Footage → Run workflow** *after* all seven sources have genuine phone PASS results. Source footage must remain private until actual reuse rights are verified. YouTube visibility is not a licence; TikTok's platform rules and music rights still apply.

## Visual editorial contract

- **Absolutely no generative fake environments, AI logo-only placeholders, simulated AI outputs, or invented robotic footage.**
- Real screen recordings/product films throughout, cropped carefully for vertical format. Names in small readable typography are permitted; do not hide the subject with graphics.
- Cut hard on musical accents, keep the submitted song intact, crisp high contrast without washed-out filters or artificial grain.
- Phone review matters: verify that every featured label matches what the genuine source is actually demonstrating.
- Credits/provenance remain attached to the project. Before public distribution, obtain permissions/licences or substitute licensed footage.
