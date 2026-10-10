# MIDNIGHT V12 001

Short-form night supercar film inspired by the **mood and cinematography** of user's uploaded Lamborghini night reference (not copied footage), precisely timed to a separate **10.53s user-provided MP3**.

- Deliverable: **316 frames, 1080×1920, 30fps**, original supplied audio; ~11 genuinely unique moving shots.
- Approach: **real, licensed/authorised video** rather than expensive full-car CGI.
- Car priority: dark Lamborghini Aventador V12 / SVJ, with exact model verified by Scout A.
- Strong visual switch: **frame 77 / 2.567 seconds**.
- First deliverable is **Scout A's verified source-footage handoff**, not a premature full film.

## Important files
- [PRODUCTION_CONTRACT.md](PRODUCTION_CONTRACT.md)
- [beat-map.json](beat-map.json)
- [AGENT-A-FOOTAGE-SCOUT.md](agent-prompts/AGENT-A-FOOTAGE-SCOUT.md)
- [AGENT-B-EDITOR.md](agent-prompts/AGENT-B-EDITOR.md)
- [AGENT-C-LOOK-SOUND-QA.md](agent-prompts/AGENT-C-LOOK-SOUND-QA.md)
- [AGENT-D-MASTER.md](agent-prompts/AGENT-D-MASTER.md)

## Four-agent workflow
A scout and package actual permitted footage → B builds the edit → C produces cinematic FX/grade/audio QA → D merges, renders, watches and delivers. B and C have distinct file ownership. No agent starts merely because a GitHub branch exists.

## Source asset and soundtrack rule
The user's MP3 **does not live in this GitHub repository**. Agent D must receive the user's private audio attachment, confirm SHA listed in contract, and use that exact source for the final export. Do not put third-party audio in a public git commit. No raw video reuploads to public repo.

## Repo branch strategy
Project contract: `automotive-edits/midnight-v12-001/contract`.
Agent branches: `automotive-edits/midnight-v12-001/a-footage`, `/b-edit`, `/c-look-sound`, `/d-master` (full prefixes same).
