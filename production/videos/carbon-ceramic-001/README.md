# Carbon-ceramic brakes — seven-agent project

Production scope: 25-second technical film. A faint minimalist x-ray car silhouette reveals a detailed standalone carbon-ceramic front brake corner, with visible friction heat and fade resistance.

**Status: PREPRODUCTION — no final composition or MP4 yet.**

Read PRODUCTION_CONTRACT.md, shots.json, VOICEOVER.md and your assigned agent-prompts/AGENT-X.md. The Master owns integration and final delivery. Hardware/physics/cinema/graphics specialists own separate source directories and branches. Integrator E owns the composition assembly and a narrowly scoped src/Root.tsx registration; F owns the source-locked final render candidate and technical media QA; Master alone approves the final release.

Use the existing production toolkit described in production/advanced/README.md, production/PIPELINE.md and production/EXPERIENCE.md. Large GLB/PNG/MP4 binaries should be GitHub Actions artifacts; do not silently commit huge media files or copy YUNEX assets.

Validate each completed handoff with: python production/tools/handoff.py production/videos/carbon-ceramic-001/handoffs/agent-x.json

**No code in this folder creates or launches AI agents.** Start four independent ChatGPT agent sessions using the prepared prompts, then have E integrate the verified source into its designated branch and send a native proof handoff to Master for independent review and release.
