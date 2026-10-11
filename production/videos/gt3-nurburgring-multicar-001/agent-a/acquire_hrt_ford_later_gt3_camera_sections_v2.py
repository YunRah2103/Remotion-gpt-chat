#!/usr/bin/env python3
"""Continue genuinely acquired HRT 1080p race movies after initial t=0..14s snippets.
Read source endpoints only from original verifiable, CRC-checked existing material package.
Recover native 1080 frames at NEW time windows, full-decode and visually review; no auto scene credit.
"""
from pathlib import Path
from PIL import Image,ImageDraw
from urllib.parse import urlparse
import zipfile,json,hashlib,subprocess,sys,os
ORIGIN=Path("inputs/actual_hrt_5_source_zips")
ROOT=Path("out/gt3-a-hrt-real-native-v2-longer-scenes")
VIDEO=ROOT/"NEW_NATIVE_1080_RACING_CANDIDATE_CLIPS";PICS=ROOT/"NEW_MOVIE_3FRAME_QUALIFICATION"
for p in (ROOT,VIDEO,PICS):p.mkdir(parents=True,exist_ok=True)
P=next(ORIGIN.rglob("GT3_A_HRT_GT3_BROWSER_ORIGINALS_AND_QA.zip"))
with zipfile.ZipFile(P) as z:
 assert z.testzip() is None
 meta=json.loads(z.read("SOURCE_MANIFEST.json"))
 for source in meta["sources"]:
  if source.get("status")=="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING":
   assert hashlib.sha256(z.read(source["file"])).hexdigest()==source["sha256"]
print("ORIGINALS_MANIFEST_CRC_VIDEO_SHAS_PASS",meta['native_hd_media_file_count'],flush=True)
def exec_(args,timeout=50):
 try:r=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 except subprocess.TimeoutExpired:raise RuntimeError("COMMAND_TIMEOUT "+str(args[:3]))
 if r.returncode:raise RuntimeError((r.stderr or r.stdout)[-650:])
 return r.stdout
