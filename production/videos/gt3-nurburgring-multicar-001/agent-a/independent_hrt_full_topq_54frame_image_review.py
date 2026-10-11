#!/usr/bin/env python3
"""Examine independent source footage HRT 82s film from 54 decoded native HD frames."""
from pathlib import Path
from PIL import Image,ImageOps
import base64,io,json,hashlib
ROOT=Path("inputs/hrt_nbr_topqual_82_sec")
mfiles=list(ROOT.rglob("SOURCE_MANIFEST.json"))
assert len(mfiles)==1,(mfiles,len(mfiles))
record=json.loads(mfiles[0].read_text())
assert record["status"]=="FULL_NATIVE_1080_MOVIE_FULL_DECODED_INDEPENDENT_RACING_FRAME_REVIEW_PENDING"
assert record["native_pixels"]==[1920,1080]
original=mfiles[0].parent/record["original_path"]
assert original.is_file()
dig=hashlib.sha256()
with original.open('rb') as f:
 for x in iter(lambda:f.read(1<<20),b''):dig.update(x)
assert dig.hexdigest()==record["original_sha256"]
print("NATIVE_82_SECOND_FILM_INDEPENDENT_VIDEO_SHA_VERIFIED",record['duration'],dig.hexdigest(),flush=True)
for idx,p in enumerate(record["contact_panels"]):
 path=mfiles[0].parent/p
 assert path.is_file(),path
 with Image.open(path) as im:
  out=ImageOps.contain(im.convert("RGB"),(1650,560))
  buf=io.BytesIO();out.save(buf,"JPEG",quality=81,optimize=True)
  print(f"FULL_NBR_TOPQ_PANEL_{idx+1}_BASE64_START:"+base64.b64encode(buf.getvalue()).decode()+f":FULL_NBR_TOPQ_PANEL_{idx+1}_BASE64_END",flush=True)
 print("PANEL_PHYSICAL_SOURCE",idx+1,path.stat().st_size,flush=True)
print("QUALIFYING_FRAMES_54_SOURCE_REAL_VIDEO_REVIEW_READY",flush=True)
