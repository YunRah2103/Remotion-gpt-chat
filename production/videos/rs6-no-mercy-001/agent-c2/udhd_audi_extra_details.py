#!/usr/bin/env python3
"""C2 official Audi RS6 C8 source-specific detail inserts. Owner-only draft review.
Use actual native UHD ranges: headlight/front aero; spinning wheel blur; drilled disc + RS red brake.
Unlicensed source video must not be republished publicly. Full ffprobe and decode, hashes and contact.
"""
import hashlib,json,pathlib,subprocess,zipfile
from datetime import datetime,timezone
from PIL import Image,ImageDraw
URL=("https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/"
"urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/"
"renditions/video_2160p.mp4/as/"
"audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1")
OUT=pathlib.Path("c2_audi_uhd_extra");OUT.mkdir(exist_ok=True)
SHOTS=[
 {"id":"UHD_MATRIX_LED_FRONT_CORNER","start":358.87,"seconds":0.82,"crop_x":640,
  "creative":"C8 daytime Matrix LED and aggressive bumper inlet macro; use as monochrome sub-second flash"},
 {"id":"UHD_MOTION_BLUR_WHEEL","start":363.27,"seconds":0.32,"crop_x":720,
  "creative":"Moving wheel blurred during very brief fast cut; check scene-splice edge carefully"},
 {"id":"UHD_RS6_RED_BRAKE_CALIPER","start":375.06,"seconds":0.82,"crop_x":1750,
  "creative":"C8 drilled disc, RS logo on caliper, silver multi-spoke wheel. Slow detail-camera push"}
]
def run(argv,seconds=140):
 p=subprocess.run(argv,capture_output=True,text=True,timeout=seconds)
 if p.returncode:raise RuntimeError(f"exit {p.returncode}: "+p.stderr[-1800:])
 return p.stdout
def sha(p):
 d=hashlib.sha256()
 with open(p,"rb") as f:
  for v in iter(lambda:f.read(1<<20),b""): d.update(v)
 return d.hexdigest()
def probe(p):
 d=json.loads(run(["ffprobe","-v","error","-show_entries",
 "format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate,pix_fmt",
 "-of","json",str(p)],30))
 v=next((x for x in d["streams"] if x["codec_type"]=="video"),{})
 return {"width":v["width"],"height":v["height"],"codec":v["codec_name"],
         "fps":v["avg_frame_rate"],"duration":float(d["format"]["duration"]),
         "size":int(d["format"]["size"]),"pix_fmt":v.get("pix_fmt")}
visuals=[]
for shot in SHOTS:
 clip=OUT/(shot["id"]+".mp4")
 filter=f"crop=1215:2160:{shot['crop_x']}:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p"
 run(["ffmpeg","-hide_banner","-nostdin","-v","error","-rw_timeout","30000000",
     "-ss",str(shot["start"]),"-i",URL,"-t",str(shot["seconds"]),
     "-map","0:v:0","-an","-vf",filter,
     "-c:v","libx264","-preset","medium","-crf","15",
     "-movflags","+faststart","-y",str(clip)],210)
 details=probe(clip)
 if (details["width"],details["height"])!=(1080,1920) or details["duration"]<0.22:
  raise RuntimeError("Source extraction failed quality check "+shot["id"])
 run(["ffmpeg","-loglevel","error","-xerror","-i",str(clip),"-map","0:v:0","-f","null","-"],60)
 shot.update({"filename":clip.name,"probe":details,"sha256":sha(clip),"full_ffmpeg_decode":"PASS"})
 mid=OUT/(shot["id"]+".jpg")
 run(["ffmpeg","-hide_banner","-v","error","-ss",str(min(shot["seconds"]/2,details["duration"]/2)),
  "-i",str(clip),"-frames:v","1","-vf","scale=450:800","-q:v","3","-y",str(mid)],30)
 visuals.append(mid)
sheet=Image.new("RGB",(450*len(visuals),840),"#131920")
d=ImageDraw.Draw(sheet)
for i,p in enumerate(visuals):
 im=Image.open(p).convert("RGB")
 sheet.paste(im,(i*450,28))
 d.text((i*450+7,6),SHOTS[i]["id"]+" @ "+str(SHOTS[i]["start"]),fill="white")
sheet.save(OUT/"UHD_EXTRA_CONTACT.jpg",quality=90)
manifest={"project":"YUNEX RS6 NO MERCY C2","as_of":datetime.now(timezone.utc).isoformat(),
 "source":"official Audi C8 RS6 Avant Daytona Grey footage",
 "source_url":URL,"source_original_native_dimensions":[3840,2160],"source_original_fps":"25/1",
 "review_only":True,"rights":"not cleared for public redistribution",
 "shots":SHOTS}
(OUT/"UHD_EXTRA_MANIFEST.json").write_text(json.dumps(manifest,indent=2))
(OUT/"UHD_EXTRA_SHA256SUMS.txt").write_text("".join(sha(x)+"  "+x.name+"\n" for x in sorted(OUT.iterdir()) if x.is_file()))
with zipfile.ZipFile(OUT/"YUNEX_RS6_C2_UHD_EXTRA.zip","w",zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for p in sorted(OUT.iterdir()):
  if p.is_file() and p.name!="YUNEX_RS6_C2_UHD_EXTRA.zip":z.write(p,p.name)
print(json.dumps({"verified_count":len(SHOTS),"native_source":"3840x2160",
 "full_decodes":"PASS","outputs":[{"id":x["id"],"details":x["probe"],"sha256":x["sha256"]} for x in SHOTS],
 "addon_zip_sha256":sha(OUT/"YUNEX_RS6_C2_UHD_EXTRA.zip")},indent=2))
