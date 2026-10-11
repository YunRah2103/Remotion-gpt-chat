#!/usr/bin/env python3
"""Curate one honest editor-review ZIP from Agent A's *actual* downloaded artifact.

Only a manually reviewed moving/full-bleed/identity-confirmed clip may live in clips/.
Other failed candidates retained as reject metadata, never bundled in usable clips/.
"""
import argparse,csv,hashlib,json,shutil,subprocess,zipfile
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument("--input",required=True)
args=parser.parse_args()
SOURCE=Path(args.input); OUT=Path("out/fr-legends-a-approved")
(OUT/"clips").mkdir(parents=True,exist_ok=True)
(OUT/"originals").mkdir(parents=True,exist_ok=True)
(OUT/"contact_sheets").mkdir(parents=True,exist_ok=True)
approved="citroen-2cv-convoy-2022"
def hash_file(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def verify_decode(p):
 cmd=["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(p),"-map","0:v:0","-f","null","-"]
 subprocess.run(cmd,check=True,timeout=90,capture_output=True)
probe_cmd=["ffprobe","-v","error","-show_entries","stream=width,height,avg_frame_rate,codec_name",
           "-select_streams","v:0","-of","json",str(p)]
 j=json.loads(subprocess.run(probe_cmd,check=True,capture_output=True,text=True).stdout)
 s=j["streams"][0]
 assert (s["width"],s["height"])==(3840,2160),s
 return s
with zipfile.ZipFile(SOURCE) as archive:
 original_manifest=json.loads(archive.read("manifest.json"))
 a=next(x for x in original_manifest if x["slug"]==approved)
 for basename,path in [("clips/"+approved+".mp4",OUT/"clips"/(approved+".mp4")),
                       ("originals/"+approved+".webm",OUT/"originals"/(approved+".webm")),
                       ("contact_sheets/"+approved+"-sheet.jpg",OUT/"contact_sheets"/(approved+"-sheet.jpg"))]:
  with archive.open(basename) as src,path.open("wb") as target:shutil.copyfileobj(src,target,1024*1024)
 assert hash_file(OUT/"clips"/(approved+".mp4"))==a["clip_sha256"]
 assert hash_file(OUT/"originals"/(approved+".webm"))==a["original_sha256"]
 probe=verify_decode(OUT/"clips"/(approved+".mp4"))
 qa={**a,"status":"PASS_REAL_4K_FULL_BLEED_CLASSIC_CITROEN_2CV_MOVING_SINGLE_ANGLE",
     "identity_visual_verified":True,"moving_cinematography_verified":True,
     "unique_angle_verified":True,"counted_towards_gate_a":True,
     "qa_note":"Visually reviewed exact 0.5,1.5,3,4.5,6.2 sec of MP4: multiple authentic 2CV cars driving by a fixed roadside camera. ONE usable angle, only supporting shot.",
     "source_credits_required":"OSeveno — Creative Commons Attribution-ShareAlike 4.0 International; retain author credit, licence link and changes noted.",
     "visual_qa_status":"BACKUP_SUPPORTING_SHOT_ONLY_NO_PREMIUM_TRACKING",
     "verified_output_video_probe":probe}
 rejected=[{"slug":r["slug"],"source_url":r.get("commons",{}).get("page",r.get("page")),
     "rejection":reason,"clip_sha256":r.get("clip_sha256")} for r,reason in
     [(next(x for x in original_manifest if x["slug"]=="citroen-2cv-meeting-2025"),
         "Burned-in Postojna-SLO text and most of clip lacks hero-car driving; not clean."),
      (next(x for x in original_manifest if x["slug"]=="alpine-a110-1973-on-track"),
         "Exact 1-8s MP4 contains no Alpine at all: just empty road. Longer source letterboxed and rights unresolved."),
      (next(x for x in original_manifest if x["slug"]=="citroen-ds-oldtimer-2024"),
         "Exact 1-8s MP4 shows static light-blue small Fiat-looking car, NOT a Citroen DS.")]]
 report={"project":"FR Legends 001","agent":"A Classics","status":"BLOCKED_PARTIAL_DELIVERY",
         "contract_min_distinct_shots":18,"contract_min_distinct_models":5,
         "verified_editor_supporting_shots":1,"verified_editor_premium_hero_shots":0,"verified_models":["Citroën 2CV"],
         "source_run_id":38147473826,"source_artifact_id":11705423108,
         "source_commit_sha":"820a18f236d60a94f132109855dd6cd0bb1cbd14",
         "approved":[qa],"rejected_not_in_clips_folder":rejected}
 (OUT/"manifest.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
 with (OUT/"manifest.csv").open("w",newline="") as f:
  keys=["slug","model","status","clip_path","clip_sha256","original_sha256","source_credits_required"]
  w=csv.DictWriter(f,fieldnames=keys,extrasaction="ignore");w.writeheader();w.writerow(qa)
 (OUT/"README.md").write_text(
 """# FR Legends Agent A — properly curated source-footage ZIP

**Status: BLOCKED / ONLY 1 ACCEPTED SUPPORTING SHOT / 1 MODEL.**
This is not 18-shot Gate A PASS. Do not treat the 3 rejected source leads as editor-ready.

## Contents
- clips/citroen-2cv-convoy-2022.mp4 — actual 3840×2160, 29.97 fps H.264, seven seconds. One real moving Citroën 2CV camera angle (stationary roadside shot).
- originals/citroen-2cv-convoy-2022.webm — actual ORIGINAL native 4K source; do not claim H.264 extract is original bitstream.
- contact_sheets/citroen-2cv-convoy-2022-sheet.jpg — actual decoded proof across complete source.
- manifest.json and manifest.csv — source, hash, model, frame QA and reject reasons.

Copyright/source: Video by OSeveno (2022), Wikimedia Commons, CC BY-SA 4.0,
https://commons.wikimedia.org/wiki/File:Multiple_Citro%C3%ABn_2CV_vehicles_driving_by_(east_Netherlands,_2022).webm
Attribution and share-alike terms must be followed for derivative redistribution.

Rejected sources exist in prior *research evidence* artifact 11705423108, but they are excluded from this approved clips directory. They have no implied reuse permission.

## Gate
Aim >=18 genuinely distinct driving angles across >=5 assigned classic models.
Current: 1 identity-verified 4K backup camera angle, 0 premium hero shots, 1 model.
No sound/edit/final film production has been attempted.
""")
z=Path("out/fr-legends-agent-a-classics-CURATED.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED,compresslevel=1) as archive:
 for p in OUT.rglob("*"):
  if p.is_file():archive.write(p,p.relative_to(OUT))
print("CURATED_DONE",json.dumps({"actual_approved_clips":1,"model_count":1,
   "output_bytes":z.stat().st_size,"zip_sha256":hash_file(z),
   "approved_clip_sha256":qa["clip_sha256"],"gate_a":"BLOCKED"}))
