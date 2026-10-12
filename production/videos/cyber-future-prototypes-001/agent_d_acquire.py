#!/usr/bin/env python3
"""Physical-concept-car manufacturer download and honest technical QA."""
import csv, hashlib, json, re, subprocess, sys, urllib.request, zipfile
from pathlib import Path
ROOT=Path("out/CYBER-FUTURE-001-FOOTAGE-D")
RAW=Path("out/agent-d-raw")
for p in [ROOT,RAW,ROOT/"clips",ROOT/"contact_sheets"]:p.mkdir(parents=True,exist_ok=True)
accepted=[];rejected=[];sources=[]
LOTUS="https://wlt-p-001.sitecorecontenthub.cloud/api/public/content/d9ad5b60856f4908b5ec2d9d08c738ae?v=0658e2d0"
LOTUS_PAGE="https://www.lotuscars.com/en/press/news/lotus-unveils-theory-1-the-future-of-intelligent-performance"
PORSCHE="https://newsroom.porsche.com/en/press-kits/Porsche-Mission-X.html"
def sh(args,timeout=360):
    p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
    if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-500:])
    return p.stdout
def sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for b in iter(lambda:f.read(1048576),b""):h.update(b)
    return h.hexdigest()
def probe(path):
    data=json.loads(sh(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],60))
    v=next((s for s in data["streams"] if s.get("codec_type")=="video"),None)
    if v is None:raise RuntimeError("no_video")
    return dict(width=int(v["width"]),height=int(v["height"]),fps=v.get("avg_frame_rate"),codec=v.get("codec_name"),
      bitrate=data["format"].get("bit_rate"),duration=float(v.get("duration") or data["format"].get("duration") or 0),
      audio=any(s.get("codec_type")=="audio" for s in data["streams"]))
def hd(p):
    return p["width"]>=1920 and p["height"]>=1080 or p["height"]>=1920 and p["width"]>=1080
