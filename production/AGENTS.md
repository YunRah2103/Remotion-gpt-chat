# Production agent instructions

- Repo scope: `YunRah2103/Remotion-gpt-chat` only. Never read, touch, copy, reference assets from or publish to `YunRah2103/yunus-video-lab`.
- This folder is for standalone mechanical explainer videos, not YUNEX automotive showcases.
- Use `python production/tools/scaffold.py` for a new lesson. Edit its timing/voiceover plan, make a real composition, and register it in `src/Root.tsx`.
- Look in `production/mechanics/catalog.json` and `src/mechanics/parts.tsx` for reusable original mechanics before duplicating 3D modelling work.
- The built-in parts are stylised physical illustrations. For ABS and other safety systems, verify the engineering narrative; do not depict a generic part as exact manufacturer hardware.
- Preview low-resolution moving clips first; then full-resolution important frames; then 1080x1920 final. Use actual MP4/PNG evidence and FFmpeg decoder QA.
- Keep deterministic frame-evaluable transforms and exact frame counts. Every new model/shot needs declared provenance and explicit accuracy limitations.
- Do not silently substitute missing audio/GLB; do not generate speech in place of an approved user voice track.
- Optimisation is opt-in and requires model hierarchy verification and native playback; Meshopt requires decoder support.
- Release and Pages gallery are public in this public repo and are manually invoked. Don't publish unapproved edits or user-uploaded files.
- Use cache-aware installs and GitHub Actions artifact handoffs. Do not purchase hardware/GPU minutes or third-party services.
