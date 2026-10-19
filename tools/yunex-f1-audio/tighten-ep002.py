#!/usr/bin/env python3
"""YUNEX EP002 -- shorten the narration/sound picture handoff to 23.2 sec.

Two stages, so Agent 7's physics-synchronised engine mix gets re-ducked
against the NEW voice timing rather than leaving old silent engine holes:

python tighten-ep002.py voice --input original-26s-timed-Cedar.wav --out tighter-26s-source.wav
python mix.py --physics real-A2-physics.json --voice tighter-26s-source.wav --out 26sec-mix
python tighten-ep002.py stems --input 26sec-mix --out new-23s2-stems

Final 696 picture frames are copied without re-encoding in mux-23s2.sh.
The original Cedar narration is never stretched, accelerated, or repitched.
"""
import argparse
from pathlib import Path
import numpy as np
import soundfile as sf

SR=48000
FRAMES=696
OLD=[(.16,3.64),(3.76,4.93),(5.02,6.62),(6.67,8.44),
     (8.54,9.51),(9.64,10.75),(11.20,12.38),(12.50,14.95),
     (15.16,16.33),(20.04,22.33)]
NEW=[.16,3.76,5.02,6.67,8.54,9.64,12.12,13.50,17.05,19.60]

def write(path,a):
    path=Path(path)
    path.parent.mkdir(parents=True,exist_ok=True)
    sf.write(path,np.clip(a,-.9999,.9999).astype(np.float32),SR,subtype='PCM_24')

def retime(src,dst):
    original,rate=sf.read(src,always_2d=True)
    if rate!=SR or len(original)!=26*SR:
        raise ValueError('Need the original approved 26s/48kHz Cedar timing stem')
    if original.shape[1]==2:original=original.mean(axis=1)
    output=np.zeros(26*SR)
    for (start,end),target in zip(OLD,NEW):
        clip=original[round(start*SR):round(end*SR)].copy()
        ramp=min(round(.012*SR),len(clip)//8)
        clip[:ramp]*=np.linspace(0,1,ramp)
        clip[-ramp:]*=np.linspace(1,0,ramp)
        at=round(target*SR)
        if np.max(abs(output[at:at+len(clip)]))>.001:
            raise ValueError('Overlapping spoken phrases')
        output[at:at+len(clip)]+=clip
    write(dst,output)

def trim_stems(src,dst):
    src=Path(src)
    dst=Path(dst)
    dst.mkdir(parents=True,exist_ok=True)
    n=FRAMES*SR//30
    st=round(22.38*SR)
    fade=np.ones(n)
    fade[st:]=np.cos(np.linspace(0,np.pi/2,n-st))**1.4
    master=np.zeros((n,2))
    for file in ('01_voiceover.wav','02_engines.wav','03_track_brakes_tyres_air.wav','04_cinematic_transitions.wav'):
        data,rate=sf.read(src/file,always_2d=True)
        if rate!=SR or data.shape[1]!=2 or len(data)<n:raise ValueError('Malformed '+file)
        section=data[:n].copy()
        if not file.startswith('01_'):section*=fade[:,None]
        if not np.all(np.isfinite(section)):raise ValueError('Non-finite '+file)
        write(dst/file,section)
        master+=section
    write(dst/'05_premaster.wav',master)
    print('23.200 sec / 696 frames / no music / original narration un-stretched')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('mode',choices=('voice','stems'))
    parser.add_argument('--input',required=True)
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    if args.mode=='voice':retime(args.input,args.out)
    else:trim_stems(args.input,args.out)
