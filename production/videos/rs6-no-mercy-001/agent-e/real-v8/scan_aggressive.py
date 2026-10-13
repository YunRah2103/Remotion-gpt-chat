#!/usr/bin/env python3
"""Acquire genuine CC0 recorded V8 previews. No artificial/mock media."""
import requests,re,html,json,subprocess,hashlib,os,time
from pathlib import Path
out=Path('v8-aggressive-verified');out.mkdir(exist_ok=True)
S={
 'cc0_v8_throttle_binaural':('https://freesound.org/people/overmedium/sounds/651534/','V8 throttle blip binaural real field recording CC0'),
 'cc0_mustang_302_1969':('https://freesound.org/people/FlaxGod/sounds/653226/','1969 Mustang 302 actual rev CC0'),
 'cc0_audi_v8':('https://freesound.org/people/FFKoenigsegg20012017/sounds/339703/','Audi V8 acceleration recording CC0; Audi model unspecified'),
 'cc0_open_headers_v8':('https://freesound.org/people/holderall/sounds/432508/','Open header V8 live parade CC0'),
 'cc0_rev_car_go_fast':('https://freesound.org/people/Beetlemuse/sounds/678961/','Car rev recording, engine model unspecified CC0'),
}
h={'User-Agent':'Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36','Accept':'text/html,application/xhtml+xml,*/*'}
sess=requests.Session()
def get(url,cap=12000000):
 try:
  r=sess.get(url,headers=h,timeout=18,stream=True)
  if r.status_code!=200:return None,{'status':r.status_code,'content_type':r.headers.get('content-type')}
  data=bytearray()
  for x in r.iter_content(chunk_size=262144):
   data.extend(x)
   if len(data)>cap:return None,{'status':r.status_code,'too_big':len(data)}
  return bytes(data),{'status':r.status_code,'bytes':len(data),'content_type':r.headers.get('content-type'),'final':r.url}
 except Exception as e:return None,{'error':str(e)[:180]}
def ff(path):
 try:
  p=subprocess.run(['ffprobe','-v','error','-of','json','-show_entries','stream=codec_name,sample_rate,channels:format=duration,format_name',str(path)],capture_output=True,text=True,timeout=13)
  if p.returncode:return None
  j=json.loads(p.stdout)
  if not j.get('streams') or float(j['format']['duration'])<1.:return None
  return j
 except Exception:return None
report=[]
for name,(url,description) in S.items():
 page,meta=get(url,3000000)
 item={'name':name,'page':url,'description':description,'http':meta,'downloaded':False}
 if page:
  raw=html.unescape(page.decode('utf8','replace'))
  matches=re.findall(r'https?[^"\'<>\\\s]{0,500}',raw)
  urls=[]
  for k in matches:
   k=k.replace('\\/','/').replace('\\u002F','/').split('&quot;')[0].split('&amp;')[0].rstrip(' ,;)')
   if ('freesound.org' in k or 'cdn.freesound' in k) and any(z in k.lower() for z in ['.mp3','.wav','.ogg']):urls.append(k)
  urls=list(dict.fromkeys(urls))
  # HQ previews first. Freesound preview CDN exports low/high bitrate independently.
  urls.sort(key=lambda z:(0 if 'hq' in z.lower() else 1, 0 if '.mp3' in z.lower() else 1,len(z)))
  item['candidate_count']=len(urls)
  item['candidate_names']=[u[:230] for u in urls[:6]]
  for ix,media in enumerate(urls[:7]):
   dat,mt=get(media,15000000)
   if not dat:continue
   t=out/(name+f'_{ix}.bin');t.write_bytes(dat)
   probe=ff(t)
   if not probe:t.unlink();continue
   ext='.mp3' if 'mp3' in probe['format']['format_name'] else '.ogg' if 'ogg' in probe['format']['format_name'] else '.wav'
   path=out/(name+ext)
   if path.exists():t.unlink();continue
   t.rename(path)
   item['downloaded']=True
   item['media_source']=media
   item['local_name']=path.name
   item['ffprobe']=probe
   item['sha256']=hashlib.sha256(dat).hexdigest()
   item['size_bytes']=len(dat)
   break
 report.append(item)
 print(json.dumps({k:item.get(k) for k in ('name','http','downloaded','local_name','candidate_count','size_bytes')}),flush=True)
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print('REAL_RECORDED_V8_COUNT',sum(bool(v.get('downloaded')) for v in report))
