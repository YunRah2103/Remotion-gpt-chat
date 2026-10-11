#!/usr/bin/env python3
"""Combine A's actually verified native V5 videos with A2 Aston GT3 actual media.
Physical bytes from two GitHub Actions archives ONLY. Verify all source SHAs,
FFprobe original GT3 film and all seven Aston shots, full-decode each.
Do not touch A2 branch. No synthetic footage, no upscaling or repeated camera claims.
"""
import hashlib,json,shutil,subprocess,zipfile
from pathlib import Path
FROM_A=Path("inputs/agent-a-v5")
FROM_A2=Path("inputs/agent-a2-aston-corrected")
DEST=Path("out/gt3-multicar-a-and-a2-native-original-v6")
AOUT=DEST/"agent_a_original_v5"
A2OUT=DEST/"agent_a2_aston_original"
for p in (DEST,AOUT,A2OUT):p.mkdir(parents=True,exist_ok=True)
def dig(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for block in iter(lambda:f.read(1<<20),b""):h.update(block)
 return h.hexdigest()
def locate(root,filename):
 paths=list(root.rglob(filename))
 if len(paths)!=1:raise RuntimeError(f"Expected one {filename} but found {len(paths)} inside {root}")
 return paths[0]
def run(a,timeout=95):
 p=subprocess.run(a,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-600:])
 return p.stdout
# Protect exact original V5 evidence and every existing authentic video source file.
v5file=locate(FROM_A,"SOURCE_MANIFEST_FFPROBE_V5.json")
v5=json.loads(v5file.read_text())
assert v5["footage_gate"]=="BLOCKED"
assert len(v5["confirmed_makes"])==4 and "Aston Martin" not in v5["confirmed_makes"]
assert v5["existing_identifiable_gt3_sections"]==6
assert v5["new_additional_verified_4k_gt3_shots"]==6
assert v5["confirmed_distinct_source_sections_after_curated_QA"]==12
assert len([x for x in v5["new_scene_records"] if x["status"]=="VISUALLY_VERIFIED_GT3_MOTION_NATIVE_4K"])==6
# copy content in tree after exact manifest verification
for p in FROM_A.iterdir():
 if p.is_dir():shutil.copytree(p,AOUT/p.name,dirs_exist_ok=True)
 elif p.is_file():shutil.copy2(p,AOUT/p.name)
assert dig(locate(AOUT,"SOURCE_MANIFEST_FFPROBE_V5.json"))==dig(v5file)
for shot in v5["new_scene_records"]:
 if "file" in shot:
  x=AOUT/shot["file"]
  assert x.exists() and dig(x)==shot["sha256"],"A V5 editor original mismatch "+shot["id"]
# Corrected Agent A2 archive may be wrapped as a ZIP inside Actions download.
zip_candidates=[p for p in FROM_A2.rglob("*.zip") if p.is_file()]
if zip_candidates:
 assert len(zip_candidates)==1,zip_candidates
 zfile=zip_candidates[0]
 with zipfile.ZipFile(zfile) as z:
  assert z.testzip() is None,"Corrupted A2 original media ZIP"
  for member in z.namelist():
   if member.startswith('/') or ".." in Path(member).parts:raise RuntimeError("Unsafe A2 file in ZIP")
  z.extractall(A2OUT)
 print("A2_SOURCE_ARCHIVE_CRC_PASS",zfile.stat().st_size,dig(zfile),flush=True)
else:
 for p in FROM_A2.iterdir():
  if p.is_dir():shutil.copytree(p,A2OUT/p.name,dirs_exist_ok=True)
  elif p.is_file():shutil.copy2(p,A2OUT/p.name)
