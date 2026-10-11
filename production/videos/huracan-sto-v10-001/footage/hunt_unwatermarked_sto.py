#!/usr/bin/env python3
"""Public publisher MP4 discovery for Lamborghini HURACAN STO, widescreen only.

Scan only the named public pages; fetch direct, non-authenticated MP4s published
there. Resolution and correct STO identity must be individually verified.
Never alter/remove third-party overlays or falsely certify shot uniqueness.
"""
from __future__ import annotations
import hashlib, html, json, re, subprocess, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
from PIL import Image, ImageDraw

OUT=Path("out/sto-public-master-hunt")
MEDIA=OUT/"sources"; BOARDS=OUT/"boards"
MEDIA.mkdir(parents=True,exist_ok=True);BOARDS.mkdir(parents=True,exist_ok=True)
PAGES={
    "lamborghini-official-history":"https://www.lamborghini.com/en-en/history/huracan-sto",
    "lamborghini-official-spanish":"https://www.lamborghini.com/es-en/historia/huracan-sto",
    "lamborghini-official-sto-model":"https://www.lamborghini.com/en-en/models/huracan/huracan-sto",
    "lamborghini-official-test":"https://www.lamborghini.com/en-en/news/lamborghini-huracan-sto-the-first-test-drives",
    "press-sto-rome":"https://www.thenewsmarket.com/news/lamborghini-hurac-n-sto-finally-unleashed-first-test-drives-in-rome-and-at-the-autodromo-piero-taruf/s/ef10e4e3-9f7b-4226-8298-0d2682217951",
    "press-sto-sardinia":"https://www.thenewsmarket.com/news/hurac-n-tecnica-and-hurac-n-sto-explore-sardinia/s/deca48c7-de14-4b7b-a1bf-9b326317b1c7",
    "lamborghini-old-press":"https://lulop.com/en_EN/post/show/217619/lamborghini-huracan-sto-finall.html",
    "media-sto-blog":"https://en.wheelz.me/?s=huracan+sto",
    "lamborghini-history-other":"https://www.lamborghini.com/en-en/news/huracan-sto-dynamic-launch-an-intercontinental-success",
}
# URL discovered through search results, but unknown resolution/variant. Test only;
# don't call the racetrack Super Trofeo EVO2 clips road-going STO.
DIRECT = [
("lamborghini-preview-sto-index","https://preview.thenewsmarket.com/Previews/lamb/VideoAssets/QT/lamb_51136_585602.mp4",False),
("lamborghini-preview-sto-index-2","https://preview.thenewsmarket.com/Previews/lamb/VideoAssets/QT/lamb_51135_585601.mp4",False)
]
UA={"User-Agent":"Mozilla/5.0 (compatible; legitimate STO research source audit)"}
def clean(s):
    return html.unescape(s).replace("\\/","/").replace("\\u002F","/").replace("\\u002f","/")
def get(url, cap=9000000,timeout=18):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=timeout) as r:
        c=r.read(cap+1)
        if len(c)>cap:raise ValueError("Page exceeds safety cap")
        return c.decode("utf-8","replace"),r.geturl()
def links(page, origin):
    page=clean(page)
    discovered=set()
    for match in re.findall(r'''(?:https?:)?//[^\s<>"'\\]{4,550}?\.mp4(?:\?[^\s<>"'\\]{0,100})?''',page,re.I):
        if match.startswith("//"):match="https:"+match
        discovered.add(match)
    for match in re.findall(r'''(?:(?:src|href|video|source|url)\s*[:=]\s*["'])([^"'<>]{4,700}\.mp4(?:\?[^"']*)?)''',page,re.I):
        discovered.add(urllib.parse.urljoin(origin,match))
    # Some sites include media URLs in JSON without a quoted src attribute.
    for match in re.findall(r'''[^\s<>"']+\.mp4''',page,re.I):
        if match.startswith(("https://","http://","//","/")):
            discovered.add(urllib.parse.urljoin(origin,match))
    result=[]
    for item in discovered:
        u=urllib.parse.urlparse(item)
        if u.scheme=="https" and u.hostname and len(item)<700:
            result.append(item)
    return sorted(result)
def probe(f):
    p=subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)],
                     capture_output=True,text=True,timeout=50)
    if p.returncode:raise RuntimeError("FFprobe error: "+p.stderr[-200:])
    d=json.loads(p.stdout);v=next(x for x in d["streams"] if x["codec_type"]=="video")
    return dict(width=int(v["width"]),height=int(v["height"]),duration=float(d["format"].get("duration") or 0),
                codec=v["codec_name"],fps=v.get("avg_frame_rate"),bitrate=int(d["format"].get("bit_rate") or 0),
                bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest())