def get(url,dest,limit=1600*1024*1024):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Accept":"*/*"})
    with urllib.request.urlopen(req,timeout=60) as src,open(dest,"wb") as dst:
        total=0
        while True:
            b=src.read(2*1048576)
            if not b:break
            total+=len(b)
            if total>limit:raise RuntimeError("package_over_1.6GiB")
            dst.write(b)
    print("ACTUAL_BYTES",total,"MAGIC",open(dest,"rb").read(16).hex(),flush=True)
    if total<2048:raise RuntimeError("not_media")
    return {"url":url,"bytes":total,"sha256":sha(dest)}
def getcuts(f,p):
    if p["duration"]<3:return [(0,p["duration"])]
    try:
        e=sh(["ffmpeg","-hide_banner","-nostdin","-i",str(f),"-an","-vf",
          "fps=3,scale=480:-2,select='gt(scene,0.30)',showinfo","-f","null","-"],320)
    except Exception:
        e="" # showinfo writes to stderr, extracted below
    # A second call captures showinfo timestamps from stderr.
    x=subprocess.run(["ffmpeg","-hide_banner","-nostdin","-i",str(f),"-an","-vf",
          "fps=3,scale=480:-2,select='gt(scene,0.30)',showinfo","-f","null","-"],
          capture_output=True,text=True,timeout=320)
    cuts=[]
    for a in re.findall(r"pts_time:([0-9.]+)",x.stderr):
        v=float(a)
        if 1<v<p["duration"]-1 and (not cuts or v-cuts[-1]>1.8):cuts.append(v)
    marks=[0]+cuts+[p["duration"]]
    return [(a,b) for a,b in zip(marks,marks[1:]) if b-a>2.5] if cuts else [(0,p["duration"])]
def register(f,model,source_page,archive_url,credit,rights):
    try:
        src=probe(f)
        print("SOURCE_PROBE",f.name,json.dumps(src),flush=True)
        if not hd(src):raise RuntimeError("resolution_under_native_hd")
        if src["duration"]<2.5:raise RuntimeError("duration_too_short")
        sh(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-xerror",
            "-i",str(f),"-map","0:v:0","-f","null","-"],500)
        cuts=getcuts(f,src)
        print("SCENES",f.name,cuts[:12],flush=True)
        if not cuts:raise RuntimeError("zero_candidate_scenes")
        for a,b in cuts[:3]:
            t=min(4.0,b-a-0.2);start=a+0.1
            name=model.lower().replace(" ","_")+"_"+str(len(accepted)+1).zfill(2)+".mp4"
            out=ROOT/"clips"/name
            sh(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-ss",str(start),
               "-i",str(f),"-t",str(t),"-map","0:v:0","-map","0:a?",
               "-c:v","libx264","-preset","veryfast","-crf","17","-pix_fmt","yuv420p",
               "-c:a","aac","-b:a","192k","-movflags","+faststart","-y",str(out)],260)
            pr=probe(out)
            sh(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-xerror",
                "-i",str(out),"-f","null","-"],80)
            still=ROOT/"contact_sheets"/(out.stem+".jpg")
            sh(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-ss","1.0","-i",str(out),
                "-vf","scale=640:-2","-frames:v","1","-y",str(still)],90)
            accepted.append(dict(clip="clips/"+name,model=model,source_page=source_page,
                source_archive_url=archive_url,source_name=f.name,publisher=credit,
                true_physical_identity="PENDING_PER_SHOT_VISUAL_INSPECTION",
                movement_type="physical_studio_or_show_TENTATIVE",driving_proven=False,
                source_width=src["width"],source_height=src["height"],source_fps=src["fps"],
                source_codec=src["codec"],source_bitrate=src["bitrate"],clip_width=pr["width"],clip_height=pr["height"],
                in_seconds=round(start,3),out_seconds=round(start+t,3),clip_duration=pr["duration"],
                source_sha256=sha(f),clip_sha256=sha(out),original_audio=pr["audio"],
                contact="contact_sheets/"+still.name,permission_notes=rights,approval="MANUAL_REVIEW_REQUIRED"))
    except Exception as e:
        print("REJECTED",f.name,str(e),flush=True)
        rejected.append(dict(file=f.name,reason=str(e)[:400]))
def process_lotus():
    # Lotus public ZIP does not support HTTP range. One bounded full download.
    archive=RAW/"lotus_manufacturer_originals.zip"
    try:
        head=urllib.request.urlopen(urllib.request.Request(LOTUS,method="HEAD"),timeout=20)
        print("LOTUS_HEAD",head.status,"CONTENT_LENGTH",head.headers.get("Content-Length"),flush=True)
    except Exception as e:print("LOTUS_HEAD_UNAVAILABLE",repr(e),flush=True)
    meta=get(LOTUS,archive,limit=6*1024*1024*1024)
    sources.append(meta)
    if not zipfile.is_zipfile(archive):raise RuntimeError("Lotus download lacks zip signature")
    with zipfile.ZipFile(archive) as z:
        entries=[m for m in z.infolist() if Path(m.filename).suffix.lower() in
             {".mp4",".mov",".m4v",".mkv",".webm"} and 0<m.file_size<2800*1024*1024]
        entries=[m for m in entries if "__MACOSX" not in m.filename and not Path(m.filename).name.startswith("._")]
        print("LOTUS_ZIP_CATALOG_TOP",[(m.filename,m.file_size) for m in sorted(z.infolist(),key=lambda x:-x.file_size)[:35]],flush=True)
        print("LOTUS_ZIP_MOVIES",[(m.filename,m.file_size) for m in entries],flush=True)
        entries.sort(key=lambda x:(0 if "BROLL" in x.filename.upper() or "THEORY" in x.filename.upper() else 1,x.file_size))
        extracted=0
        for i,m in enumerate(entries):
            if i>=15 or extracted+m.file_size>3200*1024*1024:break
            path=RAW/("lotus_"+str(i)+"_"+re.sub(r"[^a-zA-Z0-9_.-]","_",Path(m.filename).name))
            with z.open(m) as src,open(path,"wb") as out:
                while True:
                    piece=src.read(1048576)
                    if not piece:break
                    out.write(piece)
            extracted+=path.stat().st_size
            print("LOTUS_ORIGINAL_FILE",path.name,path.stat().st_size,sha(path),flush=True)
            register(path,"Lotus Theory 1",LOTUS_PAGE,LOTUS,"Lotus Cars",
                "Lotus gallery says editorial/media use; other reuse unconfirmed")
def process_porsche():
    # Verbatim original native video URLs from Porsche's downloadable Mission X press PDF.
    # They are not inferred YouTube streams. Evaluate both since one may be a walkaround.
    originals=[
      "https://newstv.porsche.com/porschevideos/245385_en_3000000.mp4",
      "https://newstv.porsche.com/porschevideos/245346_en_3000000.mp4"]
    for idx,url in enumerate(originals):
        f=RAW/("porsche_missionx_original_"+str(idx)+".mp4")
        try:
            metadata=get(url,f,limit=900*1024*1024)
            metadata["publisher"]="Porsche Newsroom"
            sources.append(metadata)
            register(f,"Porsche Mission X",PORSCHE,url,"Porsche AG",
                "Official Porsche press source; social publishing permission not confirmed")
        except Exception as e:
            rejected.append(dict(file=url,reason="direct_download_failed:"+str(e)[:260]))
            print("PORSCHE_DIRECT_FAIL",url,repr(e),flush=True)
def process_cupra():
    # Public HQ original physical-showcar event video, carried by the publishing outlet.
    candidates=[
      "https://www.autobrava.lv/wp-content/uploads/2023/09/CUPRAs-DarkRebel-Showcar-makes-its-world-debut-at-the-Volkswagen-Group-Night-IAA-in-Munich_Video_HQ_Original-1.mp4",
      "https://i.bstr.es/highmotor/2023/09/CUPRAs-DarkRebel-Showcar-makes-its-world-debut-at-the-Volkswagen-Group-Night-IAA-in-Munich_Video_HQ_Original1.mp4"
    ]
    for i,url in enumerate(candidates):
        f=RAW/("cupra_darkrebel_event_"+str(i)+".mp4")
        try:
            meta=get(url,f,limit=1000*1024*1024)
            sources.append(meta)
            register(f,"CUPRA DarkRebel",
                "https://www.cupra.com/en/brand/news/cars/cupra-darkrebel-world-premiere",
                url,"CUPRA event video via Autobrava/Highmotor",
                "Photographed live Munich reveal; ownership/reuse for YUNEX not established")
            # These may be duplicates of one original event file; don't blindly count both.
            if accepted and any(v["model"]=="CUPRA DarkRebel" for v in accepted):break
        except Exception as e:
            rejected.append(dict(file=url,reason="download_failed:"+str(e)[:250]))
            print("CUPRA_SOURCE_FAIL",url,repr(e),flush=True)
def finish():
    (ROOT/"manifest.json").write_text(json.dumps(accepted,indent=2))
    with open(ROOT/"manifest.csv","w",newline="") as f:
        columns=list(accepted[0]) if accepted else ["clip","model"]
        w=csv.DictWriter(f,fieldnames=columns);w.writeheader();w.writerows(accepted)
    (ROOT/"rejections.json").write_text(json.dumps(rejected,indent=2))
    models=sorted({x["model"] for x in accepted})
    status="PARTIAL" if accepted else "BLOCKED"
    (ROOT/"QA_REPORT.json").write_text(json.dumps(dict(status=status,candidates=len(accepted),
       models=models,manual_approved=0,proven_driving=0,downloaded_archives=sources,
       caveat="Machine decode passed, not sufficient to establish physical authenticity or cinematic fitness"),indent=2))
    (ROOT/"README_START_HERE.md").write_text(
       "# YUNEX CYBER FUTURE 001 - D Radical source candidates\n\n"+
       "Gate "+status+"; "+str(len(accepted))+" scene candidates, "+", ".join(models)+
       ". Every candidate requires personal motion and physical-car frame review. "+
       "No CGI has been intentionally created, no footage was upscaled, and no vehicle is claimed to be driving. "+
       "Inspect contact_sheets and play each real clip. Rights statements in manifest.\n")
    print("FINAL_AGENT_D",json.dumps(dict(status=status,candidates=len(accepted),models=models,
          source_downloads=sources,rejections=rejected)),flush=True)
try:
    try:process_lotus()
    except Exception as e:
        rejected.append(dict(file=LOTUS,reason=str(e)[:300]))
        print("LOTUS_FAILURE",repr(e),flush=True)
    process_porsche()
    process_cupra()
finally:finish()
