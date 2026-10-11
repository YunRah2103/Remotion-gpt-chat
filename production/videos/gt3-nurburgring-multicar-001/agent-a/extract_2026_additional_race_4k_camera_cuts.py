#!/usr/bin/env python3
"""Extract actual new N24 2026 4K race-camera angles without false GT3 Cup identity claims."""
import subprocess,json,requests,hashlib,zipfile,io,base64
from pathlib import Path
from PIL import Image,ImageDraw
URL="https://newstv.porsche.com/porschevideos/newstv.porsche.com_334111_en.mp4"
EXPECTED="0da8d5961152aa7e520873c26318c35ce1851a1eed5a2bebdcfff74f9cdbb10f"
R=Path("out/gt3-a-2026-extra-new-native4k-race-scenes")
SOURCE=R/"private_temp_original_4k.mp4";VIDEO=R/"editor_race_camera_candidates";PHOTO=R/"native_frame_qa"
for p in (R,VIDEO,PHOTO):p.mkdir(parents=True,exist_ok=True)
scenes=[
 {"id":"PORSCHE_2026_CAREFULLY_REVIEW_MINT_WHITE_REAR_BEND","t":44.7,"duration":2.35,"status":"RACE_CAR_GT3R_CLASS_INDEPENDENT_ID_PENDING","id_note":"Wide rear corner of mint white 911 racecar t45.0/46.4. Compared with prior V5 2026 square-film mint Porsche FRONT shot; angle here is rear overhead new camera. Still verify exact homologation race class before adding to gate."},
 {"id":"PORSCHE_2026_CAREFULLY_REVIEW_PURPLE_PROFILE","t":43.35,"duration":1.15,"status":"RACE_CAR_CLASS_GT3_VS_CUP_UNCONFIRMED","id_note":"Multicolor front/side car near 43.9 at trackside. Do not count as GT3 R pending close model identification."},
 {"id":"PORSCHE_2026_CAREFULLY_REVIEW_WHITE_REAR","t":31.7,"duration":1.4,"status":"PORSCHE_GT3_R_VS_CUP_UNCONFIRMED","id_note":"White 911 racecar rear t32.0. Not enough proof of GT3 R class; review only."}
]
def call(a,t=90):
 p=subprocess.run(a,capture_output=True,text=True,timeout=t)
 if p.returncode:raise RuntimeError(p.stderr[-600:])
 return p.stdout
def dig(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for z in iter(lambda:f.read(1<<20),b""):h.update(z)
 return h.hexdigest()
root={"source_url":URL,"original_shares_sha256":EXPECTED,"source_original_NATIVE":[3840,2160],"published_makes_verifiably_added":0,"verified_source_camera_views_added":0,"gate":"BLOCKED_VISUAL_GT3_CLASS_REVIEW_REQUIRED","candidates":[]}
try:
 with requests.get(URL,stream=True,timeout=(10,50)) as rs:
  rs.raise_for_status()
  with SOURCE.open("wb") as f:
   for blob in rs.iter_content(1048576):
    if blob:f.write(blob)
 got=dig(SOURCE);assert got==EXPECTED,("Original changed!",got)
 meta=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(SOURCE)],35))
 st=next(y for y in meta['streams'] if y["codec_type"]=="video")
 assert (int(st["width"]),int(st["height"]))==(3840,2160)
 print("ORIGINAL_FULL_UHD_SHA_PASS",got,SOURCE.stat().st_size,flush=True)
 for item in scenes:
  out=VIDEO/(item["id"]+"_4k.mp4")
  rec=dict(item)
  try:
   call(["ffmpeg","-nostdin","-v","error","-y","-ss",str(item["t"]),"-i",str(SOURCE),
    "-t",str(item["duration"]),"-an","-vf","format=yuv420p","-c:v","libx264","-crf","17",
    "-preset","faster","-pix_fmt","yuv420p","-movflags","+faststart",str(out)],200)
   info=json.loads(call(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(out)],25))
   v=next(x for x in info["streams"] if x["codec_type"]=="video")
   assert (int(v["width"]),int(v["height"]))==(3840,2160)
   call(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(out),"-f","null","-"],65)
   board=Image.new("RGB",(3*640,380),(8,8,8));d=ImageDraw.Draw(board)
   for i in range(3):
    ts=item["duration"]*(i+.45)/3
    temp=PHOTO/(item["id"]+f"_tmp{i}.jpg")
    call(["ffmpeg","-nostdin","-v","error","-y","-ss",str(ts),"-i",str(out),
     "-frames:v","1","-vf","scale=640:360","-q:v","3",str(temp)],30)
    with Image.open(temp) as frame:board.paste(frame.convert("RGB"),(i*640,20))
    temp.unlink()
    d.text((i*640+5,2),f"{item['id'][-22:]} src t={item['t']+ts:.2f}s",fill="white")
   proof=PHOTO/(item["id"]+"_3FRAME.jpg");board.save(proof,quality=90,optimize=True)
   rec.update(file=str(out.relative_to(R)),bytes=out.stat().st_size,sha256=dig(out),
     native_pixels=[3840,2160],ffprobe=info,contact_sheet=str(proof.relative_to(R)),fully_decoded=True)
   print("REAL_NEW_4K_CANDIDATE",item["id"],rec["bytes"],rec["sha256"],flush=True)
   buf=io.BytesIO();board.resize((1500,297)).save(buf,format="JPEG",quality=75)
   print("SCENE_"+str(scenes.index(item))+"_IMAGE_BASE64_START:"+base64.b64encode(buf.getvalue()).decode()+":SCENE_"+str(scenes.index(item))+"_IMAGE_BASE64_END",flush=True)
  except Exception as e:
   rec.update(status="SOURCE_EDITOR_PROOF_REJECTED",error=str(e)[-500:])
   out.unlink(missing_ok=True)
   print("CANDIDATE_REJECT",item["id"],rec["error"],flush=True)
  root["candidates"].append(rec)
except Exception as e:root["error"]=str(e)[-600:];print("CRITICAL_SOURCE_REJECT",root["error"],flush=True)
finally:
 SOURCE.unlink(missing_ok=True)
 (R/"CANDIDATES_SHA_FFPROBE_PROVENANCE.json").write_text(json.dumps(root,indent=2)+"\n")
 (R/"README.md").write_text("# New independent 4K Nürburgring race camera selects—REVIEW ONLY.\nOriginal 3840x2160 SHA-verified Porsche 2026 60-vehicles N24 film. Three actual distinct time windows, but GT3 R vs 911 Cup race CLASS remains uncertain; no shot credited. All real playable video files in editor_race_camera_candidates/, and contact QA in native_frame_qa/. User/visual director must independently reject any Cup variants; preserve existing V6 shot/make count until confirmed.\n")
 output=R/"NEW_2026_REAL_4K_RACING_CAMERA_REVIEW_PACKAGE.zip"
 with zipfile.ZipFile(output,"w",zipfile.ZIP_STORED,allowZip64=True) as z:
  for f in R.rglob("*"):
   if f.is_file() and f!=output:z.write(f,f.relative_to(R))
 print("REVIEW_PACKAGE_COMPLETE_REAL_MOVIES",len([s for s in root['candidates'] if 'file' in s]),"bytes",output.stat().st_size,"SHA",dig(output),flush=True)
