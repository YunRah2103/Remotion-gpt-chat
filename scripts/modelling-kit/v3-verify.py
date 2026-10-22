"""Real-media proof; metrics are diagnostics, not automatic aesthetic approval."""
import hashlib,json,pathlib,subprocess,sys
from PIL import Image,ImageDraw,ImageChops,ImageStat
import io
folder=pathlib.Path(sys.argv[1]);video=folder/'proof.mp4'
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in meta['streams'] if s['codec_type']=='video');expected=(1920,1080) if 'landscape' in folder.name else (1080,1920)
assert (v['width'],v['height'])==expected
assert v['r_frame_rate']=='30/1' and int(v['nb_frames'])==180
assert abs(float(meta['format']['duration'])-6)<.05
assert not any(s['codec_type']=='audio' for s in meta['streams']),'Proofs must remain explicitly silent'
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
md5=subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-an','-f','framemd5','-']).decode();hashes=[s.rsplit(',',1)[-1].strip() for s in md5.splitlines() if not s.startswith('#') and s.strip()]
assert len(hashes)==180 and len(set(hashes))>150,'Static/repetitive proof'
# A sequential render must show the same edited geometry as a direct still.
consistency=[]
for still in folder.glob('frame-*.png'):
 frame=int(still.stem.split('-')[1]);png=subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-vf',f'select=eq(n\\,{frame})','-frames:v','1','-f','image2pipe','-vcodec','png','-'])
 expected_image=Image.open(still).convert('RGB');actual_image=Image.open(io.BytesIO(png)).convert('RGB').resize(expected_image.size,Image.Resampling.LANCZOS)
 delta=sum(ImageStat.Stat(ImageChops.difference(expected_image,actual_image)).mean)/3
 consistency.append({'frame':frame,'meanChannelDelta':delta})
 assert delta<3.0,f'Still/video geometry mismatch at frame {frame}: {delta:.3f}; inspect actual moving footage'
(folder/'frame-consistency.json').write_text(json.dumps(consistency,indent=2)+'\n')
images=sorted(folder.glob('frame-*.png'),key=lambda p:int(p.stem.split('-')[1]));thumbs=[]
for file in images:
 im=Image.open(file).convert('RGB');im.thumbnail((270,480));thumbs.append((file,im.copy()))
sheet=Image.new('RGB',(270*3,510*2),'#12202b');draw=ImageDraw.Draw(sheet)
for i,(file,im) in enumerate(thumbs):x=i%3*270;y=i//3*510;sheet.paste(im,(x,y));draw.text((x+8,y+482),file.stem,fill='white')
sheet.save(folder/'contact-sheet.jpg',quality=92)
if (folder/'before.png').exists():
 a=Image.open(folder/'before.png').convert('RGB');b=Image.open(folder/'after.png').convert('RGB');compare=Image.new('RGB',(a.width*2,a.height+35),'#12202b');compare.paste(a,(0,35));compare.paste(b,(a.width,35));d=ImageDraw.Draw(compare);d.text((10,10),'SHARED BASELINE',fill='white');d.text((a.width+10,10),'PROJECT GEOMETRY OVERRIDES',fill='white');compare.save(folder/'comparison.jpg',quality=93)
report={'file':str(video),'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'dimensions':expected,'fps':30,'frames':len(hashes),'uniqueFrames':len(set(hashes)),'duration':float(meta['format']['duration']),'audio':'silent','fullDecode':'pass','visualApproval':'pending human/agent frame inspection','limitations':'No comprehensive mesh intersection, blur or hand/foot accuracy certification'}
(folder/'video-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
