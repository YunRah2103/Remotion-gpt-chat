#!/usr/bin/env python3
"""Exact alternative 2023 C8 RS6 performance video-source quality proof.

Dailymotion uploader tuningblog rehosts Audi performance Mythos Black video.
This is a technical source inspection only, NOT reusable licensed film.
Do not upload raw third-party media in GH public actions artifacts.
"""
import hashlib,json,subprocess,tempfile
from pathlib import Path
from PIL import Image,ImageDraw
from yt_dlp import YoutubeDL
from yt_dlp.utils import download_range_func
OUT=Path("b2-dm-original-QA");OUT.mkdir(exist_ok=True)
SOURCE="https://www.dailymotion.com/video/x9t0idm"
REPORT={"source":SOURCE,"status":"NOT_TESTED","copyright":"Original Audi filming; Dailymotion uploader's rights not proven; no public RS6 clip release",
"label":"Mythos Black C8 performance dynamic driving, independent Dailymotion-hosted source"}
def cmd(argv,timeout=90):
    try:
        p=subprocess.run(argv,capture_output=True,text=True,timeout=timeout)
        return p.returncode,p.stdout,p.stderr[-800:]
    except Exception as e:return 99,"",str(e)[-450:]
def ffprobe(p):
    rc,out,err=cmd(["ffprobe","-v","error","-show_entries",
      "format=duration,size:stream=codec_type,width,height,codec_name,r_frame_rate",
      "-of","json",str(p)],timeout=20)
    return json.loads(out) if rc==0 else {"error":err}
def probe_format():
    with YoutubeDL({"quiet":True,"no_warnings":True,"skip_download":True,
                    "socket_timeout":17,"extractor_retries":1,"retries":1}) as d:
        i=d.extract_info(SOURCE,download=False)
    good=[]
    for f in i.get("formats",[]):
        if f.get("vcodec") in (None,"none"):continue
        good.append({"format_id":f.get("format_id"),"height":f.get("height"),
          "width":f.get("width"),"ext":f.get("ext"),"protocol":f.get("protocol"),
          "vcodec":f.get("vcodec")})
    return {"title":i.get("title"),"uploader":i.get("uploader"),
       "duration":i.get("duration"),"formats":good[-18:]}
def real_sample(label,offset):
    row={"name":label,"source_start":offset}
    with tempfile.TemporaryDirectory(prefix="b2dm") as temp:
        root=Path(temp)
        try:
            opts={"quiet":True,"no_warnings":True,"noplaylist":True,
                  "socket_timeout":14,"extractor_retries":1,"retries":1,
                  "skip_download":False,
                  "format":"bv*[height>=1080]+ba/b[height>=1080]",
                  "merge_output_format":"mp4",
                  "outtmpl":str(root/"original.%(ext)s"),
                  "download_ranges":download_range_func(None,[(offset,offset+4.0)]),
                  "force_keyframes_at_cuts":True}
            with YoutubeDL(opts) as d:d.extract_info(SOURCE,download=True)
            files=sorted([p for p in root.iterdir() if p.suffix.lower() in (".mp4",".webm",".mkv")],
                key=lambda p:p.stat().st_size,reverse=True)
            if not files:
                row["status"]="DOWNLOAD_EMPTY";return row
            media=files[0];row["ffprobe"]=ffprobe(media)
            v=next((x for x in row["ffprobe"].get("streams",[]) if x.get("codec_type")=="video"),{})
            if (v.get("height") or 0)<1080:
                row["status"]="REJECT_UNDER_1080_NATIVE";return row
            rc,_,err=cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error",
                          "-xerror","-i",str(media),"-f","null","-"],timeout=70)
            if rc:row.update(status="DECODE_FAILED",error=err);return row
            images_folder=root/"frames";images_folder.mkdir()
            cmd(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y",
                "-i",str(media),"-vf","fps=1,scale=280:-2",
                "-frames:v","5",str(images_folder/"f_%02d.jpg")],timeout=40)
            frames=[Image.open(p).convert("RGB") for p in sorted(images_folder.glob("*.jpg"))]
            if frames:
                w=280;h=frames[0].height
                grid=Image.new("RGB",(w*len(frames),h+30),"#101418")
                d=ImageDraw.Draw(grid)
                for k,im in enumerate(frames):
                    grid.paste(im,(k*w,30))
                    d.text((k*w+6,8),label+" "+str(offset+k)+"s",fill="#fff")
                grid.save(OUT/(label+".jpg"),quality=88)
            row["status"]="GenuineHDPrivateDecodeAndFrameQA_PASS"
            row["bytes_original_sample"]=media.stat().st_size
            row["sha256_original_sample"]=hashlib.sha256(media.read_bytes()).hexdigest()
        except Exception as e:row.update(status="DOWNLOAD_OR_SOURCE_ERROR",error=str(e)[-400:])
    return row
def main():
    try:
        REPORT["source_probe"]=probe_format()
        heights=[f.get("height") or 0 for f in REPORT["source_probe"]["formats"]]
        if not heights or max(heights)<1080:
            REPORT["status"]="ONLY_LOW_RES_NOT_SUITABLE"
        else:
            REPORT["tested_samples"]=[real_sample(f"B2_DM_RS6_{i:02d}",s) for i,s in enumerate([0,14,34,70,118],1)]
            REPORT["pass_count"]=sum(x["status"]=="GenuineHDPrivateDecodeAndFrameQA_PASS" for x in REPORT["tested_samples"])
            REPORT["status"]="ACTUAL_HD_SAMPLES_ACQUIRED" if REPORT["pass_count"] else "NO_ACTUAL_HD_DOWNLOAD"
    except Exception as e:REPORT.update(status="EXTRACTOR_FAILED",error=str(e)[-450:])
    (OUT/"dm_report.json").write_text(json.dumps(REPORT,indent=2))
    print("RESULT",REPORT["status"],REPORT.get("pass_count"),flush=True)
if __name__=="__main__":main()
