#!/usr/bin/env python3
"""Validate actual Agent A file-level 42-shot research metadata, NOT visual authenticity."""
import argparse,hashlib,json,math,re
from pathlib import Path

GENS=("E28","E34","E39","E60","F10","F90","G90")
SHA=re.compile("^[0-9a-f]{64}$")

def check(data,strict=False):
    if data.get("schemaVersion")!=1 or not isinstance(data.get("shots"),list) or len(data["shots"])!=42:
        raise ValueError("Exactly 42 M5 source slot records required")
    seen={}
    warnings=[]
    for i,s in enumerate(data["shots"]):
        gen=GENS[i//6]
        if s.get("slot")!=i+1 or s.get("generation")!=gen:
            raise ValueError(f"Incorrect chronology at slot {i+1}; expected {gen}")
        if not strict:continue
        if s.get("shotVerified") is not True or s.get("actualMotionVerified") is not True:
            raise ValueError(f"Unverified actual moving footage at slot {i+1}")
        for k in ("sourceId","sourceUrl","sourceSha256","inSeconds","outSeconds","sourceWidth","sourceHeight","sourceFps","visualAngle","modelEvidence"):
            if s.get(k) is None:raise ValueError(f"Missing {k} for slot {i+1}")
        if not SHA.fullmatch(str(s["sourceSha256"])):raise ValueError("Invalid SHA256")
        start,end=float(s["inSeconds"]),float(s["outSeconds"])
        if not math.isfinite(start) or not math.isfinite(end) or start<0 or end<=start:
            raise ValueError("Invalid source in/out")
        if float(s["sourceFps"])<23.9: warnings.append(f"Low fps in slot {i+1}")
        if int(s["sourceWidth"])<1080 or int(s["sourceHeight"])<1080:
            warnings.append(f"Low native source resolution slot {i+1}; inspect actual final framing")
        key=s["sourceSha256"]
        for a,b,j in seen.get(key,[]):
            if min(end,b)-max(start,a)>.03:raise ValueError(f"Overlapping reused source time windows: slots {j} and {i+1}")
        seen.setdefault(key,[]).append((start,end,i+1))
        # Explicit user-directed private rights review; must be documented, not fabricated.
        if not isinstance(s.get("rights"),str) or not s["rights"].strip():
            raise ValueError("Rights status/unknown must be recorded")
    return {"status":"PASS","slots":len(data["shots"]),"generations":list(GENS),
      "warnings":warnings,"validationLimit":"Metadata, chronology and source overlap only; actual video motion/identity must be visually verified"}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("manifest");p.add_argument("--require-ready",action="store_true")
    args=p.parse_args()
    print(json.dumps(check(json.loads(Path(args.manifest).read_text()),strict=args.require_ready),indent=2))
    # CI audits the NEW Agent A research board as well as the preserved 42-slot template.
    from prepare import validate_board
    validate_board()
    # Execute independent offline FFmpeg/FFprobe smoke tests in the same CI job.
    import subprocess,sys
    subprocess.run([sys.executable,str(Path(__file__).with_name("test_prepare.py"))],check=True)
