# Automotive Engineering Studio — additional production tools

These optional tools belong only in \`YunRah2103/Remotion-gpt-chat\`. Nothing is imported from or shared with YUNEX.

## Installed components

| Feature | Command or Actions workflow | Result |
| --- | --- | --- |
| Browsable reference gallery | \`studio.py gallery <media-bridge-artifact-folder> <output>\` | Self-contained index.html, cited sources and thumbnails; not automatically public |
| Model inspection | \`studio.py inspect <model.glb> <out>\` | Node tree, material and mesh inventory, SHA256; optional Blender native turntable workflow |
| Voice timestamps | \`voice_sync.py --audio <narration> --output <out>\` | Opt-in CPU faster-whisper word timings plus SRT/VTT/JSON; no speech generation |
| Mechanical diagnostics | \`studio.py telemetry <telemetry.csv> <out.json>\` | Wheel-slip and approximate suspension travel checks |
| Scene-change extraction | \`studio.py scenes <video.mp4> <out>\` | FFmpeg scene-score frames, capped; evenly spaced fallback |
| PR visual reviews | \`production-pr-review.yml\` | Generates baseline/current moving evidence and comparisons when supported |
| Model catalogue | \`studio.py register <model.glb> <metadata.json> <entry.json>\` | SHA-locked candidate metadata for human-reviewed asset registration |
| Engineering review specialist | \`.github/agents/engineering-review.agent.md\` | Cloud/IDE custom-agent instruction profile; availability depends on account |
| Other specialist agents | \`.github/agents/*.agent.md\` | Modeller, research, director specialists, not autonomous always-on workers |

## Model inspection workflow

Start GitHub Actions **Production Studio - inspect model** manually with a successful Actions asset run ID, exact artifact name and optional model file name. The run validates GLB structure, produces six real Blender CPU-rendered turntable views and a rotating MP4, then uploads the report as an artifact. Large assets are downloaded into the CI workspace, not tracked in Git.

## Voiceover workflow

Start GitHub Actions **Production Studio - narration timestamps** with the run ID and artifact name containing exactly one permitted existing narration audio file. The process uses optional \`faster-whisper\` CPU transcription. The model can download weights over the network on first use. **It can be slow and transcription can be wrong.** Inspect the resulting \`captions.srt\`, \`captions.vtt\`, and \`words.json\` before synchronising edits.

No voice cloning, synthetic voices, API keys or paid AI endpoints were installed.

## Reference gallery and scene extraction

Start **Production Studio - review media references**, specify the Media Bridge artifact's run ID, name and whether to create the gallery, cut-detection frames, or both. The result is an Actions artifact with index.html and PNG/JPEG views. Only source material with verified permission or licenses should be used in finished releases. Do not enable public reference-gallery publication automatically.

## Physics/engineering checks

A \`telemetry.csv\` may contain frame-derived rows:
\`\`\`csv
time_s,vehicle_speed_mps,wheel_omega_rad_s,wheel_radius_m,brake_pressure,spring_compression_m
0,20,65,0.31,0.2,0.0
0.1,19.5,62,0.31,0.7,0.03
\`\`\`
This tool provides **heuristics**, not verified road dynamics or scientific proof. Real ABS, steering, suspension and differential behavior must be checked against reliable engineering references by a knowledgeable reviewer.

## Reusable model metadata schema

\`\`\`json
{
  "id":"abs-front-caliper",
  "title":"Generic ventilated front disc and caliper",
  "units":"millimetres",
  "license":"Original artwork",
  "source":"Blender generator in this repository",
  "verified_by":"visual proof 2026-10-09",
  "animations":["piston travel"],
  "connection_points":["hub axis","piston axis"]
}
\`\`\`
The command emits a **candidate** manifest, including GLB SHA256, with \`status: candidate-for-manual-review\`. It does not invent verified models or automatically register a model that has not passed native visual and engineering review.

## Custom AI agents on GitHub

Files under \`.github/agents/\` are **GitHub Copilot custom agent profiles**, not continuously running background processes. You must have eligible GitHub Copilot cloud-agent access enabled to select them in GitHub's Agents tab or issue assignment. Separate custom agents can run sessions in parallel on separate branches; integration must still avoid conflicts. GitHub Actions executes deterministic scripts only; adding agent profiles does not secretly deploy independent AI workers or access an external AI service.

Your existing ChatGPT GitHub connector can continue reading/writing code through the repository regardless of GitHub Copilot availability.

## Verification

\`\`\`bash
python -m unittest discover -s production/tests -v
python -m compileall -q production/studio
\`\`\`

Tests cover offline reference gallery, native media scene selection with FFmpeg when installed, synthetic valid-GLB inspection, mock audio word alignment, a locked-wheel telemetry warning, and model metadata validation. The full native Blender movie and opt-in cloud transcription have separate workflows and should not be called validated until their actual CI jobs pass.

## Catalogue candidate workflow

The manually dispatched `production-studio-catalog.yml` accepts a successful model-build run/artifact and a committed metadata file under `production/mechanics/proposals/<id>.json`. It hashes and inspects the exact GLB, then uploads a candidate entry for review. The model does **not** become an approved reusable model until the engineering reviewer validates scale, anchors, license, native Blender proof and compatibility. This prevents blindly publishing a broken model.
