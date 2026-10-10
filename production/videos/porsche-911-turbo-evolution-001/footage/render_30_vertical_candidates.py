#!/usr/bin/env python3
"""A: real Porsche Turbo video conversion and one-file ZIP delivery candidate.

Requires exact 30-source selection records and the canonical 510-frame beat map.
Retimes native 25p source to 30p without inventing frames; video only, H.264 CRF16.
Original video not decoded twice for intermediate renders; remote source -> final encode.
Output quality/technical proof checked rigorously; final human crop/duplicate review
still required; no invented copyright clearance or full-master hash.
"""
import argparse,collections,hashlib,io,json,math,os,subprocess,sys,zipfile
from fractions import Fraction
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageStat

GENERATIONS=['930']*4+['964']*4+['993']*4+['996']*4+['997']*4+['991']*5+['992']*5
NAME='PORSCHE_911_TURBO_EVOLUTION_ALL_30_CLIPS_1080P.zip'

def command(args,timeout=360):
    process=subprocess.run(args,capture_output=True,timeout=timeout)
    if process.returncode:
        raise RuntimeError(f"{' '.join(str(x) for x in args[:8])}: {process.stderr.decode(errors='replace')[-700:]}")
    return process.stdout

def hash_file(file):
    h=hashlib.sha256()
    with file.open('rb') as f:
        for v in iter(lambda:f.read(1048576),b''):h.update(v)
    return h.hexdigest()

def probe(file):
    data=json.loads(command(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)],85))
    v=next(s for s in data.get('streams',[]) if s.get('codec_type')=='video')
    return {'width':int(v['width']),'height':int(v['height']),'fps':float(Fraction(v['avg_frame_rate'])),
            'codec':v.get('codec_name'),'pix_fmt':v.get('pix_fmt'),
            'duration':float(data['format']['duration']),'frames':int(v.get('nb_frames') or 0),
            'bitrate':int(data['format'].get('bit_rate') or 0)}

def source_clips(plan,beat):
    shots=plan['slots']
    cuts=beat['cuts']
    if len(shots)!=30 or len(cuts)!=30 or beat['output']['frames']!=510:raise ValueError('Need exactly 30 shots/510 beat frames')
    for i,(shot,cut) in enumerate(zip(shots,cuts)):
        if shot['slot']!=i+1 or cut['slot']!=i+1 or shot['generation']!=GENERATIONS[i] or cut['generation']!=GENERATIONS[i]:
            raise ValueError(f'slot {i+1} chronology invalid')
    for i in range(1,30):
        if cuts[i]['startFrame']!=cuts[i-1]['endFrame']+1:raise ValueError('non-contiguous beat map')
    if cuts[-1]['endFrame']!=509:raise ValueError('last beat must end at 509')
    signatures={(x['sourceId'],x['sourceCenterSeconds']) for x in shots}
    if len(signatures)!=30:raise ValueError('Repeated source time window detected')
    return shots,cuts

