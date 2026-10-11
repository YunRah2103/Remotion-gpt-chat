#!/usr/bin/env python3
"""FR Legends Agent A: download genuine Commons classics native pixels + native-resolution MP4 proofs.
No model/angle PASS is inferred from video filename. Produces a single real-media ZIP if possible.
"""
import csv,hashlib,json,subprocess,urllib.parse,urllib.request,zipfile,shutil
from pathlib import Path
from fractions import Fraction
BASE=Path("out/fr-classics-commons"); CLIPS=BASE/"clips";ORIG=BASE/"originals";SHEETS=BASE/"contact_sheets"
for d in (CLIPS,ORIG,SHEETS):d.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {"slug":"citroen-2cv-convoy-2022","model":"Citroën 2CV","title":"File:Multiple Citroën 2CV vehicles driving by (east Netherlands, 2022).webm","creator":"OSeveno","license":"CC BY-SA 4.0","shot_in":1,"duration":7,"notes":"4K original; 2CV convoy moving by same stationary camera"},
 {"slug":"citroen-2cv-meeting-2025","model":"Citroën 2CV","title":"File:2025 - 25th World Meeting of 2CV Friends in Slovenja.webm","creator":"komik video (verify page)","license":"CC BY 4.0 (verify page)","shot_in":1,"duration":7,"notes":"1080 original gathering, moving shot/model unverified"},
 {"slug":"citroen-ds-oldtimer-2024","model":"Citroën DS (within mixed-car compilation)","title":"File:Oldtimer Meeting - Bistra pri Vrhniki - SLOVENIA.webm","creator":"Jan Šefran","license":"CC BY 3.0 - Wikimedia license review pending","shot_in":1,"duration":7,"notes":"1080 mixed-car video, DS *may not appear in selected 7s*: needs visual review"},
]
USER_AGENT="YUNEX-ClassicFrenchFootageAcquisition/1.0 (https://github.com/YunRah2103/Remotion-gpt-chat)"
def sha(path):
 h=hashlib.sha256()
 with open(path,"rb") as f:
  for data in iter(lambda:f.read(1048576),b""):h.update(data)
 return h.hexdigest()
def sh(cmd,t=180):
 r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=t)
 if r.returncode:raise RuntimeError("command_failed "+r.stderr[-500:])
 return r.stdout
def probe(path):
 obj=json.loads(sh(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]))
 stream=next((v for v in obj["streams"] if v.get("codec_type")=="video"),None)
 if not stream:raise RuntimeError("NO_VIDEO")
 width,height=int(stream["width"]),int(stream["height"])
 r=stream.get("avg_frame_rate","0/1")
 fps=float(Fraction(r)) if r!="0/0" else 0
 return {"width":width,"height":height,"fps":round(fps,4),"duration":float(obj["format"].get("duration",0)),
         "codec":stream.get("codec_name",""),"format_bitrate":int(obj["format"].get("bit_rate") or 0),
         "original_audio":any(x["codec_type"]=="audio" for x in obj["streams"])}
def full_native(p):
 w,h=p["width"],p["height"]
 return ((1920<=w<=3840 and 1080<=h<=2160 and abs(w/h-16/9)<.02) or
         (1080<=w<=2160 and 1920<=h<=3840 and abs(w/h-9/16)<.02)) and p["fps"]>=23
def media_info(title):
 # Source of truth from Commons API; never trust tags to certify identity.
 params=urllib.parse.urlencode({"action":"query","titles":title,"prop":"imageinfo",
                               "iiprop":"url|size|mime|extmetadata","format":"json","formatversion":"2"})
 with urllib.request.urlopen(urllib.request.Request("https://commons.wikimedia.org/w/api.php?"+params,headers={"User-Agent":USER_AGENT}),timeout=40) as r:
  j=json.loads(r.read())
 page=j["query"]["pages"][0]
 if "missing" in page:raise RuntimeError("COMMONS_MISSING_FILE")
 info=page["imageinfo"][0]
 return {"url":info["url"].split("?")[0],"page":info["descriptionurl"],
         "api_width":info.get("width"),"api_height":info.get("height"),"bytes_reported":info.get("size"),
         "api_license":info.get("extmetadata",{}).get("LicenseShortName",{}).get("value"),
         "artist_html":info.get("extmetadata",{}).get("Artist",{}).get("value","")[:200]}
def download(url,dest,max_bytes=250_000_000):
 req=urllib.request.Request(url,headers={"User-Agent":USER_AGENT})
 with urllib.request.urlopen(req,timeout=85) as resp:
  if "video" not in (resp.headers.get("Content-Type","")) and "application/octet-stream" not in resp.headers.get("Content-Type",""):
   raise RuntimeError("NOT_VIDEO_CONTENT_TYPE: "+str(resp.headers.get("Content-Type")))
  cl=int(resp.headers.get("Content-Length") or 0)
  if cl and cl>max_bytes:raise RuntimeError("TOO_LARGE_"+str(cl))
  n=0
  with open(dest,"wb") as f:
   while True:
    chunk=resp.read(1048576)
    if not chunk:break
    n+=len(chunk)
    if n>max_bytes: raise RuntimeError("MAX_BYTES")
    f.write(chunk)
 if n<200000:raise RuntimeError("SUSPICIOUSLY_SMALL_"+str(n))
 return n
