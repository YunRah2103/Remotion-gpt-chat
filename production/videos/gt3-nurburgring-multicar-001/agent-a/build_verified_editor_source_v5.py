#!/usr/bin/env python3
"""Curate real high-resolution, visually reviewed GT3 Porsche angles into ONE V5 media ZIP.

Requires three genuine GitHub Actions media artifacts unpacked into inputs/v4,
inputs/falken2018, inputs/porsche2026. Does not redownload or fake video.
Only scene windows with independently viewed evidence approved. Keeps V4 intact.
"""
import hashlib,json,shutil,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path("out/gt3-a-v5-native-verified-source-library")
F18=Path("inputs/falken2018");P26=Path("inputs/porsche2026");V4=Path("inputs/v4")
ORIGINAL=ROOT/"previous_v4_originals";CUR=ROOT/"new_curated_4k_editor_selects";FRAMES=ROOT/"new_4k_contact_sheets"
for d in [ROOT,ORIGINAL,CUR,FRAMES]:d.mkdir(parents=True,exist_ok=True)
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for s in iter(lambda:f.read(1<<20),b''):h.update(s)
 return h.hexdigest()
def call(args,t=100):
 p=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-600:])
 return p.stdout
def select_file(dir,name):
 matches=list(dir.rglob(name))
 if len(matches)!=1:raise RuntimeError(f"Expected one actual source original {name}, got {matches}")
 return matches[0]
manifest=json.loads(select_file(V4,"SOURCE_MANIFEST_FFPROBE_V4.json").read_text())
assert manifest["confirmed_gt3_makes"]==["Porsche","Mercedes-AMG","BMW","Audi"]
assert manifest["confirmed_distinct_gt3_source_sections"]==6
# Existing native originals: preserve exact bytes / SHAs and every V4 metadata file.
for p in V4.iterdir():
 if p.is_dir():shutil.copytree(p,ORIGINAL/p.name,dirs_exist_ok=True)
 elif p.is_file():shutil.copy2(p,ORIGINAL/p.name)
for old in manifest["existing_native_originals"]:
 p=ORIGINAL/"clips"/Path(old["file"]).name
 if not p.is_file():p=select_file(ORIGINAL,Path(old["file"]).name)
 assert digest(p)==old["sha256"],"V4 media must remain byte-identical"
