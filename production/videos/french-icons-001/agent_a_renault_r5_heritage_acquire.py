#!/usr/bin/env python3
"""Acquire PUBLIC Renault classic R5 Turbo heritage film streams using publisher linked Vimeo ids.
No login, cookies, DRM, bypass, or reinterpretation of 1980 classic as Turbo3E permitted.
HD technical passes are NOT visual/identity/license passes.
"""
from pathlib import Path
import urllib.request, urllib.parse, re, json, subprocess, hashlib, zipfile, csv
from fractions import Fraction
P=Path("out/fr-agent-a-r5-press");RAW=P/"originals";PROOF=P/"contact_sheets"
for q in (RAW,PROOF):q.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {"id":"r5-1980-heritage-press","vimeo_id":826339098,"page":"https://presse.renault.de/40-jahre-turbo-saga-bei-renault/?lang=deu","claimed":"Classic Renault 5 Turbo (press retrospective, identity verify)"},
 {"id":"r5-2025-history-video","vimeo_id":1048836786,"page":"https://media.renault.it/alla-scoperta-delle-origini-di-renault-5-turbo-e-turbo-2-2-parte/?lang=ita","claimed":"Renault 5 Turbo Turbo2 rally history (identity verify)"}
]
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for ch in iter(lambda:f.read(1048576),b""):h.update(ch)
 return h.hexdigest()
def fetch(url,ref,n=1_000_000):
 with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0","Referer":ref}),timeout=33) as r:
  return r.read(n)
def run(args,t=180):
 p=subprocess.run(args,timeout=t,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[-500:])
 return p.stdout
def ffprobe(p):
 d=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
 v=next(s for s in d["streams"] if s.get("codec_type")=="video")
 f=v.get("avg_frame_rate","0/1")
 return {"width":int(v["width"]),"height":int(v["height"]),"fps":round(float(Fraction(f)),3),
         "duration":round(float(d["format"]["duration"]),3),"codec":v.get("codec_name"),
         "bit_rate":int(d["format"].get("bit_rate") or 0),"audio":any(s.get("codec_type")=="audio" for s in d["streams"])}
report=[]
for source in SOURCES:
 row={**source,"status":"BLOCKED","visual_model_verified":False,"clean_moving_angles_accepted":0}
 try:
  base="https://player.vimeo.com/video/"+str(source["vimeo_id"])+"/config"
  cfg=json.loads(fetch(base,source["page"],3_000_000))
  row["public_title"]=cfg.get("video",{}).get("title","")
  file=(cfg.get("request") or {}).get("files") or {}
  hls=(file.get("hls") or {}).get("cdns") or {}
  streams=[]
  for name,meta in hls.items():
   if not meta.get("url"):continue
   try:
    master=fetch(meta["url"],"https://player.vimeo.com/",250000).decode("utf-8","replace")
    lines=master.splitlines()
    for i,line in enumerate(lines[:-1]):
     if line.startswith("#EXT-X-STREAM-INF:") and "RESOLUTION=" in line:
      m=re.search(r"RESOLUTION=(\d+)x(\d+)",line)
      if m:
       streams.append({"width":int(m.group(1)),"height":int(m.group(2)),
                       "url":urllib.parse.urljoin(meta["url"],lines[i+1].strip()),"cdn":name})
   except Exception as e:row.setdefault("cdn_error",[]).append(str(e)[:100])
  row["available_sizes"]=sorted(set((x["width"],x["height"]) for x in streams))
  print("R5_FORMAT",source["id"],row["public_title"],row["available_sizes"],flush=True)
  cand=next((x for x in streams if x["width"]==1920 and x["height"]==1080),None)
  if not cand:raise RuntimeError("NO_PUBLIC_NATIVE_1080")
  target=RAW/(source["id"]+".mp4")
  run(["ffmpeg","-hide_banner","-loglevel","error","-y","-headers",
       "Referer: https://player.vimeo.com/\r\nUser-Agent: Mozilla/5.0\r\n",
       "-i",cand["url"],"-t","100","-map","0:v:0","-map","0:a?","-c","copy",str(target)],250)
  p=ffprobe(target)
  if (p["width"],p["height"])!=(1920,1080) or p["fps"]<23:raise RuntimeError("FFPROBE_UNDER_NATIVE_HD")
  run(["ffmpeg","-hide_banner","-loglevel","error","-xerror","-i",str(target),"-f","null","-"],210)
  row.update({"status":"HD_TECHNICAL_PASS_NEEDS_HUMAN_VISUAL_IDENTITY_AND_RIGHTS",
              "probe":p,"sha256":sha(target),"original_file":str(target.relative_to(P))})
  from PIL import Image,ImageDraw
  canvas=Image.new("RGB",(1480,1300),"#111318")
  d=ImageDraw.Draw(canvas);d.text((10,5),row["public_title"][:120],fill="white")
  for i in range(10):
   t=p["duration"]*(i+.5)/10
   f=PROOF/(source["id"]+"-"+str(i)+".jpg")
   run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(round(t,3)),"-i",str(target),
        "-frames:v","1","-vf","scale=720:-2",str(f)],75)
   with Image.open(f) as im:
    im=im.convert("RGB");im.thumbnail((720,245));canvas.paste(im,((i%2)*740,(i//2)*255+20))
   f.unlink()
  proof=PROOF/(source["id"]+"-ten-frames.jpg");canvas.save(proof,quality=88)
  row["contact_sheet"]=str(proof.relative_to(P))
  print("R5_REAL_HD",source["id"],json.dumps(p),row["sha256"],flush=True)
 except Exception as ex:
  row["error"]=str(ex)[:600]
  print("R5_REJECT",source["id"],row["error"],flush=True)
 report.append(row)
 (P/"manifest.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
(P/"README.md").write_text("Real Renault R5 Turbo heritage press video sources. All files technical only until visually reviewed and rights agreed. Do not mistake later 3E electric car for original Turbo/Turbo 2.\n")
z=Path("out/FR-LEGENDS-A-RENAULT-5-TURBO-HERITAGE-HQ-SOURCES.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_STORED) as arc:
 for f in P.rglob("*"):
  if f.is_file():arc.write(f,f.relative_to(P))
print("R5_FINAL",json.dumps({"technical_pass":sum(x["status"].startswith("HD_") for x in report),"archive_bytes":z.stat().st_size,"gate_pass":False}),flush=True)
