# EP004 Agent 3 — six-camera handoff

Source-of-truth export: `sampleShotCamera(shot,tSec,motion): CameraPose` in `cameras.ts`; `ShotCamera` and `ApplyCameraPose` adapters in `ShotCamera.tsx`.

All six camera motions are **relative to the authoritative vehicle pose** and derive world coordinates from the supplied `VehicleMotionState.worldPosition` and `yawRad`. No independent driving lines, speed curves, wheel animations or skid positions are introduced in production cameras. Vertical FOV for **9:16**; no camera roll or late orbit.

**Editor handles and suggested camera durations** (flexible, not narration timings): hook 5.0s; rear 2.8s; underfloor 3.0s; aero 3.0s; contact 2.2s; payoff 3.0s. Each includes 0.35–0.5s trim handles in `CAMERA_SHOTS`. `sampleRetimedShotCamera(shot,localSec,durationSec,motion)` retimes camera choreography independently of global `motion.tSec` and can be called for any frame order. `blendCameraPoses` offers continuous interpolation between matching start/end rigs.

**Shot map**: spark-hook (front-side ground skimmer); rear-mystery (rear pursuit); underfloor-reveal (rear tunnel glide to forward skid); aero-load (steady oblique side-load comparison); contact-macro (forward-skid lateral macro); racing-payoff (wide-to-medium follow, no rotating finish). Rear end matches underfloor beginning; underfloor end matches macro beginning.

**Collision/framing note:** Underfloor/macro poses purposefully travel below car floor with near plane 0.035m; geometry and exact skid node from Agent 1 may require tuning. On integration, feed **Agent 2 dynamics/contacts** and **Agent 1 hero vehicle** unchanged, and render with Agent 4 track mesh matching the shared height profile. Until then all clips in `previews/agent-3` are marked a **provisional moving camera fixture**, not final contact/spark or hero approval.

**Preview commands (native once CI/Linux renderer available)**:
```bash
npx remotion compositions production/yunex/f1_sparks_ep004/previews/agent-3/entry.tsx
npx remotion render production/yunex/f1_sparks_ep004/previews/agent-3/entry.tsx EP004Agent3Hook out/ep004/agent3-hook.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
npx remotion render production/yunex/f1_sparks_ep004/previews/agent-3/entry.tsx EP004Agent3Sequence out/ep004/agent3-sequence.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=width,height,avg_frame_rate,nb_read_frames -of json out/ep004/agent3-hook.mp4
ffmpeg -v error -xerror -i out/ep004/agent3-hook.mp4 -f null -
```

Owner Agent 0 decides review stage. Do not call provisional evidence or compilation equivalent to a verified native MP4.
