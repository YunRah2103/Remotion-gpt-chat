#!/usr/bin/env python3
"""Acquire real original Citroen DS publisher press films from openly downloadable Oodrive share.
No login/cookie bypass; uses the publisher-provided public Download UI.
Create truthful ffprobe, visual frame sheets and 3-second native excerpts, not editor-approved files.
"""
import asyncio,hashlib,json,pathlib,subprocess,zipfile,math
from fractions import Fraction
from PIL import Image,ImageDraw
from playwright.async_api import async_playwright

ROOT=pathlib.Path("out/fr-a-citroen-ds-real-video")
for directory in ("originals","contact_sheets","proof_excerpts"):(ROOT/directory).mkdir(parents=True,exist_ok=True)
SHARE="https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4"
PARENT="2025 - The 70th ANNIVERSARY OF THE 1955 DS"
SOURCES=[
 ("ds-paris-2025-moving","02 - 20250203 - DS PARADE IN PARIS BEFORE RETROMOBILE",
 "00 - VIDEO_DS_RETROMOBILE_PARADE-PARIS.mp4",29930000),
 ("ds-archive-dynamics","01 - DS Archives- vidéos",
 "DS Bande TV - 4 - Dynamiques - Uncompress 10 bits.mp4",258892836),
 ("ds-archive-rallies","01 - DS Archives- vidéos",
 "DS Bande TV - 7 - Rallyes - Uncompress 10 bits.mp4",370061042)
]
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def command(args,timeout=140):
 p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-700:])
 return p.stdout
def probe(p):
 d=json.loads(command(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],60))
 v=next(x for x in d["streams"] if x.get("codec_type")=="video")
 fr=v.get("avg_frame_rate","0/1")
 return {"width":int(v["width"]),"height":int(v["height"]),
  "fps":round(float(Fraction(fr)),3),"duration_sec":round(float(d["format"].get("duration") or 0),3),
  "bitrate":int(d["format"].get("bit_rate") or 0),
  "codec":v.get("codec_name"),"audio":any(s["codec_type"]=="audio" for s in d["streams"]),
  "actual_source_bytes":p.stat().st_size}
def frames(path,slug,duration):
 for part in range(2):
  canvas=Image.new("RGB",(1920,1540),"#13161a")
  dr=ImageDraw.Draw(canvas)
  dr.text((13,9),f"REAL ORIGINAL CITROEN DS: {slug} decoded frames {part*12+1}-{part*12+12} / 24",fill="#fafafa")
  for k in range(12):
   i=part*12+k
   t=max(.2,min(duration-.2,(i+.5)*duration/24))
   thumb=ROOT/"contact_sheets"/f"__{slug}_{i:02}.jpg"
   command(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),"-i",str(path),
        "-frames:v","1","-vf","scale=620:-2",str(thumb)],75)
   with Image.open(thumb) as img:
    img=img.convert("RGB");img.thumbnail((620,335))
    x=(k%3)*640+4;y=(k//3)*376+36
    canvas.paste(img,(x,y))
    dr.text((x+3,y+342),f"{t:.2f} sec",fill="#ffffff")
   thumb.unlink()
  sheet=ROOT/"contact_sheets"/f"{slug}-frames-{part*12+1:02}-{part*12+12:02}.jpg"
  canvas.save(sheet,quality=89)
def samples(path,slug,probe_info):
 duration=probe_info["duration_sec"]
 for index,f in enumerate((.18,.50,.80)):
  start=max(.05,min(duration-3.15,duration*f))
  dest=ROOT/"proof_excerpts"/f"{slug}-QA-{index+1}-3s.mp4"
  command(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(start),"-i",str(path),
   "-t","3","-map","0:v:0","-c:v","libx264","-preset","veryfast","-crf","23",
   "-pix_fmt","yuv420p","-an","-movflags","+faststart",str(dest)],90)
  chk=probe(dest)
  if chk["duration_sec"]<2.8:raise RuntimeError("QA_EXCERPT_INVALID")
