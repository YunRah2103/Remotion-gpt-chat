#!/usr/bin/env python3
"""Agent C: acquire real source bytes, reject sub-HD, package decoder-verified contacts.
Visual authenticity MUST be human reviewed; automation never self-certifies CGI vs camera.
"""
import csv, hashlib, html, json, os, re, shutil, subprocess, sys, urllib.parse, urllib.request, zipfile
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path("out/cyber-future-c")
SRC=ROOT/"originals"
CLIPS=ROOT/"clips"
CONTACT=ROOT/"contact_sheets"
MAX_BYTES=240*1024*1024
BASE="https://renault.com.cy/wp-content/uploads/"
DIRECT=[
 {"id":"filante_2025_record","model":"Renault Filante Record 2025","url":BASE+"2026/01/renault-filante-record-z41-concept-020.mp4","page":"https://renault.com.cy/renault-z41/","owner":"Renault Cyprus","type":"unknown"},
 {"id":"embleme_interior","model":"Renault Emblème (physical model unconfirmed in footage)","url":BASE+"2024/10/renault-gt-vision-concept-014-video.mp4","page":"https://renault.com.cy/car/renault-embleme/","owner":"Renault Cyprus","type":"unknown"},
 {"id":"embleme_rolling_a","model":"Renault Emblème (physical model unconfirmed in footage)","url":BASE+"2024/10/renault-gt-vision-concept-021-video.mp4","page":"https://renault.com.cy/car/renault-embleme/","owner":"Renault Cyprus","type":"unknown"},
 {"id":"embleme_rolling_b","model":"Renault Emblème (physical model unconfirmed in footage)","url":BASE+"2024/10/renault-gt-vision-concept-022-video.mp4","page":"https://renault.com.cy/car/renault-embleme/","owner":"Renault Cyprus","type":"unknown"},
 {"id":"rspace_lab_01","model":"Renault R-Space Lab (physical model unconfirmed in footage)","url":BASE+"2026/03/spacer-concept-001-video.mp4","page":"https://renault.com.cy/renault-r-space-lab/","owner":"Renault Cyprus","type":"unknown"},
 {"id":"rspace_lab_02","model":"Renault R-Space Lab (physical model unconfirmed in footage)","url":BASE+"2026/03/spacer-concept-005-video.mp4","page":"https://renault.com.cy/renault-r-space-lab/","owner":"Renault Cyprus","type":"unknown"},
 {"id":"rspace_lab_03","model":"Renault R-Space Lab (physical model unconfirmed in footage)","url":BASE+"2026/03/spacer-concept-009-video.mp4","page":"https://renault.com.cy/renault-r-space-lab/","owner":"Renault Cyprus","type":"unknown"},
]
PAGES=[
 {"id":"r5_2022","model":"Renault R5 Turbo 3E (2022 show car)","page":"https://presse.renault.de/videoclip-r5-turbo-3e/?lang=deu","owner":"Renault Germany"},
 {"id":"r5_2022_en","model":"Renault R5 Turbo 3E (2022 show car)","page":"https://media.renault.com/r5-turbo-3e-born-to-drift/?lang=eng","owner":"Renault"},
 {"id":"alpenglow_hy6","model":"Alpine Alpenglow Hy6 (2024)","page":"https://media.alpinecars.com/alpine-presents-alpenglow-hy6-with-the-brands-first-6-cylinder-hydrogen-engine/?lang=eng","owner":"Alpine"},
 {"id":"alpenglow_hy4","model":"Alpine Alpenglow Hy4 (2024 Le Mans)","page":"https://media.alpinecars.com/les-bleus-jouent-a-domicile/?lang=eng","owner":"Alpine"},
 {"id":"inception","model":"Peugeot Inception Concept (2023)","page":"https://www.media.stellantis.com/em-en/peugeot/media-library/press-videos/239203","owner":"Stellantis / Peugeot"},
 {"id":"filante_alt","model":"Renault Filante Record 2025","page":"https://www.auto-medienportal.net/artikel/detail/66953","owner":"Renault via Autoren-Union Mobilität"}
]
UA="Mozilla/5.0 (compatible; YUNEX-asset-QA/1.0)"
def request(url):
    return urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"*/*"})
def fetch_page(url):
    try:
        with urllib.request.urlopen(request(url),timeout=22) as r:
            b=r.read(3_000_000)
        return b.decode("utf-8","replace")
    except Exception as exc:
        print("PAGE_FAIL",url,str(exc)[:120],flush=True);return ""
