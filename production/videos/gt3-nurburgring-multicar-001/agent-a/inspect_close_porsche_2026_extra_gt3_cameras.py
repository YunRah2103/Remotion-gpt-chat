#!/usr/bin/env python3
"""Independent close camera QA of unreviewed 2026 4K Nürburgring original scenes."""
import json,subprocess,requests,hashlib,io,base64
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
URL="https://newstv.porsche.com/porschevideos/newstv.porsche.com_334111_en.mp4"
ROOT=Path("out/gt3-a-n24-porsche-extra-4k-close-qa");ROOT.mkdir(parents=True,exist_ok=True)
ORIG=ROOT/"original_porsche_n24_2026_4k.mp4"
times=[27.9,29.4,30.6,32.0,33.8,34.9,36.0,37.2,38.1,43.9,45.0,46.4,47.5,48.6,49.7]
def call(args,t=90):
 x=subprocess.run(args,text=True,capture_output=True,timeout=t)
 if x.returncode:raise RuntimeError(x.stderr[-500:])
 return x.stdout
def dig(f):
 h=hashlib.sha256()
 with f.open("rb") as v:
  for d in iter(lambda:v.read(1<<20),b""):h.update(d)
 return h.hexdigest()
res={"source":URL,"status":"NO_QUALIFIED_NEW_CAMERAS","frames":[],"candidate_scenes_new_approved":0}
try:
 with requests.get(URL,stream=True,timeout=(10,50)) as rs:
  rs.raise_for_status()
  with ORIG.open("wb") as o:
   for z in rs.iter_content(1<<20):
    if z:o.write(z)
 original=json.loads(call(["ffprobe","-v","error","-of","json","-show_streams","-show_format",str(ORIG)],35))
 v=next(x for x in original["streams"] if x["codec_type"]=="video")
 assert (int(v["width"]),int(v["height"]))==(3840,2160)
 originalsha=dig(ORIG)
 canvas=Image.new("RGB",(4*540,4*337),(7,7,7));draw=ImageDraw.Draw(canvas)
 for i,ts in enumerate(times):
  p=ROOT/(f"frame_{i:02d}.jpg")
  call(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(ORIG),
        "-frames:v","1","-vf","scale=540:304","-q:v","3",str(p)],35)
  with Image.open(p) as f:canvas.paste(f.convert("RGB"),((i%4)*540,(i//4)*337+30))
  p.unlink()
  draw.text(((i%4)*540+6,(i//4)*337+6),f"Original 2026 N24 source {ts:.2f}s",fill="white")
  res["frames"].append({"t":ts,"pixel_source":"3840x2160 UHD","frame":"ACTUAL_SOURCE" })
 sheet=ROOT/"ACTUAL_ORIGINAL_2026_N24_PORSCHE_15_LARGE_RACE_SCENES.jpg"
 canvas.save(sheet,quality=91,optimize=True)
 preview=ImageOps.contain(canvas,(1650,1120));b=io.BytesIO();preview.save(b,format="JPEG",quality=76,optimize=True)
 print("INDEPENDENT_4K_RACING_CLOSE_PREVIEW_START:"+base64.b64encode(b.getvalue()).decode()+":INDEPENDENT_4K_RACING_CLOSE_PREVIEW_END",flush=True)
 res.update(status="ORIGINAL_NATIVE_UHD_15_ACTUAL_TRACK_SAMPLES_VISUAL_QA_REQUIRED",
       source_original_sha256=originalsha,original_bytes=ORIG.stat().st_size,
       native_pixels=[3840,2160],contact_sheet=str(sheet.relative_to(ROOT)))
 print("REAL_4K_ORIGINAL_REPROBED",originalsha,res["original_bytes"],flush=True)
except Exception as e:
 res.update(status="PHYSICAL_SOURCE_QA_FAILED",error=str(e)[-600:])
 print("FAIL",res["error"],flush=True)
finally:
 ORIG.unlink(missing_ok=True)
 (ROOT/"CONTACT_QA_MANIFEST.json").write_text(json.dumps(res,indent=2)+"\n")
