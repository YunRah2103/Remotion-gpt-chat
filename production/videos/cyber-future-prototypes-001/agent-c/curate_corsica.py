#!/usr/bin/env python3
"""Download original real 2025 Corsica R5 film and scene-cut decodable 1080p candidates."""
import hashlib,json,re,subprocess,urllib.request,zipfile
from pathlib import Path
BASE=Path("out/cyber-future-c");OUT=BASE/"corsica_physical_2025"
ORIG=OUT/"originals";CLIP=OUT/"clips";FRAMES=OUT/"frames"
for p in (ORIG,CLIP,FRAMES):p.mkdir(parents=True,exist_ok=True)
URL="https://www.auto-medienportal.net/video/load/original/3469/"
SRC=ORIG/"renault_r5_turbo_3e_real_corsica_2025_original.mp4"
def cmd(argv,timeout=120):
 r=subprocess.run(argv,capture_output=True,text=True,timeout=timeout)
 if r.returncode:raise RuntimeError(r.stderr[-300:])
 return r
def hashfile(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def main():
 req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0"})
 with urllib.request.urlopen(req,timeout=35) as resp,SRC.open("wb") as f:
  while data:=resp.read(1048576):
   f.write(data)
   if f.tell()>100*1024*1024:raise RuntimeError("original unexpectedly over 100 MB")
 meta=json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(SRC)],25).stdout)
 v=next(x for x in meta["streams"] if x["codec_type"]=="video")
 assert (v["width"],v["height"])==(1920,1080)
 dur=float(meta["format"]["duration"]);original_sha=hashfile(SRC)
 cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(SRC),"-map","0:v:0","-f","null","-"],150)
 # Genuine original camera cut boundaries; never falsely label consecutive take trims as distinct shots.
 p=cmd(["ffmpeg","-nostdin","-v","info","-i",str(SRC),"-vf","select=gt(scene\\,0.26),showinfo","-an","-f","null","-"],120)
 stamps=[float(t) for t in re.findall(r"pts_time:([0-9.]+)",p.stderr)]
 starts=[0.0]+[t for t in stamps if 1.0<t<dur-1.0]+[dur]
 starts.sort();cuts=[]
 for t in starts:
  if not cuts or t-cuts[-1]>=1.3:cuts.append(round(t,3))
 if dur-cuts[-1]>.5:cuts.append(dur)
 print("CUT_BOUNDARIES",cuts,flush=True)
 entries=[]
 for lo,hi in zip(cuts,cuts[1:]):
  if lo<3.0 or hi-lo<1.55:continue
  start=lo+.1;length=min(3.2,hi-start-.12)
  if length<1.3:continue
  out=CLIP/f"R5_CORSICA_REAL_{len(entries)+1:02d}.mp4"
  cmd(["ffmpeg","-nostdin","-v","error","-ss",str(start),"-i",str(SRC),"-t",str(length),"-map","0:v:0","-map","0:a:0?","-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-y",str(out)],100)
  cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(out),"-map","0:v:0","-f","null","-"],45)
  for i,fraction in enumerate([.1,.5,.9],1):
   cmd(["ffmpeg","-nostdin","-v","error","-ss",str(length*fraction),"-i",str(out),"-frames:v","1","-vf","scale=760:-2","-y",str(FRAMES/f"{out.stem}_frame{i}.jpg")],35)
  entries.append({"file":str(out.relative_to(BASE)),"vehicle":"Renault 5 Turbo 3E, 2025 real Corsica prototype","original_url":URL,"publisher_page":"https://www.auto-medienportal.net/artikel/detail/68630","source_sha256":original_sha,"clip_sha256":hashfile(out),"source_in":start,"source_out":start+length,"width":1920,"height":1080,"real_camera":"MANUAL REVIEW PENDING","rights":"NOT CLEARED - Renault press distribution"})
  print("NEW_CAMERA_CANDIDATE",len(entries),round(start,2),round(length,2),flush=True)
  if len(entries)>=22:break
 (OUT/"manifest.json").write_text(json.dumps(entries,indent=2))
 (OUT/"qa.json").write_text(json.dumps({"real_original_bytes":SRC.stat().st_size,"sha256":original_sha,"original_native_resolution":"1920x1080","all_video_decoded":True,"candidate_shots":len(entries),"manual_approval":"PENDING","rights":"NOT CLEARED"},indent=2))
 archive=BASE.parent/"CYBER-FUTURE-001-FOOTAGE-C.zip"
 with zipfile.ZipFile(archive,"a",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
  for f in sorted(OUT.rglob("*")):
   if f.is_file():z.write(f,f.relative_to(BASE))
 print("DONE",json.dumps({"segments":len(entries),"archive_sha256":hashfile(archive),"archive_bytes":archive.stat().st_size}),flush=True)
if __name__=="__main__":main()
