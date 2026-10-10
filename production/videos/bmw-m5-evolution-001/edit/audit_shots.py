#!/usr/bin/env python3
"""Independent real-media audit for Agent C's PRIVATE 42-shot edit.

Usage:
 python production/videos/bmw-m5-evolution-001/edit/audit_shots.py \
   --manifest /private/approved-render-shots.json \
   --public-root /private/remotion-public \
   --report /private/m5-shot-report.json

Does NOT source footage, verify M5 identity, listen to copyrighted audio or
certify publishing rights. It DOES probe real media, verify SHA, frame
range, temporal motion and flag visual near-repeats for manual inspection.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

BASE = Path(__file__).resolve().parents[1]
BEATS = json.loads((BASE / 'beat-map.json').read_text())['cuts']
GEN = ['E28','E34','E39','E60','F10','F90','G90']
DOWNSAMPLE = 112 * 64

def probe(path):
    data = json.loads(subprocess.check_output(
        ['ffprobe','-v','error','-show_entries',
         'stream=codec_type,width,height,r_frame_rate:format=duration',
         '-of','json',str(path)], stderr=subprocess.STDOUT))
    videos = [s for s in data.get('streams',[]) if s['codec_type']=='video']
    if not videos:
        raise ValueError('No video stream: ' + str(path))
    return videos[0], float(data.get('format',{}).get('duration',0))

def thumb(path, when):
    raw = subprocess.check_output([
        'ffmpeg','-nostdin','-v','error','-ss',f'{when:.4f}','-i',str(path),
        '-an','-frames:v','1','-vf','scale=112:64,format=gray',
        '-f','rawvideo','-pix_fmt','gray','pipe:1'
    ], stderr=subprocess.STDOUT)
    if len(raw) != DOWNSAMPLE:
        raise ValueError(f'Cannot decode sample from {path}: {len(raw)} bytes')
    return raw

def mean_delta(a,b):
    return sum(abs(x-y) for x,y in zip(a,b)) / len(a)

def sha256(path):
    result = hashlib.sha256()
    with open(path,'rb') as stream:
        for block in iter(lambda:stream.read(2*1024*1024),b''):
            result.update(block)
    return result.hexdigest()

def run(manifest, public_root):
    shots = json.loads(Path(manifest).read_text())
    if isinstance(shots,dict):
        shots = shots.get('shots',[])
    if len(shots) != 42 or len({r.get('slot') for r in shots})!=42:
        raise ValueError('Exactly 42 unique slot records are required')
    report = {'status':'review','frames':552,'fps':30,'shots':[],
              'warnings':[],'blockers':[]}
    keys = set()
    fingerprints = set()
    cache = {}
    mids = {}
    for slot in range(1,43):
        row = next(r for r in shots if r.get('slot') == slot)
        beat = BEATS[slot-1]
        expected_gen = GEN[(slot-1)//6]
        if row.get('generation') != expected_gen or (
            row.get('identityVerified') is not True or row.get('actualMotionVerified') is not True):
            report['blockers'].append(f'{slot}: unverified or wrong-generation M5')
            continue
        key = row.get('shotKey')
        fingerprint = row.get('visualFingerprint')
        if not key or not fingerprint or key in keys or fingerprint in fingerprints:
            report['blockers'].append(f'{slot}: duplicate/unidentified actual camera setup')
            continue
        keys.add(key); fingerprints.add(fingerprint)
        file = row.get('file','')
        if (not isinstance(file,str) or not file or
            Path(file).is_absolute() or '..' in Path(file).parts):
            report['blockers'].append(f'{slot}: invalid file path')
            continue
        path = (public_root/file).resolve()
        if not path.is_relative_to(public_root.resolve()) or not path.is_file():
            report['blockers'].append(f'{slot}: source file missing')
            continue
        try:
            if str(path) not in cache:
                stream, total = probe(path)
                cache[str(path)] = (stream,total,sha256(path))
            stream,total,digest = cache[str(path)]
            start = float(row['inSeconds'])
            dur = beat['durationFrames']/30
            if start < 0 or start+dur > total + 1/60:
                raise ValueError('source time range beyond media duration')
            if stream.get('width',0)<480 or stream.get('height',0)<360:
                raise ValueError('source is below minimum source dimensions')
            if row.get('sourceSha256','').lower()!=digest:
                raise ValueError('media content SHA256 does not match declaration')
            first=thumb(path,start + min(.045,dur*.13))
            middle=thumb(path,start + dur*.54)
            last=thumb(path,start + dur*.85)
            motion=round((mean_delta(first,middle)+mean_delta(middle,last))/2,3)
            if motion < 1.6:
                report['warnings'].append(f'{slot}: weak source motion, delta={motion}')
            if int(stream['width']) < 3200 and int(stream['width']) > int(stream['height']):
                report['warnings'].append(f'{slot}: landscape <3200px: use editorial framing, avoid hard portrait upscale')
            mids[slot]=middle
            report['shots'].append({'slot':slot,'generation':expected_gen,
                'file':file,'sourceSize':[int(stream['width']),int(stream['height'])],
                'verifiedFileSha256':digest,'motionDelta':motion,
                'sourceInSeconds':start,'editFrames':beat['durationFrames']})
        except (ValueError,KeyError,subprocess.CalledProcessError,OSError) as err:
            report['blockers'].append(f'{slot}: media decode/probe failure: {err}')
    for a in range(1,43):
        if a not in mids:
            continue
        for b in range(a+1,43):
            if b not in mids:
                continue
            # Close raw-frame similarity is a flag, NOT semantic recognition
            # of a car/camera. Human contact-sheet review remains mandatory.
            delta = mean_delta(mids[a],mids[b])
            if delta < 4.3:
                report['warnings'].append(f'{a} vs {b}: likely visually repeated shot (delta={delta:.2f})')
    if len(report['shots']) !=42:
        report['blockers'].append(f"Only {len(report['shots'])}/42 media shots passed ffprobe/decode")
    report['status'] = 'blocked' if report['blockers'] else 'review'
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--manifest',required=True,type=Path)
    p.add_argument('--public-root',required=True,type=Path)
    p.add_argument('--report',required=True,type=Path)
    a=p.parse_args()
    data=run(a.manifest,a.public_root)
    a.report.parent.mkdir(parents=True,exist_ok=True)
    a.report.write_text(json.dumps(data,indent=2))
    print(json.dumps({'status':data['status'],'checked':len(data['shots']),
                      'blockers':len(data['blockers']),
                      'warnings':len(data['warnings']),
                      'report':str(a.report)}))
    sys.exit(1 if data['blockers'] else 0)
