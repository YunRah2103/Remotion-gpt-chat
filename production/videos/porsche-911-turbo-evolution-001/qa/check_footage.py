#!/usr/bin/env python3
"""Independent audit of thirty locally staged REAL Porsche footage clips.

Never infer Porsche identity or camera uniqueness from metadata alone. FFmpeg
must decode actual moving sources. Every close-match is flagged for human QA.
"""
import argparse,json,subprocess,sys
from pathlib import Path

def command(*args):
    return subprocess.run(args,capture_output=True,check=True).stdout

def sample(path,second):
    raw=command('ffmpeg','-v','error','-ss',str(second),'-i',str(path),'-map','0:v:0',
        '-frames:v','1','-vf','scale=48:48:flags=area,format=gray',
        '-f','rawvideo','-pix_fmt','gray','-')
    if len(raw)!=2304:raise ValueError('Unable to decode actual source frame: '+str(path))
    return raw

def difference(a,b):
    return round(sum(abs(x-y) for x,y in zip(a,b))/len(a),3)

def run(manifest,media):
    shots=json.loads(Path(manifest).read_text())['shots']
    if len(shots)!=30:raise ValueError('Exactly 30 real moving clips required')
    root=Path(media).resolve()
    result={'status':'PASS_TECHNICAL_ONLY','reviewed':0,'failures':[],'warnings':[],
        'shots':[],'humanVerification':'REQUIRED: actual Turbo identity, source rights, unique camera setups, grade quality'}
    seen={}
    for sh in shots:
        slot=sh['slot']; generation=sh['generation']
        record={'slot':slot,'era':generation,'status':'PENDING','resolution':None,
            'motionMad':None,'duplicateCandidates':[]}
        result['shots'].append(record)
        file=sh.get('localFile') or sh.get('file') or f'slot-{slot:02}.mp4'
        path=(root/file).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            result['failures'].append(f'{slot:02} {generation}: missing safe staged real source: {file}')
            continue
        try:
            data=json.loads(command('ffprobe','-v','error','-select_streams','v:0',
                '-show_entries','stream=width,height,avg_frame_rate,bit_rate:format=duration',
                '-of','json',str(path)))
            stream=data['streams'][0]; duration=float(data['format']['duration'])
            w,h=int(stream['width']),int(stream['height'])
            record['resolution']=[w,h]
            if duration<.5:raise ValueError('Too short for a whole beat')
            if min(w,h)<360:raise ValueError('Insufficient actual source dimensions')
            if h<1080 and w<1920:
                result['warnings'].append(f'{slot:02}: low original pixels, require preserved SD/panel composition')
            if sh.get('verifiedMovingVideo') is not True or sh.get('uniqueAngleVerified') is not True:
                result['failures'].append(f'{slot:02}: motion or unique camera NOT approved by Agent A')
            a=sample(path,.08);b=sample(path,min(duration-.05,.32));c=sample(path,min(duration-.03,.46))
            motion=max(difference(a,b),difference(b,c))
            record['motionMad']=motion
            if motion<1.5:result['failures'].append(f'{slot:02}: static/frozen detected (MAD < 1.5)')
            for prev,thumb in seen.items():
                if difference(b,thumb)<2.25:record['duplicateCandidates'].append(prev)
            seen[slot]=b
            if record['duplicateCandidates']:
                result['warnings'].append(f'{slot:02}: similar camera to {record["duplicateCandidates"]}, visual inspection required')
            record['status']='TESTED_TECHNICAL'
            result['reviewed']+=1
        except (OSError,subprocess.CalledProcessError,ValueError,KeyError,IndexError) as e:
            result['failures'].append(f'{slot:02}: real video decode failed: {str(e)[:140]}')
    if result['failures']:result['status']='BLOCKED'
    return result

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('manifest');a.add_argument('--media-dir',required=True)
    a.add_argument('--output',default=None);opt=a.parse_args()
    try:result=run(opt.manifest,opt.media_dir)
    except (ValueError,KeyError,OSError) as e:result={'status':'BLOCKED','failures':[str(e)]}
    data=json.dumps(result,indent=2)+'\n'
    if opt.output:Path(opt.output).write_text(data)
    print(data)
    sys.exit(0 if result['status']=='PASS_TECHNICAL_ONLY' else 2)
