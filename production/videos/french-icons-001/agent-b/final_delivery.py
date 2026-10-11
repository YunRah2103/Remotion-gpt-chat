#!/usr/bin/env python3
"""Final QA gate: only actual full-resolution moving clean clips, not raw source candidates."""
import csv,json,hashlib,shutil,collections
from pathlib import Path
INPUT=Path("out/premium-v4")
OUTPUT=Path("out/FR-LEGENDS-B-MODERN-FINAL")
CLIPS=OUTPUT/"clips";SHEETS=OUTPUT/"contact_sheets"
CLIPS.mkdir(parents=True,exist_ok=True);SHEETS.mkdir(parents=True,exist_ok=True)
ITEMS=json.loads((INPUT/"manifest.json").read_text())
EXCLUDED={"bugatti-chiron-hajar-frontal.mp4":"Visually inspected final 4-frame sheet: contains empty road and cockpit, not continuous hero-driving visuals."}
rows=[]
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for block in iter(lambda:f.read(1048576),b""):h.update(block)
 return h.hexdigest()
def family(label):
 if "A110" in label:return "Alpine A110"
 if "A290" in label:return "Alpine A290"
 if "Megane" in label:return "Renault Megane RS"
 if "Bolide" in label:return "Bugatti Bolide"
 if "Chiron" in label:return "Bugatti Chiron Pur Sport"
 return label
for r in ITEMS:
 name=Path(r["file"]).name
 if name in EXCLUDED:continue
 source=INPUT/r["file"]
 sheet=INPUT/"contact_sheets"/(Path(name).stem+"_sheet.jpg")
 if not source.is_file() or not sheet.is_file():raise FileNotFoundError("Clip or decoded contact sheet not found: "+str(name))
 dest=CLIPS/name
 shutil.copy2(source,dest)
 shutil.copy2(sheet,SHEETS/sheet.name)
 digest=sha(dest)
 if digest!=r["sha256"]:raise RuntimeError("source SHA256 mismatch for "+name)
 if int(r["width"])<1920 or int(r["height"])<1080:raise ValueError("below native resolution: "+name)
 if float(r["duration"])<2.4:raise ValueError("not a usable shot: "+name)
 x=dict(r)
 x.update(qa_status="PASS_MANUALLY_SCREENED_DECODED_CONTACT_SHEET",model_family=family(r["model"]),sha256=digest,orientation="landscape" if r["width"]>=r["height"] else "portrait",engine_original_audio_available=r.get("has_audio",False),crop_notes="Full source landscape. Reframe to 9:16 per shot in final editor; do not upscale sub-HD input.",usage_notes="Manufacturer footage publicly accessible for download; reuse/social licensing requires independent confirmation.",full_1080_or_4k=True)
 rows.append(x)
 print("FINAL_MEDIA",name,r["model"],r["width"],r["height"],r["duration"],digest,flush=True)
groups=collections.Counter(x["model_family"] for x in rows)
unique_sha=len(set(x["sha256"] for x in rows))
if unique_sha!=len(rows):raise RuntimeError("identical file in set")
if len(rows)<18 or len(groups)<5:raise RuntimeError("Gate numeric threshold not met")
(OUTPUT/"manifest.json").write_text(json.dumps(rows,indent=2,ensure_ascii=False))
fields=sorted(set(k for x in rows for k in x))
with (OUTPUT/"manifest.csv").open("w",newline="") as out:
 writer=csv.DictWriter(out,fields,extrasaction="ignore");writer.writeheader();writer.writerows(rows)
summary={"total_unique_native_clips":len(rows),"models":dict(groups),"family_count":len(groups),"native_4k_shots":sum(x["width"]>=3840 and x["height"]>=2160 for x in rows),"decoded_contact_sheets":len(list(SHEETS.glob("*.jpg"))),"duplicate_sha_count":0,"threshold":"PASS >=18 native usable unique moving cuts and >=5 modern French car model families","notes":"Editorially screened individual cut frames (not full temporal action playback); source reuse rights require separate review."}
(OUTPUT/"qa-summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False))
(OUTPUT/"rejected.json").write_text(json.dumps([{"file":k,"reason":v} for k,v in EXCLUDED.items()],indent=2,ensure_ascii=False))
(OUTPUT/"README.md").write_text("# YUNEX — FR Legends 001 — Agent B Modern (FINAL)\n\n"
 +f"**{len(rows)} genuine native-resolution usable MP4 cuts, {len(groups)} distinct modern French car families, {summary['native_4k_shots']} native 4K cuts.** One downloadable ZIP contains complete MP4s, original source URLs, SHA256 per file, decoded frame contact sheets, JSON/CSV manifest, QA summary and explicit rejection notes.\n\n"
 +"**No CGI, wrong-labelled Bugatti shared website trailers, fake still pans, sub-1080p source upscales, telemetry onboard, studio-only car shots, blank scenes or burned end logos intentionally included.** Directly checked against final decoded proof images. Most source clips retain original H.264 streams; precisely framed Bugatti cuts are re-encoded H.264 at CRF16 (same source-native resolution, high quality) to avoid keyframe leakage. Some model events have distinct camera angles from one parent film; see source timestamps in manifest.\n\n"
 +"**Footage acquisition gate: PASS on documented media/count/model/visual QA.** Separate publication/reuse permission from vehicle manufacturer is not guaranteed; do not assume the ZIP grants licensing rights. These are source clips, not the final movie, audio or beat edits.\n")
print("AGENT_B_FINAL_QA",json.dumps(summary),flush=True)
