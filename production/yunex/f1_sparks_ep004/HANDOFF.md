# EP004 — Agent handoffs, launch and acceptance

**This is the single handoff address** for all visual agents. Agent 0 manages integration, corrective instructions, review and subsequent editor/audio orchestration. The user only needs to start each distinct independent ChatGPT specialist session once, if automatic sessions are unavailable.

## Starting an agent
Paste into a **new specialist conversation**:
```text
YUNEX EP004 — Agent [NUMBER]: Start your assignment in YunRah2103/Remotion-gpt-chat. Read the EP004 master GitHub issue and your numbered agent issue, follow the linked production contract and full GitHub launch prompt. Work only on your assigned EP004 branch, commit code, open a PR to production/yunex-ep004-base, render and verify real moving MP4s, and post evidence back in your issue. Do not touch EP003 or start over. Continue until a genuine review-ready handoff.
```
Change **[NUMBER]** to **1, 2, 3, 4 or 5**. Github issue assignments and complete prompts are linked by the central dashboard. Creating branches/issues does **not** activate ChatGPT sessions.

## Dependency order
Agent 1 provides actual approved car/skid nodes, positions and geometry; Agent 2 uses those exact descriptors, `sampleTrackSurface` and canonical route. Agents 3, 4, 5 can begin in parallel against the labelled reference fixture and replace provisional states with Agent 1/2 exports before sign-off. Agent 4 meshes actual road height from `sampleTrackSurface`; Agent 3 follows Agent 2 pose, not independent trajectories. Agent 5 consumes only the shared motion/contacts. Agent 0 reviews PRs and resolves cross-department changes in issues, then integrates without merging PR #145 into main.

## Required issue handoff message template
```text
STATUS: PREVIEW READY (do not write APPROVED)
Branch/PR: ...
Latest commit SHA: ...
Changed files/exports and which common contract interfaces are used: ...
Tests (commands + results): ...
Native portrait composition ID/entry and actual 1080x1920 @ 30fps render command: ...
Technical moving MP4 URL + contextual moving MP4 URL (not stills): ...
Artifact or Release ID and run ID: ...
ffprobe frame count / fps / resolution / duration: ...
Full ffmpeg decode result: ...
Frame 0/middle/end images, notes on actual motion: ...
Accuracy checks (contacts emit only on signed gap <= 0): ...
Limitations/blockers: ...
Manager approval requested: yes
```
Agent 0 verifies artifacts independently and updates central issue through ordered stages.

## Future editor (Agent 6), not yet launched
Gate: all five visual modules accepted and integrated. Input: stable integration commit, six retimeable beats, user-approved working narration as meaning guide and **actual natural British male recorded speech**. Analyze real VO timing and align shot edges to words. Deliver complete 1080x1920/30fps picture+original VO MP4; inspect captions in portrait safe area, all motion and ending; no static filler. User creative picture approval before picture lock. Do not guess or invent voiceover timestamps.

## Future audio (Agent 7), not yet launched
Gate: picture lock and approved Agent 6 master. Preserve picture timing, subtitles, narrator voice exactly. Mix spatial pass-by engine, aero/road ambience, physically timed skid scrape and metal sparkle, restrained score under dialogue. Output genuine mastered playable 1080x1920 MP4 + stems where feasible; verify sync by listening/decoding and no narrator masking. Does not restart animation or change visuals.

## Delivery validation
Every specialist: actual implemented branch commit + PR/handoff, two moving MP4s and playback/FFprobe/full-decode evidence. Editor: original VO 1080x1920 moving master. Audio: mastered video and stems. Final Agent 0: human-reviewed frames, FFprobe resolution/fps/duration/frames, full decode, sound check, reproducible commands, actual accessible release or Actions artifact. No declaration of completion based only on CI green / static images.
