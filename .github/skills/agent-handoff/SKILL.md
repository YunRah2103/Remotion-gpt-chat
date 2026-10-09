---
name: agent-handoff
description: Use when several specialist GitHub agents work on independent branches or a project needs a verified cross-agent handoff.
---

# Verified specialist handoffs

Work on separately named branches without modifying another specialist's files. A manager integrates exact source SHAs and approved artifacts.

All ready/blocked/review transfers use `production/contracts/handoff.template.json` adapted to the current task. Run `python production/tools/handoff.py path/to/handoff.json` before marking a delivery ready.

Required: exact SHA, source branch, agent owner, files changed, what was actually reviewed, artifact links, real blockers. A CI pass is not visual approval. Do not invent agent execution, shader results, model quality claims, or private media access.

Copilot skill and custom agent Markdown profiles do not launch autonomous workers. GitHub account eligibility and explicit execution are separate.
