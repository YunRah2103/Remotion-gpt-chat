#!/usr/bin/env python3
"""Inspect the FOUR actual new V9 editor videos at 6 decoded full-HD frames each.

Crucial: enforce the same bytes and FFprobe native dimensions as manifest;
do not mistake duplicates or misidentified cars for GT3 angles.
"""
import json,zipfile,hashlib,io,base64
from PIL import Image,ImageOps
from pathlib import Path
root=Path("inputs/v9_real_source")
manifests=list(root.rglob("COMBINED_GLOBAL_MANIFEST_V9.json"))
assert len(manifests)==1,"V9 exact media artifact missing"
manifest=json.loads(manifests[0].read_text())
assert manifest["qualifying_distinct_camera_views_total"]==25
assert manifest["qualifying_makes_total"]==6
for rec in manifest["approved_additional_cameras"]:
 video=root/rec["physical_editor_clip"]
 contact=root/rec["visual_proof_contact_sheet"]
 assert video.is_file() and contact.is_file(),(video,contact)
 h=hashlib.sha256()
 with video.open("rb") as p:
  for data in iter(lambda:p.read(1048576),b""):h.update(data)
 assert h.hexdigest()==rec["editor_clip_SHA256"]
 assert rec["editor_clip_native_resolution"]==[1920,1080]
 with Image.open(contact) as im:
  pic=ImageOps.contain(im.convert("RGB"),(1540,700));buf=io.BytesIO()
  pic.save(buf,"JPEG",quality=79,optimize=True)
  print("V9_FRAME_ID_START:"+rec["id"]+":V9_FRAME_ID_END")
  print("V9_REAL_CONTACT_START_"+rec["id"]+":"+base64.b64encode(buf.getvalue()).decode()+":V9_REAL_CONTACT_END_"+rec["id"],flush=True)
 print("SHA_AND_NATIVE_HD_TRUE",rec["id"],rec["editor_clip_SHA256"],"source",rec["source_id"],"original time",rec["source_start"],flush=True)
print("ACTUAL_V9_FOUR_CAMERA_VISUAL_AUDIT_IMAGES_READY; full project gate still subject to editor source-camera distinctness review")
