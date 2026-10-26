#!/usr/bin/env python3
"""One final postproduction step, never unthinkingly re-encode source footage.

Default is bitstream-copy remux (zero image quality loss). When --lut is selected
or --reencode is explicitly requested, use a single CRF16 slow x264 encode.
"""
from __future__ import annotations
import argparse
import json
import subprocess
from pathlib import Path

def cmd(*args,timeout=900):
    return subprocess.run(list(args),check=True,capture_output=True,text=True,timeout=timeout)

def inspect(path):
    path=Path(path)
    if not path.is_file() or path.stat().st_size<1000:raise ValueError("Missing/empty input video")
    info=json.loads(cmd("ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)).stdout)
    videos=[s for s in info.get("streams",[]) if s["codec_type"]=="video"]
    if len(videos)!=1:raise ValueError("Require exactly one video stream")
    return info,videos[0],next((s for s in info["streams"] if s["codec_type"]=="audio"),None)

def make_command(inp,out,lut=None,reencode=False,crf=16):
    inp=Path(inp);out=Path(out)
    if inp.resolve()==out.resolve():raise ValueError("Cannot overwrite source master")
    if out.suffix.lower()!=".mp4":raise ValueError("Use .mp4 final format")
    if lut and (Path(lut).suffix!=".cube" or not Path(lut).is_file()):raise ValueError("Missing valid .cube LUT")
    if crf not in range(14,20):raise ValueError("CRF must be in 14–19")
    _,v,a=inspect(inp)
    copy=not lut and not reencode
    if copy and v["codec_name"]!="h264":
        raise ValueError("Stream copy requires H264; select --reencode for mezzanine input")
    if copy and a is not None and a["codec_name"]!="aac":
        raise ValueError("Audio needs AAC for MP4 stream copy; use --reencode")
    args=["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(inp),"-map","0:v:0"]
    if a is not None:args.extend(["-map","0:a:0"])
    if lut:args.extend(["-vf","lut3d=file="+str(Path(lut).resolve())])
    if copy:args.extend(["-c:v","copy"])
    else:args.extend(["-c:v","libx264","-preset","slow","-crf",str(crf),"-profile:v","high","-pix_fmt","yuv420p"])
    if a is None:args+=["-an"]
    elif a["codec_name"]=="aac":args+=["-c:a","copy"]  # Never needlessly recompress an existing soundtrack.
    else:args+=["-c:a","aac","-b:a","256k","-ar","48000"]
    args+=["-movflags","+faststart",str(out)]
    return args

def run(inp,out,lut=None,reencode=False,crf=16):
    args=make_command(inp,out,lut,reencode,crf)
    Path(out).parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(args,check=True,timeout=1800)
    info,v,a=inspect(out)
    src_info,src_v,src_a=inspect(inp)
    if (v['width'],v['height'],v['r_frame_rate'])!=(src_v['width'],src_v['height'],src_v['r_frame_rate']):
        raise ValueError('Export changed dimensions or nominal frame rate')
    if src_v.get('nb_frames') and v.get('nb_frames') and src_v['nb_frames']!=v['nb_frames']:
        raise ValueError('Export lost or duplicated video frames')
    if src_a is not None and a is None:raise ValueError('Export unexpectedly lost audio')
    cmd("ffmpeg","-v","error","-xerror","-i",str(out),"-f","null","-",timeout=1800)
    return {"status":"PASS","file":str(out),"source":str(inp),
            "codec":v["codec_name"],"frames":v.get("nb_frames"),
            "dimensions":[v["width"],v["height"]],"fps":v["r_frame_rate"],
            "reencoded":not ("-c:v" in args and args[args.index("-c:v")+1]=="copy"),"lut":str(lut) if lut else None,
            "audioCopied":bool(a is not None and '-c:a' in args and args[args.index('-c:a')+1]=='copy'),
            "fullDecode":"PASS"}
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--input",required=True)
    p.add_argument("--output",required=True)
    p.add_argument("--lut")
    p.add_argument("--reencode",action="store_true")
    p.add_argument("--crf",type=int,default=16)
    p.add_argument("--dry-run",action="store_true")
    args=p.parse_args()
    if args.dry_run:print(json.dumps(make_command(args.input,args.output,args.lut,args.reencode,args.crf)))
    else:print(json.dumps(run(args.input,args.output,args.lut,args.reencode,args.crf),indent=2))
