#!/usr/bin/env python3
"""Probe Renault Cyprus published Filante Record 2025 film for REAL native-HD exterior motion."""
from pathlib import Path
import hashlib,json,subprocess,urllib.request
ROOT=Path("out/agent-c-filante-cyprus");ROOT.mkdir(parents=True,exist_ok=True)
URL="https://renault.com.cy/wp-content/uploads/2026/01/renault-filante-record-z41-concept-020.mp4"
ORIG=ROOT/"FILANTE_RECORD_CYPRUS_020_ORIGINAL.mp4"
def digest(f):
 h=hashlib.sha256()
 with f.open("rb") as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b""):h.update(chunk)
 return h.hexdigest()
def run(cmd,timeout=220):
 p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-350:])
 return p.stdout
def main():
 audit={"source":URL,"source_page":"https://renault.com.cy/renault-z41/","status":"UNREVIEWED","candidate_reuse_rights":"UNKNOWN"}
 try:
  req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0","Accept":"*/*"})
  with urllib.request.urlopen(req,timeout=45) as src,ORIG.open("wb") as dest:
   size=0
   while True:
    block=src.read(1024*1024)
    if not block:break
    size+=len(block)
    if size>260*1024*1024:raise RuntimeError("Source above 260 MiB cap")
    dest.write(block)
  if b"ftyp" not in ORIG.read_bytes()[:128]:raise RuntimeError("not MP4")
  meta=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(ORIG)],30))
  v=next(s for s in meta["streams"] if s["codec_type"]=="video")
  duration=float(meta["format"]["duration"])
  audit.update({"bytes":size,"sha256":digest(ORIG),"width":v["width"],"height":v["height"],
    "fps":v["avg_frame_rate"],"duration":duration})
  if v["width"]<1920 or v["height"]<1080:
   audit["status"]="REJECT_BELOW_NATIVE_1080P";ORIG.unlink();return
  run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(ORIG),"-map","0:v:0","-f","null","-"],min(240,int(duration*4+30)))
  for i in range(1,31):
   t=min(duration-.2,duration*((i-.5)/30))
   run(["ffmpeg","-nostdin","-v","error","-ss",str(t),"-i",str(ORIG),
      "-frames:v","1","-vf","scale=800:-2","-y",str(ROOT/f"frame_{i:02}.jpg")],35)
  audit["status"]="TECHNICALLY_VERIFIED_PENDING_HUMAN_FRAME_QA"
 except Exception as e:
  audit["status"]="FETCH_OR_DECODE_FAILED";audit["error"]=str(e)[:400]
 finally:
  (ROOT/"audit.json").write_text(json.dumps(audit,indent=2))
  (ROOT/"README.md").write_text("Filante Cyprus *potential* native-HD ORIGINAL video; all motion/authenticity and rights require human QA. Never infer PASS from successful workflow.")
  print("FILANTE_CYPRUS_QA",json.dumps(audit),flush=True)
if __name__=="__main__":main()