def digest(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for chunk in iter(lambda:f.read(1<<20),b""):h.update(chunk)
 return h.hexdigest()
source_ids=["hrt_ford_highlights","hrt_24hnbr_topqualifying","hrt_24hnbr_night","hrt_24hnbr_start","hrt_24hnbr_finish"]
plan={
 "hrt_ford_highlights":[17,27,39,52,65,77],
 "hrt_24hnbr_topqualifying":[17,29,42,55,68],
 "hrt_24hnbr_night":[17,29,42,56,69,84,100,117],
 "hrt_24hnbr_start":[17,30,45,60,78,95],
 "hrt_24hnbr_finish":[17,30,45,60,73],
}
results=[];download_count=0
for id in source_ids:
 s=next(x for x in meta["sources"] if x["source_id"]==id)
 row={"id":id,"publisher_page":s["publisher_page"],"source_first14s_SHA":s.get("sha256"),"new_scenes":[]}
 if s.get('status')!="REAL_NATIVE_HD_FULL_DECODE_MODEL_REVIEW_PENDING":continue
 urls=[s.get("actual_media_url")]+s.get("detected_media_links",[])
 urls=list(dict.fromkeys(u for u in urls if isinstance(u,str) and u.startswith("https://")))
 if not urls:
  row["failure"]="ORIGINAL_SOURCE_NETWORK_URL_NOT_PRESENT_IN_VERIFIED_BROWSER_CAPTURE";results.append(row);continue
 url=urls[0]
 row["network_source_host"]=urlparse(url).netloc
 row["network_source_scheme"]=urlparse(url).scheme
 try:
  probe=exec_(["ffprobe","-v","error","-show_streams","-show_format","-of","json",url],25)
  pj=json.loads(probe)
  v=next(x for x in pj["streams"] if x["codec_type"]=="video")
  w,h=int(v["width"]),int(v["height"])
  duration=float(pj["format"].get("duration") or 0)
  row["actual_complete_original_seconds"]=duration
  row["actual_original_source_native_pixels"]=[w,h]
  if not (w>=1920 and h>=1080 and w>h):raise RuntimeError("ORIGINAL_STREAM_NOT_NATIVE_1920x1080")
  print("REAL_ORIGINAL_FILM",id,duration,f"{w}x{h}",row["network_source_host"],flush=True)
 except Exception as e:
  row["probe_error"]=str(e)[-450:]
  print("ORIGINAL_STREAM_FFPROBE_FAIL",id,row["probe_error"],flush=True)
  results.append(row);continue
 if duration<24:row["failure"]="ORIGINAL_SOURCE_TOO_SHORT_FOR_LATER_WINDOWS";results.append(row);continue
 for i,t in enumerate(plan[id]):
  if t>duration-2:continue
  if download_count>=27:break
  tag=id+"_"+str(t)
  target=VIDEO/(tag+".mp4")
  segment={"original_film_t":t,"status":"NOT_QUALIFIED"}
  try:
   # TRUE original codec stream copy: no upscales/rescales/reencodes. Time-seeking before input.
   exec_(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",url,
       "-t","6.5","-map","0:v:0","-an","-c:v","copy","-movflags","+faststart",str(target)],50)
   if target.stat().st_size<100000:raise RuntimeError("SOURCE_BYTES_BELOW_MIN")
   ff=json.loads(exec_(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(target)],25))
   vs=next(x for x in ff["streams"] if x["codec_type"]=="video")
   a,b=int(vs["width"]),int(vs["height"])
   if not (a>=1920 and b>=1080 and a>b):raise RuntimeError(f"SEGMENT_LOW_PIXEL_{a}x{b}")
   exec_(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(target),"-f","null","-"],45)
   seconds=float(ff["format"].get("duration") or 0)
   if seconds<1:raise RuntimeError("TOO_SHORT")
   image=Image.new("RGB",(1050,225),(5,5,5));draw=ImageDraw.Draw(image)
   for k in range(3):
    tm=seconds*(k+.5)/3
    shot=PICS/(tag+f"_tmp{k}.jpg")
    exec_(["ffmpeg","-nostdin","-v","error","-y","-ss",str(tm),"-i",str(target),
        "-frames:v","1","-vf","scale=350:197","-q:v","3",str(shot)],23)
    with Image.open(shot) as im:image.paste(im.convert("RGB"),(k*350,25))
    draw.text((k*350+5,2),f"{id} source~{t+tm:.1f}s",fill="white")
    shot.unlink(missing_ok=True)
   sheet=PICS/(tag+"_threeframe.jpg");image.save(sheet,quality=88)
   segment.update(status="REAL_NATIVE_HD_VIDEO_FULLY_DECODED_GT3_MAKE_CAMERA_QA_PENDING",
     file=str(target.relative_to(ROOT)),contact_sheet=str(sheet.relative_to(ROOT)),
     sha256=digest(target),bytes=target.stat().st_size,resolution=[a,b],
     source_approx_window=[t,t+seconds],duration_seconds=seconds)
   download_count+=1
   print("ACTUAL_NEW_1080_CANDIDATE",tag,segment["bytes"],segment["sha256"],flush=True)
  except Exception as e:
   segment["reason"]=str(e)[-400:]
   target.unlink(missing_ok=True)
   print("CANDIDATE_FAILED",tag,segment["reason"][-180:],flush=True)
  row["new_scenes"].append(segment)
 results.append(row)
(ROOT/"SOURCE_MANIFEST_LONGER_WINDOWS.json").write_text(json.dumps({
 "input":"HRT 5 true original full-HD videos previously SHA verified",
 "new_physical_1080_video_sections":download_count,
 "gt3_camera_count_approved_from_new_sections":0,
 "gt3_manufacturer_diversity_approved_from_new_sections":0,
 "sources":results,
 "constraints":"Only count actual visual GT3 cars at Nürburgring and independent camera views. HRT Ford Highlights combines different racing circuits; do not label all as Nordschleife."},indent=2,ensure_ascii=False)+"\n")
print("NEW_HRT_1080_ACTUAL_VIDEO_SECTIONS_FOUND",download_count,flush=True)
