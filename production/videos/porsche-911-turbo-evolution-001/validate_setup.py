#!/usr/bin/env python3
"""Validate real Porsche Turbo seven-era planning contract and 30 frame-locked beats.

Successful planning CI is NEVER proof of source footage or final moving MP4.
"""
import json,subprocess,sys
from pathlib import Path

P=Path(__file__).resolve().parent
ROOT=P.parents[2]
G=["930","964","993","996","997","991","992"]
N=[4,4,4,4,4,5,5]
ROLES=[("a","research","a-footage"),("b","director","b-creative"),
       ("c","qa","c-transitions"),("d","release","d-master")]

def read(name):
    return json.loads((P/name).read_text(encoding="utf-8"))

def check():
    b=read("brief.json")
    m=read("beat-map.json")
    assert b["slug"]=="porsche-911-turbo-evolution-001"
    assert b["durationSeconds"]==17 and b["durationInFrames"]==510
    assert b["fps"]==30 and b["resolution"]==[1080,1920]
    assert b["sourceAudioSha256"]==m["audioSource"]["sha256"]
    assert b["masterAudioSha256"]==m["privateMaster"]["sha256"]
    assert m["audioSource"]["notCommittedToGitHub"] is True
    assert m["output"]["fps"]==30 and m["output"]["frames"]==510
    assert len(m["cuts"])==30 and len(m["generations"])==7
    assert [x["generation"] for x in m["generations"]]==G
    expected_start=0
    chapter_idx=0
    counts=[0]*7
    for i,shot in enumerate(m["cuts"]):
        if i>=sum(N[:chapter_idx+1]):chapter_idx+=1
        assert shot["slot"]==i+1 and shot["generation"]==G[chapter_idx]
        assert shot["startFrame"]==expected_start
        assert shot["durationFrames"]==shot["endFrame"]-shot["startFrame"]+1
        assert 12<=shot["durationFrames"]<=18
        counts[chapter_idx]+=1
        expected_start=shot["endFrame"]+1
    assert counts==N and expected_start==510
    assert [(x["startSlot"],x["endSlot"]) for x in m["generations"]]==[
       (1,4),(5,8),(9,12),(13,16),(17,20),(21,25),(26,30)]
    for letter,owner,suffix in ROLES:
        handoff=read("handoffs/agent-"+letter+".json")
        assert handoff["task"]=="porsche-911-turbo-evolution-001-agent-"+letter
        assert handoff["branch"]=="automotive-edits/porsche-911-turbo-evolution-001/"+suffix
        assert handoff["owner"]==owner
        subprocess.run([sys.executable,str(ROOT/"production/tools/handoff.py"),
                        str(P/"handoffs"/("agent-"+letter+".json"))],check=True,capture_output=True,text=True)
        prompt=P/"agent-prompts"/("AGENT-"+letter.upper()+".md")
        assert prompt.is_file() and prompt.stat().st_size>1500, "Prompt missing/substantially incomplete"
    manifest=read("footage/shot-manifest.template.json")
    assert manifest["status"]=="planning_template_no_footage" and len(manifest["shots"])==30
    assert all(s["generation"]==m["cuts"][i]["generation"] for i,s in enumerate(manifest["shots"]))
    assert all(s["verifiedMovingVideo"] is False for s in manifest["shots"])
    print(json.dumps({"type":"PLANNING CONTRACT ONLY","status":"PASS","frames":510,
                      "fps":30,"generationEras":G,"cuts":30,"agents":4,
                      "evidence":"ZERO completed agent handoffs / media sources / finished MP4 implied"},indent=2))

if __name__=="__main__":check()
