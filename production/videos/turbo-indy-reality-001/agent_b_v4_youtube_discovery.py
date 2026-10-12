#!/usr/bin/env python3
"""Discovery only: search YouTube public metadata for original IndyCar wheel-level shots.
This script never downloads or redistributes any footage and never approves licenses.
"""
import json,subprocess,time,sys
from pathlib import Path
OUT=Path("out/agent-b-v4-youtube-discovery");OUT.mkdir(parents=True,exist_ok=True)
QUERIES=[
 "IndyCar rear wheel camera 2026 Indy 500 buckeye camera",
 "2026 Indy 500 Buckeye camera rear tire wall",
 "Indy 500 wall camera grass cam low close passing 2026",
 "IndyCar onboard rear facing tire camera Indianapolis 500",
 "Indycar 2026 race suspension rear wheel mounted camera",
 "Indianapolis 500 wheel level low track side racing 4K",
 "Indycar GoPro side mounted exterior race 1080",
 "IndyCar Indy 500 creative commons footage ground camera"
]
results=[]; dedup={}
for q in QUERIES:
 try:
  p=subprocess.run(["yt-dlp","--ignore-config","--flat-playlist","--skip-download","--no-warnings","--socket-timeout","8","--retries","0","--playlist-end","7","--dump-json","ytsearch7:"+q],
     capture_output=True,text=True,timeout=35)
  arr=[]
  for line in p.stdout.splitlines():
   try:
    v=json.loads(line)
    vid=v.get("id")
    if not vid:continue
    row={"id":vid,"watch_url":"https://www.youtube.com/watch?v="+vid,
         "title":v.get("title"),"channel":v.get("channel"),"uploader":v.get("uploader"),
         "duration":v.get("duration"),"thumbnails":v.get("thumbnails"),"query":q}
    dedup.setdefault(vid,row)
    arr.append({k:row.get(k) for k in ("id","title","channel","duration")})
   except Exception:continue
  results.append({"query":q,"returncode":p.returncode,"count":len(arr),"videos":arr,
                 "stderr_tail":p.stderr[-350:]})
  print("SEARCH",q,"FOUND",len(arr),"EXIT",p.returncode,flush=True)
 except Exception as e:
  results.append({"query":q,"error":str(e)})
  print("SEARCH_FAILURE",q,str(e)[:220],flush=True)
# Probe 12 best discoveries for rights metadata. No viewing/availability assertion from metadata alone.
audits=[]
for row in list(dedup.values())[:12]:
 try:
  p=subprocess.run(["yt-dlp","--skip-download","--no-playlist","--no-warnings","--socket-timeout","8","--retries","0","--dump-single-json",row["watch_url"]],
    capture_output=True,text=True,timeout=27)
  if p.returncode or not p.stdout.strip():raise RuntimeError(p.stderr[-420:])
  obj=json.loads(p.stdout)
  formats=obj.get("formats",[])
  heights=sorted({f.get("height") for f in formats if isinstance(f.get("height"),int) and f.get("vcodec") not in ("none",None)})
  audited={**{k:row.get(k) for k in ("id","title","watch_url","channel","duration")},
   "description":(obj.get("description") or "")[:2000],"license":obj.get("license"),
   "availability":obj.get("availability"),"max_format_height":max(heights) if heights else None,
   "attribution":obj.get("uploader"),"channel_url":obj.get("channel_url"),
   "rights_status":"UNVERIFIED: YouTube video license alone does not clear IndyCar race rights"}
  audits.append(audited)
  print("AUDIT",row["id"],"LICENSE",audited["license"],"MAXH",audited["max_format_height"],flush=True)
 except Exception as ex:
  audits.append({"id":row["id"],"watch_url":row["watch_url"],"error":str(ex)[:350],
                 "rights_status":"NO PERMISSION ESTABLISHED"})
  print("AUDIT_BLOCKED",row["id"],str(ex)[:120],flush=True)
(OUT/"searches.json").write_text(json.dumps(results,indent=2,ensure_ascii=False))
(OUT/"candidates.json").write_text(json.dumps(list(dedup.values()),indent=2,ensure_ascii=False))
(OUT/"license_audit.json").write_text(json.dumps(audits,indent=2,ensure_ascii=False))
(OUT/"READ_ME.txt").write_text("Metadata-only YouTube research. No footage bytes, permissions, owners' approvals or V4 jobs created. Confirm copyright + INDYCAR event/redistribution rights before use.\\n")
print("SUMMARY",len(dedup),"unique search candidates",len(audits),"attempted license audits",flush=True)
