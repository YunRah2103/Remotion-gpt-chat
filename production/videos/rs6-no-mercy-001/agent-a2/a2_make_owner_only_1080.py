#!/usr/bin/env python3
"""A2 real C8 RS6 premium 1080x1920 portrait MP4s from manufacturer 4K original.

Owner-only unpublished GitHub DRAFT Release handoff; no public source sharing.
Original 3840x2160 is decoded over HTTP byte ranges, never fetched in full.
"""
import hashlib,json,subprocess,zipfile,time
from pathlib import Path
from PIL import Image,ImageDraw
SOURCE="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
ROOT=Path("a2-owner-review");ROOT.mkdir(exist_ok=True)
STATUS=Path("a2-private-qa");STATUS.mkdir(exist_ok=True)
SPECS=[
    {"id":"A2_C8_RS6_MOUNTAIN_SWEEP","start":95.83,"length":1.35,
     "note":"real C8 RS6 approaching in right-hand mountainside bend; source daylight",
     "crop_x":"max(0,min(in_w-out_w,1460+360*t))"},
    {"id":"A2_C8_RS6_FAST_APPROACH","start":205.91,"length":1.39,
     "note":"actual RS6 forward road approach and fast lens pass; 9:16 tracked crop",
     "crop_x":"max(0,min(in_w-out_w,1500+480*t))"},
]
def run(cmd,timeout):
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    return p.returncode,p.stdout,p.stderr[-1500:]
def sha(path):
    m=hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""): m.update(block)
    return m.hexdigest()
def proof(frames_file,name):
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        patt=str(Path(td)/"frame_%02d.jpg")
        code,_,err=run(["ffmpeg","-hide_banner","-v","error","-y","-i",str(frames_file),
            "-vf","fps=3,scale=240:426","-frames:v","6",patt],50)
        if code:raise RuntimeError("failed source contact JPG "+err)
        jpgs=sorted(Path(td).glob("frame*.jpg"))
        if len(jpgs)<2:raise RuntimeError("not enough decoded frames for QA")
        pic=Image.new("RGB",(240*len(jpgs),456),(10,12,14))
        pen=ImageDraw.Draw(pic)
        for i,pp in enumerate(jpgs):
            im=Image.open(pp).convert("RGB");pic.paste(im,(i*240,30))
            pen.text((i*240+6,6),f"{name} sample {i+1}",fill="white")
        pic.save(STATUS/(name+"_FRAMES.jpg"),quality=83)
        return len(jpgs)
report={"role":"A2 premium C8 RS6","native_input":[3840,2160],"max_output":[1080,1920],
    "output_fps":30,
    "source_page":"https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874",
    "permission_status":"AUDIOVISUAL RIGHTS NOT VERIFIED; OWNER-ONLY DRAFT REVIEW. NOT PUBLIC.",
    "release_must_remain_draft":True,"clips":[],"created_utc":time.strftime("%FT%TZ",time.gmtime())}
for spec in SPECS:
    name=spec["id"];path=ROOT/(name+".mp4")
    crop=spec["crop_x"].replace(",","\\,")
    # x/y evaluated per frame; native 1215x2160 crop preserves genuine source pixels.
    filt=f"crop=w=1215:h=2160:x='{crop}':y=0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p"
    row={"name":name,"source_start_sec":spec["start"],"source_duration_req":spec["length"],
        "notes":spec["note"],"crop_expression":spec["crop_x"],
        "source_original_native":"3840x2160 25 fps","output":"1080x1920 30 fps"}
    report["clips"].append(row)
    cmd=["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-rw_timeout","25000000",
        "-ss",str(spec["start"]),"-i",SOURCE,"-t",str(spec["length"]),
        "-an","-vf",filt,"-c:v","libx264","-preset","fast","-crf","18",
        "-movflags","+faststart","-y",str(path)]
    rc,_,err=run(cmd,150)
    row["capture_rc"]=rc;row["capture_err"]=err
    if rc or not path.exists() or path.stat().st_size<80000:
        row["status"]="FAILED_ACTUAL_CAPTURE";path.unlink(missing_ok=True);continue
    rc,_,err=run(["ffmpeg","-nostdin","-hide_banner","-v","error","-xerror","-i",str(path),
        "-map","0:v:0","-f","null","-"],50)
    row["full_decode_ok"]=rc==0
    if rc:row["status"]="FAILED_FULL_DECODE";path.unlink(missing_ok=True);continue
    rc,out,err=run(["ffprobe","-v","error","-show_entries",
       "stream=codec_type,width,height,r_frame_rate,codec_name,pix_fmt:format=duration,size",
       "-of","json",str(path)],35)
    if rc:row["status"]="FAILED_FFPROBE";path.unlink(missing_ok=True);continue
    data=json.loads(out);v=next(s for s in data["streams"] if s.get("codec_type")=="video")
    row["ffprobe"]=data
    row["duration"]=float(data["format"].get("duration",0))
    if v["width"]!=1080 or v["height"]!=1920 or v["r_frame_rate"]!="30/1" or not 0.75<row["duration"]<1.6:
        row["status"]="FAILED_1080_PORTRAIT_SPEC";path.unlink(missing_ok=True);continue
    row["contact_frame_count"]=proof(path,name)
    row.update(status="PLAYABLE_PRIVATE_REVIEW_MP4",bytes=path.stat().st_size,sha256=sha(path))
good=[x for x in report["clips"] if x.get("status")=="PLAYABLE_PRIVATE_REVIEW_MP4"]
report["verified_private_mp4_count"]=len(good)
(STATUS/"report.json").write_text(json.dumps(report,indent=2))
if good:
    (ROOT/"SOURCE_RIGHTS.txt").write_text(
       "Source Audi AG original on-location C8 RS6 footage. Source rights are NOT cleared for public redistribution.\n"
       "Keep ALL assets in OWNER-ONLY DRAFT Release. Use for private evaluation only until permission is documented.\n")
    (ROOT/"MANIFEST.json").write_text(json.dumps(report,indent=2))
    (ROOT/"SHA256SUMS.txt").write_text("".join(f"{sha(ROOT/(x['name']+'.mp4'))}  {x['name']}.mp4\n" for x in good))
    z=ROOT/"YUNEX_RS6_A2_HERO_OWNER_ONLY.zip"
    with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED) as dst:
      for f in sorted(ROOT.iterdir()):
        if f!=z and f.is_file():dst.write(f,f.name)
    report["private_zip"]={"name":z.name,"bytes":z.stat().st_size,"sha256":sha(z)}
    (STATUS/"report.json").write_text(json.dumps(report,indent=2))
print(json.dumps({"count":len(good),"clip_results":[{k:x.get(k) for k in ("name","status","duration","bytes","sha256","capture_err")} for x in report["clips"]],"zip":report.get("private_zip")},indent=2))