def candidates(htmltxt,page):
    htmltxt=html.unescape(htmltxt).replace("\\/","/")
    found=[]
    for match in re.findall(r"https?://[^ <>()]+[.](?:mp4|mov)",htmltxt,re.I):
        url=urllib.parse.urljoin(page,match)
        if url.startswith("https://"):found.append(url)
    # Some press sites expose their download links as hidden anchor URLs rather than .mp4.
    for href,txt in re.findall(r'<a\b[^>]*href=["'']([^"'']+)["''][^>]*>(.{0,120}?)</a>',htmltxt,re.I|re.S):
        if re.search(r'\b(video|original|download|t[ée]l[ée]charger|film|mp4)\b',re.sub('<[^>]+>','',txt),re.I) and re.search(r'(download|media|video|file)',href,re.I):
            url=urllib.parse.urljoin(page,href)
            if url.startswith("https://") and url not in found:found.append(url)
    return list(dict.fromkeys(found))[:12]
def get_video(url,dest):
    tmp=dest.with_suffix(".part")
    try:
        with urllib.request.urlopen(request(url),timeout=35) as r, tmp.open("wb") as o:
            ct=r.headers.get("Content-Type","")
            if any(t in ct.lower() for t in ("text/html","application/json","xml")):raise ValueError("non-video content-type: "+ct)
            n=0
            while chunk:=r.read(1024*1024):
                n+=len(chunk)
                if n>MAX_BYTES:raise ValueError("over 240 MB budget")
                o.write(chunk)
        with tmp.open("rb") as f:
            start=f.read(128)
        if b"ftyp" not in start and not start.startswith(b"\x1a\x45\xdf\xa3"):
            raise ValueError("bad video magic")
        tmp.rename(dest)
        return n
    except Exception as ex:
        print("DOWNLOAD_FAIL",url,str(ex)[:180],flush=True)
        tmp.unlink(missing_ok=True)
        return 0
def run(cmd,timeout=90):
    return subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
def ffprobe(path):
    p=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],30)
    if p.returncode:raise ValueError("FFPROBE: "+p.stderr[-180:])
    j=json.loads(p.stdout);vs=[s for s in j["streams"] if s.get("codec_type")=="video"]
    if not vs:raise ValueError("NO_VIDEO")
    v=vs[0];w=int(v["width"]);h=int(v["height"])
    duration=float(j["format"].get("duration") or v.get("duration") or 0)
    return {"width":w,"height":h,"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),"duration":duration,
            "bitrate":int(j["format"].get("bit_rate") or 0),"audio_present":any(x.get("codec_type")=="audio" for x in j["streams"])}
def min_res(meta):
    w,h=meta["width"],meta["height"]
    return (w>=1920 and h>=1080) if w>=h else (w>=1080 and h>=1920)
def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for buf in iter(lambda:f.read(4*1024*1024),b""):h.update(buf)
    return h.hexdigest()
def shot_starts(path,dur):
    # Detect genuine shot changes, never split a continuous take into fake distinct "shots".
    try:
        p=run(["ffmpeg","-hide_banner","-v","info","-i",str(path),
            "-vf","select=gt(scene\\,0.30),showinfo","-an","-f","null","-"],min(120,max(20,int(dur*3))))
        stamps=[float(x) for x in re.findall(r'pts_time:([0-9.]+)',p.stderr)]
        times=[0.0]+[t for t in stamps if 1.0<t<dur-1]
        filtered=[]
        for t in times:
            if not filtered or t-filtered[-1]>2.0:filtered.append(round(t,3))
        return filtered[:6]
    except Exception:return [0.0]
def contact(path,into,dur):
    # JPEG pixels originate from full decoded moving video, not synthetic screenshots.
    for i,t in enumerate([min(dur*part, max(0,dur-.15)) for part in (.1,.4,.7,.9)]):
        run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(path),
            "-frames:v","1","-vf","scale=640:-2","-y",str(into/f"frame_{i+1}.jpg")],35)
