# Remotion GPT Chat — independent video lab

A public, standalone Remotion + React video project. **This is NOT YUNEX** and never imports from `yunus-video-lab`.

## First film

**VECTOR / 001** — a nine-second original motion-design test featuring a fictional sports-car silhouette, animated tyres, camera movement, kinetic typography and moving ground elements. Vertical 1080 × 1920 at 30 fps (270 frames). There are no reused Porsche meshes, stock car photos, or YUNEX branding.

## Run

`npm install` then `npm run studio` to preview. `npm run render` creates `out/VectorFilm.mp4`. On every push to `main`, GitHub Actions runs TypeScript checks, renders the film and uploads an MP4 artifact on the Actions run page. [Actions runs](https://github.com/YunRah2103/Remotion-gpt-chat/actions). A manual workflow dispatch is also supported.

## Separate agent workflow

Each ordinary ChatGPT agent can open this repository through GitHub, edit its own `agent/...` branch, open a pull request, and hand off the full remote SHA. Merge into `main` to trigger a new render. See `AGENTS.md`.
