#!/usr/bin/env python3
"""Deterministic 48 kHz synthetic mechanical effects and optional approved-VO mux.

Effects are stylised synthesis, NOT recorded authentic mechanical sounds. No paid
voices, music, downloaded sound libraries or generative sound services.
"""
import argparse
import array
import hashlib
import json
import math
import random
import subprocess
import wave
from pathlib import Path

RATE=48000
TYPES={"valve","brake","motor","airflow","impact","gear"}
def check_plan(plan):
    if not isinstance(plan,dict) or plan.get("schemaVersion")!=1:
        raise ValueError("Unsupported event-plan version")
    fps=int(plan.get("fps",0));frames=int(plan.get("frames",0))
    if not 1<=fps<=120 or not 1<=frames<=fps*90:
        raise ValueError("Sound plan must be a <=90-second film with valid FPS")
    events=plan.get("events",[])
    if not isinstance(events,list) or len(events)>100:raise ValueError("Maximum 100 effects")
    for e in events:
        if e.get("type") not in TYPES:raise ValueError("Invalid mechanical effect")
        if not isinstance(e.get("frame"),int) or not 0<=e["frame"]<frames:
            raise ValueError("Effect frame outside timeline")
        if not isinstance(e.get("lengthFrames"),int) or not 1<=e["lengthFrames"]<=fps*8 or e["frame"]+e["lengthFrames"]>frames:
            raise ValueError("Bad effect duration")
        if not isinstance(e.get("gain"),(float,int)) or not 0<=e["gain"]<=1:
            raise ValueError("Effect gain must be 0-1")
    return fps,frames,events

def waveform(kind,time,duration,index,noise):
    t=time/max(duration,.0001)
    fade=(math.sin(math.pi*min(1,t))**1.3 if 0<=t<=1 else 0)
    if kind=="valve":return (.6*noise+.4*math.sin(2*math.pi*2700*time))*math.exp(-24*time)
    if kind=="brake":return (.52*noise+.48*math.sin(2*math.pi*(400+80*t)*time))*fade
    if kind=="motor":return (.6*math.sin(2*math.pi*(90+150*t)*time)+.28*noise)*fade
    if kind=="airflow":return noise*fade*.53
    if kind=="impact":return (.65*noise+.35*math.sin(2*math.pi*320*time))*math.exp(-35*time)
    if kind=="gear":return (.55*math.sin(2*math.pi*500*time)+.3*math.sin(2*math.pi*1100*time))*(.45+.55*math.sin(2*math.pi*14*time))*fade
    return 0

def render(plan,out):
    fps,frames,events=check_plan(plan)
    length=round(frames/fps*RATE)
    # 90 s maximum; bounded memory, deterministic effects.
    samples=array.array("f",[0.0])*length
    for idx,e in enumerate(events):
        first=round(e["frame"]/fps*RATE)
        count=round(e["lengthFrames"]/fps*RATE)
        rng=random.Random(17000+idx)
        for j in range(min(count,length-first)):
            t=j/RATE
            sample=waveform(e["type"],t,count/RATE,j,rng.uniform(-1,1))
            samples[first+j]+=sample*e["gain"]*.7
    pcm=array.array("h")
    peak=0.0
    for s in samples:
        s=math.tanh(s*.94)
        peak=max(peak,abs(s))
        pcm.append(int(max(-1,min(1,s))*32767))
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(out),"wb") as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm.tobytes())
    report={"file":out.name,"durationSeconds":round(length/RATE,3),
            "peak":round(peak,5),"sampleRate":RATE,"channels":1,"effects":len(events),
            "sha256":hashlib.sha256(out.read_bytes()).hexdigest(),
            "warning":"Synthesised, illustrative effects; not recorded genuine hardware."}
    (out.parent/(out.stem+"-report.json")).write_text(json.dumps(report,indent=2)+"\n")
    return report

def mux(video,fx,output,narration=None):
    for item in [video,fx]+([narration] if narration else []):
        if not Path(item).is_file():raise FileNotFoundError(item)
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    if output.resolve() in {Path(video).resolve(),Path(fx).resolve()}:
        raise ValueError("Never overwrite original audio/video")
    cmd=["ffmpeg","-hide_banner","-loglevel","error","-y",
         "-i",str(video),"-i",str(fx)]
    if narration:
        cmd+=["-i",str(narration)]
        graph="[1:a]volume=0.23[fx];[2:a]aresample=48000,volume=1.0[voice];[voice][fx]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=9,alimiter=limit=0.94[a]"
    else:
        graph="[1:a]aresample=48000,loudnorm=I=-19:TP=-1.5:LRA=9,alimiter=limit=0.94[a]"
    cmd+=["-filter_complex",graph,"-map","0:v:0","-map","[a]",
          "-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",
          "-shortest","-movflags","+faststart",str(output)]
    subprocess.run(cmd,check=True,timeout=180)
    subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(output),
                    "-f","null","-"],check=True,timeout=180)
    return {"mixedFile":str(output),"narration":bool(narration),
            "note":"Audio normalised/limited, video stream copied; listening review required."}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    sub=p.add_subparsers(dest="mode",required=True)
    r=sub.add_parser("render");r.add_argument("events");r.add_argument("output")
    m=sub.add_parser("mux");m.add_argument("video");m.add_argument("effects");m.add_argument("output");m.add_argument("--narration")
    a=p.parse_args()
    if a.mode=="render":result=render(json.loads(Path(a.events).read_text()),a.output)
    else:result=mux(a.video,a.effects,a.output,a.narration)
    print(json.dumps(result,indent=2))
