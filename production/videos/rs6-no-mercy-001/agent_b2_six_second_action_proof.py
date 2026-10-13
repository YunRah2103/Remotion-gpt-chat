#!/usr/bin/env python3
"""YUNEX RS6 B2 6-second real-motion production proof.

Four verified original Audi 4K source-based A2/C2 shots, one B2 filmmaker
night car reveal and two real RS6 details, deliberately cut as a *draft*.
No soundtrack exists on this B2 branch, so SILENT only; not claimed as final.
"""
from pathlib import Path
import hashlib,json,subprocess,tempfile,statistics,math
from PIL import Image,ImageDraw,ImageStat

INPUT=Path("private_sources")
OUT=Path("b2-action-proof");OUT.mkdir(exist_ok=True)
VIDEO=OUT/"YUNEX_RS6_B2_SIX_SECOND_ACTION_PROOF.mp4"
SOURCES=[
 ("B2_LOWDOWN_NIGHT_07.mp4",1.15,1.03,"NIGHT_REVEAL_RED","moving camera, strong red front 3/4"),
 ("A2_C8_RS6_FAST_APPROACH.mp4",0.06,1.17,"ORIGINAL_4K_FAST_ROLL","grey original Audi real forward C8 motion"),
 ("UHD_MATRIX_LED_FRONT_CORNER.mp4",0.08,0.42,"AUDI_NATIVE4K_LED","sharp component flash"),
 ("A2_C8_RS6_HAIRPIN_REVEAL.mp4",0.10,1.06,"ORIGINAL_4K_HAIRPIN","real grey C8 full-car bending corner"),
 ("UHD_RS6_RED_BRAKE_CALIPER.mp4",0.09,0.40,"AUDI_NATIVE4K_BRAKE","real moving visual brake macro"),
 ("A2_C8_RS6_MOUNTAIN_SWEEP.mp4",0.02,0.96,"ORIGINAL_4K_MOUNTAIN","grey car driving forward in mountain bend"),
 ("UHD_RS6_REAR_LED_SIGNATURE.mp4",0.06,0.39,"AUDI_NATIVE4K_REAR_LIGHT","rear RS6 light"),
 ("UHD_RS6_OVAL_EXHAUST_REAR.mp4",0.05,0.40,"AUDI_NATIVE4K_OVAL_EXHAUST","full RS6 oval exhaust"),
 ("B2_LOWDOWN_NIGHT_07.mp4",2.08,0.62,"NIGHT_REPRISE_RED","final red RS6 front 3/4 night car")
]
def run(cmd,timeout=100):
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
    if p.returncode:
        raise RuntimeError(f"FAILED {p.returncode} "+" ".join(cmd[:4])+" : "+p.stderr[-1400:])
    return p.stdout
def sha(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
    return h.hexdigest()
# repeated source file for two segments is accepted by ffmpeg as independent inputs.
for filename,*_ in SOURCES:
    p=INPUT/filename
    if not p.is_file() or p.stat().st_size<90000:
        raise RuntimeError("Real source missing or bad: "+str(p))
cmd=["ffmpeg","-y","-hide_banner","-nostdin","-loglevel","error"]
for name,*_ in SOURCES:cmd.extend(["-i",str(INPUT/name)])
filters=[]
for i,(name,start,duration,shot,meaning) in enumerate(SOURCES):
    # Minimal texture; editor can later sync shot boundaries to reference score.
    look=("eq=contrast=1.08:saturation=0.88:brightness=-0.012,"
          if name.startswith("B2_") else
          "eq=contrast=1.075:saturation=0.64:brightness=-0.003,")
    filters.append(f"[{i}:v]trim=start={start}:duration={duration},"
          f"setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,"
          f"{look}format=yuv420p,setsar=1[v{i}]")
filters.append("".join(f"[v{i}]" for i in range(len(SOURCES)))+
               f"concat=n={len(SOURCES)}:v=1:a=0[video]")
cmd+=["-filter_complex",";".join(filters),"-map","[video]","-an",
      "-pix_fmt","yuv420p","-r","30","-c:v","libx264","-preset","fast",
      "-crf","16","-movflags","+faststart",str(VIDEO)]
run(cmd,160)
info=json.loads(run(["ffprobe","-v","error",
  "-show_entries","stream=codec_type,width,height,codec_name,pix_fmt,r_frame_rate:"
  "format=duration,size","-of","json",str(VIDEO)],20))
v=next((s for s in info["streams"] if s.get("codec_type")=="video"),{})
duration=float(info["format"]["duration"])
if v.get("width")!=1080 or v.get("height")!=1920 or v.get("r_frame_rate")!="30/1" or not 5.4<duration<7.2:
    raise RuntimeError("Output invalid: "+str(info))
run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-xerror",
     "-i",str(VIDEO),"-f","null","-"],70)
with tempfile.TemporaryDirectory(prefix="b2sixframes") as tmp:
    d=Path(tmp)
    run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y",
         "-i",str(VIDEO),"-vf","fps=4,scale=216:384",
         "-frames:v","30",str(d/"s%03d.jpg")],50)
    frames=[Image.open(p).convert("RGB") for p in sorted(d.glob("s*.jpg"))]
    if len(frames)<20:raise RuntimeError("Too few genuine video frames")
    columns=5;rows=math.ceil(len(frames)/columns)
    w=216;h=411
    sheet=Image.new("RGB",(columns*w,rows*h),"#101316")
    painter=ImageDraw.Draw(sheet)
    luma=[]
    for idx,im in enumerate(frames):
        x=idx%columns*w;y=idx//columns*h
        sheet.paste(im,(x,y+27))
        lum=ImageStat.Stat(im.convert("L")).mean[0]
        luma.append(round(lum,2))
        painter.text((x+5,y+6),f"{idx/4:.2f}s / Y={int(lum)}",fill="white")
    sheet.save(OUT/"SIX_SECOND_CONTACT.jpg",quality=85,optimize=True)
report={"project":"YUNEX RS6 B2 six-second editor test","status":"PLAYABLE_FULL_DECODE_PASS",
 "sha256":sha(VIDEO),"bytes":VIDEO.stat().st_size,"duration":duration,
 "native_source_notes":"4K-source A2/C2 imagery cropped preserving high-quality source, B2 night 1080p landscape originally upscaled",
 "rights":"UNPUBLISHED OWNER REVIEW ONLY; Audi/The-Lowdown source use unapproved for public posting",
 "music":"not included; reference audio unavailable on this branch; silence is deliberate",
 "scope":"not a finished NO MERCY video; beat alignment only when scored track is present",
 "shots":[{"file":fn,"start":s,"length":du,"id":k,"note":n}
   for fn,s,du,k,n in SOURCES],
 "technical":info,
 "qa_frame_count":len(frames),"luma_samples_4fps":luma,
 "longest_dark_qa_samples":max((len(list(g)) for k,g in __import__('itertools').groupby(z<13 for z in luma) if k),default=0)}
(OUT/"SIX_SECOND_MANIFEST.json").write_text(json.dumps(report,indent=2))
(OUT/"SIX_SECOND_SHA256SUMS.txt").write_text(sha(VIDEO)+"  "+VIDEO.name+"\n")
print(json.dumps({"status":report["status"],"duration":duration,"bytes":report["bytes"],
  "sha256":report["sha256"],"qa_frames":len(frames),
  "dark_frames":report["longest_dark_qa_samples"]},indent=2))
