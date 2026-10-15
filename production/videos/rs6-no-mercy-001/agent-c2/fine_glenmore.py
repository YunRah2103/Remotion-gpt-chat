#!/usr/bin/env python3
"""Transient licensed-source QA only. DO NOT publish source MP4."""
import json, re, hashlib, pathlib, subprocess, shutil, math, time
from PIL import Image, ImageDraw
url="https://www.tiktok.com/@glenmoreaudi/video/7482802812783512887"
tmp=pathlib.Path("glen_tmp");tmp.mkdir(exist_ok=True)
out=pathlib.Path("glen_qa");out.mkdir(exist_ok=True)
cmd=["yt-dlp","--no-playlist","--no-progress","--socket-timeout","15","--retries","2","--download-sections","*0-8",
  "-f","bv*+ba/best","--merge-output-format","mp4","-o",str(tmp/"source.%(ext)s"),url]
p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=125)
report={"url":url,"extraction_status":p.returncode,"download_log_tail":p.stderr[-500:],"rights_cleared":False,"source_bytes_published":False}
try:
 files=list(tmp.glob("source.*"))
 files=[x for x in files if x.suffix.lower() in (".mp4",".mkv",".webm") and x.stat().st_size>100000]
 if not files: raise RuntimeError("No video bytes acquired")
 f=files[0]
 report["source_sha256"]=hashlib.sha256(f.read_bytes()).hexdigest()
 probe=subprocess.run(["ffprobe","-v","error","-show_entries","stream=codec_type,codec_name,width,height,r_frame_rate:format=duration","-of","json",str(f)],capture_output=True,text=True,timeout=20)
 report["ffprobe"]=json.loads(probe.stdout)
 thumbs=tmp/"thumbs";thumbs.mkdir(exist_ok=True)
 t=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(f),"-t","8","-vf","fps=4,scale=360:-2","-q:v","5",str(thumbs/"%03d.jpg")],capture_output=True,text=True,timeout=80)
 if t.returncode!=0: raise RuntimeError("Frame sampling failed: "+t.stderr[-200:])
 images=sorted(thumbs.glob("*.jpg"))
 report["sampled_frames"]=len(images)
 report["contact_sampling_fps"]=4
 report["timecode_rule"]="frame 0001 centered near 0.125 sec, each next advances 0.25 sec"
 w,h=360,640
 canvas=Image.new("RGB",(w*8,h*math.ceil(len(images)/8)),(12,12,12))
 draw=ImageDraw.Draw(canvas)
 for i,im in enumerate(images):
    x=(i%8)*w;y=(i//8)*h
    src=Image.open(im).convert("RGB");canvas.paste(src,(x,y))
    draw.rectangle((x+1,y+1,x+105,y+24),fill="#090909")
    draw.text((x+7,y+5),f"t={i/4+0.125:.3f}s",fill="#ffffff")
 canvas.save(out/"glenmore-32frame-temporal-contact.jpg",quality=88)
 # FFmpeg scene-cut scores are independent of clip quality / camera motion.
 cut=subprocess.run(["ffmpeg","-hide_banner","-i",str(f),"-vf","select='gt(scene,0.16)',showinfo","-an","-f","null","-"],capture_output=True,text=True,timeout=80)
 report["scene_times_sec"]=[float(x) for x in re.findall(r"pts_time:([0-9.]+)",cut.stderr)][:100]
 report["full_decode_pass"]=subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(f),"-f","null","-"],capture_output=True,timeout=80).returncode==0
 report["technical_gate"]=report["full_decode_pass"] and len(images)>=20
except Exception as e:
 report["error"]=str(e); report["technical_gate"]=False
finally:
 shutil.rmtree(tmp,ignore_errors=True)
 (out/"glenmore-fine-report.json").write_text(json.dumps(report,indent=2))
print(json.dumps({k:report.get(k) for k in ("sampled_frames","source_sha256","scene_times_sec","full_decode_pass","error")},indent=2))
