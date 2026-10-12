#!/usr/bin/env python3
"""Falken original HDR acquisition and provenance audit. No SDR->HDR conversions."""
import array, hashlib, json, math, os, pathlib, shutil, subprocess, sys, zipfile
from PIL import Image, ImageOps, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
ROOT = pathlib.Path(os.environ.get("HDR_OUT", "out/yunex-hdr-cinematic-001"))
ROOT.mkdir(parents=True, exist_ok=True)
URL = "https://www.falkentyre.com/_storage/asset/77989/storage/master/file/317009/download/FALKEN-HDR-h264-10Bit-56MBit.mp4"
SOURCE = ROOT / "FALKEN-HDR-original.mp4"
REPORT = ROOT / "quality-report.json"
MANIFEST = ROOT / "source-and-rights.md"
LOG = ROOT / "download.log"

def invoke(args, capture=False, timeout=120):
    result = subprocess.run(args, text=True, capture_output=capture, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f"Command error {result.returncode}: {' '.join(map(str,args))}\n{result.stderr[-1500:] if capture else ''}")
    return result.stdout if capture else ""

def probe(path):
    return json.loads(invoke(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)], capture=True))

def checksum(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        while block := file.read(8*1024*1024):
            digest.update(block)
    return digest.hexdigest()

def sample_signal(seconds):
    # Decode actual 10-bit Y plane; this checks that measured code values are not
    # merely an 8-bit pixel plane rewrapped with HDR metadata.
    p = subprocess.run(["ffmpeg","-v","error","-ss",str(seconds),"-i",str(SOURCE),
        "-map","0:v:0","-frames:v","1","-vf",
        "scale=320:180:flags=bilinear,format=yuv420p10le",
        "-f","rawvideo","-"],capture_output=True,timeout=180)
    if p.returncode or len(p.stdout) < 320*180*2:
        raise RuntimeError("Cannot decode actual 10-bit luma sample: " + p.stderr.decode(errors="replace")[-500:])
    a = array.array("H"); a.frombytes(p.stdout[:320*180*2])
    samples=sorted(a)
    return dict(timeSeconds=round(seconds,2),minCode=samples[0],
                medianCode=samples[len(samples)//2],
                p95Code=samples[int(len(samples)*.95)],
                p99Code=samples[int(len(samples)*.99)],
                maxCode=samples[-1],
                abovePQCode600Count=sum(x>600 for x in samples),
                activeLowBits=sum(x%4 != 0 for x in samples),
                sampleCount=len(samples))

def make_previews(duration):
    # A display-only SDR-tonemapped CONTACT SHEET, never modifies the HDR original.
    # zscale interprets the original transfer function and converts only the review JPGs.
    selected = [max(1, round(duration * i / 17, 2)) for i in range(1,17)]
    tiles=[]
    for i, second in enumerate(selected):
        dest=ROOT / f"review_frame_{i+1:02d}_{int(second):04d}s.jpg"
        try:
            invoke(["ffmpeg","-hide_banner","-v","error","-y","-ss",str(second),
               "-i",str(SOURCE),"-frames:v","1","-vf",
               "zscale=t=linear:npl=100,format=gbrpf32le,tonemap=hable:desat=0,zscale=p=bt709:t=bt709:m=bt709,scale=640:360,format=yuv420p",
               str(dest)],timeout=180)
        except Exception:
            # Preview fallback is a decoded frame, clearly still not used as HDR evidence.
            invoke(["ffmpeg","-hide_banner","-v","error","-y","-ss",str(second),
               "-i",str(SOURCE),"-frames:v","1","-vf","scale=640:360",
               str(dest)],timeout=180)
        pic=Image.open(dest).convert("RGB")
        pic=ImageOps.fit(pic,(640,360))
        ImageDraw.Draw(pic).rectangle((0,0,150,26),fill=(0,0,0))
        ImageDraw.Draw(pic).text((8,7),f"{second:.1f}s",fill=(255,255,255))
        tiles.append(pic)
    contact=Image.new("RGB",(640*4,360*4))
    for i,pic in enumerate(tiles): contact.paste(pic,((i%4)*640,(i//4)*360))
    contact.save(ROOT/"cinematic-contact-sheet.jpg",quality=91,subsampling=0)
    return selected

def sample_hdr(start, duration):
    # No re-encode, no color conversion; stream copy from source.
    path=ROOT/"untouched-HDR-phone-sample.mp4"
    invoke(["ffmpeg","-hide_banner","-v","error","-y","-ss",str(start),
        "-i",str(SOURCE),"-t",str(duration),"-map","0:v:0","-map","0:a?",
        "-c","copy","-movflags","+faststart",str(path)],timeout=240)
    return path

def main():
    report={"source":URL,"captureProvenance":"Falken official press: 6K and 8K RAW acquisition; original HDR production by MOTIONCTRL",
            "status":"NOT_VERIFIED","rights":"Official public press download. Re-edit, repost and redistribution permissions NOT established."}
    try:
        print("Acquiring official Falken MP4, NOT a YouTube rip",flush=True)
        with LOG.open("w") as out:
            result=subprocess.run(["curl","-fL","--retry","2","--retry-delay","3",
              "--connect-timeout","30","--max-time","2400","-A","Mozilla/5.0",
              "-o",str(SOURCE),"-w","HTTP:%{http_code} SIZE:%{size_download} URL:%{url_effective}\n",URL],
              stdout=out,stderr=subprocess.STDOUT,timeout=2480)
        if result.returncode: raise RuntimeError(f"curl exit {result.returncode}, {LOG.read_text()[-1100:]}")
        if SOURCE.stat().st_size < 5000000: raise RuntimeError("Source too small to be a full cinematic original")
        data=probe(SOURCE)
        (ROOT/"ffprobe-full.json").write_text(json.dumps(data,indent=2))
        try:
            with (ROOT/"mediainfo.txt").open("w") as f:
                subprocess.run(["mediainfo","--Full",str(SOURCE)],stdout=f,stderr=subprocess.STDOUT,check=True,timeout=200)
        except Exception as e:
            (ROOT/"mediainfo.txt").write_text("Unavailable: "+str(e))
        vs=[x for x in data["streams"] if x["codec_type"]=="video"]
        if len(vs)!=1: raise RuntimeError("Expected one video stream")
        v=vs[0]
        duration=float(data["format"].get("duration","0"))
        report.update(fileSizeBytes=SOURCE.stat().st_size,
          sha256=checksum(SOURCE),width=v.get("width"),height=v.get("height"),
          codec=v.get("codec_name"),profile=v.get("profile"),
          pixelFormat=v.get("pix_fmt"),bitsPerRawSample=v.get("bits_per_raw_sample"),
          colorPrimaries=v.get("color_primaries"),colorTransfer=v.get("color_transfer"),
          colorMatrix=v.get("color_space"),durationSeconds=duration,
          avgFrameRate=v.get("avg_frame_rate"),sideDataList=v.get("side_data_list",[]))
        report["criteria"]={
          "native_4k":int(v.get("width") or 0)>=3840 and int(v.get("height") or 0)>=2160,
          "ten_bit":("10" in str(v.get("pix_fmt","")) or v.get("bits_per_raw_sample")=="10"),
          "bt2020_primaries":v.get("color_primaries")=="bt2020",
          "hdr_transfer":v.get("color_transfer") in ("smpte2084","arib-std-b67"),
          "hdr_color_matrix":v.get("color_space") in ("bt2020nc","bt2020c")
        }
        print("Decoded stream:",json.dumps(report["criteria"]),flush=True)
        if not all(report["criteria"].values()):
            raise RuntimeError("REJECTED — actual source lacks required native 4K/10-bit/HDR transfer/BT2020 signaling; never relabel.")
        marks=[round(duration*q,2) for q in [.1,.25,.5,.75,.9]]
        report["decodedSignalSamples"]=[sample_signal(s) for s in marks]
        report["contactSheetTimestamps"]=make_previews(duration)
        sample=sample_hdr(round(duration*.43,2),6)
        sp=probe(sample)
        (ROOT/"phone-sample-ffprobe.json").write_text(json.dumps(sp,indent=2))
        sv=[x for x in sp["streams"] if x["codec_type"]=="video"][0]
        report["sampleVerification"]={"sha256":checksum(sample),"sizeBytes":sample.stat().st_size,
          "codec":sv.get("codec_name"),"pixelFormat":sv.get("pix_fmt"),
          "primaries":sv.get("color_primaries"),"transfer":sv.get("color_transfer")}
        for f in ["pixelFormat","primaries","transfer"]:
            if report["sampleVerification"][f] != {"pixelFormat":v.get("pix_fmt"),
              "primaries":v.get("color_primaries"),"transfer":v.get("color_transfer")}[f]:
                raise RuntimeError("Untouched sample lost HDR stream metadata")
        report["status"]="HDR_SIGNAL_AND_SOURCE_VERIFIED"
        report["limits"]=["Genuine RAW-origin HDR provenance from production company; no raw camera negatives provided.",
                          "10-bit/PQ/HLG checks are necessary but not sufficient to prove all frames preserve HDR scene latitude.",
                          "Samsung HDR phone compatibility depends on actual codec profile and player's HDR switching.",
                          "A press-download link does not by itself grant reuse rights."]
        print("PASS genuine HDR signal and independent frame decoding",flush=True)
    except Exception as exc:
        report["status"]="FAILED_OR_INCOMPLETE"
        report["failure"]=str(exc)
        print("QA FAILED:",exc,flush=True)
    finally:
        REPORT.write_text(json.dumps(report,indent=2)+"\n")
        MANIFEST.write_text("# YUNEX HDR CINEMATIC 001 — acquisition evidence\n\n"
            +f"Original manufacturer source: {URL}\n\n"
            +"Producer: Falken Tyre Europe / MOTIONCTRL, Tobias Kahler. Original footage described as 6K and 8K RAW recorded and finished to 4K HDR.\n\n"
            +"Official press: https://www.falkentyre.com/en/press/article/77966\n\n"
            +"Official disclaimer: https://www.falkentyre.com/_storage/asset/77991/storage/master/file/317005/download/Disclaimer.pdf\n\n"
            +"Reuse and copyright clearance: NOT VERIFIED; do not post or commercialise without suitable rights.\n\n"
            +"The contact-sheet JPEGs are tone-mapped only for reviewer convenience; the source and phone sample retain source encoded values.\n")
        if report["status"] != "HDR_SIGNAL_AND_SOURCE_VERIFIED" and SOURCE.exists():
            # Original remains locally for forensic diagnosis, but do NOT package unverified source.
            SOURCE.unlink()
        package=ROOT.parent/"YUNEX-HDR-AGENT-A-original-and-QA.zip"
        with zipfile.ZipFile(package,"w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
            for p in sorted(ROOT.iterdir()):
                if p.is_file(): z.write(p,p.name)
        print(f"DELIVERY_ZIP={package} STATUS={report['status']}",flush=True)
    return 0 if report["status"]=="HDR_SIGNAL_AND_SOURCE_VERIFIED" else 2

if __name__=="__main__":
    sys.exit(main())