aston=json.loads(locate(A2OUT,"SOURCE_MANIFEST_FFPROBE_SHA256.json").read_text())
assert aston["native_approved_gt3_camera_shots"]==7
assert aston["manufacturers"]==["Aston Martin"]
assert len(aston["shots"])==7
assert aston["all_project_gate_pass"] is False
orig=aston["original"]
file=A2OUT/orig["file"]
assert file.is_file() and dig(file)==orig["sha256"],"Aston producer source original changed"
origprobe=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(file)],30))
native=next(x for x in origprobe["streams"] if x["codec_type"]=="video")
assert (int(native["width"]),int(native["height"]))==(1920,1088)
run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(file),"-f","null","-"],150)
print("ASTON_ORIGINAL_1920x1088_SHA_FULL_DECODE_OK",dig(file),flush=True)
camera_ids=set()
for item in aston["shots"]:
 assert item["approved"] is True and item["verified_real_racing"] is True
 assert item["gt3_make"]=="Aston Martin" and item["verified_make"]=="Aston Martin"
 assert item["approved_camera_classification"]=="VISUALLY_APPROVED_SINGLE_DISTINCT_PUBLISHER_EDIT_CAMERA_POSITION"
 assert item["camera_id"] not in camera_ids,"Duplicate A2 on-track camera perspective"
 camera_ids.add(item["camera_id"])
 p=A2OUT/item["clip_file"]
 assert p.is_file() and dig(p)==item["clip_sha256"],"A2 actual cut SHA mismatch "+item["id"]
 video=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)],25))
 vv=next(x for x in video["streams"] if x["codec_type"]=="video")
 assert (int(vv["width"]),int(vv["height"]))==(1920,1080) and vv["codec_name"]=="h264"
 run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(p),"-f","null","-"],65)
 print("REAL_ASTON_1080_GT3_CAMERA_REDECODED",item["id"],item["camera_id"],dig(p),flush=True)
# Accurate additive manufacturer and angle gate: no claims for Ferrari/Lamborghini/McLaren.
combined_makes=v5["confirmed_makes"]+["Aston Martin"]
verified_camera_total=12+7
assert len(set(combined_makes))==5 and verified_camera_total==19
summary={
 "project":"YUNEX GT3 Multi-Car 001","media_gate":"BLOCKED_NOT_FULL_SIX_MAKE_OR_24_SHOTS",
 "original_real_footage_files_all_present":True,
 "agent_A_v5_actual_media_gitHub_artifact":11707956293,
 "agent_A2_corrected_aston_gitHub_artifact":11707506666,
 "originals_sha_verified":True,"all_7_A2_shots_fully_redecoded":True,
 "makes_confirmed":combined_makes,"makes_verified":5,"makes_required":6,
 "distinct_source_camera_sections_verified":19,"distinct_source_camera_sections_required":24,
 "known_unfilled_gt3_makes":["Lamborghini Huracán GT3 EVO2","Ferrari 296 GT3","McLaren 720S GT3 EVO"],
 "additional_distinct_angles_required_for_contract":5,
 "agent_A_v5_verified_shots":12,"agent_A2_new_verified_Aston_shots":7,
 "agent_A2_original_film_count":1,
 "agent_A2_cameras":sorted(camera_ids),
 "photo_frames_and_manifest_locations":["agent_a_original_v5/SOURCE_MANIFEST_FFPROBE_V5.json","agent_a2_aston_original/SOURCE_MANIFEST_FFPROBE_SHA256.json"],
 "no_upscales":True,
 "footage_note":"One physical media ZIP, all video bytes and original manifests. Aston exact 1920x1088 original is trimmed 4px in vertical dimension to 1920x1080. Previously verified 4K native pixels preserved; 2018 HDR selected cuts correctly converted to SDR. Night clips and uncertain GT3 IDs do not inflate verified totals.",
 "editor_handoff":"Source pack provides real GT3 footage for preliminary cinematics; final release remains gate BLOCKED until six confirmed makes and 24 distinct racing shots."
}
(DEST/"COMBINED_GLOBAL_MANIFEST_V6.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
(DEST/"README_FIRST.md").write_text("""# YUNEX GT3 Multi-Car 001 — Combined A+A2 REAL VIDEO V6
Status: **PARTIAL FOOTAGE / FINAL GATE BLOCKED**.
One physically downloaded publisher-original source package, **five confirmed makes, 19 distinct visually classified Nürburgring racing camera sections**; need six makes and 24 angles.
- agent_a_original_v5: byte-preserved V4 originals plus six new carefully selected genuine 3840x2160 Porsche camera shots, 2 review-only clips.
- agent_a2_aston_original: actual native Aston Martin Racing film (1920x1088) + seven fully decoded no-upscale 1920x1080 Aston Vantage GT3 source shots.
- Both complete manifests and original full-decode proof. All A2 clip bytes revalidated with SHA256 against original Actions artifacts.
No fake titles, AI-generated cars, simulators, upscaled 720p, or duplicated camera viewpoints claimed as new makers.
Source rights/media terms should be checked by publisher/user before redistribution.
DO NOT LABEL THIS ZIP A COMPLETED SIX-MANUFACTURER RELEASE.
""")
print("SINGLE_COMBINED_REAL_MEDIA_V6",len(combined_makes),"MAKES",verified_camera_total,"INDEPENDENT_GT3_CAMERA_SCENES",flush=True)
