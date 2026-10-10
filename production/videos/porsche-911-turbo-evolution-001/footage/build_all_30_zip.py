#!/usr/bin/env python3
"""Build exactly ONE verified Porsche 911 Turbo evolution ZIP.

Strict gate: refuses missing, duplicate, questionable, unreviewed or low-quality
shots, wrong Turbo generations, undersized original sources and bad output media.
MP4s use a single x264 encode; ZIP_STORED adds no further compression.
The source videos are never uploaded to public git history.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import math
import shutil
import subprocess
import tempfile
import zipfile
from collections import Counter
from fractions import Fraction
from pathlib import Path

from PIL import Image, ImageDraw, ImageChops, ImageStat

TARGET_ZIP = "PORSCHE_911_TURBO_EVOLUTION_ALL_30_CLIPS_1080P.zip"
GENERATIONS = ['930']*4+['964']*4+['993']*4+['996']*4+['997']*4+['991']*5+['992']*5
SOURCE_REQUIRED = ('sourceId','sourceUrl','originCreator','localPath','shotKey',
                   'angleAndMotion','actualTurboIdentityEvidence','sourceLicenseStatus')
CROP_REQUIRED = ('focusX','focusY')
REVIEW_REQUIRED = ('verifiedMovingVideo','uniqueAngleVerified','verifiedTurboCoupe',
                   'cropManuallyReviewed')

def sha(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for part in iter(lambda:f.read(1<<20),b''): h.update(part)
    return h.hexdigest()

def call(args,timeout=180):
    return subprocess.run(args,check=True,capture_output=True,timeout=timeout)

def ffprobe(path:Path):
    v=json.loads(call(['ffprobe','-v','error','-show_streams','-show_format',
                       '-of','json',str(path)],60).stdout)
    stream=next((x for x in v['streams'] if x['codec_type']=='video'),None)
    if not stream: raise ValueError('video stream missing')
    return {'width':int(stream['width']),'height':int(stream['height']),
            'fps':float(Fraction(stream['avg_frame_rate'])),
            'codec':stream['codec_name'],'pixelFormat':stream.get('pix_fmt'),
            'videoFrames':int(stream.get('nb_frames') or 0),
            'seconds':float(v['format']['duration']),
            'bitrate':int(v['format'].get('bit_rate') or 0)}

def safe_path(root:Path, relative:str):
    if not isinstance(relative,str) or not relative or Path(relative).is_absolute():
        raise ValueError('Invalid relative source path')
    result=(root / relative).resolve()
    if not result.is_relative_to(root.resolve()) or not result.is_file():
        raise ValueError('Original media not present under source directory')
    return result

def check_manifest(data, beatmap):
    shots=data.get('shots')
    cuts=beatmap.get('cuts')
    if not isinstance(shots,list) or len(shots)!=30 or not isinstance(cuts,list) or len(cuts)!=30:
        raise ValueError('Exactly 30 real Porsche shots and 30 beat slots required')
    if beatmap.get('output',{}).get('frames')!=510:
        raise ValueError('Beat map must be exactly 510 frames')
    keys=set(); reviews=set(); source_ranges={}; total=0
    for idx,(shot,beat) in enumerate(zip(shots,cuts),1):
        g=GENERATIONS[idx-1]
        if shot.get('slot')!=idx or beat.get('slot')!=idx or shot.get('generation')!=g or beat.get('generation')!=g:
            raise ValueError(f'Slot {idx} generation/order mismatch')
        if beat['endFrame']-beat['startFrame']+1!=beat['durationFrames'] or beat['startFrame']!=total:
            raise ValueError(f'Slot {idx} beat continuity/length mismatch')
        total+=beat['durationFrames']
        for k in SOURCE_REQUIRED+CROP_REQUIRED:
            if shot.get(k) in (None,''):raise ValueError(f'Slot {idx} missing {k}')
        for k in REVIEW_REQUIRED:
            if shot.get(k) is not True:raise ValueError(f'Slot {idx} failed mandatory manual QA: {k}')
        if not shot.get('humanReviewer') or not shot.get('reviewedAt'):
            raise ValueError(f'Slot {idx}: signed human 911 Turbo/camera/crop review missing')
        key=shot['shotKey']
        if key in keys:raise ValueError('Repeated camera/scene shotKey: '+str(key))
        keys.add(key)
        camera=shot.get('independentCameraSetupId')
        if not camera or camera in reviews:
            raise ValueError(f'Slot {idx}: reused or unknown independent camera setup')
        reviews.add(camera)
        x,y=float(shot['focusX']),float(shot['focusY'])
        if not all(math.isfinite(z) and 0<=z<=1 for z in (x,y)):
            raise ValueError(f'Slot {idx}: focusX/Y must be 0..1')
        start,end=float(shot.get('sourceInSeconds',-1)),float(shot.get('sourceOutSeconds',-1))
        if not math.isfinite(start) or not math.isfinite(end) or start<0 or end<=start:
            raise ValueError(f'Slot {idx}: invalid source timecodes')
        if not isinstance(shot.get('sha256'),str) or len(shot['sha256'])!=64:
            raise ValueError(f'Slot {idx}: original source SHA256 required')
        # Source file can be re-used for different independent camera setups,
        # but not the same or overlapping source timeline interval.
        for lo,hi,prior in source_ranges.get(shot['sha256'],[]):
            if min(hi,end)-max(lo,start)>0.025:
                raise ValueError(f'Slots {prior}/{idx} overlap the same original source interval')
        source_ranges.setdefault(shot['sha256'],[]).append((start,end,idx))
        if str(shot['sourceLicenseStatus']).lower() in ('licensed','cleared') and not shot.get('licenseEvidence'):
            raise ValueError('Cannot invent a cleared media licence')
        if int(shot.get('handleFrames',4))<0 or int(shot.get('handleFrames',4))>12:
            raise ValueError('Unsupported transition handle length')
    if total!=510:raise ValueError('Total source beats must equal 510 frames')
    return {'slots':len(shots),'frames':total,'generations':Counter(GENERATIONS),
            'identityAndDistinctCameraReview':'SIGNED_BY_HUMAN_IN_MANIFEST'}

def crop_filter(probe, x, y):
    sw,sh=probe['width'],probe['height']
    # Native 9:16 crop preserves original pixels; old SD sources can use
    # blurred same-source moving continuation instead of excessive zoom.
    width=int((sh*9/16)//2)*2
    if width>sw:
        height=int((sw*16/9)//2)*2
        y0=int(max(0,min(sh-height,round(y*(sh-height))//2*2)))
        return f'crop={sw}:{height}:0:{y0},scale=1080:1920:flags=lanczos'
    x0=int(max(0,min(sw-width,round(x*(sw-width))//2*2)))
    return f'crop={width}:{sh}:{x0}:0,scale=1080:1920:flags=lanczos'

def render_one(shot, beat, root, output):
    inputfile=safe_path(root,shot['localPath'])
    prob=ffprobe(inputfile)
    if prob['width']<640 or prob['height']<360 or prob['fps']<20:
        raise ValueError(f"Bad source quality: {inputfile.name}")
    actualsha=sha(inputfile)
    if actualsha!=shot['sha256']:raise ValueError('Original source SHA256 mismatch')
    if abs(prob['width']-int(shot['width'])) or abs(prob['height']-int(shot['height'])):
        raise ValueError('Declared source resolution is not genuine')
    if abs(prob['fps']-float(shot['fps']))>.05:
        raise ValueError('Declared source fps mismatch')
    handle=int(shot.get('handleFrames',4))
    count=int(beat['durationFrames'])+2*handle
    # The source must provide enough unique native frames, accounting for
    # 25fps originals retimed to 30fps (1.2x speed) rather than duplicated.
    need=count/prob['fps']
    start=float(shot['sourceInSeconds'])
    end=float(shot['sourceOutSeconds'])
    if end-start<need+.015 or end>prob['seconds']+.015:
        raise ValueError(f"Source {inputfile.name} too short for unique {count} frames")
    filter_expr=(f'setpts=(PTS-STARTPTS)*{prob["fps"]/30:.8f},'
                 +crop_filter(prob,float(shot['focusX']),float(shot['focusY']))
                 +',fps=30,setsar=1,format=yuv420p')
    # -ss before input, no intermediate files; one x264 CRF 16 encode.
    command=['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-ss',f'{start:.6f}',
             '-i',str(inputfile),'-vf',filter_expr,'-frames:v',str(count),
             '-an','-c:v','libx264','-preset','slow','-crf','16','-pix_fmt','yuv420p',
             '-fps_mode','cfr','-video_track_timescale','30000','-movflags','+faststart',
             '-y',str(output)]
    call(command,360)
    result=ffprobe(output)
    if (result['width'],result['height'],result['codec'],result['pixelFormat']) != (1080,1920,'h264','yuv420p'):
        raise ValueError('Rendered video dimensions, codec or format wrong')
    if abs(result['fps']-30)>.001 or result['videoFrames']!=count:
        raise ValueError(f"Rendered beat {beat['slot']} FPS/frames mismatch {result}")
    call(['ffmpeg','-hide_banner','-v','error','-xerror','-i',str(output),'-f','null','-'],180)
    return {'sourceFile':shot['localPath'],'sourceSha256':actualsha,
            'sourceWidth':prob['width'],'sourceHeight':prob['height'],'sourceFps':prob['fps'],
            'nativeSourceResolution':f"{prob['width']}x{prob['height']}",
            'clipFile':output.name,'clipSha256':sha(output),'clipBytes':output.stat().st_size,
            'clipVideo':result,'beatDurationFrames':beat['durationFrames'],
            'transitionHandleFramesEachSide':handle,'clipTotalFrames':count,
            'sourceSeconds':start,'sourceUrl':shot['sourceUrl'],'humanReviewer':shot['humanReviewer']}

def sample_gray(path,t):
    b=call(['ffmpeg','-hide_banner','-loglevel','error','-ss',f'{t:.5f}','-i',str(path),
            '-frames:v','1','-vf','scale=64:112:flags=area,format=gray',
            '-f','rawvideo','-'],60).stdout
    if len(b)!=64*112:raise ValueError('Cannot inspect moving output frame')
    return b

def motion_check(path, frames):
    # temporal difference is a necessary but insufficient condition
    times=[max(0.02,min((frames-1)/30-.02,t)) for t in (.08,frames/60,(frames-2)/30)]
    samples=[sample_gray(path,t) for t in times]
    diffs=[sum(abs(a-b) for a,b in zip(samples[i],samples[i+1]))/len(samples[i])
           for i in range(2)]
    if max(diffs)<1.5:raise ValueError(f"Frozen frame or negligible real visible motion: {path.name}")
    return [round(v,3) for v in diffs]

def contact_sheet(files,path):
    sheet=Image.new('RGB',(400*5,740*6),'#101010')
    draw=ImageDraw.Draw(sheet)
    for n,(name,clip) in enumerate(files):
        imbytes=call(['ffmpeg','-hide_banner','-loglevel','error','-ss','0.28','-i',
                     str(clip),'-frames:v','1','-vf','scale=400:711:flags=lanczos',
                     '-f','image2pipe','-c:v','mjpeg','-'],90).stdout
        tile=Image.open(io.BytesIO(imbytes)).convert('RGB')
        x=(n%5)*400;y=(n//5)*740
        sheet.paste(tile,(x,y))
        draw.text((x+10,y+716),name,fill='white')
    sheet.save(path,quality=94,subsampling=0)

def build(manifest,beats,root,dest):
    validated=check_manifest(manifest,beats)
    dest.mkdir(parents=True,exist_ok=True)
    target=dest/TARGET_ZIP
    if target.exists():raise FileExistsError('Refusing to overwrite existing final ZIP')
    with tempfile.TemporaryDirectory(prefix='porsche-build-') as temp:
        workspace=Path(temp)
        clips=workspace/'clips'
        clips.mkdir()
        reports=[];filelist=[];published=[]
        for shot,beat in zip(manifest['shots'],beats['cuts']):
            name=f"{shot['slot']:02d}_{shot['generation']}_turbo.mp4"
            output=clips/name
            data=render_one(shot,beat,root,output)
            data['motionSamples']=motion_check(output,data['clipTotalFrames'])
            reports.append(data)
            published.append((name,output))
            filelist.append({'slot':shot['slot'],'generation':shot['generation'],
                             'file':'clips/'+name,'beatStartFrame':beat['startFrame'],
                             'beatFrames':beat['durationFrames'],
                             'transitionHandleFrames':data['transitionHandleFramesEachSide'],
                             'originalSourceUrl':shot['sourceUrl'],
                             'cameraSetupId':shot['independentCameraSetupId'],
                             'sourceInSeconds':shot['sourceInSeconds'],
                             'sourceOutSeconds':shot['sourceOutSeconds'],
                             'sourceSha256':shot['sha256'],
                             'originalWidth':shot['width'],'originalHeight':shot['height'],
                             'originalFps':shot['fps'],'licenseStatus':shot['sourceLicenseStatus'],
                             'verifiedIdentityEvidence':shot['actualTurboIdentityEvidence'],
                             'sourceMotionDescription':shot['angleAndMotion'],
                             'outputSha256':data['clipSha256']})
        contact_sheet(published,workspace/'contact-sheet.jpg')
        (workspace/'manifest.json').write_text(json.dumps(
            {'schemaVersion':1,'film':'porsche-911-turbo-evolution-001',
             'clipCount':30,'frames':510,'fps':30,'clips':filelist},indent=2)+'\n')
        (workspace/'source-quality-report.json').write_text(json.dumps(reports,indent=2)+'\n')
        qa=[
            '# Porsche 911 Turbo Evolution — Final Clip QA',
            '', '30/30 verified output videos; all original media hashes checked.',
            'Native original source resolutions and genuine camera setups are recorded per shot.',
            'All 30: ffprobe 1080 × 1920 / 30fps CFR / H264 yuv420p, full FFmpeg decode, temporal motion checks.',
            'FFmpeg crop/retime performed in one x264 CRF16 slow encode; no separate compressed intermediates.',
            'Camera/model/crop signoff was recorded in the source manifest; automated pixel motion cannot authenticate model.',
            'Source reuse and overlapping intervals rejected. Stream-level 25→30 conversion uses 1.2× PTS speed',
            'rather than duplicating 25fps source frames to fill 30fps frames.',
            'Source licences are recorded as provided; this artifact itself does not confer publication rights.',
            '', 'Generated from strict 30-slot manifest and original music beat map.',
            ]
        (workspace/'QA_REPORT.md').write_text('\n'.join(qa)+'\n')
        (workspace/'README.md').write_text(
            '# Agent D Import\n\n'
            'This ZIP contains exactly 30 chronological Porsche 911 Turbo MP4s in clips/ plus manifests and QA.\n'
            'Each clip runs beatDurationFrames plus transitionHandleFrames on BOTH sides at 30fps.\n'
            'Place original clips into the Porsche evolution footage directory, do not edit generation codes.\n'
            'Before final delivery validate original source/licensing and provide private audio separately.\n'
            'Do not rescale or recompress the footage more than the final film pass requires.\n')
        files=sorted(workspace.rglob('*'))
        with zipfile.ZipFile(target,'w',allowZip64=True) as archive:
            for file in files:
                if not file.is_file():continue
                arc=file.relative_to(workspace).as_posix()
                archive.write(file,arc,compress_type=zipfile.ZIP_STORED)
        with zipfile.ZipFile(target,'r') as archive:
            if archive.testzip() is not None:raise ValueError('ZIP CRC/integrity failed')
            members=set(archive.namelist())
            expected={'clips/'+name for name,_ in published}
            expected|={'manifest.json','source-quality-report.json','contact-sheet.jpg',
                       'QA_REPORT.md','README.md'}
            if members!=expected:raise ValueError('ZIP exact 35-file manifest mismatch')
            for name,src in published:
                if hashlib.sha256(archive.read('clips/'+name)).hexdigest()!=sha(src):
                    raise ValueError('ZIP member SHA mismatch')
        result={'status':'PASS','zipName':target.name,'zipBytes':target.stat().st_size,
                'zipSha256':sha(target),'clipCount':len(published),
                'totalBeatFrames':510,'allVideoDecodes':'PASS','zipIntegrity':'PASS'}
        (dest/'zip-delivery-proof.json').write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps(result,indent=2))
        return result

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest',type=Path,required=True)
    p.add_argument('--beat-map',type=Path,required=True)
    p.add_argument('--sources',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--validate-only',action='store_true')
    a=p.parse_args()
    data=json.loads(a.manifest.read_text())
    beat=json.loads(a.beat_map.read_text())
    if a.validate_only:
        print(json.dumps(check_manifest(data,beat),indent=2,default=list))
        return 0
    build(data,beat,a.sources.resolve(),a.output)
    return 0

if __name__=='__main__':
    raise SystemExit(main())
