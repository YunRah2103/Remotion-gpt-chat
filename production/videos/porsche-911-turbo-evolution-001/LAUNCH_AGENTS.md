# Four-agent Porsche 911 Turbo Evolution — launch prompts and verified tooling

The common baseline includes the **actual installed and tested FX toolkit** from PR #17 and the Porsche `PRODUCTION_CONTRACT.md` and `beat-map.json`. Tests proving installation are GitHub Actions runs [38053349617](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38053349617) and [38053603187](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38053603187), with real native MP4 and five real LUT renders. The production film itself is NOT yet made.

## One reusable launch prompt (send in four distinct ChatGPT sessions)

> You are GPT-6, **Agent [A/B/C/D]** for the Porsche 911 Turbo Evolution video.
>
> Repository: `YunRah2103/Remotion-gpt-chat`
>
> Your existing branch: `automotive-edits/porsche-911-turbo-evolution-001/[a-footage/b-creative/c-transitions/d-master]`
>
> First read `production/videos/porsche-911-turbo-evolution-001/agent-prompts/AGENT-[A/B/C/D].md`, `PRODUCTION_CONTRACT.md`, `beat-map.json`, and `production/fx/README.md`.
>
> Your mission is to complete your assigned production work with actual code, original or permitted real Porsche moving footage, and visually verifiable proof. Preserve 930 → 964 → 993 → 996 → 997 → 991 → 992, 30 unique genuine clips, 17.000 seconds, 510 frames, 1080×1920 at 30 FPS, a beat cut on every slot and tiny plain white generation labels in the top-left only. Use the already installed Cinematic FX Toolkit carefully. No repeated car shots, no fake 4K, no excessive compression, no tacky HUD.
>
> Work only in your owned files/branch, run real tests and native proofs, commit actual source, complete `handoffs/agent-X.json` and `.md` with verified SHA and artifact evidence; never invent work or claim success from a planning-only check. D is the Master integrating A/B/C and delivering the real finished private-review MP4 using separately supplied original WAV.
>
> Do the actual implementation and full GitHub handoff. Never access or modify `YunRah2103/yunus-video-lab`.

## Roles / precise branches / GitHub prompt files

| Agent | Responsibility | Branch | Prompt |
|---|---|---|---|
| A | 30 genuine moving Porsche Turbo shots, identity + source-quality verification, source provenance | `automotive-edits/porsche-911-turbo-evolution-001/a-footage` | `agent-prompts/AGENT-A.md` |
| B | Real 30-beat native Remotion montage + clean 930→992 chassis text, source/crop adapter | `automotive-edits/porsche-911-turbo-evolution-001/b-creative` | `agent-prompts/AGENT-B.md` |
| C | **FX expert:** match-cut chapter transitions, optional camera motion blur, .cube grading, source-sharpness verification and independent QA | `automotive-edits/porsche-911-turbo-evolution-001/c-transitions` | `agent-prompts/AGENT-C.md` |
| D | **MASTER:** verify three handoffs; integrate native video, rights/provenance, user's private audio, final real 510-frame 1080×1920 MP4, full FFmpeg decode & manual QA | `automotive-edits/porsche-911-turbo-evolution-001/d-master` | `agent-prompts/AGENT-D.md` |

## Artifacts and sound

- Original 17.058-second uploaded track is not in GitHub; user sends the private `Porsche_911_Turbo_Evolution_Private_Editor_Pack.zip` to Master Agent D.
- Inside the private pack, `Porsche_911_Turbo_Evolution_17s_48k_master.wav` SHA256 must be `39b8d7eef63b1c67cb14108484de8a63508149f64b6d3b84b7f7252dcd0bcdc9`; includes first-pass beat-map JSON/CSV.
- Agent C uses `src/fx/**` as READ-ONLY preinstalled shared toolkit; all new effect work goes in `src/porsche-turbo-evolution/polish/**`.
- No high-resolution footage or user music is embedded in the public Git tree. Agent A must supply a real accessible authorized/private-review source artifact. Preserve provenance, don't claim public redistribution clearance.
- Start A, B, and C independently; D can begin managing immediately, but final integration requires their verified handoffs and actual source bytes.
- Branches are aligned on a common source snapshot with the merged FX packages. GitHub Markdown instructions **do not spawn agent sessions automatically**.

## Independent FX tool-only test

Read and run `production/fx/TEST_PROMPT.md`. This is a fully separate diagnostic using **original abstract graphics**, not evidence that 30 real Turbo shots exist. Accepted FX-specific tests are a prerequisite, not a substitute for actual edited-film QA.
