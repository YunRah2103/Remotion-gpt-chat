# YUNEX Cinematic Editor Toolkit V2

**For** YUNEX automotive edits in \`YunRah2103/Remotion-gpt-chat\`. This file complements the [six verified optional external tools](YUNEX_CINEMATIC_EDITING_TOOLS.md). Do not use the retired \`yunus-video-lab\` repository. Keep existing films, correct original soundtrack, approved footage, 1080x1920 output settings and Samsung S25 V4 untouched.

## Ready-to-use additions

| Tool | What is actually implemented | Scope / honest limitation |
| --- | --- | --- |
| \`production/toolkits/yunex_edit_audit.py\` | Working Python/FFmpeg CLI; black intervals, frozen frame holds, silence, dimensions, codec, optional full frame decode; JSON and Markdown report | Technical warnings only; intentional fades and static hero shots are allowed |
| Music accent shortlist (\`--music\`) | Detects strong energy transients at actual timestamps; never edits supplied audio | Not accurate beat/downbeat detection; use existing Beat This! for specialised beat tracking |
| \`src/yunex/CinematicTransition.tsx\` | Native Remotion \`dissolve\`, \`whip\` and \`soft-flash\` overlap, no new dependency | Editors must align both shots to the same sequence and visually validate motion |
| \`.github/workflows/yunex-editor-preflight.yml\` | Unit smoke on synthetic MP4, TypeScript check, optional analysis of a real existing Actions MP4/music artifact, downloadable report | Not automatic proof of film quality, public media rights or proper audio mix |

### Run locally

Requires Python 3, FFmpeg and FFprobe; no additional \`pip\` dependency:

\`\`\`bash
python production/toolkits/yunex_edit_audit.py \
  --video source-car-shot.mp4 --music supplied-track.mp3 \
  --mode source --output out/source-check
python production/toolkits/yunex_edit_audit.py \
  --video FINAL.mp4 --mode final --full-decode --output out/master-check
\`\`\`

Reports: \`preflight.json\` and \`preflight.md\`. \`--mode final\` warns when the target is not native vertical 1080x1920, is longer than 90s, or has no audio. The optional decode verifies video frames; audio is inspected for silence, not independently mastered. Original files are only read, never altered.

For existing GitHub Actions media: open the new **YUNEX editor preflight and transition checks** workflow, enter an existing media **run ID** + **exact artifact name** containing one MP4. Optionally enter a music run/artifact (one MP3/WAV/M4A). Run, then review the output artifact \`YUNEX-EDITOR-PREFLIGHT-<run ID>\` and Summary. The workflow deliberately does **not** include source media in the report download. For private phone-worker draft Releases first use the established \`.github/actions/yunex-v4-import\` bridge inside an appropriate editing job; this workflow consumes Actions artifacts, not draft Release URLs.

### Transition example

Use the component inside a \`Sequence\` lasting exactly the overlap, with both clip sources already aligned to that region. The component blends frames: it does **not** change the underlying source timings or original soundtrack.

\`\`\`tsx
import {Sequence} from 'remotion';
import {CinematicTransition} from './yunex/CinematicTransition';

// shotA and shotB already aligned over frame window [90, 101]
<Sequence from={90} durationInFrames={12}>
  <CinematicTransition
    outgoing={shotA} incoming={shotB}
    durationInFrames={12}
    kind="whip"
  />
</Sequence>
\`\`\`

For a classical Aston Martin film, favour strong framing, matched direction, hard cuts and subtle dissolves. For aggressive McLaren/P1/NASCAR edits, a short whip may work if direction and wheel positions match. \`soft-flash\` is deliberately restrained; do not use a flash on every beat. **Every effect requires a real rendered-video inspection**, especially fast-moving wheels, reflections and grille geometry.

## Which editing tools are worth the effort?

1. **PySceneDetect** (existing optional pack): inventory varied real source shots, avoid repeated takes and get actual in/out timecodes.
2. **New FFmpeg preflight**: inspect chosen source footage and final masters, verify accidental black/freeze/silence problems and full decode.
3. **Beat This!** (existing optional pack): specialised deep-learning beat/downbeat timestamps; treat as editorial guidance. Use our cheap audio energy cues for a fast cross-check.
4. **Native transition module** (new): controlled overlaps in Remotion, without extra dependencies.
5. **auto-editor** (existing pack): only a motion/activity shortlist, never the final editor.
6. **RIFE / Real-ESRGAN / GL shaders** (existing pack): only with proper runtime/rights and A/B QA of a specific difficult shot. Model/source downloads do not prove GPU functionality.

**One worthwhile later option:** official [\`@remotion/transitions\`](https://www.remotion.dev/docs/transitions/) for richer \`TransitionSeries\` effects. If installing, pin it to the repository's existing \`4.0.533\` Remotion versions and update the npm lockfile together. **It is not installed here** because the native code above delivers a ready-to-use subset without another dependency. Never introduce preset effects just to increase a tool count.

**Final standard:** actual full-length playable MP4; correct source car, original music timing, native user-requested format and visual/audio inspection. A successful toolkit smoke test does not certify a finished film.
