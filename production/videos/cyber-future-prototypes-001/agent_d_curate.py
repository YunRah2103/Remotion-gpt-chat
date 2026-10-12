#!/usr/bin/env python3
"""Merge and manually curate verified original-file clips from GitHub artifact sources."""
import csv,hashlib,json,shutil,subprocess
from pathlib import Path
S=Path("production/videos/cyber-future-prototypes-001/AGENT_D_SELECTION.json")
C=json.loads(S.read_text())
OUT=Path("out/CYBER-FUTURE-001-FOOTAGE-D")
for p in (OUT,OUT/"clips",OUT/"contact_sheets"):p.mkdir(parents=True,exist_ok=True)
BASE={"lotus":Path("incoming/lotus"),"porsche":Path("incoming/porsche")}
manifests={key:{Path(x["clip"]).name:x for x in json.loads((root/"manifest.json").read_text())}
 for key,root in BASE.items()}
rows=[]
for item in C["approved"]:
    label=item["source"]; basename=item["clip"]; root=BASE[label]
    assert label in BASE and basename in manifests[label],(label,basename)
    row=dict(manifests[label][basename])
    src=root/row["clip"]; target=OUT/"clips"/basename
    digest=hashlib.sha256(src.read_bytes()).hexdigest()
    if digest!=row["clip_sha256"]:raise RuntimeError(f"SHA mismatch {basename}")
    assert int(row["source_width"])>=1920 and int(row["source_height"])>=1080
    shutil.copy2(src,target)
    rawcontact=root/row["contact"]
    shutil.copy2(rawcontact,OUT/"contact_sheets"/basename.replace(".mp4",".jpg"))
    command=["ffmpeg","-nostdin","-v","error","-xerror","-i",str(target),"-f","null","-"]
    check=subprocess.run(command,capture_output=True,text=True,timeout=180)
    if check.returncode:raise RuntimeError("Decoder failed "+basename+": "+check.stderr[-200:])
    row["clip"]="clips/"+basename
    row["contact"]="contact_sheets/"+basename.replace(".mp4",".jpg")
    row["visual_approval"]="PASS_MANUALLY_REVIEWED_CONTACT_FRAMES"
    row["visual_note"]=item["visual_note"]
    row["reality_confidence"]=item["physical_evidence"]
    row["actual_vehicle_motion"]=item.get("actual_vehicle_motion","not_proven")
    row["driving_proven"]=False
    rows.append(row)
    print("INCLUDED_REAL_MEDIA",basename,digest,row["source_width"],row["source_height"],flush=True)
models=sorted({x["model"] for x in rows})
assert len(rows)>=5, "Hard fail: too few clips"
status="PASS_TWO_PHYSICAL_MODELS" if len(models)>=2 and len(rows)>=8 else "PARTIAL_NOT_FULL_GATE"
with (OUT/"manifest.json").open("w") as f:json.dump(rows,f,indent=2)
with (OUT/"manifest.csv").open("w",newline="") as f:
    wr=csv.DictWriter(f,fieldnames=list(rows[0]));wr.writeheader();wr.writerows(rows)
rejections=C["rejected"]
(OUT/"rejections.json").write_text(json.dumps(rejections,indent=2))
source_files=list((OUT/"clips").glob("*.mp4"))+list((OUT/"contact_sheets").glob("*.jpg"))
(OUT/"SHA256SUMS.txt").write_text("\n".join(
    hashlib.sha256(p.read_bytes()).hexdigest()+"  "+p.relative_to(OUT).as_posix()
    for p in sorted(source_files))+"\n")
report=dict(status=status,visually_approved_clips=len(rows),models=models,
    specifications="Original native 1920x1080 or 4096x2160; NO upscaling",
    file_decoding_verified=True,checksums_written=True,
    visually_checked_contact_frames=True,proven_driving_clips=0,
    rights="Editorial/source conditions recorded per clip; social publishing permissions NOT assumed",
    rejected=rejections)
(OUT/"QA_REPORT.json").write_text(json.dumps(report,indent=2))
(OUT/"README_START_HERE.md").write_text(
    "# YUNEX CYBER//FUTURE 001 — Agent D Radical physical concept-car footage\n\n"+
    f"Gate: **{status}**. **{len(rows)}** individually decoded and manually still-inspected camera clips from {', '.join(models)}.\n\n"+
    "Actual MP4s: clips/; source/clip SHA and in/out points: manifest.json and SHA256SUMS.txt; "+
    "image evidence: contact_sheets/; rejection rationale: rejections.json; report: QA_REPORT.json.\n\n"+
    "Real manufacturer/media physical-showcar source, not AI generated or upscaled. "+
    "Vehicle driving not claimed. Some source footage contains studio camera moves rather than driven cars. "+
    "Retain source credit and separately clear rights before unrestricted reposting.\n")
print("CURATED_PACKAGE",json.dumps({"status":status,"count":len(rows),"models":models}),flush=True)
