#!/usr/bin/env python3
"""Original procedural ambient sound design. No third-party recorded audio."""
import math, random, struct, wave
from pathlib import Path
rate=32000
duration=20
random.seed(137)
out=Path("public/automotive-collage/original-soundtrack.wav")
out.parent.mkdir(parents=True,exist_ok=True)
# Intentionally restrained - original minor drone, low swells and airy transitions.
notes=[55.0,65.406,73.416,61.735,55.0]
phase=0.0
samples=bytearray()
lp=0
transitions=[3.92,7.90,12.95,17.04,19.35]
for n in range(rate*duration):
    t=n/rate
    chord=notes[min(4,int(t/4))]
    fadein=min(1.0,t/1.15)
    fadeout=min(1.0,(20-t)/1.2)
    env=fadein*fadeout
    # Warm harmonic bass pad, kept below montage energy.
    pad=(math.sin(2*math.pi*chord*t)*.055 + math.sin(2*math.pi*chord*1.502*t)*.018 +
         math.sin(2*math.pi*chord*2.005*t)*.012)*env
    # Original dry kick / transient on 110 BPM, intentionally subtle.
    beat_t=t%(60/110)
    kick=0.0
    if beat_t<.17:
        kick=math.sin(2*math.pi*(46*beat_t+27*math.exp(-beat_t*24)*beat_t))*math.exp(-beat_t*29)*.15
    # Muted hi-hat textures from synthesised noise (no samples used).
    eighth=(t%(30/110))
    hiss=random.uniform(-1,1)
    lp=lp*.75+hiss*.25
    tick=(hiss-lp)*math.exp(-eighth*65)*.035
    # Long stereo-style swish before chapter boundaries.
    whoosh=0.0
    for v in transitions:
        dt=t-v
        if -.30<dt<.12:
            strength=(dt+.30)/.42
            whoosh+=(hiss-lp)*(math.sin(math.pi*strength)**2)*.075
    signal=pad+kick+tick+whoosh
    # Gentle soft-clip limiter; peak headroom deliberately retained.
    signal=math.tanh(signal*1.45)*.71
    samples.extend(struct.pack("<h",round(max(-1,min(1,signal))*32767)))
with wave.open(str(out),"wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(samples)
print(out,out.stat().st_size)
