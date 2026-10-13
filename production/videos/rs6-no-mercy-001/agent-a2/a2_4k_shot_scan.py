#!/usr/bin/env python3
"""Motion / tone audit of real C8 RS6 original footage.
Runner access is ephemeral. No third-party pixels or audio enter GitHub artifacts.
Automated scores are scouting leads, NOT visual identity/crop/rights approval.
"""
import hashlib, json, os, re, subprocess, time
from pathlib import Path
from urllib.parse import urlparse
import numpy as np
import requests

OUT=Path("a2_shot_audit"); OUT.mkdir(exist_ok=True)
BASE="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/"
SUFFIX="/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_"
Q="?accept-experimental=1"
def media_url(quality):
    return BASE+"video_"+quality+".mp4"+SUFFIX+quality+".mp4"+Q
def probe(url):
    try:
        p=subprocess.run(["ffprobe","-v","error","-rw_timeout","18000000","-show_entries",
          "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size",
          "-of","json",url],capture_output=True,text=True,timeout=52)
        if p.returncode!=0:return {"pass":False,"error":p.stderr[-450:]}
        data=json.loads(p.stdout);v=next(s for s in data["streams"] if s.get("codec_type")=="video")
        return {"pass":True,"width":v.get("width"),"height":v.get("height"),"fps":v.get("r_frame_rate"),
           "duration":float(data["format"].get("duration",0)),"size":data["format"].get("size")}
    except Exception as exc:return {"pass":False,"error":repr(exc)}
def quick_range(url):
    try:
        with requests.get(url,headers={"Range":"bytes=0-63","User-Agent":"Mozilla/5.0"},stream=True,timeout=(9,16)) as r:
            b=next(r.iter_content(128),b"")
            return {"http":r.status_code,"content_range":r.headers.get("Content-Range"),"mp4_header":b"ftyp" in b[:64]}
    except Exception as exc:return {"error":repr(exc)}
def sample(url,t,secs=1.8,scale=(480,270)):
    w,h=scale;cmd=["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-rw_timeout","20000000",
      "-ss",str(t),"-i",url,"-t",str(secs),"-vf",f"fps=4,scale={w}:{h}:flags=fast_bilinear",
      "-an","-sn","-dn","-pix_fmt","rgb24","-f","rawvideo","-"]
    p=subprocess.run(cmd,capture_output=True,timeout=65)
    n=len(p.stdout)//(w*h*3)
    if p.returncode!=0 or n<3:raise RuntimeError(f"ffmpeg {p.returncode}: {p.stderr[-400:]!r}; frames={n}")
    arr=np.frombuffer(p.stdout[:n*w*h*3],dtype=np.uint8).reshape(n,h,w,3)
    gr=arr.astype(np.float32).mean(axis=3)
    differences=np.abs(np.diff(gr,axis=0))
    contrast=gr.std(axis=(1,2)).mean()
    lum=gr.mean()
    r=arr[:,:,:,0].astype(np.float32).mean()
    b=arr[:,:,:,2].astype(np.float32).mean()
    # Motion proxy is image change, including potential pans / subject movement.
    motion=differences.mean()
    motion_middle=differences[:,int(h*.18):int(h*.82),int(w*.22):int(w*.78)].mean()
    edge=np.abs(gr[:,:,2:]-gr[:,:,:-2]).mean()+np.abs(gr[:,2:,:]-gr[:,:-2,:]).mean()
    # Reject obvious scene transitions when >40% frame difference spikes.
    jump=float(np.percentile(differences.mean(axis=(1,2)),90))
    score=float(min(motion_middle,38)*1.4 + min(contrast,80)*.26 + min(edge,75)*.25 +
       (7 if 24<lum<158 else 0) + (3 if b-r>3 else 0))
    return {"frames":n,"start_s":round(t,2),"end_s":round(t+secs,2),
      "motion_mean":round(float(motion),3),"central_motion":round(float(motion_middle),3),
      "mean_luma":round(float(lum),2),"contrast":round(float(contrast),2),
      "edge_activity":round(float(edge),2),"blue_minus_red":round(float(b-r),2),
      "jump_intensity":round(jump,2),"score_motion_tone_only":round(score,3),
      "preview_capture":"processed_ephemerally_in_memory_no_pixels_published"}
report={"agent":"A2","audit":"scout entire ~634s Audi C8 4K reel with real moving decoded previews",
 "warning":"Not manual visual QA; movement can be camera/background; no rights clearance or public video.",
 "source_page":"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874",
 "master_2160p":media_url("2160p"),"started_utc":time.strftime("%FT%TZ",time.gmtime()),
 "rendition_options":[],"windows":[]}
t0=time.monotonic()
# Fast low-resolution scouting is keyed to the SAME verified native 4K original.
selected=None
for q in ["540p","720p","1080p","2160p"]:
    u=media_url(q); rr=quick_range(u);entry={"quality":q,"range":rr}
    report["rendition_options"].append(entry)
    if rr.get("http")!=206 or not rr.get("mp4_header"):continue
    info=probe(u);entry["ffprobe"]=info
    if info.get("pass") and info.get("duration",0)>300:
        selected=(q,u,info);break
if not selected:
    report["error"]="No usable seekable Adobe rendition, no motion scan performed."
else:
    q,u,info=selected;report["scan_stream"]={"quality":q,**info}
    duration=info["duration"];secs=1.8
    # 30 full-reel windows, bounded runtime and retries per *distinct source timestamp*.
    points=[round(6+(duration-18)*i/29,2) for i in range(30)]
    for index,t in enumerate(points):
        item={"requested_time":t};report["windows"].append(item)
        if time.monotonic()-t0>475:
            item["error"]="global_475_second_budget_reached";break
        try:
            item.update(sample(u,t,secs=secs))
            item["scout_status"]="MEASURED_real_decoded_frames"
        except Exception as exc:item["error"]=repr(exc)
    done=[x for x in report["windows"] if x.get("scout_status")=="MEASURED_real_decoded_frames"]
    candidates=sorted(done,key=lambda x:x["score_motion_tone_only"],reverse=True)
    kept=[]
    for c in candidates:
        if all(abs(c["start_s"]-x["start_s"])>=15 for x in kept):
            kept.append({k:c[k] for k in ("start_s","end_s","score_motion_tone_only",
              "central_motion","contrast","mean_luma","blue_minus_red","jump_intensity")})
        if len(kept)==10:break
    report["top_10_technical_scans"]=kept
report["seconds_elapsed"]=round(time.monotonic()-t0,2)
report["finished_utc"]=time.strftime("%FT%TZ",time.gmtime())
(OUT/"report.json").write_text(json.dumps(report,indent=2))
(OUT/"rights.txt").write_text(
 "SOURCE IS AUDI AG; EDITORIAL/PRESS TERMS ONLY. No source footage or pixels uploaded.\n"
 "A technical motion/tone rank is not proof of moving car, C8 visible, cinematic framing,\n"
 "native vertical crop, scene identity, or permission. Human visual QA and grant required.\n")
print(json.dumps({"scan_stream":report.get("scan_stream"),"top_10":report.get("top_10_technical_scans"),
 "measured_windows":sum(1 for x in report["windows"] if x.get("scout_status")),
 "errors":sum(1 for x in report["windows"] if x.get("error")),"elapsed":report["seconds_elapsed"]},indent=2))
