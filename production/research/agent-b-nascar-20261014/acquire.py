from pathlib import Path
import hashlib,urllib.request,urllib.parse,subprocess,json
from PIL import Image,ImageDraw
out=Path('nascar_media');out.mkdir(exist_ok=True)
qa=Path('production/research/agent-b-nascar-20261014');qa.mkdir(parents=True,exist_ok=True)
files=[
 ('clash_01','2024 Busch Light Clash at The Coliseum - Sarah Stierch 01.webm','2024 NASCAR Clash'),
 ('clash_02','2024 Busch Light Clash at The Coliseum - Sarah Stierch 02.webm','2024 NASCAR race start'),
 ('clash_03','2024 Busch Light Clash at The Coliseum - Sarah Stierch 03.webm','2024 NASCAR Clash'),
 ('clash_04','2024 Busch Light Clash at The Coliseum - Sarah Stierch 04.webm','2024 NASCAR Clash'),
 ('clash_05','2024 Busch Light Clash at The Coliseum - Sarah Stierch 05.webm','2024 NASCAR Clash'),
 ('sonoma23_02','2023 Toyota-Save Mart 350 - Sarah Stierch - Video 02.webm','2023 NASCAR Sonoma 4K'),
 ('sonoma24_06','2024 ToyotaSave Mart 350 - Sarah Stierch 06.webm','2024 NASCAR Sonoma portrait')]
report=[]
for slug,name,description in files:
 safe=name.replace(' ','_');hash=hashlib.md5(safe.encode()).hexdigest()
 url='https://upload.wikimedia.org/wikipedia/commons/'+hash[0]+'/'+hash[:2]+'/'+urllib.parse.quote(safe)
 page='https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(safe)
 dest=out/(slug+'.webm')
 d={'id':slug,'url':page,'direct_url':url,'creator':'Sarah Stierch','license':'CC BY 4.0','description':description,'status':'pending'}
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (YUNEX licensed footage QA)','Referer':'https://commons.wikimedia.org/'})
  with urllib.request.urlopen(req,timeout=110) as response,open(dest,'wb') as f:
   while chunk:=response.read(1048576):f.write(chunk)
  if dest.stat().st_size<100000 or dest.read_bytes()[:4]!=bytes.fromhex('1a45dfa3'):raise RuntimeError('Invalid WebM response')
  r=subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(dest)],capture_output=True,text=True,check=True)
  v=json.loads(r.stdout)
  s=next(x for x in v['streams'] if x['codec_type']=='video')
  duration=float(v['format']['duration'])
  d.update(status='downloaded',bytes=dest.stat().st_size,sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),width=s['width'],height=s['height'],fps=s.get('avg_frame_rate'),duration=duration,codec=s['codec_name'])
  decode=subprocess.run(['ffmpeg','-v','error','-i',str(dest),'-map','0:v:0','-f','null','-'],capture_output=True,text=True)
  d['decode_pass']=decode.returncode==0
  if decode.returncode:d['decode_error']=decode.stderr[-700:]
  sheet=Image.new('RGB',(1200,780),(15,15,15));draw=ImageDraw.Draw(sheet);times=[]
  for i in range(9):
   t=round((i+.4)*duration/9,3)
   fn=qa/(slug+'_'+str(i)+'.jpg')
   subprocess.run(['ffmpeg','-nostdin','-v','error','-ss',str(t),'-i',str(dest),'-frames:v','1','-vf','scale=390:-2','-y',str(fn)],capture_output=True)
   if fn.exists():
    with Image.open(fn) as image:
     im=image.convert('RGB');im.thumbnail((390,222));sheet.paste(im,((i%3)*400+(400-im.width)//2,(i//3)*260+28))
    draw.text(((i%3)*400+8,(i//3)*260+6),f'{slug}: {t:.2f}s',fill=(255,255,255))
    times.append(t);fn.unlink()
  sheet.save(qa/(slug+'_contact.jpg'),quality=85)
  d['contact_sheet']=str(qa/(slug+'_contact.jpg'));d['sheet_timestamps']=times
 except Exception as ex:
  d['status']='failed';d['error']=str(ex)
  if dest.exists() and dest.stat().st_size<100000:dest.unlink()
 print(slug,d['status'],d.get('width'),d.get('height'),d.get('fps'),d.get('decode_pass'),flush=True)
 report.append(d)
(qa/'manifest.json').write_text(json.dumps(report,indent=2))
summary='# Agent B CC BY 4.0 actual NASCAR footage QA\n\nCreator: Sarah Stierch. Attribution required. Do not infer usable camera matches from metadata alone.\n\n'
for r in report:
 summary+=f"- **{r['id']}** {r['status']} {r.get('width','?')}x{r.get('height','?')} @ {r.get('fps','?')}, {r.get('duration','?')}s decode={r.get('decode_pass','?')} [source]({r['url']})\n"
(qa/'README.md').write_text(summary)
