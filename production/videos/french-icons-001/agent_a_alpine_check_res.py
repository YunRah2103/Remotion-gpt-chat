#!/usr/bin/env python3
"""Inspect only PUBLIC official Alpine embedded playlist variants (no private access)."""
import urllib.request,urllib.parse,json,re,pathlib
R=pathlib.Path("out/official-alpine-variants");R.mkdir(parents=True,exist_ok=True)
headers={"User-Agent":"Mozilla/5.0","Referer":"https://presse.alpinecars.de/"}
def get(url,maxlen=500000):
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=25) as response:return response.read(maxlen)
data=json.loads(get("https://player.vimeo.com/video/825657442/config"))
f=data.get("request",{}).get("files",{})
reports=[]
for t in ("hls","dash"):
 node=f.get(t) or {}
 for label,cdn in (node.get("cdns") or {}).items():
  if not cdn.get("url"):continue
  r={"format":t,"cdn":label,"manifest_available":False}
  try:
   source=get(cdn["url"])
   r["manifest_available"]=True
   r["mime_hint"]=source[:40].decode("ascii","replace")
   variants=re.findall(r"(?i)RESOLUTION=(\d+x\d+)",source.decode("utf-8","replace"))
   r["manifest_resolutions"]=list(dict.fromkeys(variants))
   r["internal_streams"]=[{"id":x.get("id"),"height":x.get("height"),"width":x.get("width"),"quality":x.get("quality")} for x in (node.get("streams") or [])] if isinstance(node.get("streams"),list) else "not-list"
   r["avc_streams"]=[{"id":x.get("id"),"height":x.get("height"),"width":x.get("width")} for x in (node.get("streams_avc") or [])] if isinstance(node.get("streams_avc"),list) else "not-list"
  except Exception as e:r["error"]=str(e)[:120]
  reports.append(r)
  print("ALPINE_VARIANTS",json.dumps(r),flush=True)
(R/"manifest.json").write_text(json.dumps(reports,indent=2))
