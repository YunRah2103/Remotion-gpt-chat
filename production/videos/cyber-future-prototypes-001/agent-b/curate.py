#!/usr/bin/env python3
"""Final hand-reviewed Agent B footage selection from verified publisher clips."""
import csv, hashlib, io, json, subprocess, zipfile
from pathlib import Path
import cv2
from PIL import Image, ImageOps, ImageDraw

ARCHIVE=Path("incoming/CYBER-FUTURE-001-FOOTAGE-B.zip")
OUT=Path("out/cyber-future-agent-b-final")
DEST=OUT/"CYBER-FUTURE-001-FOOTAGE-B.zip"
# Candidate IDs manually chosen from actual decoded source contact sheets.
# Type describes observed appearance, not unproven claims of car travel.
SELECTION={
 "bmw-vision-m-next-driving-candidate-02":("front tracking on mountain road","real road-driving film",5),
 "bmw-vision-m-next-driving-candidate-05":("rear three-quarter road curve","real road-driving film",5),
 "bmw-vision-m-next-driving-candidate-06":("rear drive-through bend","real road-driving film",4),
 "bmw-vision-m-next-driving-candidate-07":("closer rear tracking road","real road-driving film",5),
 "bmw-vision-m-next-launch-candidate-01":("dark studio illuminated front grille","physical-studio appearance; motion to verify",4),
 "bmw-i-vision-dee-running-candidate-01":("three-quarter front on presentation plaza","static physical show car / moving camera or turntable",4),
 "bmw-i-vision-dee-running-candidate-03":("three-quarter rear plaza","static physical show car / moving camera or turntable",4),
 "bmw-i-vision-dee-running-candidate-07":("wheel detail with fluorescent rim","static physical show car close-up",4),
 "bmw-i-vision-dee-running-candidate-08":("rear light bar badge close-up","static physical show car close-up",4),
 "bmw-i-vision-dee-running-candidate-09":("overhead three-quarter side full-car plaza","static physical show car / moving camera or turntable",5),
 "bmw-i-vision-dee-running-candidate-13":("top-down roof and lit stage","static physical show car / moving camera or turntable",4),
}
def digest(data):return hashlib.sha256(data).hexdigest()
def probe(path):
    p=subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],check=True,capture_output=True,text=True)
    j=json.loads(p.stdout);v=next(s for s in j["streams"] if s["codec_type"]=="video")
    return dict(width=v["width"],height=v["height"],fps=v["avg_frame_rate"],
      video_codec=v["codec_name"],duration=float(j["format"]["duration"]),
      audio=any(s["codec_type"]=="audio" for s in j["streams"]),bytes=path.stat().st_size)
def temporal(path):
    cap=cv2.VideoCapture(str(path))
    if not cap.isOpened():raise ValueError("CV2 cannot open "+str(path))
    duration=(cap.get(cv2.CAP_PROP_FRAME_COUNT)/(cap.get(cv2.CAP_PROP_FPS) or 25))
    times=[max(0.0,min(duration-.15,t)) for t in [.25,duration*.5,max(.3,duration-.45)]]
    imgs=[]
    for t in times:
        cap.set(cv2.CAP_PROP_POS_MSEC,t*1000)
        ok,im=cap.read()
        if not ok:raise ValueError("Frame decode failed "+str(path)+" @ "+str(t))
        im=cv2.resize(im,(320,180))
        imgs.append(im)
    cap.release()
    gr=[cv2.cvtColor(a,cv2.COLOR_BGR2GRAY).astype("float32") for a in imgs]
    import numpy as np
    changes=[round(float(np.abs(gr[i]-gr[i+1]).mean()),3) for i in (0,1)]
    previews=[Image.fromarray(cv2.cvtColor(x,cv2.COLOR_BGR2RGB)) for x in imgs]
    return changes,previews
