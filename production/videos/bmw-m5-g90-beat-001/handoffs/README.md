# Two-agent cross-branch handoffs

Existing validator: python production/tools/handoff.py <jsonfile>.

Agent A research and source licensing -> handoffs/agent-a.json and .md, owner="research", branch "automotive-edits/bmw-m5-g90-001/a-footage".
Agent B final picture/editor/release -> handoffs/agent-b.json and .md, owner="director", branch "automotive-edits/bmw-m5-g90-001/b-editor-master".

Initial JSONs are BLOCKED placeholders. Only change status to READY when actual committed source and required real artifacts exist; provide real sourceSha, evidence and validation. If G90 footage isn't available with rights, A must report BLOCKED, not fill 39 slots with incorrect car clips. B cannot fake agent A's results. The two agents can start separately but B's final integration depends on verified A materials.
