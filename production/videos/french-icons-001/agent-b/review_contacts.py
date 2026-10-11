#!/usr/bin/env python3
"""Produce model-review contact mosaics from the actual extracted 16 video artifact."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json,base64,io
src=Path("out/current")
manifest=json.loads((src/"manifest.json").read_text())
print("YUNEX_SOURCE_MANIFEST:"+json.dumps([{k:r.get(k) for k in ("file","model","width","height","duration","source_url","sha256","motion_score","bitrate")} for r in manifest]))
for offset in range(0,len(manifest),4):
 subset=manifest[offset:offset+4]
 rows=[]
 for r in subset:
  ident=Path(r["file"]).stem
  fp=src/"contact_sheets"/(ident+"_sheet.jpg")
  if not fp.exists():continue
  im=Image.open(fp).convert("RGB")
  im.thumbnail((650,700))
  row=Image.new("RGB",(690,im.height+45),"#0e0e0e")
  row.paste(im,((690-im.width)//2,44))
  d=ImageDraw.Draw(row)
  d.text((8,6),r["file"]+"   "+r["model"],fill="white")
  rows.append(row)
 if not rows:continue
 canvas=Image.new("RGB",(690,sum(z.height for z in rows)),"#101010")
 y=0
 for item in rows:canvas.paste(item,(0,y));y+=item.height
 image_data=io.BytesIO()
 canvas.save(image_data,"JPEG",quality=54,optimize=True)
 print("YUNEX_REVIEW_IMAGE:"+str(offset//4)+":"+base64.b64encode(image_data.getvalue()).decode())
