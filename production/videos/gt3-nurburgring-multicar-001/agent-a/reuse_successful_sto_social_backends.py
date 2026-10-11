#!/usr/bin/env python3
"""Reuse proven prior STO gallery-dl/Instaloader backends for public N24 profiles.

Account index != video download. Save full error/result/known post URLs, and
physically download bounded racing-identified video candidates. Never invent
auth accounts or upscaled HD from 720p.
"""
import hashlib,json,re,subprocess,sys,time
from pathlib import Path
from PIL import Image,ImageDraw
OUT=Path("out/gt3-reused-sto-social-backends");MEDIA=OUT/"native_media";SHEETS=OUT/"contact_sheets"
for p in [OUT,MEDIA,SHEETS]:p.mkdir(parents=True,exist_ok=True)
PROFILES=[
 ("TikTok","24hnbr"),("TikTok","nuerburgring"),("TikTok","gtworldcheu"),
 ("TikTok","redbullmotorsports"),("TikTok","abt_sportsline"),
 ("Instagram","24hnbr"),("Instagram","nuerburgring"),("Instagram","rinaldiracing"),
 ("Instagram","walkenhorst_motorsport"),("Instagram","abtsportsline"),
 ("Instagram","gtworldcheu")
]
TRIGGERS=("n24","nürburgring","nurburgring","nordschleife","24h","gt3","ferrari","296","lamborghini","huracan","audi","vantage","mclaren","porsche","motorsport","bmw")
seen={};rows=[]
def cmd(a,sec=100,cwd=None):
 try:return subprocess.run(a,capture_output=True,text=True,timeout=sec,cwd=cwd)
 except Exception as e:return subprocess.CompletedProcess(a,123,"",repr(e))
for platform,username in PROFILES:
 item=dict(platform=platform,username=username,status="NO_PUBLIC_INDEX",posts=[])
 if platform=="TikTok":
  url="https://www.tiktok.com/@"+username
  # Prior project gallery-dl successfully acquired known individual TikTok MP4.
  r=cmd(["gallery-dl","--range","1-22","--dump-json",url],95)
  item.update(exit_code=r.returncode,error=r.stderr[-800:],response_lines=len(r.stdout.splitlines()))
  for line in r.stdout.splitlines():
   if len(line)>250000:continue
   try:rec=json.loads(line)
   except:continue
   entry=(rec[2] if isinstance(rec,list) and len(rec)>2 and isinstance(rec[2],dict) else rec if isinstance(rec,dict) else {})
   ident=entry.get("id") or entry.get("aweme_id") or entry.get("video_id") or ""
   title=str(entry.get("desc") or entry.get("description") or entry.get("title") or "")
   if str(ident).isdigit() and len(str(ident))>=16:
    link=f"https://www.tiktok.com/@{username}/video/{ident}"
    item['posts'].append(dict(url=link,caption=title[:300],indexed_by="gallery-dl-public-profile"))
 else:
  try:
   import instaloader
   loader=instaloader.Instaloader(download_pictures=False,download_videos=False,
        download_video_thumbnails=False,download_geotags=False,
        download_comments=False,save_metadata=False,post_metadata_txt_pattern="")
   profile=instaloader.Profile.from_username(loader.context,username)
   for n,post in enumerate(profile.get_posts()):
    if n>=24:break
    if not post.is_video:continue
    link=f"https://www.instagram.com/p/{post.shortcode}/"
    caption=(post.caption or "")[:300]
    item['posts'].append(dict(url=link,caption=caption,indexed_by="Instaloader-public-profile",taken_at=str(post.date_utc)))
  except Exception as e:item['error']=repr(e)[:900]
 item['posts']=list({p['url']:p for p in item['posts']}.values())
 item['status']="POSTS_DISCOVERED" if item['posts'] else "NO_POSTS"
 rows.append(item)
 for post in item['posts']:
  if any(t in post['caption'].lower() for t in TRIGGERS):
   seen.setdefault(post['url'],dict(url=post['url'],platform=platform,hint=post['caption'][:300]))
 print(platform,username,"public video posts:",len(item['posts']),"error:",item.get('error','')[:160],flush=True)
