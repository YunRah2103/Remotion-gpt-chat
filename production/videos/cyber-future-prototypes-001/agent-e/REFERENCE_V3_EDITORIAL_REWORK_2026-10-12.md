# CYBER//FUTURE 001 — V3 reference-led editorial rework

Status: **local playable draft for creative review, NOT approved final release**. This rework is based on a user-uploaded preferred edit `193778.mp4`, not the later V2's composition. Do not replace the canonical Agent E V2 Actions handoff until the user has reviewed and approved V3.

- Original user reference: `193778.mp4` SHA256 `4f9aee2931290057ffa95f33da0046ed8f2a2d066326ea8982b44b2e975cbdb9` (28,671,448 bytes). **Exists as a conversation attachment only; not committed into Git**.
- Locked original song: source MP3 SHA256 `d853d5209240bd9b84ebffc11aff9e68812df7a17eeb4aa266b8e028cd89784c`.
- Independently rendered V3 preview: `YUNEX_CYBER_FUTURE_001_V3_REFERENCE_REWORK.mp4`, SHA256 `28b9f07ea0214a20d44b405c0f0646e0df6bfb53b16a62622556830f8a796939`; H.264 yuv420p, 1080x1920 @30fps, **632 full decoded frames, 21.066667s**, AAC 48kHz stereo, 16,646,106 bytes. Full FFmpeg decode PASS, no detected continuous black segments >0.16 sec; original song vs output envelope correlation **0.999989**.
- Render made in chat workspace, **not a GitHub Actions artifact**. F's previously approved V2 handoff is untouched.

**Creative correction prompted by user feedback:** the reference's quiet illuminated dark-Lotus opening, minimal YUNEX typography, first real Hyundai driving drop ~6.73 s, and YUNEX closing card were retained. The late repeated still-like angles were shortened with 6 source-backed camera/vehicle variety inserts. No CGI, simulated driving, synthetic noises or unrelated soundtrack.

## Exact cut plan (0-based frame numbers, end exclusive)
| Frames | Source | Shot |
|---|---|---|
| 0–90 | user reference | Existing dark Lotus, glowing rear lights and CYBER//FUTURE titles |
| 90–138 | user reference | White physical Lotus side view |
| 138–164 | D `lotus_theory_1_07.mp4` source 0.43s | Real stationary physical Lotus rear-design macro, moving camera |
| 164–202 | user reference | Filmed Hyundai N Vision 74 in sunset track atmosphere |
| 202–285 | user reference | Real Hyundai RN22e moving-track drop, preserve title |
| 285–310 | A `A03_RN22e_drifting_rear.mp4` source 0.25s | Actual RN22e rear dynamic track/drift |
| 310–370 | user reference | RN22e circuit + red/white BMW Vision M NEXT grille |
| 370–401 | D `lotus_theory_1_05.mp4` source 0.50s | Physical Lotus doors raised, camera movement only |
| 401–430 | C `C07_moving_renault_r5_turbo_3e_2025.mp4` source 0.02s | Physical 2025 Renault R5 Turbo 3E filmed driving |
| 430–483 | user reference | BMW Vision M NEXT rear moving along mountain road |
| 483–508 | A `S02_RN24_neon_LED_showcase.mp4` source 0.48s | Physical Hyundai RN24 illuminated studio detail |
| 508–541 | user reference | BMW Vision M NEXT filmed cornering, driving |
| 541–566 | C `C05_moving_renault_r5_turbo_3e_2025.mp4` source 0.24s | Moving R5 Turbo 3E low frontal road view |
| 566–603 | user reference | BMW Vision M NEXT close rear moving road hero |
| 603–632 | user reference | Original YUNEX end card |

Inserted landscape-originals are deliberately placed over subdued moving/cropped extensions, with full vehicle legibility prioritized over fake claimed native 9:16 capture. Hyundai letterbox provenance remains restricted. Real-world third-party footage editing/posting rights **not verified**.

**Production note:** source-media archives A/B/C/D remain in their original Actions artifacts, see issue #32; user-supplied preferred reference and exact song must be provided to any additional GitHub runner, so this text is **not** a claim that V3 can already render through Actions. Await user creative feedback on the playable V3 before replacing F's validated input.
