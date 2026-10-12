#!/usr/bin/env python3
"""Second-pass real native-pixel HDR luminance and visual inspection audit."""
import json, pathlib, subprocess, hashlib, os
import numpy as np
from PIL import Image, ImageOps, ImageDraw
D=pathlib.Path("production/videos/yunex-hdr-cinematic-001/qa-inspection")
D.mkdir(parents=True,exist_ok=True)
TMP=pathlib.Path("/tmp/yunex-hdr-falken-source.mp4")
URL="https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4"
def sh(args,timeout=600):
    r=subprocess.run(args,capture_output=True,timeout=timeout)
    if r.returncode:raise RuntimeError(str(args)+" -> "+r.stderr.decode(errors="replace")[-900:])
    return r.stdout
def probe(f):return json.loads(sh(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(f)],timeout=60))
print("Downloading official master for independent full-resolution highlight scan",flush=True)
subprocess.run(["curl","-fL","--retry","2","--connect-timeout","30","--max-time","2400","-o",str(TMP),URL],check=True,timeout=2450)
meta=probe(TMP)
v=next(s for s in meta["streams"] if s["codec_type"]=="video")
w,h=int(v["width"]),int(v["height"])
duration=float(meta["format"]["duration"])
assert w==3840 and h==2160 and v.get("pix_fmt")=="yuv420p10le" and v.get("color_transfer")=="smpte2084"
sums=[]
frames=[]
for i in range(16):
    t=round((i+.5)*duration/16,2)
    b=sh(["ffmpeg","-v","error","-ss",str(t),"-i",str(TMP),"-frames:v","1",
        "-vf","format=yuv420p10le","-f","rawvideo","-"],timeout=180)
    y=np.frombuffer(b,dtype="<u2",count=w*h)
    m={"timeSeconds":t,"maxCode":int(y.max()),"p99Code":round(float(np.percentile(y,99)),2),
       "p999Code":round(float(np.percentile(y,99.9)),2),
       "aboveCode550":int(np.count_nonzero(y>550)),"aboveCode600":int(np.count_nonzero(y>600)),
       "aboveCode700":int(np.count_nonzero(y>700)),"pixelCount":int(y.size)}
    sums.append(m)
    dst=D/f"inspect-{i+1:02}.jpg"
    try:
        sh(["ffmpeg","-v","error","-y","-ss",str(t),"-i",str(TMP),"-frames:v","1",
          "-vf","zscale=t=linear:npl=100,format=gbrpf32le,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709,scale=640:360,format=yuv420p",str(dst)],timeout=180)
    except Exception:
        sh(["ffmpeg","-v","error","-y","-ss",str(t),"-i",str(TMP),"-frames:v","1",
          "-vf","scale=640:360","-frames:v","1",str(dst)],timeout=180)
    pic=Image.open(dst).convert("RGB")
    pic=ImageOps.fit(pic,(640,360))
    draw=ImageDraw.Draw(pic)
    draw.rectangle((0,0,280,28),fill=(0,0,0))
    draw.text((8,9),f"{t:.1f}s  PQ Y max:{m['maxCode']}",fill=(255,255,255))
    frames.append(pic)
    print("FRAME",json.dumps(m),flush=True)
sheet=Image.new("RGB",(2560,1440))
for i,pic in enumerate(frames): sheet.paste(pic,((i%4)*640,(i//4)*360))
sheet.save(D/"hdr-cinematic-contact-sheet.jpg",quality=83,optimize=True)
sha=hashlib.sha256()
with TMP.open("rb") as f:
    while b:=f.read(8*1024*1024):sha.update(b)
result={"source":URL,"checksum":sha.hexdigest(),"durationSeconds":duration,
    "method":"16 native-resolution 3840x2160 Y samples from untouched 10-bit PQ H.264 original.",
    "caveat":"PQ video luma code values are not a precise HDR colour-managed luminance measurement; good evidence of available encoded highlight excursion, not camera dynamic-range proof.",
    "frames":sums,"globalMaxCodeOfSamples":max(m["maxCode"] for m in sums),
    "framesWithAnyCodeAbove600":sum(m["aboveCode600"]>0 for m in sums),
    "framesWithAnyCodeAbove700":sum(m["aboveCode700"]>0 for m in sums)}
(D/"native-hdr-pixel-audit.json").write_text(json.dumps(result,indent=2)+"\n")
(D/"REVIEW.md").write_text("# YUNEX HDR — Native-pixel source audit\n\n"
    +"Origin: "+URL+"\n\n"
    +f"Original SHA-256: \`{sha.hexdigest()}\`\n\n"
    +f"16 full-resolution sampled frames. Highest Y PQ code: {result['globalMaxCodeOfSamples']}/1023. "
    +f"Frames exceeding code 600 (about 215 nits if treated as PQ neutral): {result['framesWithAnyCodeAbove600']}/16.\n\n"
    +"The JPEG contact sheet is SDR tone-mapped only for reviewing composition. It is not proof of HDR and not a source for the edit.\n\n"
    +"Original video is delivered separately in the first successful QA artifact. This second pass does not upload/repackage it.\n")
# Phone playback-compatibility SAMPLE, HDR transfer retained; derivative, never labelled original.
sample=D/"derived-HEVC-Main10-HDR-phone-test.mp4"
sh(["ffmpeg","-hide_banner","-v","error","-y","-ss","36","-i",str(TMP),"-t","5",
    "-map","0:v:0","-an","-vf","scale=1920:1080:flags=lanczos,format=yuv420p10le",
    "-c:v","libx265","-preset","fast","-crf","17","-pix_fmt","yuv420p10le",
    "-color_primaries","bt2020","-color_trc","smpte2084","-colorspace","bt2020nc",
    "-tag:v","hvc1","-movflags","+faststart",str(sample)],timeout=600)
sp=next(s for s in probe(sample)["streams"] if s["codec_type"]=="video")
assert sp.get("codec_name")=="hevc" and sp.get("pix_fmt")=="yuv420p10le" and sp.get("color_transfer")=="smpte2084" and sp.get("color_primaries")=="bt2020"
(D/"HEVC-phone-test-audit.json").write_text(json.dumps({"type":"Derived compatibility transcode, not original source", "codec":sp.get("codec_name"),"pix_fmt":sp.get("pix_fmt"),"color_primaries":sp.get("color_primaries"),"color_transfer":sp.get("color_transfer")},indent=2))
print("SECOND-PASS AUDIT COMPLETE",json.dumps(result).slice(0,400),flush=True)
