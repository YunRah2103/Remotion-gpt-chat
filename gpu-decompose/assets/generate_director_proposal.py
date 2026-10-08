#!/usr/bin/env python3
"""Generate OR validate Agent A's optional readable explosion profile.
This does NOT alter the locked decomposition.json, and does NOT authorize a director release.
Usage:
 python gpu-decompose/assets/generate_director_proposal.py             # validate
 python gpu-decompose/assets/generate_director_proposal.py --write     # regenerate alternative
"""
import copy,json,pathlib,sys
root=pathlib.Path(__file__).resolve().parent
base=json.loads((root/"decomposition.json").read_text())
candidate=root/"decomposition-proposal-v2.json"
proposal=json.loads(candidate.read_text())
changes={
 "FAN_LEFT":[-.12,.025,.72], "FAN_CENTER":[0,.045,.74], "FAN_RIGHT":[.12,.025,.72],
 "FRONT_SHROUD":[0,.02,.39], "HEATSINK":[0,.05,.15],
 "GPU_DIE":[0,.005,.21], "VRAM_CHIPS":[0,0,.23],
 "PCB_ASSEMBLY":[0,-.02,-.20], "BACKPLATE":[0,0,-.75]}
assert base["fps"]==30 and base["durationInFrames"]==450
assert set(base["nodes"])==set(changes)==set(proposal["nodes"])
assert proposal["proposalMetadata"]["mustNotAutoIntegrate"]
generated=copy.deepcopy(base)
for name,position in changes.items():
 generated["nodes"][name]["to"]["position"]=position
 a=base["nodes"][name];b=generated["nodes"][name]
 assert a["startFrame"]==b["startFrame"] and a["endFrame"]==b["endFrame"]
 assert a["from"]==b["from"] and a["to"]["rotation"]==b["to"]["rotation"]
 assert a["easing"]==b["easing"]=="smoothstep"
 for f in range(450):
  t=max(0.,min(1.,(f-b["startFrame"])/(b["endFrame"]-b["startFrame"])))
  eased=t*t*(3-2*t)
  assert 0.<=eased<=1.
generated["proposalMetadata"]=proposal["proposalMetadata"]
if "--write" in sys.argv:
 candidate.write_text(json.dumps(generated,indent=2)+"\n")
 print("PROPOSAL_REGENERATED - no canonical files touched")
else:
 assert generated["nodes"]==proposal["nodes"],"Checked-in motion proposal differs from generator"
 print("PROPOSAL_SCHEMA_PASS: 9 anchors, 450 frames, canonical JSON unchanged")
