#!/usr/bin/env python3
"""Release *already proven* native 1080p Agent C action from successful Actions run 38270561114.
No fake new downloads. Reviewer-grade quality annotations; sponsor outro excluded.
"""
from pathlib import Path
import json,hashlib,subprocess,zipfile
from PIL import Image,ImageDraw

original=Path("incoming/agent-c-indycar-footage.zip")
assert original.is_file(),f"Missing original verified Actions archive: {original}"
out=Path("out/agent-c-curated")
out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(original) as z:z.extractall(out)
data=json.loads((out/"manifest.json").read_text())
assert data["status"]=="RACE_CANDIDATES_ACQUIRED_REVIEW_REQUIRED"
old_count=len(data["clips"])
data["clips"]=[c for c in data["clips"] if c["name"]!="C05_indy500_2026_finish_02"]
assert old_count==7 and len(data["clips"])==6
(out/"clips/C05_indy500_2026_finish_02.mp4").unlink(missing_ok=True)
(out/"contact_sheets/C05_indy500_2026_finish_02.jpg").unlink(missing_ok=True)
(out/"ALL_CONTACT_SHEETS.jpg").unlink(missing_ok=True)

quality={}
for c in data["clips"]:
    name=c["name"]
    if c["source_id"]=="indy500_2026_finish":
        verdict="BEST_ACTION_CANDIDATE"
        comment="C04: 2026 last lap, real red IndyCar wheel-to-wheel overtake from cockpit ~54.88–57.48s source; native 1080, visual graphics, limited licensing, overlaps Agent D onboard."
    elif c["source_id"]=="indy500_2025_real_race_start":
        verdict="RACE_ACTION_BUT_WEAK_CROP"
        comment="Real 2025 grid/start, but the grandstand/spectators dominate; race cars are distant; weak 9:16 crop. Same static camera across C01-C03."
    else:
        verdict="FORMATION_ONLY_NON_RACING"
        comment="Sarah Stierch CC BY 4.0 2024 pace/formation lap, not racing. Source licensing/attribution documented."
    quality[name]={"rating":verdict,"note":comment}
    p=out/c["file"]
    assert hashlib.sha256(p.read_bytes()).hexdigest()==c["sha256"]
    probe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-of","json",str(p)]))
    v=next(x for x in probe["streams"] if x["codec_type"]=="video")
    assert (v["width"],v["height"])==(1920,1080),name
    subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(p),"-f","null","-"],check=True,timeout=60)

paths=sorted((out/"contact_sheets").glob("*.jpg"))
canvas=Image.new("RGB",(1080,((len(paths)+2)//3)*265),(17,20,26));d=ImageDraw.Draw(canvas)
for i,p in enumerate(paths):
    im=Image.open(p);im.thumbnail((352,225))
    x=(i%3)*360+4;y=(i//3)*265+31
    canvas.paste(im,(x,y));d.text((x,y-22),p.stem[:49],fill="white")
canvas.save(out/"ALL_CONTACT_SHEETS.jpg",quality=91)

data.update(status="PARTIAL_VISUAL_QA_NOT_FULLY_APPROVED",
    successful_acquisition_run_id=38270561114,
    successful_acquisition_source_sha="bd4ec8998e65b7d87fdc2caf97731ec730cb8b3d",
    visual_review=quality,
    reviewed_count=6,
    accepted_high_impact_shots=0,
    promising_moving_racing_moments=1,
    unique_racing_camera_angles=2,
    known_rights_limitations=[
       "2026 Dailymotion broadcast racing material: reuse not licensed by public accessibility.",
       "2025 Indy start Wikimedia Commons PD-self uploader designation with licence review pending.",
       "2024 Sarah Stierch CC BY 4.0 attribution required."
    ],
    rejected_outro="C05 2026 black MARCA logo/sponsor, removed from curated set.",
    verdict="Need additional clearly licensed true race aerial, trackside and overtake angles. C04 has close side-by-side but is an onboard that may overlap Agent D."
)
(out/"manifest.json").write_text(json.dumps(data,indent=2))
(out/"checksums.sha256").write_text("".join(f"{c['sha256']}  {c['file']}\n" for c in data["clips"]))
report="""# Agent C | reviewed race footage — PARTIAL only

- 6 real, playable native 1920×1080 MP4 files; source stream inspected, decoded and SHA-256 checked.
- 3 x 2025 real Indy 500 start: static distant grandstand, poor vertical crop, NOT hero-approved.
- 1 x 2026 very close wheel-to-wheel red-car pass, near 54.88–57.48s (C04); the standout but onboard angle / broadcast graphics and rights uncertainty; coordinate with Agent D.
- 2 x 2024 pace/formation laps, not actual overtakes; Sarah Stierch CC BY 4.0.
- Removed the MARCA logo/outro from the 2026 source (old C05).
- Publicly downloadable is not a grant of publishing rights. 2025 1080p Commons upload marked licence-review-pending.

The creative gate of 8–12 distinct exceptional IndyCar racing angles is NOT passed. Further licensed broadcast/trackside footage is needed. No edit authorised.

Provenance: https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38270561114
"""
(out/"REPORT.md").write_text(report)
zipout=out/"yunex-agent-c-1080p-curated.zip"
with zipfile.ZipFile(zipout,"w",compression=zipfile.ZIP_STORED) as z:
    for p in sorted(out.rglob("*")):
        if p.is_file() and p!=zipout:z.write(p,p.relative_to(out))
with zipfile.ZipFile(zipout) as z: assert z.testzip() is None
print(json.dumps({"zip_bytes":zipout.stat().st_size,"clips":len(data["clips"]),"best_shot":"C04","status":data["status"]},indent=2))
