#!/usr/bin/env python3
"""YUNEX French Legends: fail-closed original-song mux and actual-video QA.

Music is NOT stored in the public GitHub repo. An exact user-provided M4A
and Agent C's approved 60-second muted master must be supplied at runtime.
"""
import argparse
import hashlib
import json
import math
import re
import subprocess
import sys
from pathlib import Path

EXPECTED_SONG_SHA = '2334fc7c70a4320faf1b137b97ec9e2899ed325e01cc1fb954733a21d802ec55'
EXPECTED_SECONDS = 60.0
EXPECTED_FRAMES = 1800


def run(argv):
    result = subprocess.run(argv, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(f'command failed ({result.returncode}): {argv}\n{result.stderr[-3000:]}')
    return result


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for part in iter(lambda: f.read(1024 * 1024), b''):
            h.update(part)
    return h.hexdigest()


def probe(path, *, count=False):
    args = ['ffprobe', '-v', 'error']
    if count:
        args += ['-count_frames']
    args += ['-show_streams', '-show_format', '-of', 'json', str(path)]
    return json.loads(run(args).stdout)


def stream(meta, kind):
    return next((s for s in meta['streams'] if s.get('codec_type') == kind), None)


def validate_song(song):
    sha = digest(song)
    if sha != EXPECTED_SONG_SHA:
        raise ValueError(f'WRONG SOUNDTRACK: expected {EXPECTED_SONG_SHA}, found {sha}')
    meta = probe(song)
    audio = stream(meta, 'audio')
    if not audio or audio.get('codec_name') != 'aac' or audio.get('sample_rate') != '44100' or audio.get('channels') != 2:
        raise ValueError('Expected original AAC stereo 44.1 kHz soundtrack')
    if abs(float(meta['format']['duration']) - EXPECTED_SECONDS) > .01:
        raise ValueError('Original soundtrack must be 60.000 seconds')
    return {'sha256': sha, 'seconds': EXPECTED_SECONDS, 'sample_rate': 44100, 'channels': 2,
            'name': Path(song).name}


def validate_c_video(video):
    meta = probe(video, count=True)
    v = stream(meta, 'video')
    if not v:
        raise ValueError('Agent C deliverable has no video stream')
    fps = v.get('avg_frame_rate', '0/1')
    a, b = map(int, fps.split('/'))
    duration = float(meta['format']['duration'])
    frames = int(v.get('nb_read_frames') or v.get('nb_frames') or 0)
    expected = (v.get('width'), v.get('height'), v.get('pix_fmt'), v.get('codec_name'))
    if expected != (1920, 1080, 'yuv420p', 'h264'):
        raise ValueError(f'Agent C export needs native 1920x1080 H264 yuv420p, got {expected}')
    if b == 0 or abs(a/b - 30) > .0001 or frames != EXPECTED_FRAMES or abs(duration - 60) > .055:
        raise ValueError(f'Agent C export needs exactly 1800 frames, 30fps, 60 seconds; got {frames} frames {fps} {duration}s')
    return {'sha256': digest(video), 'duration': duration, 'frames': frames,
            'width': v['width'], 'height': v['height'], 'fps': fps, 'codec': v['codec_name']}


def master_audio(song, target):
    """Preserve full original arrangement; resample and apply -1dB safety margin."""
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    run(['ffmpeg', '-y', '-nostdin', '-v', 'error', '-i', str(song), '-map', '0:a:0', '-vn',
         '-af', 'aresample=48000,volume=-1dB,atrim=0:60,asetpts=PTS-STARTPTS',
         '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', '60', str(target)])
    info = probe(target)
    s = stream(info, 'audio')
    if not s or s['codec_name'] != 'aac' or s['sample_rate'] != '48000' or s['channels'] != 2:
        raise RuntimeError('48k stereo AAC master failed technical validation')
    if abs(float(info['format']['duration']) - 60) > .05:
        raise RuntimeError('Audio master length mismatch')
    return {'sha256': digest(target), 'seconds': float(info['format']['duration']),
            'sample_rate': 48000, 'channels': 2, 'codec': 'aac', 'music_gain_db': -1.0,
            'engine_accents': 0, 'rationale': 'No verified picture-synchronised engine recordings; song preserved on its own'}


def mux(cvideo, audio, out):
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    # Stream-copy approved C picture to prevent unnecessary recompression.
    run(['ffmpeg', '-y', '-nostdin', '-v', 'error', '-i', str(cvideo), '-i', str(audio),
         '-map', '0:v:0', '-map', '1:a:0', '-map_metadata', '-1', '-c:v', 'copy',
         '-c:a', 'copy', '-movflags', '+faststart', '-t', '60', str(out)])


def detect(path, filt):
    argv = ['ffmpeg', '-hide_banner', '-nostdin', '-v', 'info', '-i', str(path)]
    if filt.startswith('blackdetect'):
        argv += ['-an', '-vf', filt]
    else:
        argv += ['-vn', '-af', filt]
    argv += ['-f', 'null', '-']
    result = subprocess.run(argv, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-3000:])
    return result.stderr


