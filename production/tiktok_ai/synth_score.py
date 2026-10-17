#!/usr/bin/env python3
"""Original provisional cinematic underscore for AI Global Takeover.

Deterministic built-in Python sound synthesis (no external media, samples or
third-party dependencies). Does not replace the final narration, which is
deliberately delivered only after the visual edit has been reviewed.
"""
import math
import random
import struct
import sys
import wave

DURATION = 34.0
SR = 48000
random.seed(108)

# Music follows 8-second minor-key harmonic phases at ~112 BPM.
CHORDS = [
    (55.0, 82.41, 110.0),    # Am/E ambience
    (65.41, 98.0, 130.81),
    (73.42, 110.0, 146.83),
    (61.74, 92.5, 123.47),
]
SCENE_EDGES = [0.0, 4.18, 9.05, 13.56, 18.4, 23.95, 28.4, 31.05]
TAU = 2.0 * math.pi

def clamp(x):
    return max(-1.0, min(1.0, x))

def softclip(x):
    return x / (1.0 + abs(x) * 0.32)

def env(t, at, rise=0.025, decay=0.5):
    d = t - at
    if d < 0.0:
        return 0.0
    if d < rise:
        return d / rise
    return math.exp(-(d - rise) / decay)

def waveform(t, left):
    phase = min(3, int(t / 8.5))
    fundamental, fifth, upper = CHORDS[phase]
    # Warm moving synth pad and fifth (subtle under upcoming narration).
    swell = .65 + .35 * math.sin(TAU * (.045 * t + .08))
    pad = (math.sin(TAU * fundamental * t + .13 * math.sin(t * .4)) * .070 +
           math.sin(TAU * fifth * t + .09 * math.sin(t * .8)) * .022 +
           math.sin(TAU * upper * t + .07 * math.cos(t * .5)) * .015) * swell

    # Restless arpeggio pulse, with simple gate and stereo offsets.
    pulse = max(0.0, math.sin(TAU * 1.87 * t)) ** 7
    arp_freq = [164.81, 196.0, 220.0, 246.94][phase]
    arp = .024 * pulse * math.sin(TAU * arp_freq * t + (0.08 if left else -0.08))

    # Original percussive kick: falling frequency and exponential envelope.
    beat = t % (60.0 / 112.0)
    beat_start = t - beat
    kick_env = env(t, beat_start, .002, .15)
    kick_freq = 52 + 68 * math.exp(-beat * 28)
    kick = .16 * kick_env * math.sin(TAU * kick_freq * beat)
    # Airy/transmission-texture shimmer.
    airy = .006 * math.sin(TAU * 690 * t + .11 * math.sin(t * 10))
    # Cinematic scene-change impacts at the exact Remotion section changes.
    impact = 0.0
    for at in SCENE_EDGES[1:]:
        d = t - at
        if 0 < d < .85:
            impact += .22 * math.exp(-d * 4.3) * math.sin(TAU * (46 * d + 67 * (1-math.exp(-d*10)) / 10))
    # Fast noise sweeps as connections activate.
    whoosh = 0.0
    for at in SCENE_EDGES[1:]:
        d = t - at
        if -.34 < d < .45:
            whoosh += .019 * (1-abs(d)/.45) * math.sin(TAU * (2500 + 1300*d) * t)
    return pad+arp+kick+airy+impact+whoosh

def main(out_file):
    total = int(DURATION * SR)
    with wave.open(out_file, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        buf = bytearray()
        for n in range(total):
            t = n / SR
            fade_in = min(1., t / .7)
            fade_out = min(1., (DURATION - t) / 1.2)
            envelope = fade_in * fade_out
            l = clamp(softclip(waveform(t, True) * envelope))
            r = clamp(softclip(waveform(t, False) * envelope))
            buf.extend(struct.pack('<hh', int(l * 32767), int(r * 32767)))
            if len(buf) > 524288:
                wf.writeframesraw(buf)
                buf.clear()
        if buf:
            wf.writeframesraw(buf)
    print(f'Generated original {DURATION:.1f}s/{SR}Hz stereo demo score: {out_file}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv)>1 else 'out/ai-takeover-temp-score.wav')
