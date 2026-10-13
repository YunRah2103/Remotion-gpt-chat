#!/usr/bin/env python3
"""A2 independent Audi AEM source discovery, remote 4K video FFprobe, ephemeral clip decode.
Third-party audiovisual content is NEVER placed in public artifacts.
"""
import json,re,time,subprocess,hashlib
from pathlib import Path
from urllib.parse import urlparse
import requests
P=Path("a2_uhd_audit");P.mkdir(exist_ok=True)
HEAD={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36"}
PAGES=[
("audi_dew_silver_perf","https://www.audi.com/en/videos/video/audi-rs-6-avant-performance-dew-silver-matt-footage-on-location-6557"),
("audi_daytona_4k_comparison","https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874")]
CONTROL="https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/urn:aaid:aem:99e86001-9bce-465b-b3ea-af573f2f3c0a/renditions/video_2160p.mp4/as/audi-rs-6-until-2025-daytona-grey-footage-on-location_2160p.mp4?accept-experimental=1"
def run(cmd,timeout):
 try:
  p=subprocess.run(cmd,timeout=timeout,capture_output=True,text=True)
  return {"exit":p.returncode,"out":p.stdout[-3000:],"err":p.stderr[-1200:]}
 except Exception as e: return {"error":repr(e)}
R={"agent":"A2","note":"Ephemeral restricted Audi video audit only. No source video or frames uploaded.", "pages":[],"created_utc":time.strftime("%FT%TZ",time.gmtime())}
for key,page in PAGES:
 rec={"name":key,"page":page,"rights":"Audi press/editorial terms, no public redistribution permission"}; R["pages"].append(rec)
 try:
  req=requests.get(page,timeout=20,headers=HEAD)
  rec["page_http"]=req.status_code; rec["page_bytes"]=len(req.content)
  s=req.text.replace("\\u002F","/").replace("\\/","/")
  urls=re.findall(r'https?://[^\x22\x27\s<>]+(?:video_2160p|renditions)[^\x22\x27\s<>]*',s,re.I)
  assetids=list(dict.fromkeys(re.findall(r'urn:aaid:aem:[a-f0-9-]{36}',s,re.I)))
  rec["aem_asset_ids"]=assetids[:12]
  rec["video_2160p_embedded_urls"]=urls[:8]
  slug=urlparse(page).path.split("/")[-1].rsplit("-",1)[0]
  # Current Adobe Media Delivery domain as verified by the earlier Audi RS6 media audit.
  links=[u.replace("&amp;","&") for u in urls if "video_2160p" in u]
  if key=="audi_daytona_4k_comparison": links.append(CONTROL)
  for aid in assetids[:2]:
   links.append(f"https://delivery-p123922-e1240369.adobeaemcloud.com/adobe/assets/{aid}/renditions/video_2160p.mp4/as/{slug}_2160p.mp4?accept-experimental=1")
  links=list(dict.fromkeys(links))[:4]
  for u in links:
   m={"url":u};rec.setdefault("rendition_probes",[]).append(m)
   try:
    rr=requests.get(u,headers={**HEAD,"Range":"bytes=0-127"},timeout=40,stream=True)
    m["range_status"]=rr.status_code;m["content_range"]=rr.headers.get("Content-Range");m["length"]=rr.headers.get("Content-Length");m["content_type"]=rr.headers.get("Content-Type")
    chunk=next(rr.iter_content(256),b"");m["is_mp4_header"]=b"ftyp" in chunk[:64];rr.close()
    if rr.status_code not in (200,206) or not m["is_mp4_header"]:continue
    prob=run(["ffprobe","-v","error","-rw_timeout","20000000","-analyzeduration","2000000","-probesize","2000000","-show_entries","stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size","-of","json",u],timeout=85)
    m["ffprobe"]=prob
    if prob.get("exit")==0:
     try:
      j=json.loads(prob["out"]);vv=next(x for x in j["streams"] if x.get("codec_type")=="video")
      m["native_video"]={"width":vv.get("width"),"height":vv.get("height"),"fps":vv.get("r_frame_rate")};m["full_hd_gate"]=(vv.get("width") or 0)>=1920 and (vv.get("height") or 0)>=1080
     except Exception as e:m["parse_error"]=repr(e)
     if m.get("full_hd_gate"):
      f=P/("temporary_preview_"+key+".mp4")
      # FFmpeg seeks into the official video with HTTP byte-range support. Remains ephemeral.
      ff=run(["ffmpeg","-hide_banner","-loglevel","error","-rw_timeout","20000000","-ss","3","-i",u,"-t","1.5","-an","-c:v","libx264","-preset","ultrafast","-pix_fmt","yuv420p","-y",str(f)],timeout=110)
      m["short_real_media_acquisition_exit"]=ff.get("exit",None);m["short_real_media_acquisition_errors"]=ff.get("err",ff.get("error",""))
      if f.exists() and f.stat().st_size>100000:
       m["ephemeral_decoded_bytes"]=f.stat().st_size
       m["ephemeral_sha256"]=hashlib.sha256(f.read_bytes()).hexdigest()
       m["short_real_media_full_decode"]=run(["ffmpeg","-v","error","-i",str(f),"-f","null","-"],timeout=20)
      f.unlink(missing_ok=True)
      break
   except Exception as e:m["error"]=repr(e)
 except Exception as e:rec["error"]=repr(e)
(P/"report.json").write_text(json.dumps(R,indent=2))
print(json.dumps(R,indent=2))
