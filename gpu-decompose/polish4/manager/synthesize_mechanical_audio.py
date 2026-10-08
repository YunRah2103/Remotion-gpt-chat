#!/usr/bin/env python3
"""Deterministic 15-second stereo mechanical sound bed for POLISH04.
No external media, voice, paid API, stock samples or random nondeterminism.
"""
from __future__ import annotations
from array import array
import hashlib, math, pathlib, random, struct, sys, wave

SAMPLE_RATE = 48000
SECONDS = 15
SAMPLES = SAMPLE_RATE * SECONDS
SEED = 906016
# Match real moving assembly frames, each onset is in seconds at 30 fps.
EVENTS = (
    (3.02, .15, -.45, 1.0),
    (3.36, .15, +.20, .9),
    (3.78, .17, +.50, .95),
    (4.42, .16, -.15, .74),
    (5.15, .13, +.25, .77),
    (5.80, .19, -.32, .86),
    (6.40, .16, +.24, .84),
    (7.26, .18, -.20, .94),
    (8.14, .15, +.24, .78),
    (8.92, .19, -.40, .94),
    (9.64, .16, +.35, .90),
    (10.42, .19, -.05, .92),
    (11.00, .24, +.12, 1.00),
    (12.10, .16, -.12, .64),
    (13.54, .15, +.18, .54),
)
SWEEPS = ((3.0, 2.85, .037, 230), (6.0, 2.85, .044, 175),
          (9.1, 1.80, .045, 285), (11.25, 2.00, .020, 120))
PI2=2*math.pi

def make_sound(path: pathlib.Path):
    rng = random.Random(SEED)
    samples_l=array('f',[0.0])*SAMPLES
    samples_r=array('f',[0.0])*SAMPLES
    low_noise=0.0
    # Quiet resonant cooling tone: subdued low-end harmonics, no constant loud static.
    for i in range(SAMPLES):
        t=i/SAMPLE_RATE
        low_noise=.983*low_noise + .017*(rng.random()*2-1)
        fade_in=min(1.0,max(0.0,t/.35))
        fade_out=min(1.0,max(0.0,(SECONDS-t)/.48))
        envelope=fade_in*fade_out
        swell=.65+.35*math.sin(PI2*.075*t+.7)
        hum=(.078*math.sin(PI2*(63.5*t+1.8*math.sin(PI2*.11*t)))
             +.033*math.sin(PI2*(128.0*t+3.1*math.sin(PI2*.06*t)))
             +.022*low_noise)
        airy=0.0
        for start,duration,amp,frequency in SWEEPS:
            u=(t-start)/duration
            if 0.0<=u<=1.0:
                env=math.sin(math.pi*u)**2
                airy+=amp*env*(.64*math.sin(PI2*(frequency*t+47*u*u))
                               +.36*low_noise)
        sound=(hum*swell+airy)*envelope
        samples_l[i]=sound*.97
        samples_r[i]=sound*1.03
    # Distinct machined-parts motion: staggered chirped steel clicks with light stereo movement.
    # Two short resonances per event; no obvious gunshot/percussion.
    for start,duration,pan,gain in EVENTS:
        first=int(start*SAMPLE_RATE)
        length=min(int(duration*SAMPLE_RATE),SAMPLES-first)
        lpan=math.sqrt((1-pan)/2)*1.11
        rpan=math.sqrt((1+pan)/2)*1.11
        for k in range(max(0,length)):
            u=k/SAMPLE_RATE
            env=math.exp(-37*u)
            attack=min(1.0,u/.0018)
            tonal=(.240*math.sin(PI2*(880*u+1550*u*u))
                   +.11*math.sin(PI2*(1600*u+850*u*u)))
            grit=(rng.random()*2-1)*.080*math.exp(-24*u)
            strike=(tonal*env+grit)*attack*gain
            samples_l[first+k]+=strike*lpan
            samples_r[first+k]+=strike*rpan
    peak=max(max(abs(v) for v in samples_l),max(abs(v) for v in samples_r))
    # Limit safely; fail if an unexpected mix creates distortion.
    assert .10<peak<.80,('unexpected transient peak',peak)
    rms=math.sqrt(sum(a*a+b*b for a,b in zip(samples_l,samples_r))/(2*SAMPLES))
    assert .018<rms<.20,('audio inaudible or too loud',rms)
    with wave.open(str(path),'wb') as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        buf=array('h')
        for left,right in zip(samples_l,samples_r):
            buf.extend((int(max(-1.0,min(1.0,left))*32767),
                        int(max(-1.0,min(1.0,right))*32767)))
        if sys.byteorder!='little':
            buf.byteswap()
        out.writeframes(buf.tobytes())
    assert path.stat().st_size > 2500000
    with wave.open(str(path)) as f:
        assert (f.getnchannels(),f.getframerate(),f.getnframes())==(2,SAMPLE_RATE,SAMPLES)
    file_hash=hashlib.sha256(path.read_bytes()).hexdigest()
    print(f"POLISH04_MECHANICAL_AUDIO_PASS frames={SAMPLES} seconds=15 sample_rate=48000 channels=2 "
          f"peak={peak:.4f} rms={rms:.4f} sha256={file_hash}")

if __name__=='__main__':
    if len(sys.argv)!=2:
        raise SystemExit('Usage: synthesize_mechanical_audio.py OUTPUT.wav')
    path=pathlib.Path(sys.argv[1])
    path.parent.mkdir(parents=True,exist_ok=True)
    make_sound(path)