def main():
    for p in (SRC,CLIPS,CONTACT):p.mkdir(parents=True,exist_ok=True)
    manifest=[];reject=[];audit=[]
    seeds=list(DIRECT)
    for p in PAGES:
        urls=candidates(fetch_page(p["page"]),p["page"])
        audit.append({"page":p["page"],"candidate_count":len(urls),"candidate_urls":urls})
        for k,url in enumerate(urls[:3]):
            seeds.append({"id":p["id"]+"_discovery_"+str(k),"model":p["model"],"url":url,"page":p["page"],"owner":p["owner"],"type":"unknown"})
    seen=set()
    for entry in seeds[:30]:
        url=entry["url"]
        if url in seen:continue
        seen.add(url);file=SRC/(entry["id"]+".mp4")
        print("TRY",entry["id"],url,flush=True)
        if not get_video(url,file):
            reject.append({"id":entry["id"],"url":url,"reason":"download/URL failure"});continue
        try:
            meta=ffprobe(file)
            print("FFPROBE",entry["id"],meta,flush=True)
            if not min_res(meta):raise ValueError("below native 1080 landscape / native 1920 portrait gate")
            if not 1.0< meta["duration"]<240:raise ValueError("duration outside 1s to 240s gate")
            # Full decoder verification (ignore audio decode artifacts; verify ALL visual frames).
            d=run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(file),"-map","0:v:0","-f","null","-"],min(220,max(30,int(meta["duration"]*4))))
            if d.returncode:raise ValueError("full video decode failed: "+d.stderr[-200:])
            original_sha=sha(file)
            starts=shot_starts(file,meta["duration"])
            for i,start in enumerate(starts[:5]):
                stop=min(meta["duration"]-.05,start+3.2)
                if stop-start<1.25:continue
                out=CLIPS/(entry["id"]+"_shot%02d.mp4"%(i+1))
                # Re-encode high quality only for honest shot cut boundaries, preserve source audio.
                cmd=["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-ss",str(start),"-i",str(file),
                    "-t",str(stop-start),"-map","0:v:0","-map","0:a:0?","-c:v","libx264","-preset","veryfast",
                    "-crf","17","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart","-y",str(out)]
                r=run(cmd,120)
                if r.returncode:raise ValueError("trim failed "+r.stderr[-140:])
                clipmeta=ffprobe(out)
                if not min_res(clipmeta):raise ValueError("trim unexpectedly low res")
                con=CONTACT/out.stem;con.mkdir(exist_ok=True);contact(out,con,clipmeta["duration"])
                manifest.append({"file":"clips/"+out.name,"vehicle":entry["model"],"url":url,"source_page":entry["page"],
                  "credit":entry["owner"],"source_original_sha256":original_sha,"sha256":sha(out),
                  "source_t_start":start,"source_t_end":stop,"filming_type":"UNREVIEWED: camera/driving/CGI distinction pending",
                  "physically_real":"UNVERIFIED IN THE VIDEO","manual_cinematic_review":"PENDING",
                  "reusable_publication_rights":"not established","contacts":"contact_sheets/"+out.stem,
                  **clipmeta})
        except Exception as e:
            reject.append({"id":entry["id"],"url":url,"reason":str(e)[:300]})
            for clip in CLIPS.glob(entry["id"]+"_shot*.mp4"):clip.unlink()
            manifest=[x for x in manifest if not Path(x["file"]).name.startswith(entry["id"]+"_")]
        finally:
            # Keep original bytes when size permits; ZIP will ship strongest exact media.
            if file.exists() and file.stat().st_size>100*1024*1024:file.unlink()
    (ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2))
    with (ROOT/"manifest.csv").open("w",newline="") as f:
        if manifest:
            w=csv.DictWriter(f,fieldnames=list(manifest[0]));w.writeheader();w.writerows(manifest)
        else:f.write("file,vehicle,url,status\n")
    (ROOT/"rejections.json").write_text(json.dumps(reject,indent=2))
    (ROOT/"source_discovery_audit.json").write_text(json.dumps(audit,indent=2))
    (ROOT/"README_START_HERE.md").write_text(
        "# YUNEX CYBER//FUTURE 001 — C / FRENCH FOOTAGE\n\n"+
        f"Automated acquisition yielded {len(manifest)} decodable native-HD provisional segments from {len(set(x['vehicle'] for x in manifest))} model labels.\n\n"+
        "**IMPORTANT:** all video is *UNREVIEWED for physical authenticity and artistic selection*. Scene-detected clips can still be CGI or duplicates. No PASS is declared until a human checks the contact sheets and real video pixels, removes CGI/poor takes, confirms exact model and footage motion. Contract targets 8–12 distinct actual photographic views; this output may fall short.\n\n"+
        "Only downloadable public video was attempted. Publication/redistribution rights not established. Check original source page per manifest. The exact user soundtrack is not included; no edit, mixing or final render was attempted.\n")
    (ROOT/"qa_report.json").write_text(json.dumps({
        "timestamp":datetime.now(timezone.utc).isoformat(),"agent":"C","package_gate":"PARTIAL_NEEDS_HUMAN_VISUAL_REVIEW",
        "downloaded_and_decoded_candidate_segments":len(manifest),
        "unique_vehicle_labels":sorted(set(x["vehicle"] for x in manifest)),
        "genuine_camera_video_shots_visually_confirmed":0,"source_attempts":len(seen),"rejected":len(reject)},indent=2))
    with zipfile.ZipFile(ROOT.parent/"CYBER-FUTURE-001-FOOTAGE-C.zip","w",zipfile.ZIP_STORED,allowZip64=True) as z:
        for path in sorted(ROOT.rglob("*")):
            if path.is_file() and "originals" not in path.parts:z.write(path,path.relative_to(ROOT))
    print("FINISHED",json.dumps({"candidates":len(manifest),"models":list(set(x["vehicle"] for x in manifest)),
       "failed":len(reject),"zip_bytes":(ROOT.parent/"CYBER-FUTURE-001-FOOTAGE-C.zip").stat().st_size}),flush=True)
if __name__=="__main__":main()
