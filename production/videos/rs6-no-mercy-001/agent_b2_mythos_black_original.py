#!/usr/bin/env python3
"""Real official 2023 Audi RS6 C8 Performance Mythos Black MP4 source QA.

Audi Poland MediaCenter offers a ~69 MB movie for journalistic use;
not cleared for use in commercial YUNEX reels. This probe downloads only
publicly accessible unprotected source to transient runner for source review,
does ffprobe + decoded frame QA and uploads JPEG/JSON proofs only. It
never republishes unlicensed raw Audi media. Use a future OWNER-ONLY draft
with rights review if it proves to have compelling rolling C8 footage.
"""
import hashlib, html, json, os, re, subprocess, tempfile, urllib.parse
from html.parser import HTMLParser
from pathlib import Path
import requests
from PIL import Image,ImageDraw
PAGE="https://audi-mediacenter.pl/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html"
EVIDENCE=Path("b2-mythos-technical-qa");EVIDENCE.mkdir(exist_ok=True)
HEADERS={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
REPORT={"source_page":PAGE,"published":"2023-08-07","model":"Audi RS6 Avant performance C8, Mythos Black metallic","publisher":"Audi MediaCenter Poland","licence":"Audi copyright: free solely for journalistic purposes; not public YUNEX social redistribution permission","status":"UNTESTED","possible_media":[]}
class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        for prop in ("href","src","data-src","data-href","data-url","data-file","data-video","data-download"):
            v=d.get(prop)
            if v:self.links.append({"tag":tag,"prop":prop,"value":v,"attrs":str(d)[:240]})
def shell(cmd,timeout=90):
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
        return p.returncode,p.stdout,p.stderr[-750:]
    except Exception as e:
        return -1,"",str(e)[-650:]
def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for c in iter(lambda:f.read(2*1024*1024),b""):h.update(c)
    return h.hexdigest()
def candidates(page):
    x=requests.get(page,headers=HEADERS,timeout=20)
    REPORT["page_http"]=x.status_code
    REPORT["page_length"]=len(x.content)
    x.raise_for_status()
    raw=html.unescape(x.text).replace("\\/","/")
    p=Parser();p.feed(raw)
    options=[]
    for link in p.links:
        url=urllib.parse.urljoin(page,html.unescape(link["value"]))
        if url.startswith("https://") and any(k in url.lower() for k in ["video",".mp4","download","plik","film","media","storage","audi"]):
            options.append({"url":url,"evidence":link["attrs"][:160]})
    for url in re.findall(r"""(?i)(?:https?:)?//[^\s"'<>]{1,300}\.mp4(?:\?[^\s"'<>]{0,300})?""",raw):
        url="https:"+url if url.startswith("//") else url
        options.append({"url":url,"evidence":"page inline .mp4"})
    raw_tokens=[]
    for pattern in (r'(?i).{0,180}69[,.\s]45.{0,240}',r'(?i).{0,180}\\.mp4.{0,240}',r'(?i).{0,180}download.{0,240}',r'(?i).{0,120}48075.{0,200}'):
        for m in re.finditer(pattern,raw):
            raw_tokens.append(re.sub(r'\s+',' ',m.group(0))[:350])
            if len(raw_tokens)>30:break
    REPORT["page_media_context"]=raw_tokens[:30]
    result=[];seen=set()
    for item in options:
        v=item["url"]
        if v==page or v in seen:continue
        seen.add(v)
        # prefer .mp4 and references to specific media, not arbitrary navigation
        score=0
        for s,points in [(".mp4",10),("download",6),("pobierz",6),("film/48075",4),("film,48075",4),("videofile",6),("/files/",4),("/media/",3),(".webm",5),(".mov",5)]:
            if s in v.lower():score+=points
        if score:
            result.append({"url":v,"score":score,"evidence":item["evidence"]})
    result.sort(key=lambda x:-x["score"])
    # Log only selected candidate identifiers, no arbitrary HTML dumps.
    REPORT["possible_media"]=result[:20]
    return result
def verify(url,label):
    row={"candidate":url,"status":"NOT_PROBED","label":label}
    try:
        resp=requests.get(url,headers={**HEADERS,"Range":"bytes=0-8191","Referer":PAGE},timeout=20,stream=True,allow_redirects=True)
        row["http_status"]=resp.status_code
        row["content_type"]=resp.headers.get("Content-Type")
        row["content_length"]=resp.headers.get("Content-Length")
        row["final_url"]=resp.url
        data=next(resp.iter_content(120),b"")
        row["first_bytes_hex"]=data[:60].hex()
        resp.close()
        if resp.status_code not in (200,206):row["status"]="HTTP_REJECT";return row
        if "text/html" in (row["content_type"] or "").lower():row["status"]="HTML_NOT_MP4";return row
        rc,out,err=shell(["ffprobe","-v","error","-show_entries",
             "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size",
             "-of","json","-headers",f"Referer: {PAGE}\r\nUser-Agent: Mozilla/5.0\r\n",url],50)
        if rc:
            row["status"]="FFPROBE_FAILED";row["error"]=err;return row
        row["ffprobe"]=json.loads(out)
        video=next((x for x in row["ffprobe"].get("streams",[]) if x.get("codec_type")=="video"),{})
        if not video:
            row["status"]="NO_VIDEO";return row
        if max(video.get("height") or 0,video.get("width") or 0)<1920:
            row["status"]="LOW_RES_SOURCE";return row
        duration=float(row["ffprobe"].get("format",{}).get("duration") or 0)
        if duration<5:
            row["status"]="SHORT_SOURCE";return row
        row["status"]="REMOTE_VIDEO_PROBED"
        return row
    except Exception as e:
        row["status"]="EXCEPTION";row["error"]=str(e)[-300:];return row
def video_qa(url,info):
    # 18 real film timestamps spaced across full duration. Seek using HTTP
    # Range without requiring entire movie download, as supported by server.
    duration=float(info["ffprobe"]["format"].get("duration") or 0)
    times=[round((duration-1)*i/17,2) for i in range(18)]
    sheet=[]
    with tempfile.TemporaryDirectory(prefix="b2-mythos-private-") as td:
        root=Path(td)
        for i,sec in enumerate(times):
            frame=root/f"p{i:02d}.jpg"
            rc,out,err=shell(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                "-rw_timeout","20000000","-headers",f"Referer: {PAGE}\r\nUser-Agent: Mozilla/5.0\r\n",
                "-ss",str(sec),"-i",url,"-frames:v","1",
                "-vf","scale=320:-2","-q:v","3","-y",str(frame)],45)
            sheet.append({"time":sec,"decode_pass":rc==0 and frame.exists(),"error":err if rc else None})
            print("FRAME",sec,rc,flush=True)
        good=sorted(root.glob("p*.jpg"))
        if good:
            frames=[Image.open(z).convert("RGB") for z in good]
            width=320;h=max(im.height for im in frames);cols=3
            rows=(len(frames)+cols-1)//cols
            canvas=Image.new("RGB",(width*cols,(h+28)*rows),"#111519")
            draw=ImageDraw.Draw(canvas)
            for i,im in enumerate(frames):
                px=i%cols*width;py=i//cols*(h+28)
                canvas.paste(im,(px,py+28))
                draw.text((px+6,py+5),f"{times[int(good[i].stem[1:])]}s",fill="white")
            canvas.save(EVIDENCE/"18_SOURCE_FRAME_STORYBOARD.jpg",quality=88)
    return sheet
def main():
    try:
        found=candidates(PAGE)
        REPORT["found_candidate_count"]=len(found)
        for i,item in enumerate(found[:8]):
            row=verify(item["url"],i)
            REPORT.setdefault("network_probes",[]).append(row)
            print("CANDIDATE",i,row["status"],row.get("ffprobe",{}),flush=True)
            if row["status"]=="REMOTE_VIDEO_PROBED":
                REPORT["validated_remote_source"]=row
                REPORT["frame_checks"]=video_qa(item["url"],row)
                REPORT["status"]="GENUINE_PUBLIC_OFFICIAL_MP4_SCOUTED"
                break
        if "validated_remote_source" not in REPORT:
            REPORT["status"]="NO_REMOTELY_DECODABLE_VIDEO_ON_PAGE"
    except Exception as e:
        REPORT["status"]="ERROR";REPORT["error"]=str(e)[-700:]
    (EVIDENCE/"source_audit.json").write_text(json.dumps(REPORT,indent=2))
    print("SUMMARY",REPORT["status"],flush=True)
if __name__=="__main__":main()
