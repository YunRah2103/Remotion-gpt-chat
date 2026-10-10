#!/usr/bin/env python3
"""Source-byte-preserving Porsche public Newsroom MP4 acquisition, no yt-dlp.
Private review provenance; this is NOT evidence of granted redistribution rights.
"""
import argparse,hashlib,json,subprocess,urllib.request
from fractions import Fraction
from pathlib import Path

MEDIA={
 "286306":"50 Years Porsche Turbo (0:55, inferred from press-kit order)",
 "286726":"50 Years Porsche Turbo: 930 (16:38)",
 "286727":"50 Years Porsche Turbo: 992 (14:06)",
 "286687":"50 Years Porsche Turbo: B-roll (13:53)"}
PRESS="https://newsroom.porsche.com/en/press-kits/50-years-porsche-turbo.html"
def download(mid,path,max_mb):
    url="https://newstv.porsche.com/porschevideos/newstv.porsche.com_"+mid+"_en.mp4"
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
    digest=hashlib.sha256();size=0
    with urllib.request.urlopen(req,timeout=65) as response,path.open("wb") as dst:
        if response.status!=200:raise ValueError("Unexpected HTTP status "+str(response.status))
        content_type=response.headers.get("Content-Type","")
        declared=int(response.headers.get("Content-Length") or 0)
        if declared>max_mb*1048576:raise ValueError("Source larger than configured cap")
        for chunk in iter(lambda:response.read(1048576),b""):
            size+=len(chunk)
            if size>max_mb*1048576:raise ValueError("Download crossed size limit")
            dst.write(chunk);digest.update(chunk)
    return dict(sourceUrl=url,contentType=content_type,originalBytes=size,originalSha256=digest.hexdigest())
def audit(path,out,label):
    info=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],timeout=65))
    video=next((s for s in info.get("streams",[]) if s.get("codec_type")=="video"),None)
    if video is None:raise ValueError("No source video")
    duration=float(info["format"]["duration"]);fps=float(Fraction(video.get("avg_frame_rate") or "0/1"))
    if not 15<=duration<=2000 or fps<20 or int(video["width"])<640 or int(video["height"])<360:raise ValueError("Source doesn't meet genuine media quality gates")
    out.mkdir(parents=True,exist_ok=True)
    times=[duration*(i+.5)/12 for i in range(12)]
    jpegs=[]
    for index,t in enumerate(times):
        dest=out/f"frame-{index+1:02d}.jpg"
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-ss",f"{t:.3f}","-i",str(path),"-frames:v","1","-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2","-q:v","2","-y",str(dest)],check=True,timeout=70)
        jpegs.append(dest)
    from PIL import Image,ImageDraw
    canvas=Image.new("RGB",(1920,900),"#101010")
    draw=ImageDraw.Draw(canvas)
    for i,src in enumerate(jpegs):
        x,y=(i%4)*480,(i//4)*300
        with Image.open(src) as im:canvas.paste(im.convert("RGB"),(x,y))
        draw.text((x+10,y+277),f"{label}: {times[i]:.1f}s",fill="white")
    canvas.save(out/"contact-sheet.jpg",quality=93,subsampling=0)
    return dict(width=int(video["width"]),height=int(video["height"]),fps=fps,durationSeconds=duration,videoCodec=video.get("codec_name"),framesReported=video.get("nb_frames"),sourceFramesSampled=12)
def main():
    p=argparse.ArgumentParser();p.add_argument("--video-id",choices=MEDIA);p.add_argument("--out",type=Path,default=Path("out/porsche-official"));p.add_argument("--max-mb",type=int,default=800);p.add_argument("--self-test",action="store_true");args=p.parse_args()
    if args.self_test:
        import tempfile
        with tempfile.TemporaryDirectory() as t:
            folder=Path(t);sample=folder/"synthetic.mp4"
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-f","lavfi","-i","testsrc2=size=640x360:rate=30:duration=16","-c:v","mpeg4","-q:v","4","-y",str(sample)],check=True,timeout=70)
            result=audit(sample,folder/"proof","NOT_PORSCHE");assert result["sourceFramesSampled"]==12 and (folder/"proof/contact-sheet.jpg").is_file()
        print("SYNTHETIC_NATIVE_TEST_PASS");return 0
    if not args.video_id:p.error("--video-id required")
    args.out.mkdir(parents=True,exist_ok=True);raw=args.out/f"porsche-newsroom-{args.video_id}-original.mp4"
    report=dict(schemaVersion=1,status="BLOCKED",mediaId=args.video_id,expectedTitle=MEDIA[args.video_id],sourcePageUrl=PRESS,rightsStatus="UNVERIFIED_PRIVATE_REVIEW",noTranscode=True,uniqueShotCountVerified=0)
    try:
        report.update(download(args.video_id,raw,args.max_mb))
        report["probe"]=audit(raw,args.out/"contact",args.video_id)
        subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(raw),"-map","0:v:0","-f","null","-"],stdout=subprocess.DEVNULL,check=True,timeout=1100)
        report["fullDecode"]="PASS";report["status"]="MEDIA_ACQUIRED_PENDING_MANUAL_SCENE_REVIEW"
    except Exception as exc:report["error"]=str(exc)[:600]
    (args.out/"source-qa.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf8")
    print(json.dumps(report,indent=2))
    return 0 if report["status"]=="MEDIA_ACQUIRED_PENDING_MANUAL_SCENE_REVIEW" else 2
if __name__=="__main__":raise SystemExit(main())
