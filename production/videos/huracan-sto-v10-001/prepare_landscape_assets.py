#!/usr/bin/env python3
"""Build STO landscape candidate from SHA-verified publisher-original videos.

Use two user ZIPs locally:
  python prepare_landscape_assets.py --zip HURACAN_STO_LANDSCAPE_FOOTAGE.zip \
    --night-zip HURACAN_STO_AGENT_B_NIGHT_CINEMATIC_SOURCE.zip
Or use a single combined archive with sources/<source name>.mp4 for all four.

Note original FORMAT67 video is 1920x810, NOT native 1920x1080.
This editor UNIFORMLY enlarges 1.333x and crops horizontally to 16:9;
there is no anamorphic stretching, never claim native Full HD pixels.
No permission, visual identity or unique-moving-camera approval is conferred.
"""
import argparse, hashlib, json, subprocess, tempfile, zipfile
from pathlib import Path

HERE=Path(__file__).resolve().parent
MAP=json.loads((HERE/'shot-map-landscape.json').read_text())
ROOT=HERE.parents[2]

def command(args):
 p=subprocess.run(args,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[-2000:])
 return p.stdout

def find_original(z, name):
 paths=('sources/'+name+'.mp4',name+'.mp4')
 for entry in paths:
  if entry in z.namelist():return z.read(entry)
 raise KeyError(name)

def main():
 a=argparse.ArgumentParser()
 a.add_argument('--zip',required=True,help='Agent A landscape ZIP, or combined sources ZIP')
 a.add_argument('--night-zip',help='Additional user FORMAT67 landscape ZIP (original 1920x810)')
 a.add_argument('--out',default=str(ROOT/'public'/'sto-v10'))
 a.add_argument('--validate-only',action='store_true')
 opts=a.parse_args()
 target=Path(opts.out)
 if not opts.validate_only:target.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(opts.zip) as common,tempfile.TemporaryDirectory() as d:
  night=zipfile.ZipFile(opts.night_zip) if opts.night_zip else None
  try:
   source_paths={}
   for name,meta in MAP['sourceFiles'].items():
    try:payload=find_original(common,name)
    except KeyError:
     if night is None:raise RuntimeError('Missing source '+name+'; provide --night-zip')
     payload=find_original(night,name)
    sha=hashlib.sha256(payload).hexdigest()
    if sha!=meta['sha256']:raise RuntimeError('SOURCE_BYTES_MISMATCH '+name)
    src=Path(d)/(name+'.mp4')
    src.write_bytes(payload);source_paths[name]=src
    probe=json.loads(command(['ffprobe','-v','error','-show_entries','stream=codec_type,width,height','-of','json',str(src)]))
    video=next(x for x in probe['streams'] if x['codec_type']=='video')
    if (video['width'],video['height'])!=(meta['width'],meta['height']):raise RuntimeError('NATIVE_SOURCE_DIMENSION_MISMATCH '+name)
    print('VERIFIED_SOURCE',name,f"{meta['width']}x{meta['height']}",sha,flush=True)
   if opts.validate_only:
    print('SOURCE_BYTES_INTEGRITY_PASS',len(source_paths));return
   for shot in MAP['shots']:
    name=shot['sourceOriginal'][:-4];meta=MAP['sourceFiles'][name];src=source_paths[name]
    count=shot['endFrameExclusive']-shot['startFrame']
    duration=count/30
    if (meta['width'],meta['height'])==(1920,1080):
     vf='fps=30,setsar=1,format=yuv420p'
    elif (meta['width'],meta['height'])==(1920,810):
     crop=int(round(640*shot['sourceCropX']))
     if crop<0 or crop>640:raise RuntimeError('bad crop origin for '+shot['id'])
     vf=f'fps=30,scale=2560:1080:flags=lanczos,crop=1920:1080:{crop}:0,setsar=1,format=yuv420p'
    else:raise RuntimeError('Unapproved source aspect geometry '+name)
    out=target/shot['file']
    command(['ffmpeg','-hide_banner','-loglevel','error','-ss',str(shot['sourceStartSeconds']),
     '-i',str(src),'-t',str(duration+.08),'-vf',vf,'-an','-c:v','libx264','-preset','medium','-crf','16',
     '-pix_fmt','yuv420p','-frames:v',str(count),'-movflags','+faststart','-y',str(out)])
    probe=json.loads(command(['ffprobe','-v','error','-select_streams','v:0','-count_frames',
     '-show_entries','stream=width,height,nb_read_frames,avg_frame_rate','-of','json',str(out)]))['streams'][0]
    if (probe['width'],probe['height'],probe['avg_frame_rate'],int(probe['nb_read_frames']))!=(1920,1080,'30/1',count):
     raise RuntimeError('OUTPUT_FRAME_LOCK_FAILURE '+shot['id'])
    print('FRAME_LOCKED',shot['id'],count,hashlib.sha256(out.read_bytes()).hexdigest(),flush=True)
   print('NIGHT_CANDIDATE_ASSEMBLY_COMPLETE__FOOTAGE_GATE_STILL_NOT_APPROVED')
  finally:
   if night is not None:night.close()

if __name__=='__main__':main()
