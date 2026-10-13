#!/usr/bin/env python3
"""B2 real visual audit of eight technically proven 7s source clips.

Actual footage stays in temporary directories and is NOT put in artifacts.
Six reduced QA frames per video are assembled into a contact sheet strictly
for selecting viable RS6 C8 action; automated pixel change does not confirm
driving or ownership. Always check permission before republishing source clips.
"""
from __future__ import annotations
import hashlib
import json
import statistics
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw
from yt_dlp import YoutubeDL
from yt_dlp.utils import download_range_func

OUT = Path("b2-visual-audit")
OUT.mkdir(exist_ok=True)
(OUT / "contact_sheets").mkdir(exist_ok=True)
SOURCES = [
    ("fe78-rolling-xmas", "https://www.tiktok.com/@fe78_rs6/video/7450110951648513302"),
    ("fe78-rolling-wagon", "https://www.tiktok.com/@fe78_rs6/video/7412214954805267745"),
    ("fe78-schwarzwald", "https://www.tiktok.com/@fe78_rs6/video/7349887931160612129"),
    ("fe78-schwaegalp", "https://www.tiktok.com/@fe78_rs6/video/7346547136898583841"),
    ("luan-one", "https://www.tiktok.com/@luan_rs6/video/7695427075058011414"),
    ("luan-two", "https://www.tiktok.com/@luan_rs6/video/7690903160537369878"),
    ("luan-three", "https://www.tiktok.com/@luan_rs6/video/7687983791662566679"),
    ("luan-four", "https://www.tiktok.com/@luan_rs6/video/7684257290811231510"),
]

def execute(argv, timeout=90):
    try:
        p = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
        return p.returncode, p.stdout, p.stderr[-600:]
    except Exception as e:
        return 999, "", str(e)[:400]

def check_one(key,url):
    result = {
        "id": key, "url": url, "status": "UNTESTED",
        "source_rights": "Not verified",
        "editor_ready": False,
        "c8_identity": "NOT_VISUALLY_VERIFIED",
        "moving_driving": "NOT_VISUALLY_VERIFIED",
        "media_redistributed": False
    }
    with tempfile.TemporaryDirectory(prefix="b2-visual-") as d:
        d = Path(d)
        try:
            y = dict(quiet=True, no_warnings=True, skip_download=False,
                socket_timeout=13,retries=1,fragment_retries=1,extractor_retries=1,
                noplaylist=True,format="bv*+ba/b",merge_output_format="mp4",
                outtmpl=str(d/"sample.%(ext)s"),
                download_ranges=download_range_func(None,[(0,7)]),
                force_keyframes_at_cuts=True)
            with YoutubeDL(y) as downloader:
                info=downloader.extract_info(url,download=True)
            if info:
                result["title"]=(info.get("title") or "")[:180]
                result["uploader"]=info.get("uploader")
                result["source_duration"]=info.get("duration")
                result["license_metadata"]=info.get("license")
            clips=sorted([p for p in d.iterdir() if p.suffix in (".mp4",".mkv",".webm")],key=lambda p:p.stat().st_size,reverse=True)
            if not clips:
                result["status"]="DOWNLOAD_FAILED_NO_MP4";return result
            clip=clips[0]
            result["source_sample_sha256"]=hashlib.sha256(clip.read_bytes()).hexdigest()
            result["source_sample_bytes"]=clip.stat().st_size
            rc,out,err=execute(["ffprobe","-v","error","-show_entries",
                  "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size",
                  "-of","json",str(clip)],20)
            result["ffprobe"]=json.loads(out) if rc==0 else {"error":err}
            rc,_,err=execute(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                  "-xerror","-i",str(clip),"-f","null","-"],100)
            result["full_decode_pass"]=rc==0
            if rc: result["decode_error"]=err
            frames_dir=d/"frames"
            frames_dir.mkdir()
            rc,_,err=execute(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
                "-i",str(clip),"-vf","fps=1,scale=220:-2","-frames:v","7",
                str(frames_dir/"frame_%02d.jpg")],45)
            frames=sorted(frames_dir.glob("*.jpg"))
            result["frame_count_qa"]=len(frames)
            if not frames or rc:
                result.update(status="FRAME_QA_FAILED",frame_error=err)
                return result
            samples=[Image.open(p).convert("RGB") for p in frames[:7]]
            diffs=[]
            for a,b in zip(samples,samples[1:]):
                # Median absolute luma diff across samples indicates edit/action
                # intensity, NOT a trustworthy moving-car classification.
                da=a.convert("L").resize((96,168))
                db=b.convert("L").resize((96,168))
                histogram=ImageChops.difference(da,db).histogram()
                diffs.append(round(sum(i*v for i,v in enumerate(histogram))/(96*168*255),4))
            result["one_second_normalized_frame_diffs"]=diffs
            result["median_frame_diff"]=round(statistics.median(diffs),4) if diffs else 0
            shot=Image.new("RGB",(220*len(samples),samples[0].height+36),"#10171b")
            dr=ImageDraw.Draw(shot)
            for i,img in enumerate(samples):
                shot.paste(img,(220*i,36))
                dr.text((220*i+5,10),f"{key}: {i}s",fill="#FFFFFF")
            sheet=OUT/"contact_sheets"/(key+".jpg")
            shot.save(sheet,quality=85,optimize=True)
            result["contact_sheet"]=str(sheet)
            result["status"]="DECODE_AND_CONTACT_SHEET_PASS" if result["full_decode_pass"] else "DECODE_FAILED"
        except Exception as e:
            result["status"]="ERROR"
            result["error"]=str(e)[-600:]
        return result

def main():
    reports=[]
    for key,url in SOURCES:
        row=check_one(key,url)
        print("B2_VISUAL",row["id"],row["status"],row.get("median_frame_diff"),flush=True)
        reports.append(row)
        (OUT/"results.json").write_text(json.dumps(reports,indent=2))
    (OUT/"README.txt").write_text(
        "Technical QA, NOT a source footage delivery. Real moving media is "
        "fully decoded privately then deleted. Reduced still contact sheets are "
        "for visual verification only and carry no reuse rights. Pixel change "
        "cannot distinguish driving, camera pan, static car edits, or C8 identity.\n")

if __name__=="__main__":
    main()
