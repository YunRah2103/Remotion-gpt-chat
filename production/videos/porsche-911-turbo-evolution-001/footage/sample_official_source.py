#!/usr/bin/env python3
"""Try direct HTTP range seek into real official Porsche press-kit video.

Produces native stream-copy excerpts only. Does not mislabel excerpt SHA as full original.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
IDS={"286726":"930 Turbo","286727":"992 Turbo","286687":"50 Years Turbo B-Roll"}
def runner(args,timeout):
    return subprocess.run(args,text=True,capture_output=True,timeout=timeout,check=True)
def probe(file):
    return json.loads(runner(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(file)],40).stdout)
def ingest(media_id,start,length,out):
    url="https://newstv.porsche.com/porschevideos/newstv.porsche.com_"+media_id+"_en.mp4"
    out.mkdir(parents=True,exist_ok=True)
    dest=out/("porsche-"+media_id+"-native-excerpt.mp4")
    report={"schemaVersion":1,"mediaId":media_id,"sourceVideoDescription":IDS[media_id],
        "sourceUrl":url,"rangeStartSeconds":start,"requestLengthSeconds":length,
        "status":"FAILED","rightsStatus":"UNVERIFIED_PRIVATE_REVIEW","originalReencoded":False,
        "clipDoesNotRepresentEntireSource":True}
    try:
        runner(["ffmpeg","-hide_banner","-loglevel","error","-rw_timeout","25000000",
           "-ss",str(start),"-i",url,"-t",str(length),"-map","0:v:0","-c:v","copy",
           "-movflags","+faststart","-y",str(dest)],timeout=170)
        if dest.stat().st_size<1000000:raise ValueError("No substantial moving media bytes")
        metadata=probe(dest)
        stream=next(s for s in metadata["streams"] if s.get("codec_type")=="video")
        sha=hashlib.sha256(dest.read_bytes()).hexdigest()
        report.update({"status":"EXCERPT_DOWNLOADED_PRESERVED_CODEC","excerptBytes":dest.stat().st_size,
            "excerptSha256":sha,"videoCodec":stream.get("codec_name"),
            "width":stream.get("width"),"height":stream.get("height"),
            "fps":stream.get("avg_frame_rate"),"durationSeconds":float(metadata["format"]["duration"])})
        runner(["ffmpeg","-v","error","-xerror","-i",str(dest),"-f","null","-"],timeout=120)
        report["completeExcerptDecode"]="PASS"
        from PIL import Image,ImageDraw
        from io import BytesIO
        duration=report["durationSeconds"];sheet=Image.new("RGB",(1440,850),"#151515");draw=ImageDraw.Draw(sheet)
        for i in range(9):
            t=duration*(i+.5)/9
            proc=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),
               "-i",str(dest),"-frames:v","1","-vf","scale=480:250:force_original_aspect_ratio=decrease,pad=480:250:(ow-iw)/2:(oh-ih)/2",
               "-f","image2pipe","-c:v","mjpeg","-"],capture_output=True,check=True,timeout=80)
            with Image.open(BytesIO(proc.stdout)) as frame:sheet.paste(frame.convert("RGB"),((i%3)*480,(i//3)*280))
            draw.text(((i%3)*480+12,(i//3)*280+253),f"{IDS[media_id]} · {t+start:.2f}s source time",fill="white")
        sheet.save(out/"excerpt-contact-sheet.jpg",quality=93,subsampling=0)
    except Exception as err:report["error"]=str(err)[:750]
    (out/"excerpt-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2))
    return report["status"]=="EXCERPT_DOWNLOADED_PRESERVED_CODEC"
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--video-id",choices=IDS,default="286726");p.add_argument("--start",type=float,default=60)
    p.add_argument("--seconds",type=float,default=12);p.add_argument("--out",type=Path,default=Path("out/official-excerpt"));a=p.parse_args()
    if not 0<=a.start<=2000 or not 3<=a.seconds<=30:p.error("Invalid excerpt window")
    raise SystemExit(0 if ingest(a.video_id,a.start,a.seconds,a.out) else 2)
