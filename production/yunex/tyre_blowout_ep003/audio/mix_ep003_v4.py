#!/usr/bin/env python3
"""YUNEX EP003 Agent7: reproducible, entirely original procedural V4 sound master.
The locked input picture and original Cedar mono AAC stay unchanged, zero-offset.
Requires numpy, scipy, soundfile and system ffmpeg. No third-party samples.
"""
from __future__ import annotations
import argparse, hashlib, json, subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.ndimage import uniform_filter1d
import soundfile as sf

SR=48000
FRAMES=800
DURATION=FRAMES/30
N=1280000
LOCKED_SHA='5059a0f66fc2c91316e1b5cf190ad4554feaafd2fb4e13980cb05a8069e762dd'
RNG=np.random.default_rng(7032026)
t=np.arange(N)/SR

CUES=[('70 mph',0,1.2),('tyre fails',1.755,3.285),('pulls right',3.810,5.710),
 ('tyre collapses',6.350,7.400),('forces',7.945,9.230),('off course',9.650,10.980),
 ('instinct',11.665,12.380),('slam brakes',12.830,13.570),
 ('could worsen',14.045,15.350),('grip wheel',16.015,16.595),
 ('steer smoothly',16.915,17.735),('ease off',18.080,19.840),
 ('slow down',20.425,21.405),('pull over',21.905,23.015),
 ('one tyre',23.800,24.700),('next seconds',25.260,26.390)]

def win(start, end, ramp=.1):
    a=np.clip((t-start)/max(ramp,1e-3),0,1); b=np.clip((end-t)/max(ramp,1e-3),0,1)
    return np.sin(a*np.pi/2)**2 * np.sin(b*np.pi/2)**2

def noise_band(lo=None,hi=None):
    x=RNG.standard_normal(N)
    if lo is not None and hi is not None:
        sos=butter(3,[lo,hi],btype='bandpass',fs=SR,output='sos')
    elif hi is not None:
        sos=butter(3,hi,btype='lowpass',fs=SR,output='sos')
    else:
        sos=butter(3,lo,btype='highpass',fs=SR,output='sos')
    y=sosfilt(sos,x); return y/(np.std(y)+1e-9)

def stereo(mono, pan):
    """Pan in [-1,1], constant-power, mono-compatible."""
    q=(np.clip(pan,-1,1)+1)*np.pi/4
    return np.column_stack([mono*np.cos(q),mono*np.sin(q)]).astype(np.float64)

sfx=np.zeros((N,2),np.float64)
music=np.zeros((N,2),np.float64)

def add_sfx(signal, pan=0):
    global sfx
    sfx+=stereo(signal,pan)

def add_music(signal, pan=0):
    global music
    music+=stereo(signal,pan)

# Modeled moving asphalt and semi-correlated air/engine, not recorded samples.
roll_env=win(-1,27.3,1.0)*(0.78+0.11*np.sin(2*np.pi*.17*t))
roll_env*=np.where(t>16.015,1-.23*np.minimum((t-16.015)/9,1),1)
roll_env*=1-.67*win(14.42,15.88,.18)
road=noise_band(75,1250)*roll_env*(.011+.0025*np.sin(2*np.pi*9.5*t)**2)
add_sfx(road, -.13+.13*np.sin(2*np.pi*.15*t))
add_sfx(noise_band(230,1600)*roll_env*.0062,+.24)
air=noise_band(100,1050)*(.0057+.0011*np.sin(2*np.pi*.39*t))*win(0,26.7,1.1)
air*=1-.43*win(14.40,15.88,.15)
add_sfx(air,-.33)
freq=np.where(t<16.0,79.+1.7*np.sin(2*np.pi*.09*t),79.-1.2*np.minimum(t-16.0,10))
phase=2*np.pi*np.cumsum(freq)/SR
motor=(np.sin(phase)*.008+np.sin(2*phase+.3)*.005+np.sin(3*phase)*.0027)
motor*=win(0,26.666,.55)*(1-.66*win(14.44,15.81,.19))
add_sfx(motor, .02)
flap_base=noise_band(60,680)
flap_strength=.010*win(1.78,12.9,.25)+.005*win(16.0,26.6,.3)
flap=(.30+.70*np.maximum(0,np.sin(2*np.pi*(8.3*t+.34*t*t/26)+.1)))
add_sfx(flap_base*flap*flap_strength,+.48)
hi_tear=noise_band(400,6000)
pressure=noise_band(500,4400)
add_sfx(hi_tear*.037*np.exp(-np.maximum(t-1.89,0)/.075)*(t>=1.89)*(t<2.30),+.50)
add_sfx(pressure*.023*np.exp(-np.maximum(t-2.01,0)/.39)*(t>=2.01)*(t<3.40),+.57)
pull=noise_band(340,1980)*(.0074+.003*np.sin(2*np.pi*.88*t)**2)*win(3.85,11.2,.65)
add_sfx(pull,+.48)
scrub=noise_band(680,3450)*win(12.92,14.42,.17)
scrub*=.021*(.68+.32*np.sin(2*np.pi*34*t)**2)
add_sfx(scrub,+.68)

