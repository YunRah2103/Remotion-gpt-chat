#!/usr/bin/env python3
"""Falken 2018 BMW M6 GT3 #33 source-level native HDR/4K proof.

Corrects an overly broad earlier rejection: t195/214 were Porsche, but t174
and t246 in the same source show a true BMW M6 GT3. Check the actual bits here.
"""
import hashlib,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
O=Path("out/gt3-bmw-authentic-4k");D=O/"native_source";S=O/"contact_sheets"
D.mkdir(parents=True,exist_ok=True);S.mkdir(parents=True,exist_ok=True)
URL="https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4"
clips=[
 dict(id="bmw_m6_gt3_2018_trackside_start_170s",start=170,length=12,angle="trackside front pan, Falken BMW with kidney grille",confidence="BMW model visually identified on historic contact sheet t174"),
 dict(id="bmw_m6_gt3_2018_pitlane_start_240s",start=240,length=12,angle="pitstop close-up BMW kidney grille, car #33",confidence="BMW M6 GT3 #33 visually identified contact t246; pit stop not on-track quota")
]
def run(c,timeout=200):
 p=subprocess.run(c,text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-1400:])
 return p.stdout
def sha(f):
 h=hashlib.sha256()
 with open(f,'rb') as fp:
  for x in iter(lambda:fp.read(2**20),b''):h.update(x)
 return h.hexdigest()
for c in clips:
 try:
  f=D/(c["id"]+".mkv")
  run(["ffmpeg","-hide_banner","-v","error","-nostdin","-y","-ss",str(c['start']),"-i",URL,"-t",str(c['length']),
       "-map","0:v:0","-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(f)],120)
  j=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],30))
  v=next(s for s in j["streams"] if s["codec_type"]=="video")
  assert int(v["width"])==3840 and int(v["height"])==2160
  assert float(j["format"]["duration"])>=8
  run(["ffmpeg","-v","error","-i",str(f),"-f","null","-"],120)
  page=Image.new("RGB",(900*2,530*3),"#080808")
  dr=ImageDraw.Draw(page)
  for k,secs in enumerate([1,3,5,7,9,11]):
   im=S/("_frame_%s_%s.jpg"%(c["id"],secs))
   run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(secs),"-i",str(f),"-frames:v","1",
    "-vf","zscale=t=linear:npl=100,format=gbrpf32le,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:p=bt709,format=yuv420p,scale=900:-2",str(im)],60)
   with Image.open(im) as fr:
    x=k%2*900;y=k//2*530
    page.paste(fr.convert("RGB"),(x,y+25));dr.text((x+10,y+5),f"Original source t={c['start']+secs}s",fill="white")
   im.unlink()
  contact=S/(c["id"]+"_6FRAMES_TONEMAPPED.jpg");page.save(contact,quality=89)
  c.update(status="NATIVE_4K_FULL_DECODED_VISUAL_QA_PENDING",native_resolution=[3840,2160],sha256=sha(f),bytes=f.stat().st_size,relative_file=str(f.relative_to(O)),
           contact_sheet=str(contact.relative_to(O)),ffprobe=j)
  print("ACQUIRED",c['id'],c['bytes'],c['sha256'],flush=True)
 except Exception as e:
  c["status"]="FAILED";c["error"]=str(e); print("FAILED",c['id'],str(e)[-250:],flush=True)
(O/"manifest.json").write_text(json.dumps(dict(original_source_url=URL,source="Falken 2018 Nürburgring 24h original 4K HDR",notes="Contact sheet t174 and t246 reveal distinct BMW M6 GT3 #33; incorrect earlier BMW attribution at t195/214 remains REJECTED. On-track t174 only eligible if independently reviewed.",clips=clips,gate="PENDING_VISUAL_QA"),indent=2)+"\n")
(O/"README.md").write_text("# BMW M6 GT3 2018 native HDR source samples\nOriginal: "+URL+"\nNative 4K bitstream copies, no upscale. Actual trackside around original t174s and pitstop around t246s.\nDo not count off-track pitstop as race camera angle. See source manifest and 6-frame sheet. Full video 2018 is different GT3 generation than 2026 M4 EVO; label M6 GT3.\n")
