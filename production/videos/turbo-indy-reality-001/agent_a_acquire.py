#!/usr/bin/env python3
"""Agent A Turbo (2013) official/trailer video acquisition and factual QA. Public sources only, no DRM bypass."""
import json, subprocess, hashlib, time
from pathlib import Path
BASE=Path("out/turbo-agent-a")
RAW=BASE/"raw"; QA=BASE/"qa"; CLIPS=BASE/"clips"
for d in [RAW,QA,CLIPS]: d.mkdir(parents=True,exist_ok=True)
report={"role":"A - Turbo 2013 film","status":"NOT_VERIFIED","sources":[],"clips":[],"rights":"Copyright DreamWorks/Universal. Public accessibility does not establish editing/republication permission.","generated":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
sources=[
("official_clip_race_finish","https://www.rottentomatoes.com/m/turbo_2013/videos/831UUTZ5GK0n","Rotten Tomatoes official movie excerpt"),
("official_clip_great_snail_race","https://www.rottentomatoes.com/m/turbo_2013/videos/zrxI5DBxDU1L","Rotten Tomatoes official movie excerpt"),
("official_clip_fast_furious","https://www.rottentomatoes.com/m/turbo_2013/videos/BwD_delQR9bs","Rotten Tomatoes official movie excerpt"),
("original_trailer_vimeo","https://vimeo.com/72332727","Original Turbo trailer third-party repost, rights unconfirmed"),
("apple_fox_trailer_1","https://movietrailers.apple.com/movies/fox/turbo/turbo-tlr1_h1080p.mov","Apple CDN inferred path; verify"),
("apple_fox_trailer_2","https://movietrailers.apple.com/movies/fox/turbo/turbo-tlr2_h1080p.mov","Apple CDN inferred path; verify")]
def run(cmd,timeout=90):
    p=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout)
    return p.returncode,p.stdout[-4000:]
def probe(file):
    rc,txt=run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate","-of","json",str(file)],20)
    if rc:raise ValueError(txt)
    return json.loads(txt)
def sha(f):
    h=hashlib.sha256()
    with f.open("rb") as x:
        for c in iter(lambda:x.read(1048576),b""):h.update(c)
    return h.hexdigest()
def contact(file,id_,duration):
    frames=[]
    times=[round((j+0.5)*duration/12,3) for j in range(12)]
    for j,t in enumerate(times):
        out=QA/(id_+"_"+str(j).zfill(2)+".jpg")
        rc,s=run(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(file),"-frames:v","1","-vf","scale=320:-2","-y",str(out)],25)
        if rc==0 and out.exists() and out.stat().st_size>1000:frames.append(out)
    if frames:run(["montage",*[str(f) for f in frames],"-tile","4x","-geometry","320x180+4+4","-background","black",str(QA/(id_+"_contact.jpg"))],35)
    return times
def samples(file,id_,duration):
    if duration<3:return 0
    count=0
    for idx,fraction in enumerate([.2,.42,.65,.83]):
        start=min(round(duration*fraction,2),duration-2.5)
        dest=CLIPS/(id_+"_sample_"+str(idx+1)+".mp4")
        cmd=["ffmpeg","-hide_banner","-loglevel","error","-ss",str(start),"-i",str(file),"-t","2.5","-map","0:v:0","-an","-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart","-y",str(dest)]
        rc,msg=run(cmd,100)
        if rc==0 and dest.exists() and dest.stat().st_size>30000:
            data={"file":str(dest.relative_to(BASE)),"source":id_,"source_start":start,"duration":2.5,"sha256":sha(dest),"visual_status":"UNREVIEWED candidate, needs manual image inspection","angle":"UNDETERMINED"}
            report["clips"].append(data);count+=1
    return count
for id_,url,right in sources:
    one={"id":id_,"url":url,"provenance":right,"errors":[],"outcome":"NO_DOWNLOAD"}
    report["sources"].append(one)
    file=RAW/(id_+".mp4")
    try:
        if url.endswith(".mov"):
            import requests
            resp=requests.get(url,timeout=25,stream=True,headers={"User-Agent":"Mozilla/5.0"})
            one["http_status"]=resp.status_code
            if not resp.ok or not ("video" in resp.headers.get("Content-Type","").lower() or "octet" in resp.headers.get("Content-Type","").lower()):raise ValueError("No publicly accessible video: "+str(resp.status_code))
            file=RAW/(id_+".mov")
            with file.open("wb") as handle:
                size=0
                for chunk in resp.iter_content(1048576):
                    size+=len(chunk)
                    if size>180*1048576:raise ValueError("Exceeded 180 MB file cap")
                    handle.write(chunk)
        else:
            opts=["yt-dlp","--no-playlist","--no-progress","--socket-timeout","15","--retries","1","--fragment-retries","1","--merge-output-format","mp4","--max-filesize","180M","-f","bv*[height>=1080]+ba/b[height>=1080]/bv*+ba/b","-o",str(RAW/(id_+".%(ext)s")),url]
            rc,msg=run(opts,115)
            one["errors"].append({"extractor_exit":rc,"message":msg[-700:]})
            files=sorted([x for x in RAW.glob(id_+".*") if x.suffix.lower() in [".mp4",".mov",".webm",".mkv"] and x.stat().st_size>30000],key=lambda x:x.stat().st_size,reverse=True)
            if rc!=0 or not files:continue
            file=files[0]
        info=probe(file); v=next((s for s in info["streams"] if s["codec_type"]=="video"),None)
        if not v:raise ValueError("No decodable video")
        duration=float(info["format"]["duration"])
        if duration<1.5:raise ValueError("Not an actual moving clip")
        one.update(outcome="ACQUIRED",file=str(file.relative_to(BASE)),width=v.get("width"),height=v.get("height"),fps=v.get("r_frame_rate"),codec=v.get("codec_name"),duration=round(duration,3),sha256=sha(file),bytes=int(info["format"].get("size",0)))
        one["quality_gate"]="FULL_HD_GEOMETRY" if v.get("width",0)>=1920 and v.get("height",0)>=1080 else "LESS_THAN_1080P"
        one["contact_timestamps"]=contact(file,id_,duration)
        one["samples"]=samples(file,id_,duration) if v.get("height",0)>=720 else 0
    except Exception as e:one["errors"].append(str(e))
    finally:print("SOURCE_RESULT "+json.dumps(one,sort_keys=True),flush=True)
n=sum(1 for x in report["sources"] if x["outcome"]=="ACQUIRED")
report["acquired_originals"]=n
report["candidate_count"]=len(report["clips"])
report["status"]="REAL_VIDEO_ACQUIRED_VISUAL_QA_PENDING" if n else "NO_MEDIA_DOWNLOADED"
(BASE/"manifest.json").write_text(json.dumps(report,indent=2))
(BASE/"README.md").write_text("# Agent A evidence\n\nRaw contains downloaded sources; clips contains 2.5 second motion samples, NOT final human-selected racing moments. QA contact frames are decoded from actual files. Manifest includes verified geometry/codec/duration and SHA256. Rights clearance and match-frame visual review remain required.\n")
print("ACQUISITION_SUMMARY "+json.dumps({"status":report["status"],"sources":n,"samples":len(report["clips"])}),flush=True)
