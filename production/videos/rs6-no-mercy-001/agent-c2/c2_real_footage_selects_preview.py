#!/usr/bin/env python3
"""Create C2 honest silent footage-selects motion strip from previously decoded real C8 shots.
Not the D/E full film. No generated cars, no stock footage, no synthetic motion.
Samples are owner-only draft release material; not cleared for public publication.
"""
import pathlib,subprocess,hashlib,json,zipfile
from PIL import Image,ImageDraw
from datetime import datetime,timezone
IN=pathlib.Path("c2_private_sources")
OUT=pathlib.Path("c2_real_selects_preview"); OUT.mkdir(parents=True,exist_ok=True)
# Source exact filenames and independently viewed component-specific editorial notes.
# Frames exactly matched at 30fps; no freeze/slomo/upscale/repeat.
PICKS=[
 ("BLACK_MATRIX_LED_REVEAL.mp4",11,"Dark C8 signature Matrix LED reveal"),
 ("UHD_MATRIX_LED_FRONT_CORNER.mp4",19,"Native-4K Audi source front LED and intake"),
 ("BLACK_WHEEL_BRAKE.mp4",8,"Brief cut-wheel detail, real black C8"),
 ("UHD_RS6_RED_BRAKE_CALIPER.mp4",19,"Native-4K RS red brake and drilled-disc detail"),
 ("BLUE_CABIN_AMBIENT.mp4",17,"C8 cool cabin lighting bridge"),
 ("BLACK_LED_MACRO.mp4",8,"Black C8 tight light accent"),
 ("RS6_C8_NATIVE4K_AUDI_GRILLE.mp4",21,"Native-4K Audi rings, manually corrected crop"),
 ("BLUE_OVAL_EXHAUST.mp4",18,"Authentic oval RS exhaust detail"),
 ("BLACK_RS6_TAIL_LIGHT.mp4",16,"C8 rear lit signature final cut"),
]
def run(args, timeout=90):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode: raise RuntimeError(f"Failed code {p.returncode}: "+p.stderr[-1200:])
 return p.stdout
def h(p):
 a=hashlib.sha256()
 with open(p,"rb") as f:
  for q in iter(lambda:f.read(1<<20),b""):a.update(q)
 return a.hexdigest()
def probe(path):
 d=json.loads(run(["ffprobe","-v","error","-show_entries",
 "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,pix_fmt",
 "-of","json",str(path)],30))
 v=next(x for x in d["streams"] if x["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"rate":v["r_frame_rate"],
 "codec":v["codec_name"],"pix_fmt":v.get("pix_fmt"),"duration":float(d["format"]["duration"]),
 "bytes":int(d["format"]["size"]),"frames":v.get("nb_frames")}
events=[]
concat_path=OUT/"segments.txt"
contact=Image.new("RGB",(320*len(PICKS),585),(13,17,22))
cdraw=ImageDraw.Draw(contact)
frames_total=0
with open(concat_path,"w") as listfile:
 for i,(fname,count,note) in enumerate(PICKS):
  origin=IN/fname
  if not origin.exists():raise FileNotFoundError(origin)
  original=probe(origin)
  if (original["width"],original["height"]) != (1080,1920):
   raise RuntimeError("BAD_SOURCE_PIXEL_COUNT "+fname)
  # Some genuine source windows are only 0.2-0.3 seconds.
  # Never create fake freeze frames: clamp to available original frames.
  count=min(count,int(original["frames"]))
  if count<4:raise RuntimeError("TOO_SHORT_SOURCE "+fname)
  output=OUT/f"cut_{i:02}.mp4"
  run(["ffmpeg","-hide_banner","-v","error","-nostdin","-i",str(origin),
    "-map","0:v:0","-an","-vf","fps=30,format=yuv420p",
    "-frames:v",str(count),"-c:v","libx264","-crf","16","-preset","fast",
    "-bf","0","-movflags","+faststart","-y",str(output)],90)
  local=probe(output)
  if int(local["frames"]) != count:raise RuntimeError(f"{fname} wanted {count} frames got {local['frames']}")
  run(["ffmpeg","-v","error","-xerror","-i",str(output),"-f","null","-"],30)
  listfile.write("file '"+output.name+"'\n")
  frame=OUT/f"cut_frame_{i:02}.jpg"
  run(["ffmpeg","-v","error","-ss",f"{(count-1)/60:.4f}","-i",str(output),
       "-frames:v","1","-vf","scale=320:568","-q:v","4","-y",str(frame)])
  im=Image.open(frame).convert("RGB");contact.paste(im,(i*320,17))
  cdraw.text((i*320+5,2),f"{i+1:02} {count}fr",fill="white")
  events.append({"source":fname,"frames":count,"note":note,"start_frame":frames_total,
     "first_source_ffprobe":original,"decoded":True,"source_sha256":h(origin)})
  frames_total+=count
preview=OUT/"YUNEX_RS6_C2_REAL_FOOTAGE_SELECTS.mp4"
run(["ffmpeg","-hide_banner","-v","error","-f","concat","-safe","0","-i",str(concat_path),
     "-map","0:v:0","-an","-c:v","libx264","-preset","medium","-crf","17",
     "-pix_fmt","yuv420p","-r","30","-movflags","+faststart","-y",str(preview)],120)
p=probe(preview)
if int(p["frames"]) != frames_total or p["width"]!=1080 or p["height"]!=1920:
 raise RuntimeError(f"Final preview QA mismatch {frames_total}: {p}")
run(["ffmpeg","-v","error","-xerror","-i",str(preview),"-f","null","-"],60)
contact.save(OUT/"C2_SHOT_SELECTS_CONTACT.jpg",quality=85,optimize=True)
report={"generated_utc":datetime.now(timezone.utc).isoformat(),
 "project":"YUNEX RS6 NO MERCY, C2 source visual-selects technical proof only",
 "no_audio":True,"not_final_video":True,"not_actual_dynamic_driving_footage":True,
 "public_redistribution_approved":False,
 "notes":"All images and video are transcodes of REAL sourced C8 RS6 footage; simple hard cut and source order. No colour grade/audio/text/VFX added. The working D/E film must mix with real A2/B2 driving shots.",
 "preview":preview.name,"preview_probe":p,"preview_sha256":h(preview),
 "video_full_decode":"PASS", "frames":frames_total,"duration_s":frames_total/30,
 "shots":events}
(OUT/"C2_SELECTS_MANIFEST.json").write_text(json.dumps(report,indent=2))
(OUT/"C2_SELECTS_SHA256SUMS.txt").write_text(h(preview)+"  "+preview.name+"\n")
print(json.dumps({"full_video_ffmpeg_decode":"PASS","real_sources":len(PICKS),
 "duration_sec":frames_total/30,"final_mp4":str(preview),
 "final_ffprobe":p,"sha256":h(preview)},indent=2))
