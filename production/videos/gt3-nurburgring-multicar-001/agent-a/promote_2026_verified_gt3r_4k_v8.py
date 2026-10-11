#!/usr/bin/env python3
"""V8: integrate 2 *already downloaded* and independently model-identified original GT3 R 4K race shots.

One full physical video library artifact. All existing V7 original content is byte copied,
V7 scene count stays immutable. Actual new UHD originals are SHA checked, ffprobed,
full-decoded and additionally copied to an obvious editor folder. Camera count +2 only.
"""
from pathlib import Path
import json,subprocess,hashlib,shutil
ORIG=Path("inputs/v7-real-physical-media")
OUT=Path("out/gt3-multicar-native-real-v8-21-approved-cameras")
COPY=OUT/"EXACT_UNMODIFIED_V7_ORIGINAL_VIDEO_BYTES"
APPROVED=OUT/"NEW_EDITOR_APPROVED_4K_PORSCHE_GT3R_CAMERAS"
for p in (OUT,COPY,APPROVED):p.mkdir(parents=True,exist_ok=True)
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for blk in iter(lambda:f.read(1024*1024),b''):h.update(blk)
 return h.hexdigest()
def unique(root,name):
 hits=list(root.rglob(name))
 if len(hits)!=1:raise RuntimeError("Expected one "+name+", found "+str(hits))
 return hits[0]
def command(args,t=95):
 p=subprocess.run(args,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-650:])
 return p.stdout
v7file=unique(ORIG,"COMBINED_GLOBAL_MANIFEST_V7.json")
data=json.loads(v7file.read_text())
assert data["confirmed_native_landscape_gt3_makes"]==5,data
assert data["confirmed_distinct_native_landscape_gt3_camera_views"]==19,data
assert data["primary_gate"]=="BLOCKED"
# preserve 484 MB original source tree under V8 for reproducible SHA and independence
for file in ORIG.iterdir():
 if file.is_dir():shutil.copytree(file,COPY/file.name,dirs_exist_ok=True)
 elif file.is_file():shutil.copy2(file,COPY/file.name)
assert digest(COPY/"COMBINED_GLOBAL_MANIFEST_V7.json")==digest(v7file)
print("COMPLETE_PREVIOUS_NATIVE_V7_MEDIA_PRESERVED",digest(v7file),flush=True)
originals={
 "2026_PORSCHE_GT3R_LIONSPEED24_NATIVE_UHD_REAR_T45":{
   "filename":"PORSCHE_2026_CAREFULLY_REVIEW_MINT_WHITE_REAR_BEND_4k.mp4",
   "expected_sha256":"7dc0dc2f2ae848ee9bfb23d4058d460c02ed78a9ea7c4dc96f3fb334743a18fa",
   "original_film_t_s":[44.7,47.05],
   "entry_no":24,"model":"Porsche 911 GT3 R (992) Evo26","team":"PK Motorsport - Lionspeed GP","class":"SP9 Pro",
   "camera":"rear three-quarter bend/trackside",
   "manufacturer_livery_evidence":"mint-white green nose and purple mirrors/wing, #24 Lionspeed",
   "independent_official_entry_list":"https://racing.porsche.com/articles/24hours-nuerburgring-2026-porsche-entrylist",
   "independent_photo":"https://motorsportmodelshop.co.uk/cdn/shop/files/SG1056.webp?crop=center&height=1200&v=1782666032&width=1200",
 },
 "2026_PORSCHE_GT3R_GOROYAN4_NATIVE_UHD_TRACKSIDE_SIDE_T43":{
   "filename":"PORSCHE_2026_CAREFULLY_REVIEW_PURPLE_PROFILE_4k.mp4",
   "expected_sha256":"713145b18303d002c6f1bacd0dba364e0a9871223f2fc1c27d906261fb35772a",
   "original_film_t_s":[43.35,44.50],
   "entry_no":4,"model":"Porsche 911 GT3 R (992) Evo26","team":"Goroyan RT by Car Collection","class":"SP9 Pro-Am",
   "camera":"fast side pan/flyby",
   "manufacturer_livery_evidence":"blue red orange painted Porsche, white race number 4 on door",
   "independent_official_entry_list":"https://racing.porsche.com/articles/24hours-nuerburgring-2026-porsche-entrylist",
   "independent_photo":"https://www.endurance-info.com/sites/default/files/styles/image_richtext/public/2026-03/cc2026_24nbr_final_8.png?itok=3y52I98r"
 }
}
approved=[]
for key,record in originals.items():
 path=unique(COPY,record["filename"])
 assert digest(path)==record["expected_sha256"],"Original video changed "+key
 info=json.loads(command(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],50))
 v=next(x for x in info["streams"] if x["codec_type"]=="video")
 assert (int(v["width"]),int(v["height"]))==(3840,2160),key
 assert v["codec_name"]=="h264"
 command(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(path),"-f","null","-"],90)
 dst=APPROVED/(key+".mp4")
 shutil.copy2(path,dst)
 assert digest(dst)==record["expected_sha256"],key
 original_contact=unique(COPY,record["filename"].replace("_4k.mp4","_3FRAME.jpg"))
 dstcontact=APPROVED/(key+"_three_real_source_frames.jpg")
 shutil.copy2(original_contact,dstcontact)
 record.update({"id":key,"approved":True,
   "original_unmodified_v7_media_path":str(path.relative_to(OUT)),
   "editor_ready_approved_video_path":str(dst.relative_to(OUT)),
   "source_exact_reused_video_same_camera_not_new_third_camera":True,
   "source_proof_three_frames":str(dstcontact.relative_to(OUT)),
   "approved_original_physical_video_sha256":digest(dst),
   "native_pixels":[3840,2160],
   "full_decode":"PASS",
   "physical_bytes":dst.stat().st_size})
 approved.append(record)
 print("V8_NEW_PHYSICALLY_RECHECKED_INDEPENDENT_PORSCHE_GT3_R",key,record["physical_bytes"],record["approved_original_physical_video_sha256"],flush=True)
