#!/usr/bin/env python3
"""Agent A targeted Indy 500 sequences from actual Turbo 2013 movie: candidate + image QA.
The official Rotten Tomatoes clips are legally viewable but reuse rights remain unconfirmed.
"""
import subprocess,json,hashlib,time
from pathlib import Path
BASE=Path("out/turbo-agent-a-focus");RAW=BASE/"raw";QA=BASE/"qa";CUTS=BASE/"clips"
for p in [BASE,RAW,QA,CUTS]:p.mkdir(parents=True,exist_ok=True)
SOURCES=[
("pit_stop_pep_talk","https://www.rottentomatoes.com/m/turbo_2013/videos/bOZEc_WT1ZEW","Official Clip - Pit Stop Pep Talk"),
("your_driver_is_snail","https://www.rottentomatoes.com/m/turbo_2013/videos/o7k_jrJyj4lw","Official Clip - Your Driver Is A Snail?"),
("broken_shell","https://www.rottentomatoes.com/m/turbo_2013/videos/eimOrKrYvaNw","Official Clip - Broken Shell"),
("race_to_finish","https://www.rottentomatoes.com/m/turbo_2013/videos/831UUTZ5GK0n","Official Clip - Race to the Finish")]
out={"role":"A Turbo film Indy 500 focused","rights":"DreamWorks/Universal-owned clips. Public viewing/downloading is not permission to republish.","status":"PENDING","sources":[],"clips":[],"generated":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
def run(args,timeout=130):
    p=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout)
    return p.returncode,p.stdout[-1000:]
def digest(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for c in iter(lambda:f.read(1048576),b""):h.update(c)
    return h.hexdigest()
def metadata(p):
    rc,txt=run(["ffprobe","-v","error","-show_entries","stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size","-of","json",str(p)],30)
    if rc:raise RuntimeError(txt)
    j=json.loads(txt);video=next(s for s in j["streams"] if s["codec_type"]=="video")
    return {"width":video["width"],"height":video["height"],"codec":video["codec_name"],"fps":video.get("r_frame_rate"),"duration":float(j["format"]["duration"]),"size":int(j["format"]["size"])}
def extract_frames(p,id_,duration):
    frames=[]
    for i in range(24):
        t=round(duration*(i+.5)/24,3);dest=QA/(id_+"_"+str(i).zfill(2)+".jpg")
        rc,err=run(["ffmpeg","-v","error","-ss",str(t),"-i",str(p),"-frames:v","1","-vf","scale=400:-2","-y",str(dest)],30)
        if rc==0 and dest.exists():frames.append(dest)
    if frames:
        run(["montage",*[str(f) for f in frames],"-tile","4x","-geometry","400x225+3+3","-background","black",str(QA/(id_+"_contact.jpg"))],50)
    return len(frames)
for id_,url,name in SOURCES:
    record={"id":id_,"source_url":url,"title":name,"status":"NO_MEDIA"}
    out["sources"].append(record)
    try:
        rc,log=run(["yt-dlp","--playlist-items","1","--no-progress","--socket-timeout","20","--retries","1","--fragment-retries","1","-f","bv*[height>=1080]+ba/b[height>=1080]/bv*+ba/b","--merge-output-format","mp4","-o",str(RAW/(id_+".%(ext)s")),url],110)
        record["extractor_status"]=rc;record["extractor_log_tail"]=log
        matched=[f for f in RAW.glob(id_+".*") if f.suffix.lower() in [".mp4",".mkv",".webm",".mov"] and f.stat().st_size>50000]
        if rc or not matched:continue
        f=max(matched,key=lambda q:q.stat().st_size)
        md=metadata(f)
        record.update(md);record["sha256"]=digest(f);record["status"]="VIDEO_ACQUIRED";record["source_file"]=str(f.relative_to(BASE))
        record["contact_frames"]=extract_frames(f,id_,md["duration"])
        # Time-based *candidates*. No false claim these are approved Indy 500 matches.
        for k,ratio in enumerate([.10,.25,.4,.55,.7,.85]):
            start=max(0,min(md["duration"]-3,round(ratio*md["duration"],3)))
            target=CUTS/(id_+"_"+str(k+1)+".mp4")
            rc,msg=run(["ffmpeg","-v","error","-ss",str(start),"-i",str(f),"-t","3","-an","-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p","-y",str(target)],60)
            if rc==0 and target.exists() and target.stat().st_size>20000:
                cm=metadata(target)
                out["clips"].append({"file":str(target.relative_to(BASE)),"source_id":id_,"source_in":start,"duration":cm["duration"],"width":cm["width"],"height":cm["height"],"sha256":digest(target),"visual_status":"NEEDS HUMAN REVIEW for Indy 500 activity, turbo blue speed/track banking"})
    except Exception as e:record["exception"]=str(e)
    finally:print("SOURCE "+json.dumps(record),flush=True)
out["downloaded"]=sum(r["status"]=="VIDEO_ACQUIRED" for r in out["sources"])
out["status"]="DOWNLOADED_VISUAL_REVIEW_PENDING" if out["downloaded"] else "NO_VIDEO"
(BASE/"manifest.json").write_text(json.dumps(out,indent=2))
print("FOCUS_RESULT "+json.dumps({"status":out["status"],"downloaded":out["downloaded"],"sample_clips":len(out["clips"])}))
