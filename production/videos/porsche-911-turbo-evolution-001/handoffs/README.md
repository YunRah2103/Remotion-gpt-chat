# Four-agent Porsche 911 Turbo Evolution handoff rules

Agents are NOT started by these Markdown files. User launches independent GPT-6 sessions using prepared A/B/C/D prompts. A, B, C may work in parallel; D integrates their verified handoffs and renders.

- A branch a-footage — owner research; only footage/** and handoffs/agent-a.*.
- B branch b-creative — owner director; only edit/**, src/porsche-turbo-evolution/edit/**, and handoffs/agent-b.*.
- C branch c-transitions — owner qa; only qa/**, src/porsche-turbo-evolution/polish/**, and handoffs/agent-c.*.
- D branch d-master — owner release; integration/central src/Root, audio, video, final artifact and handoffs/agent-d.*.

Each agent publishes a human-readable agent-letter.md plus agent-letter.json using production/tools/handoff.py schema:
schemaVersion 1; task; branch; sourceSha (actual 40 hex source commit); owner; summary; status (ready/blocked/review); files/evidence/blockers arrays.
Do NOT change status to ready until actual executable code, real proofs and needed source binary artifacts exist. A must supply 30 quality-reviewed real moving model-accurate clips; B can be ready as code subsystem but not final movie; C final visual QA is pending until real footage exists; D ready requires validated actual 510-frame MP4.
User original audio is in private ChatGPT editor pack, NOT automatically on GitHub. No public upload without rights.