async def run():
 outcomes=[]
 async with async_playwright() as playwright:
  browser=await playwright.chromium.launch(headless=True,args=["--no-sandbox"])
  for slug,folder,name,size in SOURCES:
   record={"id":slug,"filename":name,"folder":folder,"expected_bytes":size,
    "source_page":SHARE,"status":"NOT_DOWNLOADED",
    "visual_verified":False,"approved_unique_shots":0,"reuse_rights_confirmed":False}
   ctx=await browser.new_context(accept_downloads=True,viewport={"width":1350,"height":900})
   page=await ctx.new_page();file=ROOT/"originals"/(slug+".mp4")
   try:
    await page.goto(SHARE,wait_until="domcontentloaded",timeout=50000)
    await page.wait_for_timeout(2400)
    await page.get_by_text(PARENT,exact=True).first.dblclick(timeout=18000)
    await page.wait_for_timeout(1500)
    await page.get_by_text(folder,exact=True).first.dblclick(timeout=18000)
    await page.wait_for_timeout(1800)
    await page.get_by_text(name,exact=True).first.click(timeout=15000)
    await page.wait_for_timeout(500)
    dl=page.get_by_role("button",name="Download",exact=True)
    if await dl.count()!=1:raise RuntimeError(f"DOWNLOAD_BUTTON_COUNT:{await dl.count()}")
    async with page.expect_download(timeout=200000) as initiated:
     await dl.click(timeout=16000)
    download=await initiated.value
    print("OFFICIAL_REAL_DOWNLOAD_STARTED",slug,download.suggested_filename,flush=True)
    await download.save_as(str(file))
    error=await download.failure()
    if error:raise RuntimeError("CHROMIUM_DOWNLOAD_FAILED "+str(error))
    info=probe(file)
    record.update({"status":"REAL_DOWNLOADED","actual_probe":info,"original_sha256":sha(file),
      "actual_original_file":str(file.relative_to(ROOT)),
      "original_1080_native_pass":info["width"]>=1920 and info["height"]>=1080 and info["fps"]>=23})
    print("PUBLISHER_NATIVE_PROBE",slug,json.dumps(info),"sha",record["original_sha256"],flush=True)
    if not record["original_1080_native_pass"]:
     record["status"]="REJECT_BELOW_NATIVE_1080"
    else:
     command(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(file),
      "-map","0:v:0","-f","null","-"],320)
     frames(file,slug,info["duration_sec"])
     samples(file,slug,info)
     record["status"]="REAL_NATIVE_1080_ORIGINAL_ACQUIRED_VISUAL_REVIEW_PENDING"
     print("REAL_CITROEN_DS_PUBLISHER_HD_FILM",slug,"seconds",info["duration_sec"],flush=True)
   except Exception as e:
    record.update({"status":"DOWNLOAD_OR_QA_FAILED","error":str(e)[:850]})
    print("PUBLISHER_FILM_ERROR",slug,str(e)[:400],flush=True)
   finally:
    # Full original never presented as approved edit clip; keep proof only.
    file.unlink(missing_ok=True)
    outcomes.append(record)
    (ROOT/"manifest.json").write_text(json.dumps(outcomes,indent=2,ensure_ascii=False))
    await ctx.close()
  await browser.close()
 (ROOT/"README.md").write_text(
  "Public official Stellantis press Oodrive Download UI was used. Files are not automatically licensed for TikTok redistribution. "+
  "Native physical-source video was FFprobed + fully decoded, with 24 actual frames sampled throughout each movie and 3 excerpts where HD. "+
  "Do NOT count as editor-approved shots until visual inspection of car identity, movement, vintage versus modern and baked-in logos.\n")
 output=pathlib.Path("out/FR-A-CITROEN-DS-PUBLISHER-REAL-HD-QA.zip")
 with zipfile.ZipFile(output,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as z:
  for p in ROOT.rglob("*"):
   if p.is_file():z.write(p,p.relative_to(ROOT))
 print("DS_ORIGINAL_PUBLISHER_FINAL",json.dumps({"source_movies_successfully_downloaded":sum("ACQUIRED" in x["status"] for x in outcomes),
 "tested":len(outcomes),"qa_zip_bytes":output.stat().st_size,"sha256":sha(output),
 "approved_shots":0}),flush=True)
asyncio.run(run())
