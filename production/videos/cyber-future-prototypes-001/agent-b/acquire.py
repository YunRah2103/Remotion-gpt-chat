#!/usr/bin/env python3
"""Agent B: acquire real publisher footage. All selections remain PENDING visual approval."""
import csv, hashlib, io, json, os, re, shutil, subprocess, sys, time, urllib.request, zipfile
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path("out/cyber-future-agent-b")
SRC=ROOT/"sources"
CLIPS=ROOT/"clips"
CONTACTS=ROOT/"contact_sheets"
REVIEW=Path("production/videos/cyber-future-prototypes-001/agent-b/review")
NAME="CYBER-FUTURE-001-FOOTAGE-B"
SOURCE_LIST=[
 {"id":"bmw-i-vision-dee-running","model":"BMW i Vision Dee","publisher":"BMW PressClub",
  "url":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009271/bmw-i-vision-dee-running-footage-exterior-interior",
  "page":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009271/bmw-i-vision-dee-running-footage-exterior-interior",
  "method":"bmw-scene","rights":"BMW PressClub actual running camera footage; edit/redistribution permission unconfirmed"},
 {"id":"bmw-i-vision-dee-exterior","model":"BMW i Vision Dee","publisher":"BMW PressClub",
  "url":"https://mediapool.bmwgroup.com/download/edown/tvFootageDownload.mov?actEvent=tvFootageMovHd&attachment=1&dokNo=PF0009272",
  "page":"https://www.press.bmwgroup.com/global/video/detail/PF0009272/bmw-i-vision-dee-design-exterieur",
  "method":"direct","rights":"BMW PressClub published film; editorial vs edit/redistribution rights unconfirmed"},
 {"id":"bmw-i-vision-dee-e-ink","model":"BMW i Vision Dee","publisher":"BMW PressClub",
  "url":"https://mediapool.bmwgroup.com/download/edown/tvFootageDownload.mov?actEvent=tvFootageMovHd&attachment=1&dokNo=PF0009288",
  "page":"https://www.press.bmwgroup.com/global/video/detail/PF0009288/bmw-i-vision-dee-featuring-e-ink",
  "method":"direct","rights":"BMW PressClub published film; editorial vs edit/redistribution rights unconfirmed"},
 {"id":"mercedes-amg-gt-xx-embedded","model":"Mercedes-AMG Concept GT XX","publisher":"e-auto.pt (embedded vehicle footage; origin not independently established)",
  "url":"https://video.wixstatic.com/video/f84172_da8b552d8bad46f0be79ae4d992ac7de/1080p/mp4/file.mp4",
  "page":"https://www.e-auto.pt/post/mais-de-1360-cv-no-amg-gt-xx","method":"direct",
  "rights":"Publisher embedded MP4, original rights and reuse not established; MUST inspect for GT XX identity and CGI"},
 {"id":"bmw-vision-m-next-driving","model":"BMW Vision M NEXT","publisher":"BMW PressClub",
  "url":"https://mediapool.bmwgroup.com/download/edown/tvFootageDownload?actEvent=tvFootageSceneHD&attachment=1&filmSceneFileId=18095",
  "page":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0006947/bmw-vision-m-next","method":"direct",
  "rights":"BMW PressClub published footage; redistribution/edit rights unconfirmed"},
 {"id":"bmw-vision-m-next-launch","model":"BMW Vision M NEXT","publisher":"BMW PressClub",
  "url":"https://mediapool.bmwgroup.com/download/edown/tvFootageDownload.mov?actEvent=tvFootageMovHd&attachment=1&dokNo=PF0006960",
  "page":"https://www.press.bmwgroup.com/united-kingdom/video/detail/PF0006960/bmw-vision-m-next-launch-film","method":"direct",
  "rights":"BMW PressClub published film; redistribution/edit rights unconfirmed; animation may appear"},
 {"id":"audi-concept-c-dynamic","model":"Audi Concept C","publisher":"Audi Denmark via Mynewsdesk",
  "url":"https://www.mynewsdesk.com/dk/audi-danmark/videos/audi-concept-c-footage-dynamic-121552/download",
  "page":"https://www.mynewsdesk.com/dk/audi-danmark/videos/audi-concept-c-footage-dynamic-121552","method":"direct",
  "rights":"Audi Denmark media-use terms specify unedited publication in full; not cleared for edited montage"},
 {"id":"audi-concept-c-dynamic-vertical","model":"Audi Concept C","publisher":"Audi AG",
  "url":"https://www.audi.com/en/videos/video/audi-concept-c-footage-dynamic-vertical-8048",
  "page":"https://www.audi.com/en/videos/video/audi-concept-c-footage-dynamic-vertical-8048","method":"yt-dlp",
  "rights":"Audi AG footage; edit/reuse permission unconfirmed"},
 {"id":"audi-concept-c-dynamic-landscape","model":"Audi Concept C","publisher":"Audi AG",
  "url":"https://www.audi.com/en/videos/video/audi-concept-c-footage-dynamic-8049",
  "page":"https://www.audi.com/en/videos/video/audi-concept-c-footage-dynamic-8049","method":"yt-dlp",
  "rights":"Audi AG footage; edit/reuse permission unconfirmed"},
]
def run(args, timeout=90, check=True):
    return subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout,check=check)