def screenshot(path, at, dest):
    run(['ffmpeg', '-y', '-nostdin', '-v', 'error', '-ss', f'{at:.3f}', '-i', str(path),
         '-frames:v', '1', '-vf', 'scale=480:270:flags=lanczos', str(dest)])


def contact_proofs(video, directory, shotmap=None):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    moments = [(.1, 'opening'), (59.8, 'last-frame')]
    if shotmap:
        data = json.loads(Path(shotmap).read_text())
        shots = data.get('shots', data) if isinstance(data, dict) else data
        if not isinstance(shots, list):
            raise ValueError('shotmap must be an array, or an object with a shots array')
        for i, shot in enumerate(shots):
            start = shot.get('master_start_frame')
            end = shot.get('master_end_frame')
            if start is None or end is None:
                start, end = shot.get('start_frame'), shot.get('end_frame')
            if start is None or end is None:
                raise ValueError(f'Shot #{i} lacks master frame interval')
            if not (0 <= int(start) < int(end) <= 1800):
                raise ValueError(f'Invalid shot interval {start}:{end}')
            mid = (int(start) + int(end)) / 60
            moments.append((min(mid, 59.967), f'shot-{i+1:03d}'))
            if i > 0:
                moments += [(max(.0, (int(start)-1)/30), f'cut-{i:03d}-before'),
                            (int(start)/30, f'cut-{i:03d}-after')]
    else:
        moments += [(t, f'sampler-{j:02d}') for j, t in enumerate(range(3, 60, 3), 1)]
    outputs = []
    for at, label in moments:
        dest = directory / (label + '.jpg')
        screenshot(video, at, dest)
        outputs.append({'time_seconds': round(at, 3), 'file': dest.name})
    try:
        from PIL import Image, ImageDraw
        cols = 4
        cellw, cellh = 480, 298
        rows = math.ceil(len(outputs)/cols)
        canvas = Image.new('RGB', (cols*cellw, rows*cellh), '#101115')
        draw = ImageDraw.Draw(canvas)
        for i, item in enumerate(outputs):
            x, y = (i % cols)*cellw, (i // cols)*cellh
            with Image.open(directory / item['file']) as im:
                canvas.paste(im.convert('RGB'), (x, y))
            draw.text((x+6, y+273), f"{item['file']}  @ {item['time_seconds']:.2f}s", fill='white')
        canvas.save(directory / 'all-shot-contact-sheet.jpg', quality=91)
    except ImportError:
        pass
    return outputs


def compare_music(song, result):
    """Compare the waveform at start and late film to catch source swap or time drift."""
    try:
        import numpy as np
    except ImportError:
        return {'status': 'not_tested', 'reason': 'numpy is not installed'}

    def samples(path, ss, seconds=8):
        p = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(ss), '-i', str(path),
                            '-map', '0:a:0', '-t', str(seconds), '-ac', '1', '-ar', '8000',
                            '-f', 'f32le', '-'], capture_output=True, check=True)
        return np.frombuffer(p.stdout, dtype='<f4').copy()

    checks = []
    for at in (2, 30, 49):
        a, b = samples(song, at), samples(result, at)
        n = min(len(a), len(b))
        a, b = a[:n], b[:n]
        if n < 32000:
            raise RuntimeError('Cannot compare audio: truncated waveform')
        # Account for AAC encoder delay, but prohibit shifted song timing.
        best = (-1.0, 0)
        for lag in range(-320, 321, 16):
            aa, bb = (a[-lag:], b[:n+lag]) if lag < 0 else (a[:n-lag], b[lag:])
            corr = float(np.dot(aa, bb) / ((np.linalg.norm(aa)*np.linalg.norm(bb))+1e-10))
            if corr > best[0]:
                best = (corr, lag)
        checks.append({'source_second': at, 'normalized_correlation': round(best[0], 5),
                       'lag_ms': best[1]/8})
    status = 'PASS' if all(c['normalized_correlation'] > .96 and abs(c['lag_ms']) <= 40 for c in checks) else 'FAIL'
    return {'status': status, 'sections': checks}


