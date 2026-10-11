#!/usr/bin/env python3
"""Build Agent A French Classics V5 as actual 17 real-motion videos:
verified V4 package 14 + 3 visually reviewed clean 1080p moving Paris classic Citroen DS segments.

DS original obtained from official public Stellantis DS media sharing web UI.
Even publisher availability does NOT establish permission for TikTok redistribution.
Each delivered source and clip gets SHA, FFprobe verification, actual decoded contact sheet.
"""
import asyncio,json,hashlib,zipfile,shutil,subprocess,csv,pathlib
from fractions import Fraction
from PIL import Image,ImageDraw
from playwright.async_api import async_playwright

ROOT=pathlib.Path("out/fr-legends-a-v5");SRC=pathlib.Path("out/source-v4/FR-LEGENDS-AGENT-A-CLASSICS-14-REAL-MOVING-SHOTS.zip")
FINAL=pathlib.Path("out/FR-LEGENDS-AGENT-A-CLASSICS-17-REAL-MOVING-SHOTS.zip")
V4_SHA="1b035540d417f52f3714465663ecb605e4fde77959f976238035020312808a5c"
DS_SHA="a7c4bff0f3f945acf88f49b1cfc468e7bd415c2cf0034bad2ef9b27090dc2d19"
SHARE="https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4"
FILM="00 - VIDEO_DS_RETROMOBILE_PARADE-PARIS.mp4"
for folder in ("clips","originals","contact_sheets"): (ROOT/folder).mkdir(parents=True,exist_ok=True)

def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1048576),b""):h.update(c)
 return h.hexdigest()
def run(args,timeout=160):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-900:])
 return p.stdout
def probe(p):
 data=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)],50))
 v=next(x for x in data["streams"] if x["codec_type"]=="video")
 return {"width":int(v["width"]),"height":int(v["height"]),
  "fps":round(float(Fraction(v.get("avg_frame_rate","0/1"))),3),
  "duration":round(float(data["format"].get("duration") or 0),3),
  "codec":v.get("codec_name"),"bitrate":int(data["format"].get("bit_rate") or 0),
  "audio":any(x.get("codec_type")=="audio" for x in data["streams"])}

assert SRC.exists(),"Missing V4 original ZIP. Fetch via GitHub Actions artifact"
assert sha(SRC)==V4_SHA,(sha(SRC),V4_SHA)
with zipfile.ZipFile(SRC) as z:z.extractall(ROOT)
manifest=json.loads((ROOT/"manifest.json").read_text())
assert len(manifest["clips"])==14 and manifest["models_count"]==3
for row in manifest["clips"]:
 assert sha(ROOT/row["clip"])==row["sha256"],row["id"]
original=ROOT/"originals"/"citroen-ds-2025-paris-night-parade-1080p-original.mp4"
async def download_ds():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=["--no-sandbox"])
  ctx=await browser.new_context(accept_downloads=True)
  page=await ctx.new_page()
  try:
   await page.goto(SHARE,wait_until="domcontentloaded",timeout=55000)
   await page.wait_for_timeout(2500)
   await page.get_by_text("2025 - The 70th ANNIVERSARY OF THE 1955 DS",exact=True).first.dblclick(timeout=18000)
   await page.wait_for_timeout(1500)
   await page.get_by_text("02 - 20250203 - DS PARADE IN PARIS BEFORE RETROMOBILE",exact=True).first.dblclick(timeout=18000)
   await page.wait_for_timeout(1500)
   await page.get_by_text(FILM,exact=True).first.click(timeout=15000)
   async with page.expect_download(timeout=130000) as target:
    await page.get_by_role("button",name="Download",exact=True).click(timeout=14000)
   d=await target.value
   print("V5_REAL_DS_PUBLISHER_DOWNLOAD",d.suggested_filename,flush=True)
   await d.save_as(str(original))
   error=await d.failure()
   if error:raise RuntimeError("Publisher download failed "+str(error))
  finally:
   await browser.close()
asyncio.run(download_ds())
assert sha(original)==DS_SHA, ("source SHA changed",sha(original))
source_probe=probe(original)
assert (source_probe["width"],source_probe["height"])==(1920,1080)
assert source_probe["fps"]==24 and 22<source_probe["duration"]<23
print("V5_DS_ORIGINAL_CONFIRMED",json.dumps({"size":original.stat().st_size,"sha256":sha(original),"probe":source_probe}),flush=True)

