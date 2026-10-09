#!/usr/bin/env python3
"""Standalone schematic motion proof from real TypeScript table, NOT a final R3F render."""
import argparse, hashlib, json, subprocess, tempfile
from pathlib import Path
import cv2
import numpy as np

HERE = Path(__file__).resolve()
ROOT = HERE.parents[4]
p = argparse.ArgumentParser()
p.add_argument('--out', default='out/brakes001-b-motion-proof.mp4')
a = p.parse_args()
out = Path(a.out).resolve()
out.parent.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory() as td:
    js = Path(td)
    subprocess.run(['tsc','--target','ES2022','--module','commonjs','--moduleResolution',
        'node','--strict','--skipLibCheck','--rootDir','src','--outDir',td,
        'src/brakes001/motion/brakeState.ts'],cwd=ROOT,check=True)
    module_path = str(js/'brakes001/motion/brakeState.js')
    emit = "const m=require(process.argv[1]);console.log(JSON.stringify(Array.from({length:750},(_,i)=>m.brakeStateAt(i))))"
    states = json.loads(subprocess.check_output(['node','-e',emit,module_path],text=True))
W,H=432,768
writer=cv2.VideoWriter(str(out),cv2.VideoWriter_fourcc(*'mp4v'),30,(W,H))
if not writer.isOpened(): raise RuntimeError('OpenCV MP4 writer unavailable')
font=cv2.FONT_HERSHEY_SIMPLEX

def text(img,value,x,y,size=0.5,color=(220,233,240),weight=1):
    cv2.putText(img,value,(x,y),font,size,color,weight,cv2.LINE_AA)

def render(f):
    s=states[f]
    pressure,heat,gap=s['brakePressure01'],s['heat01'],s['padGapMetres']
    img=np.empty((H,W,3),dtype=np.uint8)
    img[:]=(17,17,11)
    c=(216,330)
    cv2.circle(img,c,157,(46,57,66),-1,cv2.LINE_AA)
    cv2.circle(img,c,152,(66,76,84),5,cv2.LINE_AA)
    cv2.circle(img,c,110,(23,30,34),-1,cv2.LINE_AA)
    cv2.circle(img,c,134,(int(82+18*heat),int(92-41*heat),int(107+137*heat)),38,cv2.LINE_AA)
    cv2.circle(img,c,100,(30,39,47),-1,cv2.LINE_AA)
    for i in range(24):
        phi=s['rotorAngleRad']+i*2*np.pi/24
        for r in (119,145):
            cv2.circle(img,(int(c[0]+r*np.cos(phi)),int(c[1]+r*np.sin(phi))),3,(31,35,39),-1,cv2.LINE_AA)
    cv2.circle(img,c,65,(94,106,117),-1,cv2.LINE_AA)
    for i in range(6):
        phi=s['rotorAngleRad']+i*np.pi/3
        cv2.circle(img,(int(c[0]+48*np.cos(phi)),int(c[1]+48*np.sin(phi))),7,(40,50,59),-1,cv2.LINE_AA)
    cv2.circle(img,c,26,(43,49,58),-1,cv2.LINE_AA)
    # Fixed caliper vs turning rotor: mechanically independent transforms.
    cv2.rectangle(img,(341,278),(407,383),(135,149,153),-1)
    cv2.rectangle(img,(351,289),(396,374),(73,83,89),-1)
    text(img,'FIXED',345,269,.37,(170,185,201))
    # Lateral axial cross-section has two opposed inward-moving pad faces.
    cv2.rectangle(img,(208,542),(224,646),(96,107,116),-1)
    d=int(39-22*(0.006-gap)/0.0057)
    cv2.rectangle(img,(208-d-17,555),(208-d,635),(155,162,174),-1)
    cv2.rectangle(img,(224+d,555),(224+d+17,635),(155,162,174),-1)
    cv2.arrowedLine(img,(127,596),(183,596),(93,218,210),2,tipLength=.16)
    cv2.arrowedLine(img,(305,596),(249,596),(93,218,210),2,tipLength=.16)
    text(img,'AXIAL CLAMP  /  X',132,529,.45,(170,213,215))
    text(img,'INNER PAD   |  DISC  |   OUTER PAD',66,687,.46)
    text(img,'CARBON - CERAMIC / B',25,53,.69,(236,239,241),2)
    text(img,'MOTION + THERMAL / STAND-IN PROOF',25,83,.41,(145,169,183))
    text(img,f'ROTOR {s["rotorSpeedRadPerSec"]:05.1f} rad/s',25,135,.57)
    text(img,f'PRESSURE {pressure*100:05.1f} %',25,164,.57)
    text(img,f'HEAT {heat*100:05.1f} % (ILLUSTRATIVE)',25,193,.47,(178,178,239))
    text(img,f'PAD CLEARANCE {gap*1000:.2f} mm / FACE',25,721,.48)
    text(img,f'FRAME {f:03d}/749   T={s["timeSeconds"]:05.2f}s',25,745,.40,(135,160,181))
    return img

clips=[range(135,196),range(300,361),range(399,460),range(500,561),range(660,721)]
for clip in clips:
    for f in clip: writer.write(render(f))
writer.release()
stills=out.parent/'brakes001-b-stills'
stills.mkdir(exist_ok=True)
for f in (48,168,321,531,705):
    cv2.imwrite(str(stills/f'frame-{f:03d}.png'),render(f))
metadata=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0',
    '-show_entries','stream=width,height,nb_frames,avg_frame_rate','-of','json',str(out)],text=True))
assert metadata['streams'][0]['nb_frames']=='305'
assert metadata['streams'][0]['avg_frame_rate']=='30/1'
subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True)
print(json.dumps({'proof':str(out),'frames':305,'fps':30,
    'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'stills':str(stills)},indent=2))
