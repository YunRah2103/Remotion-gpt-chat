#!/usr/bin/env python3
"""Prepare 14 real landscape clips from user's provided STO source ZIP.

Run: python production/videos/huracan-sto-v10-001/prepare_landscape_assets.py \
  --zip path/to/HURACAN_STO_LANDSCAPE_FOOTAGE.zip
This is an editor ASSEMBLY tool, not source identity/moving-angle approval.
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
def main():
 a=argparse.ArgumentParser();a.add_argument('--zip',required=True);a.add_argument('--out',default=str(ROOT/'public'/'sto-v10'));a.add_argument('--validate-only',action='store_true')
 opts=a.parse_args();target=Path(opts.out);target.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(opts.zip) as zipped,tempfile.TemporaryDirectory() as d:
  names=set(zipped.namelist());source_paths={}
  for name,meta in MAP['sourceFiles'].items():
   entry='sources/'+name+'.mp4'
   if entry not in names:raise RuntimeError('Source not present: '+entry)
   payload=zipped.read(entry)
   sha=hashlib.sha256(payload).hexdigest()
   if sha!=meta['sha256']:raise RuntimeError('source integrity mismatch '+name)
   src=Path(d)/(name+'.mp4');src.write_bytes(payload);source_paths[name]=src
  if opts.validate_only:
   print('SOURCE_BYTES_INTEGRITY_PASS',len(source_paths));return
  for i,shot in enumerate(MAP['shots']):
   src=source_paths[shot['sourceOriginal'][:-4]]
   output=target/shot['file']
   count=shot['endFrameExclusive']-shot['startFrame']
   duration=count/30
   command(['ffmpeg','-hide_banner','-loglevel','error','-ss',str(shot['sourceStartSeconds']),
    '-i',str(src),'-t',str(duration+.08),
    '-vf','fps=30,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p',
    '-an','-c:v','libx264','-preset','medium','-crf','16',
    '-pix_fmt','yuv420p','-frames:v',str(count),'-movflags','+faststart','-y',str(output)])
   p=json.loads(command(['ffprobe','-v','error','-select_streams','v:0','-count_frames',
    '-show_entries','stream=width,height,nb_read_frames','-of','json',str(output)]))['streams'][0]
   if (int(p['width']),int(p['height']),int(p['nb_read_frames']))!=(1920,1080,count):
    raise RuntimeError('Extracted clip failed frame lock '+shot['id'])
   print(shot['id'],count,'frames',hashlib.sha256(output.read_bytes()).hexdigest())
 print('CANDIDATE_ASSEMBLY_OK_NOT_GATE_A_PASS')
if __name__=='__main__':main()
