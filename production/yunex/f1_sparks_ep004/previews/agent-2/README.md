# Agent 2 native Remotion moving compositions (NOT picture-approved)

Read Agent 1's actual descriptor interface and replace PREVIEW_SKIDS in
PhysicsPreviews.tsx prior to integrating/approving; also remove fixture
box when real fitted metallic skid is rendered. Agent 4 replaces the
local faithful profile ribbon with its premium matching drivable mesh.
This interim preview is a PHYSICS and moving composition test.

Native render commands (run from repository root after npm ci):

    node --experimental-strip-types --test production/yunex/f1_sparks_ep004/tests/agent-2/*.test.mjs
    npx remotion render production/yunex/f1_sparks_ep004/previews/agent-2/entry.tsx EP004A2Technical out/ep004/agent2-technical.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
    npx remotion render production/yunex/f1_sparks_ep004/previews/agent-2/entry.tsx EP004A2Portrait out/ep004/agent2-portrait.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p

Proof requires ffprobe, full ffmpeg decode, and visual checks at start,
middle and end of EACH clip. Native render proof not claimed until run.
