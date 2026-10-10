#!/usr/bin/env python3
"""Honest planning-only checks for BMW M5 seven-generation beat edit."""
import json,subprocess,sys
from pathlib import Path

P=Path(__file__).resolve().parent
ROOT=P.parents[2]
GENS=("E28","E34","E39","E60","F10","F90","G90")
YEARS=(1985,1988,1998,2005,2011,2017,2024)

def load(name):
    return json.loads((P/name).read_text(encoding="utf-8"))

def validate():
    b=load("brief.json")
    grid=load("beat-map.json")
    assert b["slug"]=="bmw-m5-evolution-001"
    assert b["fps"]==30 and b["durationInFrames"]==552 and b["resolution"]==[1080,1920]
    if b["status"]=="preproduction":
        assert b["sourceCompositionId"] is None
    else:
        assert b["status"]=="existing-composition" and b["sourceCompositionId"]=="BmwM5Evolution001"
        assert 'id="BmwM5Evolution001"' in (ROOT/"src/Root.tsx").read_text(), "Missing actual registered film"
    assert [g["generation"] for g in b["generations"]]==list(GENS)
    assert [g["introduced"] for g in b["generations"]]==list(YEARS)
    assert len(grid["cuts"])==42
    assert grid["sourceAudio"]["sha256"]=="747ef310fd083128819df199a87e95b9d107a73cb4ea393cc28094d000d245de"
    assert grid["privateAudioMaster"]["sha256"]=="47713ca53679b6011f7482232092daa4414e11a0e5c598007bf3fef31b5bb449"
    assert grid["output"]["frames"]==552 and grid["output"]["fps"]==30
    frame=0
    for i,s in enumerate(grid["cuts"]):
        assert s["slot"]==i+1
        assert s["startFrame"]==frame
        assert s["generation"]==GENS[i//6]
        assert s["generationYear"]==YEARS[i//6]
        assert s["durationFrames"]==s["endFrame"]-s["startFrame"]+1
        assert s["durationFrames"]>0
        if i>0:assert 10 <= s["durationFrames"] <= 18, "Unexpected music beat interval"
        frame=s["endFrame"]+1
    assert frame==552
    for i,chapter in enumerate(grid["chapters"]):
        assert chapter["generation"]==GENS[i]
        assert chapter["slotRange"]==[i*6+1,i*6+6]
        assert chapter["startFrame"]==grid["cuts"][i*6]["startFrame"]
        assert chapter["endFrame"]==grid["cuts"][i*6+5]["endFrame"]
    temp=load("footage/source-manifest.template.json")
    assert len(temp["shots"])==42 and temp["status"]=="template_no_assets_collected"
    assert all(not s["shotVerified"] for s in temp["shots"]), "No invented preproduction source proof"
    for letter,owner,suffix in (("a","research","a-footage"),("b","director","b-creative"),("c","release","c-master")):
        h=load("handoffs/agent-"+letter+".json")
        assert h["task"]=="bmw-m5-evolution-001-agent-"+letter
        assert h["branch"]=="automotive-edits/bmw-m5-evolution-001/"+suffix
        assert h["owner"]==owner
        subprocess.run([sys.executable,str(ROOT/"production/tools/handoff.py"),str(P/"handoffs"/("agent-"+letter+".json"))],check=True,capture_output=True,text=True)
        prompt=P/"agent-prompts"/("AGENT-"+letter.upper()+".md")
        assert prompt.is_file() and prompt.stat().st_size>1200
    print(json.dumps({"result":"PASS","type":"planning contract only","generations":list(GENS),"countCuts":42,"durationFrames":552,"fps":30,"agents":3,
       "status":"PREPRODUCTION; no real footage, audio artifact in GitHub or final MP4 has been demonstrated"},indent=2))

if __name__=="__main__":
    validate()
