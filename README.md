# Remotion GPT Chat · GPU DRIVE 001

An **independent** Remotion 4 / Three.js / React Three Fiber true-3D automotive motion film, 6 seconds, 1080×1920, 30 fps. No code or assets from YUNEX or yunus-video-lab.

Real 3D geometry includes a conceptual car, wheels, road, environment, lighting and animated 3D camera. 2D typography is overlaid for legibility.

On push to main, GitHub Actions renders MP4 using software-backed WebGL (`--gl=swangle`), adds synthesised audio and uploads a fully validated file as an artifact.

Optional `render-gpu-self-hosted.yml` runs **only when manually triggered** on a Linux self-hosted runner with hardware GPU and labels `self-hosted, linux, x64, gpu`; registering one is separate and not automatically provisioned. Only trigger trusted code; public repositories and self-hosted runners have security implications.

Run `npm install && npm run studio` locally. `npm run check` for TS.
