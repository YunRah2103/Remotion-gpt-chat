#!/usr/bin/env python3
"""YUNEX GT3 multi-car: exact user song, verified source engine layers and final mux.
No generated/replacement music, synthesized revs, or reference-video audio.
"""
import argparse
import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
import wave
import zipfile

PROJECT = 'gt3-nurburgring-multicar-001'
SONG_NAME = 'TikTok video #7690925557919403294 [7690925557919403294].mp3'
SONG_SHA = '87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678'
FPS, FRAMES, SR = 30, 316, 48000
SAMPLES = FRAMES * SR // FPS
MAKES = {'porsche', 'bmw', 'mercedes', 'lamborghini', 'ferrari', 'audi', 'aston martin', 'mclaren'}


def run(args):
    p = subprocess.run(args, capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(f"Command failed ({p.returncode}): {' '.join(map(str,args))}\n{p.stderr[-1800:]}")
    return p.stdout


def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))


def digest(data):
    return hashlib.sha256(data).hexdigest()


def decode(path, start=0.0, duration=None, engine=False):
    cmd = ['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(start), '-i', str(path), '-map', '0:a:0', '-vn']
    if duration is not None:
        cmd += ['-t', str(duration)]
    if engine:
        cmd += ['-af', 'highpass=f=55,lowpass=f=13500']
    cmd += ['-ar', str(SR), '-ac', '2', '-f', 'f32le', '-']
    proc = subprocess.run(cmd, capture_output=True)
    if proc.returncode:
        raise RuntimeError(f'Decode error {path}: {proc.stderr.decode(errors="replace")[-1000:]}')
    result = array.array('f')
    result.frombytes(proc.stdout)
    if sys.byteorder != 'little':
        result.byteswap()
    return result


def as_wav(samples, out):
    raw = array.array('h', (max(-32768, min(32767, round(x*32767))) for x in samples))
    if sys.byteorder != 'little':
        raw.byteswap()
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(raw.tobytes())


def beat_candidates(samples):
    """Deterministic 30fps amplitude-onset candidates; editorial suggestions only."""
    width = SR // FPS
    means = []
    for frame in range(FRAMES):
        chunk = samples[frame*width*2:(frame+1)*width*2]
        means.append(sum(abs(x) for x in chunk) / max(len(chunk), 1))
    delta = [0.0] + [max(0, means[i]-means[i-1]) for i in range(1, FRAMES)]
    order = sorted(range(1, FRAMES-3), key=lambda i: delta[i], reverse=True)
    chosen = []
    for frame in order:
        if delta[frame] <= 0 or any(abs(frame - prev) < 7 for prev in chosen):
            continue
        chosen.append(frame)
        if len(chosen) >= 18:
            break
    return [{'frame': f, 'seconds': round(f/FPS, 3), 'onset_change': round(delta[f], 5)} for f in sorted(chosen)]


def canonical_make(make):
    normalized = make.strip().lower().replace('_','-')
    return {'mercedes-amg':'mercedes', 'mercedes amg':'mercedes',
            'aston-martin':'aston martin'}.get(normalized, normalized)


def validate_shots(shotmap):
    shots = shotmap.get('shots', [])
    if len(shots) < 18 or len(shots) > 26:
        raise ValueError('Visual cut count must be 18-26 distinct shots')
    makes, normalized_shots = set(), []
    for shot in shots:
        # B's real map uses verifiedMake/from/to. targetMake is NOT evidence.
        make_raw = shot.get('verifiedMake') if 'verifiedMake' in shot else shot.get('make')
        if not make_raw:
            raise ValueError('B shot-map contains unverified make; targetMake is not source proof')
        make = canonical_make(make_raw)
        if make not in MAKES:
            raise ValueError(f'Invalid GT3 car make: {make}')
        makes.add(make)
        start = int(shot.get('start_frame', shot.get('from', -1)))
        length = int(shot.get('duration_frames', int(shot.get('to', -1)) - start))
        if start < 0 or length < 1 or start + length > FRAMES:
            raise ValueError('Shot boundaries outside 316-frame master')
        normalized_shots.append({'make':make,'start_frame':start,'duration_frames':length})
    if len(makes) < 6:
        raise ValueError('Visual montage must include >=6 unique GT3 marques')
    return normalized_shots, makes


def mix_engine_cues(music, shots, cues, root):
    provenance = []
    for cue in cues:
        frame, count = int(cue['frame']), int(cue['duration_frames'])
        make = canonical_make(cue['make'])
        if make not in MAKES or not cue.get('verified_original_car_audio', False):
            raise ValueError('Engine cue requires a verified original GT3 car recording')
        if frame < 0 or count <= 0 or frame + count > FRAMES:
            raise ValueError('Engine cue outside montage timeline')
        if not any(s['make'].strip().lower() == make and int(s['start_frame']) <= frame and int(s['start_frame'])+int(s['duration_frames']) >= frame+count for s in shots):
            raise ValueError(f'{make} audio cue does not match visible car during entire cue')
        origin = (root / cue['source_file']).resolve()
        if not origin.is_file() or not origin.is_relative_to(root.resolve()):
            raise ValueError(f'Engine source absent/outside approved root: {origin}')
        source_hash = hashlib.sha256(origin.read_bytes()).hexdigest()
        if source_hash != cue['source_sha256']:
            raise ValueError(f'Audio original SHA mismatch: {origin.name}')
        segment = decode(origin, float(cue['source_in_s']), count / FPS, engine=True)
        left = frame * (SR // FPS) * 2
        limit = min(count*(SR // FPS)*2, len(segment), len(music)-left)
        gain = 10**(min(-8.0, float(cue.get('gain_db', -17.0)))/20.0)
        fade_samples = max(1, min(1200, (limit//2)//5))
        for j in range(limit):
            n = j//2
            weight = min(1.0, n/fade_samples, ((limit//2)-1-n)/fade_samples)
            music[left+j] += segment[j] * gain * max(0.0, weight)
        provenance.append({'make': make, 'frame': frame, 'frames': count, 'original': str(origin), 'sha256': source_hash, 'gain_db': round(20*math.log10(gain),2)})
    return provenance


def video_gate(path):
    info = probe(path)
    video = [s for s in info['streams'] if s['codec_type']=='video']
    if len(video) != 1:
        raise ValueError('Expected exactly one B visual video stream')
    v = video[0]
    if (v['width'], v['height']) != (1920,1080) or v['r_frame_rate'] != '30/1':
        raise ValueError('Visual master is not native 1920x1080 / 30fps')
    n = int(v.get('nb_frames') or 0)
    if n != FRAMES:
        raise ValueError(f'Visual master must contain {FRAMES} actual frames, got {n}')
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(path), '-map', '0:v:0', '-f', 'null', '-'])
    return {'codec':v['codec_name'], 'width':1920, 'height':1080, 'frames':n}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--pack', required=True, help='User-supplied original ZIP')
    p.add_argument('--out', required=True)
    p.add_argument('--shotmap', help='B shot JSON with shots and engine_cues')
    p.add_argument('--sources-root', help='Root directory containing original A video/audio files')
    p.add_argument('--video', help='Verified B 316-frame video-only master')
    args = p.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.pack) as z:
        candidates = [n for n in z.namelist() if Path(n).name == SONG_NAME]
        if len(candidates) != 1:
            raise ValueError('Original user soundtrack absent or ambiguous in pack')
        raw = z.read(candidates[0])
    if digest(raw) != SONG_SHA:
        raise ValueError('User music mismatch. No replacement permitted')
    src = out / 'ORIGINAL_SONG_PRIVATE_INPUT.mp3'
    src.write_bytes(raw)
    try:
        music = decode(src)
    finally:
        src.unlink(missing_ok=True)
    expected = SAMPLES*2
    music = music[:expected]
    music.extend([0.0] * (expected - len(music)))
    fade = 2016
    for i in range(fade):
        w = (fade - i - 1) / fade
        for channel in range(2):
            music[(SAMPLES-fade+i)*2+channel] *= w
    accents = beat_candidates(music)
    (out/'beat_cues.json').write_text(json.dumps({'fps':FPS,'frames':FRAMES,'analysis':'Amplitude onsets; suggestions, not confirmed beat locations','candidates':accents},indent=2)+'\n')
    as_wav(music, out/'GT3_MUSIC_MASTER_316F_48K.wav')
    report = {'status':'BLOCKED_UPSTREAM', 'song_sha256':SONG_SHA, 'song_verified':True, 'frames':FRAMES, 'fps':FPS, 'sample_rate':SR, 'exact_audio_samples_per_channel':SAMPLES, 'engine_cues':[], 'music_wav_sha256':digest((out/'GT3_MUSIC_MASTER_316F_48K.wav').read_bytes())}
    if args.shotmap:
        if not args.sources_root:
            raise ValueError('Provide --sources-root when --shotmap is supplied')
        shotmap = json.loads(Path(args.shotmap).read_text())
        shots, makes = validate_shots(shotmap)
        cues = shotmap.get('engine_cues',[])
        report['visual_marques'] = sorted(makes)
        if cues:
            report['engine_cues'] = mix_engine_cues(music, shots, cues, Path(args.sources_root))
            peak = max(abs(x) for x in music)
            if peak > 10**(-1.0/20):
                music = array.array('f', (x*(10**(-1.0/20))/peak for x in music))
            as_wav(music, out/'GT3_MUSIC_ENGINE_MIX_316F_48K.wav')
        if args.video and len(cues) >= 3 and len({c['make'] for c in report['engine_cues']}) >= 3:
            report['video_source'] = video_gate(args.video)
            mix = out/'GT3_MUSIC_ENGINE_MIX_316F_48K.wav'
            final = out/'GT3_MULTICAR_NURBURGRING_FINAL_1080P.mp4'
            encode = ['-c:v','copy'] if report['video_source']['codec'] == 'h264' else ['-c:v','libx264','-crf','17','-preset','slow','-pix_fmt','yuv420p']
            run(['ffmpeg','-y','-v','error','-i',str(args.video),'-i',str(mix),'-map','0:v:0','-map','1:a:0',*encode,'-c:a','aac','-b:a','320k','-ar','48000','-ac','2','-frames:v',str(FRAMES),'-t',str(FRAMES/FPS),'-movflags','+faststart',str(final)])
            report['render_sha256'] = digest(final.read_bytes())
            report['final_probe'] = video_gate(final)
            report['status'] = 'RENDERED_PENDING_MANUAL_AV_QA'
        else:
            report['block_reason']='Requires B verified 316-frame video and >=3 original synchronized cues from >=3 real car makes'
    else:
        report['block_reason']='Agent A/B verified media and engine-source cue/shotmap not yet supplied'
    (out/'AUDIO_RENDER_QA.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))


if __name__ == '__main__':
    main()