def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
    return h.hexdigest()
def probe(path):
    p=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]).stdout)
    v=next((s for s in p["streams"] if s["codec_type"]=="video"),None)
    if not v:raise ValueError("No video stream")
    w,h=int(v["width"]),int(v["height"])
    from fractions import Fraction
    d=float(p["format"].get("duration") or v.get("duration") or 0)
    return dict(width=w,height=h,orientation="portrait" if h>w else "landscape",
      source_native_vertical_1080=(w>=1080 and h>=1920),
      min_1080_pass=((w>=1920 and h>=1080) if w>=h else (w>=1080 and h>=1920)),
      max_4k_preferred=(w<=3840 and h<=2160) if w>=h else (w<=2160 and h<=3840),
      duration=round(d,3),fps=str(v.get("avg_frame_rate") or v.get("r_frame_rate")),
      codec=v.get("codec_name"),bit_rate=p["format"].get("bit_rate"),
      audio=any(s["codec_type"]=="audio" for s in p["streams"]),
      bytes=path.stat().st_size)
def get_direct(url, path):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; press-acquisition/1.0)","Accept":"video/*,*/*;q=0.8"})
    with urllib.request.urlopen(req,timeout=45) as r,open(path,"wb") as f:
        ctype=r.headers.get("Content-Type","")
        total=0
        while True:
            chunk=r.read(1024*1024)
            if not chunk:break
            total+=len(chunk)
            if total>1450*1024*1024:raise ValueError("Source over 820MB limit")
            f.write(chunk)
        print("DIRECT",r.status,ctype,total,flush=True)
        if total<100*1024 or ("text/html" in ctype.lower()):
            raise ValueError("Not video bytes ("+ctype+")")
    return path

def get_bmw_scene(page,path):
    import html
    req=urllib.request.Request(page,headers={"User-Agent":"Mozilla/5.0","Accept":"text/html"})
    with urllib.request.urlopen(req,timeout=45) as r:
        page_html=r.read(8*1024*1024).decode("utf-8","replace")
    decoded=html.unescape(page_html)
    matches=re.findall(r'filmSceneFileId(?:=|%3D|&#61;|["\x27]\s*:\s*["\x27]?)(\d{3,9})',decoded,re.I)
    if not matches:
        matches=re.findall(r'(?:sceneFileId|filmSceneFileId)\D{0,40}(\d{3,9})',decoded,re.I)
    if not matches:raise ValueError("BMW scene HD download ID not exposed in public page; no credential bypass")
    scene_id=matches[0]
    media="https://mediapool.bmwgroup.com/download/edown/tvFootageDownload?actEvent=tvFootageSceneHD&attachment=1&filmSceneFileId="+scene_id
    print("RESOLVED BMW PRESSCLUB PUBLIC HD SCENE",scene_id,flush=True)
    return get_direct(media,path)

def get_ytdlp(url,prefix):
    result=run([sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
        "--no-progress","--socket-timeout","18","--retries","1",
        "--format","bv*+ba/b","--merge-output-format","mp4","--max-filesize","820M",
        "-o",str(prefix)+".%(ext)s",url],timeout=180)
    matches=[p for p in SRC.glob(prefix.name+".*") if p.suffix.lower() in (".mp4",".mov",".mkv")]
    if not matches:raise ValueError("yt-dlp no media: "+result.stderr[-450:])
    return max(matches,key=lambda p:p.stat().st_size)
