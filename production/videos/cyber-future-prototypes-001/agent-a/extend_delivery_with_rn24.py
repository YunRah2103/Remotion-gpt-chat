#!/usr/bin/env python3
"""Append native-pixel RN24 supplement, audit ALL baked-in bars, no fake upscaling."""
import requests, subprocess, json, csv, hashlib
from pathlib import Path
from PIL import Image, ImageDraw

root=Path("out/cyber-future-agent-a")
dest=root/"supplemental_native_1920x820";dest.mkdir(exist_ok=True)
contacts=root/"supplemental_contact_sheets";contacts.mkdir(exist_ok=True)
originals=root/"originals";originals.mkdir(exist_ok=True)
url="https://d338d8ftck8b1o.cloudfront.net/vod/FIL00000000000240802/11086494605c47e68eb2af3e0dc057c2/MP4/11086494605c47e68eb2af3e0dc057c2_1080p.mp4"
src=originals/"hyundai_rn24_n_day_2024_original_letterboxed.mp4"
def checksum(file):
 h=hashlib.sha256()
 with file.open("rb") as f:
  for block in iter(lambda:f.read(1048576),b""):h.update(block)
 return h.hexdigest()
s=requests.Session();s.headers["User-Agent"]="Mozilla/5.0 Chrome/129 Safari/537.36"
total=0
with s.get(url,stream=True,timeout=(20,90)) as r:
 r.raise_for_status()
 with src.open("wb") as f:
  for b in r.iter_content(1048576):
   if b:
    f.write(b);total+=len(b)
    if total>180000000:raise ValueError("unexpected file size")
assert checksum(src)=="3c93da6b1a21a1654bfdf318560115bcdcd8ffcc0d7bb7411031fe759a84cbcf"
print("REAL_RN24_SOURCE_DOWNLOADED",total,flush=True)
def info(p):
 data=json.loads(subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],capture_output=True,text=True,check=True,timeout=40).stdout)
 v=next(x for x in data["streams"] if x["codec_type"]=="video")
 return {"width":v["width"],"height":v["height"],"fps":v.get("avg_frame_rate"),"duration":float(data["format"]["duration"]),"video_codec":v["codec_name"],"has_audio":any(x["codec_type"]=="audio" for x in data["streams"]),"sha256":checksum(p),"bytes":p.stat().st_size}
