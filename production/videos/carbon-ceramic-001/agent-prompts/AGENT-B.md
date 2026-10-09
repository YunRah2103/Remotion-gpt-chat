# AGENT B — GPT-6 mechanical animator and thermal storyteller

Your branch: automotive-brakes-001/b-motion-thermal
Manager: automotive-brakes-001/master
Repository: YunRah2103/Remotion-gpt-chat

Read first: production/videos/carbon-ceramic-001/PRODUCTION_CONTRACT.md and shots.json.

**Sole ownership:** src/brakes001/motion/** and production/videos/carbon-ceramic-001/physics/** plus handoffs/agent-b.json and agent-b.md. Don't edit hardware, camera, overlays, master film/root or YUNEX.

Mission: implement physically intelligible braking kinematics and frame-deterministic thermal **illustration** for 750 frames at 30fps. Pure exported function brakeStateAt(frame:number), type BrakeMotionState (fields specified in contract), with deterministic continuous rotor rotation/deceleration, inner/outer pad engagement, cooling after release and at least two controlled braking cycles to illustrate high-temperature stability. Rotor, hat and wheel hub rotate together. Fixed caliper body does not rotate. Correct friction heat location is on annular rotor contact track. Proper negative/positive pad direction along X and finite clamp gaps, without rotor penetration. No independent random sine waves.

Provide a controlled baseline brake cycle, reasoned angular deceleration mapping, sensible normalized illustrative heating/cooling envelope. Do NOT present estimated normalized heat01 as real Celsius or a full thermal FEA model. Do NOT imply carbon-ceramic brakes magically shorten all stopping distances or are immune to fade.

Deliver source exports and reproducible unit tests for 750 frames: speed non-negative and decreasing during actual braking, rotor angle monotonic and finite, bounded positive gap, pad clamp tied to pressure, heat rises under friction and relaxes during cooling; no sudden discontinuities at shot boundaries. Create a native mini moving proof with simple placeholder geometry for Master, clearly labelled if the final Blender hardware has not been integrated yet. Provide the typed interface and instructions to map onto Agent A's nodes.

Handoff: commit actual source; update handoffs/agent-b.json (role engineering) + agent-b.md with source SHA, tests and actual proofs. Run python production/tools/handoff.py; never claim ready on source code alone without tangible evidence. Report to Master.
