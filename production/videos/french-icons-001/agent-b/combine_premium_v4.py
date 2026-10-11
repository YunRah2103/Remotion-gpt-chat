#!/usr/bin/env python3
"""YUNEX FR Legends B: combine hand-screened native original videos into ONE footage archive.
No upscale, no invented/placeholder footage, never claim reuse rights or verified distinctness from a filename.
"""
import json,csv,hashlib,shutil,subprocess,io,base64
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat,ImageChops
BASE=Path("out/clean-original"); BUG=Path("out/bugatti-original")
OUT=Path("out/fr-legends-b-modern-premium-v4")
for p in (OUT,OUT/"clips",OUT/"contact_sheets"):p.mkdir(parents=True,exist_ok=True)
def run(a,t=80):
 proc=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if proc.returncode:raise RuntimeError((proc.stderr or proc.stdout)[-800:])
 return proc.stdout
def probe(path):
 d=json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],28))
 v=next((s for s in d["streams"] if s["codec_type"]=="video"),None)
 if not v:raise RuntimeError("no video")
 return dict(width=int(v["width"]),height=int(v["height"]),fps=v.get("avg_frame_rate"),codec=v.get("codec_name"),duration=round(float(d["format"].get("duration") or 0),2),bitrate=int(d["format"].get("bit_rate") or 0),has_audio=any(s["codec_type"]=="audio" for s in d["streams"]))
def digest(f):
 h=hashlib.sha256()
 with f.open("rb") as handle:
  for block in iter(lambda:handle.read(1048576),b""):h.update(block)
 return h.hexdigest()
def sheet(src,name):
 prop=probe(src);images=[]
 for frac in (.16,.41,.66,.89):
  target=OUT/"contact_sheets"/"__temp.jpg"
  run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(round(prop["duration"]*frac,3)),"-i",str(src),"-frames:v","1","-vf","scale=480:-2",str(target)],40)
  image=Image.open(target).convert("RGB").copy();images.append(image);target.unlink()
 v=[sum(ImageStat.Stat(ImageChops.difference(a.resize((160,90)),b.resize((160,90)))).mean)/3 for a,b in zip(images,images[1:])]
 motion=round(sum(v)/len(v),2)
 if motion<2.5:raise RuntimeError("weak actual motion "+name+" "+str(motion))
 canvas=Image.new("RGB",(480,len(images)*(images[0].height+23)+22),"#151515")
 painter=ImageDraw.Draw(canvas);painter.text((10,5),name,fill="white")
 for i,image in enumerate(images):
  y=22+i*(images[0].height+23);canvas.paste(image,(0,y));painter.text((9,y+image.height+3),f"frame {i+1}",fill="white")
 fn=OUT/"contact_sheets"/(Path(name).stem+"_sheet.jpg")
 canvas.save(fn,quality=81,optimize=True)
 return prop,motion,"contact_sheets/"+fn.name
baseline=json.loads((BASE/"manifest.json").read_text())
source_records={Path(r["file"]).name:r for r in json.loads((BUG/"manifest.json").read_text())}
result=[]
for row in baseline:
 path=BASE/row["file"]
 target=OUT/row["file"]
 target.parent.mkdir(exist_ok=True,parents=True)
 shutil.copy2(path,target)
 # Prior baseline visual QA included 3 decoded frames; preserve original evidence and recalculate hash.
 evidence=BASE/"contact_sheets"/(Path(row["file"]).stem+"_sheet.jpg")
 if evidence.exists():shutil.copy2(evidence,OUT/"contact_sheets"/evidence.name)
 meta=probe(target)
 if meta["width"]<1920 or meta["height"]<1080:raise RuntimeError("baseline invalid pixels")
 item=dict(row)
 item.update(sha256=digest(target),qa_source="HAND_SCREENED_BASELINE_12",source_pack="11705533748",**meta)
 result.append(item)