def scenes(path, meta):
    # Inexpensive frame-difference cut detector; outputs CANDIDATES, not certified distinct shots.
    # 1 fps full-video downsampling; contact sheets are subsequently manually evaluated.
    import cv2
    cap=cv2.VideoCapture(str(path))
    if not cap.isOpened():raise ValueError("OpenCV cannot read media")
    fps=cap.get(cv2.CAP_PROP_FPS) or 25
    every=max(1,int(round(fps)))
    frame_idx=0; prev=None; boundaries=[0.0]; lastcut=0.0
    while cap.isOpened():
        ok,frame=cap.read()
        if not ok:break
        if frame_idx%every==0:
            gray=cv2.cvtColor(cv2.resize(frame,(128,72)),cv2.COLOR_BGR2GRAY)
            gray=cv2.GaussianBlur(gray,(5,5),0)
            t=frame_idx/fps
            if prev is not None:
                diff=float(cv2.absdiff(prev,gray).mean())
                if diff>29.0 and t-lastcut>=2.1:
                    boundaries.append(t);lastcut=t
            prev=gray
        frame_idx+=1
    cap.release()
    boundaries.append(meta["duration"])
    spans=[(round(a,2),round(b,2)) for a,b in zip(boundaries,boundaries[1:]) if b-a>=2.6]
    return spans
def grab(path,t,dest):
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),
      "-i",str(path),"-vf","scale=640:-2","-frames:v","1",str(dest)],timeout=60)
