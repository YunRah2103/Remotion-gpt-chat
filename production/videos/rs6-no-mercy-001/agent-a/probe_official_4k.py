#!/usr/bin/env python3
"""Report technical metadata for Audi's public UHD source without uploading media."""
import json, os, pathlib, subprocess
url=os.environ.get("RS6_PROBE_URL","")
out=pathlib.Path("/tmp/rs6-out")
out.mkdir(parents=True,exist_ok=True)
result={"status":"no_source","public_video_uploaded":False,"rights_cleared":False}
if url.startswith("https://"):
    try:
        p=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",url],capture_output=True,text=True,timeout=120)
        if p.returncode: raise RuntimeError(p.stderr[-300:])
        data=json.loads(p.stdout)
        video=next(x for x in data["streams"] if x.get("codec_type")=="video")
        result={"status":"metadata_ok","video":{k:video.get(k) for k in ("width","height","codec_name","avg_frame_rate")},"duration":data["format"].get("duration"),"public_video_uploaded":False,"rights_cleared":False}
    except Exception as e:
        result["status"]="metadata_error"
        result["error"]=str(e)[:300]
(out/"official_4k_probe.json").write_text(json.dumps(result,indent=2))
print(json.dumps(result))