def contact(f,m,dest):
    img=Image.new("RGB",(960,4*155),"#161616");draw=ImageDraw.Draw(img)
    for i in range(16):
        t=max(.05,min(m["duration"]-.05,m["duration"]*(i+.4)/16))
        p=BOARDS/".temp.jpg"
        q=subprocess.run(["ffmpeg","-v","error","-y","-nostdin","-ss",str(t),"-i",str(f),
           "-vf","scale=240:135:force_original_aspect_ratio=decrease,pad=240:135:(ow-iw)/2:(oh-ih)/2",
           "-frames:v","1",str(p)],capture_output=True,timeout=45)
        if p.exists():
            with Image.open(p) as v:img.paste(v.convert("RGB"),((i%4)*240,(i//4)*155+18))
            p.unlink()
        draw.text(((i%4)*240+4,(i//4)*155+3),f"{t:.1f}s",fill="white")
    img.save(dest,quality=85)
def download(u,p,limit=190_000_000):
    request=urllib.request.Request(u,headers=UA)
    total=0
    with urllib.request.urlopen(request,timeout=25) as r:
        final=r.geturl()
        if not final.startswith("https://"):raise ValueError("Non-HTTPS redirect")
        if int(r.headers.get("Content-Length") or 0)>limit:raise ValueError("Size header too large")
        with p.open("wb") as f:
            while True:
                block=r.read(1024*1024)
                if not block:break
                total+=len(block)
                if total>limit:raise ValueError("Exceeded max size")
                f.write(block)
    return total
def main():
    report={"output_requirement":"native >=1920x1080 landscape, true road Huracan STO, no overlay",
            "selected_approved_shots":0,"status":"UNVERIFIED_RESEARCH",
            "pages":[],"candidate_urls":[],"actual_downloads":[]}
    observed={}
    for name,url in PAGES.items():
        row={"page":name,"url":url}
        try:
            raw,landing=get(url)
            row.update(status="FETCHED",landing=landing,html_length=len(raw))
            found=links(raw,landing)
            row["mp4_count"]=len(found)
            for v in found:
                if v not in observed:observed[v]=name
        except Exception as e:row.update(status="BLOCKED",error=str(e)[:160])
        report["pages"].append(row)
    report["candidate_urls"]=[{"url":u,"discovered_at":n} for u,n in observed.items()]
    # Keep eligible known STO-looking direct original publisher files only; do not
    # download racecar-variant sources unless separately verified.
    ranked=sorted(observed,key=lambda u:(("sto" not in u.lower()),("1080" not in u.lower()),len(u)))
    # Known generic sources are research leads only.
    used=0
    for i,u in enumerate(ranked[:14]):
        if used>420_000_000:break
        row={"url":u,"page":observed[u],"state":"NOT_DOWNLOADED"}
        report["actual_downloads"].append(row)
        f=MEDIA/(f"sto_public_{i:02}.mp4")
        try:
            download(u,f)
            m=probe(f)
            row["ffprobe"]=m
            if m["width"]<1920 or m["height"]<1080 or m["width"]<=m["height"]:
                row["state"]="REJECT_NOT_NATIVE_FHD_LANDSCAPE";f.unlink()
                continue
            if m["duration"]<2:
                row["state"]="REJECT_TOO_SHORT";f.unlink()
                continue
            row.update(state="SOURCE_DOWNLOADED_NATIVE_FHD_NEEDS_MANUAL_VARIANT_OVERLAY_QA",filename=f.name)
            used+=m["bytes"]
            contact(f,m,BOARDS/(f.stem+"_16shot.jpg"))
        except Exception as e:
            row.update(state="DIRECT_DOWNLOAD_FAILED",error=str(e)[:210])
            f.unlink(missing_ok=True)
        (OUT/"manifest.json").write_text(json.dumps(report,indent=2))
    (OUT/"manifest.json").write_text(json.dumps(report,indent=2))
    with zipfile.ZipFile("out/HURACAN_STO_NATIVE_HD_DISCOVERY.zip","w",zipfile.ZIP_STORED,allowZip64=True) as z:
        for file in OUT.rglob("*"):
            if file.is_file():z.write(file,file.relative_to(OUT))
    for x in report["pages"]:print("PAGE",x["page"],x["status"],x.get("mp4_count",0))
    for x in report["actual_downloads"]:print("SOURCE",x["page"],x["state"],x.get("ffprobe",{}).get("width"),x.get("ffprobe",{}).get("height"))
if __name__=="__main__":main()
