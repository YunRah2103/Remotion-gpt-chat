#!/usr/bin/env python3
"""YUNEX RS6 NO MERCY: 100% original generated music. No sampled recordings."""
import os,sys,json,hashlib,subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
SR=48000; FPS=30; FRAMES=395; DUR=FRAMES/FPS; BEAT=60/122.0525756
MARKERS=[5.259,6.734,7.715,8.208,8.458,9.189,10.664,11.401]
def render(folder):
 p=Path(folder);p.mkdir(parents=True,exist_ok=True)
 n=round(SR*DUR);tx=np.arange(n,dtype=np.float64)/SR
 a=np.zeros((n,2),dtype=np.float64);rng=np.random.default_rng(600801)
 def put(start,x,gain=.2,pan=0,echo=False):
  at=round(start*SR);x=np.asarray(x)
  if at<0:x=x[-at:];at=0
  size=min(n-at,len(x))
  if size<=0:return
  ang=(1+np.clip(pan,-1,1))*np.pi/4
  a[at:at+size,0]+=x[:size]*gain*np.cos(ang)
  a[at:at+size,1]+=x[:size]*gain*np.sin(ang)
  if echo:
   delay=round(.123*SR);length=min(n-at-delay,len(x))
   if length>0:
    a[at+delay:at+delay+length,0]+=x[:length]*gain*.08*np.sin(ang)
    a[at+delay:at+delay+length,1]+=x[:length]*gain*.08*np.cos(ang)
 def noise(size,lo,hi):
  z=rng.standard_normal(size)
  z=sosfilt(butter(2,[lo,hi],btype='bandpass',fs=SR,output='sos'),z)
  return z/(np.std(z)+1e-9)
 def drum(t,mult=1):
  u=np.arange(round(.36*SR))/SR
  frequency=39+96*np.exp(-u*45)
  phase=2*np.pi*np.cumsum(frequency)/SR
  wave=(np.sin(phase)+.15*np.sin(2*phase))*(1-np.exp(-u*800))*np.exp(-u*13)
  q=np.arange(round(.016*SR))/SR
  wave[:len(q)]+=noise(len(q),1500,8000)*np.exp(-q*420)*.075
  put(t,wave,.41*mult)
 def subdrop(t,gain=1):
  u=np.arange(round(.50*SR))/SR
  freq=35+65*np.exp(-u*20);phase=2*np.pi*np.cumsum(freq)/SR
  put(t,np.tanh(2*(np.sin(phase)+.15*np.sin(2*phase)))*np.exp(-u*8),.29*gain)
 def clap(t,gain=1):
  u=np.arange(round(.15*SR))/SR
  z=noise(len(u),500,6500)*np.exp(-u*30)
  z+=.30*np.sin(2*np.pi*176*u)*np.exp(-u*42)
  put(t,z,.14*gain,pan=.18 if int(t*100)%2 else -.18,echo=True)
 def tick(t,pan=.2,gain=1):
  u=np.arange(round(.085*SR))/SR
  z=(np.sin(2*np.pi*1211*u)+.17*np.sin(2*np.pi*2822*u))*np.exp(-u*66)
  put(t,z,.10*gain,pan=pan)
 def drone(start,stop,root):
  u=np.arange(round((stop-start)*SR))/SR
  env=np.clip(u/.14,0,1)*np.clip((stop-start-u)/.12,0,1)
  phase=2*np.pi*root*u
  z=(.32*np.sin(phase)+.20*np.sin(2*phase)+.06*np.sin(3*phase))*.41*env
  z+=.012*env*(np.sin(2*np.pi*root*8.0*u)+np.sin(2*np.pi*root*8.021*u))
  put(start,z,1,pan=-.10)
  put(start,z*.74,1,pan=.15)
 for st,en,root in [(0,2.839,46.25),(2.839,5.259,43.65),(5.259,7.715,46.25),
                    (7.715,9.189,41.20),(9.189,11.401,38.89),(11.401,DUR,43.65)]:
  drone(st,en,root)
 amb=(.020*np.sin(2*np.pi*97.9*tx+.1*np.sin(2*np.pi*.21*tx))+
      .016*np.sin(2*np.pi*146.8*tx))
 fade=np.clip(tx/.65,0,1)*np.clip((DUR-tx)/.06,0,1)
 a[:,0]+=amb*fade*.7;a[:,1]+=amb*fade*.6
 hiss=noise(n,300,1750)
 a[:,0]+=hiss*fade*.008;a[:,1]+=np.roll(hiss,791)*fade*.007
 for i,t in enumerate([2.839,3.331,3.824,4.071,4.316,4.563,4.809,5.055]):
  tick(t,pan=(-.28 if i%2 else .28),gain=.4 if i<3 else .8)
 clap(3.988,.45)
 for start,stop,level in [(5.259,7.26,1.0),(9.189,10.54,1.15)]:
  subdrop(start,1.3*level)
  for i,t in enumerate(np.arange(start,stop,BEAT)):
   drum(float(t),1.03*level if i%2==0 else .65*level)
   tick(float(t+BEAT/2),pan=(-.38 if i%2 else .38),gain=.58)
   if i%2:clap(float(t),.78*level)
 for time,lev in [(5.997,.8),(6.240,.75),(6.734,.93),(7.715,.55),(8.208,.9),(8.458,.7),
                  (9.927,1.0),(10.176,.95),(10.664,.8),(11.401,.8)]:
  clap(time,lev*.64)
  if time in [6.734,8.208,10.664]:subdrop(time,lev*.5)
 for i,t in enumerate([11.401,11.651,11.897,12.138,12.388,12.632,12.881]):
  tick(t,.30 if i%2 else -.30,.9 if i%2==0 else .7)
  if i in (0,3,5):drum(t,.42)
 for t,root in [(3.988,73.4),(4.768,77.8),(7.715,82.4),(8.208,92.5),(10.664,65.4),(11.401,73.4)]:
  u=np.arange(round(.29*SR))/SR;phase=2*np.pi*root*u
  put(t,(np.sin(phase)+.34*np.sin(3*phase))*np.exp(-u*15)*(1-np.exp(-u*400)),.09)
 duck=np.ones(n)
 for tm,depth,width in [(4.768,.24,.033),(7.715,.33,.05),(10.664,.25,.031)]:
  duck*=1-depth*np.exp(-.5*((tx-tm)/width)**2)
 a*=duck[:,None]
 a=np.tanh(a*1.7)
 a*=.89125/(np.max(np.abs(a))+1e-12)
 fade_out=round(.06*SR);a[-fade_out:]*=np.linspace(1,0,fade_out)[:,None]
 raw=p/'score.f32le';a.astype('<f4').tofile(raw)
 wav=p/'YUNEX_RS6_NO_MERCY_CLEARED_SCORE_48K.wav'
 mp4=p/'YUNEX_RS6_NO_MERCY_CLEARED_SCORE_48K.m4a'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','f32le','-ar','48000','-ac','2','-i',str(raw),'-c:a','pcm_s24le',str(wav)],check=True)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movflags','+faststart',str(mp4)],check=True)
 raw.unlink()
 decode=subprocess.run(['ffmpeg','-v','error','-i',str(mp4),'-f','null','-'],capture_output=True,text=True)
 assert decode.returncode==0,decode.stderr
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-show_entries','stream=codec_name,sample_rate,channels','-of','json',str(mp4)]))
 assert probe['streams'][0]['codec_name']=='aac'
 assert int(probe['streams'][0]['sample_rate'])==SR
 assert int(probe['streams'][0]['channels'])==2
 assert abs(float(probe['format']['duration'])-DUR)<.035
 assert .79 < float(np.max(np.abs(a))) < .93
 assert np.isfinite(a).all()
 report={'project':'YUNEX RS6 NO MERCY','status':'PASS','type':'original independently synthesized soundtrack','no_copied_source_audio':True,'real_reference_music_is_not_included':True,'source_rights_gate':'Original reference soundtrack reuse NOT approved',
 'tempo_bpm':122.0525756,'dominant_reference_onsets':MARKERS,'fps':FPS,'frames':FRAMES,'duration_s':DUR,'stream':probe,'master_pcm_max_dbfs':round(float(20*np.log10(np.max(np.abs(a)))),3),
 'master_pcm_rms_dbfs':round(float(20*np.log10(np.sqrt(np.mean(a*a)))),3),'files':{f.name:{'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size} for f in (wav,mp4)}}
 (p/'mix_manifest.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
if __name__=='__main__':render(sys.argv[1] if len(sys.argv)>1 else 'rs6_audio_out')
