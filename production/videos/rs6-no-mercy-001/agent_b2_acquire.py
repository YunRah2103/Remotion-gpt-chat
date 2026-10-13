#!/usr/bin/env python3
"""RS6 B2 creator metadata + bounded temporary decode attempts.

No unapproved creator media, still frames or thumbnail screenshots are uploaded.
A successful ffprobe is TECHNICAL ONLY, never a redistribution licence.
"""
import json, os, re, hashlib, subprocess, shutil, time
from pathlib import Path
from yt_dlp import YoutubeDL
from yt_dlp.utils import download_range_func

OUT = Path("b2-evidence")
SCRATCH = Path("b2-private-preview")
OUT.mkdir(exist_ok=True); SCRATCH.mkdir(exist_ok=True)
ITEMS = [
    ("auditography-c8", "https://www.youtube.com/watch?v=8l9D4aS0IIs", 698, 20),
    ("cinematicsergeant", "https://www.tiktok.com/@cinematicsergeant/video/7470664623297940758", 0, 6),
    ("wavescinematic", "https://www.tiktok.com/@wavescinematic/video/7524448591889354039", 0, 6),
    ("drivingapproach", "https://www.tiktok.com/@drivingapproach/video/7201922094605618438", 0, 6),
    ("racingautomobiles", "https://www.tiktok.com/@racingautomobiles/video/7433667098313903376", 0, 6),
]
def opts():
    return dict(quiet=True, no_warnings=True, skip_download=True,
        socket_timeout=12, retries=1, fragment_retries=1,
        extractor_retries=1, noplaylist=True)
def runprobe(path):
    p=subprocess.run(["ffprobe","-v","error","-show_entries",
      "format=duration,size:stream=codec_name,codec_type,width,height,avg_frame_rate",
      "-of","json",str(path)],capture_output=True,text=True,timeout=25)
    dec=subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
      "-xerror","-i",str(path),"-f","null","-"],capture_output=True,text=True,timeout=90)
    return dict(probe=json.loads(p.stdout) if p.returncode==0 else {},
       probe_rc=p.returncode,full_decode_rc=dec.returncode,
       decode_error=dec.stderr[-250:],sha256=hashlib.sha256(path.read_bytes()).hexdigest())
def extract_one(key,url,start,seconds):
    report={"key":key,"url":url,"requested_start_sec":start,
       "requested_duration_sec":seconds,"rights":"NOT CLEARED",
       "redistribution":"NOT PERMITTED without explicit creator approval"}
    try:
        with YoutubeDL(opts()) as dl:
            info=dl.extract_info(url,download=False)
        if not info:
            raise ValueError("No video metadata returned")
        title=info.get("title") or ""
        desc=info.get("description") or ""
        channel=info.get("uploader") or ""
        report.update(title=title,channel=channel,source_duration=info.get("duration"),
            webpage_url=info.get("webpage_url"),license_metadata=info.get("license"),
            source_height_max=max((f.get("height") or 0 for f in info.get("formats",[])),default=0))
        identity=title+" "+desc[:1500]
        report["rs6_title_or_description"]=bool(re.search(r"(?:\brs\s*6\b|audi\s+rs6)",identity,re.I))
        report["possible_c8"]=bool(re.search(r"\bc8\b|202[0-6]|new\s+rs6",identity,re.I))
        report["reject_other_car"]=bool(re.search(r"\brs\s*7\b|\bc7\b|forza|assetto|video\s*game|render|cgi",title,re.I))
        if not report["rs6_title_or_description"] or not report["possible_c8"] or report["reject_other_car"]:
            report["status"]="REJECT_METADATA_NOT_CONFIRMED_C8"
            return report
        if info.get("duration") and start+seconds>float(info["duration"]):
            report["status"]="REJECT_TOO_SHORT"; return report
        fmt="bv*[height<=1080]+ba/b[height<=1080]/b"
        sub=SCRATCH/key
        sub.mkdir(exist_ok=True)
        dlopts=opts()
        dlopts.update(skip_download=False,format=fmt,merge_output_format="mp4",
            outtmpl=str(sub/"sample.%(ext)s"),
            download_ranges=download_range_func(None,[(start,start+seconds)]),
            force_keyframes_at_cuts=True)
        with YoutubeDL(dlopts) as dl:
            code=dl.download([url])
        files=[p for p in sub.iterdir() if p.suffix.lower() in (".mp4",".mkv",".webm")]
        if code!=0 or not files:
            report["status"]="DOWNLOAD_FAILED_OR_EMPTY";return report
        path=max(files,key=lambda p:p.stat().st_size)
        report.update(runprobe(path))
        vs=[v for v in report.get("probe",{}).get("streams",[]) if v.get("codec_type")=="video"]
        good=bool(vs) and max(v.get("width",0) for v in vs)>=1080 and report["full_decode_rc"]==0
        report["status"]="TEMPORARY_FULL_DECODE_NATIVE_WIDTH_PASS" if good else "REJECT_NATIVE_OR_DECODE"
        report["media_published"]=False
        return report
    except Exception as e:
        report["status"]="ERROR";report["error"]=str(e)[-500:];return report
    finally:
        shutil.rmtree(SCRATCH/key,ignore_errors=True)
def discover():
    queries=[
      "ytsearch5:Audi RS6 C8 cinematic rolling shots 4K tunnel",
      "ytsearch5:Audi RS6 C8 night drive cinematic 4K tracking",
      "ytsearch5:Audi RS6 C8 wet road chase camera 4K"
    ]
    results=[]
    for q in queries:
        try:
            with YoutubeDL(dict(opts(), extract_flat="in_playlist")) as dl:
                i=dl.extract_info(q,download=False)
            for ent in (i or {}).get("entries",[])[:5]:
                if ent:
                    results.append({"query":q,"id":ent.get("id"),"title":ent.get("title"),
                      "uploader":ent.get("uploader"),"url":ent.get("url")})
        except Exception as e:
            results.append({"query":q,"error":str(e)[-350:]})
    return results
def main():
    result=[]
    for a in ITEMS:
        rec=extract_one(*a);result.append(rec)
        print(a[0],rec["status"],rec.get("title",""),flush=True)
    (OUT/"candidate_tests.json").write_text(json.dumps(result,indent=2))
    discovered=discover()
    (OUT/"youtube_discovery.json").write_text(json.dumps(discovered,indent=2))
    (OUT/"README.txt").write_text("Technical QA metadata only. All creator media processed privately and deleted immediately; not rights cleared. No playable video asset is delivered. Source approvals must follow #44 and V4 registry process.\n")
    print("DISCOVERY_ENTRIES",len(discovered))
if __name__=="__main__":
    main()
