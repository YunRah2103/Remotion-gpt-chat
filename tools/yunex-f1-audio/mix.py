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
    v = smooth(p[car, 'speedMps'], .015)
    brake, throttle = p[car, 'brake01'], p[car, 'throttle01']
    # Audible combustion pulse maps monotonically to actual speed, but is an
    # explicitly stylised sonic mapping, NOT an unsupported literal F1 RPM/gear.
    fundamental_hz = np.clip(340 + (v - 16.863761545) * 19, 210, 520)
    phase = 2 * np.pi * np.cumsum(fundamental_hz) / SR
    signal = (.62*np.sin(phase) + .24*np.sin(2*phase+.21) +
              .14*np.sin(3*phase+.45) + .09*np.sin(.5*phase) +
              .07*np.sin(4*phase+.35) + .045*np.sin(6*phase))
    exhaust = filt(rng.standard_normal(N), lo=140, hi=2100)
    signal = np.tanh(1.75 * (signal + exhaust * (.07 + .07*throttle)))
    shots = np.array([f['shot'] for f in frames], dtype=object)[idx]
    beats = np.array([f['beat'] for f in frames], dtype=object)[idx]
    primary = np.where(beats == 'shortcut', 'shortcut', 'racing') == car
    close = np.where(np.isin(shots, ['apex', 'onboard', 'exit', 'opening']), 1,
                     np.where(np.isin(shots, ['overhead', 'force']), .5, .7))
    amplitude = smooth(np.where(primary, 1, .24) * close *
                       (.62 + .30*throttle + .08*brake), .025)
    pan = smooth(np.where(shots == 'overhead', .05,
                          np.where(primary, .11, -.18)) *
                 (1 if car == 'racing' else -1), .06)
    return .20*np.column_stack((signal*amplitude*np.sqrt((1-pan)/2),
                                signal*amplitude*np.sqrt((1+pan)/2)))

def racing_textures(frames, idx, p, rng):
    avg = lambda k: (p['shortcut', k]+p['racing', k])/2
    v, grip, brake = avg('speedMps'), avg('gripUtilization01'), avg('brake01')
    tyre = filt(rng.standard_normal(N), lo=600, hi=8500)
    air = filt(rng.standard_normal(N), lo=95, hi=4800)
    mech = filt(rng.standard_normal(N), lo=850, hi=2700)
    tyre /= np.std(tyre)+1e-9
    air /= np.std(air)+1e-9
    mech /= np.std(mech)+1e-9
    signal = (tyre * (.012+.012*np.clip(grip,0,1)) +
              air * (.010+.008*np.clip(v/22,0,1)) +
              mech * .008*np.clip(brake,0,1))
    shots = np.array([f['shot'] for f in frames], dtype=object)[idx]
    signal *= 1 + .55*smooth((shots == 'onboard').astype(float), .08)
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
    for t, pan in [(1.2,-.12),(2,-.3),(4,-.12),(6,.3),(8.333,.22),
                   (10.067,.12),(11,0),(13.4,-.08),(16,0),(18,.08),
                   (19.6,.09),(23.9,.17)]:
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
    activity = smooth((energy>.010).astype(float),.105)
    engine = engine_layer('shortcut',frames,idx,p,rng) + engine_layer('racing',frames,idx,p,rng)
    engine *= (1-.59*activity)[:,None]
    road = racing_textures(frames,idx,p,rng)*(1-.5*activity)[:,None]
    cuts = transitions(rng)*(1-.36*activity)[:,None]
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
