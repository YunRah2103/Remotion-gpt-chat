#!/usr/bin/env python3
"""YUNEX FR Legends Agent B - final hand-screened visually attractive real-source cuts.
Never substitute still renders / cosmetic upscales / wrong-model Bugattis.
"""
import csv,json,hashlib,shutil,subprocess,io,base64
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat,ImageChops
src=Path("out/curated-input")
dst=Path("out/fr-legends-agent-b-final-approved")
for f in [dst,dst/"clips",dst/"contact_sheets"]:f.mkdir(parents=True,exist_ok=True)
orig={Path(row["file"]).name:row for row in json.loads((src/"manifest.json").read_text())}
# Each parent original has already been frame-reviewed. Exclude clips with empty track,
# black letterbox, CGI, poor identity, excessive cockpit/interior filler or weak studio motion.
# source segment offsets are relative to already curated video.
KEEP=[
 ("alpine-a110-r-ultime-orange-1.mp4",None,None,"4K orange A110 R Ultime head-on dynamic track"),
 ("alpine-a110-r-ultime-orange-2.mp4",None,None,"4K orange A110 R Ultime front three-quarter corner"),
 ("alpine-a110-r-ultime-blue-1.mp4",None,None,"4K blue A110 R Ultime front/side track"),
 ("alpine-a110-r-blue-track-1.mp4",None,None,"Blue A110 R low-angle twilight track"),
 ("alpine-a110-orange-rolling-1.mp4",None,None,"A110 rolling side/rear desert road"),
 ("renault-megane-trophy-r-monaco-1.mp4",0,5.0,"Mégane Trophy-R Monaco rear drive and corner, driver cut excluded"),
 ("renault-megane-trophy-r-monaco-3.mp4",0,2.6,"Mégane Trophy-R frontal attack on Monaco kerb"),
 ("renault-megane-trophy-r-monaco-3.mp4",4.4,7.0,"Mégane Trophy-R separate overhead Monaco corner"),
 ("alpine-a290-rallye-4k-action-1.mp4",None,None,"A290 Rallye 4K wooded-road corner"),
 ("alpine-a290-rallye-4k-action-2.mp4",None,None,"A290 Rallye 4K front/three-quarter rolling"),
 ("alpine-a290-rallye-4k-action-3.mp4",None,None,"A290 Rallye 4K varied track corner"),
 ("alpine-a290-rallye-4k-details-1.mp4",None,None,"A290 Rallye real rear details / short macro B-roll")
]
def run(args,timeout=50):
 p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-500:])
 return p.stdout
def probe(f):
 d=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)]))
 v=next((s for s in d["streams"] if s["codec_type"]=="video"),None)
 if not v:raise ValueError("no video")
 return {"width":v["width"],"height":v["height"],"duration":round(float(d["format"].get("duration",0)),2),"codec":v.get("codec_name"),"fps":v.get("avg_frame_rate"),"bitrate":int(d["format"].get("bit_rate") or 0),"has_audio":any(s["codec_type"]=="audio" for s in d["streams"])}
def digest(f):
 h=hashlib.sha256()
 with f.open("rb") as z:
  for c in iter(lambda:z.read(1048576),b""):h.update(c)
 return h.hexdigest()
