#!/usr/bin/env python3
"""Deliver V7: byte-preserved V6 real five-make footage plus actual new Lamborghini
native-portrait source and three genuine original UHD Porsche racing review clips.
No false sixth landscape make; no false increase in camera count.
"""
import hashlib,json,zipfile,shutil,subprocess
from pathlib import Path
ROOT=Path("out/gt3-multicar-real-native-v7-plus-review")
V6=Path("inputs/verified_v6")
LAM=Path("inputs/real_lambo_portrait")
EXTRA=Path("inputs/porsche_additional_native4k")
V6DEST=ROOT/"native_landscape_v6_five_makes_19_approved"
LDEST=ROOT/"extra_2026_lamborghini_native_portrait_REVIEW_ONLY"
EDEST=ROOT/"extra_2026_porsche_4k_race_cuts_REVIEW_ONLY"
for p in [ROOT,V6DEST,LDEST,EDEST]:p.mkdir(parents=True,exist_ok=True)
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1024*1024),b''):h.update(c)
 return h.hexdigest()
def locate(root,name):
 files=list(root.rglob(name))
 if len(files)!=1:raise RuntimeError(f"Expected exactly 1 {name} in {root}, got {len(files)}")
 return files[0]
def unpack_validated(root,expected_manifest,target):
 zips=list(root.rglob("*.zip"))
 assert len(zips)==1,(root,zips)
 inner=zips[0]
 with zipfile.ZipFile(inner) as z:
  assert z.testzip() is None
  for name in z.namelist():
   p=Path(name)
   assert not p.is_absolute() and ".." not in p.parts,(inner,name)
  assert expected_manifest in z.namelist(),(inner,expected_manifest)
  z.extractall(target)
 print("SOURCE_ZIP_CRC_OK",inner,inner.stat().st_size,flush=True)
 return target/expected_manifest
# V6 Actions artifact is a real original media folder, not a synthetic metadata-only ZIP
vf=locate(V6,"COMBINED_GLOBAL_MANIFEST_V6.json")
v6=json.loads(vf.read_text())
assert v6["makes_verified"]==5 and v6["distinct_source_camera_sections_verified"]==19
assert v6["media_gate"]=="BLOCKED_NOT_FULL_SIX_MAKE_OR_24_SHOTS"
for p in V6.iterdir():
 if p.is_dir():shutil.copytree(p,V6DEST/p.name,dirs_exist_ok=True)
 else:shutil.copy2(p,V6DEST/p.name)
assert sha(V6DEST/"COMBINED_GLOBAL_MANIFEST_V6.json")==sha(vf)
# Verify original V6 core media present, unchanged source hash
v5=locate(V6DEST,"SOURCE_MANIFEST_FFPROBE_V5.json")
old=json.loads(v5.read_text())
assert len(old['confirmed_makes'])==4 and old['new_additional_verified_4k_gt3_shots']==6
for x in old['new_scene_records']:
 if 'file' in x:
  p=locate(V6DEST,Path(x['file']).name)
  assert sha(p)==x['sha256'],x['id']
print("PRESERVED_V6_REAL_NATIVE_MEDIA_SHOTS_19",flush=True)
# 2026 Lamborghini video: 1080x1920, not landscape; source sha and FFprobe verified
lamj=unpack_validated(LAM,"SOURCE_MANIFEST.json",LDEST)
l=json.loads(lamj.read_text())
assert l["status"].startswith("ACTUAL_1080_NATIVE_PORTRAIT")
assert l["native_resolution"]==[1080,1920]
assert l["landscape_edit_eligible"]==False
assert l["sha256"]=="f432219b5a2e6037ef01da7f21503479008731d1aebe0b248bf2f5c8a5999793"
lp=LDEST/l["original_file"]
assert lp.is_file() and sha(lp)==l["sha256"]
# Extra real three UHD clips: preserved FFprobe SHA; NONE approved as GT3 class yet
scenej=unpack_validated(EXTRA,"CANDIDATES_SHA_FFPROBE_PROVENANCE.json",EDEST)
sj=json.loads(scenej.read_text())
assert sj["verified_source_camera_views_added"]==0 and sj["published_makes_verifiably_added"]==0
assert len(sj["candidates"])==3
assert len([x for x in sj["candidates"] if "file" in x])==3
for v in sj["candidates"]:
 p=EDEST/v["file"]
 assert p.is_file() and sha(p)==v["sha256"] and v["native_pixels"]==[3840,2160],v["id"]
