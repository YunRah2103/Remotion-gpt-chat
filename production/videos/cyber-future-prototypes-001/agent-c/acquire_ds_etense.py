#!/usr/bin/env python3
"""Agent C second-model DS E-TENSE Performance native-source candidate probe.
Do not call any frames verified real-camera until a human reviews the actual contact sheets.
"""
import hashlib,json,re,subprocess,urllib.request,zipfile
from pathlib import Path
ROOT=Path("out/agent-c-ds-etense")
ROOT.mkdir(parents=True,exist_ok=True)
URL="https://video.wixstatic.com/video/3d5fff_b9f7fda46c034904b72080e88292b0cd/1080p/mp4/file.mp4"
PAGE="https://www.passionnement-citroen.com/post/concept-ds-e-tense-performance-toutes-les-photos"
ORIG=ROOT/"DS_ETENSE_PERFORMANCE_SOURCE_ORIGINAL.mp4"
def ff(a,timeout=100):
 r=subprocess.run(a,capture_output=True,text=True,timeout=timeout)
 if r.returncode:raise RuntimeError(r.stderr[-360:])
 return r
def h(path):
 x=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):x.update(b)
 return x.hexdigest()
def main():
 req=urllib.request.Request(URL,headers={"User-Agent":"Mozilla/5.0","Accept":"*/*"})
 with urllib.request.urlopen(req,timeout=40) as stream,ORIG.open("wb") as out:
  n=0
  while chunk:=stream.read(1<<20):
   n+=len(chunk)
   if n>240*(1<<20):raise RuntimeError("Over 240MB original limit")
   out.write(chunk)
 assert b"ftyp" in ORIG.read_bytes()[:128],"not an MP4"
 meta=json.loads(ff(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(ORIG)],30).stdout)
 video=next(s for s in meta["streams"] if s.get("codec_type")=="video")
 duration=float(meta["format"]["duration"])
 print("SOURCE",json.dumps({"bytes":ORIG.stat().st_size,"sha":h(ORIG),"width":video["width"],"height":video["height"],"fps":video["avg_frame_rate"],"duration":duration}),flush=True)
 assert video["width"]>=1920 and video["height"]>=1080,"source below native HD"
 ff(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(ORIG),"-map","0:v:0","-f","null","-"],min(220,30+int(duration*4)))
 sd=ff(["ffmpeg","-nostdin","-v","info","-i",str(ORIG),"-vf","select=gt(scene\\,0.25),showinfo","-an","-f","null","-"],min(220,30+int(duration*3)))
 stamps=[float(x) for x in re.findall(r"pts_time:([0-9.]+)",sd.stderr)]
 edges=[0.0]+[t for t in stamps if .8<t<duration-1]+[duration]
 cuts=[]
 for t in edges:
  if not cuts or t-cuts[-1]>1.1:cuts.append(round(t,3))
 if cuts[-1]<duration-.4:cuts.append(duration)
 print("CUTS",cuts,flush=True)
 records=[]
 for lo,hi in zip(cuts,cuts[1:]):
  start=lo+.08
  length=min(3.0,hi-start-.12)
  if length<1.3:continue
  idx=len(records)+1
  output=ROOT/f"DS_ETENSE_{idx:02d}_CANDIDATE.mp4"
  ff(["ffmpeg","-nostdin","-v","error","-ss",str(start),"-i",str(ORIG),"-t",str(length),"-map","0:v:0","-an","-c:v","libx264","-preset","veryfast","-crf","18","-y",str(output)],90)
  ff(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(output),"-f","null","-"],35)
  for j,fraction in enumerate([.1,.5,.9],1):
   ff(["ffmpeg","-nostdin","-v","error","-ss",str(length*fraction),"-i",str(output),"-frames:v","1","-vf","scale=780:-2","-y",str(ROOT/f"DS_ETENSE_{idx:02d}_frame{j}.jpg")],35)
  records.append({"file":output.name,"source_original":URL,"source_page":PAGE,
      "vehicle":"DS E-TENSE Performance physical engineering demonstrator 2022",
      "original_sha256":h(ORIG),"sha256":h(output),"source_in":start,"source_out":start+length,
      "width":video["width"],"height":video["height"],"fps":video["avg_frame_rate"],
      "human_camera_proof":"UNREVIEWED; footage may include CGI","rights":"NOT CLEAR FOR PUBLISHING"})
  print("SECOND_MODEL_CANDIDATE",idx,start,round(length,2),flush=True)
  if len(records)>=18:break
 (ROOT/"manifest.json").write_text(json.dumps(records,indent=2))
 (ROOT/"README.md").write_text("# Agent C — DS E-TENSE Performance video QA\n\n"+
    f"{len(records)} native-HD scene-separated candidate segments. Model is a real manufactured driving prototype but *the video frames* require actual photographic authenticity inspection. "+
    "No shot accepted until human review. Publisher source usage rights not confirmed. Included original video and contact JPEG frames.\n")
 zipfile.ZipFile("out/CYBER-C-DS-ETENSE-QA.zip","w",zipfile.ZIP_STORED,allowZip64=True).close()
 with zipfile.ZipFile("out/CYBER-C-DS-ETENSE-QA.zip","a",zipfile.ZIP_STORED,allowZip64=True) as bundle:
  for file in sorted(ROOT.iterdir()):
   if file.is_file():bundle.write(file,file.name)
 print("READY",len(records),Path("out/CYBER-C-DS-ETENSE-QA.zip").stat().st_size,flush=True)
if __name__=="__main__":main()
