#!/usr/bin/env python3
"""Agent C: test genuine 2025 Alpine Hy6 real-life Spa dynamic source at native HD.
Download only public streams; never fabricate 1080p by enlarging 720p.
"""
import json,hashlib,subprocess
from pathlib import Path
import yt_dlp
ROOT=Path("out/agent_c_alpine_hy6");ROOT.mkdir(parents=True,exist_ok=True)
URLS=[
 ("hy6_spa_live_2025","https://www.dailymotion.com/video/x9sxkkc"),
 ("hy6_spa_secondary","https://www.dailymotion.com/video/x9syzt8")]
def call(cmd,secs=120):
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=secs)
 if p.returncode:raise RuntimeError(p.stderr[-220:])
 return p.stdout
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
def main():
 audit=[];manifest=[]
 for label,url in URLS:
  info={"id":label,"url":url}
  try:
   opts={"quiet":True,"no_warnings":True,"skip_download":True,"noplaylist":True,"socket_timeout":20,"retries":1,"geo_bypass":False}
   with yt_dlp.YoutubeDL(opts) as ydl:metadata=ydl.extract_info(url,download=False)
   formats=[{"id":f.get("format_id"),"width":f.get("width"),"height":f.get("height"),"vcodec":f.get("vcodec"),"ext":f.get("ext")} for f in metadata.get("formats",[]) if f.get("vcodec") not in ("none",None)]
   hd=[f for f in formats if (f.get("width") or 0)>=1920 and (f.get("height") or 0)>=1080]
   info["available_video_formats"]=formats[-28:];info["native_1080plus"]=[f["id"] for f in hd]
   if not hd:raise RuntimeError("No native >=1920x1080 source exposed; REJECT, no upscale")
   dest=str(ROOT/(label+".%(ext)s"))
   with yt_dlp.YoutubeDL({"quiet":False,"no_warnings":True,"format":"bv*[width>=1920][height>=1080]+ba/b[width>=1920][height>=1080]","outtmpl":dest,"merge_output_format":"mp4","noplaylist":True,"socket_timeout":30,"retries":2}) as ydl:ydl.download([url])
   originals=[p for p in ROOT.glob(label+".*") if p.suffix.lower() in (".mp4",".mkv",".webm",".mov")]
   if not originals:raise RuntimeError("No media bytes saved")
   video=originals[0]
   j=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(video)],30))
   v=next(x for x in j["streams"] if x.get("codec_type")=="video")
   if v["width"]<1920 or v["height"]<1080:raise RuntimeError("download decoded below native 1080")
   duration=float(j["format"]["duration"])
   call(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(video),"-map","0:v:0","-f","null","-"],min(240,30+int(duration*4)))
   for i,t in enumerate([0.08,0.26,0.43,0.59,0.76,0.92]):
    call(["ffmpeg","-nostdin","-v","error","-ss",str(duration*t),"-i",str(video),"-frames:v","1","-vf","scale=760:-2","-y",str(ROOT/(label+f"_frame{i+1}.jpg"))],30)
   manifest.append({"file":video.name,"url":url,"model":"Alpine Alpenglow Hy6 physical prototype (footage authenticity pending)","resolution":[v["width"],v["height"]],"duration":duration,"sha256":sha(video),"camera_authenticity":"UNREVIEWED","reuse_permission":"UNKNOWN"})
   info["downloaded"]=True;info["sha256"]=sha(video)
  except Exception as e:
   info["error"]=str(e)[:300];print("REJECT",label,info["error"],flush=True)
  audit.append(info)
 (ROOT/"probe_audit.json").write_text(json.dumps(audit,indent=2))
 (ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2))
 (ROOT/"README.md").write_text("# Alpine Hy6 2025 source QA\n\nNative 1080p required without upscale. Only material actually downloaded and FFmpeg decoded counts. Filmed camera authenticity and reuse permissions require separate manual review.\n")
 print("HY6_RESULT",len(manifest),json.dumps([{"id":a["id"],"native_1080plus":a.get("native_1080plus"),"error":a.get("error")} for a in audit]),flush=True)
if __name__=="__main__":main()