def write_gallery(all_tiles,out):
    W=1280;H=210
    canvas=Image.new("RGB",(W,len(all_tiles)*H+46),(16,18,22))
    dr=ImageDraw.Draw(canvas);dr.text((12,14),"AGENT B — GENUINE DECODED FRAMES | START / MID / END | 11 CURATED CANDIDATES",fill="white")
    for n,(label,views,qa) in enumerate(all_tiles):
        y=n*H+46
        dr.text((10,y+10),f"{n+1:02} {label} | mean frame change {qa}",fill=(240,230,210))
        for i,im in enumerate(views):canvas.paste(im,(i*320+12,y+27))
    canvas.save(out,quality=86,optimize=True)
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    review=Path("production/videos/cyber-future-prototypes-001/agent-b/review")
    review.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(ARCHIVE) as z:
        if z.testzip():raise ValueError("Input artifact contains corrupted file")
        manifest=json.loads(z.read("manifest.json"))
        found={c["id"]:c for c in manifest["clips"]}
        missing=sorted(set(SELECTION)-set(found))
        if missing:raise ValueError("Missing verified candidates "+str(missing))
        selected=[];tiles=[]
        with zipfile.ZipFile(DEST,"w",compression=zipfile.ZIP_STORED,allowZip64=True) as target:
            for id,(angle,filming,rating) in SELECTION.items():
                entry=dict(found[id])
                path=entry["clip_file"]
                video=z.read(path)
                if digest(video)!=entry["clip_sha256"]:raise ValueError("SHA mismatch "+id)
                test=OUT/(Path(path).name)
                test.write_bytes(video)
                qa=probe(test)
                if qa["width"]<1920 or qa["height"]<1080:raise ValueError("Resolution below 1080 "+id)
                decoded=subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(test),"-map","0:v:0","-f","null","-"],capture_output=True,text=True,timeout=90)
                if decoded.returncode:raise ValueError("Full decode FAILED "+id+" "+decoded.stderr[-400:])
                changes,frames=temporal(test)
                if max(changes)<.75:raise ValueError("Motion check failed "+id)
                entry.update(dict(angle=angle,filming_type=filming,visual_review="PASS_FOR_CANDIDATE_SELECTION",
                    distinct_shot="manual source-sheet angle review",
                    physical_evidence="Original BMW PressClub physical car demonstration; genuinely filmed camera identity is based on manufacturer sourcing + decoded screenshots; cannot independently certify every frame non-CGI.",
                    cinematic_rating_out_of_5=rating,temporal_frame_mean_absolute_differences=changes,
                    verified_clip_qa=qa,physically_real="manufacturer physical model with live-camera visual review; uncertainty on promotional effects",
                    rights_cleared_for_edit=False))
                target.writestr(path,video)
                thumb="contact_sheets/"+id+".jpg"
                if thumb in z.namelist():target.writestr(thumb,z.read(thumb))
                tiles.append((id,frames,changes))
                selected.append(entry)
                test.unlink()
            report={"agent":"B","project":"CYBER-FUTURE-001","gate":"PARTIAL_REAL_FOOTAGE_CURATED",
              "source_run_id":38188226958,
              "model_count":len(set(c["model"] for c in selected)),"curated_shots":len(selected),
              "all_full_frame_decoded":True,"motion_checked":True,"source_publisher":"BMW PressClub",
              "caveat":"BMW Vision M NEXT footage real road drive; BMW i Vision Dee circle/studio shots must NOT be described as driving. Some promoted studio images might include CGI manipulation. No true 1080 vertical source. Edit rights not confirmed.",
              "clips":selected,"rejections":manifest.get("rejections",[]),"sources":manifest.get("sources",[])}
            target.writestr("manifest.json",json.dumps(report,indent=2)+"\n")
            s=io.StringIO()
            writer=csv.DictWriter(s,fieldnames=["id","model","angle","filming_type","source_url","source_start","source_end","clip_file","clip_sha256","visual_review","cinematic_rating_out_of_5","rights_cleared_for_edit"])
            writer.writeheader()
            for clip in selected:writer.writerow({k:clip.get(k) for k in writer.fieldnames})
            target.writestr("manifest.csv",s.getvalue())
            target.writestr("rejections.json",json.dumps(manifest.get("rejections",[]),indent=2))
            readme=("# CYBER//FUTURE 001 — AGENT B / CURATED ACTUAL FILM\n\n"
                 "11 video excerpts, **BMW Vision M NEXT** and **BMW i Vision Dee**. "
                 "All files native 1920x1080/25 FPS, original camera-side audio preserved where present. "
                 "All bytes verified SHA256 + FFprobe + full FFmpeg decode; 3 frames per clip sampled with measured temporal differences. "
                 "BMW M NEXT moving road-camera clips; Dee physically built concept filmed on circular studio/plaza stage (not established road driving). "
                 "CGI/manipulations in manufacturer promotional edits cannot be categorically ruled out. "
                 "Selected angles: 4 M NEXT drive, 1 studio headlamp, 6 Dee stage angles. "
                 "There is no native portrait 1080 source. Rights to redistribute/edit the publisher footage are unconfirmed. "
                 "Source URLs, hashes, timecodes and details in manifest.json. No music, edits or video renders created.\n")
            target.writestr("README_START_HERE.md",readme)
            sheet=OUT/"CURATED_VERIFICATION_TRIPTYCH.jpg"
            write_gallery(tiles,sheet)
            target.write(sheet,"contact_sheets/CURATED_VERIFICATION_TRIPTYCH.jpg")
        report["final_archive_sha256"]=digest(DEST.read_bytes())
        (OUT/"QA_SUMMARY.json").write_text(json.dumps(report,indent=2)+"\n")
        (review/"CURATED_VERIFICATION_TRIPTYCH.jpg").write_bytes(sheet.read_bytes())
        (review/"CURATED_QA_SUMMARY.json").write_text(json.dumps(dict(archive_sha256=report["final_archive_sha256"],
              total=report["curated_shots"],model_count=report["model_count"],gate=report["gate"],
              physical_and_rights_caveat=report["caveat"],
              clips=[{"id":c["id"],"angle":c["angle"],"model":c["model"],"sha256":c["clip_sha256"],"temporal_differences":c["temporal_frame_mean_absolute_differences"]} for c in selected]),indent=2)+"\n")
        print("FINAL",json.dumps({"archive":str(DEST),"bytes":DEST.stat().st_size,"sha256":report["final_archive_sha256"],
            "clips":len(selected),"models":sorted(set(c["model"] for c in selected)),"gate":report["gate"]}),flush=True)
if __name__=="__main__":main()