def qa_film(movie, source_song, report_dir, shotmap=None):
    meta = probe(movie, count=True)
    v, a = stream(meta, 'video'), stream(meta, 'audio')
    frames = int(v.get('nb_read_frames') or v.get('nb_frames') or 0) if v else 0
    audio_ok = bool(a and a.get('codec_name') == 'aac' and a.get('sample_rate') == '48000' and a.get('channels') == 2)
    film_ok = bool(v and v.get('width') == 1920 and v.get('height') == 1080
                   and v.get('pix_fmt') == 'yuv420p' and v.get('codec_name') == 'h264'
                   and frames == 1800 and abs(float(meta['format']['duration'])-60) < .06)
    if not (film_ok and audio_ok):
        raise RuntimeError(f'Output stream QA failed: video={film_ok}, audio={audio_ok}, frames={frames}')
    blacks = re.findall(r'black_start:([0-9.]+) black_end:([0-9.]+)', detect(movie, 'blackdetect=d=0.16:pix_th=0.07'))
    silences = re.findall(r'silence_start: ([0-9.]+)', detect(movie, 'silencedetect=noise=-50dB:d=0.8'))
    loudlog = detect(movie, 'ebur128=peak=true')
    integrated = re.findall(r'\bI:\s*(-?[0-9.]+) LUFS', loudlog)
    peak = re.findall(r'Peak:\s*(-?[0-9.]+) dBFS', loudlog)
    visuals = contact_proofs(movie, report_dir / 'frames', shotmap)
    sync = compare_music(source_song, movie)
    if sync['status'] == 'FAIL':
        raise RuntimeError(f'Original song sync failed against source: {sync}')
    return {
        'status': 'TECHNICAL_PASS_MANUAL_VISUAL_REVIEW_REQUIRED',
        'final_movie': str(movie), 'sha256': digest(movie), 'duration_seconds': float(meta['format']['duration']),
        'frames': frames, 'width': v['width'], 'height': v['height'], 'fps': v['avg_frame_rate'],
        'video_codec': v['codec_name'], 'pixel_format': v['pix_fmt'],
        'audio_codec': a['codec_name'], 'audio_hz': int(a['sample_rate']), 'stereo': a['channels'] == 2,
        'potential_black_intervals': [{'start': float(x),'end':float(y)} for x,y in blacks],
        'silence_intervals_detected': len(silences),
        'integrated_lufs': float(integrated[-1]) if integrated else None,
        'true_peak_dbfs': float(peak[-1]) if peak else None,
        'original_song_sync': sync, 'frame_proofs': visuals,
        'manual_required': ['Watch original final encoded MP4 end to end',
                            'Inspect each proof shot and cut for motion, identity, framing and any black flashes',
                            'Listen across all lyrical phrase changes and inspect final frame',
                            'Obtain outstanding publishing rights before social-media release']
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--song', type=Path, required=True)
    p.add_argument('--c-video', type=Path, help='Agent C real approved muted 60s H264 composition')
    p.add_argument('--shotmap', type=Path, help='Agent C shotmap for every-shot contact proof')
    p.add_argument('--out-dir', type=Path, default=Path('out/fr-legends-d'))
    args = p.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    song_metadata = validate_song(args.song)
    audio_file = args.out_dir / 'FR-LEGENDS-001-ORIGINAL-SONG-48K.m4a'
    audio_metadata = master_audio(args.song, audio_file)
    output = {'source_music': song_metadata, 'render_audio': audio_metadata,
              'song_placement': {'start_sec': 0.0, 'end_sec': 60.0, 'speed': 1.0, 'loop': False},
              'sound_cues': [], 'mix_choice': 'Music only: authentic motor cues deferred until picture-identified recordings exist',
              'editor_sha': None, 'final_status': 'BLOCKED_WAITING_ON_AGENT_C_APPROVED_VIDEO'}
    if args.c_video:
        output['c_visual_video'] = validate_c_video(args.c_video)
        movie = args.out_dir / 'FR-LEGENDS-001-LANDSCAPE-FINAL.mp4'
        mux(args.c_video, audio_file, movie)
        output['final_qa'] = qa_film(movie, args.song, args.out_dir / 'qa', args.shotmap)
        output['final_status'] = 'TECHNICAL_PASS_WAITING_INDEPENDENT_QA'
    (args.out_dir / 'cue-sheet-and-qa.json').write_text(json.dumps(output, indent=2) + '\n')
    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, ValueError) as e:
        print(f'AGENT D BLOCKED / FAILED: {e}', file=sys.stderr)
        sys.exit(2)