assert len(approved)==2
left=unique(COPY,"PORSCHE_2026_CAREFULLY_REVIEW_WHITE_REAR_4k.mp4")
assert digest(left)=="1129e56f2d8aa792e6d6e1a46eb8e08646504049ec4d722e7c91fe18c4"
summary={
 "project":"YUNEX GT3 Multi-Car 001",
 "version":"V8 new independent positive GT3R entry-list and native-UHD video contact-frame proof",
 "gate":"BLOCKED_NEED_ONE_NEW_MAKE_AND_THREE_DISTINCT_CAMERA_ANGLES",
 "v7_action_media_artifact":11708835981,
 "v7_manifest_sha256":digest(COPY/"COMBINED_GLOBAL_MANIFEST_V7.json"),
 "v7_all_original_video_bytes_preserved":True,
 "confirmed_landscape_makes":data["confirmed_native_landscape_gt3_makes"],
 "landscape_confirmed_makes_count":5,"landscape_required_makes_count":6,
 "confirmed_landscape_gt3_camera_angles_before_v8":19,
 "new_independently_verified_gt3r_camera_angles":2,
 "confirmed_landscape_gt3_camera_angles_v8":21,
 "landscape_required_camera_angles":24,
 "approved_new_cameras":approved,
 "producer_original_url":"https://newstv.porsche.com/porschevideos/newstv.porsche.com_334111_en.mp4",
 "producer_original_sha256":"0da8d5961152aa7e520873c26318c35ce1851a1eed5a2bebdcfff74f9cdbb10f",
 "source_racing_timeline": "2026 24 Hours Nürburgring official Porsche 60-car event film",
 "still_rejected_third_4k_porsche_class_unverified_original_sha256":digest(left),
 "still_rejected_lamborghini_portrait_for_landscape":True,
 "make_counts_unchanged_and_no_duplicates_in_21":True,
 "no_upscaled_or_simulator_shots":True,
 "full_4k_source_decoded_byte_exact_shas":True,
 "caveat":"Two new videos copied into editor folder for use; these are duplicates of the same exact original clips in preserved V7; each counts only one new distinct camera angle."
}
(OUT/"COMBINED_GLOBAL_MANIFEST_V8.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n")
(OUT/"README_FIRST_V8.md").write_text("""# YUNEX GT3 MULTI-CAR — real media V8, updated independent source identity

**LANDSCAPE GT3 GATE STILL BLOCKED — 5/6 manufacturers and 21/24 approved distinct GT3 camera views.** This ONE source package physically includes and preserves byte-for-byte the prior 484MB V7 source video library and every frame manifest.

Independently promoted into NEW_EDITOR_APPROVED_4K_PORSCHE_GT3R_CAMERAS/: TWO exact original 3840×2160 full-decode/FFprobe/SHA-approved races:
* Lionspeed GP number 24 Porsche 911 GT3 R (992) Evo26, source t44.7–47.05, rear bend camera, mint-white and purple mirrors.
* Goroyan RT by Car Collection number 4 Porsche 911 GT3 R (992) Evo26, source t43.35–44.50, distinct blue-red-orange side pan camera.
Official Porsche 2026 N24 SP9 entry list and independently matched producer/source frame proofs: see V8 manifest and accompanying QA report commit.

Two copies exist per GT3 angle (original preserved V7 + editor-ready in the new approval folder); **do not count twice**. All V7 original videos and hashes unchanged.
2026 white/blue rear Porsche source clip remains CLASS UNCONFIRMED / REVIEW ONLY.
ABT Red Bull Huracán GT3 original 1080x1920 with burned text is PORTRAIT REVIEW ONLY, not 1920x1080 landscape.
To complete full landscape acquisition: one new confirmed make (Lamborghini native landscape, or Ferrari/McLaren) plus 3 independent camera scenes. No final montage or soundtrack claimed here.
""")
print("V8_PHYSICAL_MEDIA_PACKAGE_READY_5_MAKES_21_GT3_NATIVE_UHD_CAMERAS_GATE_BLOCKED",flush=True)
