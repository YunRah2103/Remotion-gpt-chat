# C2 footage acquisition and visual selection — 2026-10-13

**Status: real video samples acquired and decoded; no licensed / editor-ready MP4 delivery.**
This is not a claim of complete footage. Source media was held *ephemerally* inside GitHub Actions and removed before reports were uploaded. Public Actions artifacts carry **only technical metadata, SHA256 and diagnostic contact JPEGs**.

## Verified acquisition
- GH Actions [run 38359018607](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38359018607) PASS.
- [Evidence ZIP artifact 11793314582](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38359018607/artifacts/11793314582): 10 independent candidates; 6 actual first-8-second MP4 excerpts fully FFmpeg-decoded and FFprobed; 6 x three-frame contact sheets and individual JSON reports, original MP4 SHA256.
- 4 source leads inaccessible or no usable bytes: 2 Vimeo login gates, one Pixabay Cloudflare 403, one TikTok audio-only selection (performance61).
- Samples downloaded at native dimensions; 1080×1920 candidates from Glenmore Audi, Clydebank, @tim.automotives and @drvzcars, plus 576×1024 @aboutbold, 720×1280 @john_infinite. Native dimensions are not proof of good cinematic content.

## Leading C2 candidate (pending explicit permission)
**Glenmore Audi original C8 black RS6** — https://www.tiktok.com/@glenmoreaudi/video/7482802812783512887 .
- Native **1080 × 1920 HEVC 30fps AAC**, 8.1-second excerpt, FFmpeg complete decode PASS.
- Original acquired excerpt SHA256: `ef33ddae456c6fcfc92fbbdacdf65a673b77cefcb557d65cc80e71a9c0fc304b`.
- H264 8s transcode/proof SHA256: `db1f42e746168bef665462de168a1b2b1da4387ff6fdd5b0655ac4677ff4ceb1`.
- Visual inspection of frames sampled at 0.7, 2.8 and 5.1s: authentic C8 LED DRL, matte-black grille/RS front, low wheel/arch and very close headlight composition; attractive low-key lighting and clean source without embedded text. **C2 suitability: promising**, because front fascia is clearly identifiable and frames cut cleanly to an LED insert.
- Not driving; shot/camera motion continuity needs fine-grained 32-frame inspection. Fine QA code `agent-c2/fine_glenmore.py` committed, scheduled in next Actions run.
- [Source review issue #52](https://github.com/YunRah2103/Remotion-gpt-chat/issues/52) created to obtain source-specific permissions for YUNEX edit and whether source MP4 may be publicly redistributed. **Current authorisation: UNKNOWN; no source footage published.**
- Proposed edit accent pair after rights and motion check: LED snap -> wet-road headlight reflection from an *independently acquired* approved source. Avoid repeating the full-car 3/4 hero owned by A2.

## Rejected on visual or source-quality grounds
| Original video (TikTok) | Native source | Why not deliver |
|---|---|---|
| `@clydebank.car.sales/7657564818022354179` | 1080×1920 HEVC approx 60 fps | Too brightly lit dealer showroom, heavy checkerboard ceiling reflections, background business branding/signage. |
| `@tim.automotives/7637948603545275670` | 1080×1920 | Ordinary daytime full-car street tracking; not high-end detail macro; overlaps A2/B2. |
| `@drvzcars/7611992785985539361` | 1080×1920 | Prominent edited text overlays and black framed letterboxing; unsuitable clean macro. |
| `@aboutbold/6778845122596556038` | 576×1024 | Below source-native resolution requirement; bright showroom yellow vehicle mismatch. |
| `@john_infinite/6774682856955464966` | 720×1280 | Below resolution requirement and amateur carpark walkaround without cinematic details. |

## Rights, motion and delivery gates
- Source footage is original creator material and **not assumed public domain**. No written reuse permission is available in the project.
- Native HD decoded sample ≠ cleared artist footage. A media-bearing public Actions artifact/release will only be created once usage and redistribution rights are established. A limited finished-edit license is not automatically a source-republication license.
- Currently 0 approved C2 MP4s. Future delivery should provide 3–6 0.5–3.0s close-up inserts, native metadata, cut-in/out, motion, hashes, final contact sheet and video-bearing authorized archive.
- Branch: `automotive-edits/rs6-no-mercy-001/c2-details-textures`; parent issue [#44](https://github.com/YunRah2103/Remotion-gpt-chat/issues/44); source-review #46 (Auditography V4, still unapproved) and #52 (Glenmore). Avoid any overlapping A2/B2 footage.

