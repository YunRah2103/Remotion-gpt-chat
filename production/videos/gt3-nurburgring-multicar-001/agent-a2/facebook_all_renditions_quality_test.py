#!/usr/bin/env python3
"""Capture all real publicly linked Facebook player renditions, prefer real native 1080 originals.

Browser-backed discovery, exact video posts, decoded FFmpeg source, 12-frame QA.
No inferred makes, no synthetic video, no upscaling, no auth/DRM bypass.
"""
from pathlib import Path
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse,parse_qsl,urlencode,urlunparse,unquote
from html import unescape
import requests,re,json,hashlib,zipfile,base64,subprocess,time
OUT=Path("out/gt3-a2-facebook-all-qualities")
SRC=OUT/"real_source_films_pending_gt3_visual_qa";SHEETS=OUT/"contact_sheets"
for p in [OUT,SRC,SHEETS]:p.mkdir(parents=True,exist_ok=True)
SITES=[
 ("ferrari_frikadelli_2024","Ferrari 296 GT3 Frikadelli publisher official team 2024","https://www.facebook.com/Frikadelli/videos/liebe-frikadelli-fans-wir-kommen-heute-zu-euch-an-die-nordschleife-mit-einer-gan/7079298862171287/"),
 ("ferrari_frikadelli_2023","Ferrari 296 GT3 Frikadelli at Nürburgring restart 2023","https://www.facebook.com/Frikadelli/videos/die-autos-stehen-wieder-drau%C3%9Fen-im-grid-und-wir-sind-gespannt-wann-es-wieder-los/1000284861120520/"),
 ("mclaren_racing_gtwc2026","Real McLaren 720S GT3 EVO Nürburgring GTWC Europe race","https://www.facebook.com/GTWorldChallengeEurope/videos/a-dramatic-moment-at-the-n%C3%BCrburgring-as-two-mclarens-come-together-gtworld/1094931886398447/"),
 ("mclaren_team_rjn_2026","McLaren 720S GT3 EVO at Nürburgring RJN team post","https://www.facebook.com/teamrjn/videos/rolling-out-gtworldcheu-mclaren-gt3-nurburgring/29244441448478046/"),
 ("ferrari_n24_2026_rinaldi","Ferrari 296 GT3 #45 N24 race","https://www.facebook.com/Nringinfo/videos/was-traut-ihr-dem-ferrari-296-gt3-beim-24-stunden-rennen-zu-realize-kondo-racing/1761573544796603/"),
 ("aston_control_1080","CONTROL proven 1920x1088 real Aston NLS8 source to confirm test methodology","https://www.facebook.com/astonmartinracing/videos/winners-the-vantage-gt3-delivered-the-first-outright-victory-for-aston-martin-on/648342162796998/")
]
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for c in iter(lambda:f.read(1048576),b""):h.update(c)
 return h.hexdigest()
def cmd(args,timeout=90):
 p=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError((p.stderr or p.stdout)[-600:])
 return p.stdout
def normal(s):
 return unescape(str(s).replace("\\u0026","&").replace("\\/","/").replace("&amp;","&")).strip()
def fbcdn(s):
 s=normal(s)
 return s.startswith("https://") and "fbcdn.net" in s and ".mp4" in s and len(s)<4500
def quality_hint(url):
 try:
  query=dict(parse_qsl(urlparse(url).query))
  efg=query.get("efg","")
  meta=json.loads(base64.urlsafe_b64decode(efg+"="*((-len(efg))%4)))
  return {k:str(v)[:150] for k,v in meta.items()}
 except: return {}
def score(u):
 d=quality_hint(u)
 meta=" ".join(d.values()).lower()
 score=100 if "1080" in meta else 90 if "2160" in meta else 80 if "720" in meta else 0
 if "dash" in meta:score+=8
 if "progressive" in meta:score+=5
 if "/m367/" in u:score+=35
 if "/m69/" in u:score+=3
 if "/m78/" in u or "audio" in meta:score-=150
 if "360" in meta:score-=80
 return score
def all_urls(raw,page):
 arr=[]
 for text in [raw,page]:
  t=normal(text)
  for match in re.finditer(r'https://(?:[^\s"\'<>\\]|\\.){20,2200}?\.mp4(?:\?[^\s"\'<>\\]{0,2400})?',t):
   url=normal(match.group(0)).strip('",}')
   if fbcdn(url):arr.append(url)
  for match in re.finditer(r'"(?:hd_src|sd_src|playable_url_quality_hd|browser_native_hd_url|playable_url|video_url)"\s*:\s*"([^"]+)"',t):
   url=normal(match.group(1))
   if fbcdn(url):arr.append(url)
 return arr
def download(url,path):
 p=urlparse(url)
 query=[(k,v) for k,v in parse_qsl(p.query,keep_blank_values=True) if k.lower() not in ("bytestart","byteend")]
 full=urlunparse(p._replace(query=urlencode(query)))
 s=requests.Session()
 with s.get(full,headers={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) Chrome/126 Safari/537.36",
                           "Referer":"https://www.facebook.com/","Range":"bytes=0-"},stream=True,timeout=(7,15)) as r:
  r.raise_for_status()
  if "html" in r.headers.get("content-type",""):raise RuntimeError("HTML_NOT_VIDEO")
  n=0
  with path.open("wb") as f:
   for chunk in r.iter_content(1024*1024):
    if chunk:
     n+=len(chunk)
     if n>75_000_000:raise RuntimeError("75MB_SOURCE_CAP")
     f.write(chunk)
 if path.stat().st_size<120000:raise RuntimeError("NO_MEDIA_BYTES")
 return path
