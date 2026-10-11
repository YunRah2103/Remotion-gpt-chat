#!/usr/bin/env python3
"""Emit a resized base64 JPEG from actual downloaded original video evidence for independent in-chat image review."""
from pathlib import Path
from PIL import Image,ImageOps
import zipfile,io,base64,hashlib,json
input_dir=Path("inputs/lamborghini_actual")
archives=list(input_dir.rglob("*.zip"))
assert archives,"No downloaded real Lamborghini media archive"
for archive in archives:
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  names=z.namelist()
  if "SOURCE_MANIFEST.json" not in names:continue
  item=json.loads(z.read("SOURCE_MANIFEST.json"))
  assert item["native_resolution"]==[1080,1920],item.get('status')
  assert item["status"].startswith("ACTUAL_1080_NATIVE"),item.get('status')
  assert hashlib.sha256(z.read(item["original_file"])).hexdigest()==item["sha256"]
  data=z.read(item["frame_contact_sheet"])
  with Image.open(io.BytesIO(data)) as full:
   print("ORIGINAL_20_FRAME_CONTACT_PIXELS",full.size,"SHA",item["sha256"],flush=True)
   reduced=ImageOps.contain(full.convert("RGB"),(900,1400))
   buf=io.BytesIO()
   reduced.save(buf,format="JPEG",quality=74,optimize=True)
   b64=base64.b64encode(buf.getvalue()).decode("ascii")
   print("FRAME_PROOF_JPEG_BASE64_START:"+b64+":FRAME_PROOF_JPEG_BASE64_END",flush=True)
   print("FRAME_PROOF_IMAGE_BYTES",len(buf.getvalue()),"FRAME_COUNT",20,flush=True)
  break
else:raise RuntimeError("No SHA-verifiable actual video + frame proof in artifact")
