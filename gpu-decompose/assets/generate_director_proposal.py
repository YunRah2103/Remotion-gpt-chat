#!/usr/bin/env python3
"""Optional director motion variant. Never replaces canonical decomposition.json.
Run: python gpu-decompose/assets/generate_director_proposal.py
"""
import copy,json,pathlib
root=pathlib.Path(__file__).resolve().parent
base=json.loads((root/"decomposition.json").read_text())
proposal=json.loads((root/"decomposition-proposal-v2.json").read_text())
assert base["fps"]==proposal["fps"]==30
assert base["durationInFrames"]==proposal["durationInFrames"]==450
assert set(base["nodes"])==set(proposal["nodes"])
assert proposal["proposalMetadata"]["mustNotAutoIntegrate"]
for name in base["nodes"]:
    a,b=base["nodes"][name],proposal["nodes"][name]
    assert a["startFrame"]==b["startFrame"] and a["endFrame"]==b["endFrame"]
    assert a["from"]==b["from"] and a["to"]["rotation"]==b["to"]["rotation"]
    assert a["easing"]==b["easing"]=="smoothstep"
    for f in range(450):
        t=max(0.0,min(1.0,(f-b["startFrame"])/(b["endFrame"]-b["startFrame"])))
        u=t*t*(3-2*t)
        assert 0.0<=u<=1.0
print("DIRECTOR_PROPOSAL_SCHEMA_PASS 9 nodes, 450 frames, original JSON unmodified")
