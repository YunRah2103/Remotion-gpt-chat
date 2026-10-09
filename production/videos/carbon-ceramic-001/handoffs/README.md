# Strict handoff policy

Each assigned agent edits only handoffs/agent-[letter].json and handoffs/agent-[letter].md on its own branch, documenting source commit, files, actual proof and blockers. The files initially remain clearly marked BLOCKED; they are placeholders, not fake completed outputs.

The existing repository handoff validator requires schemaVersion=1; owner in {research,hardware,engineering,director,qa,release}; status in {ready,blocked,review}; sourceSha a full real 40-character SHA; files/evidence/blockers arrays. Status ready requires actual nonempty evidence. Agent A owner=hardware, B=engineering, C=director, D=qa, E=engineering (integration); Master is release owner.

Use git SHA from your own produced source revision, not the common base if you have changed code. For ready state, include GitHub workflow run ID/artifact link where available and preserve an inspection summary; don't claim an MP4 exists until checked. The handoff file commit may follow its cited code commit.

Run python production/tools/handoff.py <your handoff JSON>. Integrator E preserves the exact A–D source evidence, integrates only verified code and produces actual native moving proofs. Master must refuse release readiness for blocked/review handoffs; Master reviews E's actual proof, integrates its PR and performs final independent render/QA. An E handoff stays blocked/review until runnable original source, moving proofs and honest hardware/GLB status are documented.
