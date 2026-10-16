# YUNEX EP003 — V6.1 opening-wing picture sync hotfix

**Date:** 2026-10-16. **Scope:** one user-requested correction; not a new cut.

**User feedback:** Narration says “See that wing?” immediately, but V6 showed the orange P1 front rather than rear wing.

**Actual owner-private film:** `YUNEX_EP003_V6_1_McLaren_P1_WING_SYNC_PRIVATE_REVIEW.mp4`
- SHA256: `c84fd234382fd43bfd215e5263cf2c50fce5939a29a0f076b9188de13b88b54a`
- 12,624,131 bytes; 19.100s; 1080×1920; 30fps; 573 H.264 frames, 48kHz AAC 897 packets. Full FFmpeg `-xerror` decode pass.
- Audio unchanged: compressed AAC SHA256 streamhash `d6cf5c14568074df930c36635f332292bce120889a118cc94cdd3b6bcf11626c` (identical V6 and V5 approved Cedar/jazz/engine).
- The **first 19 frames** of V6 (0–0.633s) replaced with a full-height portrait extraction of existing original orange P1 static raised-wing macro, `P1_M03_WING_HARDWARE_STATIC`. The wing is visible from frame one. Hard cut to V6's preapproved blue-lit moving P1 front at ~0.633 s. Title fades consistently.
- Opening picture source frames 19–51 come from V6 without editorial timing changes (only small re-encoding difference). **Picture frames 52–572 are pixel-identical to V6**, verified with frame-by-frame source comparison; rest of edit, CG, ending are intact.
- All 573 frames and 897 AAC packets verified after mux. The real wing macro is **stationary / already raised while parked**, NOT live wing pitching during braking.

**Production:** Reused original private V6 master and existing Remnant #124 owner-only source package. Encoded opening 52 frames and stream-copied remaining original V6 video from keyframe 1.733333s to preserve every later picture pixel. Stream-copied unmodified V6 AAC. Private reproducibility and QA ZIP `YUNEX_EP003_V6_1_SOURCE_AND_QA.zip` delivered to user, containing script, SHA manifest and opening contact sheet; no third-party video/audio uploaded publicly.

**Rights:** Remnant Media source rights not established. Private owner review only; publishing awaits creator permission/license. User creative approval pending.
