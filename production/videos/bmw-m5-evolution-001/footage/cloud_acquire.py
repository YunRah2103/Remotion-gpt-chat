#!/usr/bin/env python3
"""Actual BMW archive/creator acquisition pilot: no fake 'verified' shots."""
import hashlib, html, io, json, re, subprocess, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
R=Path("out/m5-agent-a");(R/"source").mkdir(parents=True,exist_ok=True);(R/"contact").mkdir(exist_ok=True)
P="https://mediapool.bmwgroup.com/download/edown/tvFootageDownload"
def preview(n): return P+"?"+urllib.parse.urlencode(dict(actEvent="tvFootageScenePreviewH264",attachment="1",filmSceneId=str(n)))
SOURCES=[
 {"id":"mixed-e28-e34-e39-e60","generation":"MIXED","scene":9,"page":"https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2"},
 {"id":"e60-driving-alongside","generation":"E60","scene":3,"page":"https://www.press.bmwgroup.com/asia/tv-footage/detail/PF0002439/the-bmw-m5/2"},
 {"id":"f10-ascari","generation":"F10","link":preview(42),"page":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0003177/the-new-bmw-m5-model-year-2011/5"},
 {"id":"f90-racetrack","generation":"F90","scene":4,"page":"https://www.press.bmwgroup.com/usa/tv-footage/detail/PF0005589/the-new-bmw-m5-with-m-xdrive"},
 {"id":"g90-driving","generation":"G90","page":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0009730/the-new-bmw-m5","scene":3},
 {"id":"e39-historic","generation":"E39","page":"https://www.press.bmwgroup.com/global/tv-footage/detail/PF0003267/der-neue-bmw-m5?language=en","scene":10}
 ,{"id":"all-m5-generations-2017","generation":"MIXED","page":"https://www.press.bmwgroup.com/global/video/detail/PF0005757/clip-bmw-m5-generations","link":"https://mediapool.bmwgroup.com/download/edown/tvFootageDownload.mov?actEvent=tvFootageMovHd&attachment=1&dokNo=PF0005757"},
 {"id":"f90-estoril-2017","generation":"F90","page":"https://www.press.bmwgroup.com/global/video/detail/PF0005756/clip-bmw-m5-estoril","link":"https://mediapool.bmwgroup.com/download/edown/tvFootageDownload.mov?actEvent=tvFootageMovHd&attachment=1&dokNo=PF0005756"}
]
YOUTUBE=[
 {"id":"e28-chris-harris","generation":"E28","link":"https://www.youtube.com/watch?v=FzOPR7STqrQ"},
 {"id":"e34-bemfa","generation":"E34","link":"https://www.youtube.com/watch?v=jMCOuvdBhPg"},
 {"id":"e39-btw-garage","generation":"E39","link":"https://www.youtube.com/watch?v=jr-zlK3sKs4"}
]
report={"schemaVersion":1,"status":"RESEARCH_ONLY_UNTIL_VIDEO_QA","verifiedSlots":0,"sources":[]}
def run(cmd,timeout=150):return subprocess.run(cmd,check=True,capture_output=True,text=True,timeout=timeout).stdout
def get_page_url(item):
    req=urllib.request.Request(item["page"],headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req,timeout=38) as response:
        page=response.read(3500000).decode("utf-8","replace")
    urls=re.findall(r'href=["\']([^"\']*tvFootageDownload[^"\']*)["\']',page,re.I)
    links=[html.unescape(urllib.parse.urljoin(item["page"],x)) for x in urls]
    seen=set(); ordered=[]
    for url in links:
        if "tvFootageScenePreviewH264" not in url: continue
        m=re.search(r"filmSceneId=(\d+)",url)
        if m and m.group(1) not in seen:seen.add(m.group(1));ordered.append(url)
    if len(ordered)<item["scene"]:raise RuntimeError("PressClub scene not available; found "+str(len(ordered))+" links")
    return ordered[item["scene"]-1]
def download(url,path,limit=290_000_000):
    if urllib.parse.urlsplit(url).hostname!="mediapool.bmwgroup.com":raise RuntimeError("unapproved media host")
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
    size=0
    with urllib.request.urlopen(req,timeout=40) as stream,path.open("wb") as output:
        if "text/html" in stream.headers.get("Content-Type",""):raise RuntimeError("Received HTML, not media")
        if int(stream.headers.get("Content-Length",0))>limit:raise RuntimeError("Source over max size")
        while True:
            b=stream.read(1<<20)
            if not b:break
            size+=len(b)
            if size>limit:raise RuntimeError("Source exceeds safety byte limit")
            output.write(b)
    if size<100000:raise RuntimeError("No valid media bytes returned")
def digest(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for b in iter(lambda:f.read(1<<20),b""):h.update(b)
    return h.hexdigest()
def ffprobe(p):
    raw=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
    video=[s for s in raw.get("streams",[]) if s["codec_type"]=="video"]
    if len(video)!=1:raise RuntimeError("Not exactly one moving video track")
    s=video[0];return {"width":s["width"],"height":s["height"],"codec":s["codec_name"],
        "fps":s["avg_frame_rate"],"durationSeconds":float(raw["format"]["duration"]),
        "bytes":p.stat().st_size,"sha256":digest(p),"file":str(p)}
def still(p,t):
    data=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(p),
      "-frames:v","1","-vf","scale=320:-2","-vcodec","mjpeg","-f","image2pipe","-"],
      check=True,capture_output=True,timeout=35).stdout
    return Image.open(io.BytesIO(data)).convert("RGB")
def contact(p,id,duration):
    times=[round((i+.5)*duration/24,2) for i in range(24)]
    images=[]
    for t in times:
        try:images.append((t,still(p,t)))
        except Exception:pass
    if len(images)<6:raise RuntimeError("Unable to extract actual frames")
    w,h,g,cols=228,133,10,6;rows=(len(images)+cols-1)//cols
    canvas=Image.new("RGB",(cols*(w+g)+g,rows*(h+32+g)+g),"#15202d"); pen=ImageDraw.Draw(canvas)
    for i,(t,im) in enumerate(images):
        x=g+(i%cols)*(w+g);y=g+(i//cols)*(h+32+g)
        canvas.paste(ImageOps.contain(im,(w,h)),(x,y))
        pen.text((x,y+h+4),f"{id} {t:.1f}s",fill="white")
    fp=R/"contact"/(id+".jpg");canvas.save(fp,quality=91)
    return {"contactSheet":str(fp),"sampleTimestamps":[t for t,_ in images]}
def process(item,youtube=False):
    id=item["id"];entry={"id":id,"generation":item["generation"],"page":item.get("page",item["link"] if youtube else ""),
         "rights":"UNVERIFIED — do not publish publicly","status":"FAILED"}
    print("START",id,flush=True)
    try:
        if youtube:
            p=R/"source"/(id+".mp4")
            cmd=["yt-dlp","--no-playlist","--no-progress","--retries","1",
              "--download-sections","*00:00:00-00:01:30",
              "-f","bv*[height<=2160]+ba/b[height<=2160]/best",
              "--merge-output-format","mp4","-o",str(p),item["link"]]
            run(cmd,timeout=240)
            files=[f for f in (R/"source").glob(id+"*") if f.suffix in (".mp4",".webm",".mkv",".mov")]
            if not files:raise RuntimeError("yt-dlp did not produce an actual video")
            p=files[0]
        else:
            link=item.get("link") or get_page_url(item)
            entry["downloadLink"]=link
            p=R/"source"/(id+(".mov" if ".mov?" in link else ".mp4"))
            download(link,p)
        info=ffprobe(p);entry.update(info)
        entry.update(contact(p,id,info["durationSeconds"]))
        entry["status"]="ACTUAL_VIDEO_DOWNLOADED_IDENTITY_NOT_APPROVED"
    except Exception as e:
        entry["error"]=repr(e)[:550]
        if hasattr(e,"stderr") and e.stderr:entry["errorDetail"]=str(e.stderr)[-1000:]
        print("FAIL",id,entry["error"],entry.get("errorDetail",""),flush=True)
    report["sources"].append(entry)
    (R/"acquisition-report.json").write_text(json.dumps(report,indent=2)+"\n")
    print("DONE",id,entry["status"],flush=True)
for item in SOURCES:process(item)
for item in YOUTUBE:process(item,youtube=True)
report["downloadedSources"]=sum(s["status"].startswith("ACTUAL") for s in report["sources"])
report["status"]="MEDIA_ACQUIRED_REVIEW_REQUIRED" if report["downloadedSources"] else "BLOCKED"
report["notes"]="Raw source videos and contact sheets are real if status ACTUAL; NO 42-slot generation or scene-distinctness signoff; do not claim READY."
(R/"acquisition-report.json").write_text(json.dumps(report,indent=2)+"\n")
print(json.dumps({"downloaded":report["downloadedSources"],"attempted":len(report["sources"]) }),flush=True)
