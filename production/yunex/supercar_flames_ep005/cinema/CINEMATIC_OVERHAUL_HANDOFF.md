# EP005 Agent 3 — cinematic driving quality review (22 October 2026)

**Branch:** `agent/ep005-03-v3-cinematic-driving-overhaul` (NEW / isolated)
**Base:** Agent 3's previously successful `2a452439603aa21a0e7a050a98892d15b087a803`, which itself descends from V3 EP005 manager lock `ce7316b364f96721b39100841eb386724ccf2d52`.
**Review target:** `production/yunex-ep005-v3-base`; *draft/unmerged*. Original PR #257 and kit PR #233 remain untouched.

## Why not start over?
A3's exact prior premium-source-pinned CI run [39811730221](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/39811730221) already rendered 25 seconds / 750 genuine native portrait frames with real A1 exhaust mounts, A2 flames and A4 night track. The manager reported FFprobe/full decode PASS but visual polish outstanding. The entire route, Remotion entry, body/wheel rig and actual afterfire integration are retained.

## What changed in this review branch
- Six purpose-designed *moving*, non-teleporting portrait camera tracks: lower rear three-quarter first-frame exhaust angle, fast lateral tracking, front powertrain reveal, descending mechanical inspection, tight tailpipe lens and a late dolly-in night-racing payoff.
- Continuous moving `sampleRoute('track',distance)` vehicle. Entire 25 seconds samples the same analytic travelled-distance curve; cut boundaries never reset the car. Camera easing is time-absolute, deterministic and free of random wobble.
- Symmetrically sampled road curvature creates deterministic front steering. V3 existing rolling-tyre rig still rotates wheels from actual accumulated distance divided by tyre radius. Wheels stay on the real road centreline.
- Non-calibrated, restrained vehicle dynamics illustration: lateral-acceleration sprung-shell roll <=0.044rad, longitudinal pitch <=0.013rad, distance-based compression 0.003–0.022m; body dynamics never directly bend the rolling tyre rigs or translate the route path.
- Film retains A2 engine-conditioned command windows (0–1.00s, 14.33–16.33s, 22.47–23.67s). No independently invented flames: the integration-only CI renderer uses actual Agent 1 `mount:exhaust-tip-left/right` and Agent 2's `stateFromCinemaDemand`/named-parent rig, plus Agent 4's identical V3 `track` sampler.
- Recipe night metadata aligned with A4 source, and colour grade kept sharp without fake motion blur.

## Fixed editing timetable (silent review, not narration lock)
| Frames [start,end) | Time | Action / framing |
|---|---|---|
| 0–45 | 0.00–1.50s | Rear-three-quarter moving hero; flame visible immediately f0–29 |
| 45–165 | 1.50–5.50s | Dynamic low side-tracking drive |
| 165–285 | 5.50–9.50s | Front-three-quarter engine/cabin reveal |
| 285–420 | 9.50–14.00s | Descending technical/mechanical angle |
| 420–555 | 14.00–18.50s | Low tailpipe pass, overrun bursts |
| 555–750 | 18.50–25.00s | Continuous tighter speed payoff, final f674–709 ignition |

## Pinned peers for CI-only moving source review
- A1 named-port hero: `5224e0736760be244a51383c21d5ee09e4b3cf67`
- A2 turbulent afterfire rig: `e8a8f5e415e4abb03b0fa8a2c0959df5eaceab32`
- A4 midnight matching-track environment: `92f28465b83183815605fcb3f13291bba87b2714`

CI fetches only these source files into its temporary checkout, and does **not** merge their draft PRs. A6 optional hero/motion polish is a dependent source requiring separate compatibility review; it is NOT silently included here.

## Native proof gate (not a promise of success)
After PR creation the dedicated workflow is configured to run `npm ci`, `npm run check`, absolute-frame timeline tests, V3 recipe/plan/inspect/handoff, and the real `npm run kit:render -- ep005-a3-driving`. It must verify native 1080×1920 30fps H.264 / 750f / 25.00s, full FFmpeg decode, all 750 distinct adjacent frame hashes, exact MP4 SHA256 and real extracted f0/10/23/29, every cut, f674/709/749, plus a 25-second contact sheet.

**Status when authored:** SOURCE-LEVEL OVERHAUL COMMITTED; NEW BRANCH MOVING MP4 NOT YET VERIFIED. Previous successful A3 movie is evidence only for its own *older source*. If this run fails, report exact failing step, do not claim visual approval or merge. Final editor must await approved hashes; no original EP005 narration is present or invented.
