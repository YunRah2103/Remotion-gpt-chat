from pathlib import Path
import hashlib,json,urllib.request,subprocess
from PIL import Image,ImageDraw
dest=Path('stockcar_media');dest.mkdir(exist_ok=True)
qa=Path('production/research/agent-b-pexels-20261014');qa.mkdir(parents=True,exist_ok=True)
sources=[
 ('red_day', '15368873','15368873-hd_1920_1080_60fps.mp4','Jaxon Matthew Willis','day stock-car 2s'),
 ('red_night','18447538','18447538-hd_1920_1080_60fps.mp4','Jaxon Matthew Willis','red racecar night'),
 ('pack','18446606','18446606-hd_1920_1080_60fps.mp4','Jaxon Matthew Willis','racecar pack 11s'),
 ('pack_two','15368700','15368700-hd_1920_1080_60fps.mp4','Jaxon Matthew Willis','stock-car short track'),
 ('circuit_4k','15634326','15634326-uhd_3840_2160_30fps.mp4','Sean P. Twomey','racing international circuit 4k; confirm actual vehicle class')]
report=[]
for slug,idx,fname,creator,description in sources:
 url='https://videos.pexels.com/video-files/'+idx+'/'+fname
 path=dest/(slug+'.mp4')
 d=dict(id=slug,creator=creator,source_page='https://www.pexels.com/video/'+idx+'/',direct_url=url,description=description,license='Pexels Free License; verify editorial identity and sponsorship',status='pending')
 try:
  request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) Chrome/132 Safari/537.36','Referer':'https://www.pexels.com/'})
  with urllib.request.urlopen(request,timeout=100) as r,open(path,'wb') as f:
   while chunk:=r.read(2**20):f.write(chunk)
  if path.stat().st_size<100000:raise RuntimeError('Not usable video bytes')
  r=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)],text=True,capture_output=True,check=True)
  meta=json.loads(r.stdout);st=next(x for x in meta['streams'] if x['codec_type']=='video')
  dur=float(meta['format']['duration'])
  d.update(status='verified',bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),width=st['width'],height=st['height'],fps=st.get('avg_frame_rate'),duration=dur,codec=st.get('codec_name'))
  decoded=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-map','0:v:0','-f','null','-'],capture_output=True,text=True)
  d['full_decode_pass']=decoded.returncode==0
  if decoded.returncode:d['error']=decoded.stderr[-600:]
  image=Image.new('RGB',(1200,780),(15,15,15));draw=ImageDraw.Draw(image);times=[]
  for i in range(9):
   t=round((i+0.4)*dur/9,3)
   tmp=qa/(slug+'_frame.jpg')
   subprocess.run(['ffmpeg','-nostdin','-v','error','-ss',str(t),'-i',str(path),'-frames:v','1','-vf','scale=390:-2','-y',str(tmp)],capture_output=True)
   if tmp.exists():
    with Image.open(tmp) as raw:
     tile=raw.convert('RGB');tile.thumbnail((390,225));image.paste(tile,((i%3)*400+(400-tile.width)//2,(i//3)*260+28))
    draw.text(((i%3)*400+8,(i//3)*260+6),f'{slug} t={t:.2f}s',fill=(255,255,255));times.append(t);tmp.unlink()
  image.save(qa/(slug+'_contact.jpg'),quality=85);d['sheet_timestamps']=times
 except Exception as e:
  d['status']='failed';d['error']=str(e)
  if path.exists() and path.stat().st_size<100000:path.unlink()
 report.append(d);print(slug,d['status'],d.get('bytes',0),d.get('duration'),d.get('full_decode_pass'),flush=True)
(qa/'manifest.json').write_text(json.dumps(report,indent=2))
(qa/'README.md').write_text('# Agent B Stock Car Source QA\n\nReal clips must be confirmed by reviewing contact sheets. Pexels label NASCAr is not proof of NASCAR-sanctioned event. Source authors in manifest. No film edit performed.\n')
