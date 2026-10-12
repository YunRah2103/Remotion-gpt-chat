#!/usr/bin/env python3
"""Agent C secondary acquisition: prove actual bytes, full decode, contact frames, no CGI pass."""
import hashlib,html,json,re,subprocess,urllib.parse,urllib.request,zipfile
from pathlib import Path
ROOT=Path("out/cyber-future-c");OUT=ROOT/"phase2";OUT.mkdir(parents=True,exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36","Accept":"*/*"}
MAX=220*1024*1024
SOURCES=[
("r5_corsica_actual_drive","Renault 5 Turbo 3E physical prototype 2025 Corsica drive","https://www.auto-medienportal.net/artikel/detail/68630",["https://www.auto-medienportal.net/video/load/original/3469/"],"press credited Renault via Autoren-Union Mobilität, rights not confirmed"),
("r5_reveal_2025_original","Renault 5 Turbo 3E promotional film 2025","https://www.auto-medienportal.net/artikel/detail/66690",["https://www.auto-medienportal.net/video/load/original/3203/"],"press credited Renault via Autoren-Union Mobilität, rights not confirmed"),
("r5_press_becier","Renault 5 Turbo 3E video 2025","https://www.beciermobilitat.ad/renault-5-turbo-3e-obertura-de-reserves/",["https://www.beciervehicles.ad/wp-content/uploads/2025/04/v-2025-062-01.mp4"],"publisher media download, rights not confirmed"),
("r5_publiracing","Renault 5 Turbo 3E concept 2025","https://www.publiracing.pt/post/renault-5-turbo-3e-a-reinven%C3%A7%C3%A3o-de-um-cl%C3%A1ssico-agora-100-el%C3%A9trico",["https://video.wixstatic.com/video/a18b40_3b4ae4e4bb3b4b19a550fb0f4bff22c9/1080p/mp4/file.mp4","https://video.wixstatic.com/video/a18b40_49835441857949c7835155a44fbc7aa4/1080p/mp4/file.mp4"],"third-party publisher, rights not established"),
("trezor_cc","Renault TreZor Concept 2016","https://www.mynewsdesk.com/se/renault/videos/trezor-video-25528",["https://www.mynewsdesk.com/se/renault/videos/trezor-video-25528/download"],"CC attribution stated on source page; exact license verify"),
("alpenglow_hy4_hd","Alpine Alpenglow Hy4","https://presse.alpinecars.de/alpine-alpenglow-hy4-prototyp-mit-wasserstoffbetriebenem-verbrennungsmotor/?lang=deu",["https://presse.alpinecars.de/download?n=v-2024-135-01"],"press use only; editing rights not proven"),
("peugeot_inception","Peugeot Inception 2023","https://www.media.stellantis.com/em-en/peugeot/media-library/press-videos/239203",[],"press use only; editing rights not proven"),
("r5_2022","Renault R5 Turbo 3E 2022","https://presse.renault.de/videoclip-r5-turbo-3e/?lang=deu",[],"press use only; editing rights not proven"),
("alpenglow_hy6","Alpine Alpenglow Hy6 2024","https://media.alpinecars.com/alpine-presents-alpenglow-hy6-with-the-brands-first-6-cylinder-hydrogen-engine/?lang=eng",[],"press use only; editing rights not proven"),
("filante_record","Renault Filante Record 2025","https://media.renault.com/filante-record-2025-an-efficiency-record-to-kick-off-the-new-year/?lang=eng",[],"press use only; editing rights not proven")]
AUDIT=[];MANIFEST=[]
def fetch(url,limit=3000000):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=30) as r:
        ct=r.headers.get("Content-Type","").lower()
        b=r.read(limit+1)
    return b[:limit],ct
def sha(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
    return h.hexdigest()
def command(a,seconds=130):
    p=subprocess.run(a,text=True,capture_output=True,timeout=seconds)
    if p.returncode:raise RuntimeError(p.stderr[-240:])
    return p.stdout
def probe(p):
    j=json.loads(command(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],30))
    v=next(s for s in j["streams"] if s["codec_type"]=="video")
    return {"width":int(v["width"]),"height":int(v["height"]),"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),"duration":float(j["format"]["duration"])}
def targets(page):
    try:
        b,_=fetch(page)
        text=html.unescape(b.decode("utf-8","replace")).replace("\\/","/")
        links=re.findall(r'https?[^"<> \n\t]+?\.(?:mp4|mov)(?:\?[^"<> \n\t]*)?',text,re.I)
        links+=re.findall(r'https?[^"<> \n\t]+/(?:download|video-cdn)/[^"<> \n\t]+',text,re.I)
        snippets=[text[max(0,m.start()-90):m.start()+250] for m in list(re.finditer(r'(?:screen9|v-2024-135-01|mp4|download\?n=)',text,re.I))[:12]]
        print("PAGE",page,"links",links[:12],"snippets",snippets,flush=True)
        return list(dict.fromkeys(x.strip("'\\,;") for x in links))[:8],{"page":page,"links":links[:15],"snippets":snippets}
    except Exception as e:
        print("PAGE_ERROR",page,repr(e),flush=True)
        return [],{"page":page,"error":repr(e)}
def download(url,p):
    try:
        req=urllib.request.Request(url,headers=UA)
        with urllib.request.urlopen(req,timeout=30) as r,p.open("wb") as out:
            ct=r.headers.get("Content-Type","").lower()
            if "text/html" in ct:raise ValueError("HTML content")
            n=0
            while block:=r.read(1048576):
                n+=len(block)
                if n>MAX:raise ValueError("exceeds download budget")
                out.write(block)
        with p.open("rb") as f:head=f.read(128)
        if b"ftyp" not in head and not head.startswith(b"\x1a\x45\xdf\xa3"):raise ValueError(f"not mp4, header {head[:24]!r}, {ct}")
        return {"ok":True,"bytes":n,"sha256":sha(p),"content_type":ct}
    except Exception as e:
        p.unlink(missing_ok=True)
        return {"ok":False,"error":str(e)[:220]}
def main():
    for id,model,page,explicit,rights in SOURCES:
        discovered,a=targets(page)
        allurls=list(dict.fromkeys(explicit+discovered))
        a["downloads"]=[]
        for i,url in enumerate(allurls[:5]):
            if not url.startswith("https://"):continue
            out=OUT/f"{id}_{i:02d}.mp4"
            result=download(url,out);result["url"]=url;a["downloads"].append(result)
            print("DOWNLOAD",id,i,result,flush=True)
            if not result["ok"]:continue
            try:
                m=probe(out);result["metadata"]=m
                if m["width"]<1920 or m["height"]<1080:raise ValueError("below native 1080p")
                if not 2<m["duration"]<240:raise ValueError("duration out of range")
                command(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(out),"-map","0:v:0","-f","null","-"],min(210,round(m["duration"]*4)+30))
                duration=min(15.0,m["duration"]-.1)
                sample=OUT/f"{id}_{i:02d}_candidate.mp4"
                command(["ffmpeg","-nostdin","-loglevel","error","-i",str(out),"-t",str(duration),"-map","0:v:0","-an","-c:v","libx264","-preset","veryfast","-crf","19","-y",str(sample)],130)
                for idx,fraction in enumerate([.05,.2,.4,.6,.8,.95]):
                    pic=OUT/f"{id}_{i:02d}_frame{idx+1}.jpg"
                    command(["ffmpeg","-nostdin","-loglevel","error","-ss",str(duration*fraction),"-i",str(sample),"-frames:v","1","-vf","scale=700:-2","-y",str(pic)],30)
                MANIFEST.append({"file":str(sample.relative_to(ROOT)),"model":model,"source_page":page,"url":url,"source_sha256":result["sha256"],"clip_sha256":sha(sample),"clip_duration":duration,**m,"authenticity":"UNVERIFIED until human contact-sheet check","usage_rights":rights})
                print("HD_CANDIDATE",id,m,flush=True)
                result["human_review_pending"]=True
                out.unlink(missing_ok=True)
                break
            except Exception as e:
                result["rejected"]=str(e)[:240]
                print("REJECT",id,result["rejected"],flush=True)
                out.unlink(missing_ok=True)
        AUDIT.append(a)
    (OUT/"probe_audit.json").write_text(json.dumps(AUDIT,indent=2))
    (OUT/"manifest.json").write_text(json.dumps(MANIFEST,indent=2))
    (OUT/"README.md").write_text(f"# French extra source audit\n\n{len(MANIFEST)} new source videos reached native 1080p and full-decode test. All candidate frames still need human camera-v-CGI approval. Source rights not presumed. See probe_audit.json.\n")
    pack=ROOT.parent/"CYBER-FUTURE-001-FOOTAGE-C.zip"
    with zipfile.ZipFile(pack,"a",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
        for f in sorted(OUT.rglob("*")):
            if f.is_file():z.write(f,f.relative_to(ROOT))
    print("PHASE2_COMPLETE",json.dumps({"new_hd_sources":len(MANIFEST),"zip_size":pack.stat().st_size}),flush=True)
if __name__=="__main__":main()
