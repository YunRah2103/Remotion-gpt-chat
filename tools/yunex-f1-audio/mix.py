#!/usr/bin/env python3
"""YUNEX F1 EP002: authoritative-state Formula engine / voice / SFX generation.

No music, no third-party sample libraries, no fabricated gears, and no picture edits.
Python 3.11+, numpy, scipy, soundfile; FFmpeg for MP3 decoding.
The --physics JSON must come from export-physics.mjs on Agent 6's integrated head.
"""
import argparse
import json
import pathlib
import subprocess
import numpy as np
import soundfile as sf
from scipy.ndimage import uniform_filter1d
from scipy.signal import butter, sosfilt

SR = 48000
FPS = 30
N = 26 * SR
CUTS = [0, 1.2, 2, 4, 6, 8.333, 10.067, 11, 13.4, 16, 18, 19.6, 21.6, 21.8, 23.9]

def filt(x, lo=None, hi=None):
    if lo is not None and hi is not None:
        w, typ = [lo, hi], 'bandpass'
    elif lo is not None:
        w, typ = lo, 'highpass'
    else:
        w, typ = hi, 'lowpass'
    return sosfilt(butter(2, w, fs=SR, btype=typ, output='sos'), x)

def smooth(x, seconds):
    return uniform_filter1d(x, size=max(1, int(seconds*SR)), mode='nearest')

def wav(path, audio):
    sf.write(str(path), np.clip(audio, -.999, .999).astype(np.float32), SR, subtype='PCM_24')

def decode_voice(path):
    out = subprocess.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-i',
                                   str(path), '-ar', str(SR), '-ac', '1', '-f', 'f32le', 'pipe:1'])
    voice = np.frombuffer(out, dtype='<f4').astype(np.float64)
    if not 0 < len(voice) <= N:
        raise ValueError('Voice does not fit native 26-second picture; do not speed up or truncate')
    return voice

def physics_at_samples(path):
    data = json.loads(pathlib.Path(path).read_text())
    frames = data['frames']
    if len(frames) != 780 or data['frameCount'] != 780 or data['framesPerSecond'] != 30:
        raise ValueError('Source JSON is not Agent 6 780-frame timeline')
    t = np.arange(N) / SR * FPS
    idx = np.minimum(np.floor(t).astype(np.int32), 779)
    keys = ['speedMps', 'brake01', 'throttle01', 'gripUtilization01']
    fields = {}
    for car in ['shortcut', 'racing']:
        for field in keys:
            sampled = np.array([f['cars'][car][field] for f in frames], dtype=float)
            if not np.all(np.isfinite(sampled)):
                raise ValueError('Non-finite simulation state ' + car + ':' + field)
            fields[car, field] = np.interp(t, np.arange(780), sampled)
    return frames, idx, fields

def engine_layer(car, frames, idx, p, rng):
    """Throaty low-mid exhaust rather than the former 340-3000 Hz bee-like loop.

    Engine timbre is identical for both simulated Formula cars; different A2
    speeds, throttle/brake state, editorial shots and microphone perspective
    create the difference. Pitch is an illustration, not literal gear/RPM data.
    """
    speed=smooth(p[car,'speedMps'],.028)
    throttle=smooth(p[car,'throttle01'],.032)
    brake=smooth(p[car,'brake01'],.025)
    freq=np.clip(71.5+3.4*speed,105,153)
    phase=2*np.pi*np.cumsum(freq)/SR
    pulses=np.maximum(.5+.5*np.sin(phase),0)**2
    low=filt(rng.standard_normal(N),lo=42,hi=520)
    low=low/(np.sqrt(np.mean(low*low))+1e-12)
    mid=filt(rng.standard_normal(N),lo=140,hi=1550)
    mid=mid/(np.sqrt(np.mean(mid*mid))+1e-12)
    exhaust=(.42*low+.20*mid)*(.45+1.2*pulses)
    piston=.27*np.sin(phase)+.15*np.sin(2*phase+.12)+.11*np.sin(phase*.5+.11)
    signal=filt(np.tanh(1.05*(piston+exhaust)),hi=1100)
    shots=np.array([f['shot'] for f in frames],dtype=object)[idx]
    beats=np.array([f['beat'] for f in frames],dtype=object)[idx]
    is_teal=car=='shortcut'
    focused=np.where(beats=='shortcut',is_teal,np.where(
        beats=='wide',not is_teal,np.where(beats=='payoff',True,not is_teal)))
    focused=np.where(focused,1.,.26)
    proximity=np.where(shots=='overhead',.62,np.where(shots=='force',.35,
                       np.where(shots=='onboard',1.,.85)))
    editorial=np.where(beats=='hook',.75,np.where(beats=='shortcut',.62,
        np.where(beats=='wide',.68,np.where(beats=='explain',.11,
            np.where(beats=='payoff',1.15,.50)))))
    amplitude=smooth(focused*proximity*(.68+.38*throttle)*
                     (1-.12*brake)*editorial,.042)
    tail=np.ones(N)
    tail[round(23.4*SR):]=np.linspace(1,.085,N-round(23.4*SR))
    amplitude*=tail
    pan=smooth(np.where(shots=='overhead',0,np.where(shots=='wide-entry',.22,
               np.where(shots=='shortcut',-.22,.06)))*
               (-1 if is_teal else 1),.07)
    signal*=.115*amplitude
    return np.column_stack((signal*np.sqrt((1-pan)/2),
                            signal*np.sqrt((1+pan)/2)))

