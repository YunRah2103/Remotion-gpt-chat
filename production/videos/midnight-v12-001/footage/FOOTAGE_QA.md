# Agent A — actual footage QA, 2026-10-10

## Gate decision: **FAIL — scout package only**

Actual 70,399,810-byte package exists at [download verified ZIP](https://378e0378-9dfe-48d4-9d9c-73912757403f.sandbox.floot.app/_cdn/static/midnight-v12-001/agent-a-scout-partial.zip); HTTP HEAD **200**, Content-Length **70399810** checked after upload. Archive SHA-256: `ea10b32c1923e23dfc01e1cb0f5472a68bafbd4144f22d676d20cda887dba791`.

Two real Pexels clips downloaded as original high-quality streams; output H.264 bitstreams **copied without recompression**, original sound removed. Pexels [licence](https://www.pexels.com/license/) permits reuse/editing subject to restrictions; creator credit appreciated, no implied brand endorsement. These are not user reference footage.

| ID | Video | H.264 bitrate | Source SHA-256 | Prepared SHA-256 | Crop & visual QA |
|---|---|---|---|---|---|
| PX-20153915 | 3840×2160/24 fps, 7.17 s | 12.98 Mbps | `84f5179393e475167b9fa17e8b94f16866f5be7bfb603875e60cb34b6298b06c` | `313f6fd517e0c31c2a8ef3e4958e5b8be218cb92ad839aa7185d43b8adf5d0b8` | **Conditional:** visible Lamborghini wheel crest and camera push; not moving road car; daylight |
| PX-20153917 | 3840×2160/24 fps, 26.17 s | 17.95 Mbps | `377ec43e9aec2e6e04d27a7cf83dc54e1db0b05d24878c276701cfc586f8ade3` | `550bbf03383989db84f5601e154f09fd9c45460403617c2a40a1e9e59959a954` | **FAIL:** real driving but small/left subject off center crop; daylight rather than dark/industrial |

For 3840×2160 landscape, a centered 9:16 crop is 1215×2160, theoretically enough pixels for 1080×1920. **Pixel count is not subject framing.** The second clip fails framing despite 4K resolution.

Package includes `proof/*-frames.jpg` sampled multi-frame contact images, `proof/*-vertical-center.jpg` target-geometry crop visual proofs, and full `source-manifest.json`, plus this status. No artificial HD upscaling and no false duplicate-shot claims. No third-party video binaries committed to public Git.

QA limits: **No 11-shot visual/pHash/identity continuity approval.** Exact model not established on both clips. No source-license warranty for logos and third-party brands. Source stream probes and selected frame samples completed remotely using FFmpeg; exhaustive whole-clip decode was not recorded as passing, and hash of the ZIP was measured before upload (remote CDN HEAD verified byte count, not re-downloaded hash).

### Archive delivery
This is a **hosted cloud file, not GitHub Actions artifact**. No Actions artifact ID is claimed. Hosted under a temporary project asset endpoint for user retrieval; availability beyond the current hosting project is not guaranteed. Master should download it promptly and re-verify SHA-256 locally before using it.

### Go/no-go
Agents B and D: **NO GO** for source-dependent final 10.53-second assembly; get a real 11+ distinct footage pool first. Agents may work on generic transition technology separately, but must not imply A gate has passed.
