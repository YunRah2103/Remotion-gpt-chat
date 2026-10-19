#!/usr/bin/env python3
"""Precisely re-time the user-supplied 21.912 second Cedar recording.

Phrase cuts are located in *silences* of that specific authorised recording.
Does not accelerate, slow, repitch, clone, or replace the voice.
Output is a 26-second clean synced spoken stem for the real Agent 6 shots.
"""
import argparse, json, hashlib, pathlib, subprocess
import numpy as np
import soundfile as sf

SR=48000
# (spoken words, original start seconds, original end seconds, target picture time)
PHRASES=[
 ("Why do F1 drivers take the longer way around corners?", .16,3.64,.16),
 ("Watch these two cars.",4.30,5.47,3.76),
 ("The first takes the shortest route,",6.47,8.07,5.02),
 ("but the second starts wide,",8.60,10.37,6.67),
 ("clips the inside,",10.74,11.71,8.54),
 ("then exits wide.",11.91,13.02,9.64),
 ("That wider curve",13.71,14.89,11.20),
 ("lets the car carry more speed through the turn,",15.03,17.48,12.50),
 ("and with a straight coming up,",17.76,18.93,15.16),
 ("a faster exit can make all the difference.",19.26,21.55,20.04),
]

def main():
 p=argparse.ArgumentParser()
 p.add_argument('--voice',required=True)
 p.add_argument('--out',default='out/f1-ep002-audio/voice-timed.wav')
 a=p.parse_args()
 origin=pathlib.Path(a.voice)
 raw=np.frombuffer(subprocess.check_output([
  'ffmpeg','-nostdin','-v','error','-i',str(origin),'-ar',str(SR),
  '-ac','1','-f','f32le','pipe:1']),dtype='<f4').astype(np.float64)
 if not 21.5<len(raw)/SR<22.3:raise ValueError('Unexpected recording; do not splice unapproved voice')
 output=np.zeros(26*SR,dtype=np.float64)
 cues=[]
 for text,s,e,target in PHRASES:
  phrase=raw[round(s*SR):round(e*SR)].copy()
  f=min(round(.014*SR),len(phrase)//8)
  phrase[:f]*=np.linspace(0,1,f)
  phrase[-f:]*=np.linspace(1,0,f)
  i=round(target*SR)
  if np.max(np.abs(output[i:i+len(phrase)]))>.002:raise ValueError('Phrase collision')
  output[i:i+len(phrase)]+=phrase
  cues.append({'text':text,'inputSeconds':[s,e],
               'filmSeconds':[target,round(target+e-s,3)],
               'filmFrames':[round(target*30),round((target+e-s)*30)]})
 dest=pathlib.Path(a.out)
 dest.parent.mkdir(parents=True,exist_ok=True)
 sf.write(dest,output,SR,subtype='PCM_24')
 dest.with_suffix('.json').write_text(json.dumps({
  'sourceSHA256':hashlib.sha256(origin.read_bytes()).hexdigest(),
  'sourceDurationSeconds':len(raw)/SR,'outputDurationSeconds':26,
  'noTimeStretch':True,'phrases':cues},indent=2))
 print('Non-stretched Cedar VO fitted to final picture and aligned to racing climax:',dest)

if __name__=='__main__':main()