# Three distinct authentic moving moments, manually reviewed in 24 source contact sheet
# and 4-7s source shot storyboard; do not include parked press arrival, city monuments
# without cars, or unrelated modern DS brand SUV shots.
SHOTS=[
 ("ds-paris-black-side-night-pass",5.76,6.71,"Black classic Citroen DS crosses frame along Arc de Triomphe illuminated at night, broad side view.","premium"),
 ("ds-paris-red-side-night-pass",6.96,7.69,"Red classic Citroen DS drives by Arc de Triomphe, different car and tracking moment, broad side view.","premium"),
 ("ds-paris-black-rear-night-drive",7.78,8.62,"Classic black Citroen DS drives away on illuminated Paris road; tail-and-rear three-quarter view.","supporting")
]
for slug,start,end,description,grade in SHOTS:
 clip=ROOT/"clips"/(slug+".mp4")
 run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(original),
    "-t",str(end-start),"-map","0:v:0","-map","0:a?","-c:v","libx264","-crf","17",
    "-preset","fast","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k",
    "-movflags","+faststart",str(clip)],180)
 stream=probe(clip)
 assert (stream["width"],stream["height"])==(1920,1080) and stream["fps"]==24 and stream["duration"]>0.65
 run(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(clip),"-map","0:v:0","-f","null","-"],70)
 sheet=Image.new("RGB",(1450,670),"#14171b");draw=ImageDraw.Draw(sheet)
 draw.text((8,8),f"{slug} -- four REAL decoded frames from final delivered native 1080p clip",fill="white")
 for ix,t in enumerate((.06,.31,.57,.86)):
  f=ROOT/"contact_sheets"/("__frame-"+slug+str(ix)+".jpg")
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(stream["duration"]*t),
    "-i",str(clip),"-frames:v","1","-vf","scale=700:-2",str(f)],55)
  with Image.open(f) as im:
   im=im.convert("RGB"); im.thumbnail((706,302))
   sheet.paste(im,((ix%2)*725+5,(ix//2)*322+24))
  f.unlink()
 p=ROOT/"contact_sheets"/(slug+"-actual-four-frames.jpg")
 sheet.save(p,quality=89)
 info={"id":slug,"make":"Citroen","model":"original classic Citroen DS (2025 parade, not modern DS SUV)",
  "creator":"Stellantis DS Automobiles official press film","source_url":SHARE,
  "source_file":FILM,"clip":"clips/"+clip.name,"original":"originals/"+original.name,
  "sha256":sha(clip),"original_sha256":DS_SHA,"source_in":start,"source_out":end,
  "probe":stream,"original_probe":source_probe,"contact_sheet":"contact_sheets/"+p.name,
  "camera_grade":grade,"actual_car_motion":True,"qa_description":description,
  "rights_notes":"Manufacturer shared with public 'View and download' press permissions, but social reposting/distribution rights not expressly confirmed. Verify rights before TikTok/Reels posting."}
 manifest["clips"].append(info)
 print("V5_ACTUAL_CITROEN_DS_SHOT",slug,json.dumps(stream),"sha",info["sha256"],flush=True)

manifest.update({"true_native_video_clips":len(manifest["clips"]),"models":["Citroen 2CV","original Alpine A110","Renault 5 Turbo 2","classic Citroen DS"],"models_count":4,
 "premium_dramatic_shots":sum(x["camera_grade"]=="premium" for x in manifest["clips"]),
 "supporting_real_motion_shots":sum(x["camera_grade"]=="supporting" for x in manifest["clips"]),
 "gate":"BLOCKED_PARTIAL","last_new_video":"Three inspected real historic Citroen DS night driving clips, source full native 1920x1080 24fps official publisher film.",
 "contract_min_shots":18,"contract_min_models":5,
 "licence_warning":"2CV CC attribution; Alpine/R5/DS publisher and archived creator reuse rights not fully independently cleared; request rights verification before publication."})
assert len(manifest["clips"])==17 and manifest["models_count"]==4
(ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
cols=["id","make","model","source_url","creator","clip","original","sha256","source_in","source_out","camera_grade","actual_car_motion","rights_notes"]
with (ROOT/"manifest.csv").open("w",newline="") as f:
 writer=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore")
 writer.writeheader()
 writer.writerows(manifest["clips"])
(ROOT/"README.md").write_text(
 "YUNEX French Legends Agent A V5 - THREE new real classic Citroen DS night exterior moving shots from official DS 70th anniversary Paris parade: 17 true-native-HD video excerpts over 4 models. "+
 "Originals included, 4-frame clip contact sheets, checked SHA, model labels, camera/source times. All V4 source clip SHAs verified prior to addition. "+
 "The separate historic rally 'Uncompress 10bit' master was in fact 720x576 and is REJECTED, not upscaled. "+
 "Still BLOCKED: 18 clips over 5 models minimum; need native-HD original Peugeot 205 GTI or Clio V6, plus additional quality shots. "+
 "Public download is not a grant of social/commercial reuse rights; rights must be checked before publication.\n")
with zipfile.ZipFile(FINAL,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for file in ROOT.rglob("*"):
  if file.is_file():z.write(file,file.relative_to(ROOT))
print("V5_REAL_CLASSIC_FOOTAGE_FINAL",json.dumps({"clips":len(manifest["clips"]),"models":manifest["models"],
 "new_classic_ds_shots":len(SHOTS),"artifact_bytes":FINAL.stat().st_size,
 "sha256":sha(FINAL),"gate":manifest["gate"]}),flush=True)
