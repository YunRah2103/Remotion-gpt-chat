#!/usr/bin/env python3
"""YUNEX media edit preflight: report only, never change source files.

ffmpeg + ffprobe required. Music cues are energy attacks, NOT verified beats.
"""
import argparse
from array import array
import json
import math
from pathlib import Path
import re
import statistics
import subprocess
import sys


def cmd(args, timeout=300):
    return subprocess.run(args, text=True, capture_output=True, check=True, timeout=timeout)


def probe(path):
    data = json.loads(cmd(['ffprobe', '-v', 'error', '-show_format',
                           '-show_streams', '-of', 'json', str(path)]).stdout)
    video = next((x for x in data['streams'] if x.get('codec_type') == 'video'), None)
    audio = next((x for x in data['streams'] if x.get('codec_type') == 'audio'), None)
    if video is None:
        raise ValueError('No video track')
    fps = video.get('avg_frame_rate', '0/1').split('/')
    rate = round(int(fps[0]) / int(fps[1]), 3) if int(fps[1]) else None
    return {'path': str(path), 'durationSeconds': float(data['format']['duration']),
            'sizeBytes': int(data['format'].get('size', 0)),
            'video': {'codec': video.get('codec_name'), 'width': video.get('width'),
                      'height': video.get('height'), 'fps': rate,
                      'pixelFormat': video.get('pix_fmt')},
            'audio': ({'codec': audio.get('codec_name'),
                       'sampleRate': audio.get('sample_rate'),
                       'channels': audio.get('channels')} if audio else None)}


def video_events(path):
    log = cmd(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(path), '-an',
               '-vf', 'blackdetect=d=0.16:pix_th=0.08,freezedetect=n=-45dB:d=0.70',
               '-f', 'null', '-']).stderr
    def parse(pattern, keys):
        found = []
        for line in log.splitlines():
            match = re.search(pattern, line)
            if match:
                found.append({key: round(float(value), 3)
                              for key, value in zip(keys, match.groups())})
        return found
    return {
        'black': parse(r'black_start:([\d.]+)\s+black_end:([\d.]+)\s+black_duration:([\d.]+)',
                       ('start', 'end', 'duration')),
        'freezeStarts': parse(r'freeze_start:\s*([\d.]+)', ('start',)),
        'freezeEnds': parse(r'freeze_end:\s*([\d.]+)\s*\|\s*freeze_duration:\s*([\d.]+)',
                            ('end', 'duration')),
    }


def silence_intervals(path):
    log = cmd(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(path), '-vn',
               '-af', 'silencedetect=noise=-48dB:d=0.35', '-f', 'null', '-']).stderr
    starts, intervals = [], []
    for line in log.splitlines():
        a = re.search(r'silence_start:\s*(-?[\d.]+)', line)
        b = re.search(r'silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)', line)
        if a:
            starts.append(float(a.group(1)))
        if b:
            intervals.append({'start': round(starts.pop(0), 3) if starts else None,
                              'end': round(float(b.group(1)), 3),
                              'duration': round(float(b.group(2)), 3)})
    return intervals


