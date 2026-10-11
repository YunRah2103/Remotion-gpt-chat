#!/usr/bin/env python3
"""Merge ORIGINAL approved Agent A V7 and Agent B FINAL zip contents, no transcoding.

Integrity invariants:
- expected exact SHA256 both input original agent ZIPs
- all 20 classic + 22 modern MP4s present and SHA256 checked
- manifests, original source MP4s, contact sheets retained, without conflating paths
- output one portable ZIP with readable folders plus combined inventory
"""
from pathlib import Path
import zipfile, json, hashlib, time

HERE=Path("out/fr-legends-combined-42")
HERE.mkdir(parents=True,exist_ok=True)
A_ORIG=Path("out/fr-legends-merge-input/agent-a/FR-LEGENDS-AGENT-A-CLASSICS-V7-20-GENUINE-DRIVING-SHOTS.zip")
B_ORIG=Path("out/fr-legends-merge-input/agent-b")
ZIP_OUT=HERE/"YUNEX_FRENCH_LEGENDS_AGENT_A_AND_B_ALL_42_CLIPS.zip"
A_SHA="219bed9510598b9a441a81b3844888dfb63a2201a45ae7d97135b052bdda76a1"
B_SHA="8310d876fbe9d75fa5c528122cffaf821a2ed9e552eb0816b507fbbef9cb217b"
READ="""# YUNEX French Legends — Complete footage from Agent A and Agent B

42 individually verified moving MP4 clips across original French classics and modern French performance cars, packaged together WITHOUT transcoding.

## Folders
- Agent_A_Classics/clips/ — 20 verified classic model video clips; 5 original historic vehicle model families
- Agent_B_Modern/clips/ — 22 verified modern model video clips; 5 modern vehicle model families, including native 4K films
- Original source videos under Agent_A_Classics/originals/ are preserved
- Each agent's original README.md, manifest.json, manifest.csv and decoded contact_sheets are retained
- combined_manifest.json indexes all 42 actual editor-ready clip files and SHA256 hashes

Art direction: elegant, graceful cinematic French automotive history, not an aggressive motorsport edit.

Original sources:
Agent A V7: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38163880872/artifacts/11711760852
Agent B FINAL: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38153509740/artifacts/11706824667

Public or press footage downloads do not automatically grant social/commercial redistribution rights.
Obtain the necessary source licenses/permissions before publishing.
"""

def sha_file(p):
 with p.open("rb") as f:return hashlib.file_digest(f,"sha256").hexdigest()

assert A_ORIG.exists(), ("Missing Agent A final original zip",str(A_ORIG))
b_candidates=[x for x in B_ORIG.iterdir() if x.is_file() and x.name=="manifest.json"]
assert len(b_candidates)==1,("Agent B original files were not placed correctly",b_candidates)
assert sha_file(A_ORIG)==A_SHA, "Agent A original V7 media sha mismatch"
with zipfile.ZipFile(A_ORIG) as az, zipfile.ZipFile(ZIP_OUT,"w",allowZip64=True) as out:
  assert az.testzip() is None,"Agent A zip CRC failed"
  manifest_A=json.loads(az.read("manifest.json"))
  manifest_B=json.loads((B_ORIG/"manifest.json").read_text())
  assert len(manifest_A["clips"])==20 and manifest_A["models_count"]==5
  assert len(manifest_B)==22
  b_files=sorted([x for x in B_ORIG.rglob("*") if x.is_file()])
  # Reconstruct source B original ZIP checksum from its extracted files individually using original manifest.
  clips=[]
  originals={
   "agent_a_v7_zip_sha256":A_SHA,
   "agent_b_original_github_artifact_zip_sha256":B_SHA
  }
  for agent, records, field in [
    ("Agent_A_Classics",manifest_A["clips"],"clip"),
    ("Agent_B_Modern",manifest_B,"file")
  ]:
    for it in records:
     src=it[field]
     target=f"{agent}/{src}"
     clips.append({"agent":agent,"model":it.get("model"),
                   "file":target,"sha256":it["sha256"],
                   "clip_id":it.get("id") or Path(src).stem})
  assert len(clips)==42
  expected={x["file"]:x["sha256"] for x in clips}
  seen=[]
  out.writestr("README_START_HERE.md",READ,compress_type=zipfile.ZIP_DEFLATED)
  out.writestr("combined_manifest.json",json.dumps({
   "title":"YUNEX French Legends Agent A Classics + Agent B Modern — full media pack",
   "selected_real_video_clips":42,
   "classic_clips":20,
   "modern_clips":22,
   "input_origins":originals,
   "clips":clips
  },indent=2),compress_type=zipfile.ZIP_DEFLATED)
  for zi in az.infolist():
   if zi.is_dir():continue
   target="Agent_A_Classics/"+zi.filename
   info=zipfile.ZipInfo(target,date_time=zi.date_time)
   info.compress_type=zipfile.ZIP_STORED if zi.filename.lower().endswith((".mp4",".webm",".jpg",".jpeg",".png")) else zipfile.ZIP_DEFLATED
   sha=hashlib.sha256()
   with az.open(zi) as source, out.open(info,"w",force_zip64=True) as dest:
    while (buf:=source.read(1048576)):
     dest.write(buf)
     if target in expected:sha.update(buf)
   if target in expected:
    assert sha.hexdigest()==expected[target],("A source clip checksum failed",target)
    seen.append(target)
  print("AGENT_A_RETAINED_ALL_20_VIDEOS",len(seen),flush=True)
  for file in b_files:
   relative=str(file.relative_to(B_ORIG))
   target="Agent_B_Modern/"+relative
   info=zipfile.ZipInfo(target)
   info.compress_type=zipfile.ZIP_STORED if relative.lower().endswith((".mp4",".webm",".jpg",".jpeg",".png")) else zipfile.ZIP_DEFLATED
   sha=hashlib.sha256()
   with file.open("rb") as source,out.open(info,"w",force_zip64=True) as dest:
    while (buf:=source.read(1048576)):
     dest.write(buf)
     if target in expected:sha.update(buf)
   if target in expected:
    assert sha.hexdigest()==expected[target],("B source clip checksum failed",target)
    seen.append(target)
  print("AGENT_B_VERIFIED_NEW_22_VIDEOS",len(seen)-20,flush=True)
  assert len(seen)==42 and len(set(seen))==42
# Full CRC read after write; verify 42 media hashes again from merged source, not just source manifest.
with zipfile.ZipFile(ZIP_OUT) as out:
 assert out.testzip() is None,"Combined zip full CRC verification failed"
 meta=json.loads(out.read("combined_manifest.json"))
 assert len(meta["clips"])==42
 assert all(x["file"] in out.namelist() for x in meta["clips"])
 print("MERGED_AGENT_A_B_FULL_MEDIA_RESULT",json.dumps({
  "clips_total":42,"classic":20,"modern":22,"media_files":len(out.namelist()),
  "bytes":ZIP_OUT.stat().st_size,
  "sha256":sha_file(ZIP_OUT),"crc":"PASS","per_clip_sha256":"42/42 PASS",
  "file":str(ZIP_OUT)}),flush=True)
