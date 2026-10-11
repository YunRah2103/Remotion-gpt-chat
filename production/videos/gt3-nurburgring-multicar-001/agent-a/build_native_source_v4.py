#!/usr/bin/env python3
"""Build a single *actual media* V4 ZIP from previously verified V3, new
publisher portrait sources and independently confirmed 2018 Audi GT3 cut.

Existing V3 originals are preserved byte-for-byte and SHA checked.
Native 1080x1920 portrait sources stay UNAPPROVED for 16:9 landscape.
"""
import hashlib,json,shutil,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path("out/gt3-a-native-partial-v4")
SRC=Path("inputs/v3")
NEW=Path("inputs/second-wave")
assert (SRC/"SOURCE_MANIFEST_FFPROBE.json").exists(), "Expected actual V3 original files/manifest"
OLD=json.loads((SRC/"SOURCE_MANIFEST_FFPROBE.json").read_text())
assert len(OLD["sources"])==8
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
for it in OLD["sources"]:
 p=SRC/it["file"]
 assert p.is_file(),str(p)
 assert sha(p)==it["sha256"],"Existing original changed "+it["file"]
 print("PRESERVED_ORIGINAL",it["file"],it["sha256"],flush=True)
(ROOT/"clips").mkdir(parents=True,exist_ok=True)
(ROOT/"contact_sheets").mkdir(parents=True,exist_ok=True)
(ROOT/"review_only_portrait").mkdir(parents=True,exist_ok=True)
(ROOT/"approved_editor_trims").mkdir(parents=True,exist_ok=True)
for p in (SRC/"clips").iterdir():
 if p.is_file():shutil.copy2(p,ROOT/"clips"/p.name)
for p in (SRC/"contact_sheets").iterdir():
 if p.is_file():shutil.copy2(p,ROOT/"contact_sheets"/p.name)
(ROOT/"SOURCE_MANIFEST_FFPROBE_V3_ORIGINAL.json").write_text(json.dumps(OLD,indent=2,ensure_ascii=False)+"\n")
aud=ROOT/"clips"/"AUDI_2018_N24_REVIEW_1080.mp4"
assert aud.is_file() and sha(aud)=="53818cf233d04e0ecf354925131b38362015d1338cff9799e1f02680feaff2f0"
cut=ROOT/"approved_editor_trims"/"AUDI_R8_LMS_GT3_2018_N24_T35_1080.mp4"
cmd=["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y","-ss","34.65","-i",str(aud),"-t","1.8","-an","-c:v","libx264","-preset","fast","-crf","17","-pix_fmt","yuv420p",str(cut)]
subprocess.run(cmd,check=True,timeout=80)
audprobe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(cut)]))
v=next(s for s in audprobe["streams"] if s["codec_type"]=="video")
assert (v["width"],v["height"])==(1920,1080)
subprocess.run(["ffmpeg","-v","error","-nostdin","-i",str(cut),"-f","null","-"],check=True,timeout=20)
canvas=Image.new("RGB",(960,400),(5,5,5));d=ImageDraw.Draw(canvas)
for k,ts in enumerate((35.00,35.2,35.46)):
 still=ROOT/"contact_sheets"/("AUDI_R8_LMS_GT3_IDENTITY_"+str(k)+".png")
 subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-ss",str(ts),"-i",str(aud),"-frames:v","1",str(still)],check=True,timeout=20)
 with Image.open(still) as img:
  scaled=img.convert("RGB").resize((320,180))
  canvas.paste(scaled,(k*320,28))
 d.text((k*320+4,5),f'AUDI ORIGINAL t={ts}s',fill="white")
