#!/usr/bin/env python3
"""Prepare, native-verify and independently review 17 middle-generation candidates.

No assumption that one film supplies enough true independent scenes.
FFmpeg direct source copy; no music, scaling, caption generation or re-encoding.
Candidate shots stay blocked until native visual review confirms unique setups,
model identity, correct source-era labels and vertical-crop feasibility.
"""
import hashlib,json,subprocess,argparse
from pathlib import Path
from fractions import Fraction
from io import BytesIO
from PIL import Image,ImageDraw,ImageChops,ImageStat

SOURCE_URL="https://newstv.porsche.com/porschevideos/newstv.porsche.com_202036_en.mp4"
SOURCE_PAGE="https://newsroom.porsche.com/en_US/2022/products/porsche-911-magazine-episode-21-tale-of-the-turbo-mark-webber-911-turbo-models-cayenne-turbo-gt-911-gt1-27314.html"
# Provisional scene ideas based on actual 1.7-second interval contact galleries.
# They are NOT final license clearance, independently verified camera angles, or guaranteed Turbo identity.
SHOTS=[
    (9,"993",114.2,"maroon 993 front approaching scrubland road"),
    (10,"993",118.0,"maroon 993 rear low-road follow"),
    (11,"993",130.8,"maroon 993 side-front coastal long lens"),
    (12,"993",146.4,"maroon 993 medium front-three-quarter tree-lined road"),
    (13,"996",157.7,"yellow 996 rear driving along open coast"),
    (14,"996",162.2,"yellow 996 lateral track along volcanic rock"),
    (15,"996",164.2,"yellow 996 near front-three-quarter low angle"),
    (16,"996",168.2,"yellow 996 side-profile moving along mountain road"),
    (17,"997",190.2,"grey 997 front approach on open test tarmac"),
    (18,"997",202.4,"grey 997 rear moving close-up"),
    (19,"997",206.1,"yellow 997 rear corner on mountain road"),
    (20,"997",211.2,"grey 997 side tracking in bright grassland"),
    (21,"991",221.1,"white 991 desert road rear pursuit"),
    (22,"991",229.0,"white 991 desert front quarter moving"),
    (23,"991",233.1,"white 991 clean side profile tracking"),
    (24,"991",237.7,"white 991 front tracking along rock-lined canyon"),
    (25,"991",242.5,"white 991 travelling wheel-and-profile detail"),
]
def run(cmd,timeout=120):
    return subprocess.run(cmd,capture_output=True,check=True,timeout=timeout)
def probe(path):
    data=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],60).stdout)
    video=next(s for s in data["streams"] if s["codec_type"]=="video")
    return {"width":int(video["width"]),"height":int(video["height"]),
            "fps":float(Fraction(video["avg_frame_rate"])),"codec":video["codec_name"],
            "durationSeconds":float(data["format"]["duration"])}
def sha(path):
    d=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):d.update(chunk)
    return d.hexdigest()
def sample(path,t):
    p=run(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(path),
           "-frames:v","1","-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
           "-f","image2pipe","-vcodec","mjpeg","-"],60)
    with Image.open(BytesIO(p.stdout)) as i:
        return i.convert("RGB").copy()
def motion(a,b):
    x=a.resize((64,36)).convert("L");y=b.resize((64,36)).convert("L")
    return round(ImageStat.Stat(ImageChops.difference(x,y)).mean[0],3)
def main():
    parser=argparse.ArgumentParser();parser.add_argument("--output",type=Path,default=Path("out/middle-source-candidates"))
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    report={"schemaVersion":1,"sourceOwner":"Porsche AG","sourcePage":SOURCE_PAGE,
            "originalVideoUrl":SOURCE_URL,"finalTimelineReady":False,
            "outputIsOriginalSourceCodec":True,"outputsHaveNotBeenReencoded":True,
            "shots":[],"errors":[],"rightsStatus":"UNVERIFIED_PRIVATE_REVIEW",
            "automaticMotionIsNotVehicleIdentityProof":True}
    sheet=Image.new("RGB",(480*3,296*len(SHOTS)),"#111111")
    draw=ImageDraw.Draw(sheet)
    for row,(slot,gen,position,description) in enumerate(SHOTS):
        p=args.output/f"slot-{slot:02d}-{gen}-original-source.mp4"
        record={"slot":slot,"generationProvisional":gen,"description":description,
                "originalMasterTimeSeconds":position,"sourceUrl":SOURCE_URL,
                "separateSetupHumanVerified":False,"verticalFramingHumanVerified":False,
                "rightsVerifiedForPublicRelease":False}
        try:
            start=max(0,position-0.6)
            run(["ffmpeg","-hide_banner","-loglevel","error","-rw_timeout","40000000",
                "-ss",f"{start:.3f}","-i",SOURCE_URL,"-t","2.0",
                "-map","0:v:0","-an","-c:v","copy","-movflags","+faststart",
                "-y",str(p)],135)
            info=probe(p)
            if info["width"]<1280 or info["height"]<720 or info["fps"]<24 or info["durationSeconds"]<1.0:raise ValueError("Unexpected native footage resolution/frame rate/length")
            run(["ffmpeg","-v","error","-xerror","-i",str(p),"-f","null","-"],60)
            tmax=info["durationSeconds"]-.05
            frames=[sample(p,min(tmax,t)) for t in (.17,.62,1.12)]
            scores=[motion(frames[0],frames[1]),motion(frames[1],frames[2])]
            if max(scores)<1.5:raise ValueError("Frames too similar; likely static/nonmoving")
            for k,im in enumerate(frames):
                x=k*480;y=row*296
                sheet.paste(im,(x,y))
                draw.text((x+10,y+275),f"{slot:02d} {gen} {k+1}/3 ({position:.1f}s)",fill="white")
            record.update({"status":"NATIVE_CLIP_AND_FRAME_MOTION_PASS_AWAITING_MODEL_SCENE_QA",
                "clipFile":p.name,"clipSha256":sha(p),"fileBytes":p.stat().st_size,
                "probe":info,"motionDelta":scores,"actualFramesDecoded":True})
        except Exception as err:
            record.update({"status":"FAILED","error":str(err)[:450]})
            report["errors"].append(f"slot {slot}: {err}")
        report["shots"].append(record)
    sheet.save(args.output/"middle-17-contact-sheet.jpg",quality=93,subsampling=0)
    report["nativeMotionCandidates"]=sum(s["status"].startswith("NATIVE_CLIP") for s in report["shots"])
    report["status"]="PROVISIONAL_SOURCE_CANDIDATES" if not report["errors"] else "PARTIAL_SOURCE_CANDIDATES"
    (args.output/"middle-17-source-report.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({"status":report["status"],"nativeMotionCandidates":report["nativeMotionCandidates"],"errors":report["errors"]},indent=2))
    raise SystemExit(0 if not report["errors"] else 2)
if __name__=="__main__":main()