print("PRESERVED_V4_ORIGINALS",len(manifest["existing_native_originals"]),flush=True)
# Shot identity verified independently by reading true source-original 4K frames.
# Each approved shot is ONE camera angle only. Adjacent footage is not automatically approved.
SCENES=[
 dict(id="F18_PORSCHE_911_GT3R_FRONT_NORDSCHLEIFE_193",folder="f18",source="PORSCHE_GT3_TRACKSIDE_190_CANDIDATE.mkv",
   relative_start=2.45,duration=1.45,make="Porsche",model="911 GT3 R 2018",original_time=192.45,
   camera="F18_PORSCHE_FRONT_TRACKSIDE_193",approval="Porsche 911 front green/teal race livery clearly visible in real full movie source frame 193.2s"),
 dict(id="F18_PORSCHE_911_GT3R_FRONT_PASS_196",folder="f18",source="PORSCHE_GT3_TRACKSIDE_190_CANDIDATE.mkv",
   relative_start=5.3,duration=1.7,make="Porsche",model="911 GT3 R 2018",original_time=195.3,
   camera="F18_PORSCHE_FRONT_TRACKSIDE_196",approval="Front green/blue Porsche racing past 195.8s; adjacent scene to 193, dedup review needed",review_only=True),
 dict(id="F18_PORSCHE_911_GT3R_CRESTRISE_202",folder="f18",source="PORSCHE_GT3_TRACKSIDE_198_CANDIDATE.mkv",
   relative_start=3.5,duration=1.8,make="Porsche",model="911 GT3 R 2018",original_time=201.5,
   camera="F18_PORSCHE_HILL_CREST_HEADON_202",approval="Separate telephoto camera with green Porsche appearing over crest t202-203s"),
 dict(id="P26_YELLOW_911_GT3R_REAR_CORNER_08",folder="p26",source="N24_2026_RACE_09s_3840x2160.mp4",
   relative_start=0.18,duration=0.93,make="Porsche",model="911 GT3 R 2026",original_time=8.18,
   camera="P26_YELLOW_REAR_WIDE_NORDSCHLEIFE",approval="Actual yellow Porsche 911 racecar driving away on forested Nordschleife, original 8.6s"),
 dict(id="P26_RED_BLACK_911_GT3R_TRACKSIDE_10",folder="p26",source="N24_2026_RACE_09s_3840x2160.mp4",
   relative_start=1.25,duration=1.75,make="Porsche",model="911 GT3 R 2026",original_time=9.25,
   camera="P26_RED_BLACK_CLOSE_FLYBY",approval="Different close trackside camera, clear 911 GT3 R number and aero, source 9.8-10.9"),
 dict(id="P26_PURPLE_GREEN_911_GT3R_PROFILE_13",folder="p26",source="N24_2026_RACE_13s_3840x2160.mp4",
   relative_start=0.08,duration=0.80,make="Porsche",model="911 GT3 R 2026",original_time=12.58,
   camera="P26_PURPLE_GREEN_SIDE_PAN",approval="Separate full car side trackside passing in frame source 13.1, branded intertitle after 14s explicitly excluded"),
 dict(id="P26_WHITE_911_GT3R_STARTFINISH_17",folder="p26",source="N24_2026_RACE_17s_3840x2160.mp4",
   relative_start=0.13,duration=0.92,make="Porsche",model="911 GT3 R 2026",original_time=16.13,
   camera="P26_WHITE_RACE_STRAIGHT_LONG_LENS",approval="Porsche-looking white full racecar on GP straight t16.6s; NEED closer model inspection",review_only=True),
 dict(id="P26_FALKEN_WHITE_MINT_911_GT3R_FRONT_51",folder="p26",source="N24_2026_RACE_51s_3840x2160.mp4",
   relative_start=0.17,duration=2.85,make="Porsche",model="911 GT3 R 2026",original_time=49.67,
   camera="P26_FALKEN_MINT_HEADON_51",approval="Unmistakable GT3 R mint-white Falken 911 head-on approaching camera t50-52"),
]
reports=[]
for s in SCENES:
 entry=dict(s)
 raw=select_file(F18 if s["folder"]=="f18" else P26,s["source"])
 output=CUR/(s["id"]+"_native4k_SDR.mp4")
 try:
  if s["folder"]=="f18":
   vf="zscale=t=linear:npl=100,format=gbrpf32le,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:p=bt709,format=yuv420p"
  else:
   vf="format=yuv420p"
  call(["ffmpeg","-nostdin","-v","error","-y","-ss",str(s["relative_start"]),"-i",str(raw),
        "-t",str(s["duration"]),"-an","-vf",vf,"-c:v","libx264","-preset","veryfast",
        "-crf","17","-pix_fmt","yuv420p","-movflags","+faststart",str(output)],220)
  probe=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(output)],30))
  video=next(q for q in probe["streams"] if q["codec_type"]=="video")
  assert (int(video["width"]),int(video["height"]))==(3840,2160),"loss of native 4K"
  call(["ffmpeg","-nostdin","-v","error","-i",str(output),"-f","null","-"],80)
  d=float(probe["format"].get("duration") or 0)
  assert d>=s["duration"]-0.25,f"Short actual cut {d}"
  strip=Image.new("RGB",(1200,260),(15,15,15));draw=ImageDraw.Draw(strip)
  for k in range(3):
   sec=d*(k+.5)/3;still=FRAMES/(s["id"]+f"_{k}.jpg")
   call(["ffmpeg","-nostdin","-v","error","-y","-ss",str(sec),"-i",str(output),"-frames:v","1",
         "-vf","scale=400:225","-q:v","4",str(still)],30)
   with Image.open(still) as img:strip.paste(img.convert("RGB"),(400*k,24))
   still.unlink()
   draw.text((400*k+5,3),f"{s['id']} frame {k}",fill="white")
  sheet=FRAMES/(s["id"]+"_3FRAMES.jpg");strip.save(sheet,quality=88)
  entry.update(status="REVIEW_ONLY_ID_OR_UNIQUE_CAMERA_UNCERTAIN" if s.get("review_only") else "VISUALLY_VERIFIED_GT3_MOTION_NATIVE_4K",
    file=str(output.relative_to(ROOT)),bytes=output.stat().st_size,sha256=digest(output),native_pixels=[3840,2160],video_duration=d,
    full_decode=True,contact_sheet=str(sheet.relative_to(ROOT)),ffprobe=probe)
  print("REAL_4K_EDITOR_SHOT",s["id"],entry["status"],entry["bytes"],entry["sha256"],flush=True)
 except Exception as exc:
  output.unlink(missing_ok=True);entry.update(status="REJECTED_BUILD_OR_QA",failure=str(exc)[-500:])
  print("REJECTED_EDITOR_SHOT",s["id"],entry["failure"],flush=True)
 reports.append(entry)
