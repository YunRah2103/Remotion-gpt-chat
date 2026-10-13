#!/usr/bin/env python3
"""C2: discover additional original creator RS6 detail shorts and test real source bytes.
Source video stays transient. Public Actions artifacts contain QA metadata and review frames only.
No rights granted or inferred by access, GitHub artifacts, or successful FFmpeg decoding.
"""
import hashlib, json, os, pathlib, re, shutil, subprocess, tempfile
from datetime import datetime, timezone

OUT = pathlib.Path("c2_feed_qa")
OUT.mkdir(exist_ok=True)
ACCOUNTS = ["https://www.tiktok.com/@glenmoreaudi"]
SEEN = {"7482802812783512887"}  # Previously verified LED/wheel insert; do not duplicate.
MAX_POSTS = 90
MAX_TRIALS = max(1,min(8,int(os.getenv("C2_FEED_LIMIT","4"))))
START_AT = max(0,int(os.getenv("C2_FEED_START","0")))
def execute(cmd, seconds=120):
    try:
        r = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=seconds)
        return {"rc":r.returncode, "stdout":r.stdout[-1500000:], "stderr":r.stderr[-1800:]}
    except Exception as e:
        return {"rc":-1, "stdout":"", "stderr":str(e)}

def discover(account):
    cmd=["yt-dlp","--dump-single-json","--flat-playlist","--playlist-end",str(MAX_POSTS),
      "--ignore-errors","--no-warnings","--socket-timeout","20",
      "--extractor-retries","2",account]
    result=execute(cmd, 130)
    if result["rc"] or not result["stdout"].strip(): return [], result
    try: data=json.loads(result["stdout"])
    except Exception:
        result["stderr"] += " | JSON parse error"
        return [], result
    candidates=[]
    for item in data.get("entries") or []:
        if not isinstance(item,dict): continue
        vid=str(item.get("id") or "")
        descr=" ".join(str(item.get(k) or "") for k in ("title","description","alt_title","fulltitle"))
        if vid in SEEN or not re.search(r"(?i)(?:\brs\s*6\b|\brs6\b)", descr):continue
        score=sum(int(bool(re.search(term,descr,re.I)))*points for term,points in (
          (r"headlight|led|light",5),(r"wheel|rim|brake|caliper",5),(r"exhaust|tail|grille|front|detail",4),
          (r"night|dark|black|cinematic|close",3),(r"avant|c8|202[0-6]",2)))
        url=item.get("webpage_url") or item.get("url") or ""
        if not url.startswith("https://www.tiktok.com/") or "/video/" not in url:
            if vid.isdecimal():url=f"https://www.tiktok.com/@glenmoreaudi/video/{vid}"
            else:continue
        candidates.append({"id":vid,"url":url,"title":descr[:500],"score":score})
    candidates.sort(key=lambda x:(-x["score"],x["id"]))
    return candidates,result

def probe(item):
    record=dict(item, rights_cleared=False, approved_for_release=False, claimed_c8_visual=False)
    with tempfile.TemporaryDirectory(prefix="rs6_c2_feed_") as tmp:
        tmp=pathlib.Path(tmp)
        fmt="bv*+ba/best"
        cmd=["yt-dlp","--no-playlist","--ignore-config","--no-progress",
          "--socket-timeout","20","--retries","2","--fragment-retries","2",
          "--download-sections","*0-8", "--merge-output-format","mp4",
          "-f",fmt, "-o",str(tmp/"source.%(ext)s"),item["url"]]
        r=execute(cmd,150)
        record["download_status"]={"rc":r["rc"],"stderr":r["stderr"][-1000:]}
        vids=list(tmp.glob("source.*"))
        vids=[f for f in vids if f.suffix.lower() in (".mp4",".mkv",".webm") and f.stat().st_size>100000]
        if not vids:
            record["status"]="NO_VIDEO_BYTES";return record
        source=max(vids,key=lambda p:p.stat().st_size)
        record["bytes"]=source.stat().st_size
        record["sha256"]=hashlib.file_digest(open(source,"rb"),"sha256").hexdigest()
        info=execute(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(source)],40)
        if info["rc"]:
            record["status"]="FFPROBE_FAIL";record["ffprobe_error"]=info["stderr"];return record
        data=json.loads(info["stdout"])
        stream=next((s for s in data.get("streams",[]) if s.get("codec_type")=="video"),{})
        record["width"]=stream.get("width",0);record["height"]=stream.get("height",0)
        record["fps"]=stream.get("avg_frame_rate");record["codec"]=stream.get("codec_name")
        record["duration"]=data.get("format",{}).get("duration")
        record["native_portrait_hd"]=(record["width"]>=1080 and record["height"]>=1920)
        decode=execute(["ffmpeg","-hide_banner","-loglevel","error","-xerror",
                         "-i",str(source),"-map","0:v:0","-f","null","-"],70)
        record["full_decode_pass"]=decode["rc"]==0
        record["decode_error"]=decode["stderr"][-450:]
        if record["full_decode_pass"]:
            thumbs=[]
            for t in (0.4,1.1,2.0,3.2,4.7,6.5):
                dest=OUT/(item["id"]+"_"+str(t).replace(".","p")+".jpg")
                z=execute(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),
                  "-i",str(source),"-frames:v","1","-vf","scale=540:-2",
                  "-q:v","4","-y",str(dest)],30)
                if z["rc"]==0 and dest.exists():thumbs.append(str(dest))
            if len(thumbs)==6:
                contact=OUT/(item["id"]+"_contact.jpg")
                cmd=["ffmpeg","-hide_banner","-loglevel","error","-y"]
                for f in thumbs:cmd+=["-i",f]
                cmd+=["-filter_complex","hstack=inputs=6","-frames:v","1",str(contact)]
                z=execute(cmd,45)
                if z["rc"]==0 and contact.exists():record["contact_sheet"]=contact.name
            record["qa_frames"]=[pathlib.Path(x).name for x in thumbs]
        record["status"]="NATIVE_HD_QA_PENDING" if record["full_decode_pass"] and record["native_portrait_hd"] else "REJECT_TECHNICAL"
    return record

all_candidates=[];logs={}
for account in ACCOUNTS:
    candidates,status=discover(account)
    logs[account]={"discovered":len(candidates),"rc":status["rc"],"error":status["stderr"][-800:]}
    all_candidates.extend(candidates)
unique={c["id"]:c for c in all_candidates}
ranked=sorted(unique.values(),key=lambda x:(-x["score"],x["id"]))
results=[probe(c) for c in ranked[START_AT:START_AT+MAX_TRIALS]]
report={"as_of":datetime.now(timezone.utc).isoformat(),"agent":"C2",
  "target":"additional non-duplicative C8 RS6 micro-cinematography","accounts":logs,
  "candidate_count":len(ranked),"start_at":START_AT,"candidate_titles":ranked[:25],
  "tested":results,"cleared_release_mp4s":0,
  "raw_media_uploaded":False,"source_media_deleted":True,
  "notes":"Native dimensions and valid decode are not C8 identity, shot quality or reuse permission. Human review required. Previous Glenmore source intentionally excluded."}
(OUT/"feed_report.json").write_text(json.dumps(report,indent=2))
print(json.dumps({"sources_found":len(ranked),"tested":[(r["id"],r["status"],r.get("width"),r.get("height")) for r in results]},indent=2))
