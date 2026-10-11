#!/usr/bin/env python3
"""Try unprotected official Huracan STO original YouTube playback variants.
Native decoded proof required; no auth circumvention. Do not package low-res.
"""
# Re-run with GitHub secret if present; never log or export authentication cookies.
from pathlib import Path
import json,subprocess,hashlib,zipfile,os
from PIL import Image,ImageDraw
R=Path('out/sto-youtube-hd'); R.mkdir(parents=True,exist_ok=True)
MEDIA=R/'videos';MEDIA.mkdir(exist_ok=True)
BOARDS=R/'previews';BOARDS.mkdir(exist_ok=True)
VIDS=[
  ('lamborghini-accademia-vallelunga-2024','https://www.youtube.com/watch?v=egjLBe6lMXU','Lamborghini official verified video: STO track at Vallelunga'),
  ('sto-first-test-2021','https://www.youtube.com/watch?v=jMOdF_wLAfU','The Wheel Network native 2021 STO track driving press film')
]
cookies_path = os.environ.get("YOUTUBE_COOKIES_FILE", "").strip()
cookies_file = Path(cookies_path) if cookies_path else None
cookies_ready = bool(cookies_file and cookies_file.is_file())
print("Cookie authentication: " + ("configured" if cookies_ready else "missing GitHub secret; skipping video downloads"))
rows=[]
for slug,url,desc in VIDS:
  row={'id':slug,'page':url,'title':desc,'status':'NOT_DOWNLOADED','manually_approved_moving_angles':0}
  rows.append(row)
  dest=MEDIA/(slug+'.mp4')
  if not cookies_ready:
    row["status"] = "COOKIE_SECRET_NOT_CONFIGURED"
    continue
  try:
    p=subprocess.run(['yt-dlp','--cookies',str(cookies_file),'-f','bv[height>=1080]+ba/b[height>=1080]/bv+ba/b','--merge-output-format','mp4',
       '--remux-video','mp4','--no-playlist','--no-progress','--retries','1','--fragment-retries','1','--socket-timeout','15',
       '--max-filesize','200M','--output',str(dest),url],capture_output=True,text=True,timeout=190)
    if p.returncode or not dest.exists():
      row.update(status='COOKIE_AUTH_DOWNLOAD_FAILED',error="YouTube still denied the source or the video is inaccessible; see yt-dlp guidance.")
      continue
    meta=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(dest)],text=True,capture_output=True,timeout=30,check=True)
    x=json.loads(meta.stdout);vid=next(s for s in x['streams'] if s['codec_type']=='video')
    info={'width':vid['width'],'height':vid['height'],'duration':float(x['format']['duration']),
      'bytes':dest.stat().st_size,'codec':vid['codec_name'],
      'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
    row['actual_probe']=info
    if info['width']<1920 or info['height']<1080 or info['width']<=info['height']:
      row['status']='REJECT_NOT_NATIVE_FHD';dest.unlink();continue
    row['status']='NATIVE_FHD_ACQUIRED_PENDING_WATERMARK_AND_STO_SHOT_REVIEW'
    im=Image.new('RGB',(960,6*155),'#12141a');draw=ImageDraw.Draw(im)
    for i in range(24):
      t=min(info['duration']-.06,max(.1,info['duration']*(i+.5)/24))
      f=R/'.tmp.jpg'
      subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-ss',str(t),'-i',str(dest),'-vf','scale=240:135:force_original_aspect_ratio=decrease,pad=240:135:(ow-iw)/2:(oh-ih)/2','-frames:v','1',str(f)],capture_output=True,timeout=30)
      if f.exists():
        with Image.open(f) as small:im.paste(small.convert('RGB'),((i%4)*240,(i//4)*155+17))
        f.unlink()
      draw.text(((i%4)*240+2,(i//4)*155+1),str(round(t,1)),fill='white')
    im.save(BOARDS/(slug+'_24shots.jpg'),quality=85)
  except Exception as e:
    row.update(status='ERROR',error=str(e)[-200:]);dest.unlink(missing_ok=True)
  (R/'manifest.json').write_text(json.dumps({'sources':rows,'manually_approved_moving_angles':0},indent=2))
(R/'manifest.json').write_text(json.dumps({'sources':rows,'manually_approved_moving_angles':0},indent=2))
with zipfile.ZipFile('out/STO_PUBLIC_YOUTUBE_ORIGINALS_RESEARCH.zip','w',zipfile.ZIP_STORED,allowZip64=True) as z:
  for f in R.rglob('*'):
    if f.is_file():z.write(f,f.relative_to(R))
for row in rows:print(row['id'],row['status'],row.get('actual_probe',{}).get('width'),row.get('error','')[-160:])
