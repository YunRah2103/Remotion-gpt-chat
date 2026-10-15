#!/usr/bin/env python3
"""Restricted R35 source QA: compute cut boundaries, metadata, and low-resolution contact sheets.
NO original MP4 is uploaded or committed. The media stays in owner-only draft Releases.
"""
import argparse, hashlib, io, json, math, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat, ImageChops

def command(argv):
    return subprocess.run(argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout

def frame(filename,at,width=540):
    try:
        png=command(['ffmpeg','-hide_banner','-loglevel','error','-ss',str(round(at,3)),'-i',str(filename),'-frames:v','1','-vf',f'scale={width}:-2','-f','image2pipe','-vcodec','png','-'])
        return Image.open(io.BytesIO(png)).convert('RGB')
    except Exception:
        return None

def scenes(filename,duration):
    try:
        from scenedetect import open_video,SceneManager
        from scenedetect.detectors import ContentDetector
        manager=SceneManager()
        manager.add_detector(ContentDetector(threshold=27,min_scene_len=12))
        manager.detect_scenes(open_video(str(filename)),show_progress=False)
        out=[{'in':round(start.get_seconds(),3),'out':round(end.get_seconds(),3)} for start,end in manager.get_scene_list(start_in_scene=True)]
        if out: return out
    except Exception as ex:
        print('SCENE_DETECTION_FALLBACK',str(ex)[:200],flush=True)
    return [{'in':0,'out':round(duration,3)}]

def samples_sheet(filename,times,target,job):
    cw,ch=760,355
    sheet=Image.new('RGB',(2*cw, math.ceil(len(times)/2)*ch),'#11161b')
    draw=ImageDraw.Draw(sheet)
    font=ImageFont.load_default()
    for k,t in enumerate(times):
        im=frame(filename,t)
        if im is None:continue
        full=im.resize((540,304))
        narrow=round(im.height*9/16)
        left=(im.width-narrow)//2
        portrait=im.crop((left,0,left+narrow,im.height)).resize((171,304))
        x=(k%2)*cw; y=(k//2)*ch
        sheet.paste(full,(x+8,y+23));sheet.paste(portrait,(x+556,y+23))
        draw.text((x+8,y+5),f'#{job} | {t:06.2f}s | frame {k+1}/{len(times)}',fill='#ffffff',font=font)
        draw.text((x+558,y+330),'center 9:16 crop',fill='#dddddd',font=font)
    sheet.save(target,quality=88,optimize=True)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    parser.add_argument('--source',action='append',nargs=2,required=True)
    a=parser.parse_args()
    root=Path(a.out);root.mkdir(parents=True,exist_ok=True)
    data={'usage':'owner-only research; no publishing rights established','sources':[]}
    for number,filename in a.source:
        f=Path(filename)
        meta=json.loads(command(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(f)]))
        video=next(s for s in meta['streams'] if s['codec_type']=='video')
        dur=float(meta['format']['duration'])
        shotlist=scenes(f,dur)
        times=set(round(min(dur-0.1,k*2.5+1.25),3) for k in range(math.ceil(dur/2.5)))
        times.update(round((s['in']+s['out'])/2,3) for s in shotlist if s['out']-s['in']>0.8)
        times=sorted(t for t in times if 0<=t<dur)
        samples_sheet(f,times,root/f'contact_{number}.jpg',number)
        sha=hashlib.sha256()
        with f.open('rb') as stream:
            for chunk in iter(lambda:stream.read(1024*1024),b''):
                sha.update(chunk)
        entry={'job':number,'duration':dur,'width':video['width'],'height':video['height'],'codec':video['codec_name'],'fps':video['avg_frame_rate'],'sha256':sha.hexdigest(),'bytes':f.stat().st_size,'scenes':shotlist,'sample_times':times}
        data['sources'].append(entry)
        print('R35_PRIVATE_QA_PASS',json.dumps(entry),flush=True)
    (root/'manifest.json').write_text(json.dumps(data,indent=2))
    (root/'readme.txt').write_text('Low resolution contact previews only for private owner research. No source video included. Consult per-source permission before publication.\n')
    print('COMPLETE: source MP4s not uploaded, only preview contact sheets and metadata',flush=True)

if __name__=='__main__':main()
