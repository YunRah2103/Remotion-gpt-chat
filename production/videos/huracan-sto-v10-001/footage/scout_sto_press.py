#!/usr/bin/env python3
"""Inspect publisher page media references and one direct Lamborghini race-event MP4.
Do not mistake mixed-variant event video or any video with on-screen copy for approved STO shots.
"""
from pathlib import Path
import urllib.request,urllib.parse,re,json,html,subprocess,hashlib,zipfile
R=Path("out/sto-press-scout");R.mkdir(parents=True,exist_ok=True)
PAGES={
"lamborghini-press-track":"https://www.thenewsmarket.com/news/lamborghini-hurac-n-sto-finally-unleashed-first-test-drives-in-rome-and-at-the-autodromo-piero-taruf/s/ef10e4e3-9f7b-4226-8298-0d2682217951",
"lamborghini-press-launch":"https://www.thenewsmarket.com/news/racetrack-to-road--the-new-lamborghini-hurac-n-sto/s/b85db4c2-ffbd-43df-9cfa-b7a2c1fed4dc",
"format67-night":"https://format67.net/portfolio/lamborghini-huracan-sto-car-commercial/",
"lamborghini-official":"https://www.lamborghini.com/en-en/history/huracan-sto"
}
rows=[]
for key,url in PAGES.items():
 rec={"id":key,"url":url}
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
  with urllib.request.urlopen(req,timeout=18) as response:s=response.read(5_000_000).decode("utf-8","replace")
  s=html.unescape(s).replace("\\/","/")
  (R/(key+".html")).write_text(s)
  matches=re.findall(r'''(?:https?:)?(?:\\/\\/|//)[^"'<>\\s]{8,380}?(?:\\.mp4|\\.m3u8|player\\.vimeo\\.com[^"'<>\\s]{0,80}|youtube\\.com/embed/[^"'<>\\s]+)''',s,re.I)
  candidate_urls=re.findall(r'https?://[^"\\s<>]{5,450}',s,re.I)
  relevant=[x[:450] for x in candidate_urls if any(k in x.lower() for k in ("mp4","m3u8","vimeo","youtube","video/","lamborghini.com/original/"))]
  embeds=re.findall(r'<(?:iframe|video|source)[^>]{0,500}>',s,re.I)
  rec.update(html_bytes=len(s),media_links=list(dict.fromkeys(matches+relevant))[:100],
             embed_tags=embeds[:35],vimeo_ids=list(set(re.findall(r'(?:vimeo.com/video/|vimeo.com/)(\\d{7,13})',s)))[:12])
 except Exception as e:rec["error"]=str(e)
 rows.append(rec)
# An official Automobili Lamborghini snow-event publication with STO among multiple other models.
url="https://www.lambocars.com/wp-content/uploads/2022/02/lamb_52030_605610.mp4"
record={"id":"official-lamborghini-neve-event","url":url,"model_warning":"Event features Huracan EVO, STO and Urus; no source time-range verified as STO.","rights":"Research only"}
try:
 dest=R/"official-lamborghini-neve-event.mp4"
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 n=0
 with urllib.request.urlopen(req,timeout=22) as resp:
  if int(resp.headers.get("Content-Length") or 0)>230_000_000: raise ValueError("source too big")
  with dest.open("wb") as out:
   while True:
    chunk=resp.read(1024*1024)
    if not chunk:break
    n+=len(chunk)
    if n>230_000_000:raise ValueError("source exceeded cap")
    out.write(chunk)
 p=subprocess.run(["ffprobe","-v","error","-show_entries","stream=width,height,codec_name,avg_frame_rate:format=duration,bit_rate","-of","json",str(dest)],capture_output=True,text=True,timeout=30)
 info=json.loads(p.stdout);record.update(size=n,probe=info)
 if "streams" not in info:raise ValueError("invalid MP4")
 if info["streams"][0].get("width",0)<1920 or info["streams"][0].get("height",0)<1080:
  record["status"]="BELOW_FULL_HD_REJECT_FROM_EDITOR";dest.unlink()
 else:
  record["status"]="NEEDS_SHOT_BY_SHOT_STO_REVIEW"
  from PIL import Image,ImageDraw
  dur=float(info["format"]["duration"]);sheet=Image.new("RGB",(960,6*152),"#080808")
  for i in range(24):
   t=max(.01,min(dur-.03,dur*(i+.5)/24))
   frame=R/"temp.jpg"
   e=subprocess.run(["ffmpeg","-v","error","-nostdin","-y","-ss",str(t),"-i",str(dest),"-vf","scale=240:135","-frames:v","1",str(frame)],capture_output=True,timeout=40)
   if frame.exists():
    with Image.open(frame) as im:sheet.paste(im.convert("RGB"),((i%4)*240,(i//4)*152+17))
    ImageDraw.Draw(sheet).text(((i%4)*240+2,(i//4)*152+2),f"{t:.1f}s",fill="white")
    frame.unlink()
  sheet.save(R/"official-lamborghini-neve-event_contact.jpg",quality=83)
except Exception as e:
 record.update(status="FAILED",error=str(e))
 (R/"official-lamborghini-neve-event.mp4").unlink(missing_ok=True)
rows.append(record)
(R/"manifest.json").write_text(json.dumps(rows,indent=2))
with zipfile.ZipFile("out/STO_PRESS_SCOUT_RESEARCH.zip","w",zipfile.ZIP_STORED) as z:
 for p in R.rglob("*"):
  if p.suffix.lower() in {".json",".mp4",".jpg",".html"}:z.write(p,p.relative_to(R))
for x in rows:print(x["id"],x.get("status","SCOUT"),len(x.get("media_links",[])),x.get("error","")[:120])
