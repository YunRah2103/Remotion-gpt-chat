#!/usr/bin/env python3
"""Four independent 964 Turbo S original-H264 4K motion candidate extractions.

Each time is visually inspected against source survey. No 30-clip completion
claimed; manual review of actual decoded start/centre/end still required.
"""
from pathlib import Path
from PIL import Image,ImageChops,ImageStat,ImageDraw
from io import BytesIO
from fractions import Fraction
import hashlib,json,subprocess,argparse
URL="https://newstv.porsche.com/porschevideos/newstv.porsche.com_326868_en.mp4"
SOURCE="https://newsroom.porsche.com/en/press-kits/pfv-porsche-911-turbo-s.html"
# Front at opening, side moving camera, solo full-car frontal, front-side distinct car+car chase.
SLOTS=[
(5,9.1,"yellow 964 front tracking with circuit kerb"),
(6,33.1,"yellow 964 low side-profile following shot"),
(7,81.1,"yellow 964 frontal solo tracking approaching circuit"),
(8,129.1,"yellow 964 close front-three-quarter on circuit with background 992"),
]
def invoke(args,timeout=100):
    return subprocess.run(args,capture_output=True,check=True,timeout=timeout)
def hashfile(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda:f.read(1<<20),b""):h.update(b)
    return h.hexdigest()
def probe(path):
    x=json.loads(invoke(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],60).stdout)
    v=next(s for s in x["streams"] if s["codec_type"]=="video")
    return {"width":int(v["width"]),"height":int(v["height"]),"fps":float(Fraction(v["avg_frame_rate"])),"codec":v["codec_name"],"duration":float(x["format"]["duration"])}
def frame(path,t):
    cmd=["ffmpeg","-hide_banner","-loglevel","error","-ss",f"{t:.3f}","-i",str(path),
         "-frames:v","1","-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
         "-f","image2pipe","-c:v","mjpeg","-"]
    im=invoke(cmd,60).stdout
    with Image.open(BytesIO(im)) as src:return src.convert("RGB").copy()
def delta(im1,im2):
    x=im1.convert("L").resize((64,36));y=im2.convert("L").resize((64,36))
    return round(ImageStat.Stat(ImageChops.difference(x,y)).mean[0],2)
def main():
    a=argparse.ArgumentParser();a.add_argument("--output",type=Path,default=Path("out/porsche-four-964-native"));x=a.parse_args();x.output.mkdir(parents=True,exist_ok=True)
    result={"sourceId":"porsche-326868","originCreator":"Porsche AG",
            "sourcePage":SOURCE,"originalUrl":URL,"nativeMediaTranscoded":False,
            "rightsVerified":False,"allSlotsCertified":False,"candidateClips":[],"errors":[]}
    canvas=Image.new("RGB",(1440,1200),"#101010");draw=ImageDraw.Draw(canvas)
    for k,(slot,t,desc) in enumerate(SLOTS):
        file=x.output/f"slot-{slot:02d}-964-original-source.mp4"
        item={"slot":slot,"provisionalGeneration":"964","sourcePosition":t,"view":desc,
              "independentCameraManuallySigned":False,"verticalFrameManuallySigned":False}
        try:
            invoke(["ffmpeg","-hide_banner","-loglevel","error","-rw_timeout","40000000",
                    "-ss",str(t-.65),"-i",URL,"-t","2.35",
                    "-map","0:v:0","-an","-c:v","copy",
                    "-movflags","+faststart","-y",str(file)],150)
            p=probe(file)
            if (p["width"],p["height"],p["codec"],p["fps"])!=(3840,2160,"h264",25.0) or p["duration"]<1.6:raise ValueError("Source native format/length invalid")
            invoke(["ffmpeg","-v","error","-xerror","-i",str(file),"-f","null","-"],90)
            ss=[frame(file,j) for j in (0.2,.8,1.4)]
            move=[delta(ss[0],ss[1]),delta(ss[1],ss[2])]
            if max(move)<1.5:raise ValueError("Not enough demonstrated native frame motion")
            for j,img in enumerate(ss):
                ox=j*480;oy=k*300;canvas.paste(img,(ox,oy))
                draw.text((ox+10,oy+276),f"{slot:02d} - 964 original {j+1}/3 @ {t:.1f}s",fill="white")
            item.update({"status":"SOURCE_ORIGINAL_CODEC_AND_MOTION_PASS","clipFile":file.name,
                        "sha256":hashfile(file),"bytes":file.stat().st_size,
                        "probe":p,"motionDelta":move,"fullDecode":"PASS"})
        except Exception as error:
            item.update({"status":"BLOCKED","error":str(error)[:300]})
            result["errors"].append(f"slot {slot}: {error}")
        result["candidateClips"].append(item)
    canvas.save(x.output/"four-964-contact.jpg",quality=94,subsampling=0)
    result["nativeCandidatesPass"]=sum(item["status"]=="SOURCE_ORIGINAL_CODEC_AND_MOTION_PASS" for item in result["candidateClips"])
    result["status"]="FOUR_SOURCE_MOTION_CANDIDATES_NOT_FINAL_VERTICAL_EXPORTS" if not result["errors"] else "PARTIAL_SOURCE_CANDIDATES"
    (x.output/"four-964-report.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"status":result["status"],"nativeCandidatesPass":result["nativeCandidatesPass"],"errors":result["errors"]},indent=2))
    raise SystemExit(0 if not result["errors"] else 2)
if __name__=="__main__":main()
