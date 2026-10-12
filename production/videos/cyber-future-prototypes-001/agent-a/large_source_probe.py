#!/usr/bin/env python3
"""Review full-quality official manufacturer MP4s that exceeded the initial 260 MB probe.

Produces visual evidence and small actual 1080p excerpt for manual car/CGI verification.
Does NOT silently approve or redistribute huge unreviewed sources.
"""
import requests,subprocess,json,hashlib,os
from pathlib import Path
O=Path("out/agent-a-large-source-probe");O.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers["User-Agent"]="Mozilla/5.0 Chrome/129.0.0.0 Safari/537.36"
SOURCES=[
("mazda_iconic_sp","https://mmx.prnewswire.com/media/MS1808399/20231024_mazda_360D.mp4?p=download","Mazda Iconic SP","Mazda USA Newsroom; editorial use only, no advertising/marketing"),
("hyundai_pony_coupe","https://cdn7.shift.agency/eu/2023/05/hyundai-pony-coupe-concept-restored.mp4","Hyundai Pony Coupe rebuilt physical concept","Hyundai Motor Europe; usage permissions unconfirmed"),
]
record=[]
for stem,url,name,permission in SOURCES:
 path=O/(stem+".mp4");info={"label":name,"source":url,"provenance":permission}
 try:
  resp=S.head(url,allow_redirects=True,timeout=(15,30))
  info["head_status"]=resp.status_code
  info["head_content_length"]=resp.headers.get("content-length")
  info["head_type"]=resp.headers.get("content-type")
  info["accept_ranges"]=resp.headers.get("accept-ranges")
  print("HEAD",stem,info["head_status"],info["head_content_length"],info["head_type"],flush=True)
  # Avoid 1GB hosted transfer, large enough for a genuine source probe
  if resp.status_code==200 and (int(resp.headers.get("content-length","0") or 0)>950*1024*1024):raise RuntimeError("oversized >950MB")
  r=S.get(url,stream=True,timeout=(20,120));r.raise_for_status()
  total=0
  with path.open("wb") as f:
   for b in r.iter_content(2**20):
    if not b:continue
    total+=len(b)
    if total>950*1024*1024:raise RuntimeError(">950MB max")
    f.write(b)
  print("BYTES",stem,total,flush=True)
  j=json.loads(subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],capture_output=True,text=True,timeout=80,check=True).stdout)
  v=next(s for s in j["streams"] if s["codec_type"]=="video")
  d=float(j["format"].get("duration") or 0)
  info.update(width=v["width"],height=v["height"],codec=v["codec_name"],duration=d,fps=v.get("avg_frame_rate"),bitrate=j["format"].get("bit_rate"),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=total)
  if not((v["width"]>=1920 and v["height"]>=1080) or(v["width"]>=1080 and v["height"]>=1920)):raise RuntimeError("BELOW_NATIVE_1080")
  for n,frac in enumerate((.03,.10,.17,.24,.31,.40,.48,.55,.62,.70,.77,.85,.92,.97)):
   ff=O/f"{stem}_screen{n:02}.jpg"
   subprocess.run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(round(d*frac,3)),"-i",str(path),"-frames:v","1","-vf","scale=640:-2",str(ff)],timeout=40)
  # Transcode 2secs native full HD, capture major source view, compact preview.
  out=O/(stem+"_middle2sec.mp4")
  cmd=["ffmpeg","-nostdin","-y","-v","error","-ss",str(d*.42),"-i",str(path),"-t","2","-map","0:v:0","-an","-vf","scale='min(1920,iw)':-2","-c:v","libx264","-crf","20","-preset","fast","-pix_fmt","yuv420p",str(out)]
  z=subprocess.run(cmd,capture_output=True,text=True,timeout=90)
  info["preview_file"]=out.name if z.returncode==0 else None
  # Keep previews and verified metadata in artifact; original huge media not uploaded until visually approved
  info["probe"] ="TECHNICALLY_OK_PENDING_VISUAL_QA"
  print("PROBED",stem,info["width"],info["height"],"duration",d,"preview",info["preview_file"],flush=True)
 except Exception as e:
  info["error"]=str(e);print("FAILED",stem,str(e),flush=True)
 finally:
  path.unlink(missing_ok=True)
  record.append(info)
(O/"source_manifest.json").write_text(json.dumps(record,indent=2))
(O/"README.md").write_text("Source-review material only: 14 genuine screenshots per film and native-derived playable 2s sample where downloaded. Not yet approved for creative publication. Check physical car and CGI. Original source URLs and SHA in source_manifest.json. Mazda newsroom grants editorial-only use, no commercial marketing.\\n")
print("PROBE_COMPLETE",sum(x.get("probe")=="TECHNICALLY_OK_PENDING_VISUAL_QA" for x in record),flush=True)
