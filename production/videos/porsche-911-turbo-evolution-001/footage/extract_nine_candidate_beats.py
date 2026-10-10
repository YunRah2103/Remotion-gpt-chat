#!/usr/bin/env python3
"""Select nine original-codec Porsche 930/992 beat candidates from source-verified video.

Asset does NOT certify 30 shots or publishing rights. Extract 9 scene-distinct
motion candidates for human QA, preserving original H.264/4K/25fps, no scaling.
"""
import argparse,hashlib,json,subprocess
from fractions import Fraction
from pathlib import Path
from PIL import Image,ImageDraw
from io import BytesIO

ORIGIN="https://newsroom.porsche.com/en/press-kits/50-years-porsche-turbo.html"
SOURCES={g:"https://newstv.porsche.com/porschevideos/newstv.porsche.com_"+id+"_en.mp4"
         for g,id in [("930","286726"),("992","286727")]}
# Each selection is one camera/framing setup, NOT contiguous slices falsely promoted as distinct.
CANDIDATES=[
 (1,"930",210.0,"frontal road approach medium"),
 (2,"930",182.0,"front three-quarter around forest corner"),
 (3,"930",406.0,"rear follow in wooded bend"),
 (4,"930",910.0,"low wide landscape side tracking"),
 (26,"992",126.0,"rear pursuit on shaded road"),
 (27,"992",238.0,"front three-quarter shaded tracking"),
 (28,"992",434.0,"bright low front-side tracking"),
 (29,"992",574.0,"head-on approach with road background"),
 (30,"992",714.0,"open-landscape side profile tracking")
]
def cmd(*args,timeout=140):
    return subprocess.run(args,capture_output=True,check=True,timeout=timeout)
def getprobe(p):
    info=json.loads(cmd("ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p),timeout=45).stdout)
    stream=next(s for s in info["streams"] if s.get("codec_type")=="video")
    return {"codec":stream["codec_name"],"width":int(stream["width"]),
            "height":int(stream["height"]),"fps":float(Fraction(stream["avg_frame_rate"])),
            "durationSeconds":float(info["format"]["duration"])}
def digest(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for part in iter(lambda:f.read(1024*1024),b""):
            h.update(part)
    return h.hexdigest()
def frame(media,t):
    p=cmd("ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),
          "-i",str(media),"-frames:v","1","-vf","scale=512:288:force_original_aspect_ratio=decrease,pad=512:288:(ow-iw)/2:(oh-ih)/2",
          "-f","image2pipe","-vcodec","mjpeg","-",timeout=70)
    with Image.open(BytesIO(p.stdout)) as im: return im.convert("RGB").copy()
def motion_score(a,b):
    import PIL.ImageChops
    from PIL import ImageStat
    # Same-size grayscale change. Camera can move while car is static; human check essential.
    import PIL.Image as PILImage
    x=a.resize((80,45)).convert("L")
    y=b.resize((80,45)).convert("L")
    return round(ImageStat.Stat(ImageChops.difference(x,y)).mean[0],2)
def run(out):
    out.mkdir(parents=True,exist_ok=True)
    report={"schemaVersion":1,"status":"BLOCKED","sourcePage":ORIGIN,
            "rightsStatus":"UNVERIFIED_PRIVATE_REVIEW","sourceVideoTranscoded":False,
            "verifiedReadyPorscheBeats":0,
            "note":"Native samples prove clip bytes and motion, but same model/motion/camera uniqueness requires human video sign-off; other 21 slots remain unfilled.",
            "candidates":[]}
    cells=[]
    errors=[]
    for slot,gen,target,angle in CANDIDATES:
        url=SOURCES[gen]
        p=out/f"slot-{slot:02d}-{gen}-native.mp4"
        obj={"slot":slot,"generation":gen,"sourceUrl":url,"originCreator":"Porsche AG",
             "sourcePageUrl":ORIGIN,"sourcePreviewTime":target,"description":angle,
             "sourceInRequested":round(target-.7,2),
             "verifiedUniqueAngle":False,"verifiedTurboIdentity":False,
             "publicationRights":"not established"}
        try:
            cmd("ffmpeg","-hide_banner","-loglevel","error","-rw_timeout","40000000",
                "-ss",str(round(target-.7,3)),"-i",url,"-t","2.4",
                "-map","0:v:0","-c:v","copy","-an","-avoid_negative_ts","make_zero",
                "-movflags","+faststart","-y",str(p),timeout=160)
            probe=getprobe(p)
            if probe["codec"]!="h264" or probe["width"]!=3840 or probe["height"]!=2160 or abs(probe["fps"]-25)>.01 or probe["durationSeconds"]<1.5:
                raise ValueError("Native 4K/25/H264/length quality check failed")
            cmd("ffmpeg","-v","error","-xerror","-i",str(p),"-f","null","-",timeout=90)
            stills=[frame(p,t) for t in [.24,.9,1.45]]
            deltas=[motion_score(stills[0],stills[1]),motion_score(stills[1],stills[2])]
            if max(deltas)<2.0:raise ValueError("Insufficient visible frame motion")
            obj.update({"status":"SOURCE_BYTES_AND_MOTION_PASS_AWAITING_VISUAL_QA",
                        "clipFile":p.name,"clipSha256":digest(p),"clipBytes":p.stat().st_size,
                        "probe":probe,"motionScores":deltas,"decode":"PASS"})
            for idx,still in enumerate(stills): cells.append((slot,gen,idx,still))
        except Exception as e:
            obj.update(status="REJECTED",error=str(e)[:350])
            errors.append(f"slot {slot}: {e}")
        report["candidates"].append(obj)
    # 9 rows with three decoded frames; explicitly disclose user judgement remains.
    canvas=Image.new("RGB",(512*3,320*9),"#101010")
    drawer=ImageDraw.Draw(canvas)
    for row,(slot,gen,_,_) in enumerate(CANDIDATES): pass
    rows={slot:i for i,(slot,_,_,_) in enumerate(CANDIDATES)}
    for slot,gen,num,img in cells:
        x=num*512; y=rows[slot]*320
        canvas.paste(img,(x,y))
        drawer.text((x+8,y+292),f"{slot:02d} {gen} source-motion proof {num+1}/3",fill="white")
    canvas.save(out/"nine-beat-contact-sheet.jpg",quality=90,subsampling=0)
    report.update(status="NATIVE_CLIPS_READY_FOR_HUMAN_QA" if not errors else "PARTIAL_SOURCE_DOWNLOAD",
                  downloadableCandidates=len(CANDIDATES)-len(errors),errors=errors)
    (out/"native-beat-candidates.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({k:report.get(k) for k in ("status","downloadableCandidates","errors")},indent=2))
    return 0 if not errors else 2
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--out",type=Path,default=Path("out/porsche-a-nine-candidates"));a=parser.parse_args()
    raise SystemExit(run(a.out))
