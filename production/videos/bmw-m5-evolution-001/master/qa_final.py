#!/usr/bin/env python3
"""Verify actual final M5 MP4. Technical checks do NOT replace full visual review."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys


def command(args):
    return subprocess.run(args,capture_output=True,text=True,check=True)


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('mp4')
    ap.add_argument('--report',default=None)
    args=ap.parse_args()
    p=Path(args.mp4)
    if not p.is_file():
        raise SystemExit(f'No rendered MP4: {p}')
    info=json.loads(command(['ffprobe','-v','error','-count_frames','-show_entries',
      'stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,nb_read_frames,sample_rate,channels,pix_fmt:format=duration',
      '-of','json',str(p)]).stdout)
    errors=[]
    videos=[x for x in info['streams'] if x['codec_type']=='video']
    audios=[x for x in info['streams'] if x['codec_type']=='audio']
    if len(videos)!=1 or len(audios)!=1:
        errors.append('Expected one video stream and one audio stream')
    else:
        v,a=videos[0],audios[0]
        for key,value in (('codec_name','h264'),('width',1080),('height',1920),('nb_read_frames','552'),('r_frame_rate','30/1'),('pix_fmt','yuv420p')):
            if v.get(key)!=value: errors.append(f'video {key} expected {value}, got {v.get(key)}')
        if a.get('codec_name')!='aac' or a.get('sample_rate')!='48000' or a.get('channels')!=2:
            errors.append('Expected stereo AAC 48kHz stream')
    if abs(float(info['format']['duration'])-18.4)>.04:
        errors.append('Total duration differs from 18.4s')
    decode=command(['ffmpeg','-hide_banner','-v','error','-xerror','-i',str(p),'-f','null','-'])
    if decode.stderr.strip(): errors.append('Full decoder emitted errors: '+decode.stderr[:1000])
    with p.open('rb') as fp:
        digest=hashlib.file_digest(fp,'sha256').hexdigest()
    report={'status':'PASS_TECHNICAL_ONLY' if not errors else 'FAIL','errors':errors,'sha256':digest,
      'bytes':p.stat().st_size,'ffprobe':info,'limitations':['Cannot authenticate vehicles or prove 42 source angles without full independent visual inspection',
      'Final release also requires rights review and no unauthorized public upload']}
    if args.report: Path(args.report).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    return 2 if errors else 0

if __name__=='__main__':sys.exit(main())
