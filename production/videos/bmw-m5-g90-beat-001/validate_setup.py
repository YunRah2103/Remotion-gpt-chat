#!/usr/bin/env python3
"""Validate two-agent G90-only preproduction contract and the exact 600-frame cut grid.

Contract checks are not footage/authenticity, audio rights, or video render sign-off.
"""
from pathlib import Path
import json
import subprocess
import sys
P=Path(__file__).resolve().parent
ROOT=P.parents[2]
def load(name):
    return json.loads((P/name).read_text())
def check():
    brief=load("brief.json")
    beats=load("beat-map.json")
    assert brief["slug"]=="bmw-m5-g90-beat-001"
    assert brief["status"]=="preproduction"
    assert brief["car"]["generation"]=="G90" and brief["car"]["body"]=="saloon/sedan"
    assert brief["durationSeconds"]==20 and brief["durationInFrames"]==600
    assert brief["fps"]==30 and brief["resolution"]==[1080,1920]
    assert beats["selection"]["durationSeconds"]==20
    assert beats["selection"]["totalFrames"]==600 and beats["selection"]["videoFPS"]==30
    assert beats["audioSource"]["publicRedistributionRights"]=="unverified"
    assert beats["cutCount"]==39 and len(beats["cuts"])==39
    frames=beats["beatCutFrames"]
    assert frames[0]==0 and frames[-1]<600
    assert len(frames)==39 and len(set(frames))==39
    assert all(14 <= frames[i+1]-frames[i] <= 18 for i in range(len(frames)-1)), "Suspect rhythmic cut spacing"
    for i,c in enumerate(beats["cuts"]):
        assert c["frame"]==frames[i] and c["index"]==i+1
        assert c["endFrame"]==(frames[i+1]-1 if i<38 else 599)
        assert c["endFrame"]>=c["frame"]
    assert sum(c["endFrame"]-c["frame"]+1 for c in beats["cuts"])==600
    for letter,role,suffix in (("a","research","a-footage"),("b","director","b-editor-master")):
        data=load("handoffs/agent-"+letter+".json")
        assert data["branch"]=="automotive-edits/bmw-m5-g90-001/"+suffix
        assert data["owner"]==role and data["task"]=="bmw-m5-g90-beat-001-agent-"+letter
        subprocess.run([sys.executable,str(ROOT/"production/tools/handoff.py"),str(P/"handoffs"/("agent-"+letter+".json"))],check=True)
        file=P/"agent-prompts"/("AGENT-"+letter.upper()+".md")
        assert file.is_file() and len(file.read_text())>750
    print(json.dumps({"contract":"PASS","car":"BMW M5 G90 saloon ONLY","frames":600,"detectedBeatCuts":len(frames),"agents":2,"status":"PREPRODUCTION, no footage/audio rights/render QA implied"},indent=2))
if __name__=="__main__":
    check()
