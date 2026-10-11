#!/usr/bin/env python3
"""YUNEX FR Legends Agent B: fetch publisher originals, verify actual MP4 media, retain evidence.
Only runs from the Agent B Actions branch. Never treats URLs or generated test patterns as footage."""
import csv, hashlib, json, os, re, subprocess, sys, time
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont, ImageStat, ImageChops

OUT=Path("out/fr-legends-modern")
CLIPS=OUT/"clips"
SHEETS=OUT/"contact_sheets"
for p in [OUT,CLIPS,SHEETS]:p.mkdir(parents=True,exist_ok=True)
session=requests.Session()
session.headers.update({"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36","Accept-Language":"en-GB,en;q=0.9"})
PAGES=[
 ("alpine-a110-r","Alpine A110 R","https://media.renault.ch/fr/article/21682"),
 ("alpine-a110-ultime","Alpine A110 R Ultime","https://media.renault.ch/fr/article/22057"),
 ("alpine-a110","Alpine A110","https://media.renault.ch/fr/10610/article/21473"),
 ("renault-megane","Renault Megane RS Trophy-R","https://media.renault.ch/fr/article/21139"),
 ("renault-megane-2","Renault Megane RS Trophy-R","https://media.renault.ch/fr/10574"),
 ("bugatti-bolide","Bugatti Bolide","https://newsroom.bugatti.com/en/models/bolide"),
 ("bugatti-chiron","Bugatti Chiron","https://newsroom.bugatti.com/en/models/chiron"),
 ("bugatti-veyron","Bugatti Veyron","https://newsroom.bugatti.com/en/models/veyron"),
 ("peugeot-9x8","Peugeot 9X8","https://www.media.stellantis.com/fr-fr/peugeot/press/la-peugeot-9x8-2024-devoile-une-nouvelle-silhouette-soulignee-par-une-livree-exceptionnelle"),
 ("peugeot-9x8-2","Peugeot 9X8","https://www.media.stellantis.com/fr-fr/peugeot-sport/press/peugeot-9x8-d-abord-un-projet-virtuel-de-15-267-fichiers-numeriques"),
 ("alpine-miami","Alpine A110","https://media.renault.ch/fr/article/21554"),
 ("alpine-a290-rallye","Alpine A290 Rallye","https://media.renault.ch/fr/10537/article/22049"),
 ("alpine-a290-test","Alpine A290","https://media.renault.ch/fr/10658/article/21918"),
 ("alpine-a290-cold","Alpine A290","https://media.renault.ch/fr/article/21830"),
 ("alpine-a290-rallye-release","Alpine A290 Rallye","https://media.renault.ch/fr/10596/article/22012"),
 ("renault-r5-turbo-3e","Renault R5 Turbo 3E","https://media.renault.ch/fr/article/21622"),
 ("bugatti-chiron-super-sport","Bugatti Chiron Super Sport","https://newsroom.bugatti.com/en/models/chiron-super-sport"),
 ("bugatti-chiron-pur-sport","Bugatti Chiron Pur Sport","https://newsroom.bugatti.com/en/models/chiron-pur-sport"),
 ("bugatti-chiron-300","Bugatti Chiron Super Sport 300+","https://newsroom.bugatti.com/en/models/chiron-super-sport-300"),
 ("bugatti-mistral","Bugatti W16 Mistral","https://newsroom.bugatti.com/en/models/w16-mistral"),
 ("peugeot-9x8-medialibrary","Peugeot 9X8","https://medialibrary.stellantis.com/peugeot/sharedBasket;jsessionid=898DDB447E227EF106E12FA65B88B8ED.10?token=baDILraQg"),
 ("peugeot-rcz-r","Peugeot RCZ R","https://www.media.stellantis.com/em-en/peugeot/press/the-peugeot-rcz-r")

]
def cmd(args,timeout=50):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-500:])
 return p.stdout
def probe(path):
 data=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],30))
 v=next((s for s in data.get("streams",[]) if s.get("codec_type")=="video"),None)
 if not v:raise RuntimeError("no video stream")
 a=any(s.get("codec_type")=="audio" for s in data.get("streams",[]))
 width,height=int(v.get("width",0)),int(v.get("height",0))
 dur=float(v.get("duration") or data["format"].get("duration") or 0)
 return {"width":width,"height":height,"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),"bitrate":int(data["format"].get("bit_rate") or 0),"duration":dur,"has_audio":a}
def quality(meta):
 w,h=meta["width"],meta["height"]; orient="landscape" if w>=h else "portrait"
 dims=(1920<=w<=3840 and 1080<=h<=2160) if orient=="landscape" else (1080<=w<=2160 and 1920<=h<=3840)
 ratio=max(w,h)/max(1,min(w,h))
 return dims and 1.5<ratio<2.2 and meta["duration"]>=2
def hash_file(f):
 h=hashlib.sha256()
 with f.open("rb") as stream:
  for b in iter(lambda:stream.read(1024*1024),b""):h.update(b)
 return h.hexdigest()
def frame(path,t,dst):
 cmd(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),"-i",str(path),"-frames:v","1","-vf","scale=480:-2",str(dst)],30)
 return Image.open(dst).convert("RGB")
