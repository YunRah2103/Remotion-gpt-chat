# Three-agent production handoff rules

Agent A is footage+generation identification; B is creative Remotion composition; C is master integration/render/quality control. They DO NOT start automatically; user launches 3 separate sessions.

Agent A owns its branch footage/** + handoffs/agent-a.* (owner research).
Agent B owns edit/** + src/bmw-m5-evolution/** + handoffs/agent-b.* (owner director).
Agent C owns central registration/rendering + handoffs/agent-c.* (owner release).

Use python production/tools/handoff.py production/videos/bmw-m5-evolution-001/handoffs/agent-X.json. Commit actual source first and cite immutable latest code SHA; handoff-only commit may follow. A ready handoff needs ALL 42 real unique source slots and accessible video artifacts; B readiness is its editor/code/native proof, not full finished video; C readiness requires real rendered media & visual QA. Keep blocked placeholders truthful.

**Audio is privately user supplied, not public GitHub.** Private-review only by default. Rights/attribution issues recorded, not invented.
