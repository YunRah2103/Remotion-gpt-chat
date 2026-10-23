# Automotive studio depth and agent workflow implementation plan

Goal: improve actual kit geometry while making complete deterministic videos buildable from one declarative recipe. Continue PR233, preserve prior source and EP003/EP004.

Architecture: additive recipe compiler and React scene director wrap existing vehicle, world, part, driver, weather and camera factories. Agents edit a small typed JSON recipe, validate it and render a standalone composition. Existing factories and 20 reviews stay available.

1. Independent coachwork task: continuous sculpt/lamp improvements through existing hero hooks; test arch clearance, normal transport, lights/cutaway compatibility.
2. Independent cabin/powertrain task: modular fitted cabin detail, proper family engine choice, articulated grips; integrate hooks in rig, test both steering sides and heavy engine clearance.
3. Independent environment task: location detail on actual hardpoints and deterministic pooled weather; preserve route corridors/camera clearance.
4. Recipe compiler and director: validate assets, timing, annotations, audio and captions; compile contiguous frame ranges; sample without accumulated state; manage scene lifecycle, cameras, cutaways, parts, labels and optional supplied audio. Test boundaries, backwards seeks, invalid configurations and serialization.
5. Agent CLI/templates: catalogue, scaffold without overwrite, validate and render with safe argument arrays; complete road/cutaway and mechanical example films; test scaffold and command generation.
6. Integrate; run broad regressions/TypeScript/exports; review code; commit source once stable. Render existing reviews and new complete recipe videos at native1080p30, inspect moving footage and correct actual defects. Update same draft PR with handoffs and limitations. No merge.

The supplied user brief authorizes immediate deeper implementation. Work proceeds in place on a detached recovered snapshot, preserving the older dirty checkout. Root alone owns integration, commits and GitHub changes.
