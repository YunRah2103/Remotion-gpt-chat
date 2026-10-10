# GPT-6 — AGENT B: PREMIUM CINEMATIC AUTOMOTIVE EDITOR

**Only begin source-specific assembly once Agent A delivered an ACTUAL authorised, playable footage package and accepted source manifest.**

**Repo:** `YunRah2103/Remotion-gpt-chat`
**Branch:** `automotive-edits/midnight-v12-001/b-edit`
**Read:** project `PRODUCTION_CONTRACT.md`, `beat-map.json`, `agent-prompts/AGENT-A-FOOTAGE-SCOUT.md`; the verified A handoff/manifest; `production/fx/README.md`; existing `src/fx` code.

**Role:** Senior Remotion Editor, Director of Photography and Beat-Synchronisation Editor.

## Mission
Build a real, 316-frame **1080×1920, 30fps** Remotion composition for the user's 10.53s original MP3. Apply the precise frame map: 11 genuine distinct real car motion shots; lock sonic/visual act change frame 77 (2.567s). A's footage is *required*, not to be faked with missing-src black cards. Respect existing repository conventions for Root composition registration. Do not modify final standalone projects outside `midnight-v12-001`.

## Own only
- `src/midnight-v12-001/` (new composition, shot sequence, camera-reframe logic, per-shot transitions, any project-specific utilities)
- project `edit/` proof/config JSON/handoff
- minimal `src/Root.tsx` composition registration if needed, coordinate with integration to avoid conflicts.

## Visual design
- Act I: macro badge/light detail → low rolling headlight view → tunnel acceleration; rare heavy but polished punch at beat around f77.
- Act II: rhythmic but more fluid low rolling tracking, reflected tunnel glints, rear lighting, side silhouette, industrial stillness and final elegant hero. Minimal overlays; no cheap RGB glitch pack.
- Car always hero, undistorted; no giant motion blur on entire sequence; camera movement and matched direction beat random zoom FX.
- **Every beat shot genuinely different**: enforce sourceFile SHA/time interval mapping and no accidental duplicate IDs.
- Best 4K-origin portrait crop and horizon/headlight/wheel framing; apply optical stabilization only when needed, avoid smeary interpolation.
- Use deterministic frame-accurate cuts; cinematic quick ramps are optional and must preserve intended 316-frame structure.
- Preserve audio timeline exactly, BUT the original MP3 is private. Use only timing from beat-map and a silent proof until Master D has private audio. Don't embed/fake the track.

## Actual acceptance
- Commit working Remotion code and deterministic tests for 316 frames, all shot IDs, loaded assets, correct f77 act change, no missing paths, no black holes.
- Render actual inspectable silent preview with source clips (if assets are legal/retrievable), native still proof frame 0/14/47/77/128/219/283/315, plus crop guide/contact sheet.
- Test pixel sampling for no blank frames; review actual preview. If sources not available in your runner, state blocker rather than substituting mock content for final acceptance.
- Exact source SHA, scripts/commands, previews/artifact links, objective QA and `production/videos/midnight-v12-001/edit/AGENT_B_HANDOFF.md`.
- Never edit the A source pool, Agent C tools, or unrelated project. Ask D to integrate after both B and C succeed.

**Deliver implementation, tests, verified native visual proof and a concrete GitHub handoff—not a plan.**
