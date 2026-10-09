# Automotive Engineering — Automated production pipeline

Only use repository \`YunRah2103/Remotion-gpt-chat\`. **Never** access \`YunRah2103/yunus-video-lab\` or import YUNEX assets.

This is a set of real, reproducible production tools, not automatically running AI agents, nor a substitute for creating accurate 3D mechanical models.

## 1. From brief to verified native MP4

A project lives at \`production/videos/<slug>/\` with \`brief.json\`, \`shots.json\`, and \`voiceover.txt\`. It must link to an **implemented, registered** Remotion composition via \`sourceCompositionId\` and must not still be labelled \`preproduction\`.

Run locally:

\`\`\`bash
python production/tools/production_pipeline.py --project turbo-001
python production/tools/production_pipeline.py --project abs-001
\`\`\`

The first passes (existing TurboDocumentary); the second **intentionally fails** because ABS is currently a storyboard without a registered composition. This is correct; never report a finished ABS film from its brief alone.

For an approved voiceover with actual word timestamps, add the reviewed JSON to \`production/videos/<slug>/approved-words.json\`:

\`\`\`json
{"words":[{"word":"ABS","start":0.2,"end":0.55},{"word":"prevents","start":0.58,"end":0.95}]}
\`\`\`

The timestamps must come from *real narration audio* and review, not be invented. The existing \`production/studio/voice_sync.py\` can create an initial candidate from supplied audio. With that file, preflight uses the registered \`<CompositionID>Captioned\` composition and passes word timings as actual Remotion input props. Without a word-timing file, it renders the original film, unchanged.

Go to GitHub Actions → **Production - automated preflight, 3D proofs and final master**:
- Enter \`project: turbo-001\`, \`mode: proof\` for actual moving previews and full-framing stills.
- Choose \`mode: final\` for **five parallel frame-range renders**, stable concat, FFprobe frame checks, and full FFmpeg decode. Separate approved narration audio may be provided as a successful Actions run ID + exact artifact name together with reviewed word timestamps.
- Outputs stay in Actions artifacts and aren't automatically public Releases. A final technical pass is still not an independent visual or engineering approval.

Due to CPU software WebGL, large complex GLBs can still take substantial time. Five chunks divide work but don't create a GPU. The existing video compositions and GPU assets remain unchanged.

## 2. Real animated captions

Installed \`@remotion/captions@4.0.533\`, matching the pinned Remotion version. New registered wrappers:
- \`GpuDriveFilmCaptioned\`
- \`TurboDocumentaryCaptioned\`

These overlay active-word highlights with readable, restrained backgrounds and preserve the original composition. They are **opt-in**. The words come from actual reviewed \`words.json\` data, and the audio is independently muxed into the final MP4 when provided. No hidden TTS service, voice cloning or unrelated narrator is installed.

## 3. PR visual QA for the composition actually edited

\`.github/workflows/production-pr-review.yml\` invokes \`visual_plan.py\` and \`run_visual_review.py\`, selecting actual changed compositions from source paths and \`Root.tsx\`. It renders selected native still frames and a short moving clip for the candidate and comparable baseline, then publishes before/after reports. New compositions without a matching baseline still get candidate proof. Shared-source edits inspect the existing registered compositions. Metadata-only PRs receive a minimal registered-composition smoke check.

This is more useful than comparing \`GpuDriveFilm\` for every PR. Numeric pixel change is not aesthetic approval.

## 4. Agent coordination

Use GitHub custom profiles in \`.github/agents/\` plus these new specialized repository skills:
- \`.github/skills/engineering-production/SKILL.md\`
- \`.github/skills/mechanical-accuracy/SKILL.md\`
- \`.github/skills/agent-handoff/SKILL.md\`

Reusable Copilot prompts are in \`.github/prompts/\`. Submit or validate a concrete \`production/contracts/handoff.template.json\` copy with \`python production/tools/handoff.py <file>\`.

Skills and profiles **do not launch or install hosted AI workers**. Enabled GitHub Copilot agent access and explicitly assigned tasks are still needed. Separate branches and verified artifact identities remain mandatory.

## 5. Measured render performance

\`.github/workflows/production-benchmark.yml\` allows a small, safe benchmark of the same real composition using Remotion software WebGL at concurrency 1, 2 and 3. Measures wall time, peak RSS and successfully decoded frames on the same GitHub runner. All trials are bounded to up to 90 frames and 0.1–0.6 scale. Results are reports, not universal speed promises.

Local dry run:

\`\`\`bash
python production/tools/benchmark.py --composition GpuDriveFilm --frames 12 --levels 1,2,3 --dry-run
\`\`\`

## 6. Verification and constraints

\`\`\`bash
python -m unittest discover -s production/tests -v
npm ci --no-audit --no-fund
npm run check
\`\`\`

Use GitHub **Production Pipeline smoke** CI for actual Remotion caption rendering. Don't claim a true ABS final MP4 until its composition exists and its complete native final output has been reviewed. Do not auto-publish copyrighted reference media, purchased GPU runs or user-provided voice without permission.
