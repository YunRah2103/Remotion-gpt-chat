#!/usr/bin/env python3
"""Agent A: objective side-by-side screening of final Turbo A clip vs Agent B new 2026 4K moving IndyCar.
Strictly a QA/contact-strip evaluation, NOT a video transition or a production render.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance
import json,zipfile,subprocess,hashlib,base64,urllib.request,os,time
ROOT=Path("out/A-B26-comparison"); ROOT.mkdir(parents=True,exist_ok=True)
A=Path("out/A-final");B=Path("out/B26-delivery")
def expand(root):
    for _ in range(3):
        found=False
        for p in list(root.rglob("*.zip")):
            if p.parent.name.endswith("-unpacked"):continue
            target=p.parent/(p.stem+"-unpacked")
            if target.exists():continue
            with zipfile.ZipFile(p) as z:
                wrong=z.testzip()
                if wrong:raise RuntimeError("CRC failure "+wrong)
                for x in z.namelist():
                    if not (target/x).resolve().is_relative_to(target.resolve()):raise ValueError("unsafe archive path")
                z.extractall(target)
            print("UNPACKED "+str(p),flush=True);found=True
        if not found:break
def get(name,root):
    choices=list(root.rglob(name))
    if len(choices)!=1:raise RuntimeError(f"Expected ONE {name}, found {len(choices)}")
    return choices[0]
def call(args,timeout=90):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    if p.returncode:raise RuntimeError(p.stderr[-1500:])
    return p.stdout
def meta(p):
    d=json.loads(call(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate","-of","json",str(p)],30))
    s=next(x for x in d["streams"] if x.get("codec_type")=="video")
    return {"width":s["width"],"height":s["height"],"fps":s["r_frame_rate"],"codec":s["codec_name"],"duration":float(d["format"]["duration"])}
def checksum(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda:f.read(1048576),b""):h.update(b)
    return h.hexdigest()
expand(A);expand(B)
afiles={"A01":get("A01_blue_lane_low_follow.mp4",A),"A05":get("A05_glow_low_car_rear.mp4",A),"A02":get("A02_indycar_pack_corner.mp4",A)}
bfile=get("B26_01_modern_indycar_smoke_near_pitwall.mp4",B)
files={**afiles,"B26":bfile}
facts={}
for tag,p in files.items():
    facts[tag]={**meta(p),"sha256":checksum(p),"source_file":str(p)}
    print("PROBED "+json.dumps({"tag":tag,**facts[tag]}),flush=True)
assert facts["B26"]["width"]==3840 and facts["B26"]["height"]==2160
# Verify against original research manifest to catch accidental wrong/duplicated artifact.
assert facts["B26"]["sha256"]=="58b0a33d534966b21de01d1e93411e06b33242d30c87edb193207fdb57683aa5"
frames={}
for tag,p in files.items():
    duration=facts[tag]["duration"]
    frames[tag]=[]
    for j,fraction in enumerate([.16,.36,.55,.75,.91]):
        t=round(duration*fraction,3)
        fp=ROOT/(f"{tag}-{j:02}.png")
        call(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(p),"-frames:v","1","-vf","scale=1024:-2","-y",str(fp)],45)
        frames[tag].append((fp,t))
def stamp(img,label,width=640,height=380):
    pic=Image.new("RGB",(width,height),"#121212")
    img.thumbnail((width,height-35),Image.Resampling.LANCZOS)
    pic.paste(img,((width-img.width)//2,0))
    ImageDraw.Draw(pic).text((10,height-25),label,fill=(255,255,255))
    return pic
# A animated clip (left) and real B 4K clip (right) at corresponding normalized motion progress.
for a in ["A01","A05","A02"]:
    pairs=Image.new("RGB",(1280,1900),"#101010")
    for j in range(5):
        for k,src in enumerate([a,"B26"]):
            fp,t=frames[src][j]
            im=Image.open(fp).convert("RGB")
            cell=stamp(im,f"{src}  frame {j+1}  clip t={t:.2f}s",640,380)
            pairs.paste(cell,(640*k,380*j))
    dest=ROOT/(f"{a}_vs_B26_storyboard.jpg")
    pairs.save(dest,quality=86)
    print("COMPARISON_SHEET "+str(dest),flush=True)
# Portrait feasibility: center/left/right 9:16 crop of real 4K frame for foreground size/context screening.
portrait=Image.new("RGB",(1080,1920),"#0f0f0f")
for col,mode in enumerate(["left","center","right"]):
    fp,t=frames["B26"][2]
    im=Image.open(fp).convert("RGB")
    aspect=9/16
    neww=round(im.height*aspect)
    if mode=="left": x=0
    elif mode=="right":x=im.width-neww
    else:x=(im.width-neww)//2
    crop=im.crop((x,0,x+neww,im.height)).resize((360,640),Image.Resampling.LANCZOS)
    portrait.paste(crop,(360*col,100))
    ImageDraw.Draw(portrait).text((360*col+10,65),f"REAL B26 {mode} 9:16",fill="white")
portrait.save(ROOT/"B26_portrait_crop_options.jpg",quality=88)
report={"purpose":"A-side latest B26 crossmatch visual QA, internal research only",
"original_film_source":"Turbo 2013 DreamWorks/Universal (reuse permission NOT verified)",
"real_source":"DVIDS 2026 Indy 500 B-roll by Indiana National Guard (DVIDS public domain assertion; event rights need check)",
"b26_original_source_time":"290.50–293.60s",
"facts":facts,"pairings":[
 {"animated":"A01","real":"B26","match_test":"Track-level rear-follow red wheel by outer wall vs real 4K telephoto green/white near pit wall with smoke; camera height and lateral subject unmatched; probably not continuous"},
 {"animated":"A05","real":"B26","match_test":"Undercarriage low-lens blue streak vs telephoto side shot; no under-car perspective; reject exact alignment"},
 {"animated":"A02","real":"B26","match_test":"Animated banked corner wide pack vs real near-pitwall smoke; bank/angle mismatch; reject match"}],
"rights":"Not approved for publication; no editing or audio was done.","timestamp":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
(ROOT/"match_audit.json").write_text(json.dumps(report,indent=2))
print("PAIRING_QA_COMPLETE",flush=True)