def probe(path):
 d=json.loads(cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)],25))
 v=next(x for x in d["streams"] if x["codec_type"]=="video")
 return int(v["width"]),int(v["height"]),float(d["format"]["duration"]),d
def sheet(path,stem,dur):
 canvas=Image.new("RGB",(1600,960),"#181818");d=ImageDraw.Draw(canvas)
 for i in range(12):
  t=round(max(.15,dur*(i+.5)/12),2)
  fn=SHEETS/(stem+f"tmp{i}.jpg")
  cmd(["ffmpeg","-nostdin","-v","error","-y","-ss",str(t),"-i",str(path),"-frames:v","1",
       "-vf","scale=400:260:force_original_aspect_ratio=decrease,pad=400:260:(ow-iw)/2:(oh-ih)/2","-q:v","6",str(fn)],25)
  with Image.open(fn) as im:canvas.paste(im.convert("RGB"),((i%4)*400,(i//4)*240+25))
  d.text(((i%4)*400+3,(i//4)*240+2),f"{stem} {t}s",fill="white")
  fn.unlink(missing_ok=True)
 file=SHEETS/(stem+"_frames.jpg");canvas.save(file,quality=88)
 return str(file.relative_to(OUT))
reports=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
 ctx=browser.new_context(viewport={"width":1600,"height":900},user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36")
 for id,description,url in SITES:
  item={"id":id,"source_page":url,"description":description,"approved_gt3_footage":False,"status":"NO_NATIVE_1080_FILE"}
  page=ctx.new_page();responses=[]
  def onresponse(res):
   if fbcdn(res.url):responses.append(res.url)
  page.on("response",onresponse)
  try:
   page.goto(url,wait_until="domcontentloaded",timeout=16000)
   page.wait_for_timeout(2000)
   pagecontent=page.content()
   raw=json.dumps(page.evaluate("""() => [...document.querySelectorAll('script')].map(s=>s.innerHTML).join('\\n')"""))
   links=all_urls(raw,pagecontent)+responses
   items={}
   for u in links:
    if not fbcdn(u):continue
    # Preserve one representative URL per rendition path.
    key=urlparse(u).path
    if key not in items or len(u)>len(items[key]):items[key]=u
   urls=sorted(items.values(),key=score,reverse=True)
   item["all_distinct_video_variants"]=len(urls)
   item["candidate_rendition_metadata"]=[{"quality":score(u),"hint":quality_hint(u),"path":urlparse(u).path[-120:]} for u in urls[:15]]
   print("FB_COMPLETE_RENDITIONS",id,len(urls),item["candidate_rendition_metadata"][:5],flush=True)
   for i,srcurl in enumerate(urls[:9]):
    dest=SRC/(id+f"_{i}.mp4")
    try:
     download(srcurl,dest)
     w,h,dur,meta=probe(dest)
     if w<1920 or h<1080 or w<=h:raise RuntimeError(f"NOT_NATIVE_1920x1080_landscape_{w}x{h}")
     cmd(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(dest),"-map","0:v:0","-f","null","-"],100)
     item.update(status="NATIVE_LANDSCAPE_HD_VIDEO_GT3_VISUAL_ID_PENDING",
                 real_file=str(dest.relative_to(OUT)),native_pixels=[w,h],duration=dur,
                 bytes=dest.stat().st_size,sha256=sha(dest),contact_sheet=sheet(dest,id,dur),
                 source_stream_url=srcurl,ffprobe=meta)
     print("SUCCESS_REAL_1080_RACING_CANDIDATE",id,w,h,dur,item["sha256"],flush=True)
     break
    except Exception as ex:
     item.setdefault("rejections",[]).append(str(ex)[-150:])
     dest.unlink(missing_ok=True)
  except Exception as ex:item["source_error"]=str(ex)[-330:]
  finally:page.close()
  reports.append(item)
 browser.close()
manifest={"project":"YUNEX GT3","agent":"A2","route":"all Facebook CDN video qualities",
          "actual_decoded_native_landscape_source_count":sum(x["status"].startswith("NATIVE") for x in reports),
          "ferrari_gt3_visually_approved":0,"mclaren_gt3_visually_approved":0,"status":"GT3_MODEL_VISUAL_QA_REQUIRED",
          "publisher_sources":reports}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
(OUT/"README.md").write_text("# Exhaustive Facebook public video rendition original-source audit\n\n"
"Sources with qualifying genuine source bytes only in real_source_films_pending_gt3_visual_qa/. "
"No manufacturer proof until model/track visually checked in contact sheets; Aston control is existing A2 footage not a new asset. "
"All rendition hints and rejections documented; 1080 source dimensions cannot prove full-bleed content alone.\n")
dst=OUT/"GT3_A2_FACEBOOK_FULL_HD_ORIGINALS_QA.zip"
with zipfile.ZipFile(dst,"w",compression=zipfile.ZIP_STORED,allowZip64=True) as z:
 for f in OUT.rglob("*"):
  if f.is_file() and f!=dst:z.write(f,str(f.relative_to(OUT)))
with zipfile.ZipFile(dst) as z:
 assert z.testzip() is None
 for item in reports:
  if item["status"].startswith("NATIVE"):
   assert hashlib.sha256(z.read(item["real_file"])).hexdigest()==item["sha256"]
print("FULL_QUALITY_FACEBOOK_RUN_FINISHED",manifest["actual_decoded_native_landscape_source_count"],dst.stat().st_size,sha(dst),flush=True)
