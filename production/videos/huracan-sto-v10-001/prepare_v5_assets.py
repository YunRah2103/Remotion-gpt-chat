#!/usr/bin/env python3
"""Frame-locked V5 assets from the exact SHA-pinned FORMAT67 original film.
User-curated 12 clip package supplies editorial in-points; three bridge clips
come from the same original user-provided filmmaker footage.
No source film or audio committed to GitHub. Gate A remains pending.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
M=json.loads((HERE/'shot-map-v5.json').read_text())

def run(cmd):
 p=subprocess.run(cmd,text=True,capture_output=True)
 if p.returncode:raise RuntimeError(' '.join(cmd)+'\n'+p.stderr[-1500:])
 return p.stdout

def main():
 a=argparse.ArgumentParser();a.add_argument('--source',type=Path,required=True);a.add_argument('--out',type=Path,default=ROOT/'public'/'sto-v5');a.add_argument('--validate-only',action='store_true')
 opt=a.parse_args()
 assert hashlib.sha256(opt.source.read_bytes()).hexdigest()==M['sourceSha256'],'SOURCE_SHA_MISMATCH'
 info=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',str(opt.source)]))['streams'][0]
 assert (info['width'],info['height'])==(1920,810),'SOURCE_NATIVE_1920x810_REQUIRED'
 if opt.validate_only:
  print('V5_ORIGINAL_SOURCE_SHA_PASS');return
 opt.out.mkdir(parents=True,exist_ok=True)
 for s in M['shots']:
  dest=opt.out/s['file'];n=s['countFrames']
  vf=f"fps=30,scale=2560:1080:flags=lanczos,crop=1920:1080:{s['cropX']}:0,setsar=1,format=yuv420p"
  run(['ffmpeg','-v','error','-ss',str(s['sourceStartSeconds']),'-i',str(opt.source),'-vf',vf,'-frames:v',str(n),'-an',
       '-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-r','30','-movflags','+faststart','-y',str(dest)])
  v=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-count_frames',
      '-show_entries','stream=width,height,nb_read_frames,avg_frame_rate','-of','json',str(dest)]))['streams'][0]
  assert (v['width'],v['height'],v['avg_frame_rate'],int(v['nb_read_frames']))==(1920,1080,'30/1',n),'FRAME_LOCK_FAIL '+s['id']
  print('V5_SCENE_VERIFIED',s['id'],n,flush=True)
 print('V5_SOURCE_ASSEMBLY_DONE_NOT_GATE_A_PASS')
if __name__=='__main__':main()
