#!/usr/bin/env python3
"""Visual independent QA of actual, physically acquired HRT 1080p original videos.
Read physical ZIP CRC and each real video SHA; show contact frame proofs.
No identity credit until manual model and Nürburgring action verification.
"""
from pathlib import Path
from PIL import Image,ImageOps
import zipfile,json,hashlib,io,base64
ROOT=Path("inputs/hrt_actual_origin")
ZIP=next(ROOT.rglob("GT3_A_HRT_GT3_BROWSER_ORIGINALS_AND_QA.zip"))
with zipfile.ZipFile(ZIP) as z:
 assert z.testzip() is None
 j=json.loads(z.read("SOURCE_MANIFEST.json"))
 print("HRT_ACTUAL_NATIVE_HD_MEDIA_COUNT",j["native_hd_media_file_count"],flush=True)
 for it in j["sources"]:
  print("SOURCE_INFO",it["source_id"],it["status"],"native:",it.get("resolution"),"duration:",it.get("duration"),
    "original_media_page:",it["publisher_page"],
    "observed_video_network_endpoints:",len(it.get("detected_media_links",[])),flush=True)
  if it.get("status")!="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING":continue
  name=it["file"]
  sha=hashlib.sha256(z.read(name)).hexdigest()
  assert sha==it["sha256"]
  assert it["resolution"]==[1920,1080]
  print("PHYSICALLY_VERIFIED_VIDEO",it["source_id"],it["bytes"],sha,flush=True)
  proof=it["contact_sheet"]
  with Image.open(io.BytesIO(z.read(proof))) as im:
   canvas=ImageOps.contain(im.convert("RGB"),(1200,800))
   out=io.BytesIO();canvas.save(out,format="JPEG",quality=84,optimize=True)
   token=base64.b64encode(out.getvalue()).decode("ascii")
   print("HRT_SOURCE_"+it["source_id"]+"_BASE64_START:"+token+":HRT_SOURCE_"+it["source_id"]+"_BASE64_END",flush=True)
print("ALL_REAL_MEDIA_SHA_CRC_VERIFIED",flush=True)
