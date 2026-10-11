#!/usr/bin/env python3
"""Target native 4K BMW M6 GT3 on-track Falken 2018 Nürburgring source excerpts."""
import subprocess,json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
URL="https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4"
OUT=Path("out/gt3-falken-bmw4k"); OUT.mkdir(parents=True,exist_ok=True)
def run(args,timeout=90):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-450:])
 return p.stdout
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for x in iter(lambda:f.read(2**20),b''):h.update(x)
 return h.hexdigest()
manifest=[]
page=Image.new("RGB",(600*3,370*2),"#1c1c1c");d=ImageDraw.Draw(page)
for i,t in enumerate([195,214]):
 tag=f"falken_bmw_gt3_{t}s"
 dest=OUT/(tag+".mkv")
 rec={"source_url":URL,"time":t,"id":tag,"status":"FAILED"}
 try:
  run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",URL,
        "-t","8","-map","0:v:0","-map","0:a?","-c","copy",
        "-avoid_negative_ts","make_zero",str(dest)],timeout=105)
  info=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(dest)],timeout=20))
  v=next(x for x in info["streams"] if x["codec_type"]=="video")
  assert int(v["width"])==3840 and int(v["height"])==2160, "Not 4K native"
  rec.update(status="4K_SOURCE_DOWNLOADED_VISUAL_GT3_ID_PENDING",file=dest.name,bytes=dest.stat().st_size,
             sha256=sha(dest),duration=info["format"].get("duration"),video_codec=v.get("codec_name"),
             pixel_format=v.get("pix_fmt"),color_transfer=v.get("color_transfer"),
             original_3840_by_2160=True)
  for k,offset in enumerate([1.4,3.8,6.0]):
   frame=OUT/f"{tag}_{k}.jpg"
   run(["ffmpeg","-nostdin","-v","error","-y","-ss",str(offset),"-i",str(dest),
        "-frames:v","1","-vf","zscale=t=linear:npl=100,format=gbrpf32le,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:p=bt709,format=yuv420p,scale=600:-2",str(frame)],timeout=40)
   with Image.open(frame) as img:
    x=(k%3)*600;y=i*370
    page.paste(img.convert("RGB"),(x,y+22));d.text((x+5,y+5),tag+f" sample {offset}s",fill='white')
   frame.unlink(missing_ok=True)
  print("BMW_NATIVE_4K",tag,rec["bytes"],flush=True)
 except Exception as e:
  dest.unlink(missing_ok=True);rec['error']=str(e)
  print("BMW_REJECTED",tag,str(e)[-350:],flush=True)
 manifest.append(rec)
page.save(OUT/"BMW_GT3_6FRAME_NATIVE_HDR_TONEMAPPED_PREVIEW.jpg",quality=89)
(OUT/"manifest.json").write_text(json.dumps({"note":"Two source excerpt sections; no assertion of distinct camera count until human scene review","clips":manifest},indent=2)+"\n")
