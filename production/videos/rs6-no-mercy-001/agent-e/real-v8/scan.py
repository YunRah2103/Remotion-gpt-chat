#!/usr/bin/env python3
"""Locate and verify genuinely recorded CC0 V8 sources (no simulations)."""
import requests,re,html,json,subprocess,os,hashlib
from pathlib import Path
from bs4 import BeautifulSoup
O=Path("real-v8-acquisition");O.mkdir(exist_ok=True)
H={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"}
sources=[
("pixabay_audi_v8","https://pixabay.com/sound-effects/city-audi-v8-acceleration-sound-6067/"),
("pixabay_barracuda","https://pixabay.com/sound-effects/search/motor%20v8/"),
("pixabay_v8_flyby","https://pixabay.com/sound-effects/film-special-effects-v8-supercar-fly-by-103237/"),
("freesound_maserati_real_v8","https://freesound.org/people/myeclecticself/sounds/585214/"),
("freesound_maserati_v8_launch","https://freesound.org/people/myeclecticself/sounds/585215/"),
("bigsoundbank_aston","https://bigsoundbank.com/acceleration-aston-martin-s0600.html"),
]
sess=requests.Session()
report=[]
def get(url,maxsize=22000000):
 try:
  r=sess.get(url,headers=H,timeout=16,stream=True,allow_redirects=True)
  typ=r.headers.get('Content-Type','')
  if r.status_code!=200:return None,dict(status=r.status_code,type=typ,reason="status")
  if int(r.headers.get("Content-Length","0"))>maxsize:return None,dict(status=r.status_code,type=typ,reason="too_large")
  data=bytearray()
  for x in r.iter_content(chunk_size=65536):
   data.extend(x)
   if len(data)>maxsize:return None,dict(status=r.status_code,type=typ,reason="too_large_stream")
  return bytes(data),dict(status=r.status_code,type=typ,size=len(data),final_url=r.url)
 except Exception as e:return None,dict(error=str(e)[:180])
def ffprobe(path):
 try:
  o=subprocess.check_output(["ffprobe","-v","error","-show_entries","format=format_name,duration:stream=codec_type,codec_name,sample_rate","-of","json",str(path)],timeout=15)
  j=json.loads(o)
  if any(v.get("codec_type")=="audio" for v in j.get("streams",[])) and float(j.get("format",{}).get("duration",0))>.4:return j
 except Exception:pass
 return None
for name,url in sources:
 content,meta=get(url,7000000)
 entry={"name":name,"url":url,"metadata":meta,"sample_candidates":[]}
 if content and ("html" in meta.get("type","") or content[:50].startswith(b"<!DOCTYPE")):
  doc=html.unescape(content.decode('utf8','ignore'))
  links=re.findall(r'https?[^"\'<>\\\s]{0,450}',doc)
  links=[u.replace("\\/","/").replace("\\u002F","/") for u in links]
  selected=[]
  for l in links:
   l=l.split("&quot;")[0].split("&amp;")[0].strip().rstrip(",);")
   if any(x in l.lower() for x in ["audio","preview","mp3","wav","sound","upload"]):
    selected.append(l)
  entry["selected_links"]=sorted(set(selected))[:35]
  entry["page_contains_audio"]=("audio" in doc.lower())
  # Try known media CDN MP3 / WAV only, not random unrelated sound files
  candidates=[u for u in sorted(set(selected)) if any(x in u.lower() for x in [".mp3",".wav",".ogg",".m4a",".flac"]) and any(d in u for d in ["cdn.pixabay.com","freesound.org","bigsoundbank.com","bigsoundbank.fr"])]
  # Auditing fallback: when direct preview URL not in HTML, note without fabricating file
  for ind,u in enumerate(candidates[:12]):
   dat,mt=get(u,22000000)
   out={"url":u[:400],"metadata":mt}
   if dat:
    t=O/(name+"_"+str(ind)+".bin")
    t.write_bytes(dat)
    pr=ffprobe(t)
    if pr:
     ext=".mp3" if "mp3" in pr["format"]["format_name"] else ".audio"
     os.rename(t,O/(name+"_"+str(ind)+ext))
     out.update({"saved_file":str(O/(name+"_"+str(ind)+ext)),"sha256":hashlib.sha256(dat).hexdigest(),"probe":pr})
    else:t.unlink()
   entry["sample_candidates"].append(out)
 else:
  entry["body_excerpt"]=(content[:500].decode('utf8','ignore') if content else "")
 report.append(entry)
 print(json.dumps({"name":name,"metadata":meta,"found_audio":len([x for x in entry["sample_candidates"] if x.get("saved_file")]),"links":entry.get("selected_links",[])[:6]}))
(O/"acquisition_report.json").write_text(json.dumps(report,indent=2)+"\n")
print("ACQUISITION_FINISHED")