(OUT/"profile_indexes.json").write_text(json.dumps(rows,indent=2,ensure_ascii=False))
downloaded=[];attempts=[]
for k,post in enumerate(list(seen.values())[:26]):
 o={**post,"status":"FAILED"}
 d=MEDIA/f"item_{k:03}";d.mkdir(exist_ok=True)
 if post['platform']=="TikTok":
  r=cmd(["gallery-dl","--directory",str(d.resolve()),"--no-part",post['url']],100)
 else:
  shortcode=post['url'].rstrip('/').split('/')[-1]
  r=cmd(["instaloader","--dirname-pattern",str(d.resolve()),
         "--no-captions","--no-video-thumbnails","--no-metadata-json","--","-"+shortcode],100,cwd=str(d))
 films=[f for f in d.rglob('*') if f.is_file() and f.suffix.lower() in ('.mp4','.mov','.mkv','.webm')]
 if not films:
  o['error']=(r.stderr or r.stdout)[-500:];attempts.append(o);continue
 f=max(films,key=lambda x:x.stat().st_size)
 pp=cmd(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(f)],30)
 if pp.returncode:
  o['error']="ffprobe failure";attempts.append(o);continue
 ff=json.loads(pp.stdout);v=next(x for x in ff['streams'] if x['codec_type']=='video')
 w,h=int(v['width']),int(v['height'])
 o.update(width=w,height=h,bytes=f.stat().st_size,ffprobe=ff)
 if not ((w>=1920 and h>=1080) or (w>=1080 and h>=1920)):
  o["status"]="REJECTED_SOURCE_BELOW_NATIVE_HD";o['error']="unmodified source too small"
  attempts.append(o);continue
 z=cmd(["ffmpeg","-v","error","-i",str(f),"-f","null","-"],100)
 if z.returncode:
  o['status']="REJECTED_DECODE_FAILED";attempts.append(o);continue
 sh=hashlib.sha256(f.read_bytes()).hexdigest()
 if any(p.get('sha256')==sh for p in downloaded):
  o['status']="REJECTED_BIT_IDENTICAL_DUPLICATE";attempts.append(o);continue
 o.update(status="NATIVE_HD_ACTUAL_VIDEO_VISUAL_GT3_N24_QA_PENDING",sha256=sh,file=str(f.relative_to(OUT)))
 duration=float(ff['format'].get('duration') or 0)
 sheet=Image.new("RGB",(1440,590),(8,8,8));drawer=ImageDraw.Draw(sheet)
 for i in range(6):
  sec=max(.04,duration*(i+.4)/6)
  temporary=SHEETS/f"temp_{k}_{i}.jpg"
  cmd(["ffmpeg","-v","error","-y","-ss",str(sec),"-i",str(f),"-frames:v","1","-vf","scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",str(temporary)],35)
  if temporary.exists():
   with Image.open(temporary) as img:sheet.paste(img.convert('RGB'),((i%3)*480,(i//3)*295+25))
   temporary.unlink()
  drawer.text(((i%3)*480,(i//3)*295),f"{sec:.1f}s {w}x{h}",fill="white")
 dest=SHEETS/f"social_{k:03}_SHEET.jpg";sheet.save(dest,quality=88)
 o['contact_sheet']=str(dest.relative_to(OUT))
 downloaded.append(o);attempts.append(o)
 print("NATIVE SOCIAL VIDEO",k,w,h,sh,flush=True)
(OUT/"manifest.json").write_text(json.dumps(dict(gate="BLOCKED_PENDING_VISUAL_REVIEW",found_target_posts=len(seen),actual_native_hd_downloads=len(downloaded),
 candidates=downloaded,attempted=attempts,profiles=rows,
 caution="Native portrait video may not be safe for 1920x1080 horizontal crop; independently verify model, race, camera, watermark."),indent=2,ensure_ascii=False))
print("DONE",len(seen),"public post candidates",len(downloaded),"real native HD files")
