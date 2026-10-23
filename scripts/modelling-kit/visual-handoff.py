"""Pixel-faithful contact sheets and log previews for remote native-video review."""
import argparse,base64,io,json,pathlib,re,subprocess
from PIL import Image,ImageDraw,ImageFont
STUDIO=['StudioRoadPortrait','StudioMechanicsPortrait','StudioF1Portrait','StudioRainPortrait']
FONT=ImageFont.load_default(size=18)
def emit(path,label):
    data=base64.b64encode(path.read_bytes()).decode('ascii')
    print(f'YUNEX_CONTACT_{label}={data}',flush=True)
def contact(root,name):
    images=sorted(root.glob(name+'-[0-9]*.png'),key=lambda p:float(p.stem[len(name)+1:]))
    if not images:return
    portrait='Portrait' in name;w,h=(360,640) if portrait else (480,270);cols=min(3,len(images));rows=(len(images)+cols-1)//cols
    sheet=Image.new('RGB',(w*cols,(h+30)*rows),'#10212b');draw=ImageDraw.Draw(sheet)
    for i,path in enumerate(images):
        x=(i%cols)*w;y=(i//cols)*(h+30)
        sheet.paste(Image.open(path).convert('RGB').resize((w,h)),(x,y+30));draw.text((x+10,y+5),path.stem[len(name)+1:]+' s',fill='white',font=FONT)
    target=root/(name+'-contact.jpg');sheet.save(target,quality=78);emit(target,name)
def comparisons(previous,current,body=False):
    if body:
        cases=[('KitAPortrait','0.5','Hatchback'),('KitAPortrait','3.5','Supercar'),('KitAPortrait','6.5','Formula exterior retained')]
        w,h=720,480
    else:
        cases=[('StudioF1Portrait','3.5','Onboard view'),('StudioRoadPortrait','6.5','Wheel framing'),('StudioMechanicsPortrait','9.5','Component close-up')]
        w,h=360,640
    sheet=Image.new('RGB',(w*2,(h+40)*len(cases)),'#10212b');draw=ImageDraw.Draw(sheet)
    for row,(name,second,label) in enumerate(cases):
        for col,root in enumerate([previous,current]):
            source=root/f'{name}-{second}.png'
            if not source.is_file():return
            image=Image.open(source).convert('RGB')
            if body:image=image.crop((100,720,1000,1320))
            sheet.paste(image.resize((w,h)),(col*w,row*(h+40)+40))
            draw.text((col*w+10,row*(h+40)+8),('Before / ' if col==0 else 'After / ')+label,fill='white',font=FONT)
    target=current/('native-body-comparison.jpg' if body else 'native-camera-comparison.jpg');sheet.save(target,quality=82);emit(target,'BodyComparison' if body else 'CameraComparison')
def showcase(root):
    destination=root/'handoff';destination.mkdir(exist_ok=True)
    listing=destination/'episodes.txt';listing.write_text(chr(10).join("file '"+str((root/(name+'.mp4')).resolve())+"'" for name in STUDIO)+chr(10))
    target=destination/'YUNEX_Agent_Studio_Episodes.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-an','-c:v','libx264','-preset','fast','-crf','22','-maxrate','4M','-bufsize','8M','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',str(target)],check=True)
    info=subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(target)]);print(info.decode());metadata=json.loads(info);stream=next(s for s in metadata['streams'] if s['codec_type']=='video');assert (stream['width'],stream['height'],int(stream['nb_frames']))==(1080,1920,2160);assert stream['r_frame_rate']=='30/1' and abs(float(metadata['format']['duration'])-72)<.05
    subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True);listing.unlink()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('root',type=pathlib.Path);parser.add_argument('--id');parser.add_argument('--before',type=pathlib.Path);parser.add_argument('--body-before',type=pathlib.Path);parser.add_argument('--showcase',action='store_true')
    args=parser.parse_args()
    for name in ([args.id] if args.id else STUDIO+['KitAPortrait','KitDPortrait','KitEPortrait','KitHPortrait']):contact(args.root,name)
    if args.before:comparisons(args.before,args.root)
    if args.body_before:comparisons(args.body_before,args.root,True)
    if args.showcase:showcase(args.root)