# Actual picture contact 13.64s, rail resonances and distinct debris.
contact=13.64
hit_noise=noise_band(45,400)
add_sfx(hit_noise*.091*np.exp(-np.maximum(t-contact,0)/.084)*(t>=contact)*(t<14.35),+.56)
add_sfx(noise_band(420,4200)*.045*np.exp(-np.maximum(t-contact-.024,0)/.18)*(t>=contact+.024)*(t<14.37),+.52)
for hz,amps,decay,start in [(288,.029,.48,contact+.006),(517,.021,.38,contact+.015),
                             (903,.012,.29,contact+.034),(1487,.008,.17,contact+.052)]:
    tt=np.maximum(t-start,0)
    mode=amps*np.sin(2*np.pi*hz*tt*(1-.017*tt)+.33)*np.exp(-tt/decay)*(t>=start)*(t<start+1.5)
    add_sfx(mode, .35+.22*np.sin(hz/145))
add_sfx(noise_band(880,3700)*.021*win(13.73,14.46,.085)*(1-.49*np.clip(t-13.73,0,1)),+.60)
for delay,pan,amp in [(0.10,.76,.012),(0.18,.22,.011),(0.32,-.20,.008),(0.46,.69,.006),(.61,-.30,.0045)]:
    u=np.maximum(t-contact-delay,0)
    drop=noise_band(1400,8500)*amp*np.exp(-u/.026)*(t>=contact+delay)*(t<contact+delay+.18)
    add_sfx(drop,pan)

# Reversed barrier and debris 14.44–15.83, restored tyre and rolling recovery.
r0,r1=14.44,15.83
rv=np.clip((t-r0)/(r1-r0),0,1)
rew=win(r0,r1,.095)
reverse_noise=noise_band(260,3200)
whirl=.011*np.sin(2*np.pi*(185*(t-r0)+.5*700*(t-r0)**2/(r1-r0)))
add_sfx((reverse_noise*.023+whirl)*rew*(-.5+.10*np.cos(np.pi*rv)), -.18)
for k in range(9):
    at=r0+.11+k*.126
    u=np.maximum(at-t,0)
    g=(t>=at-.22)*(t<=at)
    add_sfx(noise_band(1450,5100)*(.003+.0006*k)*np.exp(-u/.045)*g, -0.25+0.05*k)
restart=15.925
add_sfx(noise_band(290,1800)*.008*win(restart-.075,restart+.21,.065),+.12)
add_sfx(noise_band(180,800)*.004*win(16.5,25.8,.9)*(.8-.35*np.clip((t-18)/8,0,1)),0)

# Original minimal score: A-minor tension; subdued C-major add9 resolution.
score_env=win(.35,26.665,1.7)
score_env*=1-.88*win(13.35,15.83,.18)
def pad(hz, amp, start, stop, pan):
    times=t
    wave=(np.sin(2*np.pi*hz*times)+.34*np.sin(2*np.pi*(2.004*hz)*times+.8)+
          .12*np.sin(2*np.pi*(3.001*hz)*times+1.5))/1.45
    motion=.82+.18*np.sin(2*np.pi*(.12+.013*hz/80)*times+.4)
    add_music(wave*amp*win(start,stop,1.15)*score_env*motion,pan)
for f,g,pan in [(110,.0055,-.43),(164.81,.0044,.28),(220,.0034,-.18),(293.66,.0028,.42)]:
    pad(f,g,0,12.65,pan)
for f,g,pan in [(130.81,.0041,-.36),(164.81,.0036,.27),(196,.0035,-.18),(293.66,.0027,.36)]:
    pad(f,g,15.91,23.66,pan)
