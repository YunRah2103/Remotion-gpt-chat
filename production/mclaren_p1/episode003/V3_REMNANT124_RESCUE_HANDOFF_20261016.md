# Episode 003 — V3 Remnant Media original P1 footage rescue (16 October 2026)

## Authentic new source
- Filmmaker: **Remnant Media** (source https://www.youtube.com/watch?v=z_U29fm1nkk; published under filmmaker channel; camera claimed Sony FX3/MOVMAX RAZR).
- S25 V4 verified private owner download: [#124](https://github.com/YunRah2103/Remotion-gpt-chat/issues/124), PASS. 1920×1080 H.264, ~120.037s, 37,744,594 bytes, original SHA256 `a6e41655b28bdede9f778787286e8e851c33563a6f979355ac9cfdb395fc87eb`, draft-release asset **647820346**.
- Wide + centered portrait 1fps full timeline PASS: [run 38927813240](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38927813240). More precise 4fps wide/portrait timeline [run 38928304233](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38928304233).
- Verified independent extracts: [7-select action run 38929042787](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38929042787) PASS. Seven actual new 1920×1080 MP4 files + seven separate 540×960 portrait motion preview MP4s all fully decoded with ffmpeg -xerror; per-clip FFprobe, 3fps sheets, SHA256 manifest, ZIP CRC. **Physical 9:16 center crop is 608×1080 source pixels**, no claim of native 1080×1920 camera original.
- The original export accidentally omitted prefixes of six files' filenames because ffmpeg read the manifest stdin; all seven video streams were correct. Curated owner-only ZIP in ChatGPT runtime renamed them correctly and regenerated the SHA256 manifest, with a visual review board. GitHub workflow updated to use ffmpeg `-nostdin` to prevent recurrence.
- **Never commit third-party MP4 footage to the public repository.** Private original is in the authenticated draft release; short-lived proof clips in an owner-only Actions artifact, and curated ZIP delivered in the user's ChatGPT session. Creative source rights unverified; no publication license/approval obtained.

## Seven true MP4 selects (source master timeline)
| Clip basename (each has .mp4 and _9x16.mp4) | Start – end (s) | Role | Source-MP4 SHA256 | Visual QA |
|---|---|---|---|---|
| `P1_O01_NEON_FRONT_APPROACH` | 62.30–64.40 | Opening, low frontal camera rig rolling | `c4e1fceec66a38b3ed0ac67c07ec38ffe9f1ae9200f8f1cb1967308283eb2d22` | Promising hook; close nose crops out late; trim early. |
| `P1_M01_ORANGE_REAR_PURSUIT` | 54.65–57.90 | Rear pursuit in moving blue-lit night traffic | `91105f26d6d8d21504788901f756c6f22e91f0162c74408d4d276eb4bffc8e59` | Good rear hero moment; background traffic. |
| `P1_M02_FLUID_SIDE_ROLL` | 58.70–60.85 | Satisfying orange P1 side profile with reflections | `14545861743ed46ed3f51a4839e7fd6f01dccf2f50fd6ae655407e3002d689` | Good moving middle; check subject against narrow crop edge. |
| `P1_M03_WING_HARDWARE_STATIC` | 33.15–34.50 | Stationary rear wing hardware macro | `34fe4b28f015f0cdf7abf7635ff759012d676297942d2a42bb147eae7e5b6fc9` | Useful engineering detail only; car PARKED. Never claim real braking motion. |
| `P1_M04_FRONT_QUARTER_ROAD` | 66.20–68.90 | Front three-quarter sustained rolling | `eef2f833d09e587347d171daff5904d7a219495025ee4b9f67497c1c3031ca6e` | Car somewhat small in vertical; lower priority. |
| `P1_E01_RED_TAIL_FLYOUT` | 88.85–90.95 | Red-reflection rear 3/4 moving closer | `b556f25a1101dc4fff10c54807584256076819edf813a154bdade3f669f19af0` | Conditional ending, not breathtaking. |
| `P1_E02_NEON_REAR_TRACK_OUT` | 105.45–108.85 | Long night rear rolling exit | `bef43b747243682c12b1dc6aba3e7b979e4b9424d56f56475c2e3424dd7ab7a5` | More purposeful than V4 empty road but modest subject. |

## FINAL creative gate — honest assessment
- **Source acquisition/technical proof achieved for 7 actual new P1 excerpts; night-car consistency better than the silver/Blonde mixes.** The strongest new opening, rear pursuit and side roll are a meaningful creative improvement.
- **Still NO-GO on "fully premium cinematic rescue complete"** because the P1 is orange while original V4 is primarily silver/neutral; the wing-detail shot is stationary and shows no actual pitch under braking; two ending alternatives are acceptable but not spectacular. No source-based frame establishes truly dynamic wing actuation under track braking.
- Rights unverified: require creator authorization/licensed originals prior to publication.
- Documentary film, existing approved audio, edit and repo source untouched.
- Next decisive dependency: a professional creator's *portrait-compatible, clearly framed fast moving full-car rear three-quarter closing shot* or filmmaker raw rushes; do not repeat poor #119/#121/#122/123 sources. Full film should not be marked accepted until edited and user reviewed.

## Source archive relationships
- V2 curated silver/desert owner-only package remains intact (4 earlier clips).
- V3 archive `YUNEX_EP003_V3_ORANGE_NIGHT_PRIVATE_EDITOR_PACK.zip` generated and validated on 16 Oct 2026; 32 files including 14 playable MP4s, README, metadata, board, contact sheets and hashes. This is a ChatGPT download, **not** a public GitHub asset.
