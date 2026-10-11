#!/usr/bin/env python3
"""Audit already completed FB acquisition failures, verify ytdlp public rendition metadata."""
import pathlib,json,zipfile,subprocess,urllib.parse
ROOT=pathlib.Path("out/gt3-a-lambo-diagnostic");ROOT.mkdir(parents=True,exist_ok=True)
fb="https://www.facebook.com/INMotorsport/videos/-abt-red-bull-lamborghini-gt3-on-24h-n%C3%BCrburgring-2026-full-speed-motorsport-abt-/980033981487442/"
matched=list(pathlib.Path("inputs").rglob("GT3_A_LAMBO_BROWSER_ORIGINALS_AND_QA.zip"))
rec={"acquisition_archive_found":bool(matched),"sources":[]}
for f in matched:
 with zipfile.ZipFile(f) as z:
  assert z.testzip() is None
  j=json.loads(z.read("SOURCE_MANIFEST.json"))
  for x in j["sources"]:
   rec["sources"].append({"source_id":x["source_id"],"browser_title":x.get("browser_page_title"),
    "endpoint_hosts":[urllib.parse.urlparse(u).netloc for u in x.get("detected_media_links",[])],
    "network_status_codes":[a.get("status") for a in x.get("video_requests",[])],
    "errors":x.get("errors",[]),"page_error":x.get("error"),
    "status":x.get("status")})
for x in rec["sources"]:
 print("FB_SOURCE_RESULT",json.dumps(x,ensure_ascii=False)[:5000],flush=True)
try:
 p=subprocess.run(["yt-dlp","--ignore-config","--no-playlist","--skip-download","--dump-single-json",
  "--socket-timeout","12","--retries","0",fb],capture_output=True,text=True,timeout=30)
 if p.returncode:
  rec["public_yt_dlp_status"]="REJECTED";rec["public_yt_dlp_error"]=p.stderr[-450:]
 else:
  q=json.loads(p.stdout)
  rec["public_yt_dlp_status"]="METADATA_LISTED"
  rec["public_formats"]=[{k:v.get(k) for k in ("format_id","width","height","ext","protocol")} for v in q.get("formats",[])][-25:]
  print("FB_YTDLP_FORMATS",json.dumps(rec["public_formats"]),flush=True)
except Exception as e:rec["public_yt_dlp_status"]="ERROR";rec["public_yt_dlp_error"]=str(e)[-300:]
print("YTDLP_RESULT",rec.get("public_yt_dlp_status"),rec.get("public_yt_dlp_error",""),flush=True)
(ROOT/"RETRIEVAL_FAILURE_DETAIL.json").write_text(json.dumps(rec,indent=2,ensure_ascii=False))
