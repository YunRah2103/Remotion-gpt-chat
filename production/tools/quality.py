#!/usr/bin/env python3
"""Reusable FFprobe/full-decode and review-frame utilities for production clips."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True)

def probe(path):
    return json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)).stdout)

def report(path, expected_width=0, expected_height=0, expected_fps=0, expected_frames=0, require_audio=False):
    path = Path(path)
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError("Missing/empty video: " + str(path))
    data = probe(path)
    vids = [s for s in data["streams"] if s["codec_type"] == "video"]
    auds = [s for s in data["streams"] if s["codec_type"] == "audio"]
    if len(vids) != 1:
        raise ValueError("Expected exactly one video stream")
    v = vids[0]
    for key, expect in (("width", expected_width), ("height", expected_height)):
        if expect and int(v[key]) != expect:
            raise ValueError(f"{key}: expected {expect}, got {v[key]}")
    if expected_fps:
        a,b = map(int, v["r_frame_rate"].split("/"))
        if abs(a/b - expected_fps) > 0.001:
            raise ValueError("Unexpected frame rate")
    if expected_frames and int(v.get("nb_frames", "-1")) != expected_frames:
        raise ValueError(f"Unexpected frame count: {v.get('nb_frames')}, expected {expected_frames}")
    if require_audio and not auds:
        raise ValueError("Missing audio track")
    # Decode *all* frames/audio. Merely finding an MP4 is not a PASS.
    subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(path),"-f","null","-"],check=True,
                   stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    return {"file":path.name,"bytes":path.stat().st_size,
            "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
            "durationSeconds":float(data["format"]["duration"]),
            "width":int(v["width"]),"height":int(v["height"]),
            "fps":v["r_frame_rate"],"frames":int(v.get("nb_frames","0")),
            "pixelFormat":v.get("pix_fmt"),"videoCodec":v["codec_name"],
            "audioCodec":auds[0]["codec_name"] if auds else None,
            "decodedCompletely":True}

def extract_samples(path, output_dir, timestamps):
    d = Path(output_dir)
    d.mkdir(parents=True,exist_ok=True)
    for i,t in enumerate(timestamps):
        if t < 0: raise ValueError("Negative timestamp")
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",str(t),
                       "-i",str(path),"-frames:v","1",str(d/f"sample-{i:02d}.png")],check=True)

def contact_sheet(images, target, columns=4):
    from PIL import Image, ImageOps, ImageDraw
    paths = [Path(p) for p in images]
    if not paths: raise ValueError("No input images")
    w,h,pad = 240,426,12
    rows = (len(paths)+columns-1)//columns
    canvas = Image.new("RGB",(columns*(w+pad)+pad,rows*(h+34+pad)+pad),"#20252b")
    draw = ImageDraw.Draw(canvas)
    for i,p in enumerate(paths):
        with Image.open(p) as im:
            tile=ImageOps.contain(im.convert("RGB"),(w,h))
        x=pad+(i%columns)*(w+pad)+(w-tile.width)//2
        y=pad+(i//columns)*(h+34+pad)
        canvas.paste(tile,(x,y))
        draw.text((x,y+h+4),p.stem,fill="#e0e3e6")
    Path(target).parent.mkdir(parents=True,exist_ok=True)
    canvas.save(target)

def compare(before,after,target):
    """Matched before/after; *not* an automatic artistic-quality score."""
    from PIL import Image, ImageOps, ImageDraw
    with Image.open(before) as b, Image.open(after) as a:
        w,h=360,640
        left=ImageOps.contain(b.convert("RGB"),(w,h))
        right=ImageOps.contain(a.convert("RGB"),(w,h))
        out=Image.new("RGB",(w*2,h+36),"#141820")
        out.paste(left,((w-left.width)//2,0))
        out.paste(right,(w+(w-right.width)//2,0))
        ImageDraw.Draw(out).text((12,h+10),"BEFORE",fill="white")
        ImageDraw.Draw(out).text((w+12,h+10),"AFTER",fill="white")
        Path(target).parent.mkdir(parents=True,exist_ok=True)
        out.save(target)

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    sub=p.add_subparsers(dest="command",required=True)
    q=sub.add_parser("video");q.add_argument("video");q.add_argument("--width",type=int,default=0)
    q.add_argument("--height",type=int,default=0);q.add_argument("--fps",type=int,default=0)
    q.add_argument("--frames",type=int,default=0);q.add_argument("--audio",action="store_true")
    q.add_argument("--report",default="out/production/validation.json")
    s=sub.add_parser("samples");s.add_argument("video");s.add_argument("directory")
    s.add_argument("--times",default="0,1,2,3,4")
    c=sub.add_parser("contact");c.add_argument("output");c.add_argument("images",nargs="+")
    d=sub.add_parser("compare");d.add_argument("before");d.add_argument("after");d.add_argument("output")
    args=p.parse_args()
    if args.command=="video":
        data=report(args.video,args.width,args.height,args.fps,args.frames,args.audio)
        Path(args.report).parent.mkdir(parents=True,exist_ok=True)
        Path(args.report).write_text(json.dumps(data,indent=2)+"\n")
        print(json.dumps(data,indent=2))
    elif args.command=="samples":
        extract_samples(args.video,args.directory,[float(x) for x in args.times.split(",") if x])
    elif args.command=="contact":contact_sheet(args.images,args.output)
    else:compare(args.before,args.after,args.output)
