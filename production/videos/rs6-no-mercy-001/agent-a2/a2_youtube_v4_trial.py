#!/usr/bin/env python3
"""A2 YT V4 actual acceptance + independent cloud download attempt.
Uses V4's exact strict prepare function, does not fake owner catalog approval.
"""
import importlib.util, hashlib, json, pathlib, subprocess, sys, time, urllib.request
ROOT=pathlib.Path("a2_youtube_v4");ROOT.mkdir(exist_ok=True)
V4=pathlib.Path("v4/production/phone_footage/agent_jobs_v4.py")
SOURCES=[
 ("Niterun C8 Zurich night", "https://www.youtube.com/watch?v=a38sqC7k2iw",20,12),
 ("Maku Media C8 Munich night", "https://www.youtube.com/watch?v=pzhKoJAb1ek",10,12)
]
def run(cmd,timeout=90):
 try:
  p=subprocess.run(cmd,stdin=subprocess.DEVNULL,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
  return {"returncode":p.returncode,"stdout":p.stdout[-1700:],"stderr":p.stderr[-1200:]}
 except Exception as e:return {"error":repr(e)}
report={"purpose":"actual V4 parser eligibility plus alternate network 1080p YouTube acquisition; source files are private temp only",
 "V4_branch":"experiments/s25-footage-worker-v4-10min-20261012",
 "worker_runtime":"Phone worker only runs in Termux (not on GitHub)",
 "source_results":[]}
for label,url,start,duration in SOURCES:
 row={"name":label,"youtube_url":url,"start":start,"duration":duration,"height":1080}
 report["source_results"].append(row)
 # Exact V4 helper (not a fake validation regex)
 cmd=["python",str(V4),"prepare","--url",url,"--start",str(start),
      "--duration",str(duration),"--height","1080"]
 prep=run(cmd,25)
 row["v4_real_prepare_returncode"]=prep.get("returncode")
 row["v4_accepts"]=prep.get("returncode")==0
 row["v4_reason"]="not in owner-reviewed V4 registry" if prep.get("returncode")!=0 else "source was verified approved"
 row["v4_error"]=prep.get("stderr","")[-500:]
 # Independent cloud youtube extraction if available; yt-dlp is not the V4 phone worker.
 row["cloud_metadata"]=run(["yt-dlp","--no-playlist","--skip-download",
       "--no-warnings","--js-runtimes","node","--socket-timeout","18",
       "--print","title","--print","duration","--print","license",url],80)
 if row["cloud_metadata"].get("returncode")!=0:
  row["cloud_download"]="skipped_after_metadata_failure"
  continue
 f=ROOT/("temp_"+str(len(report["source_results"]))+".mp4")
 cmd=["yt-dlp","--no-playlist","--no-warnings","--js-runtimes","node",
      "--socket-timeout","18","--retries","1","--fragment-retries","1",
      "--download-sections",f"*{start}-{start+6}","--force-keyframes-at-cuts",
      "-f","bv*[height<=1080]+ba/b[height<=1080]/b","--merge-output-format","mp4",
      "-o",str(f),url]
 result=run(cmd,130)
 row["cloud_download"]={"code":result.get("returncode"),"stderr":result.get("stderr","")[-900:]}
 videos=list(ROOT.glob("temp_*"))
 if videos:
  actual=videos[0];row["download_bytes"]=actual.stat().st_size
  row["sha256"]=hashlib.sha256(actual.read_bytes()).hexdigest()
  row["ffprobe"]=run(["ffprobe","-v","error","-show_entries","stream=codec_type,codec_name,width,height,r_frame_rate:format=duration",
    "-of","json",str(actual)],25)
  row["full_decode"]=run(["ffmpeg","-v","error","-i",str(actual),"-f","null","-"],50)
  actual.unlink(missing_ok=True)
report["completed_utc"]=time.strftime("%FT%TZ",time.gmtime())
(ROOT/"V4_YT_RESULT.json").write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
