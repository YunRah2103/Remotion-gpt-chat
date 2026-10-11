#!/usr/bin/env python3
"""Present 5 actual SHA-proved HRT Ford source 8-frame contact sheets for visual approval."""
import json,zipfile,hashlib,io,base64
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
ROOT=Path("inputs/hrt_gt3_actual_zip")
archives=list(ROOT.rglob("*.zip"))
assert len(archives)==1,f"One source ZIP expected, got {archives}"
z=zipfile.ZipFile(archives[0])
assert z.testzip() is None
manifest=json.loads(z.read("SOURCE_MANIFEST.json"))
assert manifest["native_hd_media_file_count"]==5
verified=[]
board=Image.new("RGB",(1200,5*310),(10,10,10))
draw=ImageDraw.Draw(board)
for index,r in enumerate(manifest["sources"]):
 if r.get("status")!="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING":continue
 actual=z.read(r["file"])
 assert hashlib.sha256(actual).hexdigest()==r["sha256"],r["source_id"]
 assert r["resolution"]==[1920,1080],r["source_id"]
 proof=z.read(r["contact_sheet"])
 with Image.open(io.BytesIO(proof)) as im:
  # Original playwright script emits 1200x550, 8 frames; shrink to a 1200x278 8frame 4-col mosaic
  src=im.convert("RGB")
  row=ImageOps.fit(src,(1200,275),method=Image.Resampling.LANCZOS,centering=(.5,.5))
  board.paste(row,(0,index*310+28))
 draw.text((12,index*310+5),f"{r['source_id']}   {r['resolution'][0]}x{r['resolution'][1]}   {r['bytes']:,} bytes",fill=(245,245,245))
 verified.append({"source":r["source_id"],"video_bytes":r["bytes"],"sha256":r["sha256"],"duration":r.get("duration"),
   "publisher_page":r.get("publisher_page"),"file":r["file"],"contact_sheet":r["contact_sheet"],"provenance_valid":True})
 assert len(actual)>300000
assert len(verified)==5
output=Path("out/gt3-a-hrt-5-native-film-contact-qa")
output.mkdir(parents=True,exist_ok=True)
picture=output/"FIVE_REAL_1080_HRT_GT3_FILMS_40_FRAMES.jpg"
board.save(picture,quality=91,optimize=True)
buf=io.BytesIO()
ImageOps.contain(board,(1200,1550)).save(buf,format="JPEG",quality=76,optimize=True)
print("HRT_FORD_5_ORIGINAL_MOVIES_TRUE_SHA_AND_1080_NATIVE_CONFIRMED")
print("VISUAL_FIVE_FILMS_BASE64_START:"+base64.b64encode(buf.getvalue()).decode("ascii")+":VISUAL_FIVE_FILMS_BASE64_END",flush=True)
(output/"SOURCE_VISUAL_REVIEW.json").write_text(json.dumps({"true_video_bytes_verified":5,"source_originals":verified,
    "gt3_ford_racing_scene_credit":0,"note":"Eight source frames per real HD film. Independent racing class, car model, Nürburgring and different camera check required before quota increase."},indent=2)+"\n")
