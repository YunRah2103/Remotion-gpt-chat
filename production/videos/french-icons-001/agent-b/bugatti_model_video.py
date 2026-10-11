#!/usr/bin/env python3
"""Bugatti manufacturer MODEL-SPECIFIC film acquisition.
Only native >=1080p decoded moving MP4s are eligible. Avoid site navigation header clips.
Exports original-bitstream FFmpeg excerpts and decoded timecode contact sheets, not fake upscales.
"""
from pathlib import Path
import requests,subprocess,json,hashlib,re,io,base64,csv,os,math,time
from PIL import Image,ImageDraw,ImageStat,ImageChops
OUT=Path("out/fr-legends-b-bugatti-model-films")
CLIPS=OUT/"clips";SHEETS=OUT/"contact_sheets"
for p in [CLIPS,SHEETS]:p.mkdir(parents=True,exist_ok=True)
FILMS=[
 ("Bugatti Bolide","Paul Ricard owners 2025","https://bugatti-newsroom.imgix.net/67cea1046578153cb3dd219c/feel-the-track-mood-cut.mp4","https://newsroom.bugatti.com/en/press-releases/feeling-the-track-bugatti-bolide-owners-take-on-circuit-paul-ricard"),
 ("Bugatti Bolide","Circuit of the Americas 2025","https://bugatti-newsroom.imgix.net/677d090d25230567383b7690/bugatti-bolide-at-cota-newsroom-hero.mp4","https://newsroom.bugatti.com/en/models/bolide"),
 ("Bugatti Bolide","Miami track owners 2026","https://bugatti-newsroom.imgix.net/69b03be2fcc6f41e3fecefa7/mood-cut-6.mp4?fm=mp4","https://newsroom.bugatti.com/en/models/bolide"),
 ("Bugatti Bolide","Bolide 16x9 official footage","https://bugatti-newsroom.imgix.net/4911fb29566a440e9500bc4ffa45a3fd/bugatti-bolide_16x9.mp4","https://newsroom.bugatti.com/en/models/bolide"),
 ("Bugatti Chiron Pur Sport","Hajar mountains 2021","https://bugatti-newsroom.imgix.net/ff4f718133924544b102075e85877031/hatta_bugatti_final.mp4","https://newsroom.bugatti.com/en/press-releases/video-release-bugatti-chiron-pur-sport-driving-in-the-hajar-mountains"),
 ("Bugatti Chiron Pur Sport","Bilster Berg press B roll 2020","https://bugatti-newsroom.imgix.net/c6293a56ef1b44a0b6686d13b120af03/chiron-pur-sport-at-bilster-berg-b-roll-web.mp4","https://newsroom.bugatti.com/en/models/chiron-pur-sport"),
 ("Bugatti Chiron Pur Sport","Pur Sport model demo","https://bugatti-newsroom.imgix.net/81af41e9e2564187929b9cf15ee543a5/bugatti-pur-sport.mp4","https://newsroom.bugatti.com/en/models/chiron-pur-sport"),
 ("Bugatti Chiron Pur Sport","Chiron Pur Sport model preview","https://bugatti-newsroom.imgix.net/6804dc63-64c5-4ebf-a9b8-e9dea446ffeb/chiron-pur-sport.mp4","https://newsroom.bugatti.com/en/models/chiron-pur-sport"),
 ("Bugatti Chiron Pur Sport","Nordschleife prototype development","https://bugatti-newsroom.imgix.net/86f436642cb4425aa4d8a22faa1e174a/chiron-pur-sport-prototype-nordschleife-development-drive-impressions_lq.mp4","https://newsroom.bugatti.com/en/models/chiron-pur-sport")
]
def cmd(a,t=70):
 p=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-500:])
 return p.stdout
def probe(x):
 j=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(x)],30))
 vid=next((s for s in j.get("streams",[]) if s["codec_type"]=="video"),None)
 if not vid:raise RuntimeError("video stream missing")
 return {"width":vid["width"],"height":vid["height"],"fps":vid.get("avg_frame_rate"),"video_codec":vid.get("codec_name"),"duration":float(j.get("format",{}).get("duration",0)),"bitrate":int(j.get("format",{}).get("bit_rate") or 0),"audio_present":any(s.get("codec_type")=="audio" for s in j.get("streams",[]))}