specs=[
 ("S01_RN24_cockpit_neon",235.10,235.93,"neon interior camera move","support"),
 ("S02_RN24_neon_LED_showcase",236.12,237.47,"red cyan studio exterior camera slide","hero"),
 ("S03_RN24_hazy_silhouette",237.94,238.86,"RN24 through smoke in studio","support"),
 ("S04_RN24_side_drift",247.70,250.55,"real prototype driving sideways on proving ground","hero"),
 ("S05_RN24_rear_smoke_drift",324.91,325.75,"rear three-quarter actual car drifting","hero"),
 ("S06_RN24_fast_side",327.89,329.74,"fast real side tracking during drifting","hero"),
 ("S07_RN24_front_smoke",330.36,331.72,"real RN24 in dramatic overhead frontal smoke","hero")
]
new=[]
for id,begin,end,description,grade in specs:
 p=dest/(id+".mp4")
 args=["ffmpeg","-nostdin","-y","-v","error","-ss",str(begin),"-i",str(src),"-t",str(round(end-begin,3)),"-map","0:v:0","-map","0:a?","-vf","crop=1920:820:0:130","-c:v","libx264","-crf","15","-preset","medium","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart",str(p)]
 z=subprocess.run(args,capture_output=True,text=True,timeout=120)
 if z.returncode:raise RuntimeError(z.stderr[-700:])
 meta=info(p); assert(meta["width"],meta["height"])==(1920,820)
 subprocess.run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(p),"-f","null","-"],capture_output=True,text=True,check=True,timeout=90)
 frames=[]
 for n,fraction in enumerate((.16,.38,.62,.84)):
  jpg=contacts/(id+"_sample"+str(n)+".jpg")
  subprocess.run(["ffmpeg","-nostdin","-y","-v","error","-ss",str(meta["duration"]*fraction),"-i",str(p),"-frames:v","1","-vf","scale=640:-2",str(jpg)],check=True,timeout=30)
  with Image.open(jpg) as img:frames.append(img.convert("RGB").copy())
 size=frames[0].size
 sheet=Image.new("RGB",(1280,2*size[1]+44),"black")
 for n,img in enumerate(frames):sheet.paste(img,((n%2)*640,(n//2)*size[1]))
 ImageDraw.Draw(sheet).text((10,sheet.height-25),id+" | true picture 1920x820 | "+grade,fill="white")
 sheet.save(contacts/(id+"_contact.jpg"),quality=90)
 ent={"file":"supplemental_native_1920x820/"+p.name,"shot_id":id,"model":"Hyundai RN24","source_url":url,"publisher":"Hyundai Motor Group","source_begin_seconds":begin,"source_end_seconds":end,"description":description,"editor_grade":grade,"physically_real":True,"status":"SUPPLEMENT_ONLY_FAILS_STRICT_NATIVE_1080_HEIGHT","active_image_width":1920,"active_image_height":820,"original_container":"1920x1080 with 130px black top and bottom","edit":"crop to native pixels only, no upscale",**meta}
 new.append(ent);print("VERIFIED_SUPPLEMENT",id,meta["duration"],meta["sha256"],flush=True)
old=json.loads((root/"curated_manifest.json").read_text())
assert len(old["actual_clips"])==9
for item in old["actual_clips"]:
 item["active_image_width"]=1920;item["active_image_height"]=796
 item["letterbox_pixels_top_bottom"]=142
 item["strict_native_full_bleed_1080_pass"]=False
 item["quality_note"]="coded 1080 height but 796 native picture pixels"
old["gate"]="FAIL STRICT NATIVE FULL-BLEED HD due to baked bars"
(root/"curated_manifest.json").write_text(json.dumps(old,indent=2))
rejection=json.loads((root/"rejections.json").read_text())
rejection.append({"issue":"NATIVE_ACTIVE_PIXEL_LIMIT","impact":"all 9 original 1080p-encoded clips contain baked bars; true 1920x796 picture; fails 1920x1080 active minimum"})
rejection.append({"issue":"NATIVE_ACTIVE_PIXEL_LIMIT","impact":"RN24 original 1920x1080 encoded but true 1920x820 picture; 7 native-cropped supplemental clips deliberately below 1080 height"})
(root/"rejections.json").write_text(json.dumps(rejection,indent=2))
full={"gate":"BLOCKED_STRICT_NATIVE_1080P_ACTIVE_HEIGHT","verified_original_source_count":2,"verified_real_physical_models":["Hyundai RN22e","Hyundai N Vision 74","Hyundai RN24"],"main_clips_count":9,"RN24_native_cropped_supplement_count":7,"reason":"All sources letterboxed; encoded 1920x1080 != active 1920x1080. NO clips pass strict full-bleed native 1080 height. High resolution alternative 4K endpoints unavailable.","original_source_1_sha":"6f0bbcd21ef3dbdd1c12049bee3c838274d651477abb6bf08ca9aca1cc0b0c2a","original_source_2_sha":checksum(src),"reuse_rights":"Publication/redistribution permission not verified.","old_main_clips":old["actual_clips"],"supplemental_real_RN24_clips":new}
(root/"manifest.json").write_text(json.dumps(full,indent=2))
fields=["file","shot_id","model","editor_grade","active_image_width","active_image_height","status","sha256","source_url"]
with (root/"manifest.csv").open("w",newline="") as f:
 writer=csv.DictWriter(f,fields);writer.writeheader()
 for item in old["actual_clips"]:
  row={"file":item["clip_file"],"shot_id":item["shot_id"],"model":item["model"],"editor_grade":"hero" if item["shot_id"] in ("A01_RN22e_front_tracking","A03_RN22e_drifting_rear","A04_RN22e_pitlane_flyby","A07_NVision74_sunset_follow") else "backup","active_image_width":1920,"active_image_height":796,"status":"ENCODED_1080_BUT_LETTERBOXED","sha256":item["sha256"],"source_url":item["source_url"]}
  writer.writerow(row)
 for item in new:writer.writerow({k:item.get(k,"") for k in fields})
report="""# Agent A correct quality gate: BLOCKED strict active-pixel native 1080p

There are ACTUAL playable clips and two first-party original video files, with three physical running laboratory vehicles and sixteen independently selected camera setups, but none of the originals comply with the strict full-bleed active picture 1080p condition.

## Critical accuracy correction
- Hyundai 2022 N Vision 74 & RN22e performance source **encodes at 1920x1080**, but has 142px burned-in top and bottom borders. Actual source picture **1920x796**. Prior report incorrectly equated codec container height with original active-image height.
- Hyundai N Day 2024 RN24 source **encodes at 1920x1080**, but has 130px burned-in top and bottom borders. Actual source picture **1920x820**.
- 7 new supplementary RN24 clips in supplemental_native_1920x820/ are **native cropped, no upscaling**, thus genuinely 1920x820 rather than falsely labelled HD. The old nine RN22e/N74 cuts remain under clips/.
- RN24 cinema footage 3:45-4:10 studio includes animated CGI wireframe and overlays; excluded. Separate IONIQ5N and WRC rally cars in parent documentary are excluded.
- Best RN24 candidate shots S02 red/cyan lights, S04 proving-ground sideslip, S05 smoke rear, S06 fast side, S07 front drifting smoke. S01 cockpit and S03 haze are support.
- Native source originals and their checksums are preserved. All cuts FFprobe + full-decode verified and accompanied by true frame contact images.
- Different camera angles = 16 handles; that does not imply 16 strong 2-5s heroes. All 16 are genuine photographed physical cars; license/reuse permission not certified.
- HMG 4K media links were tested: public _1080p MP4 worked; _2160p / _4k / _1440p HTTP 403. A widget labelling video 4K does not prove availability of a higher original.
- No editor/audio mix completed; true 1920x1080 full-bleed gate BLOCKED, despite technical/creative usable footage. Further acquisition of actual ≥1920x1080 ACTIVE frames needed to comply, or the director must explicitly approve an exception.
"""
(root/"QUALITY_REPORT.md").write_text(report)
(root/"README_START_HERE.md").write_text("REAL Hyundai 2022 RN22e/N Vision74 nine clips in clips/. NEW seven RN24 REAL clips in supplemental_native_1920x820/. Two original manufacturer MP4s in originals/. Read QUALITY_REPORT.md FIRST: hard native 1080p full-bleed source gate BLOCKED due baked bars. None of this was faked or upscaled. Contact images+source SHA+media metadata available. Source usage rights unverified.\n")
print("FINAL_COUNTS",len(old["actual_clips"]),len(new),"HARD_GATE",full["gate"],flush=True)
