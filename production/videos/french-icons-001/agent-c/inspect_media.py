#!/usr/bin/env python3
"""French Legends C: inventory ACTUAL combined media and decode contact-sheet frames."""
from __future__ import annotations
import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path("out/fr-legends-c")
MEDIA=ROOT/"media"
REPORT=Path("production/videos/french-icons-001/agent-c")
REPORT.mkdir(parents=True, exist_ok=True)
EXPECTED_SHA="46073d50fb4efe246b3e7ee1adee1601eec025a3aa2a07df45f038731218c533"

def run(*args):
    return subprocess.run(list(map(str,args)),check=True,capture_output=True,text=True).stdout

def sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for b in iter(lambda:f.read(4*1024*1024),b""):h.update(b)
    return h.hexdigest()

def inspect(path):
    data=json.loads(run("ffprobe","-v","error","-show_format","-show_streams","-of","json",path))
    v=next((s for s in data["streams"] if s["codec_type"]=="video"),None)
    if v is None: raise RuntimeError("No video in "+str(path))
    return {"width":v["width"],"height":v["height"],"fps":v.get("avg_frame_rate",""),"codec":v["codec_name"],"duration":round(float(data["format"]["duration"]),3),"size":path.stat().st_size}

def thumb(path, target, sec):
    subprocess.run(["ffmpeg","-hide_banner","-v","error","-ss",str(sec),"-i",str(path),"-frames:v","1","-vf","scale=336:188:force_original_aspect_ratio=decrease,pad=336:188:(ow-iw)/2:(oh-ih)/2","-q:v","3","-y",str(target)],check=True)

def sheet(entries, group):
    items=[e for e in entries if e["group"]==group]
    cols=4; w=336; h=228; rows=(len(items)+cols-1)//cols
    canvas=Image.new("RGB",(cols*w,rows*h),(18,20,23))
    draw=ImageDraw.Draw(canvas)
    for i,e in enumerate(items):
        x=(i%cols)*w;y=(i//cols)*h
        with Image.open(ROOT/"thumbs"/(e["id"]+".jpg")) as im: canvas.paste(im,(x,y))
        label=e["id"]+"  "+e["filename"][:38]
        draw.text((x+4,y+192),label,fill=(243,240,225))
        draw.text((x+4,y+207),str(e["width"])+"x"+str(e["height"])+"  "+str(e["duration"])+"s",fill=(168,181,189))
    path=REPORT/("CONTACT_SHEET_"+group.upper()+".jpg")
    canvas.save(path,quality=86,optimize=True)
    return str(path)

def main():
    zips=list(ROOT.glob("outer/**/*.zip"))
    zips+=list(ROOT.glob("outer/*.zip"))
    zips=list(dict.fromkeys(p for p in zips if p.is_file()))
    if len(zips)!=1: raise RuntimeError("Expected exactly one inner media ZIP; found "+str(zips))
    inner=zips[0]
    if sha(inner)!=EXPECTED_SHA:raise RuntimeError("Combined archive SHA mismatch")
    MEDIA.mkdir(parents=True,exist_ok=True)
    subprocess.run(["unzip","-q",str(inner),"-d",str(MEDIA)],check=True)
    clips=[p for p in MEDIA.rglob("*.mp4") if "clips" in p.parts and ("Agent_A_Classics" in p.parts or "Agent_B_Modern" in p.parts)]
    clips=sorted(set(clips))
    (ROOT/"thumbs").mkdir(parents=True,exist_ok=True)
    items=[]
    for n,p in enumerate(clips):
        rel=p.relative_to(MEDIA).as_posix()
        group="classics" if "Agent_A_Classics" in p.parts else "modern"
        v=inspect(p)
        i=f"C{n+1:02d}"
        thumb(p,ROOT/"thumbs"/(i+".jpg"), max(.12,min(v["duration"]*.5,max(.12,v["duration"]-.1))))
        items.append({"id":i,"group":group,"filename":p.name,"path":rel,"sha256":sha(p),"thumbnail":i+".jpg",**v})
    if len(items)!=42:raise RuntimeError("Expected 42 real source clips, found "+str(len(items)))
    if sum(e["group"]=="classics" for e in items)!=20:raise RuntimeError("Expected 20 classics")
    if sum(e["group"]=="modern" for e in items)!=22:raise RuntimeError("Expected 22 modern clips")
    out={"archive_sha256":EXPECTED_SHA,"clips_total":len(items),"notes":"This checks real playable video bytes and representative frames, NOT rights, uniqueness or cinematic quality.","clips":items}
    (REPORT/"clip_inventory.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
    sheets=[sheet(items,"classics"),sheet(items,"modern")]
    (REPORT/"INSPECTION_STATUS.md").write_text("# Agent C source inspection\n\nThe 42-clip combined media SHA is verified on the GitHub runner, and the 42 actual MP4 clips are FFprobe decodable with representative frames. See clip_inventory.json and two real decoded contact sheets. Artistic acceptance remains pending independent visual assessment. Exact original soundtrack is not in this archive.\n")
    print(json.dumps({"clips":len(items),"sheets":sheets,"archive_sha":sha(inner),"total_duration_sec":round(sum(e["duration"] for e in items),2)},indent=2))
if __name__=="__main__":main()