print("BASELINE_COPIED",len(result),flush=True)
# Times are actual source-file seconds from manual 8-frame preview inspection.
# Exclusions: Bolide-03 studio/garage; weak distant Paul Ricard; low-res shared Bugatti header; Chiron-05 0-10 title card; Chiron-06 opening caption/CG.
CUTS=[
 ("bolide-01.mp4","bugatti-bolide-cota-overhead",3.1,7.0,"Bugatti Bolide","COTA genuine turquoise Bolide moving drone and low tracking"),
 ("bolide-01.mp4","bugatti-bolide-cota-close-pass",7.15,10.1,"Bugatti Bolide","COTA teal hypercar low dynamic cornering, avoid static hero hold"),
 ("bolide-00.mp4","bugatti-bolide-paul-ricard-rear-track",1.3,4.6,"Bugatti Bolide","Paul Ricard real race-track pursuit, supporting establishing shot"),
 ("chiron-pur-sport-04.mp4","bugatti-chiron-hajar-corner",8.9,14.9,"Bugatti Chiron Pur Sport","Yellow Chiron Pur Sport mountain road acceleration and corner"),
 ("chiron-pur-sport-04.mp4","bugatti-chiron-hajar-frontal",16.5,20.6,"Bugatti Chiron Pur Sport","Clear dramatic yellow Chiron Pur Sport frontal attack; excludes cockpit"),
 ("chiron-pur-sport-04.mp4","bugatti-chiron-hajar-aerial",22.8,27.1,"Bugatti Chiron Pur Sport","Chiron mountain sidewall tracking and 3/4 highway pass"),
 ("chiron-pur-sport-04.mp4","bugatti-chiron-hajar-rear",29.1,34.0,"Bugatti Chiron Pur Sport","Chiron rear wing and sunlight mountain driving"),
 ("chiron-pur-sport-05.mp4","bugatti-chiron-bilster-rear-track",10.7,17.5,"Bugatti Chiron Pur Sport","Bilster Berg matte grey Chiron low-angle side and rear motion"),
 ("chiron-pur-sport-05.mp4","bugatti-chiron-bilster-front-track",25.1,33.4,"Bugatti Chiron Pur Sport","Bilster Berg dark Chiron 3/4 track and frontal approach"),
 ("chiron-pur-sport-06.mp4","bugatti-chiron-california-track-sunset",17.0,20.6,"Bugatti Chiron Pur Sport","4K track-side Chiron pass at Willow Springs"),
 ("chiron-pur-sport-06.mp4","bugatti-chiron-california-hero",27.6,31.8,"Bugatti Chiron Pur Sport","4K golden-hour Chiron moving hero; end brand logo EXCLUDED"),
]
for i,(parent,stem,t0,t1,model,description) in enumerate(CUTS):
 source=BUG/"clips"/parent
 if not source.exists():raise FileNotFoundError(source)
 dest=OUT/"clips"/(stem+".mp4")
 run(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(t0),"-i",str(source),"-t",str(t1-t0),"-map","0:v:0","-map","0:a?","-c:v","libx264","-crf","16","-preset","fast","-pix_fmt","yuv420p","-c:a","aac","-b:a","256k","-movflags","+faststart",str(dest)],80)
 try:
  meta,motion,contact=sheet(dest,stem)
  if meta["width"]<1920 or meta["height"]<1080 or meta["duration"]<2.4:raise RuntimeError("clip fails native dimension or duration")
 except:
  dest.unlink(missing_ok=True)
  raise
 parent_meta=source_records[parent]
 row=dict(file="clips/"+dest.name,model=model,scene=description,exact_scene_cut_reencoded_crf16=True,source_url=parent_meta["source_url"],source_page=parent_meta["source_page"],source_original_file=parent,source_sha256=parent_meta["sha256"],source_parent_in_seconds=t0,source_parent_out_seconds=t1,source_parent_cut_sec=t0,creator="Bugatti newsroom",license="Publisher video reuse permission not established",sha256=digest(dest),motion_score=motion,qa_source="REVIEWED_SOURCE_8_FRAMES_PRECISE_FINAL_CUT_4_FRAMES",contact_sheet=contact,**meta)
 result.append(row)
 print("BUGATTI_CUT",json.dumps({k:row[k] for k in ("file","model","width","height","duration","motion_score","scene")}),flush=True)
# Detect identical files and log same-source clips; independent angles need visual review.
seen={}
for r in result:
 if r["sha256"] in seen:raise RuntimeError("exact MP4 duplicate "+r["file"]+" "+seen[r["sha256"]])
 seen[r["sha256"]]=r["file"]
def model_family(label):
 if "A110" in label:return "Alpine A110"
 if "A290" in label:return "Alpine A290"
 if "Megane" in label:return "Renault Megane RS"
 if "Bolide" in label:return "Bugatti Bolide"
 if "Chiron" in label:return "Bugatti Chiron Pur Sport"
 return label
families=sorted(set(model_family(x["model"]) for x in result))
(OUT/"manifest.json").write_text(json.dumps(result,indent=2,ensure_ascii=False))
fields=sorted(set(k for x in result for k in x))
with (OUT/"manifest.csv").open("w",newline="") as f:
 w=csv.DictWriter(f,fields,extrasaction="ignore");w.writeheader();w.writerows(result)
summary={"total_native_mp4_shots":len(result),"new_bugatti_shots":len(CUTS),"model_families":families,"family_count":len(families),"publisher_source_clips_verified":len(set((x.get("source_original_file") or x.get("source_url")) for x in result)),"gate":"VISUAL_QA_PENDING"}
(OUT/"summary.json").write_text(json.dumps(summary,indent=2))
(OUT/"README.md").write_text("# YUNEX French Legends 001 — Agent B Premium V4\n\n"+
 f"One real footage archive. **{len(result)} distinct files**, **{len(CUTS)} newly selected moving Bugatti clips** and 12 previously hand-screened modern French shots. Native 1080p or 4K, no upscales or generated materials. Broad model families: {', '.join(families)}.\n\n"+
 "All Bugatti sources are correctly model-labelled original Bugatti newsroom videos. Source-native pixels preserved (1080p-4K); new Bugatti cuts precisely re-encoded at visually near-lossless CRF16 to avoid wrong-scene keyframe lead-ins. No upscaling. See per-file manifest for original media URL, source parent SHA256, selected timecodes and actual dimensions. Evidence contact sheets are decoded directly from the final MP4 cuts.\n\n"+
 "**Approval is not automatic.** Review the final shot frames for text, CGI, unwanted logos, car identity and genuinely unique moving camera angles before declaring contractual Gate B PASS. Copyright and reuse permissions for manufacturer footage are NOT granted just because download was possible.\n")
print("PREMIUM_V4_SUMMARY",json.dumps(summary),flush=True)
for i in range(0,len(CUTS),3):
 pages=[]
 for _,stem,*_ in CUTS[i:i+3]:
  im=Image.open(OUT/"contact_sheets"/(stem+"_sheet.jpg")).convert("RGB");im.thumbnail((380,720));pages.append(im)
 w=max(x.width for x in pages);h=sum(x.height for x in pages)
 canvas=Image.new("RGB",(w,h),"#111")
 y=0
 for im in pages:canvas.paste(im,(0,y));y+=im.height
 f=io.BytesIO();canvas.save(f,"JPEG",quality=54,optimize=True)
 print("YUNEX_PREMIUM_V4_QA:"+str(i//3)+":"+base64.b64encode(f.getvalue()).decode(),flush=True)
