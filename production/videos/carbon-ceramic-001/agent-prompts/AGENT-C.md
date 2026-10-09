# AGENT C — GPT-6 cinematic director, lighting and faint x-ray context

Your branch: automotive-brakes-001/c-cinema-xray
Manager: automotive-brakes-001/master
Repository: YunRah2103/Remotion-gpt-chat

Read first: production/videos/carbon-ceramic-001/PRODUCTION_CONTRACT.md and shots.json.

**Sole ownership:** src/brakes001/cinema/** and production/videos/carbon-ceramic-001/lookdev/** plus handoffs/agent-c.json and agent-c.md. Don't edit mechanics, hardware, graphics, root, central dependencies or YUNEX.

**DO NOT MODEL A COMPLETE CAR.** Draw or procedurally generate only a very understated sports-car outline, in true 3D if useful: thin lines, ghosted roof/bonnet/rear outline, wheel arc hints, perhaps a ghost plane. Low opacity, visibly secondary. Let it establish one brake's position for 0–4s, then disappear as the camera enters the exposed brake. If returning in the last 4s, stay faint.

Own the purposeful shot choreography, camera arcs and lighting: introductory ghost outline; smooth reveal of one front brake corner; detailed friction-pad camera; close rotor with visually coherent thermal lighting; clean hero orbit. Use src/studio/LightingPresets.tsx as a starting point only; avoid bland white background, black-on-black discs, hard clipping, overly tiny centre object or dead vertical sky. Keep rotor and two pads readable at portrait 1080x1920. Use declared shot times and frame-based deterministic cameras, not wall-clock updates or random animation.

Publish GhostCarOutline, BrakeCameraRig, BrakeLighting / scene lookdev exports with a clear interface for Master. Use standalone mock brake geometry temporarily if A's GLB isn't ready, but do not pretend your mockup is final mechanical QA. Deliver real representative portrait stills and a small native moving proof, A/B comparison notes with actual output artifacts where possible.

Handoff: update handoffs/agent-c.json role director and agent-c.md with source SHA, actual proof links, camera parameters and issues. Validate JSON. Leave integration to Master.
