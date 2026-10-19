# EP003 Agent 3 — premium cinematic revision

Native clips inspected from prior run 39285196590 (actual 540x960 MP4s + contact sheets). First frame of wheel very dark; repeated barrier crossing due temporary fixture driving behind guardrail; low views mostly crop wheel; cockpit near-static; recovery no plausible roadside bay.

Updated native scenes consume Agent 2's `sampleDynamics` at absolute simulation time, Agent 1's `prepareTyreRig` and `applyTyreFrame` for actual deforming original front-right wheel, and Agent 4's `buildEpisodeHighway`, `EpisodeLight` and `finishGrandTourer`. No substitute motion/rubber, no modification to other departments' branches. All three authoritative source folders are brought into the CI workspace only at render time by recorded branch SHA. PR #204 must hydrate those same sources to render this PR's entrypoint.

Original 1080x1920 @30fps composition IDs and durations preserved. The 5s opening has tyre-to-moving-car dolly 0–1.28, front-three-quarter 1.28–2.20, chase 2.20–5.00. 8.8s montage: macro 0–1.20, low tracking 1.20–2.23, rear-three-quarter 2.23–3.18, under-nose 3.18–4.13, overhead 4.13–5.02, driver 5.02–6.02, chase 6.02–7.40, moving refuge approach 7.40–8.8.

**Preview timeline treatment:** evaluate actual Agent 2 frame at preview t + 0.46 sec. Since Agent 2's unchanged failure starts at physical .75s, visible deformation begins at output .29s. At each HARD CUT only, rebase camera/vehicle/wheel hub X using a common translation to avoid route wrap; all wheel spins, yaw, forces, velocity and contact values remain authoritative. This changes displayed set position, not physics. The finale depicts a passing or approaching refuge while the vehicle is STILL MOVING; there is no physically authorised stop.

Run existing GitHub workflow `.github/workflows/ep003-agent3-native-previews.yml`. It installs Node, FFmpeg, dependencies; fetches three other agent branches temporarily; runs tests and TS compile; renders two SWANGLE software-WebGL H264 MP4s at --scale=0.5; FFprobes and fully decodes both; extracts frame shots and creates two contact sheets. Output artifact must not be declared visually approved until actual playback.

Source is 1080x1920; rendered QA copies 540x960, not full-res masters. No audio during Phase 1.
