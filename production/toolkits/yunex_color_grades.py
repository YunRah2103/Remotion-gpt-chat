#!/usr/bin/env python3
"""YUNEX Premium Looks: original SDR automotive film grades.

Generate standard .cube 3D LUTs, preview on source frames, or grade an isolated
MP4 without changing the source or original encoded audio.
Pure Python + FFmpeg. Pillow is optional for the contact-sheet command.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile

# Conservative, original looks: no purchased LUTs or third-party asset licenses.
# Each RGB offset is in normalized encoded 0..1 display RGB units.
LOOKS = {
    "emerald-noir": {
        "title": "Emerald Noir", "bestFor": "Metallic green luxury cars, overcast roads and moody nights",
        "contrast": 1.105, "exposure": -.018, "lift": .009, "white": .020,
        "saturation": 1.055, "vibrance": .075,
        "shadows": (-.012, .010, .008), "mids": (-.005, .007, -.002),
        "highlights": (.014, .011, .003),
    },
    "monaco-gold": {
        "title": "Monaco Gold", "bestFor": "Golden-hour luxury, warm city lights and elegant tracking",
        "contrast": 1.065, "exposure": .012, "lift": .010, "white": .016,
        "saturation": 1.035, "vibrance": .055,
        "shadows": (-.006, .002, .014), "mids": (.008, .004, -.007),
        "highlights": (.022, .010, -.014),
    },
    "arctic-silver": {
        "title": "Arctic Silver", "bestFor": "Silver or white supercars, glossy details and crisp architecture",
        "contrast": 1.12, "exposure": .014, "lift": .006, "white": .011,
        "saturation": .94, "vibrance": .040,
        "shadows": (-.007, .006, .015), "mids": (-.003, .003, .004),
        "highlights": (.008, .009, .011),
    },
    "midnight-cobalt": {
        "title": "Midnight Cobalt", "bestFor": "Blue-hour driving, tunnels, rainy roads and cold metallic reflections",
        "contrast": 1.11, "exposure": -.032, "lift": .010, "white": .018,
        "saturation": 1.02, "vibrance": .050,
        "shadows": (-.018, .000, .025), "mids": (-.007, .002, .009),
        "highlights": (.009, .010, .013),
    },
    "track-attack": {
        "title": "Track Attack", "bestFor": "Fast circuits, aggressive McLaren/Porsche/NASCAR performance cuts",
        "contrast": 1.185, "exposure": .000, "lift": .004, "white": .009,
        "saturation": 1.12, "vibrance": .070,
        "shadows": (-.006, .001, .006), "mids": (.002, .001, -.002),
        "highlights": (.009, .006, .003),
    },
    "heritage-film": {
        "title": "Heritage Film", "bestFor": "Classic cars, timeless archival-inspired storytelling, nostalgic edits",
        "contrast": 1.045, "exposure": -.006, "lift": .023, "white": .026,
        "saturation": .88, "vibrance": .025,
        "shadows": (.008, .004, -.005), "mids": (.008, .003, -.007),
        "highlights": (.018, .011, -.006),
    },
    "sunset-rose": {
        "title": "Sunset Rose", "bestFor": "Romantic orange-pink sky, seaside drives and warm polished paint",
        "contrast": 1.055, "exposure": .020, "lift": .012, "white": .016,
        "saturation": 1.02, "vibrance": .045,
        "shadows": (.007, -.006, .009), "mids": (.010, -.004, -.003),
        "highlights": (.023, .008, -.009),
    },
    "studio-clean": {
        "title": "Studio Clean", "bestFor": "Official car-show footage, paint accuracy, engineering explainers",
        "contrast": 1.045, "exposure": .003, "lift": .003, "white": .007,
        "saturation": 1.018, "vibrance": .018,
        "shadows": (-.002, .002, .002), "mids": (.000, .000, .000),
        "highlights": (.003, .003, .002),
    },
}


def clip(v):
    return min(1., max(0., v))


def grade(rgb, look):
    """Bounded display-referred grade preserving car paint more than preset gimmicks."""
    contrast, exposure = look["contrast"], look["exposure"]
    lift, white = look["lift"], look["white"]
    values = [clip(v ** (2 ** (-exposure))) for v in rgb]
    # Soft film-print style contrast: smooth at the endpoints to avoid crushing.
    values = [clip(v + (contrast-1)*4*(v-.5)*v*(1-v)
                   +lift*(1-v)**2-white*v*v) for v in values]
    luma = sum(a*b for a,b in zip(values,(.2126,.7152,.0722)))
    chroma = max(values)-min(values)
    factor = look["saturation"] * (1+look["vibrance"]*(1-min(1,chroma*2.5)))
    values = [clip(luma+(v-luma)*factor) for v in values]
    light = sum(a*b for a,b in zip(values,(.2126,.7152,.0722)))
    weights = ((1-light)**2, 4*light*(1-light), light**2)
    colors = [look[k] for k in ("shadows", "mids", "highlights")]
    return tuple(clip(v + sum(colors[j][i]*weights[j] for j in range(3)))
                 for i,v in enumerate(values))


def cube_text(name, size):
    if name not in LOOKS: raise ValueError("Unknown look")
    if size not in (17,33): raise ValueError("LUT size must be 17 or 33")
    look=LOOKS[name]
    lines = [
        "# YUNEX ORIGINAL CINEMATIC COLOUR GRADE - DISPLAY REFERRED SDR / Rec.709",
        "# Not an HDR or Log to Rec.709 transform; grade only compatible normalized SDR footage",
        f'TITLE "{look["title"]}"',
        f'LUT_3D_SIZE {size}',
        "DOMAIN_MIN 0 0 0",
        "DOMAIN_MAX 1 1 1",
    ]
    for bi in range(size):
        for gi in range(size):
            for ri in range(size):
                values=grade((ri/(size-1),gi/(size-1),bi/(size-1)),look)
                lines.append(" ".join(f"{v:.7f}" for v in values))
    return "\n".join(lines)+"\n"


def checksum(path):
    d=hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024*1024),b""):
            d.update(chunk)
    return d.hexdigest()


def ffprobe(source):
    data=json.loads(subprocess.run(
        ["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(source)],
        check=True,capture_output=True,text=True,timeout=45).stdout)
    video=next((s for s in data.get("streams",[]) if s.get("codec_type")=="video"),None)
    if not video: raise ValueError("Input has no video stream")
    return data,video


def ensure_sdr(video):
    transfer=video.get("color_transfer","unknown")
    primaries=video.get("color_primaries","unknown")
    if transfer in ("smpte2084","arib-std-b67"):
        raise ValueError("HDR/PQ/HLG source: colour-manage to SDR Rec.709 first; refusing to wash out HDR.")
    if primaries in ("bt2020", "smpte431", "smpte432"):
        raise ValueError("Wide-gamut footage: convert to SDR Rec.709 before using these display-referred LUTs.")
    if transfer in ("linear","log100","log316", "smpte428"):
        raise ValueError("Unsupported input transfer: normalize to SDR Rec.709 first.")


def strength_filter(lut_path, strength):
    # Generated LUT path is a simple temporary filename; no user path in filtergraph.
    lut=f"lut3d=file={lut_path.as_posix()}:interp=tetrahedral"
    if strength>=.99999:
        return lut
    if strength<=.00001:
        return "null"
    return (f"split=2[original][grading];[grading]{lut}[look];"
            f"[original][look]blend=all_expr=A*{1-strength:.5f}+B*{strength:.5f}")


def require_video(source):
    if not source.is_file():raise FileNotFoundError(str(source))
    data,video=ffprobe(source)
    ensure_sdr(video)
    return data,video


def generate(name, size, output_dir):
    output_dir.mkdir(parents=True,exist_ok=True)
    output=output_dir/(name+".cube")
    output.write_text(cube_text(name,size),encoding="utf8")
    return output


def apply(source, output, name, strength=.82, crf=18):
    if name not in LOOKS:raise ValueError("Unknown grade preset")
    if not 0<=strength<=1:raise ValueError("strength must be in [0,1]")
    if not 14<=crf<=25:raise ValueError("CRF must be between 14 and 25")
    source=source.resolve()
    output=output.resolve()
    if source==output:raise ValueError("Refusing to overwrite the original video")
    data,video=require_video(source)
    if float(data["format"].get("duration",0))>180:
        raise ValueError("This shortcut grades only clips <=180s; split long media into reviewed source shots")
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="yunex_lut_") as temp:
        lut=generate(name,33,Path(temp))
        filter_expr=strength_filter(lut,strength)
        command=[
            "ffmpeg","-hide_banner","-v","error","-nostdin","-y",
            "-i",str(source),"-map","0:v:0","-map","0:a?",
            "-vf",filter_expr,"-c:v","libx264","-preset","medium",
            "-crf",str(crf),"-pix_fmt","yuv420p",
            "-c:a","copy","-map_metadata","0","-movflags","+faststart",str(output),
        ]
        subprocess.run(command,check=True,timeout=1200)
    subprocess.run(["ffmpeg","-v","error","-xerror","-nostdin",
                    "-i",str(output),"-map","0:v:0","-f","null","-"],
                   check=True,timeout=600)
    decoded,after=ffprobe(output)
    original_duration=float(data["format"]["duration"])
    output_duration=float(decoded["format"]["duration"])
    if abs(original_duration-output_duration)>.25:
        raise ValueError("Output duration changed unexpectedly")
    orig_audio=[s for s in data["streams"] if s.get("codec_type")=="audio"]
    out_audio=[s for s in decoded["streams"] if s.get("codec_type")=="audio"]
    if [s.get("codec_name") for s in orig_audio]!=[s.get("codec_name") for s in out_audio]:
        raise ValueError("Output audio tracks do not match source")
    report={"schema":"yunex.cinematic-grade.v1","preset":name,
            "title":LOOKS[name]["title"],"strength":strength,
            "input":str(source),"inputSha256":checksum(source),
            "output":str(output),"outputSha256":checksum(output),
            "sourceDuration":original_duration,"outputDuration":output_duration,
            "inputResolution":[video["width"],video["height"]],
            "outputResolution":[after["width"],after["height"]],
            "audio":"source encoded audio streams copied without re-encoding",
            "videoDecode":"PASS",
            "scope":"SDR normalized footage only; not Log, HDR or raw cinema colour management",
            "note":"Check full native footage for banding, muddy paint, crushed grille and wrong colour identity."}
    output.with_suffix(".grade.json").write_text(json.dumps(report,indent=2)+"\n")
    return report


def preview(source, output_dir, strength=.82, timestamp=None, preset="all"):
    from PIL import Image,ImageDraw,ImageFont
    if not 0<=strength<=1:raise ValueError("strength must be in [0,1]")
    info,_=require_video(source)
    duration=float(info["format"]["duration"])
    sec=min(max(.05, duration/2 if timestamp is None else timestamp),max(.05,duration-.1))
    if sec>=duration: raise ValueError("No valid frame within source")
    names=list(LOOKS) if preset=="all" else [preset]
    if not all(n in LOOKS for n in names):raise ValueError("Unknown preset")
    output_dir.mkdir(parents=True,exist_ok=True)
    width,height=960,310
    sheet=Image.new("RGB",(width,height*len(names)),(16,17,19))
    dr=ImageDraw.Draw(sheet)
    rows=[]
    with tempfile.TemporaryDirectory(prefix="yunex_preview_") as temp:
        temp=Path(temp)
        for i,name in enumerate(names):
            lut=generate(name,17,temp)
            filter_expr=strength_filter(lut,strength)
            # Same decoded source frame on both sides; no misleading different camera angle.
            if filter_expr=="null":
                filtergraph="[0:v]scale=464:-2,split=2[a][b];[a][b]hstack=inputs=2[v]"
            else:
                filtergraph=(f"[0:v]scale=464:-2,split=2[a][b];"
                             f"[b]{filter_expr}[graded];[a][graded]hstack=inputs=2[v]")
            row=temp/f"{i:02d}.png"
            subprocess.run(["ffmpeg","-hide_banner","-v","error","-nostdin","-y",
                            "-ss",str(sec),"-i",str(source),"-filter_complex",filtergraph,
                            "-map","[v]","-frames:v","1",str(row)],
                           check=True,timeout=140)
            with Image.open(row) as im:
                rgb=im.convert("RGB")
                # letterbox while keeping both images un-stretched
                rgb.thumbnail((928,264))
                sheet.paste(rgb,((width-rgb.width)//2,i*height+37))
            dr.text((14,i*height+8),f"{LOOKS[name]['title']}    Original LEFT  |  Grade RIGHT",fill="white")
            rows.append({"preset":name,"timestamp":round(sec,3)})
    out=output_dir/"YUNEX-GRADE-COMPARISON.jpg"
    sheet.save(out,quality=90,subsampling=0)
    result={"schema":"yunex.look-preview.v1","source":str(source),"timestamp":round(sec,3),
            "strength":strength,"looks":rows,"contactSheet":str(out),
            "warning":"Preview contact sheet reduces resolution; judge the final filter on full-resolution moving video."}
    (output_dir/"preview.json").write_text(json.dumps(result,indent=2)+"\n")
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest="operation",required=True)
    sub.add_parser("list",help="Show all colour grades")
    e=sub.add_parser("export",help="Export 3D LUTs for video editors as .cube")
    e.add_argument("--preset",choices=["all"]+list(LOOKS),default="all")
    e.add_argument("--size",type=int,choices=[17,33],default=33)
    e.add_argument("--output-dir",type=Path,default=Path("out/yunex-luts"))
    for op in ("apply","preview"):
        s=sub.add_parser(op,help="Filter a copy of source footage" if op=="apply" else "Source-matched A/B grades")
        s.add_argument("--video",type=Path,required=True)
        s.add_argument("--preset",choices=(list(LOOKS) if op=="apply" else ["all"]+list(LOOKS)),
                       default="emerald-noir" if op=="apply" else "all")
        s.add_argument("--strength",type=float,default=.82)
        if op=="apply":
            s.add_argument("--output",type=Path,required=True)
            s.add_argument("--crf",type=int,default=18)
        else:
            s.add_argument("--output-dir",type=Path,default=Path("out/yunex-filter-previews"))
            s.add_argument("--time",type=float)
    args=parser.parse_args()
    if args.operation=="list":
        result={n:{"title":p["title"],"bestFor":p["bestFor"]} for n,p in LOOKS.items()}
    elif args.operation=="export":
        names=list(LOOKS) if args.preset=="all" else [args.preset]
        paths=[generate(n,args.size,args.output_dir) for n in names]
        result={"lutSize":args.size,"files":[{"path":str(p),"sha256":checksum(p)} for p in paths]}
        (args.output_dir/"manifest.json").write_text(json.dumps(result,indent=2)+"\n")
    elif args.operation=="apply":
        result=apply(args.video,args.output,args.preset,args.strength,args.crf)
    else:
        result=preview(args.video,args.output_dir,args.strength,args.time,args.preset)
    print(json.dumps(result,indent=2))


if __name__=="__main__":
    main()
