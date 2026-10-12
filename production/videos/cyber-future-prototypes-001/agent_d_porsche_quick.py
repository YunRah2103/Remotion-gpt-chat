#!/usr/bin/env python3
"""Fast second, independently verified physical Porsche official B-roll sampler."""
import csv,hashlib,json,subprocess,urllib.request
from pathlib import Path
root=Path("out/CYBER-FUTURE-001-FOOTAGE-D")
for p in (root,root/"clips",root/"contact_sheets",Path("out/raw")):p.mkdir(parents=True,exist_ok=True)
URL="https://newstv.porsche.com/porschevideos/245385_en_6000000.mp4"
F=Path("out/raw/porsche_mission_x_6mbps_original.mp4")
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def run(cmd,timeout=120):
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
    if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-600:])
    return p.stdout
entries=[];rej=[]
try:
    with urllib.request.urlopen(urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0"}),timeout=60) as stream,F.open("wb") as target:
        total=0
        while True:
            b=stream.read(1048576)
            if not b:break
            total+=len(b)
            if total>350*1048576:raise RuntimeError("source greater than 350 MiB")
            target.write(b)
    print("PORSCHE_REAL_DOWNLOAD",total,sha(F),flush=True)
    probe=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(F)],80))
    v=next(x for x in probe["streams"] if x["codec_type"]=="video")
    w=int(v["width"]);h=int(v["height"]);duration=float(probe["format"]["duration"])
    print("PORSCHE_NATIVE_SOURCE",w,h,v.get("avg_frame_rate"),duration,flush=True)
    if w<1920 or h<1080:raise RuntimeError(f"REJECT_BELOW_NATIVE_HD {w}x{h}")
    positions=[20,45,70,100,130,160,195]
    for i,t in enumerate(positions):
        if t+5>=duration:continue
        basename=f"porsche_mission_x_native_{i+1:02d}.mp4"
        clip=root/"clips"/basename
        run(["ffmpeg","-v","error","-nostdin","-ss",str(t),"-i",str(F),"-t","4",
             "-map","0:v:0","-map","0:a?","-c:v","libx264","-crf","18",
             "-preset","veryfast","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k",
             "-movflags","+faststart","-y",str(clip)],150)
        run(["ffmpeg","-v","error","-nostdin","-xerror","-i",str(clip),"-f","null","-"],40)
        pic=root/"contact_sheets"/basename.replace(".mp4",".jpg")
        run(["ffmpeg","-v","error","-ss","1.0","-i",str(clip),"-frames:v","1",
             "-vf","scale=640:-2","-q:v","3","-y",str(pic)],45)
        entries.append(dict(clip="clips/"+basename,contact="contact_sheets/"+pic.name,
            model="Porsche Mission X",source_page="https://newsroom.porsche.com/en/press-kits/Porsche-Mission-X.html",
            source_archive_url=URL,source_name=F.name,publisher="Porsche Newsroom",
            source_sha256=sha(F),clip_sha256=sha(clip),
            source_width=w,source_height=h,clip_width=w,clip_height=h,
            in_seconds=t,out_seconds=t+4,clip_duration=4,
            native_no_upscaling=True,original_audio=any(z["codec_type"]=="audio" for z in probe["streams"]),
            true_physical_identity="PENDING_PERSONAL_VISUAL_REVIEW",
            visual_approval="PENDING",driving_proven=False,
            permission_notes="Official Porsche press B-roll; unrestricted redistribution not established"))
        print("PORSCHE_REAL_CLIP",basename,clip.stat().st_size,flush=True)
except Exception as exc:
    print("PORSCHE_FAIL",str(exc),flush=True);rej.append({"source":URL,"reason":str(exc)})
(root/"manifest.json").write_text(json.dumps(entries,indent=2))
with (root/"manifest.csv").open("w",newline="") as f:
    fields=list(entries[0]) if entries else ["clip","model"]
    wtr=csv.DictWriter(f,fieldnames=fields);wtr.writeheader();wtr.writerows(entries)
(root/"rejections.json").write_text(json.dumps(rej,indent=2))
(root/"QA_REPORT.json").write_text(json.dumps({"status":"CANDIDATE_PENDING_VISUAL_REVIEW" if entries else "BLOCKED",
    "clips_verified_decodable":len(entries),"source":URL,"native_resolution":f"{w}x{h}" if entries else "unknown","rejections":rej},indent=2))
(root/"README_START_HERE.md").write_text("Porsche Mission X official real downloaded MP4. Clips are source intervals not final visual approvals. Real encoded frames decoded, no upscaling. See manifest, contact sheets and rejections. Rights not cleared for unrestricted redistribution.")
print("PORSCHE_QUICK_FINAL",len(entries),flush=True)