def input_filter(width,height,focus_x,focus_y,fps):
    if width<960 or height<540:raise ValueError('Reject source below 960x540')
    if fps<23.0:raise ValueError('Reject low native frame rate')
    x=float(focus_x);y=float(focus_y)
    if not 0<=x<=1 or not 0<=y<=1:raise ValueError('Focus point outside bounds')
    # Native pixel crop (not fake native 1080p). Focus is car centre coordinate.
    crop_w=min(width,int(height*9/16)//2*2)
    crop_h=min(height,int(width*16/9)//2*2)
    left=max(0,min(width-crop_w,round(x*width-crop_w/2)//2*2))
    top=max(0,min(height-crop_h,round(y*height-crop_h/2)//2*2))
    return (f'setpts=(PTS-STARTPTS)*{fps/30:.9f},fps=30,'
            f'crop={crop_w}:{crop_h}:{left}:{top},'
            'scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p'),(crop_w,crop_h,left,top)

def sample_frame(path,seconds):
    bytes_=command(['ffmpeg','-hide_banner','-loglevel','error','-ss',f'{seconds:.5f}',
                    '-i',str(path),'-frames:v','1','-vf','scale=270:480:flags=lanczos',
                    '-c:v','mjpeg','-f','image2pipe','-'],90)
    with Image.open(io.BytesIO(bytes_)) as im:return im.convert('RGB').copy()

def moving_score(a,b):
    from PIL import ImageStat
    aa=a.resize((72,128)).convert('L');bb=b.resize((72,128)).convert('L')
    return round(ImageStat.Stat(ImageChops.difference(aa,bb)).mean[0],3)

def render_one(shot,beat,dest,src_metadata):
    expected=int(beat['durationFrames'])+2*int(shot['transitionHandleFrames'])
    center=float(shot['sourceCenterSeconds'])
    fps=float(src_metadata['fps'])
    time_source=expected/fps
    start=center-time_source/2
    if start<0 or start+time_source+0.02>src_metadata['duration']:raise ValueError('Source excerpt outside media')
    filter_,rect=input_filter(src_metadata['width'],src_metadata['height'],shot['focusX'],shot['focusY'],fps)
    dest.parent.mkdir(parents=True,exist_ok=True)
    # Native source -> one high quality encode; more than enough FFmpeg remote HTTP seek window.
    command(['ffmpeg','-hide_banner','-loglevel','error','-nostdin',
        '-rw_timeout','40000000','-ss',f'{start:.6f}',
        '-i',shot['sourceUrl'],'-map','0:v:0','-an',
        '-vf',filter_,'-frames:v',str(expected),
        '-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',
        '-fps_mode','cfr','-video_track_timescale','30000',
        '-movflags','+faststart','-y',str(dest)],timeout=540)
    p=probe(dest)
    if (p['width'],p['height'],p['codec'],p['pix_fmt'])!=(1080,1920,'h264','yuv420p') or abs(p['fps']-30)>.001:
        raise ValueError('Video not H264 1080x1920 yuv420p CFR30')
    if p['frames']!=expected:raise ValueError(f'{p["frames"]} rendered frames vs {expected}')
    command(['ffmpeg','-v','error','-xerror','-i',str(dest),'-map','0:v:0','-f','null','-'],150)
    # Actual output mid, beginning, end frame check and a simple perceptual-motion metric.
    samples=[sample_frame(dest,t) for t in [2/30,(expected/2)/30,(expected-3)/30]]
    motion=[moving_score(samples[0],samples[1]),moving_score(samples[1],samples[2])]
    if max(motion)<1.25:raise ValueError('Output appears non-moving')
    sharpness=round(ImageStat.Stat(samples[1].filter(__import__('PIL.ImageFilter',fromlist=['FIND_EDGES']).FIND_EDGES).convert('L')).stddev[0],3)
    if sharpness<4:raise ValueError('Severe blur or blank frame detected')
    previews=dest.parent.parent/'preview'
    previews.mkdir(exist_ok=True)
    for idx,frame in enumerate(samples):
        frame.save(previews/f'slot-{shot["slot"]:02d}-{idx+1}.jpg',quality=92,subsampling=0)
    return {'slot':shot['slot'],'generation':shot['generation'],
        'sourceId':shot['sourceId'],'sourceUrl':shot['sourceUrl'],
        'sourcePageUrl':shot['sourcePageUrl'],'originCreator':shot['originCreator'],
        'sourceLicenseStatus':shot['sourceLicenseStatus'],
        'sourceTimeSeconds':center,'sourceInSeconds':round(start,5),'sourceOutSeconds':round(start+time_source,5),
        'nativeSource':src_metadata,'sourceMasterSha256':None,
        'sourceMasterSha256Status':'NOT_RETRIEVED_COMPLETE_SOURCE_STREAM',
        'sourceNativeCropPixels':{'width':rect[0],'height':rect[1],'left':rect[2],'top':rect[3]},
        'portraitSourceUpscaled':rect[0]<1080 or rect[1]<1920,
        'cameraSceneDescription':shot['angleAndMotion'],'sourceShotKey':shot['shotKey'],
        'outputFile':'clips/'+dest.name,'outputProbe':p,'outputBytes':dest.stat().st_size,
        'outputSha256':hash_file(dest),'frameCount':expected,
        'beatDurationFrames':beat['durationFrames'],
        'transitionHandleFramesEachSide':shot['transitionHandleFrames'],
        'motionDelta':motion,'edgeStdDev':sharpness,
        'fullDecode':'PASS','modelIdentity':'VISUALLY_PROVISIONAL_FROM_SOURCE_REVIEW',
        'verticalCropReview':'PENDING_FINAL_ALL_30_FRAME_QA'}

def render_generation(gen,config,beat,out):
    shots,cuts=source_clips(config,beat)
    scope=[(s,b) for s,b in zip(shots,cuts) if s['generation']==gen]
    if len(scope)!=GENERATIONS.count(gen):raise ValueError('Generation clip count incorrect')
    metadata={};reports=[];out.mkdir(parents=True,exist_ok=True)
    for shot,cut in scope:
        url=shot['sourceUrl']
        if url not in metadata:
            metadata[url]=probe(url)
            print('SOURCE_PROBE',gen,json.dumps(metadata[url]),flush=True)
        output=out/'clips'/f'{shot["slot"]:02d}_{gen}_Turbo.mp4'
        report=render_one(shot,cut,output,metadata[url])
        reports.append(report)
        print('RENDERED',shot['slot'],gen,report['outputBytes'],report['motionDelta'],flush=True)
    (out/f'qa-{gen}.json').write_text(json.dumps(reports,indent=2)+'\n')
    print('GENERATION_DONE',gen,len(reports),flush=True)

def assemble(config,beat,root,out):
    shots,cuts=source_clips(config,beat)
    out.mkdir(parents=True,exist_ok=True)
    results=[]
    for g in ['930','964','993','996','997','991','992']:
        r=root/f'qa-{g}.json'
        if not r.is_file():raise ValueError('Missing generation QA '+g)
        results.extend(json.loads(r.read_text()))
    results.sort(key=lambda x:x['slot'])
    if len(results)!=30 or [r['generation'] for r in results]!=GENERATIONS:
        raise ValueError('Not 30 complete slots in chronological order')
    pairs=set()
    sheet=Image.new('RGB',(270*6,510*5),'#101010')
    draw=ImageDraw.Draw(sheet)
    for index,(q,shot,cut) in enumerate(zip(results,shots,cuts)):
        if q['slot']!=index+1 or q['generation']!=shot['generation']:
            raise ValueError('QA slot order mismatch')
        file=root/q['outputFile']
        if not file.is_file() or file.stat().st_size!=q['outputBytes'] or hash_file(file)!=q['outputSha256']:
            raise ValueError('Clip missing/changed '+q['outputFile'])
        p=probe(file)
        if p['frames']!=cut['durationFrames']+shot['transitionHandleFrames']*2:raise ValueError('Wrong actual final length')
        key=(q['sourceId'],q['sourceTimeSeconds'])
        if key in pairs:raise ValueError('Repeated source scene assigned')
        pairs.add(key)
        # Additional in/mid/out visual motion proof generated by real decoder.
        imfile=root/'preview'/f'slot-{index+1:02d}-2.jpg'
        if not imfile.is_file():raise ValueError('Missing native visual proof')
        with Image.open(imfile) as im:tile=im.convert('RGB')
        x=(index%6)*270;y=(index//6)*510
        sheet.paste(tile,(x,y))
        draw.text((x+9,y+484),f'{index+1:02d} / {shot["generation"]}',fill='white')
    sheet.save(out/'contact-sheet.jpg',quality=94,subsampling=0)
    (out/'manifest.json').write_text(json.dumps({'schemaVersion':1,'project':'porsche-911-turbo-evolution-001',
        'totalClips':30,'totalBeatFrames':510,'fps':30,'width':1080,'height':1920,
        'clips':[{'slot':x['slot'],'generation':x['generation'],'videoFile':x['outputFile'],
                 'sourceUrl':x['sourceUrl'],'sourceTimestamp':x['sourceTimeSeconds'],
                 'durationBeatFrames':x['beatDurationFrames'],
                 'transitionHandleFramesEachSide':x['transitionHandleFramesEachSide'],
                 'sha256':x['outputSha256']} for x in results]},indent=2)+'\n')
    (out/'source-quality-report.json').write_text(json.dumps(results,indent=2)+'\n')
    lines=['# Source and Render QA','',
        '**Technical QA:** FFprobe verified 30 H.264 yuv420p 1080×1920 CFR30 files and exact beat+handles frame counts. Every clip fully decoded.',
        'All 30 source timecodes distinct and validated. Original native resolution/FPS disclosed per clip.',
        '**Visual QA:** All outputs include real sampled in/mid/out frames and non-zero motion/sharpness measurements.',
        '**Human model/crop and independent-camera signoff:** PENDING. Automated sampling cannot prove 30 unique camera rigs, complete vehicle silhouette or an authentic Turbo for every shot.',
        '**Rights:** Source access does not itself grant distribution permission. Ownership traced to Porsche AG; reuse permission unverified.',
        '**Source SHA:** The full remote master files were not downloaded, so whole-master SHA-256 is accurately reported as unavailable; every rendered MP4 has an actual SHA256.',
        'No logos, text, captions or music were added by our processing. Some original Porsche footage may contain embedded editorial elements.',
        'All clips encoded directly from original video at x264 CRF16 slow; horizontal 1080p sources require declared portrait crop upscaling.',
        '',
        '## Generation counts','']
    for g in ['930','964','993','996','997','991','992']:
        lines.append(f'- {g}: {GENERATIONS.count(g)} / {GENERATIONS.count(g)} output videos technically decoded')
    (out/'QA_REPORT.md').write_text('\n'.join(lines)+'\n')
    (out/'README.md').write_text(
        '# Porsche 911 Turbo Evolution — Import for Agent D\n\n'
        'Extract clips/ to the project media directory. Each numbered clip corresponds to the identical beat-map.json slot, chronological 930→964→993→996→997→991→992.\n'
        'All clips are 1080×1920 30fps H264 CRF16 with silent audio and four transition-handle frames at each end.\n'
        'Use the manifest to trim handles and sync each beat. No global user soundtrack included.\n'
        'Master source licensing and final shot identity/crop review must be signed off separately before release.\n')
    target=out/NAME
    if target.exists():raise ValueError('Refuse existing finished filename without clean rebuild')
    members=[root/q['outputFile'] for q in results]
    with zipfile.ZipFile(target,'w',allowZip64=True) as archive:
        for clip in members:archive.write(clip,'clips/'+clip.name,compress_type=zipfile.ZIP_STORED)
        for filename in ['manifest.json','source-quality-report.json','contact-sheet.jpg','QA_REPORT.md','README.md']:
            archive.write(out/filename,filename,compress_type=zipfile.ZIP_STORED)
    with zipfile.ZipFile(target,'r') as archive:
        names=archive.namelist()
        if len(names)!=35 or len(set(names))!=35 or archive.testzip() is not None:raise ValueError('Bad ZIP member count, duplicate or CRC')
        for q in results:
            if hashlib.sha256(archive.read(q['outputFile'])).hexdigest()!=q['outputSha256']:
                raise ValueError('ZIP member differs from generated media: '+q['outputFile'])
    result={'status':'TECHNICAL_QA_PASS_FINAL_VISUAL_SIGNOFF_PENDING','finalFilename':NAME,
        'zipBytes':target.stat().st_size,'zipSha256':hash_file(target),
        'clips':30,'generations':dict(collections.Counter(x['generation'] for x in results)),
        'testZip':'PASS','allVideoDecodes':'PASS','sourceLicense':'UNVERIFIED','humanVisualReview':'PENDING'}
    (out/'zip-proof.json').write_text(json.dumps(result,indent=2)+'\n')
    print('ONE_ZIP_DELIVERY_PROOF',json.dumps(result,indent=2),flush=True)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--mode',choices=('render','assemble'),required=True)
    p.add_argument('--generation',choices=sorted(set(GENERATIONS)))
    p.add_argument('--selections',type=Path,required=True)
    p.add_argument('--beat-map',type=Path,required=True)
    p.add_argument('--input-root',type=Path)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    plan=json.loads(a.selections.read_text());beat=json.loads(a.beat_map.read_text())
    if a.mode=='render':
        if not a.generation:p.error('--generation required')
        render_generation(a.generation,plan,beat,a.output)
    else:
        if not a.input_root:p.error('--input-root required')
        assemble(plan,beat,a.input_root,a.output)

if __name__=='__main__':
    main()
