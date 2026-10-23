#!/usr/bin/env python3
"""YUNEX EP005 Agent9: original no-voice soundtrack stems (never touches Cedar)."""
import argparse, hashlib, json, math, subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
import soundfile as sf

FS=48000; FPS=30; FRAMES=767; N=FS*FRAMES//FPS; DUR=N/FS; SEED=20261023
CUTS={"hook":[0,45],"front_drive":[45,165],"rear_chase":[165,220],"science":[220,475],"side_drive":[475,565],"rear_drive":[565,675],"finale":[675,767]}
# Provisional onset points, to be adjusted against final picture, NOT visually confirmed.
FLAMES=[0,14,30,680,703,731,752]; GEARS=[79,148,525,609,706]
SPEECH=[(0,80),(96,126),(138,189),(212,249),(260,313),(322,352),(374,462),(474,492),(517,574),(580,616),(635,668),(683,700),(712,763)]
T=np.arange(N,dtype=np.float32)/FS

def shasum(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda:f.read(1048576),b""): h.update(chunk)
    return h.hexdigest()

def band(rng,lo,hi,size=N):
    x=rng.standard_normal(size).astype(np.float32)
    y=sosfilt(butter(3,[lo,hi],fs=FS,btype="bandpass",output="sos"),x).astype(np.float32)
    return y/(np.std(y)+1e-9)

def env(points):
    xp=np.asarray(points,dtype=np.float32)
    return np.interp(T,xp[:,0],xp[:,1]).astype(np.float32)

def window(f0,f1,fade=12):
    t=T*FPS
    return np.clip((t-f0)/fade,0,1)*np.clip((f1-t)/fade,0,1)

def speechduck(floor):
    gain=np.ones(N,dtype=np.float32)
    for first,last in SPEECH:
        s=int(first*FS/FPS); e=min(N,int(last*FS/FPS))
        a=max(0,s-int(.13*FS)); b=min(N,e+int(.22*FS))
        gain[a:s]=np.minimum(gain[a:s],np.linspace(1,floor,s-a,endpoint=False))
        gain[s:e]=np.minimum(gain[s:e],floor)
        gain[e:b]=np.minimum(gain[e:b],np.linspace(floor,1,b-e,endpoint=False))
    return gain

def stereo(x,delay=13):
    b=np.roll(x,delay)*.87+x*.13
    b[:delay]=x[:delay]
    return np.column_stack((x,b)).astype(np.float32)

def engine_road(rng):
    rpm=env([(0,3450),(1.1,5200),(2,4100),(3,5650),(4.2,4550),(5.5,5900),(6.15,4900),(7.4,4400),(8,3700),(12,3200),(15.8,3500),(16.4,4700),(18.3,5950),(20.2,5100),(22.3,5950),(23.2,4300),(24.8,6150),(DUR,5100)])
    for f in GEARS:
        z=T-f/FPS
        rpm*=1-np.where((z>=-.1)&(z<.15),.22*np.exp(-np.maximum(z,0)*16),0)
    phi=2*np.pi*np.cumsum(rpm*4/60,dtype=np.float64)/FS
    firing=.38*np.sin(phi)+.2*np.sin(2*phi+.38)+.1*np.sin(3*phi+.5)+.045*np.sin(4*phi+.7)
    firing+=.32*np.sin(phi*.5+.5)+.13*np.sin(phi*.25)
    driving=np.clip(window(0,220,15)+window(475,767,15),0,1)
    motor=np.tanh(firing*1.5).astype(np.float32)*(.11*driving+.016*window(215,480,8))
    road=(band(rng,95,650)*.016+band(rng,250,2300)*.009+band(rng,45,155)*.014)*driving
    y=(motor+road)*speechduck(.78)*env([(0,.86),(.16,1),(24.9,1),(DUR,.16)])
    return stereo(y.astype(np.float32))

def flame_bursts(rng):
    y=np.zeros(N,dtype=np.float32)
    for f,scale in zip(FLAMES,[1,.75,.63,.66,.79,.94,.8]):
        start=int(round(f*FS/FPS));size=min(int(.54*FS),N-start)
        t=np.arange(size,dtype=np.float32)/FS
        crack=band(rng,340,3200,size);bass=band(rng,48,290,size);air=band(rng,1700,6200,size)
        attack=np.minimum(1,t/.005)
        e=attack*(.62*np.exp(-t*21)+.23*np.exp(-t*8))
        crackle=np.maximum(0,np.sin(2*np.pi*(19*t+.22*t*t)))**12
        tone=np.sin(2*np.pi*(84*t-50*t*t))
        y[start:start+size]+=(.055*crack*e+.044*bass*np.exp(-t*13)*attack+.027*tone*np.exp(-t*15)*attack+.012*air*np.maximum(0,1-t/.54)**2*crackle)*scale
    return stereo(y*speechduck(.63),17)

