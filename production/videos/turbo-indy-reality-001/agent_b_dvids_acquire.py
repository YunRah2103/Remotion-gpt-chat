#!/usr/bin/env python3
"""Download authorised public DVIDS video through its advertised download endpoint,
then preserve FFprobe facts, decoded frames and an honest source manifest.
Only authentic Indycars with relevant movement should be promoted after review.
"""
import base64, hashlib, html, json, pathlib, re, subprocess, urllib.request, urllib.error, zipfile
OUT=pathlib.Path("out/agent-b-dvids"); OUT.mkdir(parents=True,exist_ok=True)
QA=OUT/"qa"; QA.mkdir(exist_ok=True)
SOURCES=[
 {"id":"DB01","page":"https://www.dvidshub.net/video/810325/air-force-represented-during-historic-indianapolis-motor-speedway-doubleheader","popup":"https://www.dvidshub.net/download/popup/810325","title":"US Air Force 2021 IndyCar/NASCAR doubleheader","author":"Tech. Sgt. Ryan Conroy / U.S. Air Force","rights":"DVIDS public-domain claim applies to US government created elements; assess third-party event/broadcast elements separately"},
 {"id":"DB02","page":"https://www.dvidshub.net/video/126744/kentucky-guardsman-maj-bobbie-jo-mayes-teams-up-with-national-guard-indy-driver-jr-hildebrand","popup":"https://www.dvidshub.net/download/popup/126744","title":"2011 IndyCar driver JR Hildebrand US Army commercial","author":"Sgt. Caleb Riggs / U.S. Army","rights":"DVIDS public-domain claim subject to third-party embedded content review"},
]
def urlopen(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; YUNEX-IndyFootageResearch/1.0)","Accept":"*/*"}),timeout=50)
def cmd(*args):
 x=subprocess.run(args,text=True,capture_output=True)
 if x.returncode: raise RuntimeError("FFmpeg error "+x.stderr[-1700:])
 return x.stdout
def digest(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
 return h.hexdigest()
manifest={"project":"YUNEX Turbo to IndyCar 001","agent":"B","result":"not verified yet","clips":[],"errors":[]}
for src in SOURCES:
 try:
  with urlopen(src["popup"]) as resp: markup=resp.read().decode("utf-8")
  targets=[html.unescape(x) for x in re.findall(r'(?:href|data-url)=[\"\']([^\"\']*?/download/videofile/[^\'\"]+)[\'\"]',markup)]
  if not targets: targets=re.findall(r'\/download\/videofile\/\d+',markup)
  targets=list(dict.fromkeys(urllib.request.urljoin("https://www.dvidshub.net",u) for u in targets))
  print("DVIDS_DOWNLOAD_TARGETS",src["id"],targets,flush=True)
  if not targets: raise RuntimeError("Popup has no public download links; no login circumvention")
  # public popup lists increasingly better encodes, prefer the highest quality under 125MB
  last_error=None
  for target in reversed(targets):
   try:
    p=OUT/(src["id"]+".mp4")
    with urlopen(target) as resp,open(p,"wb") as f:
     ct=resp.headers.get("Content-Type")
     print("DVIDS_RESPONSE",src["id"],resp.status,ct,flush=True)
     if resp.status!=200: raise RuntimeError("HTTP not 200")
     while True:
      b=resp.read(1024*1024)
      if not b: break
      f.write(b)
      if f.tell()>125_000_000: raise RuntimeError("Exceeded max single-video size")
    if p.stat().st_size<100_000: raise RuntimeError("Not playable video (<100KB)")
    info=json.loads(cmd("ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)))
    v=next(x for x in info["streams"] if x["codec_type"]=="video")
    if v["width"]<1920 or v["height"]<1080: raise RuntimeError("Below 1080p")
    sec=float(info["format"]["duration"])
    if sec<4: raise RuntimeError("Too short")
    # fully decode source to reject corrupt/nonmoving footage.
    cmd("ffmpeg","-v","error","-nostdin","-i",str(p),"-vf","fps=1/3,scale=320:-2","-f","null","-")
    sheet=QA/(src["id"]+"_contacts.jpg")
    cmd("ffmpeg","-nostdin","-y","-v","error","-i",str(p),"-vf","fps=1/8,scale=360:202:force_original_aspect_ratio=decrease,pad=360:202:(ow-iw)/2:(oh-ih)/2,tile=4x3:padding=4:margin=4","-frames:v","1","-q:v","5",str(sheet))
    minip=QA/(src["id"]+"_mini.jpg")
    cmd("ffmpeg","-nostdin","-y","-v","error","-i",str(sheet),"-vf","scale=920:-2","-frames:v","1","-q:v","6",str(minip))
    print("INLINE_CONTACT_"+src["id"]+"="+base64.b64encode(minip.read_bytes()).decode(),flush=True)
    manifest["clips"].append(dict(src,download_url=target,native_width=v["width"],native_height=v["height"],duration_sec=sec,codec=v["codec_name"],fps=v.get("avg_frame_rate"),sha256=digest(p),size=p.stat().st_size,local_file=str(p.relative_to(OUT)),contact_sheet=str(sheet.relative_to(OUT)),status="Decoded; NOT manually classified as genuine IndyCar transition match"))
    print("PASS_DECODED",src["id"],v["width"],v["height"],round(sec,2),p.stat().st_size,flush=True)
    break
   except Exception as ex:
    last_error=str(ex)
    print("SOURCE_VARIANT_FAILED",src["id"],target,last_error[:500],flush=True)
    if (OUT/(src["id"]+".mp4")).exists(): (OUT/(src["id"]+".mp4")).unlink()
  else: raise RuntimeError("No accessible 1080p variant: "+str(last_error))
 except Exception as e:
  print("SOURCE_FAILED",src["id"],str(e),flush=True)
  manifest["errors"].append({"source":src,"error":str(e)})
manifest["result"]="decoded sources available: manual race/identity QA needed" if manifest["clips"] else "failure: no usable video bytes"
(QA/"manifest.json").write_text(json.dumps(manifest,indent=2))
(QA/"README.txt").write_text("DVIDS test. Video can only be promoted after actual decoded frame scrutiny for a real moving IndyCar and Turbo A/B camera match.\n")
with zipfile.ZipFile("out/agent-b-dvids.zip","w",compression=zipfile.ZIP_STORED) as z:
 for p in OUT.rglob("*"):
  if p.is_file():z.write(p,p.relative_to(OUT))
print("FINAL_COUNTS",len(manifest["clips"]),len(manifest["errors"]),flush=True)
if not manifest["clips"]: raise SystemExit("No actual videos obtained")
