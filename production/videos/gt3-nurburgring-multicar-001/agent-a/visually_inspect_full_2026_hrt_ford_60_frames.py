#!/usr/bin/env python3
"""Actual original HRT Ford full HD 84.12s: 60-frame, >1s-spaced manual race camera survey.
Source is actual 1920x1080, not smaller inset; visual labels per source timestamp.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import zipfile,hashlib,json,subprocess,io,base64,shutil
ROOT=Path("out/gt3-a-hrt-ford-fullfilm-60-frame-visual-qa");ROOT.mkdir(parents=True,exist_ok=True)
IN=Path("inputs/hrt-2026-full-original")
Z=next((x for x in IN.rglob("*.zip") if x.is_file() and x.stat().st_size>20_000_000),None)
assert Z is not None,"Full original actual source archive not found"
def chk(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
def run(a,t=40):
 p=subprocess.run(a,timeout=t,text=True,capture_output=True)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-450:])
 return p.stdout
with zipfile.ZipFile(Z) as z:
 assert z.testzip() is None
 m=json.loads(z.read("SOURCE_MANIFEST.json"))
 src=next(s for s in m["sources"] if s["source_id"]=="hrt_ford_2026_entire_original")
 assert src["status"]=="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING"
 original=ROOT/"actual_producer_hrt_ford_84s_TEMP.mp4"
 with z.open(src["file"]) as source, original.open("wb") as out:
  shutil.copyfileobj(source,out)
 assert chk(original)==src["sha256"]
 meta=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(original)]))
 v=next(x for x in meta["streams"] if x["codec_type"]=="video")
 assert (int(v["width"]),int(v["height"]))==(1920,1080)
 dur=float(meta["format"]["duration"])
 assert dur>=82.0 and dur<=87.0
 run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(original),"-f","null","-"],190)
 panels=[];frames=[]
 for panel in range(3):
  board=Image.new("RGB",(5*480,4*300),(6,6,6))
  d=ImageDraw.Draw(board)
  for i in range(20):
   idx=panel*20+i
   t=dur*(idx+.45)/60
   tmp=ROOT/(f"temp_{idx:02d}.jpg")
   run(["ffmpeg","-nostdin","-v","error","-y","-ss",f"{t:.3f}","-i",str(original),
    "-frames:v","1","-vf","scale=480:270","-q:v","3",str(tmp)],35)
   with Image.open(tmp) as image:
    board.paste(image.convert("RGB"),((i%5)*480,(i//5)*300+27))
   tmp.unlink(missing_ok=True)
   d.text(((i%5)*480+7,(i//5)*300+3),f"REAL Ford source {t:.2f}s",fill="white")
   frames.append({"source_timestamp_seconds":round(t,3),"panel_number":panel+1,"frame_index":idx,
                  "source_video_native_pixels":[1920,1080]})
  sheet=ROOT/(f"FORD_84S_ACTUAL_1080_GT3_20FRAMES_PANEL_{panel+1}.jpg")
  board.save(sheet,quality=93,optimize=True)
  mini=io.BytesIO();board.resize((2000,1000)).save(mini,format="JPEG",quality=80,optimize=True)
  print(f"HRT_FORD_84_SEC_PANEL_{panel+1}_BASE64_START:"+base64.b64encode(mini.getvalue()).decode("ascii")+f":HRT_FORD_84_SEC_PANEL_{panel+1}_BASE64_END",flush=True)
  panels.append(str(sheet))
  print("ACTUAL_FORD_RACING_1080_SOURCE_PANEL",panel+1,"FRAMES",20,flush=True)
 ROOT.joinpath("MANIFEST.json").write_text(json.dumps({"original_video_sha256":src["sha256"],"original_video_duration":dur,
  "source_page":src["publisher_page"],"native_pixels":[1920,1080],"full_decode":"PASS",
  "frames":frames,"panel_names":panels,"manufacturer_new_credit_automatically":0,
  "editorial_rule":"Only independent Nürburgring GT3 racing clips count. DTM Belgian Spa / Hockenheimring / Bahrain or stationary vehicle shots do not qualify. If 2026 Ford N24, confirm car number #64/#65/#67 from actual frames."},indent=2))
 print("SHA_PROVED_ALL_60_ACTUAL_FORD_SOURCE_FRAMES",src["sha256"],dur,flush=True)
 original.unlink(missing_ok=True)