def visual_report(path,meta,stem):
 times=[max(0.0,min(meta["duration"]-0.15,meta["duration"]*f)) for f in (.2,.5,.8)]
 ims=[]; tmp=[]
 for i,t in enumerate(times):
  p=SHEETS/(stem+"_"+str(i)+".jpg");tmp.append(p)
  ims.append(frame(path,t,p))
 if len(ims)!=3:return {"motion_score":0,"edge_score":0,"full_bleed_check":"pending"}
 diffs=[]
 for a,b in zip(ims,ims[1:]):
  x=ImageChops.difference(a.resize((160,90)),b.resize((160,90)))
  diffs.append(sum(ImageStat.Stat(x).mean)/3)
 edge=ImageStat.Stat(ims[1].filter(ImageFilter.FIND_EDGES)).var if False else None
 # Borders are hints only. Human inspection required before PASS.
 ratios=[]
 for im in ims:
  w,h=im.size; rows=[im.crop((0,0,w,max(4,h//18))),im.crop((0,h-max(4,h//18),w,h))]
  ratios.append(max(sum(ImageStat.Stat(row).mean)/3 for row in rows))
 sheet=Image.new("RGB",(480,ims[0].height*3+72),"#141414")
 draw=ImageDraw.Draw(sheet);draw.text((10,9),stem,fill="white")
 for i,im in enumerate(ims):sheet.paste(im,(0,32+i*ims[0].height))
 sheet.save(SHEETS/(stem+"_sheet.jpg"),quality=86)
 for p in tmp:p.unlink(missing_ok=True)
 return {"motion_score":round(sum(diffs)/len(diffs),2),"edge_score":edge,"border_brightness_hint":round(min(ratios),2),"full_bleed_check":"unverified_visual"}
def extract_links(url,html):
 soup=BeautifulSoup(html,"html.parser")
 found=[]
 def add(x,why):
  if not x or x.startswith(("data:","blob:","javascript:")):return
  x=urljoin(url,x.replace("&amp;","&"))
  if x not in [f["url"] for f in found]:found.append({"url":x,"from":why})
 for tag in soup.find_all(["video","source","iframe","a","meta"]):
  for attr in ["src","href","data-src","data-video","data-url","content","download","data-download-url","data-original","data-file"]:
   value=tag.get(attr,"")
   if not isinstance(value,str):continue
   if re.search(r"\.(mp4|mov|m3u8|webm)(?:[?&#]|$)",value,re.I):add(value,tag.name+"."+attr)
   elif attr in ("src","data-src") and tag.name=="iframe" and "youtu" not in value:add(value,"embedded_player")
 for match in re.findall(r'https?:\\?/\\?/[^\s"\'<>]+?(?:\.mp4|\.m3u8|\.webm)(?:\?[^"\'<>\\\s]*)?',html,re.I):
  add(match.replace("\\/","/"),"html_regex")
 for match in re.findall(r'["\']([^"\']+(?:\.mp4|\.m3u8|\.webm)(?:\?[^"\']*)?)["\']',html,re.I):add(match,"html_string")
 # Capture candidate JS snippets for later inspection; never claim footage from these.
 return found,{"video_nodes":len(soup.select("video")),"iframes":[x.get("src","")[:200] for x in soup.select("iframe")][:12],"video_context":[x.get_text(" ",strip=True)[:150] for x in soup.find_all(string=re.compile("Video|Télécharger|Download"))][:10]}
diagnostics=[]; records=[]; seen_sha=set();seen_urls=set()
for ident,model,page in PAGES:
 info={"source":page,"model":model,"id":ident,"links":[],"notes":[]}
 try:
  resp=session.get(page,timeout=20);resp.raise_for_status()
  links,details=extract_links(resp.url,resp.text)
  info["links"]=links[:60];info["html_details"]=details;info["status_code"]=resp.status_code
 except Exception as exc: info["notes"].append("Page read error: "+str(exc)[:220]);diagnostics.append(info);continue
 # Limit to video URLs discovered directly on publisher page; do not blindly download unrelated media.
 candidates=[link for link in links if re.search(r"\.(mp4|m3u8|mov|webm)(?:[?&#]|$)",link["url"],re.I)]
 for index,entry in enumerate(candidates[:6]):
  if len(records)>=35:break
  src=entry["url"];host=urlparse(src).hostname or ""
  if src in seen_urls:continue
  seen_urls.add(src)
  if not src.startswith("https://"):continue
  name=ident+"_"+str(index+1);dest=CLIPS/(name+".mp4"); temp=dest.with_suffix(".part")
  try:
   response=session.get(src,stream=True,timeout=(10,35))
   response.raise_for_status()
   if re.search("m3u8",src,re.I) or "mpegurl" in response.headers.get("Content-Type","").lower():
    response.close();cmd(["ffmpeg","-y","-hide_banner","-loglevel","error","-i",src,"-t","90","-c","copy",str(dest)],180)
   else:
    total=0
    with temp.open("wb") as f:
     for chunk in response.iter_content(1024*512):
      if chunk:
       total+=len(chunk)
       if total>350*1024*1024:raise RuntimeError("source over 350MB cap")
       f.write(chunk)
    temp.rename(dest)
   meta=probe(dest)
   if not quality(meta):raise RuntimeError("reject real dimensions/duration "+str(meta))
   digest=hash_file(dest)
   if digest in seen_sha:raise RuntimeError("duplicate exact source")
   seen_sha.add(digest)
   visual=visual_report(dest,meta,name)
   if visual["motion_score"]<2.0:raise RuntimeError("rejected: nearly static source frames "+str(visual["motion_score"]))
   record={"file":"clips/"+dest.name,"model":model,"creator":"Press media linked from "+urlparse(page).hostname,"source_page":page,"source_url":src,"sha256":digest,"source_original":True,"scene":"pending human angle/model review","year":"pending","variant":model,"in_seconds":0,"out_seconds":meta["duration"],"orientation":"landscape" if meta["width"]>=meta["height"] else "portrait","engine_audio_available":meta["has_audio"],"license":"publisher terms require review; download does not itself grant reuse rights","visual_review":"PROVISIONAL — manual car, bars, watermark and source originality review pending",**meta,**visual}
   records.append(record);info["notes"].append("DOWNLOADED verified video "+str(dest.name)+" "+str(meta["width"])+"x"+str(meta["height"]))
  except Exception as exc:
   info["notes"].append("Candidate "+str(index)+" "+src[:120]+" failed: "+str(exc)[:220])
   dest.unlink(missing_ok=True);temp.unlink(missing_ok=True)
 diagnostics.append(info)
 Path(OUT/"discovery.json").write_text(json.dumps(diagnostics,indent=2,ensure_ascii=False))
 Path(OUT/"manifest.json").write_text(json.dumps(records,indent=2,ensure_ascii=False))
fields=["file","model","creator","source_page","source_url","sha256","source_original","scene","year","variant","in_seconds","out_seconds","orientation","engine_audio_available","license","visual_review","width","height","fps","codec","bitrate","duration","has_audio","motion_score","border_brightness_hint","full_bleed_check"]
with (OUT/"manifest.csv").open("w",newline="") as f:
 w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore");w.writeheader();w.writerows(records)
from collections import Counter
counts=Counter(r["model"] for r in records)
gate="PARTIAL — provisional clips, human review required" if records else "BLOCKED — no decoded acceptable footage"
(OUT/"README.md").write_text("# FR Legends Agent B — Actual Media Acquisition\n\n"
 +f"Gate B: **{gate}**. Decoded original videos: {len(records)}; covered labelled models: {len(counts)}. Strict PASS not established until 18 distinct reviewed moving shots over >=5 models.\n\n"
 +"All media in clips/ were downloaded from actual URLs; no generated or upscaled placeholder media. Exact SHA256, source and media properties in manifest files. Contact sheets derive from actual decoded frames. Discovery diagnostics list failed attempts. Source licensing and visual identity/watermark checks still require human review.\n")
for item in diagnostics:
 print("PAGE_DIAGNOSTIC", item["id"], "links", len(item["links"]), "success", sum("DOWNLOADED" in note for note in item["notes"]), "candidate_urls", [rec["url"][:100] for rec in item["links"][:3]], "issues", item["notes"][:3])
print(json.dumps({"gate":gate,"downloaded":len(records),"models":dict(counts),"sources_checked":len(diagnostics)},indent=2))
