#!/usr/bin/env python3
"""Validate agent-A clip declaration: chronology, real source metadata, reuse overlap.
No machine can prove Porsche Turbo authenticity merely from JSON; watch footage.
"""
import argparse,json,math,re
from pathlib import Path
GEN=["930","964","993","996","997","991","992"]
EXPECTED=sum(([g]*n for g,n in zip(GEN,[4,4,4,4,4,5,5])),[])
SHA=re.compile(r"^[0-9a-f]{64}$",re.I)

def check(doc,strict):
    items=doc.get("shots")
    if doc.get("schemaVersion")!=1 or not isinstance(items,list) or len(items)!=30:
        raise ValueError("Expected exact 30-shot version-1 Porsche Turbo manifest")
    used=set()
    source_spans={}
    warnings=[]
    for i,s in enumerate(items):
        if s.get("slot")!=i+1 or s.get("generation")!=EXPECTED[i]:
            raise ValueError(f"Wrong generation order at slot {i+1}")
        if not strict:continue
        if s.get("verifiedMovingVideo") is not True or s.get("uniqueAngleVerified") is not True:
            raise ValueError(f"No real verified unique moving clip at slot {i+1}")
        keys=("sourceId","shotKey","sourceUrl","originCreator","sha256","width","height",
              "fps","sourceInSeconds","sourceOutSeconds","angleAndMotion",
              "actualTurboIdentityEvidence","sourceLicenseStatus","sourceTransferArtifact")
        for k in keys:
            if s.get(k) in (None,""):
                raise ValueError(f"Missing required real evidence {k} at slot {i+1}")
        if s["shotKey"] in used:raise ValueError("Reused visual shot key: "+s["shotKey"])
        used.add(s["shotKey"])
        if not SHA.fullmatch(str(s["sha256"])):raise ValueError("Invalid source SHA")
        w,h=int(s["width"]),int(s["height"])
        if w<640 or h<360:raise ValueError("Source too small even for vintage panel at "+str(i+1))
        if w<1920 and h<1080: warnings.append(f"slot {i+1}: limited native resolution; review zoom and crop")
        fps=float(s["fps"])
        start,end=float(s["sourceInSeconds"]),float(s["sourceOutSeconds"])
        if not all(math.isfinite(v) for v in (fps,start,end)) or fps<20 or start<0 or end<=start:
            raise ValueError("Invalid source fps/in-out at slot "+str(i+1))
        prev=source_spans.setdefault(s["sha256"],[])
        for lo,hi,n in prev:
            if min(hi,end)-max(lo,start)>.025:raise ValueError(f"Overlapping clip reuse slots {n} & {i+1}")
        prev.append((start,end,i+1))
    return {"status":"PASS","slots":len(items),"generations":GEN,"warnings":warnings,
      "scope":"Metadata and overlap checks. Authentic model identity, visible motion and unique scene require native visual proof."}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("file");p.add_argument("--require-ready",action="store_true")
    a=p.parse_args();print(json.dumps(check(json.loads(Path(a.file).read_text()),a.require_ready),indent=2))
