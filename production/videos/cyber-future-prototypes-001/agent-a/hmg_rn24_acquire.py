#!/usr/bin/env python3
"""Obtain Hyundai Motor Group RN24 first-party H.264 original and native screenshot proof."""
from pathlib import Path
import requests,json,hashlib,subprocess,math,csv,os
O=Path("out/cyber-future-rn24-source");(O/"originals").mkdir(parents=True,exist_ok=True);(O/"contact_sheets").mkdir(parents=True,exist_ok=True)
URL="https://d338d8ftck8b1o.cloudfront.net/vod/FIL00000000000240802/11086494605c47e68eb2af3e0dc057c2/MP4/11086494605c47e68eb2af3e0dc057c2_1080p.mp4"
P=O/"originals/rn24_n_day_2024_official_1080p.mp4"
S=requests.Session();S.headers["User-Agent"]="Mozilla/5.0 Chrome/129.0 Safari/537.36"
r=S.head(URL,timeout=(15,30));print("HEAD",r.status_code,r.headers.get("Content-Type"),r.headers.get("Content-Length"),flush=True)
r.raise_for_status()
if int(r.headers.get("Content-Length") or 0)>900*1024*1024:raise RuntimeError("Original too large for bounded acquisition")
total=0
with S.get(URL,stream=True,timeout=(20,90)) as r:
 r.raise_for_status()
 if "text/html" in r.headers.get("Content-Type",""):raise RuntimeError("not media")
 with P.open("wb") as f:
  for b in r.iter_content(1048576):
   if b:
    f.write(b);total+=len(b)
    if total>900*1024*1024:raise RuntimeError("Exceeds media size cap")
print("DOWNLOADED",total,flush=True)
probe=json.loads(subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(P)],capture_output=True,text=True,check=True,timeout=60).stdout)
v=next(x for x in probe["streams"] if x["codec_type"]=="video")
dur=float(probe["format"]["duration"])
if v["width"]<1920 or v["height"]<1080:raise RuntimeError("Native resolution below threshold")
sha=hashlib.sha256(P.read_bytes()).hexdigest()
manifest={"source_url":URL,"source_page":"https://www.hyundaimotorgroup.com/en/tv/CONT0000000000163250","publisher":"Hyundai Motor Group official video","model_claim":"Hyundai RN24 Rolling Lab","authenticity":"requires human screenshot verification before acceptance","filming_type":"requires manual scene-level review","width":v["width"],"height":v["height"],"duration":dur,"fps":v.get("avg_frame_rate"),"codec":v["codec_name"],"bitrate":probe["format"].get("bit_rate"),"size":total,"sha256":sha,"original_audio":any(x["codec_type"]=="audio" for x in probe["streams"]),"rights":"unconfirmed: source is publicly exposed first-party direct video; no redistribution rights claimed"}
subprocess.run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(P),"-f","null","-"],check=True,timeout=250)
for i in range(40):
 pos=dur*(i+.5)/40
 p=O/"contact_sheets"/f"rn24_frame_{i:02d}_{pos:05.1f}.jpg"
 subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(pos),"-i",str(P),"-frames:v","1","-vf","scale=640:-2",str(p)],capture_output=True,text=True,timeout=45)
print("QA_PASS_DECODER",manifest,flush=True)
(O/"manifest.json").write_text(json.dumps(manifest,indent=2))
(O/"README_START_HERE.md").write_text("Video file and 40 equally spaced genuine frames from first-party Hyundai Motor Group N Day 2024 RN24 1080p film. Technical verified, NOT full visual acceptance until individual camera shots checked for real physical RN24 driving, CGI, title cards and POV diversity.\\n")
