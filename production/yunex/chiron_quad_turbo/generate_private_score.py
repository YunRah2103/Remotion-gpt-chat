#!/usr/bin/env python3
"""Create a restrained original synthetic instrumental underscore (not a licensed song).
No unapproved voice generation. 48kHz stereo PCM, one 28.6s presentation guide.
Actual source engine audio is processed/mixed separately if available.
"""
from pathlib import Path
import argparse, wave
import numpy as np

p=argparse.ArgumentParser();p.add_argument('--output',required=True)
args=p.parse_args()
SR=48000;T=858/30; count=round(T*SR)
t=np.arange(count,dtype=np.float64)/SR
notes=[(0,7.3,[73.42,110,146.83]),(7.3,14.65,[58.27,87.31,116.54]),
       (14.65,22.5,[65.41,98.0,130.81]),(22.5,T,[65.41,98.,146.83])]
audio=np.zeros(count,dtype=np.float64)
for a,b,chord in notes:
    start=max(0,int(a*SR));end=min(count,int(b*SR))
    tt=t[start:end]-a
    dur=b-a
    # Exponential-slow envelopes keep synthetic harmonic transitions unobtrusive.
    attack=np.minimum(1,tt/1.18)
    fade=np.minimum(1,np.maximum(0,b-t[start:end])/1.30)
    env=np.maximum(0,attack*fade)
    for j,freq in enumerate(chord):
        detune=1.0+0.0022*(j-1)
        # Layered warm drone, intentionally quiet beneath future spoken narration.
        audio[start:end]+=env*(0.12*np.sin(2*np.pi*freq*tt*detune+.23*j)+
                               .038*np.sin(2*np.pi*freq*2*tt*detune+.17*j))
# soft clock-like low beat, slight rising energy at the second turbo stage
for beat in np.arange(1.0,T,1.14):
    s=int(beat*SR);n=min(count-s,int(.22*SR))
    if n<=0:continue
    tt=np.arange(n)/SR
    gain=.018 if beat<14.5 else .032
    audio[s:s+n]+=gain*np.exp(-tt*23)*np.sin(2*np.pi*(64-20*tt)*tt)
# sparse upper harmonic accents, never spoken/copyrighted melody
for event in (0.,3.7,6.0,12.7,14.70,17.1,22.6,26.3):
    s=int(event*SR);n=min(count-s,int(.47*SR))
    if n<=0:continue
    tt=np.arange(n)/SR
    audio[s:s+n]+=.021*np.exp(-tt*9)*np.sin(2*np.pi*(620+event*7)*tt)
# gentle stereo spreading via phase-shifted micro-delay, not loudness increase.
left=audio;right=np.roll(audio,17)*.92+audio*.08
fadein=np.minimum(1,t/1.1);fadeout=np.minimum(1,(T-t)/1.15)
gain=np.maximum(0,fadein*fadeout)
stereo=np.stack([left*gain,right*gain],axis=1)
peak=np.max(np.abs(stereo))
if peak>0:stereo=stereo/max(.20,peak)*.24
pcm=(stereo*32767).astype('<i2')
out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(out),'wb') as f:
    f.setnchannels(2);f.setframerate(SR);f.setsampwidth(2);f.writeframes(pcm.tobytes())
print('ORIGINAL_UNDERSCORE_CREATED',str(out),'duration',T,'samplerate',SR,'copyright_status','newly_generated_by_this_script','NARRATION','MISSING')
