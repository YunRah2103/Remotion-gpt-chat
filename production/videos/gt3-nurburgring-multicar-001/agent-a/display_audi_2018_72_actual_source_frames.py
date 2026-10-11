#!/usr/bin/env python3
"""Only existing source frames from real 2018 Audi film; convert three sheet images into displayable evidence."""
import base64,io,json
from pathlib import Path
from PIL import Image,ImageOps
root=Path("inputs/audi_72_source_proof")
m=root/"SOURCE_MANIFEST.json"
j=json.loads(m.read_text());assert j["original_expected_SHA256"]==j["original_actual_SHA256"]
assert j["video_full_decode"]=="PASS"
print("VISUAL_AUDI_2018_ORIGINAL_NATIVE_VIDEO_SHA",j["original_actual_SHA256"],flush=True)
for k in range(1,4):
 p=root/f"AUDI_2018_PANEL_{k}_24_REAL_SOURCE_FRAMES.jpg"
 with Image.open(p) as im:
  img=ImageOps.contain(im.convert("RGB"),(1800,900))
  f=io.BytesIO();img.save(f,format="JPEG",quality=78,optimize=True)
  print(f"AUDI_PANEL_{k}_BASE64_START:"+base64.b64encode(f.getvalue()).decode("ascii")+f":AUDI_PANEL_{k}_BASE64_END",flush=True)
 print("AUDI_72_FRAME_SHEET",k,p.stat().st_size,flush=True)
