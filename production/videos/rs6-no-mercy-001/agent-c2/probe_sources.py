#!/usr/bin/env python3
"""C2 source-acquisition + motion-QA trials. Raw third-party MP4s NEVER leave runner."""
import hashlib, json, os, pathlib, shutil, subprocess, time, traceback
from datetime import datetime, timezone
from urllib.parse import urlsplit

OUT=pathlib.Path("c2_qa"); OUT.mkdir(exist_ok=True)
WORK=pathlib.Path("c2_work"); WORK.mkdir(exist_ok=True)
SOURCES=[
 {"id":"victor-braam-detail-2021","url":"https://vimeo.com/690531160","note":"Purpose-built RS6 detail cinematic, unique C2 scope, publisher Victor Braam; licence unknown"},
 {"id":"pixabay-rs6-exhaust-126186","url":"https://pixabay.com/ru/videos/%D0%B0%D1%83%D0%B4%D0%B8-rs6-audi-%D0%B7%D0%B2%D1%83%D0%BA-%D0%B2%D1%8B%D1%85%D0%BB%D0%BE%D0%BF%D0%B0-126186/","note":"Pixabay license page states 1080x1920 59 FPS; generation & motion unconfirmed"},
 {"id":"video-broker-rs6-2021","url":"https://vimeo.com/1175902245","note":"Potential C8 moving details, Vimeo creator Video.Broker; rights unknown"},
]
def call(cmd, timeout=120):
    t=time.time()
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
        return {"rc":p.returncode,"seconds":round(time.time()-t,2),"stderr":p.stderr[-4500:],"stdout":p.stdout[-1600:]}
    except Exception as e:
        return {"rc":-1,"seconds":round(time.time()-t,2),"error":str(e)}
results=[]
for s in SOURCES:
    name=s["id"];folder=WORK/name;folder.mkdir(exist_ok=True)
    obj={**s,"rights_cleared":False,"license":"UNCONFIRMED","c8_visual":"UNCONFIRMED","delivery_approved":False}
    try:
        # Distinct extraction pathways. Underlying metadata, formats or servers may differ.
        for method,options in [
           ("yt-dlp-best",["-S","res:2160,codec:h264","-f","bv*+ba/best","--download-sections","*0-8"]),
           ("yt-dlp-single",["-f","best","--download-sections","*0-8"]),
        ]:
            pre=[ "yt-dlp","--no-playlist","--no-progress","--no-overwrites","--socket-timeout","15","--retries","2","--fragment-retries","2","--add-header","User-Agent:Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36","--merge-output-format","mp4","-o",str(folder/"source.%(ext)s") ]
            r=call(pre+options+[s["url"]],timeout=125)
            obj.setdefault("attempts",[]).append({"method":method,**r})
            files=sorted([p for p in folder.glob("source.*") if p.suffix.lower() in (".mp4",".mkv",".webm",".mov") and p.stat().st_size>100000],key=lambda p:p.stat().st_size,reverse=True)
            if files: break
        if not files:
            obj["result"]="no_source_bytes"
        else:
            orig=files[0]; obj["download_bytes"]=orig.stat().st_size
            probe=call(["ffprobe","-v","error","-show_entries","format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate","-of","json",str(orig)],timeout=30)
            obj["ffprobe_process"]=probe
            if probe["rc"]==0:
                data=json.loads(probe["stdout"]);obj["ffprobe"]=data
                v=next((x for x in data.get("streams",[]) if x["codec_type"]=="video"),{})
                obj["native_width"]=v.get("width");obj["native_height"]=v.get("height")
                obj["native_hd"]=bool(v.get("width",0)>=1920 and v.get("height",0)>=1080 or v.get("width",0)>=1080 and v.get("height",0)>=1920)
                sample=folder/"sample.mp4"
                cr=call(["ffmpeg","-hide_banner","-y","-loglevel","error","-i",str(orig),"-t","8","-map","0:v:0","-an","-c:v","libx264","-crf","19","-preset","veryfast","-pix_fmt","yuv420p",str(sample)],timeout=150)
                obj["sample_encode"]=cr
                if cr["rc"]==0 and sample.exists():
                    obj["sample_bytes"]=sample.stat().st_size
                    obj["sample_sha256"]=hashlib.sha256(sample.read_bytes()).hexdigest()
                    decode=call(["ffmpeg","-v","error","-xerror","-i",str(sample),"-f","null","-"],timeout=80)
                    obj["full_sample_decode_pass"]=decode["rc"]==0
                    obj["decode_errors"]=decode.get("stderr","")
                    # QA jpeg files (not playable raw media) for operator visual inspection.
                    frames=[]
                    for ts in [0.7,2.8,5.1]:
                        dest=OUT/f"{name}-t{str(ts).replace('.','_')}.jpg"
                        fr=call(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(ts),"-i",str(sample),"-frames:v","1","-vf","scale=640:-2","-q:v","4","-y",str(dest)],timeout=20)
                        if fr["rc"]==0 and dest.exists(): frames.append(dest.name)
                    obj["qa_frames"]=frames
                    obj["result"]="sample_decoded" if decode["rc"]==0 else "decode_failed"
                else: obj["result"]="sample_encode_failed"
            else: obj["result"]="ffprobe_failed"
    except Exception:
        obj["result"]="unexpected_error";obj["error"]=traceback.format_exc()[-2000:]
    (OUT/(name+".json")).write_text(json.dumps(obj,indent=2))
    results.append(obj)
    # Any unapproved source bytes MUST be removed before artifact upload.
    shutil.rmtree(folder,ignore_errors=True)
manifest={
 "report_utc":datetime.now(timezone.utc).isoformat(),
 "agent":"C2","repository":"YunRah2103/Remotion-gpt-chat",
 "acquisition_sources_checked":len(results),
 "decoded_samples":sum(r.get("full_sample_decode_pass",False) for r in results),
 "rights_cleared_assets":0,
 "delivered_mp4_assets":0,
 "samples_permanently_deleted":True,
 "note":"Each downloaded candidate is TEMPORARY. Only reports/JPEG contact frames uploaded. Source HD != editor approved; C8/authenticity/motion require visual confirmation; raw reuse permission missing.",
 "sources":results,
}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2))
print(json.dumps({"decoded_samples":manifest["decoded_samples"],"source_results":[(r["id"],r.get("result"),r.get("native_width"),r.get("native_height")) for r in results]},indent=2))
