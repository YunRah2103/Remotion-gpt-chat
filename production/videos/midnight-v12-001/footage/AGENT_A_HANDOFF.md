# AGENT A — expanded real-footage acquisition handoff (2026-10-10)

**Repository:** YunRah2103/Remotion-gpt-chat

**Branch:** `automotive-edits/midnight-v12-001/a-footage`

**SOURCE GATE: FAIL — honest incomplete footage coverage.** This follow-up materially expanded and independently QA'd the real video pool.

## Actual V2 footage package

[Download Agent A expanded ZIP (19.19 MB)](https://378e0378-9dfe-48d4-9d9c-73912757403f.sandbox.floot.app/_cdn/static/midnight-v12-001/agent-a-expanded-scout-v2.zip)

- **ZIP exact bytes:** 19,193,437
- **SHA256:** `83233278b4c50763c8cb37b6a5f80d9c5b1b3b760fc25ce27bead2a10cb20450`
- **Post-upload verification:** HTTP GET successful, whole archive re-hashed, unzipped, and all eight MP4 hashes checked. 34 archive entries.
- **Acquired** 12 separate authentic source videos from Pexels, **delivered** 8 real 2–3s video-only excerpts, 24 images (motion contact proof + vertical center crop for all 12), manifest, short handoff note. Full longer originals were not delivered due hosted storage quota. No fake 4K upscaling.
- **Best two coherent clips:** black Aventador-like 7727415 (low frontal tracking) and 7727416 (lateral freeway drive), both real 1920×1080 25fps. Exact physical car match not proven. Cropped portrait effective width only 608px/1080px high, so not premium native vertical quality.
- Other stronger aggressive candidate: purple racing Lamborghini 32068488 at 60fps 1080 landscape. It is **another car**, cannot be treated as identical black hero.
- A 3840×2160 wheel detail exists (20153915) but not racing motion; another 4K road shot (20153917) misses central crop. Neither fills 11 true moving angles.
- Source pages/creator/rights record and per-media hashes: `source-manifest.json`. Full visual decisions by shot: `SHOT_SELECTION.md`. QA: `FOOTAGE_QA.md`.
- Public Git contains only these manifests, not third-party video binaries or user-provided original soundtrack. Source licence https://www.pexels.com/license/.

## B/D actionable gate instructions

Agent B: build neutral modular edit/effects timeline if useful but **do not claim 11 unique ready shots**. Locked primary transition frame **77** remains untouched. Don't split one clip into several disguised angles.

Agent D: **do not render the claimed high-quality final** with these mismatched, often 1080p clips. Acquire appropriately licensed **one identical rare aggressive hypercar** with >=11 truly distinct high-res moving angles, native 4K landscape with safe 9:16 composition or native vertical 1080×1920, and confirm actual footage rights, before opening Gate 1.

### Status of paid/unavailable leads
Pixabay 4K60 night candidate showed access-blocked 403 and was **not acquired**; Shutterstock nighttime black Huracán / Pond5 catalog are commercially licensed listings, **not purchased or delivered**. User visual reference `192907.mp4` is inspiration only; no direct reuse assumed. Original 10.53 second audio stays private and unmodified.

**Final decision: A footage scouting improved substantially; complete approved footage requirement not met.**


---

## YouTube single-car original shoot follow-up (21:30 UK, 2026-10-10)

The user confirmed **yt-dlp is installed**, enabling local retrieval tests. Stopped mixed-stock scouting and found original single-hero shoots with explicit CC Attribution licence labels. The strongest **rare hypercar** is [Ricky Blackwell and Developed Films / Koenigsegg Jesko Attack USA Delivery](https://www.youtube.com/watch?v=PxSSCIdmEZ8), 48 seconds; creator describes film crew. [gchrisfx / Lamborghini Aventador original Austin shoot](https://www.youtube.com/watch?v=mOSnX0QDdsE), 2:14, is a second original-filmmaker CC-labelled option. However, actual uploaded stream resolution, 11 distinct angles, portrait-safe framing and same exact car continuity are still NOT verified.

**Actual execution:** Installed yt-dlp ARM64 2026.08.19 in cloud inspector and attempted `--list-formats` on the Jesko source. YouTube explicitly refused before returning formats: `Sign in to confirm you’re not a bot`. No video was acquired this pass; no playable file, SHA or new ZIP may be asserted. Do not attempt access-protection workarounds. Original YouTube CC licence/ownership still requires source confirmation; soundtrack rights separately.

**Final source evidence, ranked originals, local exact yt-dlp probe/acquisition commands, and trade-offs:** [YOUTUBE_ORIGINAL_SHOOT_SCOUT.md](./YOUTUBE_ORIGINAL_SHOOT_SCOUT.md) plus machine-readable [youtube-candidate-manifest.json](./youtube-candidate-manifest.json). User can locally run yt-dlp -F on the two original CC-labelled sources without pasting any credentials; only upload a media file they have download/adaptation permission for. Follow up with actual FFprobe and 11-angle QA on true files.

**Gate A remains FAIL.** The 12-source Pexels V2 scout ZIP is still a separate, incomplete, mixed-car source pool and must not be promoted to final footage. B/D integration remains blocked. A's next meaningful action requires actual local or creator-provided source bytes, permission and high-res evidence.