def accent_candidates(path, max_duration=180):
    """Suggest strong energy increases; musical beat/downbeat detection not claimed."""
    duration = float(json.loads(cmd(['ffprobe', '-v', 'error', '-show_format',
                                    '-of', 'json', str(path)]).stdout)['format']['duration'])
    if duration > max_duration:
        return {'status': 'skipped_long_audio', 'cues': []}
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(path),
                          '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', 'pipe:1'],
                         capture_output=True, check=True, timeout=210).stdout
    values = array('h')
    values.frombytes(raw[:len(raw)//2*2])
    if sys.byteorder != 'little':
        values.byteswap()
    width = 320
    rms = [math.sqrt(sum(v*v for v in values[i:i+width]) / max(1, len(values[i:i+width])))
           for i in range(0, len(values), width)]
    if len(rms) < 12:
        return {'status': 'no_significant_cues', 'cues': []}
    reference = statistics.median(rms)
    candidates = []
    for i in range(10, len(rms)):
        prior = statistics.median(rms[i-10:i])
        jump = rms[i] - prior
        if jump > max(350, reference*.18, prior*.28) and rms[i] >= rms[i-1]:
            candidates.append((i*.04, jump))
    picked = []
    for time, strength in sorted(candidates, key=lambda c: -c[1]):
        if all(abs(time - old) >= .24 for old, _ in picked):
            picked.append((time, strength))
        if len(picked) >= 48:
            break
    picked.sort()
    return {'status': 'estimated_energy_accents', 'windowSeconds': .04,
            'cues': [{'seconds': round(t, 3), 'strength': round(s/32768, 3)}
                     for t, s in picked],
            'disclaimer': 'Approximate energy transients; not reliable musical beats.'}


def analyze(video, music=None, mode='source', full_decode=False):
    info = probe(video)
    events = video_events(video)
    flags = []
    if mode == 'final':
        if (info['video']['width'], info['video']['height']) != (1080, 1920):
            flags.append('Final master is not native 1080x1920.')
        if not info['audio']:
            flags.append('Final master contains no audio.')
        if info['durationSeconds'] > 90:
            flags.append('Final short exceeds 90 seconds; confirm delivery specs.')
    if events['black']:
        flags.append('Black intervals detected; inspect intentional fades vs gaps.')
    if events['freezeStarts']:
        flags.append('Frozen video detected; cinematic stills can be intentional.')
    silences = silence_intervals(video) if info['audio'] else []
    if silences:
        flags.append('Audio silence intervals found; musical rests may be intentional.')
    if full_decode:
        cmd(['ffmpeg', '-v', 'error', '-xerror', '-nostdin', '-i', str(video),
             '-map', '0:v:0', '-f', 'null', '-'], timeout=480)
    cues = accent_candidates(music) if music else None
    return {'schema': 'yunex.edit-preflight.v1', 'media': info, 'mode': mode,
            'videoEvents': events, 'audioSilence': silences,
            'musicAccentShortlist': cues, 'fullVideoDecodePassed': bool(full_decode),
            'reviewFindings': flags,
            'verdict': 'REVIEW_REQUIRED' if flags else 'NO_AUTOMATED_WARNINGS',
            'limitations': 'Not visual QA, BPM measurement, copyright clearance, or full soundtrack mastering.'}


def markdown(info):
    media = info['media']
    out = ['# YUNEX editor preflight', '',
           '**Status:** ' + info['verdict'],
           '**File:** ' + media['path'],
           '**Duration:** ' + str(media['durationSeconds']) + 's',
           '**Resolution:** ' + str(media['video']['width']) + 'x' + str(media['video']['height']),
           '**Full video decode:** ' + ('passed' if info['fullVideoDecodePassed'] else 'not requested'),
           '', '## Review findings', '']
    out.extend('- ' + f for f in info['reviewFindings'])
    if not info['reviewFindings']:
        out.append('- No automated flags; inspect all moving footage and audio.')
    if info['musicAccentShortlist'] is not None:
        cues = info['musicAccentShortlist']['cues']
        out.extend(['', '## Energy accents — NOT verified musical beats', '',
                    ', '.join(str(x['seconds']) + 's' for x in cues) or '(none detected)'])
    out.extend(['', '_'+info['limitations']+'_'])
    return '\n'.join(out) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--video', required=True, type=Path)
    parser.add_argument('--music', type=Path)
    parser.add_argument('--mode', choices=['source', 'final'], default='source')
    parser.add_argument('--output', type=Path, default=Path('out/yunex-preflight'))
    parser.add_argument('--full-decode', action='store_true')
    args = parser.parse_args()
    if not args.video.is_file():
        parser.error('Video not found')
    if args.music and not args.music.is_file():
        parser.error('Original music not found')
    result = analyze(args.video, args.music, args.mode, args.full_decode)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / 'preflight.json').write_text(json.dumps(result, indent=2) + '\n')
    (args.output / 'preflight.md').write_text(markdown(result))
    print(markdown(result))


if __name__ == '__main__':
    main()
