# Agent B - Porsche 911 Turbo Evolution edit

Owning branch: automotive-edits/porsche-911-turbo-evolution-001/b-creative.
Do not integrate A/C/D owned source files here.

## What is implemented

The native Remotion component PorscheTurboEvolutionFilm is in:
src/porsche-turbo-evolution/edit/PorscheTurboEvolutionFilm.tsx

- Exactly 30 shot sequences, 510 frames, 17.000 seconds and 30fps.
- Hard cut at each slot boundary. 7 changing plain-white generation labels at (70,145).
- A separate, type-checked timeline metadata adapter in edit/timeline.ts.
- Source origin URL, original SHA256, creator, identity evidence, motion evidence,
  unique clip/staged path, unique shotKey and visual fingerprint all mandatory.
- No repeated source time windows for the same original source SHA.
- Vintage/landscape source uses source-video dark moving background and native
  ratio in an unbordered central field; no fake SD high-resolution crop.
- Portrait source may occupy full height; a landscape fullBleed override requires
  an explicitly independently verified car-visible crop and x/y positioning.
- No effects on regular beats. Optional chapterEffects of form:
    [{generation:'964',style:'punch',strength:0.2}]
  invoke the INSTALLED BeatFxTransform component on the NEW clip only.
  Agent C chooses any optional use; hard cuts are the default.
- No mix of Porsche generations within crossfades, no extra typography, no UI,
  no audio included (private music is handled by Master D).

## D integration

Stage 30 ACTUAL independently reviewed moving Turbo/Turbo S videos in Remotion's
public/ path, locally on the render machine. NEVER commit unlicensed media.
Map each slot to StagedMedia, including local file and optional framing/crop.
Read real Agent A manifest and call:

  const entries = adaptAgentAManifest(agentAManifest, staged);
  const props = {mode:'production', shots:entries.map(e => e.shot)};
  // register PorscheTurboEvolutionFilm in Master-owned Root.tsx

If a single mandatory source is missing/incorrect, production validation THROWS.
Metadata assertions are not visual proof: D must SHA256 and FFprobe originals
and watch genuine distinct moving video for every beat before release.
The source manifest adapter refuses unfinished Agent A templates.

## Run native diagnostic proof in repository with pinned npm lock

  npm ci --no-audit --no-fund
  npm run check
  node production/videos/porsche-911-turbo-evolution-001/edit/test_timeline.mjs
  bash production/videos/porsche-911-turbo-evolution-001/edit/render_diagnostic_proofs.sh

The proof entry is src/porsche-turbo-evolution/edit/proof-entry.tsx.
Renders six diagnostic stills at representative 930, 993, 996, 997, 992
frames and two 14-frame moving cut tests (60-73, 200-213).
DIAGNOSTIC shows abstract moving shapes with a visible watermark saying
NO VERIFIED PORSCHE FOOTAGE. It is NOT a complete Porsche film.
Only Master D owns final music synchronization, native 1080x1920 video
integration, footage integrity QA, and private-review MP4 delivery.
