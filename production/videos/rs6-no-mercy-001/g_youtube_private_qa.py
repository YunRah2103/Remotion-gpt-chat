#!/usr/bin/env python3
"""One bounded genuine YouTube C8 RS6 source acquisition, owner review ONLY.
Not an S25 worker job and does not change approved source registry.
No claim of clearance; do not upload public release.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import requests,subprocess,shutil,json,time,hashlib
ROOT=Path("rs6-youtube-private-qa");ROOT.mkdir(exist_ok=True)
VIDS={"NITERUN_BLACK_NIGHT":"a38sqC7k2iw","MAKU_MUNICH_NIGHT":"pzhKoJAb1ek"}
ENDPOINTS=[
("invidious","https://inv.nadeko.net/api/v1/videos/"),
("invidious","https://invidious.nerdvpn.de/api/v1/videos/"),
("invidious","https://yt.chocolatemoo53.com/api/v1/videos/"),
("invidious","https://invidious.tiekoetter.com/api/v1/videos/"),
("piped","https://pipedapi.kavin.rocks/streams/"),
("piped","https://pipedapi.leptons.xyz/streams/"),
("piped","https://pipedapi.nosebs.ru/streams/"),
]
def check(backend,base,tag,video):
    uri=base+video
    try:
        r=requests.get(uri,timeout=(6,18),headers={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36","Accept":"application/json"})
        if r.status_code!=200 or "json" not in r.headers.get("content-type",""):
            return {"source":tag,"backend":base,"status":"HTTP "+str(r.status_code),"content_type":r.headers.get("content-type","")[:70]}
        j=r.json()
        streams=[]
        if backend=="invidious":
            for x in j.get("adaptiveFormats",[])+j.get("formatStreams",[]):
                uri=x.get("url") or ""
                size=x.get("size") or x.get("resolution") or ""
                h=x.get("height") or 0
                mime=x.get("type") or ""
                if uri and ("video/mp4" in mime or ".mp4" in mime or "video" in mime):
                    streams.append(dict(url=uri,height=int(h or 0),mime=mime,quality=str(size)))
        else:
            for x in j.get("videoStreams",[]):
                uri=x.get("url") or ""
                if uri and (x.get("format")=="MPEG_4" or x.get("mimeType","").startswith("video/mp4") or x.get("codec","").lower().startswith("avc")):
                    h=x.get("height") or 0
                    streams.append(dict(url=uri,height=int(h or 0),mime=x.get("mimeType",x.get("format","")),quality=x.get("quality","")))
        streams.sort(key=lambda x:(x["height"]>1080,abs(x["height"]-1080)))
        return {"source":tag,"backend":base,"status":"METADATA_PASS" if streams else "NO_USABLE_MP4_STREAM","title":j.get("title","")[:130],"streams":streams[:8]}
    except Exception as e:
        return {"source":tag,"backend":base,"status":"FAILED","error":str(e)[:180]}
results=[]
with ThreadPoolExecutor(max_workers=9) as pool:
    jobs=[pool.submit(check,backend,base,tag,vid) for tag,vid in VIDS.items() for backend,base in ENDPOINTS]
    for f in as_completed(jobs):
        x=f.result();results.append(x)
        print("PROBE",x["source"],x["backend"],x["status"],"streams",len(x.get("streams",[])),flush=True)
summary=[{k:v for k,v in r.items() if k!="streams"}|{"stream_heights":[x["height"] for x in r.get("streams",[])]} for r in results]
(ROOT/"PROBE_RESULTS.json").write_text(json.dumps(summary,indent=2))
winners=sorted([r for r in results if r.get("streams")],key=lambda x:(x["source"]!="NITERUN_BLACK_NIGHT",min(abs(s["height"]-1080) for s in x["streams"])))
outcome={"result":"NO_REAL_RS6_MP4_DOWNLOADED","video_ids":VIDS,"attempts":[],"public_distribution_allowed":False,"method":"third-party publicly accessible YouTube proxy metadata; no authenticated gates bypassed"}
for result in winners[:4]:
    for stream in result["streams"][:3]:
        if stream["height"]>1080 or stream["height"]<480:continue
        src=stream["url"]; tag=result["source"];out=ROOT/(tag+"_20s_7s_VERTICAL.mp4")
        cmd=["ffmpeg","-nostdin","-hide_banner","-v","error","-rw_timeout","15000000","-y","-ss","20","-i",src,"-t","7","-an","-vf","fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p","-c:v","libx264","-preset","veryfast","-crf","19","-movflags","+faststart",str(out)]
        try:
            print("DOWNLOAD_ATTEMPT",tag,result["backend"],stream["height"],flush=True)
            p=subprocess.run(cmd,capture_output=True,text=True,timeout=110)
            if p.returncode:raise RuntimeError(p.stderr[-280:])
            p=subprocess.run(["ffprobe","-v","error","-show_entries","stream=codec_name,width,height,nb_frames:format=duration,size","-of","json",str(out)],capture_output=True,text=True,timeout=15)
            if p.returncode:raise RuntimeError("ffprobe "+p.stderr[-160:])
            meta=json.loads(p.stdout)
            if float(meta["format"]["duration"])<2:raise RuntimeError("short decode")
            q=subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(out),"-f","null","-"],capture_output=True,text=True,timeout=60)
            if q.returncode:raise RuntimeError("full decode failed "+q.stderr[-160:])
            outcome.update(result="REAL_RS6_YOUTUBE_CLIP_DOWNLOADED",source="https://www.youtube.com/watch?v="+VIDS[tag],filename=out.name,ffprobe=meta,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),backend=result["backend"])
            print("ACTUAL_MP4_PASS",json.dumps(outcome),flush=True)
            break
        except Exception as e:
            out.unlink(missing_ok=True)
            err=str(e)[-260:]
            outcome["attempts"].append({"tag":tag,"backend":result["backend"],"stream_height":stream["height"],"error":err})
            print("DOWNLOAD_FAILED",tag,err,flush=True)
    if outcome["result"].startswith("REAL_"):break
(ROOT/"OUTCOME.json").write_text(json.dumps(outcome,indent=2))
print("FINAL_OUTCOME",json.dumps(outcome,indent=2),flush=True)
