#!/usr/bin/env python3
"""Fetch licensed real driving footage. FAIL CLOSED: no stills/synthetic replacements."""
from __future__ import annotations
import concurrent.futures
import hashlib
import html
import json
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse
import requests

HERE=Path(__file__).parent
DEST=Path('public/automotive-video-collage')
DEST.mkdir(parents=True,exist_ok=True)
SOURCES=json.loads((HERE/'assets.json').read_text('utf8'))
HEADERS={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
         'Referer':'https://www.pexels.com/','Accept':'*/*'}

def ffprobe(path):
    raw=subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],text=True)
    return json.loads(raw)

def assert_video(path):
    data=ffprobe(path)
    v=next((s for s in data['streams'] if s['codec_type']=='video'),None)
    if not v or int(v['width'])<640 or int(v['height'])<360:
        raise ValueError('Missing adequate MOVING video '+str(path))
    if float(data['format'].get('duration',0))<6.8:
        raise ValueError('Clip shorter than 6.8s '+str(path))
    return data

def candidates(item):
    id=str(item['pexels_id'])
    root='https://videos.pexels.com/video-files/'+id+'/'+id+'-'
    variants=[
       ('hd',1920,1080,25),('hd',1920,1080,30),('hd',1920,1080,24),
       ('hd',1080,1920,25),('hd',1080,1920,30),('hd',1080,1920,24),
       ('hd',1280,720,25),('hd',1280,720,30),('hd',1280,720,24),
       ('hd',720,1280,25),('hd',720,1280,30),('hd',720,1280,24),
       ('uhd',3840,2160,25),('uhd',3840,2160,30),('uhd',3840,2160,24),
       ('sd',640,360,25),('sd',640,360,30),('sd',640,360,24),
       ('hd',1920,1080,60),('hd',1080,1920,60),
       ('hd',1920,1080,50),('hd',1280,720,60)
    ]
    direct=[root+f'{quality}_{w}_{h}_{fps}fps.mp4' for quality,w,h,fps in variants]
    try:
        r=requests.get(item['source_page'],headers=HEADERS,timeout=(7,18))
        if r.status_code==200:
            hits=re.findall(r'https?(?:\\u002[fF]|/)+(?:videos\\.pexels\\.com|player\\.vimeo\\.com)[^"<> \\n]+?(?:\\.mp4|mp4\\?[^"<> ]+)',html.unescape(r.text))
            clean=[h.replace('\\u002F','/').replace('\\/','/') for h in hits]
            direct=clean+direct
            print(item['id'],'source page status 200 embedded videos',len(clean),flush=True)
        else:
            print(item['id'],'source page HTTP',r.status_code,'using exact Pexels CDN formats',flush=True)
    except requests.RequestException as e:
        print(item['id'],'source page lookup unavailable',str(e)[:130],flush=True)
    return list(dict.fromkeys(direct))

def inspect(url):
    try:
        # Pexels static media endpoints support HEAD; don't pull whole files just to check.
        r=requests.head(url,headers=HEADERS,allow_redirects=True,timeout=(5,9))
        ct=r.headers.get('Content-Type','').lower()
        if r.status_code in (200,206) and ('video' in ct or 'octet-stream' in ct or 'mp4' in url):
            return url
    except requests.RequestException:
        pass
    return None

def download(url,path):
    # Keep only Pexels-origin media; do not fetch arbitrary web-supplied URLs.
    parsed=urlparse(url)
    if parsed.scheme!='https' or parsed.netloc not in ('videos.pexels.com','player.vimeo.com'):
        raise ValueError('Unapproved media host: '+parsed.netloc)
    with requests.get(url,headers=HEADERS,stream=True,timeout=(10,65)) as r:
        r.raise_for_status()
        with path.open('wb') as o:
            for chunk in r.iter_content(512*1024):
                if chunk: o.write(chunk)
                if o.tell()>370_000_000:raise ValueError('Source exceeds size limit')
    if path.stat().st_size<200_000:raise ValueError('Tiny/invalid video source')

def transcode(src,out):
    # Standardise *real* frames to smooth 30 fps, 7 seconds. NO image substitutions.
    subprocess.run([
      'ffmpeg','-y','-hide_banner','-loglevel','error','-stream_loop','2','-i',str(src),
      '-t','7','-an','-vf','fps=30,scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1',
      '-pix_fmt','yuv420p','-c:v','libx264','-preset','veryfast','-crf','22',
      '-movflags','+faststart',str(out)
    ],check=True,timeout=180)
    data=assert_video(out)
    v=next(x for x in data['streams'] if x['codec_type']=='video')
    if v.get('nb_frames') not in (None,'210'):raise ValueError('Wrong clip frames: '+str(v.get('nb_frames')))
    return data

def get_one(item):
    assert item['license']=='Pexels License' and str(item['pexels_id']) in item['source_page']
    print('Finding moving video:',item['id'],item['source_page'],flush=True)
    urls=candidates(item)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        states=list(pool.map(inspect,urls))
    available=[s for s in states if s]
    if not available:raise RuntimeError(item['id']+' no licensed playable MP4 at available public Pexels media endpoints; no fake substitute used')
    errors=[]
    for url in available:
        raw=DEST/(item['id']+'-source.mp4')
        try:
            download(url,raw)
            probe=ffprobe(raw)
            if not any(s['codec_type']=='video' for s in probe['streams']):raise ValueError('Not video')
            out=DEST/(item['id']+'.mp4')
            transcoded=transcode(raw,out)
            raw.unlink()
            print('OK',item['id'],out.stat().st_size,'source:',url,flush=True)
            return {**item,'download_url':url,
              'source_video_seconds':float(probe['format'].get('duration',0)),
              'source_codec':next(s['codec_name'] for s in probe['streams'] if s['codec_type']=='video'),
              'output_bytes':out.stat().st_size,
              'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),
              'delivery_width':1280,'delivery_height':720,
              'delivery_fps':30,'delivery_duration_s':7.0}
        except Exception as e:
            errors.append(str(e)[:130])
            print('Candidate rejected:',item['id'],str(e)[:130],flush=True)
            raw.unlink(missing_ok=True)
    raise RuntimeError(item['id']+' sources all failed: '+str(errors[:3]))

results=[]
for s in SOURCES:
    results.append(get_one(s))
(DEST/'provenance.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
print('PASS 6/6 true licensed MOVING video sources downloaded, probed and transcoded',flush=True)
