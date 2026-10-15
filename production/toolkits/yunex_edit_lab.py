#!/usr/bin/env python3
"""YUNEX edit preparation: source-shot scouting, intentional speed ramps and LUFS QA.

Original footage/music are never overwritten; all media processing is explicit.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys

def run(args, timeout=300):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=timeout)

def media_info(source):
    d=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format',
                      '-of','json',str(source)]).stdout)
    video=next((x for x in d['streams'] if x.get('codec_type')=='video'),None)
    audio=next((x for x in d['streams'] if x.get('codec_type')=='audio'),None)
    return {'duration':float(d['format']['duration']),
            'video': video, 'audio': audio, 'source_sha256': digest(source)}

def digest(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda:f.read(1048576),b''):
            h.update(chunk)
    return h.hexdigest()

def frame(source,second,target):
    target.parent.mkdir(parents=True,exist_ok=True)
    run(['ffmpeg','-hide_banner','-v','error','-nostdin','-y',
         '-ss',f'{second:.4f}','-i',str(source),'-frames:v','1',
         '-vf','scale=384:-2','-q:v','3',str(target)],timeout=90)
    if not target.exists() or not target.stat().st_size:
        raise RuntimeError('No decodable frame at '+str(second))

def dhash(img):
    from PIL import Image
    miniature=img.convert('L').resize((9,8),Image.Resampling.LANCZOS)
    pixels=list(miniature.getdata())
    bits=0
    for y in range(8):
        for x in range(8):
            bits=(bits<<1)|int(pixels[y*9+x]>pixels[y*9+x+1])
    return bits

def create_contact(shots,dest):
    from PIL import Image,ImageDraw,ImageOps
    width,height,cols=300,220,3
    rows=(len(shots)+cols-1)//cols
    canvas=Image.new('RGB',(width*cols,height*rows),(21,23,26))
    draw=ImageDraw.Draw(canvas)
    for i,shot in enumerate(shots):
        with Image.open(dest/shot['thumbnail']) as im:
            tile=ImageOps.contain(im.convert('RGB'),(width-12,height-42))
            x=(i%cols)*width+(width-tile.width)//2
            y=(i//cols)*height+(height-42-tile.height)//2
            canvas.paste(tile,(x,y))
        draw.text(((i%cols)*width+9,(i//cols)*height+height-32),
                  f"#{i+1:02d}  {shot['start']:.2f}-{shot['end']:.2f}s",fill='white')
    canvas.save(dest/'contact-sheet.jpg',quality=88)

def scout(source,out,threshold,max_shots,min_seconds):
    from PIL import Image
    info=media_info(source)
    if not info['video']: raise ValueError('Expected video file')
    if info['duration']>600: raise ValueError('Please trim sources longer than 10 minutes first')
    if info['duration']<.3: raise ValueError('Video too short for shot scouting')
    if not .05<=threshold<=.9:raise ValueError('scene threshold must be between .05 and .9')
    out.mkdir(parents=True,exist_ok=True)
    completed=run(['ffmpeg','-hide_banner','-v','info','-nostdin','-i',str(source),'-an',
                   '-vf',f"select='gt(scene,{threshold:.3f})',showinfo",
                   '-f','null','-'],timeout=450)
    raw=[float(s) for s in re.findall(r'Parsed_showinfo[^\n]*pts_time:\s*([\d.]+)',
                                      completed.stderr)]
    # Debounce cuts: avoid flash flicker and excessively short transition segments.
    boundaries=[0.]
    for t in sorted(set(raw)):
        if min_seconds<=t<=info['duration']-min_seconds and t-boundaries[-1]>=min_seconds:
            boundaries.append(t)
    boundaries.append(info['duration'])
    scenes=[(a,b) for a,b in zip(boundaries,boundaries[1:]) if b-a>=.08]
    if len(scenes)>max_shots:
        # Keep the first/last portions plus evenly-spaced interior ranges, not just first N.
        indices=sorted(set(round(i*(len(scenes)-1)/(max_shots-1)) for i in range(max_shots)))
        scenes=[scenes[i] for i in indices]
    shots=[]
    previous_hashes=[]
    for i,(start,end) in enumerate(scenes):
        sec=start+(end-start)*.5
        thumb=Path('thumbnails')/f'{i+1:03d}.jpg'
        frame(source,sec,out/thumb)
        with Image.open(out/thumb) as im:
            h=dhash(im)
        closest=min((h^v).bit_count() for v in previous_hashes) if previous_hashes else None
        previous_hashes.append(h)
        shots.append({'start':round(start,3),'end':round(end,3),
                      'lengthSeconds':round(end-start,3),'previewAt':round(sec,3),
                      'thumbnail':str(thumb),'nearestFingerprintDistance':closest,
                      'potentialRepeatedComposition':closest is not None and closest<=6})
    create_contact(shots,out)
    report={'schema':'yunex.shot-scout.v1','source':str(source),
            'sourceSha256':info['source_sha256'],'durationSeconds':info['duration'],
            'sceneThreshold':threshold,'detectedScenes':len(boundaries)-1,
            'sampledScenes':len(shots),'shots':shots,
            'disclaimer':'Cut detection and image hashes only. Similar frames are NOT proof of duplicated source footage; inspect car identity, action, camera and artistic merit.'}
    (out/'shots.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

def validate_ramp(plan,source_duration):
    segments=plan.get('segments')
    if not isinstance(segments,list) or not 1<=len(segments)<=18:
        raise ValueError('Plan requires 1-18 segments')
    total=0
    for i,s in enumerate(segments):
        if not isinstance(s,dict) or set(s.keys())!={'start','end','speed'}:
            raise ValueError('Each segment must contain start, end and speed')
        start,end,speed=(s[k] for k in ('start','end','speed'))
        if any(not isinstance(v,(int,float)) or not math.isfinite(v)
               or isinstance(v,bool) for v in (start,end,speed)):
            raise ValueError('All speed ramp numbers must be finite')
        if start<0 or end<=start or end>source_duration+.02 or not .25<=speed<=4:
            raise ValueError('Invalid segment bounds or speed, expected .25x-4x')
        if end-start<.2:
            raise ValueError('Every source segment must be at least 0.2 seconds')
        total+=(end-start)/speed
        if i and start<segments[i-1]['end']-.001:
            raise ValueError('Source segments must be chronologically ordered and nonoverlapping')
    if total>90:raise ValueError('Result is longer than 90 seconds')
    return total

def speed_ramp(source,plan,out,fps,crf):
    info=media_info(source)
    video=info['video']
    if not video:raise ValueError('Expected video source')
    if video.get('color_transfer') in ('smpte2084','arib-std-b67'):
        raise ValueError('HDR source detected: do a colour-managed conversion first; no accidental HDR→SDR washout')
    if out.resolve()==source.resolve():raise ValueError('Will not overwrite original')
    expected=validate_ramp(plan,info['duration'])
    if not 24<=fps<=60 or not 14<=crf<=24:raise ValueError('fps 24-60, CRF 14-24')
    nodes=[]
    for i,s in enumerate(plan['segments']):
        nodes.append(f"[0:v]trim=start={s['start']:.6f}:end={s['end']:.6f},"
                     f"setpts=(PTS-STARTPTS)/{s['speed']:.6f},"
                     f"fps={fps},setsar=1,format=yuv420p[v{i}]")
    joins=''.join(f'[v{i}]' for i in range(len(nodes)))
    chain=';'.join(nodes)+';'+joins+f"concat=n={len(nodes)}:v=1:a=0[v]"
    out.parent.mkdir(parents=True,exist_ok=True)
    run(['ffmpeg','-hide_banner','-v','error','-nostdin','-y','-i',str(source),
         '-filter_complex',chain,'-map','[v]','-an',
         '-c:v','libx264','-crf',str(crf),'-preset','medium','-pix_fmt','yuv420p',
         '-movflags','+faststart',str(out)],timeout=900)
    result=media_info(out)
    if abs(result['duration']-expected) > max(.22, len(plan['segments'])/fps):
        raise RuntimeError(f'Output timing mismatch {result["duration"]:.2f}s vs {expected:.2f}s')
    run(['ffmpeg','-v','error','-xerror','-nostdin','-i',str(out),
         '-map','0:v:0','-f','null','-'],timeout=480)
    return {'schema':'yunex.speed-ramp.v1','original':str(source),
            'inputSha256':info['source_sha256'],'output':str(out),
            'outputSha256':result['source_sha256'],'expectedDuration':round(expected,3),
            'actualDuration':round(result['duration'],3),'fps':fps,'segments':plan['segments'],
            'fullDecode':'PASS','audio':'intentionally omitted; keep original soundtrack separate',
            'warning':'No motion interpolation. For slow motion prefer original high-FPS footage. This is a stepped-speed edit; join points require visual QA.'}

def loudness(source):
    info=media_info(source)
    if not info['audio']: raise ValueError('Audio stream not present')
    completed=run(['ffmpeg','-hide_banner','-v','info','-nostdin','-i',str(source),
                   '-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
                   '-f','null','-'],timeout=450)
    m=re.search(r'(\{\s*"input_i"\s*:.+?\})',completed.stderr,re.S)
    if not m:raise RuntimeError('FFmpeg loudnorm measurement not found')
    d=json.loads(m.group(1))
    values={k:float(d[k]) for k in ('input_i','input_tp','input_lra','input_thresh')
            if d.get(k) not in (None,'inf','-inf')}
    return {'schema':'yunex.audio-meter.v1','source':str(source),
            'sourceSha256':info['source_sha256'],'measurement':values,
            'reviewRequired':values.get('input_tp',-100)>-1.0,
            'disclaimer':'LUFS and true-peak are diagnostic; no processing is applied. Do not infer a universal TikTok/YouTube LUFS standard.'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    sub=p.add_subparsers(dest='task',required=True)
    s=sub.add_parser('scout',help='Find cuts and make contact sheet')
    s.add_argument('--video',type=Path,required=True)
    s.add_argument('--output',type=Path,required=True)
    s.add_argument('--threshold',type=float,default=.29)
    s.add_argument('--max-shots',type=int,default=24)
    s.add_argument('--min-seconds',type=float,default=.55)
    r=sub.add_parser('ramp',help='Create silent variable-speed source shot, original untouched')
    r.add_argument('--video',type=Path,required=True)
    r.add_argument('--plan',type=Path,required=True)
    r.add_argument('--output',type=Path,required=True)
    r.add_argument('--fps',type=int,default=30)
    r.add_argument('--crf',type=int,default=17)
    a=sub.add_parser('meter',help='Inspect original audio or final soundtrack LUFS')
    a.add_argument('--file',type=Path,required=True)
    a.add_argument('--output',type=Path)
    args=p.parse_args()
    if args.task=='scout':
        if not 2<=args.max_shots<=48 or not .2<=args.min_seconds<=3:
            p.error('max-shots must be 2-48, min-seconds .2-3')
        result=scout(args.video,args.output,args.threshold,args.max_shots,args.min_seconds)
    elif args.task=='ramp':
        result=speed_ramp(args.video,json.loads(args.plan.read_text()),args.output,
                          args.fps,args.crf)
        (args.output.with_suffix('.report.json')).write_text(json.dumps(result,indent=2)+'\n')
    else:
        result=loudness(args.file)
        if args.output:
            args.output.parent.mkdir(parents=True,exist_ok=True)
            args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))


if __name__=='__main__':
    main()