def racing_textures(frames, idx, p, rng):
    avg = lambda k: (p['shortcut', k]+p['racing', k])/2
    v, grip, brake = avg('speedMps'), avg('gripUtilization01'), avg('brake01')
    tyre = filt(rng.standard_normal(N), lo=400, hi=1850)
    air = filt(rng.standard_normal(N), lo=250, hi=3000)
    mech = filt(rng.standard_normal(N), lo=290, hi=1200)
    tyre /= np.std(tyre)+1e-9
    air /= np.std(air)+1e-9
    mech /= np.std(mech)+1e-9
    signal = (tyre * (.0045+.007*np.clip(grip,0,1)) +
              air * (.006+.005*np.clip(v/22,0,1)) +
              mech * .007*np.clip(brake,0,1))
    shots = np.array([f['shot'] for f in frames], dtype=object)[idx]
    signal *= 1 + .48*smooth((shots == 'onboard').astype(float), .08)
    signal *= np.where(np.array([f['beat'] for f in frames],dtype=object)[idx] == 'explain',.24,.72)
    pan = np.where(shots == 'shortcut', -.22,
                   np.where(shots == 'wide-entry', .22, 0))
    return np.column_stack((signal*(1-.45*pan), signal*(1+.45*pan)))

def accent(rng, length=.28, kind='rush'):
    t = np.arange(round(length*SR))/SR
    if kind == 'impact':
        noise = filt(rng.standard_normal(len(t)), hi=220)
        shape = np.exp(-5.8*t/length)
        raw = noise + .60*np.sin(2*np.pi*(92*t-80*t*t))
    else:
        raw = filt(rng.standard_normal(len(t)), lo=160, hi=6000)
        shape = np.maximum(np.sin(np.pi*t/length), 0)**1.5
        if kind == 'click':
            shape = np.exp(-20*t/length)
    return raw/(np.std(raw)+1e-8)*shape

def transitions(rng):
    mix = np.zeros((N, 2), dtype=np.float64)
    def put(t, sound, level, pan):
        start = round(t*SR)
        end = min(N, start+len(sound))
        if end > start:
            sound = sound[:end-start]*level
            mix[start:end, 0] += sound*np.sqrt((1-pan)/2)
            mix[start:end, 1] += sound*np.sqrt((1+pan)/2)
    for t, pan in [(1.2,-.12),(6,.3),(11,0),(16,0),(21.8,0),(25.35,.13)]:
        put(t, accent(rng), .033, pan)
    put(0, accent(rng,.25,'impact'),.050,0)
    put(16,accent(rng,.24,'click'),.025,0)
    put(21.59,accent(rng,.30,'click'),.045,.10)
    put(21.8,accent(rng,.46,'impact'),.060,0)
    put(25.35,accent(rng,.28),.024,.13)
    return mix

def main():
    a = argparse.ArgumentParser()
    a.add_argument('--physics', required=True)
    a.add_argument('--voice', required=True)
    a.add_argument('--out', default='out/f1-ep002-audio/stems')
    args = a.parse_args()
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    frames, idx, p = physics_at_samples(args.physics)
    rng = np.random.default_rng(132)
    original = decode_voice(args.voice)
    speech = filt(original, lo=76)*.96
    intro = round(.035*SR)
    outro = round(.20*SR)
    speech[:intro] *= np.linspace(0,1,intro)
    speech[-outro:] *= np.linspace(1,0,outro)
    voice = np.zeros((N,2), dtype=np.float64)
    voice[:len(speech),0] = voice[:len(speech),1] = speech
    padded = np.pad(original, (0,N-len(original)))
    energy = np.sqrt(np.maximum(smooth(padded*padded,.055),0))
    activity = smooth((energy>.008).astype(float),.14)
    engine = engine_layer('shortcut',frames,idx,p,rng) + engine_layer('racing',frames,idx,p,rng)
    engine *= (1-.79*activity)[:,None]
    road = racing_textures(frames,idx,p,rng)*(1-.68*activity)[:,None]
    cuts = transitions(rng)*(1-.60*activity)[:,None]
    tail = np.ones(N)
    tail[-round(.46*SR):] = np.linspace(1,0,round(.46*SR))
    engine *= tail[:,None]
    road *= tail[:,None]
    cuts *= tail[:,None]
    master = voice+engine+road+cuts
    safety = min(1,.89/(np.max(np.abs(master))+1e-12))
    voice *= safety
    engine *= safety
    road *= safety
    cuts *= safety
    master *= safety
    for filename, signal in [('01_voiceover.wav',voice),('02_engines.wav',engine),
                             ('03_track_brakes_tyres_air.wav',road),
                             ('04_cinematic_transitions.wav',cuts),
                             ('05_premaster.wav',master)]:
        wav(out/filename,signal)
    (out/'provenance.json').write_text(json.dumps({
        'frameCount':780, 'durationSeconds':26, 'sampleRateHz':48000,
        'physicsMode':'authoritative', 'musicIncluded':False,
        'voiceSource':str(args.voice),
        'audioOrigin':'supplied Cedar recording + original synthesized motorsport effects'
    },indent=2))
    print('Produced 26s / 48kHz / 24-bit stereo voice, two cars, road and transition stems; NO MUSIC')

if __name__ == '__main__':
    main()
