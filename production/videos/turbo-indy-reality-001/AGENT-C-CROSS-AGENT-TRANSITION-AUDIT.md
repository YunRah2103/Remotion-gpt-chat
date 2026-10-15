# YUNEX Turbo → IndyCar — cross-agent transition frame audit (12 Oct 2026)

**Status: TRANSITION MATCH NOT APPROVED.** This is a visual comparison using original **playable decoded MP4 frames** from all four agents' previously published GitHub Actions packages. No new racing angle was fabricated, and no Remotion edit/audio was made.

## Exact visual comparison — frames actually inspected

| Turbo original | Real IndyCar candidate | Footage and quality | Verdict |
|---|---|---|---|
| **A01** `A01_blue_lane_low_follow.mp4` frames **+0.65, +1.65, +2.45s** | **C04** `C04_indy500_2026_finish_01.mp4` at **+0.35, +1.15, +2.10s** | A01 camera is extreme low rear-quarter / exposed rear wheel beside right-hand wall and blue streak; C04 is a real 1080p *onboard* looking forward past a close red car, with baked captions/branding. | **FAIL**: viewpoint, subject centering, motion direction, horizon and graphics do not match. C04 does remain the only dynamic IndyCar racecraft moment worth auditioning **after** the transform. Note Agent D onboard scope overlap. |
| **A02** `A02_indycar_pack_corner.mp4` at **+0.35, +0.75, +1.30s** | **D-4K** `dvids26_oval_race_pass_native4k.mp4` at **+0.65, +1.70, +3.10s** | Both show genuinely moving packs on an oval. A02 sweeps past the camera at near-track, low vantage, with near-car fast parallax. D clip is 3840×2160 genuine IndyCar but seen from a high, fenced, static spectator camera; cars very small in vertical crop. | **FAIL for seamless transformation**: track line, size, motion, screen space and vantage misaligned. **PASS only as later establishing wide** if rights check allows. |
| **A01/A02/A05** | **B** `indy25_start_middle.mp4` at **+0.35, +1.20, +2.10s** | 2025 1080p genuine footage but large fan heads/phones and catch fencing dominate, cars too distant. | **FAIL**: no clear vehicle to anchor transform; repeated B shots share spectator camera. |
| **A05** `A05_glow_low_car_rear.mp4` at **+0.60, +2.00, +3.25s** | B/C/D inventory | Under-car blue streak, wheel and tarmac move through extreme ground-level occlusion. | **NO MATCH EXISTS**: need physically shot tire/sidepod/mounted rear-quarter shot with speed, camera around kerb/asphalt level. |

Reference clips and successful Actions artifacts:
- A film six excerpts: [11758642198](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38275198546/artifacts/11758642198).
- B real 2025 spectator shots: [11757143285](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38272031857/artifacts/11757143285).
- C real 2025 / 2026 racing and 2024 formation shots: [11757970118](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38272030425/artifacts/11757970118).
- D new native 4K cinematic pack: [11757429990](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38273704533/artifacts/11757429990).

## Added Agent C source test — 2025 Indy 500

Dedicated automated Github Actions run [38290871397](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38290871397) attempted **two real public Dailymotion videos**, from URLs in branch `agent_c_extra_2025_probe.py`: 2025 Herta qualifying crash (track-level angle lead) and 2025 Palou onboard qualifying. Both **actually downloaded** with yt-dlp but both FFprobe-decoded at only **512×288**, which fails locked 1080p. Script rightly exited code 2; generated **diagnostics-only** artifact **11765132559**, size **1,516 bytes**, **ZERO new 1080p shots**. Do not count as delivered media, upscale, or feed to an editor. This test was run after the earlier successful C pack and does not invalidate C's existing six original native-1080 excerpts.

## Acquisition focus — what will actually unblock transition

1. **FIRST PRIORITY: A01 → real.** Physically filmed 1080p+ Indianapolis banked oval **ground-level rear quarter / tire passing lens** with catch fence or wall to **frame right**, matched three-quarter subject and fast motion. The car should occupy a large part of frame, not a dot in spectator footage.
2. **SECOND: A05 → real.** Mounted low wheel/underbody *occlusion* with car shadow and track running beneath; editor can hide animated-to-real texture change behind the moving wheel.
3. **THIRD: A02 → real.** Smooth banked side-pan racing pack, no foreground heads, 1080p native or 4K, car group clearly moving across frame.

**Hard gates:** actually downloadable rights-suitable original video; decoded frames; 1080p native (no upscale); camera-direction and crop checked against A; explicit source licenses. The officially operated Penske/INDYCAR media site expressly restricts public race-footage online reuse: https://pec.imagencloud.com/helpfaq . DreamWorks Turbo film excerpts likewise do not convey republication permission. Public download ≠ republishing rights.

**Conclusion:** The current inventory is sufficient for a rough *idea comparison*, NOT an approved seamlessly matched transformation. Do not declare Agent B complete or authorise the full music-synced edit.