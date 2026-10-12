#!/usr/bin/env python3
"""Download and probe explicitly Free License Mixkit real-car clips, with honest SDR/HDR reporting."""
import pathlib, subprocess, json, re, urllib.request, urllib.error, hashlib, zipfile, time
from urllib.parse import urljoin
from PIL import Image, ImageOps, ImageDraw

OUT=pathlib.Path("out/yunex-car-real-source")
OUT.mkdir(parents=True,exist_ok=True)
SCENES=[
("headlight-reveal",49,"closeup-of-red-sports-car"),
("taillight-bodywork",63,"close-up-of-red-sports-car"),
("full-car-reveal",66,"parked-red-sports-car"),
("black-sports-car",53,"sports-car-parked-next-to-a-highway")
]
def call(cmd,timeout=100):
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
    if p.returncode: raise RuntimeError((p.stderr or p.stdout)[-1000:])
    return p.stdout
def fetch(url,dest,limit=200000000):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; YUNEXVisualQA/1.0)"})
    with urllib.request.urlopen(req,timeout=40) as response,dest.open("wb") as f:
        if response.headers.get("Content-Type","").startswith("text/html"):raise ValueError("HTML not video")
        count=0
        while chunk:=response.read(1024*1024):
            count+=len(chunk)
            if count>limit:raise ValueError("Too large for preview")
            f.write(chunk)
    if dest.stat().st_size<200000:raise ValueError("File too small")
def sha256(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        while c:=f.read(1024*1024):h.update(c)
    return h.hexdigest()
def probe(path):
    return json.loads(call(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]))
def candidates(page,slug,n):
    attempts=[
      f"https://assets.mixkit.co/videos/{n}/{n}-2160.mp4",
      f"https://assets.mixkit.co/videos/{n}/{n}-1080.mp4",
      f"https://assets.mixkit.co/videos/{n}/{n}-720.mp4",
      f"https://assets.mixkit.co/videos/preview/mixkit-{slug}-{n}-large.mp4",
    ]
    # Only downloads from the host explicitly used by the creator's Mixkit web page.
    found=re.findall(r'https?[^\s"\x27<>]+\.mp4(?:\?[^"\x27<> ]+)?',page)
    for x in found:
        x=x.replace("\\u0026","&").replace("\\/","/").replace("&amp;","&")
        if x.startswith("https://assets.mixkit.co/") and x not in attempts:attempts.insert(0,x)
    return attempts
results=[]
preview_tiles=[]
for name,n,slug in SCENES:
    record={"name":name,"id":n,"sourcePage":f"https://mixkit.co/free-stock-video/{slug}-{n}/","license":"Mixkit Stock Video Free License; original source credited. Confirm branding/editorial restrictions separately.","attempts":[]}
    try:
        page=urllib.request.urlopen(urllib.request.Request(record["sourcePage"],headers={"User-Agent":"Mozilla/5.0"}),timeout=25).read().decode(errors="replace")
        # Exclude premium / restricted pages
        if "Mixkit Restricted License" in page or "Premium Download" in page and "Mixkit Stock Video Free License" not in page:
            raise RuntimeError("Source page is not on Mixkit Free License")
        best=None
        for u in candidates(page,slug,n):
            file=OUT/f"temp-{n}.mp4"
            try:
                fetch(u,file)
                d=probe(file)
                v=next(x for x in d["streams"] if x["codec_type"]=="video")
                print("PROBED",n, u, v.get("width"),v.get("height"),v.get("pix_fmt"),flush=True)
                record["attempts"].append({"url":u,"result":"DOWNLOADED","size":file.stat().st_size,"width":v.get("width"),"height":v.get("height")})
                measure=int(v.get("width",0))*int(v.get("height",0))
                if not best or measure>best[0]:
                    good=OUT/f"{name}-{n}-original.mp4";file.replace(good)
                    best=(measure,good,u,d)
                    if measure>=4096*2160:break
                else: file.unlink(missing_ok=True)
            except Exception as e:
                file.unlink(missing_ok=True)
                record["attempts"].append({"url":u,"error":str(e)[:180]})
        if not best:raise RuntimeError("No downloadable video rendition")
        area,good,source,d=best
        v=next(x for x in d["streams"] if x["codec_type"]=="video")
        record.update(status="SOURCE_DOWNLOADED",mediaURL=source,file=good.name,bytes=good.stat().st_size,
             sha256=sha256(good),video={"width":v.get("width"),"height":v.get("height"),
             "codec":v.get("codec_name"),"pixelFormat":v.get("pix_fmt"),
             "colorPrimaries":v.get("color_primaries"),"transfer":v.get("color_transfer"),
             "duration":d.get("format",{}).get("duration")})
        # Actively reject HDR claims if source is 8-bit SDR.
        record["genuineHDRConfirmed"]=bool(v.get("pix_fmt") in ("yuv420p10le","yuv422p10le","yuv444p10le") and
               v.get("color_primaries")=="bt2020" and v.get("color_transfer") in ("smpte2084","arib-std-b67"))
        duration=float(d.get("format",{}).get("duration") or 8)
        tiles=[]
        for k,t in enumerate([duration*.14,duration*.45,duration*.78]):
            jpg=OUT/f"{name}-{n}-frame{k+1}.jpg"
            call(["ffmpeg","-v","error","-y","-ss",str(round(t,2)),"-i",str(good),"-frames:v","1","-vf","scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2",str(jpg)])
            image=Image.open(jpg).convert("RGB")
            ImageDraw.Draw(image).rectangle((0,0,640,30),fill=(12,12,12))
            ImageDraw.Draw(image).text((6,8),f"{name}  {t:.1f}s  {'HDR' if record['genuineHDRConfirmed'] else 'SDR'}",fill="white")
            preview_tiles.append(image)
        print("PASS",name,record["video"],flush=True)
    except Exception as e:record["status"]="FAILED";record["error"]=str(e)
    results.append(record)
report={"objective":"REAL actual downloadable free-license car cinematography. Native HDR evaluated but NOT assumed.",
        "clips":results,"warning":"Source clips must be visually approved before any edit. Do not relabel SDR as HDR.",
        "passCount":sum(r["status"]=="SOURCE_DOWNLOADED" for r in results)}
(OUT/"manifest.json").write_text(json.dumps(report,indent=2))
if preview_tiles:
    sheet=Image.new("RGB",(640*3,360*len(SCENES)),(20,20,20))
    for i,img in enumerate(preview_tiles):sheet.paste(img,((i%3)*640,(i//3)*360))
    sheet.save(OUT/"VISUAL_REVIEW.jpg",quality=90)
dest=OUT.parent/"YUNEX-REAL-CAR-CANDIDATES.zip"
with zipfile.ZipFile(dest,"w",zipfile.ZIP_STORED) as z:
    for p in OUT.iterdir():
        if p.is_file():z.write(p,p.name)
print(json.dumps({"zip":str(dest),"passCount":report["passCount"],"files":[r.get("file") for r in results]}),flush=True)
raise SystemExit(0 if report["passCount"] else 2)