def contact_sheet(photos,dest,title):
    from PIL import Image,ImageDraw
    w,h=640,392
    output=Image.new("RGB",(w*3,h*((len(photos)+2)//3)+48),(12,13,18))
    dr=ImageDraw.Draw(output);dr.text((12,12),title,fill=(238,238,238))
    for i,(p,label) in enumerate(photos):
        im=Image.open(p).convert("RGB");im.thumbnail((w-8,h-29))
        x=(i%3)*w+(w-im.width)//2;y=(i//3)*h+48
        output.paste(im,(x,y));dr.text(((i%3)*w+12,y+h-25),label,fill=(242,230,210))
    dest.parent.mkdir(parents=True,exist_ok=True)
    output.save(dest,quality=84,optimize=True)
def acquire(s):
    sid=s["id"]; print("START",sid,flush=True)
    start=time.time(); fn=SRC/(sid+(".mov" if "mov" in s["url"].lower() else ".mp4"))
    if s["method"]=="bmw-scene":path=get_bmw_scene(s["url"],fn)
    elif s["method"]=="direct": path=get_direct(s["url"],fn)
    else:path=get_ytdlp(s["url"],SRC/sid)
    p=probe(path)
    print("PROBE",sid,json.dumps(p),flush=True)
    if not p["min_1080_pass"]:raise ValueError("Below original 1080p requirement: "+str((p["width"],p["height"])))
    if not p["max_4k_preferred"]:raise ValueError("Above 4K preferred source")
    if p["duration"]<3:raise ValueError("Source under 3 seconds")
    # 10 fixed source frames show visual identity, orientation and obvious CGI.
    # FFmpeg verification uses actual decoded video data, independent of metadata.
    run(["ffmpeg","-hide_banner","-v","error","-xerror","-i",str(path),
       "-map","0:v:0","-f","null","-"],timeout=780)
    spans=scenes(path,p)
    if not spans:spans=[(0.0,p["duration"])]
    # Space across source time; no slices from one viewpoint counted as distinct until manual QA.
    selected=sorted(spans,key=lambda ab:ab[1]-ab[0],reverse=True)[:7]
    selected.sort()
    if sid=="bmw-i-vision-dee-running":
        # Public manufacturer master has B-roll exterior before ~230s; the
        # naive longest-scene selector concentrated on 230-450s interior,
        # so explicitly sample distributed exterior-focused timestamps.
        starts=[11,27,43,59,75,91,107,123,139,155,171,187,203,219]
        selected=[(float(t),float(t+4.1)) for t in starts]
    records=[];photos=[]
    for idx,(a,b) in enumerate(selected,1):
        dur=min(4.0,b-a-.2)
        t=a+max(.05,(b-a-dur)/2)
        if dur<2.0 or (sid=='bmw-vision-m-next-driving' and idx in (1,3)) or (sid=='bmw-vision-m-next-launch' and idx not in (1,4)):continue
        clip=CLIPS/(sid+"-candidate-"+str(idx).zfill(2)+path.suffix.lower())
        result=run(["ffmpeg","-hide_banner","-loglevel","error","-y",
           "-ss",str(round(t,3)),"-i",str(path),"-t",str(round(dur,3)),
           "-map","0:v:0","-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(clip)],timeout=120)
        cp=probe(clip)
        if cp["duration"]<1.8 or not cp["min_1080_pass"]:clip.unlink(missing_ok=True);continue
        # Also require actual frame decode in the final playable segment.
        run(["ffmpeg","-v","error","-xerror","-i",str(clip),"-map","0:v:0","-f","null","-"],timeout=100)
        thumb=CONTACTS/(clip.stem+".jpg")
        grab(clip,max(.5,cp["duration"]*.5),thumb)
        photos.append((thumb,f"{clip.name} @ {t:.1f}s"))
        records.append(dict(id=clip.stem,model=s["model"],publisher=s["publisher"],
          source_url=s["url"],page_url=s["page"],rights=s["rights"],
          source_sha256=sha(path),source_native=p,source_start=round(t,3),
          source_end=round(t+dur,3),clip_file="clips/"+clip.name,
          clip_sha256=sha(clip),clip_qa=cp,
          physically_real="unverified pending frame-by-frame human inspection",
          filming_type="UNVERIFIED",visual_review="PENDING",
          angle="PENDING",distinct_shot="PENDING",
          crop_vertical_native=p["source_native_vertical_1080"]))
    sheet=CONTACTS/(sid+"-sheet.jpg")
    if photos:
        contact_sheet(photos,sheet,sid+" • CANDIDATES • NOT VISUALLY APPROVED")
        shutil.copy2(sheet,REVIEW/sheet.name)
    print("ACQUIRED",sid,len(records),"elapsed",round(time.time()-start,1),flush=True)
    return records,p
def main():
    for d in (ROOT,SRC,CLIPS,CONTACTS,REVIEW):d.mkdir(parents=True,exist_ok=True)
    records=[];rejections=[];sources=[]
    for s in SOURCE_LIST:
        try:
            r,p=acquire(s);records+=r;sources.append({"id":s["id"],"qa":p,"candidate_count":len(r)})
        except Exception as e:
            rejections.append({"source_id":s["id"],"url":s["url"],"error":str(e)[:600]})
            print("REJECT",s["id"],str(e)[:500],flush=True)
    payload={"agent":"B","project":"CYBER-FUTURE-001","raw_candidates":len(records),
       "distinct_approved_shots":0,"approved_models":0,
       "gate":"PARTIAL_PENDING_MANUAL_VISUAL_QA",
       "notes":"Candidate segments need review for vehicle identity, live photography, physical motion, scene duplicates, CGI/watermarks; no automatic PASS.",
       "sources":sources,"clips":records,"rejections":rejections}
    (ROOT/"manifest.json").write_text(json.dumps(payload,indent=2)+"\n")
    (ROOT/"rejections.json").write_text(json.dumps(rejections,indent=2)+"\n")
    with (ROOT/"manifest.csv").open("w") as f:
        out=csv.DictWriter(f,fieldnames=["id","model","publisher","source_url","source_start","source_end","clip_file","clip_sha256","filming_type","visual_review","crop_vertical_native"])
        out.writeheader()
        for c in records:out.writerow({k:c.get(k) for k in out.fieldnames})
    readme=f"""# {NAME}
This package contains {len(records)} real VIDEO FILE candidate extracts from {len(sources)} publisher downloads.
TECHNICAL CHECKS: source + clip ffprobe and FFmpeg decode, exact hashes, native dimensions.
NOT CERTIFIED: visual CGI/physical authenticity, angle uniqueness or rolling status. Review contact_sheets.
Do NOT equate multiple candidate segments with distinct approved shots.
Publisher sources and restrictions are in manifest.json. Audi Denmark permits media use only in full unedited form by its public terms, not cleared for an edited montage.
No user soundtrack added. No render/edit was made.
"""
    (ROOT/"README_START_HERE.md").write_text(readme)
    (REVIEW/"qa-latest.json").write_text(json.dumps({"sources":sources,"candidate_count":len(records),"rejections":rejections,"human_review":"PENDING"},indent=2)+"\n")
    zip_path=ROOT/(NAME+".zip")
    with zipfile.ZipFile(zip_path,"w",compression=zipfile.ZIP_STORED) as z:
        for folder in [CLIPS,CONTACTS]:
            for fp in folder.rglob("*"):
                if fp.is_file():z.write(fp,fp.relative_to(ROOT))
        for n in ["manifest.json","manifest.csv","rejections.json","README_START_HERE.md"]:
            z.write(ROOT/n,n)
    print("RESULT",json.dumps({"zip":str(zip_path),"bytes":zip_path.stat().st_size,
      "sha256":sha(zip_path),"clips":len(records),"sources":sources,"rejections":rejections}),flush=True)
    # Return zero for diagnostic / partial workflow but never claim gate PASS.
if __name__=="__main__":main()