canvas.save(ROOT/"contact_sheets"/"AUDI_R8_LMS_IDENTIFICATION_3FRAMES.jpg",quality=90)
print("APPROVED_AUDI_1080_GT3_CUT",cut.stat().st_size,sha(cut),flush=True)
review_specs=[
 ("PRODUCER_07_case-fpv.mp4","NBR_TV_NLS_FPV_GT3_FIELD_PORTRAIT_REVIEW.mp4","2f4344a8c69b4a40a1bb3769589d32248f880a2d3d329065b25a223d68dfb3f7","NLS FPV real GT3 field, Red Bull/Wuerth car make unknown"),
 ("PRODUCER_23_case-mustang.mp4","NBR_TV_FORD_MUSTANG_GT3_NORDSCHLEIFE_PORTRAIT_REVIEW.mp4","b0f39277af7ef736e86f478c3a9e620412d93748349873dfb0ab74cc74e0fa48","Official Ford Mustang GT3 first Nürburgring rollout, not race action all video"),
]
reviews=[]
for original,rename,expected,note in review_specs:
 source=NEW/"original_hd_pending_model_qa"/original
 assert source.is_file(),source
 assert sha(source)==expected,"Publisher media SHA mismatch"
 target=ROOT/"review_only_portrait"/rename
 shutil.copy2(source,target)
 ff=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(target)]))
 v=next(x for x in ff["streams"] if x["codec_type"]=="video")
 assert (v["width"],v["height"])==(1080,1920),"Review native portrait source different dimensions"
 subprocess.run(["ffmpeg","-v","error","-nostdin","-i",str(target),"-f","null","-"],check=True,timeout=70)
 sheet_src=NEW/"contact_sheets"/(original.replace(".mp4","_9frame.jpg"))
 assert sheet_src.exists(),sheet_src
 shutil.copy2(sheet_src,ROOT/"contact_sheets"/sheet_src.name)
 reviews.append({"file":str(target.relative_to(ROOT)),"url":"https://nbrtv-website.fsn1.your-objectstorage.com/media/"+original.replace("PRODUCER_07_","").replace("PRODUCER_23_",""),"sha256":sha(target),"status":"NATIVE_1080x1920_REVIEW_ONLY_NOT_NATIVE_LANDSCAPE_NO_CROP_APPROVED","manufacturer_claim":note,"ffprobe":ff})
 assert reviews[-1]["url"].endswith(("case-fpv.mp4","case-mustang.mp4"))
manifest={"footage_gate":"BLOCKED",
 "confirmed_gt3_makes":["Porsche","Mercedes-AMG","BMW","Audi"],
 "confirmed_distinct_gt3_source_sections":6,
 "required_distinct_shots":24,"required_makes":6,
 "existing_v3_actual_native_originals_sha_verified":len(OLD["sources"]),
 "existing_native_originals":OLD["sources"],
 "new_independently_model_verified_audi_shot":{
  "make":"Audi","model":"R8 LMS GT3 (2018 pre-evo II), MONTAPLAST / Land Motorsport",
  "source_file":"clips/AUDI_2018_N24_REVIEW_1080.mp4",
  "original_film_sha256":sha(aud),
  "original_url":"https://player.vimeo.com/video/277958760?app_id=122963",
  "source_time_seconds":[34.65,36.45],"preferred_identity_frame_seconds":35.2,
  "camera_id":"AUDI_2018_N24_TRACKSIDE_FRONT_T35_A",
  "approved_cut_file":str(cut.relative_to(ROOT)),"approved_cut_sha256":sha(cut),"cut_ffprobe":audprobe,
  "native_pixels":[1920,1080],
  "model_verification":"Actual decoded full-HD on-track recognizable Audi R8 LMS GT3 front at source 35.2s; publisher film is Audi Sport 2018 N24",
  "unique_new_identifiable_on_track_section":1,
  "note":"Do not count other blurred night car angles, which remain unverified"},
 "new_native_portrait_originals_not_approved_for_1080_landscape":reviews,
 "source_exclusions":"Second-wave non-race, wrong circuit, corporate, hotel, merchandising, roadcars, and sub-HD sources not repackaged; full audit in agent-a/AUDI_IDENTITY_AND_NBRTV_V4_QA_2026-10-11.md",
 "editor_notice":"Only 6 qualified identified source sections. Do not treat the ten source originals as ten qualified racing clips. Portrait originals cannot provide full-res 16:9 crop.",
}
(ROOT/"SOURCE_MANIFEST_FFPROBE_V4.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
(ROOT/"README_FIRST.md").write_text("""# YUNEX GT3 MULTI-CAR — Agent A actual native partial V4
Gate A: **BLOCKED**. 4/6 confirmed GT3 manufacturers, 6/24 distinct identified on-track racing source sections.
This is a single real-media bundle; not footage Gate PASS. All eight V3 original files are preserved byte-for-byte after SHA check.
NEW fourth make: Audi R8 LMS GT3 **2018 pre-evo II** in existing Audi producer source, original t~35.2s. A native-HD 1.8s real extract is under approved_editor_trims/ with its true SHA and 3-frame proof.
NEW publisher original GT3 field FPV video and Ford Mustang GT3 first rollout are native 1080x1920 portraits, **REVIEW ONLY**, NOT approved for landscape edit. Their inclusion does not increase the 24 qualified landscape shot count.
No synthetic shots, no upscaled 720p. Review full JSON manifest before transferring to B/C/D.
""")
print("BUNDLE_COMPLETE_REAL_ORIGINALS",len(OLD["sources"])+len(reviews),"CONFIRMED_GT3_MAKES_4","SECTIONS_6",flush=True)