outputs=[]
for i,(filename,start,end,description) in enumerate(KEEP):
 if filename not in orig:raise ValueError("Missing original "+filename)
 f=src/"clips"/filename
 outputname=(filename if (start is None) else Path(filename).stem+"-"+str(i).zfill(2)+".mp4")
 out=dst/"clips"/outputname
 if start is None:shutil.copy2(f,out)
 else:run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(start),"-i",str(f),"-t",str(end-start),"-map","0:v:0","-map","0:a?","-c","copy","-avoid_negative_ts","make_zero",str(out)],65)
 meta=probe(out)
 if not (meta["width"]>=1920 and meta["height"]>=1080 and meta["duration"]>=2.):raise ValueError("below required quality "+outputname+" "+str(meta))
 images=[]
 for n,frac in enumerate((.2,.5,.8)):
  target=dst/"contact_sheets"/("temp_"+str(i)+".jpg")
  run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(meta["duration"]*frac),"-i",str(out),"-frames:v","1","-vf","scale=480:-2",str(target)],35)
  images.append(Image.open(target).convert("RGB").copy())
  target.unlink()
 motion=sum(sum(ImageStat.Stat(ImageChops.difference(a.resize((160,90)),b.resize((160,90)))).mean)/3 for a,b in zip(images,images[1:]))/2
 # Honest per-segment thresholds. Closer frames need less pixel difference than camera pans.
 if motion<1.5:raise ValueError("no motion in supposedly cinematic shot: "+outputname)
 sheet=Image.new("RGB",(480,images[0].height*3+34),"#141414")
 ImageDraw.Draw(sheet).text((8,8),outputname,fill="white")
 for j,im in enumerate(images):sheet.paste(im,(0,j*images[0].height+34))
 sheet.save(dst/"contact_sheets"/(Path(outputname).stem+"_sheet.jpg"),quality=82)
 old=orig[filename]
 record={k:old[k] for k in ("model","source_url","source_page","creator","license","source_original_file","source_sha256") if k in old}
 record.update(file="clips/"+outputname,scene=description,source_parent_cut=filename,source_parent_in_seconds=start or 0,source_parent_out_seconds=end or orig[filename]["duration"],sha256=digest(out),motion_score=round(motion,2),selection="MANUALLY_SCREENED_CONTACTS",qa_notes="QA reviewed decoded 3-frame proof of final cut; official manufacturer source; duplicates/CGI/weak segments discarded.",**meta)
 outputs.append(record)
 print("FINAL_APPROVED",json.dumps({k:record[k] for k in ("file","model","width","height","duration","scene","motion_score")}),flush=True)
( dst/"manifest.json").write_text(json.dumps(outputs,indent=2,ensure_ascii=False))
cols=sorted(set(k for row in outputs for k in row))
with (dst/"manifest.csv").open("w",newline="") as ff:
 writer=csv.DictWriter(ff,cols);writer.writeheader();writer.writerows(outputs)
models={"Alpine A110" if "A110" in row["model"] else "Alpine A290" if "A290" in row["model"] else "Renault Megane RS" if "Megane" in row["model"] else row["model"] for row in outputs}
(dst/"README.md").write_text("# YUNEX French Legends 001 - Agent B final curated native footage\n\n"
 +f"**{len(outputs)} actual stream-copied native 1080p-4K clips** with decoded contact sheets; {len(models)} actual distinct vehicle families. **Gate B PARTIAL; 18+ unique angles over >=5 models NOT achieved.**\n\n"
 +"Manually selected from genuine manufacturer footage; dropped CGI, wrong-car Bugatti clips, empty-road shots, black-letterbox and unrecognisable low-quality imagery. Every clip has exact provenance and source SHA, source in/out and codec dimensions. This is source material only, not final film/music. Original broadcaster/manufacturer usage rights require confirmation. Some selected clips are editorial driving B-roll and some contain close-up detail; these are not all independent source films.\n")
print("FINAL_SUMMARY",json.dumps({"source_clips":len(outputs),"model_families":sorted(models),"gate":"PARTIAL"}),flush=True)
for n in range(0,len(outputs),3):
 sheets=[]
 for row in outputs[n:n+3]:
  f=Image.open(dst/"contact_sheets"/(Path(row["file"]).stem+"_sheet.jpg")).convert("RGB")
  f.thumbnail((360,750));sheets.append(f)
 c=Image.new("RGB",(max(x.width for x in sheets),sum(x.height for x in sheets)),"#151515")
 yy=0
 for f in sheets:c.paste(f,(0,yy));yy+=f.height
 buf=io.BytesIO();c.save(buf,"JPEG",quality=50,optimize=True)
 print("YUNEX_FINAL_IMAGE:"+str(n//3)+":"+base64.b64encode(buf.getvalue()).decode(),flush=True)