print("NEW_ORIGINAL_GT3_ABT_VERTICAL_PLUS_3_UNAPPROVED_UHD_VIDEO_BYTES_ALL_SHA_VERIFIED",flush=True)
record={
 "project":"YUNEX GT3 MULTI-CAR 001",
 "version":"V7 REAL MEDIA + STRICTLY FLAGGED NEW REVIEW ORIGINALS",
 "actual_video_bytes_published":True,
 "primary_landscape_1080_full_bleed_source_folder":str(V6DEST.relative_to(ROOT)),
 "primary_gate":"BLOCKED",
 "confirmed_native_landscape_gt3_makes":5,
 "confirmed_distinct_native_landscape_gt3_camera_views":19,
 "required_native_landscape_makes":6,
 "required_distinct_camera_views":24,
 "v6_source_artifact":11707837297,
 "source_lamborghini_actual_native_1080_portrait_artifact":11707804402,
 "source_additional_three_real_UHD_porsche_racing_cameras_artifact":11709205487,
 "portrait_lamborghini_review_only":True,
 "lamborghini_exact_model_appearance":"ABT Red Bull Lamborghini Huracan GT3 EVO2 Nürburgring 2026. 6.67sec portrait original, with burned text and empty track for later frames.",
 "lamborghini_portrait_original_SHA256":l["sha256"],
 "extra_4k_porsche_real_moving_cameras_review_only":3,
 "porsche_gt3r_vs_911cup_exact_class_requires_additional_qa":True,
 "new_source_landscape_gt3_camera_count_approved":0,
 "new_sixth_landscape_make_approved":False,
 "no_video_upscaling":True,
 "why_gate_not_pass":"Portrait source 1080 pixels wide cannot be cropped full-bleed 1920px landscape without upscaling; three original 4K shots have unresolved Porsche GT3 R vs 911 Cup class identity.",
 "no_fake_final_ready_claim":True,
 "source_originals_sha_verified":True
}
(ROOT/"COMBINED_GLOBAL_MANIFEST_V7.json").write_text(json.dumps(record,indent=2)+"\n")
(ROOT/"README_FIRST.md").write_text("""# YUNEX GT3 Multi-Car 001 — Actual native-original footage V7
**REAL PLAYABLE VIDEO FILES; PRIMARY LANDSCAPE GT3 SHOT GATE IS STILL BLOCKED.**
This is one actual GitHub media artifact with V6 untouched original 5-make 19-angle footage plus:
- additional genuine ABT Red Bull 2026 GT3 video at **native 1080x1920 vertical**. The original video has a burned-in caption; landscape editor cannot count it.
- three new physical Porsche racecar camera tracks at **native 3840x2160** from actual 2026 N24 original. These clips are **REVIEW ONLY** because GT3 R vs 911 Cup exact class has not been proven. Original timestamps, independent contact frame proofs, FFprobe and SHA manifests included.
- No repeat viewpoint falsely counted and no interpolation/upscale of low-res sources.
**Global confirmed 1920x1080 landscape gate stays 5/6 manufacturers, 19/24 independent camera angles.** This is not a final 10.533-second edited montage. Exact audio separate.
""")
print("V7_REAL_VIDEO_DELIVERABLE_MAIN_5_MAKES_19_CAMERAS_NEW_1080_LAMBO_PORTRAIT_AND_3_TRUE_UHD_PORSCHE_REVIEW_ONLY",flush=True)