for f,g,pan in [(130.81,.0050,-.36),(196,.0043,.31),(261.63,.0041,-.12),(293.66,.0031,.38)]:
    pad(f,g,23.2,26.72,pan)
for k,at in enumerate(np.arange(3.7,12.4,.86)):
    amp=.006*(.78+.22*np.sin(k*2.2))
    local_t=np.maximum(t-at,0)
    pulse=amp*np.sin(2*np.pi*62*local_t)*np.exp(-local_t/.15)*(t>=at)*(t<at+.68)
    add_music(pulse,(-1)**k*.11)
for k,at in enumerate([16.38,18.12,19.83,21.67,23.53,25.45]):
    local_t=np.maximum(t-at,0)
    pulse=.0045*np.sin(2*np.pi*78*local_t)*np.exp(-local_t/.17)*(t>=at)*(t<at+.5)
    add_music(pulse,(-1)**k*.10)
shimmer=noise_band(1200,3500)*.0013*win(23.9,26.666,.85)
add_music(shimmer, .1)

def stats(x):return dict(peak=float(np.max(np.abs(x))),rms=float(np.sqrt(np.mean(x*x))))
def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for data in iter(lambda:f.read(1<<20),b''):h.update(data)
    return h.hexdigest()
def main():
    p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--out',required=True)
    args=p.parse_args();src=Path(args.input);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    if sha(src)!=LOCKED_SHA:raise ValueError('V4 immutable source SHA mismatch: never mix V3!')
    orig_ref=out/'ORIGINAL_VO_REFERENCE.wav'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(src),'-map','0:a:0','-ac','1','-ar',str(SR),'-c:a','pcm_s24le',str(orig_ref)],check=True)
    vo,sr=sf.read(orig_ref,dtype='float64')
    assert sr==SR and len(vo)==N, (len(vo),sr)
    env=np.abs(vo)
    sm=uniform_filter1d(env,size=int(SR*.095),mode='constant')
    act=np.clip((sm-.0034)/.015,0,1)
    act=uniform_filter1d(act,size=int(SR*.15),mode='constant')
    phrase=np.zeros(N)
    for _,a,b in CUES:
        phrase=np.maximum(phrase,win(a-.07,b+.09,.09))
    act=np.maximum(act,.67*phrase)
    sfx_duck=1-.38*act
    music_duck=1-.62*act
    sfx_duck += .12*win(13.55,14.25,.08)*act
    designed_sfx=sfx*sfx_duck[:,None]
    designed_music=music*music_duck[:,None]*3.0
    sf.write(out/'SFX_STEMS.wav',designed_sfx,SR,subtype='PCM_24')
    sf.write(out/'MUSIC_STEM.wav',designed_music,SR,subtype='PCM_24')
    vo_gain=1.14
    mix=np.column_stack([vo*vo_gain,vo*vo_gain])+designed_sfx+designed_music
    peak=float(np.max(np.abs(mix)))
    safety=min(1,.89/peak)
    mix*=safety
    master_gain=1.34
    mix*=master_gain
    ceiling_start,headroom=.79,.075
    ax=np.abs(mix)
    mix=np.sign(mix)*np.where(ax>ceiling_start,ceiling_start+headroom*np.tanh((ax-ceiling_start)/headroom),ax)
    sf.write(out/'FINAL_MIX.wav',mix,SR,subtype='PCM_24')
    final=out/'YUNEX_TYRE_EP003_V4_FINAL_AUDIO.mp4'
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(src),
      '-i',str(out/'FINAL_MIX.wav'),'-map','0:v:0','-map','1:a:0',
      '-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-ac','2',
      '-movflags','+faststart','-t',f'{DURATION:.9f}',str(final)],check=True)
    info={'locked_source_sha256':LOCKED_SHA,'frames':FRAMES,'duration_seconds':DURATION,
       'sample_rate':SR,'samples':N,'vo_gain':vo_gain,'transparent_master_gain':safety,'social_master_gain':master_gain,'soft_peak_ceiling':ceiling_start+headroom,
       'raw_stem':stats(sfx),'music_stem':stats(designed_music),'narration':stats(vo),'mix':stats(mix),
       'files':{f.name:{'sha256':sha(f),'bytes':f.stat().st_size} for f in out.iterdir() if f.is_file() and f.suffix in ('.wav','.mp4')}}
    (out/'qa'/'manifest.json').write_text(json.dumps(info,indent=2))
    print(json.dumps(info,indent=2))
if __name__=='__main__':main()
