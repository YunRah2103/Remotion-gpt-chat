#!/usr/bin/env python3
"""Download actual direct MP4 Twitter-sourced original embeds from 2026 NLS/N24 reporting.
Both explicitly embedded on source pages, not invented; media contents and HD strict QA.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json,requests,subprocess,time
ROOT=Path("out/gt3-a-race-report-2026-originals")
OUT=ROOT/"native_verified_streams";S=ROOT/"contact_sheets"
for d in (ROOT,OUT,S):d.mkdir(parents=True,exist_ok=True)
T=[
 {"id":"nls_2026_mercedes_audi_battle","url":"https://campeones.com.ar/wp-content/uploads/2026/03/ssstwitter.com_1774109469230.mp4","article":"https://campeones.com.ar/max-verstappen-descalificado-tras-ganar-con-el-mercedes-en-nurburgring/","hint":"NLS 2026 Mercedes-AMG #3 battle Audi R8 LMS #16, visual content must be proved"},
 {"id":"n24_2026_verstappen_wet_merc","url":"https://campeones.com.ar/wp-content/uploads/2026/05/ssstwitter.com_1778967188274.mp4","article":"https://campeones.com.ar/tras-8-horas-de-carrera-el-mercedes-de-verstappen-se-ubica-segundo-en-nurburgring/","hint":"N24 2026 Mercedes-AMG GT3 #3 in wet Nordschleife racing"}
]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for k in iter(lambda:f.read(2**20),b''):h.update(k)
 return h.hexdigest()
def cmd(a,t=30):
 p=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-450:])
 return p.stdout
for x in T:
 p=OUT/(x["id"]+".mp4")
 try:
  with requests.get(x["url"],timeout=(10,30),stream=True,headers={"User-Agent":"Mozilla/5.0","Referer":x['article']}) as r:
   r.raise_for_status()
   sz=0
   with p.open('wb') as f:
    for piece in r.iter_content(1<<20):
     if piece:
      sz+=len(piece)
      if sz>120_000_000:raise RuntimeError("SOURCE_OVER_120MB_CAP")
      f.write(piece)
  z=json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
  v=next(y for y in z["streams"] if y["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  x.update(downloaded_size=p.stat().st_size,original_sha256=sha(p),width=w,height=h,video_codec=v.get("codec_name"),
           duration_seconds=float(z["format"].get("duration") or 0))
  if w<1920 or h<1080 or w<=h:raise ValueError(f"NATIVE_BELOW_HD_{w}x{h}")
  cmd(["ffmpeg","-nostdin","-v","error","-i",str(p),"-f","null","-"],min(150,max(40,int(x['duration_seconds']*3))))
  duration=x["duration_seconds"]
  board=Image.new("RGB",(960,630),(0,0,0));d=ImageDraw.Draw(board)
  for i in range(9):
   t=round(duration*(i+.4)/9,2)
   temp=S/(x['id']+"_"+str(i)+".jpg")
   cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(p),
       "-frames:v","1","-vf","scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2",str(temp)],25)
   with Image.open(temp) as im:board.paste(im.convert("RGB"),((i%3)*320,(i//3)*210+25))
   temp.unlink()
   d.text(((i%3)*320+3,(i//3)*210+4),f"{t}s {w}x{h}",fill="white")
  sheet=S/(x["id"]+"_9FRAME.jpg");board.save(sheet,quality=90)
  x.update(status="FULLY_DECODED_NATIVE_HD_VISUAL_GT3_QA_PENDING",contact_sheet=str(sheet.relative_to(ROOT)),ffprobe=z,media_file=str(p.relative_to(ROOT)))
  print("NEW_REAL_HD_VIDEO",x["id"],w,h,x['downloaded_size'],x["original_sha256"],flush=True)
 except Exception as exc:
  x.update(status="REJECTED_OR_BLOCKED",error=str(exc)[-500:])
  p.unlink(missing_ok=True)
  print("NOT_HD",x["id"],x.get('width'),x.get('height'),x["error"],flush=True)
(ROOT/"SOURCE_MANIFEST.json").write_text(json.dumps({"gate":"NO_MODEL_CREDIT_UNTIL_VISUAL_CONFIRMATION","actual_media":T,"notes":"2026 race article source, actual native dimensions, full decode and contact-sheet required. 720p not countable."},indent=2)+"\n")
