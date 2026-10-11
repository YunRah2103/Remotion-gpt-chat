#!/usr/bin/env python3
"""Contact scan of full official Falken 2018 4K Nürburgring director-cut source.

Very large native HDR film (~2.35GB); HTTP-range seek 42 times, sample a frame,
HDR tone map only preview JPEGs, NOT delivered original race video pixels.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,subprocess,time
URL="https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4"
ROOT=Path("out/gt3-falken-2018-global-scan"); ROOT.mkdir(parents=True,exist_ok=True)
times=[i*9+3 for i in range(42)]
rows=[]
sheet=Image.new("RGB",(420*6,250*7),"#202020")
d=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
 output=ROOT/f"t_{int(t):03d}.jpg"
 command=["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
          "-ss",str(t),"-i",URL,"-frames:v","1",
          "-vf","zscale=t=linear:npl=100,format=gbrpf32le,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:p=bt709,format=yuv420p,scale=420:-2",
          str(output)]
 try:
  p=subprocess.run(command,capture_output=True,text=True,timeout=23)
  if p.returncode or not output.is_file():raise RuntimeError(p.stderr[-190:])
  with Image.open(output) as frame:
   frame=frame.convert("RGB")
   frame.thumbnail((420,226))
   col,row=(i%6),i//6
   sheet.paste(frame,(col*420,row*250+24))
   d.text((col*420+5,row*250+4),f"source t={t}s",fill="white")
  rows.append({"time":t,"status":"FRAME_DECODED","jpg":output.name})
  output.unlink(missing_ok=True)
  print("FRAME",t,"OK",flush=True)
 except Exception as exc:
  rows.append({"time":t,"status":"ERROR","detail":str(exc)[-200:]})
  print("FRAME",t,"REJECTED",str(exc)[-80:],flush=True)
sheet.save(ROOT/"GLOBAL_42FRAME_HDR_TONEMAPPED_CONTACT.jpg",quality=91)
(ROOT/"audit.json").write_text(json.dumps({"source":URL,"frames":rows,
   "claim":"42 frames across film sampled from real native 4K HTTP range, SDR preview tone mapped only; individual model identification and shot counting requires human review"},indent=2))
