#!/usr/bin/env python3
"""Owner-only real RS6 source footage rescue and first motion-continuity proof.
This DOES NOT license or publish third-party source media.
"""
from pathlib import Path
import subprocess, json, hashlib
SRC=Path("rs6-rescue-sources")
OUT=Path("rs6-rescue-review")
OUT.mkdir(parents=True,exist_ok=True)
def ff(cmd,timeout=90):
    p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
    if p.returncode: raise RuntimeError(" ".join(cmd)+"\n"+p.stderr[-1200:])
    return p.stdout
entries=[]
for f in sorted(SRC.rglob("*.mp4")):
    probe=json.loads(ff(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate","-of","json",str(f)],15))
    d=float(probe["format"]["duration"])
    digest=hashlib.sha256(f.read_bytes()).hexdigest()
    item={"path":str(f),"source_group":f.parent.name,"sha256":digest,"duration":d,"probe":probe}
    entries.append(item)
    if d > 0.1:
        sheet=OUT/(f.parent.name+"__"+f.stem+".jpg")
        try:
            ff(["ffmpeg","-nostdin","-v","error","-y","-i",str(f),"-vf","fps=2,scale=180:320:flags=lanczos,tile=4x2:padding=3","-frames:v","1",str(sheet)],35)
        except Exception as e: item["contact_error"]=str(e)
(OUT/"SOURCES_MANIFEST.json").write_text(json.dumps(entries,indent=2))
choices=[
("a2/A2_C8_RS6_FAST_APPROACH.mp4",32,"cold frontal motion"),
("c2/UHD_MATRIX_LED_FRONT_CORNER.mp4",9,"visual puncture"),
("a2/A2_C8_RS6_HAIRPIN_REVEAL.mp4",32,"bend continuation"),
("a2/A2_C8_RS6_MOUNTAIN_SWEEP.mp4",31,"full car forward momentum")
]
for rel,n,note in choices:
    f=SRC/rel
    if not f.is_file():raise FileNotFoundError(str(f))
args=["ffmpeg","-nostdin","-v","error","-y"]
for rel,n,note in choices:args+=["-i",str(SRC/rel)]
chain=[]
for idx,(rel,n,note) in enumerate(choices):
    chain.append(f"[{idx}:v]fps=30,trim=end_frame={n},setpts=N/(30*TB),scale=1080:1920:flags=lanczos,format=yuv420p[v{idx}]")
chain.append("".join(f"[v{i}]" for i in range(len(choices)))+f"concat=n={len(choices)}:v=1:a=0[out]")
mp4=OUT/"YUNEX_RS6_G_3_47S_SOURCE_PROOF_SILENT.mp4"
args+=["-filter_complex",";".join(chain),"-map","[out]","-an","-r","30","-c:v","libx264","-crf","16","-preset","veryfast","-pix_fmt","yuv420p","-movflags","+faststart",str(mp4)]
ff(args,180)
ff(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(mp4),"-f","null","-"],60)
ff(["ffmpeg","-nostdin","-v","error","-y","-i",str(mp4),"-vf","fps=5,scale=180:320,tile=6x3","-frames:v","1",str(OUT/"G_PROOF_CONTACT.jpg")],40)
qa={"stage":"SOURCE FIRST / proof is a test not a creative PASS","clip_count":len(entries),"proof_duration_frames":sum(c[1] for c in choices),"proof_sha256":hashlib.sha256(mp4.read_bytes()).hexdigest(),"shot_ids":[{"name":x[0],"frames":x[1],"description":x[2]} for x in choices],"source_rights":"owner-review only; NO public footage rights verified","full_decode":"PASS"}
(OUT/"PROOF_QA.json").write_text(json.dumps(qa,indent=2))
print(json.dumps(qa,indent=2))
