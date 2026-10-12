#!/usr/bin/env python3
"""Human-reviewed Agent C camera footage editor selects; excludes all synthetic/unapproved other source clips."""
import hashlib,json,zipfile
from pathlib import Path
P=Path("out")
inp=P/"CYBER-FUTURE-001-FOOTAGE-C.zip"
out=P/"CYBER-FUTURE-001-C-FRANCE-EDITOR-SELECTS.zip"
select={
5:("blue-red real R5 frontal moving on mountainous road","hero"),
6:("blue-red R5 on coastal road high aerial driving","support"),
7:("yellow-black prototype low heroic rolling frontal shot","hero"),
8:("yellow-black prototype frontal trackside drive","hero"),
12:("blue-red R5 close side detail rolling around harbour","support"),
13:("blue-red R5 overhead driving near harbour","support"),
14:("blue-red R5 cinematic sunset aerial driving","support"),
15:("blue-red R5 moving side profile road","hero"),
16:("blue-red R5 turning with smoke at golden hour","hero"),
18:("yellow-black R5 close-up frontal, beauty angle","support"),
19:("blue-red R5 roadside sunset static beauty portrait","support"),
}
def sha(b):return hashlib.sha256(b).hexdigest()
with zipfile.ZipFile(inp) as src:
 if src.testzip() is not None:raise ValueError("source corrupt")
 mani=json.loads(src.read("corsica_physical_2025/manifest.json"))
 with zipfile.ZipFile(out,"w",zipfile.ZIP_STORED,allowZip64=True) as dst:
  original="corsica_physical_2025/originals/renault_r5_turbo_3e_real_corsica_2025_original.mp4"
  blob=src.read(original);orig_sha=sha(blob)
  assert orig_sha=="edf970e4b3b6d407b4e84e85cc130ddf3c8b16aee8166da90735a57c6299f6f5"
  dst.writestr("originals/renault_r5_turbo_3e_2025_corsica_original.mp4",blob)
  approved=[]
  for i,(description,tier) in select.items():
   row=dict(mani[i-1]);old=f"corsica_physical_2025/clips/R5_CORSICA_REAL_{i:02d}.mp4"
   video=src.read(old);assert sha(video)==row["clip_sha256"],old
   dstname=f"clips/C{i:02d}_renault_r5_turbo_3e_2025.mp4"
   dst.writestr(dstname,video)
   contacts=[]
   for n in (1,2,3):
    pic=f"corsica_physical_2025/frames/R5_CORSICA_REAL_{i:02d}_frame{n}.jpg"
    dest=f"contact_frames/C{i:02d}_frame{n}.jpg"
    dst.writestr(dest,src.read(pic));contacts.append(dest)
   row.update({"file":dstname,"sha256":sha(video),"description":description,
    "human_visual_review":"PASS: photoreal physical prototype filmed at actual Corsica motoring event",
    "tier":tier,"contacts":contacts,
    "publishing_rights":"NOT CLEARED — original footage is press distributed; separate permission needed",
    "different_model_count":1,"source_model":"Renault R5 Turbo 3E 2025"})
   approved.append(row)
  dst.writestr("manifest.json",json.dumps(approved,indent=2))
  dst.writestr("README_START_HERE.md",
"""# CYBER//FUTURE Agent C — editor selects / physically filmed French prototypes
Review outcome: **PARTIAL contract pass only**. This is ONE model despite 11 different camera angles.
These 11 distinct editorial angles were visually reviewed from complete moving media:
9 show the R5 Turbo 3E 2025 moving in a genuine Corsica outdoor shoot, two are close stationary or beauty views.
All retain native 1920x1080 source and high-quality 1080p clips, original whole 62.08s film and per-frame JPEG proof.
Greatest hero shots C05, C07, C08, C15, C16.
No AI renders or artificial upscaling. Filante, 2022 R5 studio imagery and other doubtful CG shots excluded.
One parent original used; not two independent productions, nor the required two real models.
**Publishing rights unresolved.** Press availability is NOT a blanket edited-video or social-platform redistribution license.
Full acquisition ZIP is a separate artifact at Actions run 38241671138, including unapproved/hold footage.
""")
  dst.writestr("QA.json",json.dumps({"reviewed_distinct_camera_shots":len(approved),
   "moving_camera_scenes":9,"support_beauty_scenes":2,"native_width":1920,"native_height":1080,
   "original_sha256":orig_sha,"original_bytes":len(blob),
   "model_count":1,"source_url":"https://www.auto-medienportal.net/video/load/original/3469/",
   "publication_rights":"not verified, request permission",
   "status":"GOOD REAL MOTION FOOTAGE; overall Agent C two-model gate still not fully met"},indent=2))
print("EDITOR_SELECTS_CREATED",out.stat().st_size,len(select),sha(out.read_bytes()),flush=True)
with zipfile.ZipFile(out) as check:assert check.testzip() is None
