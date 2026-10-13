#!/usr/bin/env python3
"""C2: validated original Audi C8 native UHD front-grille detail for owner-only draft review.
Uses manufacturer source at own risk; all creator/public distribution rights unverified.
No public video artifact; script exclusively produces local runner review files for a draft.
"""
import hashlib, json, os, pathlib, subprocess, zipfile
from datetime import datetime, timezone
from PIL import Image, ImageDraw

URL=("https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/"
     "urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/"
     "renditions/video_2160p.mp4/as/"
     "audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4"
     "?accept-experimental=1")
OUT=pathlib.Path("c2_audi_uhd_addon")
OUT.mkdir(exist_ok=True)
SRC_START=367.05
SRC_DURATION=1.05
TITLE="RS6_C8_NATIVE4K_AUDI_GRILLE.mp4"

def invoke(args, timeout=120):
    p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
    if p.returncode:
        raise RuntimeError("exit "+str(p.returncode)+": "+" ".join(args[:8])+" ERROR "+p.stderr[-2500:])
    return p.stdout

def digest(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for data in iter(lambda:f.read(1024*1024),b""):h.update(data)
    return h.hexdigest()

def media_info(p):
    d=json.loads(invoke(["ffprobe","-v","error","-show_entries",
       "format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate,pix_fmt",
       "-of","json",str(p)],timeout=30))
    v=next((s for s in d["streams"] if s["codec_type"]=="video"),None)
    if not v: raise RuntimeError("No video stream")
    return {"width":v["width"],"height":v["height"],"fps":v.get("avg_frame_rate"),
       "codec":v["codec_name"],"pix_fmt":v.get("pix_fmt"),
       "duration":float(d["format"]["duration"]),"bytes":int(d["format"]["size"])}

clip=OUT/TITLE
cmd=["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-rw_timeout","30000000",
     "-ss",str(SRC_START),"-i",URL,"-t",str(SRC_DURATION),
     "-map","0:v:0","-an","-vf",
     "crop=1215:2160:1850:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p",
     "-c:v","libx264","-preset","medium","-crf","15",
     "-movflags","+faststart","-y",str(clip)]
invoke(cmd,210)
p=media_info(clip)
if (p["width"],p["height"]) != (1080,1920) or p["duration"]<.7: raise RuntimeError("Invalid size/time")
invoke(["ffmpeg","-v","error","-xerror","-i",str(clip),"-map","0:v:0","-f","null","-"],timeout=40)
contact=Image.new("RGB",(450*3,820),"#0f1014")
draw=ImageDraw.Draw(contact)
for k,t in enumerate((.12,.4,.75)):
    dst=OUT/(f"UHD_GRILLE_{k}.jpg")
    invoke(["ffmpeg","-hide_banner","-v","error","-ss",str(t),"-i",str(clip),
       "-frames:v","1","-vf","scale=450:800:flags=lanczos",
       "-q:v","3","-y",str(dst)],timeout=25)
    im=Image.open(dst).convert("RGB")
    contact.paste(im,(k*450,20))
    draw.text((k*450+8,4),f"C8 Audi 4K @ {SRC_START+t:.2f}s",fill="white")
contact_path=OUT/"UHD_GRILLE_CONTACT.jpg"
contact.save(contact_path,quality=89)
manifest={
  "generated_utc":datetime.now(timezone.utc).isoformat(),
  "project":"YUNEX RS6 NO MERCY C2",
  "source_page":"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874",
  "source_url":URL,"source_original_native_dimensions":[3840,2160],
  "source_native_fps":"25/1",
  "source_start_sec":SRC_START,"extraction_duration_sec":SRC_DURATION,
  "output":TITLE,"output_ffprobe":p,"output_sha256":digest(clip),
  "fully_decoded":True,"portrait_native_crop_pixels":[1215,2160],
  "rights":"NOT CLEARED -- OWNER DRAFT REVIEW ONLY",
  "source_car":"Audi RS 6 Avant C8 Daytona Grey (official Audi)",
  "shot_description":"Chrome Audi rings and grille, slow camera/detail movement; <1s cutaway, not driven-action footage",
  "QA":"Audited by agent A2 at 06:07.37 as pure grille closeup; C2 handles non-overlapping macro.",
}
(OUT/"UHD_GRILLE_MANIFEST.json").write_text(json.dumps(manifest,indent=2))
(OUT/"UHD_GRILLE_SHA256SUMS.txt").write_text("\n".join(digest(x)+"  "+x.name for x in OUT.iterdir() if x.is_file())+"\n")
with zipfile.ZipFile(OUT/"YUNEX_RS6_C2_UHD_ADDON.zip","w",zipfile.ZIP_DEFLATED,compresslevel=4) as z:
    for f in OUT.iterdir():
        if f.is_file() and f.name!="YUNEX_RS6_C2_UHD_ADDON.zip": z.write(f,f.name)
print(json.dumps({"status":"REAL_UHD_SOURCE_ACQUIRED_AND_EXTRACTED",
 "source_native":"3840x2160/25","output":p,"full_decode":"PASS",
 "sha256":manifest["output_sha256"],
 "addon_zip_bytes":(OUT/"YUNEX_RS6_C2_UHD_ADDON.zip").stat().st_size},indent=2))