def sheet(path,name,duration):
 from PIL import Image,ImageDraw
 frames=[]
 for i,t in enumerate([duration*.08,duration*.30,duration*.50,duration*.70,duration*.92]):
  frame=SHEETS/(name+"-"+str(i)+".png")
  sh(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(round(t,2)),"-i",str(path),
      "-frames:v","1","-vf","scale=480:-2",str(frame)],t=70)
  with Image.open(frame) as im:
   img=im.convert("RGB");img.thumbnail((448,260))
   frames.append(img.copy())
  frame.unlink(missing_ok=True)
 canvas=Image.new("RGB",(1500,640),"#101216")
 draw=ImageDraw.Draw(canvas);draw.text((16,12),name+" SOURCE VIDEO / FIVE DISTINCT TIMESTAMPS",fill="white")
 for i,im in enumerate(frames):canvas.paste(im,((i%3)*500+10,(i//3)*280+50))
 out=SHEETS/(name+"-sheet.jpg");canvas.save(out,quality=90)
 return str(out.relative_to(BASE))
entries=[]
for s in SOURCES:
 row={**s,"status":"REJECTED_OR_UNAVAILABLE","identity_visual_verified":False,
      "moving_cinematography_verified":False,"unique_angle_verified":False,
      "publication_attribution_required":True,"counted_towards_gate_a":False}
 try:
  m=media_info(s["title"]);row["commons"]=m
  filename=s["slug"]+".webm";origin=ORIG/filename
  print("DOWNLOAD",s["slug"],m["url"],"api_res",m["api_width"],m["api_height"],flush=True)
  row["downloaded_bytes"]=download(m["url"],origin)
  source=probe(origin)
  row["original_probe"]=source;row["original_sha256"]=sha(origin)
  if not full_native(source):raise RuntimeError("NOT_1080P_NATIVE_"+str(source))
  # H264/AAC MP4 is for editor convenience, full source remains in the ZIP.
  start=s["shot_in"]; length=min(s["duration"],source["duration"]-start-.1)
  if length<3:raise RuntimeError("TOO_SHORT")
  mp4=CLIPS/(s["slug"]+".mp4")
  sh(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(origin),
      "-t",str(length),"-map","0:v:0","-map","0:a?","-c:v","libx264","-preset","veryfast",
      "-crf","19","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-movflags","+faststart",
      str(mp4)],t=240)
  info=probe(mp4)
  if not full_native(info) or (info["width"],info["height"])!=(source["width"],source["height"]):
   raise RuntimeError("OUTPUT_RESOLUTION_MISMATCH")
  sh(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(mp4),
      "-map","0:v:0","-f","null","-"],t=150)
  row.update({"clip_path":str(mp4.relative_to(BASE)),"clip_sha256":sha(mp4),
     "mp4_probe":info,"clip_start":start,"clip_end":round(start+length,2),
     "contact_sheet":sheet(origin,s["slug"],source["duration"]),
     "status":"TECHNICAL_CANDIDATE_VISUAL_IDENTITY_AND_LICENSE_REVIEW_PENDING"})
  print("VALID_TECHNICAL_CLIP",s["slug"],info,flush=True)
 except Exception as ex:
  row["reason"]=str(ex)[:800]
  print("ERROR_SOURCE",s["slug"],row["reason"],flush=True)
  (ORIG/(s["slug"]+".webm")).unlink(missing_ok=True)
  (CLIPS/(s["slug"]+".mp4")).unlink(missing_ok=True)
 entries.append(row)
 (BASE/"manifest.json").write_text(json.dumps(entries,indent=2,ensure_ascii=False))
 with (BASE/"manifest.csv").open("w",newline="") as f:
  cols=["slug","model","creator","license","status","clip_path","clip_sha256",
        "identity_visual_verified","moving_cinematography_verified","unique_angle_verified",
        "counted_towards_gate_a","reason"]
  c=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore");c.writeheader();c.writerows(entries)
n=sum(x["status"].startswith("TECHNICAL_") for x in entries)
(BASE/"README.md").write_text(
  "# FR Legends Classics — genuine original source media and native-HD converted examples\n\n"
  "Actual native-HD technical candidates: "+str(n)+"\n"
  "Gate A: BLOCKED (<18 confirmed unique clips, <5 confirmed makes/models).\n"
  "Source original WebM files are preserved if downloaded and FFprobed at real native pixels.\n"
  "MP4 clips use native resolution H264 CRF19 transcode (no upscaling), preserve available audio.\n"
  "Each clip from a source is only one potential camera angle, even if many cars drive through frame.\n"
  "CONTACT SHEETS: five source timestamps, essential human QA required.\n"
  "Attributions/licences listed in manifest, including CC BY-SA sharealike conditions.\n"
  "No automatic video/car labelling beyond file descriptions; avoid using DS sample until actual DS appears.\n")
zip_path=Path("out/fr-legends-a-classics-real-sources.zip")
with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for f in BASE.rglob("*"):
  if f.is_file():z.write(f,f.relative_to(BASE))
print("FINAL",json.dumps({"attempted":len(SOURCES),"technical_candidates":n,"zip_bytes":zip_path.stat().st_size,
     "sha256":sha(zip_path),"gate_a":"BLOCKED"}),flush=True)
