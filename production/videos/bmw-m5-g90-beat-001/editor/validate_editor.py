#!/usr/bin/env python3
"""Strict 39-cut G90 edit preflight. Does not magically prove a car model or rights."""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parent
ROOT=HERE.parents[3]
MANIFEST=ROOT/"src/bmw-m5-g90-beat/shot-manifest.json"
MEDIA_ROOT=ROOT/"public/bmw-m5-g90-beat"
BEATS=PROJECT/"beat-map.json"
FPS=30
FRAMES=600

def check(cond, message):
    if not cond: raise RuntimeError(message)

def probe(path):
    p=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format",
        "-of","json",str(path)],capture_output=True,text=True,check=True)
    return json.loads(p.stdout)

def main():
    arg=argparse.ArgumentParser()
    arg.add_argument("--phase",choices=["planning","render","publish"],default="planning")
    arg.add_argument("--music-rights-evidence",default=None)
    arg.add_argument("--verify-sha",action="store_true")
    a=arg.parse_args()
    beat=json.loads(BEATS.read_text())
    frame_list=beat["beatCutFrames"]
    check(len(frame_list)==39 and frame_list[0]==0,"Expected precisely 39 beat slots beginning at frame zero")
    check(frame_list==sorted(set(frame_list)),"Cut grid is unsorted or contains duplicates")
    spans=[(frame_list[i],frame_list[i+1] if i+1<len(frame_list) else FRAMES) for i in range(39)]
    check(all(0<=start<end<=FRAMES for start,end in spans),"Beat ranges invalid")
    check(sum(end-start for start,end in spans)==600 and spans[-1][1]==599+1,"Timeline not exactly 600 frames")
    m=json.loads(MANIFEST.read_text())
    if a.phase=="planning":
        print(json.dumps({"planning":"PASS","licensedMediaReady":m.get("status")=="ready",
          "shotCount":len(m.get("shots",[])),"beatCount":39,
          "totalFrames":600,"sourceMusicCommitted":False},indent=2))
        return 0
    check(m.get("status")=="ready","Agent A footage is not READY; blocked rather than render substitute cars")
    shots=m.get("shots",[])
    check(len(shots)==39,"All 39 genuine verified G90 moving shots required")
    agent=m.get("agentA",{})
    check(agent.get("status")=="ready" and re.fullmatch(r"[0-9a-f]{40}",agent.get("sourceSha","")),
          "Missing verifiable Agent A ready handoff / commit SHA")
    check(bool(agent.get("footageEvidence")),"Missing independent proof of G90 source identity")
    license_by_id={l.get("id"):l for l in m.get("sourceLicenses",[])}
    check(len(license_by_id)>0,"Source licence evidence not supplied")
    ids=set()
    ranges={}
    metadata={}
    for i,shot in enumerate(shots):
        slot=i+1
        check(shot.get("slot")==slot,"Wrong slot on beat "+str(slot))
        sid=shot.get("shotId","")
        check(bool(sid) and sid not in ids,"Missing/duplicate shot ID at slot "+str(slot))
        ids.add(sid)
        file=shot.get("file","")
        check(bool(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*\.mp4",file)),
             "Unsafe or invalid MP4 filename at slot "+str(slot))
        source=MEDIA_ROOT/file
        check(source.is_file(),"Missing Agent A approved real video file: "+str(source))
        check(bool(shot.get("evidence")),"G90-generation visual evidence missing: "+sid)
        lic=license_by_id.get(shot.get("licenseId"))
        check(lic is not None and lic.get("publicUsePermitted") is True and
              all(lic.get(k) for k in ("sourceURL","creator","licenseTermsURL","licenseName")),
              "Verified TikTok/social video usage rights missing: "+sid)
        check(re.fullmatch("[0-9a-f]{64}",shot.get("sourceSHA256","")) is not None,
              "Source SHA256 missing for "+sid)
        if file not in metadata:
            metadata[file]=probe(source)
            streams=[s for s in metadata[file]["streams"] if s["codec_type"]=="video"]
            check(len(streams)>0,"Not a playable video file: "+file)
            v=streams[0]
            check(int(v.get("width",0))>=720 and int(v.get("height",0))>=720,
                  "Too low-resolution source: "+file)
            check(float(v.get("avg_frame_rate","0/1").split("/")[0])>0,
                  "Unknown video FPS: "+file)
        if a.verify_sha:
            actual=hashlib.file_digest(open(source,"rb"),"sha256").hexdigest()
            check(actual==shot["sourceSHA256"],"SHA256 mismatch "+file)
        speed=float(shot.get("playbackRate",0))
        check(0.5<=speed<=1.5,"Unrealistic clip speed at slot "+str(slot))
        insec=float(shot.get("inSeconds",-1))
        need=(spans[i][1]-spans[i][0])/FPS*speed
        limit=float(metadata[file]["format"].get("duration","0"))
        check(insec>=0 and insec+need<=limit-.04,
              "Source out point exceeds actual clip duration: "+sid)
        for coord in ["cropX","cropY"]:
            check(0<=float(shot.get(coord,-1))<=100,"Invalid video crop at "+sid)
        source_id=shot.get("sourceId",file)
        ranges.setdefault(source_id,[]).append((insec,insec+need,sid))
        if i and shot.get("angle")==shots[i-1].get("angle"):
            raise RuntimeError("Adjacent slots repeat exact same angle label: "+sid)
    for source_id,rs in ranges.items():
        rs.sort()
        for prev,nxt in zip(rs,rs[1:]):
            check(nxt[0]>=prev[1]-.02,"Source segment reused/overlapped: "+prev[2]+"/"+nxt[2])
    if a.phase=="publish":
        check(a.music_rights_evidence is not None,"Public release blocked without music rights")
        rights=Path(a.music_rights_evidence)
        check(rights.is_file() and rights.stat().st_size>100,
              "Missing explicit permission/license evidence for music public distribution")
    print(json.dumps({"preflight":"PASS","phase":a.phase,"frames":600,
      "beatCuts":39,"files":len(metadata),"shots":len(shots),
      "visualGenerationVerifiedBy":"Agent A evidence + mandatory B manual visual review",
      "audioDistributionAuthorized":a.phase=="publish"},indent=2))
    return 0

if __name__=="__main__":
    try:sys.exit(main())
    except Exception as e:
        print("BLOCKED:",e,file=sys.stderr)
        sys.exit(2)
