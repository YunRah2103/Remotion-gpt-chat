# Agent A — final A01 / A05 / A02 versus new B26 4K camera-match review

**Date:** 2026-10-12  
**Task:** Follow up on Agent B's new 2026 live IndyCar near-wall smoke shot to test whether it resolves the exact animated-to-real perspective gap.  
**Verdict:** **Genuine footage VERIFIED; 0/3 seamless camera-matched pairs.** The new clip makes a useful real race *payoff/accent*, not a geometrically seamless replacement.

## Reproducible evidence

- New source review script: [agent_a_compare_b26.py](./agent_a_compare_b26.py).
- Successful [GitHub Actions run #38294030556](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38294030556).
- [Inspection artifact #11767775238](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38294030556/artifacts/11767775238) contains three side-by-side A/B contact storyboards (5 points across each real clip), B26 9:16 lateral crop checks and JSON with actual FFprobe dimensions, durations and SHA256. This is **comparison evidence**, not a final video, and does not duplicate source footage for redistribution.
- The runner downloaded the actual [Agent A six-clip MP4 ZIP, #11758642198](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38275198546/artifacts/11758642198) and [Agent B's real 4K B26 ZIP, #11767580993](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38292078908/artifacts/11767580993), extracted nested archives and checked video metadata.
- **Verified real source:** `B26_01_modern_indycar_smoke_near_pitwall.mp4` SHA256 `58b0a33d534966b21de01d1e93411e06b33242d30c87edb193207fdb57683aa5`, H.264, 3840×2160, 30000/1001 fps, 3.103 s. From DVIDS 2026 Indy 500 footage, source t=290.50–293.60s.

## Actually inspected frame-by-frame

### A01 → B26 — NOT seamless

**A01:** Animated red IndyCar *exterior* wheel/side, lens low and nearly on asphalt. Last shot is a symmetrical rear follow with extremely close right wall/catch fence, road receding into the distance, Turbo's intense blue line immediately against the tyre.

**B26:** Genuine white/green IndyCar overtakes/passes with the camera mounted *above* pit wall/track. Near-side pit crews, raised white wall and spectators are prominent; its car is smaller, seen from a high diagonal profile and travels toward the left of the frame. Smoke from a second green IndyCar is behind. It has a white fence/wall, wheel and action but **camera height, camera direction, color silhouette, relative wall placement and subject size change abruptly**. Neither basic color correction nor crop solves parallax.

The frame with its nearest car **could serve as an intentional impact cut** following an animated wheel/blur; it does not prove an invisible morph.

### A05 → B26 — REJECT as direct match

**A05:** Moving snail and blue streak slide *under* the undercarriage, with foreground tire and underside of IndyCar hiding the top of the frame; extreme track-level perspective.

**B26:** Elevated *unobstructed* view looking *down* at a car. No undercarriage or moving wheel crosses close enough to create comparable occlusion. A direct A05→B26 cut jumps between incompatible geometries. A deliberate light-flash/smoke transition could conceal this cut, but would not meet the exact perspective-matching proof gate.

### A02 → B26 — REJECT

**A02:** Banked outer oval corner, curving grandstands and fast receding IndyCar pack with road nearly filling foreground.

**B26:** Straight pitwall, elevated telephoto and slow apparent moving cars with officials visible. The animated corner banking/vanishing point is not present.

### 9:16 cropping

At native 4K the leading green/white car can remain readable in a moving portrait crop, but crew, real car and smoke are spread horizontally. A static 9:16 crop loses one or more key elements. The B26 footage has plenty of real resolution but its **composition is not compatible with a one-frame A01 tyre/wall match**.

## Decision / next needed real camera shot

Agent B/D should not supply more stationary paddock clips, race-start spectators, slow parades or 720p brand streams and call the match complete.

The **exact missing source** is a rights-cleared, genuinely filmed moving Indianapolis oval IndyCar perspective with lens ~20–60 cm above asphalt **outside/rear quarter of a moving open-wheel wheel**, an outer pale concrete wall **to camera-right**, track-side fence receding diagonally, and strong actual tyre/fence movement at **native 1080p or higher**. Ideal 2–4 s continuous moving clip, clean/no baked captions. For A05 additionally seek real low-mounted wheel/undercarriage occlusion with road and nearby tyre visible. A02 needs an actual **banked low track-side pack pan**, not a pit-lane image.

**Do not begin Remotion editing under the locked footage-only contract** until a shot physically matching one of these perspectives is confirmed. All movie excerpts are DreamWorks/Universal copyrighted and publicly available access is not redistribution permission. DVIDS's public-domain marker applies to its government recording but does not automatically settle separate event/branding rights.

Agent A's own final verified film footage remains artifact [#11758642198](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38275198546/artifacts/11758642198). No audio, edit, or other agent branch was changed.
