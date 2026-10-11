#!/usr/bin/env python3
"""Print jpeg evidence images as base64 to GitHub runner logs for independent actual-frame visual review."""
import json,base64,io,zipfile
from PIL import Image,ImageOps
from pathlib import Path
root=Path("inputs/actual_2026_100frame_panels")
manifest=root/"MANIFEST.json"
assert manifest.is_file(),"Missing real 4K source 100-frame scan manifest"
j=json.loads(manifest.read_text());good=sum(1 for x in j["frames"] if x.get("success"))
assert good>=95,(good,len(j["frames"]))
print("ACTUAL_4K_VIDEO_100FRAME_SOURCE_SHA",j["native_producer_original_sha256"],"successful frames",good,flush=True)
for i in range(1,5):
 name=root/f"PANEL_{i:02d}_25FRAMES_PORSCHE_2026.jpg"
 assert name.is_file(),name
 with Image.open(name) as im:
  resized=ImageOps.contain(im.convert("RGB"),(1500,980))
  buff=io.BytesIO();resized.save(buff,"JPEG",quality=77,optimize=True)
  print(f"GH_2026_PANEL_{i}_BASE64_START:"+base64.b64encode(buff.getvalue()).decode("ascii")+f":GH_2026_PANEL_{i}_BASE64_END",flush=True)
 print("PANEL_BYTES_AND_DIMS",i,name.stat().st_size,resized.size,flush=True)