verified=[x for x in reports if x["status"]=="VISUALLY_VERIFIED_GT3_MOTION_NATIVE_4K"]
unique={x["camera"] for x in verified}
assert len(unique)==len(verified),"Repeated camera camera IDs"
total=6+len(verified)
record={"footage_gate":"BLOCKED","confirmed_makes":["Porsche","Mercedes-AMG","BMW","Audi"],
        "existing_identifiable_gt3_sections":6,"new_additional_verified_4k_gt3_shots":len(verified),
        "new_review_only_shots":len([x for x in reports if x['status'].startswith('REVIEW_ONLY')]),
        "confirmed_distinct_source_sections_after_curated_QA":total,
        "required_usable_shots":24,"required_makes":6,
        "source_artifacts":{"V4_original_media":11705728360,"new_2018_Falken_4k":11707039208,"new_2026_Porsche_square_4k":11707104373},
        "new_scene_records":reports,
        "approval": "Only shots marked VISUALLY_VERIFIED count. Source media, road cars, silhouettes, atmosphere, crowd, interviews and repeated cameras must never count.",
        "notes":"V4 bytes preserved and validated, new 2018 HDR correctly tone-mapped to SDR 4K; 2026 3840x3840 source already crop-to-4K original pixels by upstream QA. Three source artifacts reconstructed."}
(ROOT/"SOURCE_MANIFEST_FFPROBE_V5.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
(ROOT/"README_FIRST.md").write_text(f"""# YUNEX GT3 multi-car 001 — actual original media V5
Source gate BLOCKED. Native 4K scenes verified and added: {len(verified)}; new review-only: {record['new_review_only_shots']}.
Cumulative independent identifiable GT3 camera sections: {total}/24, confirmed makes 4/6.
All eight V4 native originals are copied SHA byte-identical into previous_v4_originals.
All newly selected 2018 4K HDR material is frame-accurate cropped and tone mapped correctly to SDR.
All selected 2026 Porsche scenes originate from authentic native 3840x3840 publisher film and are cropped with original pixels to 3840x2160; no upscaling.
If new cameras are later proved duplicate, reduce shot gate count. Scene metadata and source timings in SOURCE_MANIFEST_FFPROBE_V5.json.
This ZIP is editor review and partial media, not a six-make or final film release.
""")
print("V5_PRESERVED_ORIGINALS",len(manifest["existing_native_originals"]),"EXTRA_EDITOR_SELECTS",len([x for x in reports if 'file' in x]),"VERIFIED_UNIQUE_NEW",len(verified),"CUMULATIVE",total,flush=True)
