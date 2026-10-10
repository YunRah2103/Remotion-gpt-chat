#!/usr/bin/env python3
"""Fail-closed G90 footage/beat QC. Reads local media; never downloads/redistributes it.

python audit.py --plan shot-plan.json --sources approved.json --media-dir /path/media --proof-dir /path/proofs --mode ready
python audit.py --plan shot-plan.json --sources approved.json --mode plan
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

EXPECTED = [0, 16, 31, 47, 62, 78, 93, 109, 124, 139, 155, 171, 187, 202, 217,
            233, 249, 264, 279, 295, 311, 326, 341, 357, 373, 388, 403, 419,
            435, 450, 465, 481, 497, 512, 527, 543, 559, 574, 589, 600]
IDENTITY = 'BMW M5 G90 sedan'


def require(ok, message):
    if not ok:
        raise ValueError(message)


def probe(path):
    raw = subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
                                   '-of', 'json', str(path)], text=True, timeout=35)
    data = json.loads(raw)
    video = next((s for s in data['streams'] if s['codec_type'] == 'video'), None)
    require(video is not None, f'No video stream: {path}')
    fps = video.get('avg_frame_rate', '0/1').split('/')
    frames_per_second = float(fps[0]) / float(fps[1]) if float(fps[1]) else 0
    return {'width': int(video['width']), 'height': int(video['height']),
            'fps': frames_per_second, 'duration': float(data['format']['duration']),
            'codec': video['codec_name']}


def file_sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for piece in iter(lambda: f.read(1024 * 1024), b''):
            h.update(piece)
    return h.hexdigest()


def moving(path, a, b):
    """Mechanical still guard: decoded 8fps low-res grayscale L1 differences.
    NOT proof that the correct BMW is present; humans must verify visual identity.
    """
    a, b = float(a), float(b)
    require(b - a >= 0.35, 'Segment too short to test for real motion')
    nframes = max(2, int((b - a) * 8))
    duration = min(b - a, max(0.35, nframes / 8))
    stream = subprocess.check_output([
        'ffmpeg', '-v', 'error', '-ss', f'{a:.4f}', '-i', str(path), '-t', f'{duration:.4f}',
        '-vf', 'fps=8,scale=96:54,format=gray', '-f', 'rawvideo', '-'
    ], timeout=45)
    frame_bytes = 96 * 54
    count = len(stream) // frame_bytes
    require(count >= 2, 'Cannot decode two actual frames')
    diffs = []
    for i in range(1, count):
        before = stream[(i-1)*frame_bytes:i*frame_bytes]
        after = stream[i*frame_bytes:(i+1)*frame_bytes]
        diffs.append(sum(abs(a-b) for a, b in zip(before, after)) / frame_bytes)
    return {'decodedFrames': count, 'avgLumaDifference': round(sum(diffs)/len(diffs), 4),
            'moving': sum(diffs)/len(diffs) >= 1.1}


def audit(plan, sources, mode='plan', media_dir=None, proof_dir=None):
    require(plan.get('vehicle') == IDENTITY, 'Wrong model/body')
    require(plan.get('fps') == 30 and plan.get('totalFrames') == 600, 'Incorrect output frame plan')
    slots = plan.get('slots', [])
    require(len(slots) == 39, 'Exactly 39 beats required')
    ids = set()
    descriptors = set()
    for i, slot in enumerate(slots):
        require(slot.get('index') == i+1, f'Wrong beat index at {i+1}')
        require(slot.get('frameStart') == EXPECTED[i] and
                slot.get('frameEnd') == EXPECTED[i+1]-1,
                f'Frame gap/overlap at beat {i+1}')
        require(slot.get('index') not in ids, 'Duplicate beat index')
        desc = slot.get('desiredShot')
        require(isinstance(desc, str) and len(desc) > 8 and desc not in descriptors,
                f'Duplicate or missing shot concept at beat {i+1}')
        ids.add(slot['index'])
        descriptors.add(desc)
    require(sum(s['frameEnd'] - s['frameStart'] + 1 for s in slots) == 600,
            'Total frames must be exactly 600')
    summary = {'beatPlan': 'PASS', 'frames': 600, 'slots': len(slots), 'footageReady': False,
               'assignedSlots': sum(s.get('sourceId') is not None for s in slots),
               'verifiedFiles': 0, 'sourceAudits': {}, 'segmentAudits': {}}
    if mode == 'plan':
        return summary
    require(mode == 'ready', 'Unknown audit mode')
    require(media_dir is not None and proof_dir is not None, 'Media/proof dirs required')
    media_dir, proof_dir = Path(media_dir).resolve(), Path(proof_dir).resolve()
    proof_dir.mkdir(parents=True, exist_ok=True)
    require(isinstance(sources, list) and sources, 'No approved sources')
    mapped = {}
    for src in sources:
        sid = src.get('id')
        require(isinstance(sid, str) and sid and sid not in mapped, 'Duplicate/invalid source ID')
        require(src.get('vehicle') == IDENTITY, f'Wrong BMW generation in source {sid}')
        require(src.get('permissionStatus') == 'approved', f'No approved licence for {sid}')
        for key in ('sourceUrl', 'creator', 'licenseName', 'licenseTermsUrl',
                    'rightsEvidence', 'requiredCredit', 'identityReviewer',
                    'identityEvidence', 'sha256'):
            require(isinstance(src.get(key), str) and src[key].strip(), f'{sid}: {key} missing')
        require(len(src['sha256']) == 64, f'{sid}: invalid SHA256')
        filename = src.get('localFilename')
        require(isinstance(filename, str) and filename == Path(filename).name,
                f'{sid}: unsafe filename')
        path = (media_dir / filename).resolve()
        require(path.parent == media_dir and path.is_file(), f'{sid}: missing actual video')
        require(file_sha(path) == src['sha256'].lower(), f'{sid}: source checksum mismatch')
        p = probe(path)
        require(p['width'] >= 1080 and p['height'] >= 720 and p['fps'] >= 24,
                f'{sid}: low resolution/fps')
        require(p['duration'] >= .5, f'{sid}: clip too short')
        mapped[sid] = (path, p)
        summary['sourceAudits'][sid] = {'sha256': src['sha256'], **p}
    occupied = {}
    for slot in slots:
        i = slot['index']
        sid = slot.get('sourceId')
        require(sid in mapped, f'Beat {i} missing approved G90 footage')
        a, b = slot.get('inSeconds'), slot.get('outSeconds')
        require(isinstance(a, (float, int)) and isinstance(b, (float, int)),
                f'Beat {i}: missing source timecodes')
        path, p = mapped[sid]
        require(a >= 0 and b <= p['duration'] + 0.025 and b > a,
                f'Beat {i}: source timecodes out of bounds')
        needed = (slot['frameEnd'] - slot['frameStart'] + 1) / 30
        speed = slot.get('speed', 1.0)
        require(isinstance(speed, (float, int)) and .5 <= speed <= 1.8,
                f'Beat {i}: invalid playback speed')
        require((b-a)/speed + .035 >= needed, f'Beat {i}: insufficient real frames')
        require(slot.get('crop') in ('center', 'left', 'right', 'subject-tracked'),
                f'Beat {i}: crop not reviewed')
        for start, end, previous in occupied.get(sid, []):
            require(min(b, end) <= max(a, start) + .005,
                    f'Beat {i}: duplicate portion of source in beat {previous}')
        occupied.setdefault(sid, []).append((a, b, i))
        motion = moving(path, a, b)
        require(motion['moving'], f'Beat {i}: decoded frames appear frozen')
        summary['segmentAudits'][str(i)] = {'sourceId': sid, 'in': a, 'out': b, **motion}
        still = proof_dir / f'beat-{i:02d}.jpg'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{(a+b)/2:.4f}', '-i', str(path),
                        '-frames:v', '1', '-vf', 'scale=320:-1', str(still)],
                       check=True, timeout=30)
        require(still.stat().st_size > 1000, f'Beat {i}: still evidence not decoded')
    summary['verifiedFiles'] = len(mapped)
    summary['footageReady'] = True
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--sources', type=Path, required=True)
    parser.add_argument('--mode', choices=['plan', 'ready'], default='plan')
    parser.add_argument('--media-dir', type=Path)
    parser.add_argument('--proof-dir', type=Path)
    opts = parser.parse_args()
    try:
        result = audit(json.loads(opts.plan.read_text()), json.loads(opts.sources.read_text()),
                       opts.mode, opts.media_dir, opts.proof_dir)
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as exc:
        print(json.dumps({'audit': 'FAIL', 'reason': str(exc)}, indent=2))
        return 1
    print(json.dumps({'audit': 'PASS', **result}, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
