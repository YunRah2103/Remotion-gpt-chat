#!/usr/bin/env python3
"""Visually inspect actual downloaded HRT GT3 native-HD videos, printed as image proof."""
from pathlib import Path
from PIL import Image,ImageOps
import base64,io,zipfile,json,hashlib
root=Path("inputs/hrt_2025_media")
allzip=list(root.rglob("*.zip"))
assert allzip, "Actual HRT source ZIP not fetched"
for archive in allzip:
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  m=json.loads(z.read("SOURCE_MANIFEST.json"))
  print("SOURCE_COUNT",m['native_hd_media_file_count'])
  for item in m["sources"]:
   print("SOURCE_INFO",json.dumps({k:item.get(k) for k in ("source_id","status","resolution","duration","sha256","bytes","contact_sheet","publisher_page")}),flush=True)
   if item.get("status")!="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING":continue
   assert hashlib.sha256(z.read(item["file"])).hexdigest()==item["sha256"]
   frame=z.read(item["contact_sheet"])
   with Image.open(io.BytesIO(frame)) as im:
    preview=ImageOps.contain(im.convert("RGB"),(1200,550))
    bf=io.BytesIO();preview.save(bf,format="JPEG",quality=80,optimize=True)
    print("HRT_FRAME_IMAGE_START_"+item['source_id']+":"+base64.b64encode(bf.getvalue()).decode("ascii")+":HRT_FRAME_IMAGE_END_"+item['source_id'],flush=True)
 print("ALL_HRT_REAL_VIDEOS_SOURCE_MANIFEST_AND_CRC_PASS")
