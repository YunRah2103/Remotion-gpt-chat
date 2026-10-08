#!/usr/bin/env python3
"""Create an original, precisely timed 90-second narrated science soundtrack.

Attempts natural-sounding Edge neural TTS (no API key); if unavailable,
falls back to fully offline eSpeak NG. No reference audio is reused.
The filter graph mixes speech with an original, restrained electronic bed.
"""
import asyncio
import os
import shutil
import subprocess
from pathlib import Path

OUT=Path("out")
OUT.mkdir(exist_ok=True)
VOICE=OUT/"voice"
VOICE.mkdir(exist_ok=True)

CUES=[
 (0.0, "About one hundred trillion neutrinos pass through your body every second."),
 (5.0, "They are tiny particles that go straight through you, and straight through the Earth."),
 (15.0, "For the high energy ones in this story, a body your size would wait about one hundred thousand years to stop a single one."),
 (23.1, "In nineteen eighty eight, physicist Francis Halzen had an idea."),
 (27.1, "If one body is too small, use a billion tonnes of ice."),
 (32.1, "When a neutrino hits an atom in the ice, it makes a faint flash of blue light."),
 (38.0, "Under the South Pole, the ice is clear enough for that light to travel hundreds of metres."),
 (44.1, "He calls that part pure luck."),
 (48.0, "Back then, he says, everybody thought it was a cute idea that would not work."),
 (54.3, "So they drilled eighty six holes with hot water, almost two and a half kilometres deep."),
 (70.0, "Down each one went sixty light sensors."),
 (74.9, "Five thousand one hundred and sixty in all."),
 (77.9, "It was finished in twenty eleven, and it is noisy."),
 (83.0, "About three thousand times a second, particles from our own atmosphere set it off."),
]

def run(args):
    return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)

async def neural_speak():
    import edge_tts
    # Fixed voice, rate, and punctuation make the narration repeatable.
    for idx, (_, line) in enumerate(CUES):
        dest=VOICE/f"{idx:02d}.mp3"
        comm=edge_tts.Communicate(text=line,voice="en-GB-RyanNeural",rate="-8%",pitch="-4Hz")
        await asyncio.wait_for(comm.save(str(dest)),timeout=18)

def synth_offline():
    if not shutil.which("espeak-ng"):
        raise RuntimeError("Neither neural TTS nor eSpeak NG is available")
    for i, (_, line) in enumerate(CUES):
        run(["espeak-ng","-v","en-gb+m3","-s","153","-p","47","-a","162",
             "-w",str(VOICE/f"{i:02d}.wav"),line])

try:
    import edge_tts
    try:
        asyncio.run(neural_speak())
        ext="mp3"
        print("Voice: neural English narration")
    except Exception as err:
        print("Neural narration unavailable:",str(err)[:180],"; using offline fallback")
        synth_offline()
        ext="wav"
except ImportError:
    synth_offline()
    ext="wav"

# Resample and trim (or mildly tempo-adjust) to the shot windows.
inputs=[]
for i,(start,line) in enumerate(CUES):
    audio=VOICE/f"{i:02d}.{ext}"
    next_start=CUES[i+1][0] if i+1<len(CUES) else 89.8
    available=max(1.7,next_start-start-.25)
    duration=float(run(["ffprobe","-v","error","-show_entries",
                        "format=duration","-of","default=noprint_wrappers=1:nokey=1",str(audio)]).stdout.strip())
    speed=min(2.0,max(1.0,duration/available))
    af=f"atempo={speed:.4f},aresample=48000,aformat=channel_layouts=stereo,atrim=duration={available:.3f},afade=t=in:st=0:d=0.05"
    out=VOICE/f"ready_{i:02d}.wav"
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(audio),
         "-af",af,"-ar","48000","-ac","2","-c:a","pcm_s16le",str(out)])
    inputs.extend(["-i",str(out)])

args=["ffmpeg","-hide_banner","-loglevel","error","-y",
      "-f","lavfi","-i","sine=frequency=53:sample_rate=48000:duration=90",
      "-f","lavfi","-i","anoisesrc=color=pink:amplitude=0.075:sample_rate=48000:duration=90"]+inputs

fg=["[0:a]lowpass=f=180,volume=0.12,afade=t=in:st=0:d=2,afade=t=out:st=88:d=2[bass]",
    "[1:a]highpass=f=130,lowpass=f=1800,volume=0.027,afade=t=in:st=0:d=3,afade=t=out:st=88:d=2[air]"]
for i,(start,_) in enumerate(CUES):
    ms=int(start*1000)
    fg.append(f"[{i+2}:a]volume=1.24,highpass=f=75,lowpass=f=7800,adelay={ms}|{ms}[v{i}]")
mix="[bass][air]"+''.join(f"[v{i}]" for i in range(len(CUES)))
fg.append(mix+f"amix=inputs={len(CUES)+2}:duration=longest:normalize=0,alimiter=limit=0.94,atrim=duration=90[a]")
args+=["-filter_complex",";".join(fg),"-map","[a]","-ar","48000","-ac","2",
       "-c:a","aac","-b:a","160k","-t","90",str(OUT/"icecube-sound.m4a")]
run(args)
print("Wrote 90-second AAC narrated soundtrack:",OUT/"icecube-sound.m4a")