def hash_file(f):
 h=hashlib.sha256()
 with open(f,"rb") as file:
  for b in iter(lambda:file.read(1048576),b""):h.update(b)
 return h.hexdigest()
def contact(f,meta,stem):
 frames=[]
 for fraction in [.08,.18,.31,.44,.57,.7,.82,.93]:
  target=SHEETS/"temporary.jpg"
  seconds=round(meta["duration"]*fraction,3)
  cmd(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-ss",str(seconds),"-i",str(f),"-frames:v","1","-vf","scale=480:-2",str(target)],30)
  frames.append((seconds,Image.open(target).convert("RGB").copy()))
  target.unlink()
 diffs=[]
 for a,b in zip(frames,frames[1:]):
  diff=ImageChops.difference(a[1].resize((160,90)),b[1].resize((160,90)))
  diffs.append(sum(ImageStat.Stat(diff).mean)/3)
 score=round(sum(diffs)/len(diffs),2)
 if score<2.5:raise RuntimeError("motion check failed, likely still frames")
 rowh=frames[0][1].height+24
 sheet=Image.new("RGB",(480,rowh*len(frames)+24),"#111317");d=ImageDraw.Draw(sheet)
 d.text((10,4),stem,fill="white")
 for i,(seconds,frame) in enumerate(frames):
  y=24+i*rowh
  sheet.paste(frame,(0,y))
  d.text((6,y+frame.height),f"{seconds:.2f}s",fill="white")
 dest=SHEETS/(stem+"_eight_frames.jpg");sheet.save(dest,quality=78,optimize=True)
 return score,dest
report=[];keep=[]
for idx,(model,description,url,page) in enumerate(FILMS):
 label=f"{'bolide' if 'Bolide' in model else 'chiron-pur-sport'}-{idx:02d}"
 path=CLIPS/(label+".mp4")
 record={"model":model,"description":description,"source_url":url,"source_page":page}
 try:
  original_meta=probe(url)
  record["original_probe"]=original_meta
  if not (original_meta["width"]>=1920 and original_meta["height"]>=1080 and original_meta["width"]<=3840 and original_meta["height"]<=2160):
   raise RuntimeError(f"reject true source dimensions: {original_meta['width']}x{original_meta['height']}")
  if original_meta["duration"]<4:raise RuntimeError("too brief")
  cmd(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-i",url,"-t","35","-map","0:v:0","-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(path)],140)
  local=probe(path)
  if local["width"]<1920 or local["height"]<1080 or local["duration"]<3:raise RuntimeError("truncated/unreadable local")
  motion,sheet=contact(path,local,label)
  record.update({"file":"clips/"+path.name,"original_stream_preserved":True,"sha256":hash_file(path),"motion_score":motion,"qa":"PROVISIONAL: not yet human reviewed for actual car, CGI, watermarks or composition","preview_file":"contact_sheets/"+sheet.name,**local})
  keep.append(record.copy())
  record["result"]="DOWNLOADED_AND_DECODED"
 except Exception as e:
  record["result"]="REJECTED_OR_BLOCKED";record["error"]=str(e)[:430]
  path.unlink(missing_ok=True)
 report.append(record)
 print("BUGATTI_PROBE",json.dumps(record),flush=True)
(OUT/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False))
(OUT/"manifest.json").write_text(json.dumps(keep,indent=2,ensure_ascii=False))
keys=sorted(set(k for x in keep for k in x))
with (OUT/"manifest.csv").open("w",newline="") as f:
 w=csv.DictWriter(f,keys,extrasaction="ignore");w.writeheader();w.writerows(keep)
(OUT/"README.md").write_text(f"# Model-specific Bugatti original media\n\nActually downloaded and decoded: {len(keep)} manufacturer film clips; publisher original stream preserved in selected excerpt. Source URLs and SHA256 in manifest; human shot quality check PENDING. Rights unknown; public download is not reuse grant.\n")
print("BUGATTI_SUMMARY",json.dumps({"decoded":len(keep),"models":sorted(set(x["model"] for x in keep))}),flush=True)
for x in keep:
 f=Image.open(OUT/x["preview_file"]).convert("RGB")
 f.thumbnail((370,1300))
 b=io.BytesIO();f.save(b,"JPEG",quality=55,optimize=True)
 print("YUNEX_BUGATTI_FRAMES:"+x["file"]+":"+base64.b64encode(b.getvalue()).decode(),flush=True)
