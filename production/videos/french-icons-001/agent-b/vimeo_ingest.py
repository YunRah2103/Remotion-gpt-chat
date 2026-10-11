#!/usr/bin/env python3
"""Agent B: acquire independently filmed modern French cars, reject CGI and sub-1080p.
All hits provisional until decoded contact frames have been visually reviewed.
"""
import csv,hashlib,json,re,subprocess,sys,base64,io
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat,ImageChops
OUT=Path("out/fr-legends-modern-vimeo")
CLIPS=OUT/"clips";SHEETS=OUT/"contact_sheets"
for p in [OUT,CLIPS,SHEETS]:p.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ("Bugatti Chiron","Gijs Hartog / Amaan Films, independently shot", "https://vimeo.com/1020311160"),
 ("Bugatti Bolide","Philipp Rupprecht, track testing","https://vimeo.com/837902861"),
 ("Bugatti Chiron Pur Sport","Bugatti film repost, Hajar Mountains","https://vimeo.com/754664538"),
 ("Bugatti Chiron","Bugatti world record film repost","https://vimeo.com/754661735"),
 ("Peugeot 9X8","Peugeot Danmark, production intro","https://vimeo.com/834742947"),
 ("Peugeot 9X8","611 Nuts, Peugeot footage at reveal","https://vimeo.com/910747100"),
 ("Peugeot RCZ R","Ben Kaniewski, commercial production","https://vimeo.com/74195650"),
 ("Peugeot RCZ R","Soho Editors / xFilm","https://vimeo.com/210399389"),
 ("Bugatti Bolide","Independent source identity pending","https://vimeo.com/1103432945")
]
def cmd(arr,t=110):
 p=subprocess.run(arr,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-800:])
 return p.stdout
def ffprobe(path):
 d=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],25))
 v=next((i for i in d["streams"] if i["codec_type"]=="video"),None)
 if not v:raise RuntimeError("no video track")
 return {"width":v["width"],"height":v["height"],"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),"duration":float(d["format"].get("duration",0)),"bitrate":int(d["format"].get("bit_rate") or 0),"has_audio":any(i["codec_type"]=="audio" for i in d["streams"])}
def file_sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def contact(p,m,stem):
 times=[m["duration"]*v for v in (.12,.33,.54,.75,.91)]
 ims=[]
 for t in times:
  dst=SHEETS/(stem+"_frame.jpg")
  cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(round(t,2)),"-i",str(p),"-frames:v","1","-vf","scale=520:-2",str(dst)],30)
  im=Image.open(dst).convert("RGB").copy();dst.unlink()
  ims.append(im)
 diffs=[sum(ImageStat.Stat(ImageChops.difference(a.resize((160,90)),b.resize((160,90)))).mean)/3 for a,b in zip(ims,ims[1:])]
 mot=sum(diffs)/len(diffs)
 sheet=Image.new("RGB",(520,ims[0].height*len(ims)+26),"#1a1a1a")
 d=ImageDraw.Draw(sheet);d.text((10,5),stem,fill="white")
 for i,im in enumerate(ims):sheet.paste(im,(0,26+i*ims[0].height))
 fname=SHEETS/(stem+"_sheet.jpg")
 sheet.save(fname,quality=76,optimize=True)
 return round(mot,2),fname
results=[];rejected=[];seen=set()
for index,(model,credit,url) in enumerate(SOURCES):
 slug=re.sub("[^a-z0-9]+","-",model.lower()).strip("-")+"-"+str(index+1)
 original=CLIPS/(slug+".mp4")
 entry={"model":model,"source":url,"creator":credit}
 try:
  meta=json.loads(cmd(["yt-dlp","--skip-download","--no-warnings","--dump-single-json",url],35))
  description=(meta.get("description") or "").lower()
  title=(meta.get("title") or "").lower()
  if any(x in (description+" "+title) for x in ["cinema4d","full cgi","unreal engine","assetto corsa","octane render","3d animation","videogame","real-time render"]):
   raise RuntimeError("reject CGI/non-camera film per creator metadata")
  formats=meta.get("formats",[])
  potential=[f for f in formats if int(f.get("height") or 0)>=1080 and int(f.get("height") or 0)<=2160 and f.get("vcodec")!="none"]
  if not potential:raise RuntimeError("no native 1080p+ format exposed")
  cmd(["yt-dlp","--no-warnings","--no-playlist","--no-progress","-f","bestvideo[height>=1080][height<=2160]+bestaudio/best[height>=1080][height<=2160]","--merge-output-format","mp4","--download-sections","*00:00:00-00:01:10","-o",str(CLIPS/(slug+".%(ext)s")),url],190)
  if not original.exists():
   found=list(CLIPS.glob(slug+".*"))
   if not found:raise RuntimeError("yt-dlp returned without video")
   cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-i",str(found[0]),"-t","70","-c","copy",str(original)],60)
   if found[0]!=original:found[0].unlink(missing_ok=True)
  props=ffprobe(original)
  if not (1920<=props["width"]<=3840 and 1080<=props["height"]<=2160):
   raise RuntimeError("reject actual encoded frame geometry "+str(props["width"])+"x"+str(props["height"]))
  if props["duration"]<4:raise RuntimeError("source too short")
  signature=file_sha(original)
  if signature in seen:raise RuntimeError("byte-duplicate source")
  seen.add(signature)
  motion,sheet=contact(original,props,slug)
  if motion<2:raise RuntimeError("near-static source")
  results.append(dict(file="clips/"+original.name,source_url=url,title=meta.get("title"),model=model,creator=credit,provenance=meta.get("webpage_url"),license="Creator reuse permission not established",sha256=signature,source_cut_seconds=min(70.,float(meta.get("duration") or 70)),manual_identity_qa="PENDING",manual_composition_qa="PENDING",scene="manual timecodes pending",motion_score=motion,**props))
  entry["outcome"]="DECODED_PROVISIONAL";entry["dimensions"]=[props["width"],props["height"]]
 except Exception as e:
  entry["outcome"]="REJECTED_OR_BLOCKED";entry["reason"]=str(e)[:450]
  original.unlink(missing_ok=True)
 rejected.append(entry)
 print("VIMEO_SOURCE",json.dumps(entry),flush=True)
(OUT/"manifest.json").write_text(json.dumps(results,indent=2,ensure_ascii=False))
(OUT/"rejected.json").write_text(json.dumps(rejected,indent=2,ensure_ascii=False))
fields=sorted(set(x for item in results for x in item))
with (OUT/"manifest.csv").open("w",newline="") as f:
 writer=csv.DictWriter(f,fields);writer.writeheader();writer.writerows(results)
(OUT/"README.md").write_text("# FR Legends Agent B — independent cinematic footage candidates\n\nActual independently downloaded 1080p–4K source excerpts: "+str(len(results))+". **Visual selection and rights review pending**; successful FFprobe alone is not cinematography approval. Manifest records creator, source, codec and exact SHA. No CGI or upscales intentionally accepted.\n")
print("VIMEO_FINAL",json.dumps({"downloaded":len(results),"models":list(sorted(set(x["model"] for x in results)))}),flush=True)
for item in results:
 stem=Path(item["file"]).stem
 im=Image.open(SHEETS/(stem+"_sheet.jpg")).convert("RGB");im.thumbnail((420,1100))
 buf=io.BytesIO();im.save(buf,"JPEG",quality=53,optimize=True)
 print("YUNEX_NEW_CLIP_IMAGE:"+stem+":"+base64.b64encode(buf.getvalue()).decode(),flush=True)
