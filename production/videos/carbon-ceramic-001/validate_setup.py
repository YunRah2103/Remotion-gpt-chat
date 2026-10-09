#!/usr/bin/env python3
"""Fail-fast contract check for the five-agent carbon-ceramic film setup.

This verifies planning data and handoff state, NOT geometry, MP4s or aesthetics.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent
REPO = PROJECT.parents[2]
ROLES = {
    "a": ("hardware", "a-hardware"),
    "b": ("engineering", "b-motion-thermal"),
    "c": ("director", "c-cinema-xray"),
    "d": ("qa", "d-graphics-qa"),
}

def load(relative):
    return json.loads((PROJECT / relative).read_text(encoding="utf-8"))

def check():
    brief=load("brief.json")
    assert brief["slug"]=="carbon-ceramic-001", "Wrong film slug"
    assert brief["fps"]==30 and brief["durationSeconds"]==25, "Wrong film rate/duration"
    assert brief["durationInFrames"]==750 and brief["resolution"]==[1080,1920], "Wrong frame output contract"
    assert brief["status"] in ("preproduction","implemented"), "Invalid production state"
    if brief["status"]=="preproduction":
        assert brief["sourceCompositionId"] is None, "Do not claim a registered film before implementation"
    else:
        assert brief["sourceCompositionId"]=="CarbonCeramic001", "Expected real registered composition"
        assert 'id="CarbonCeramic001"' in (REPO/"src/Root.tsx").read_text(), "Film not registered"
    shots=load("shots.json")
    assert isinstance(shots,list) and len(shots)==5, "Exactly five approved shots"
    expected_start=0
    for shot in shots:
        assert shot["startFrame"]==expected_start, "Gap or overlap in shot timeline"
        assert isinstance(shot["endFrame"],int) and shot["endFrame"]>=expected_start, "Negative shot duration"
        assert all(isinstance(shot[k],str) and shot[k] for k in ("shot","visual","narrationCue")), "Empty shot"
        expected_start=shot["endFrame"]+1
    assert expected_start==750, "Shot plan does not cover all 750 frames"
    contract=(PROJECT/"PRODUCTION_CONTRACT.md").read_text()
    voice=(PROJECT/"VOICEOVER.md").read_text()
    assert "DO NOT model a complete car" in contract and "PREPRODUCTION" in voice.upper() or (
        "DO NOT model a complete car" in contract and "Narration audio is NOT committed" in voice
    ), "Missing no-full-car or honest audio contract"
    for name in ("MASTER","AGENT-A","AGENT-B","AGENT-C","AGENT-D"):
        path=PROJECT/"agent-prompts"/(name+".md")
        assert path.exists() and path.stat().st_size>800, "Missing substantial assigned prompt: "+name
    for key,(role,suffix) in ROLES.items():
        path=PROJECT/"handoffs"/("agent-"+key+".json")
        data=json.loads(path.read_text())
        assert data["branch"]=="automotive-brakes-001/"+suffix
        assert data["owner"]==role
        assert data["task"]=="carbon-ceramic-001-agent-"+key
        assert re.fullmatch("[0-9a-f]{40}",data["sourceSha"])
        subprocess.run([sys.executable,str(REPO/"production/tools/handoff.py"),str(path)],check=True,capture_output=True,text=True)
    print(json.dumps({"contract":"PASS","project":brief["slug"],"frameCount":750,
      "plannedShots":len(shots),"specialists":len(ROLES),
      "specialistHandoffs":[load("handoffs/agent-"+i+".json")["status"] for i in ROLES],
      "note":"PASS verifies planning contracts only, NOT animation, Blender model, video or QA signoff"},indent=2))

if __name__=="__main__":
    check()