def mechanical(rng):
    gas=band(rng,230,2500);hot=band(rng,70,450)
    y=(gas*.011+hot*.016)*window(215,480,14)*(.23+.5*(.5+.5*np.sin(2*np.pi*(.5*T+.03*T*T))))
    for f in [234,253,285,307,334,371,409,452]:
        s=int(f*FS/FPS);n=min(int(.16*FS),N-s)
        tt=np.arange(n,dtype=np.float32)/FS
        y[s:s+n]+=(.018*np.sin(2*np.pi*(100*tt-40*tt*tt))+.008*gas[s:s+n])*np.exp(-tt*22)
    return stereo((y*speechduck(.65)).astype(np.float32),7)

def cinematic_score(rng):
    pad=np.zeros(N,dtype=np.float32)
    chords=[(0,6.38,[82.41,98,123.47]),(6.38,12.76,[65.41,98,123.47]),(12.76,19.14,[98,123.47,146.83]),(19.14,DUR,[73.42,110,146.83])]
    for st,en,notes in chords:
        a=int(st*FS);b=min(N,int(en*FS));local=np.arange(b-a,dtype=np.float32)/FS
        win=np.maximum(0,np.minimum(1,local/1.2)*np.minimum(1,(en-st-local)/1.4))
        for j,hz in enumerate(notes):
            hzmod=hz*(1+.0008*np.sin(2*np.pi*(.17+.06*j)*local))
            phase=2*np.pi*np.cumsum(hzmod,dtype=np.float64)/FS
            pad[a:b]+=((.011*np.sin(phase)+.0035*np.sin(2*phase+.5))*win/(1+.27*j)).astype(np.float32)
    hits=np.zeros(N,dtype=np.float32)
    for k in range(39):
        sec=.25+k*.638;s=round(sec*FS)
        if s>=N:break
        d=min(int(.35*FS),N-s);tt=np.arange(d,dtype=np.float32)/FS
        hz=59*np.exp(-tt*6)+38
        ph=2*np.pi*np.cumsum(hz,dtype=np.float64)/FS
        hits[s:s+d]+=(.0045 if sec<19 else .0075)*np.sin(ph)*np.exp(-tt*17)
    airy=band(rng,1200,3900)*.0034*env([(0,.15),(1,0),(5,.4),(11,.17),(16,.3),(21,.6),(23.5,1),(DUR,.06)])
    score=(pad+hits+airy.astype(np.float32))*speechduck(.48)*env([(0,.5),(.4,.9),(23.9,1),(25.1,.9),(DUR,0)])
    return stereo(score.astype(np.float32),19)

def render(out):
    out.mkdir(parents=True,exist_ok=True)
    stages=[("engine_road",engine_road),("exhaust_afterfire",flame_bursts),("engine_science",mechanical),("cinematic_score",cinematic_score)]
    layers={name:fn(np.random.default_rng(SEED+i)) for i,(name,fn) in enumerate(stages,1)}
    bed=np.sum(np.stack(list(layers.values()),axis=0),axis=0,dtype=np.float32)
    gain=min(1.,.34/max(1e-9,float(np.max(np.abs(bed)))))
    layers={k:v*gain for k,v in layers.items()};layers["music_fx_bed_no_voice"]=bed*gain
    manifest={"episode":"YUNEX EP005","status":"PROVISIONAL_NONVOICE_BED_ONLY__NO_PICTURE_LOCK","fps":FPS,"frameCount":FRAMES,"durationSeconds":DUR,"sampleRate":FS,"sampleCount":N,"channels":2,
              "shotFrames":CUTS,"flameOnsetsUnverified":FLAMES,"gearOnsetsUnverified":GEARS,
              "voice":{"binaryAvailable":False,"mixed":False,"expectedOwnerSha256":"90dd2e299b1cdd9b7f2d3bc508b064c43dda7bfc36caa345b2f502ec13c200d8","durationSeconds":25.56},
              "license":{"origin":"Original procedural engine/road/afterfire/science and independently composed score; no third-party samples; no Cedar"},"files":{}}
    for name,y in layers.items():
        assert y.shape==(N,2) and np.isfinite(y).all()
        path=out/(name+".wav");sf.write(path,y,FS,subtype="PCM_24")
        manifest["files"][path.name]={"sha256":shasum(path),"sampleCount":N,"peakDbfs":float(20*np.log10(max(1e-9,np.max(np.abs(y)))))}
    subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(out/"music_fx_bed_no_voice.wav"),"-af","loudnorm=I=-16:TP=-1.5:LRA=11","-c:a","libmp3lame","-b:a","224k",str(out/"NONVOICE_BED_PREVIEW_ONLY.mp3")],check=True)
    manifest["files"]["NONVOICE_BED_PREVIEW_ONLY.mp3"]={"sha256":shasum(out/"NONVOICE_BED_PREVIEW_ONLY.mp3"),"use":"normalized-audition-only"}
    (out/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print(json.dumps({"status":manifest["status"],"files":manifest["files"]},indent=2))

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--out",default="out/ep005-agent9")
    render(Path(p.parse_args().out))
