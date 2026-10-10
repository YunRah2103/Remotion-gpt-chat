#!/usr/bin/env python3
"""Source-locked native-media audit for Porsche Turbo Evolution Agent A.

No downloads, no implied copyright clearance and no model-authenticity claims from pixels.
Reads a 30-slot edited copy of shot-manifest.template.json with localPath
(relative to --source-root) and writes evidence without transcoding originals.
"""
import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path

GENS = ['930'] * 4 + ['964'] * 4 + ['993'] * 4 + ['996'] * 4 + ['997'] * 4 + ['991'] * 5 + ['992'] * 5
MIN_MOVEMENT = 1.75


def command(*args):
    proc = subprocess.run(args, capture_output=True, text=False, timeout=90)
    if proc.returncode:
        raise RuntimeError(f"{args[0]} failed ({proc.returncode}): {proc.stderr.decode(errors='replace')[:350]}")
    return proc.stdout


def probe(path):
    info = json.loads(command('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)))
    video = next((s for s in info.get('streams', []) if s.get('codec_type') == 'video'), None)
    if video is None:
        raise ValueError(f'No video stream in {path.name}')
    numerator, denominator = video.get('avg_frame_rate', '0/1').split('/')
    fps = float(numerator) / float(denominator)
    return dict(width=int(video['width']), height=int(video['height']), fps=fps,
                codec=video.get('codec_name'), duration=float(info['format']['duration']),
                frames=video.get('nb_frames'))


def sha256(path):
    dig = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            dig.update(block)
    return dig.hexdigest()


def gray(path, at):
    result = command('ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', f'{at:.5f}',
                     '-i', str(path), '-frames:v', '1', '-vf', 'scale=64:36,format=gray',
                     '-f', 'rawvideo', '-')
    if len(result) != 64 * 36:
        raise ValueError(f'Cannot decode sample from {path.name} at {at:.3f}s')
    return result


def jpg(path, at, destination):
    command('ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', f'{at:.5f}', '-i',
            str(path), '-frames:v', '1', '-vf',
            'scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2',
            '-y', str(destination))
    if not destination.is_file() or destination.stat().st_size < 512:
        raise ValueError(f'Contact frame absent: {destination}')


def mean_delta(left, right):
    return round(sum(abs(a - b) for a, b in zip(left, right)) / len(left), 3)


def near_duplicate(left, right):
    return mean_delta(left, right) < 7.0


def safe_source(root, value):
    if not isinstance(value, str) or not value.strip() or Path(value).is_absolute():
        raise ValueError('localPath must be a nonempty relative media file path')
    candidate = (root / value).resolve()
    if not candidate.is_relative_to(root.resolve()) or not candidate.is_file():
        raise ValueError(f'Media absent or outside allowed source directory: {value}')
    return candidate


def audit(plan, source_root, output, beat_map):
    shots = plan.get('shots')
    if plan.get('schemaVersion') != 1 or not isinstance(shots, list) or len(shots) != 30:
        raise ValueError('Requires precisely 30 ordered manifest slots')
    cuts = beat_map.get('cuts')
    if len(cuts) != 30 or beat_map['output']['frames'] != 510:
        raise ValueError('Porsche beat-map must have exactly 510 frames and 30 cuts')
    if [(c['slot'], c['generation']) for c in cuts] != list(enumerate(GENS, 1)):
        raise ValueError('Beat-map slot/generation order mismatch')
    output.mkdir(parents=True, exist_ok=True)
    (output / 'frames').mkdir(exist_ok=True)
    findings, errors, warnings = [], [], []
    hashes, spans, fingerprints = {}, {}, []
    for i, shot in enumerate(shots):
        slot = i + 1
        if shot.get('slot') != slot or shot.get('generation') != GENS[i]:
            raise ValueError(f'Invalid chronology at slot {slot}')
        stamp = {'slot': slot, 'generation': GENS[i], 'verifiedMovingVideo': False,
                 'uniqueAngleVerified': False, 'mediaPresent': False}
        findings.append(stamp)
        try:
            path = safe_source(source_root, shot.get('localPath'))
            info = probe(path)
            content_hash = hashes.setdefault(path, sha256(path))
            start = float(shot['sourceInSeconds'])
            end = float(shot['sourceOutSeconds'])
            duration = cuts[i]['durationFrames'] / 30.0
            if not all(math.isfinite(x) for x in (start, end)) or start < 0 or end > info['duration'] + .01 or end - start < duration + .04:
                raise ValueError(f'in/out insufficient for {duration:.3f}s beat at slot {slot}')
            if info['width'] < 640 or info['height'] < 360 or info['fps'] < 20:
                raise ValueError('unacceptably small or slow source')
            if shot.get('sourceLicenseStatus') in (None, '') or not shot.get('sourceUrl') or not shot.get('originCreator'):
                raise ValueError('source page, creator and honest rights status are required')
            if not shot.get('actualTurboIdentityEvidence') or not shot.get('angleAndMotion') or not shot.get('shotKey'):
                raise ValueError('manual Turbo identity, camera description and unique shot key required')
            raw = shot.get('sha256')
            if raw and raw != content_hash:
                raise ValueError('user-declared original SHA256 differs from actual media')
            for old_lo, old_hi, old_slot in spans.get(content_hash, []):
                if min(end, old_hi) - max(start, old_lo) > .025:
                    raise ValueError(f'overlaps source interval of slot {old_slot}')
            spans.setdefault(content_hash, []).append((start, end, slot))
            if any(old.get('shotKey') == shot['shotKey'] for old in shots[:i]):
                raise ValueError('repeated scene/camera shotKey')
            samples = [start + .08, (start + end) / 2, end - .08]
            frames = [gray(path, t) for t in samples]
            delta = max(mean_delta(frames[0], frames[1]), mean_delta(frames[1], frames[2]))
            if delta < MIN_MOVEMENT:
                raise ValueError(f'nearly frozen source sampled at slot {slot} (delta {delta})')
            for j, earlier in fingerprints:
                if near_duplicate(frames[1], earlier):
                    warnings.append(f'slot {slot}: possible visual duplicate of slot {j}; manual camera review mandatory')
            fingerprints.append((slot, frames[1]))
            for name, t in zip(('in', 'mid', 'out'), samples):
                jpg(path, t, output / 'frames' / f'{slot:02d}-{name}.jpg')
            stamp.update(mediaPresent=True, originalSha256=content_hash,
                         originalBytes=path.stat().st_size, **info,
                         motionDelta=delta, sourceInSeconds=start, sourceOutSeconds=end,
                         sourceUrl=shot['sourceUrl'], shotKey=shot['shotKey'],
                         identityReview='NOT_AUTOMATICALLY_VERIFIED',
                         rightsStatus=shot['sourceLicenseStatus'],
                         mediaPath=str(path.relative_to(source_root.resolve())))
            if info['width'] < 1920 or info['height'] < 1080:
                warnings.append(f'slot {slot}: native {info["width"]}x{info["height"]}; avoid excessive vertical crop')
        except (KeyError, TypeError, ValueError, RuntimeError, subprocess.TimeoutExpired) as exc:
            errors.append(f'slot {slot:02d} ({GENS[i]}): {exc}')
            stamp['failure'] = str(exc)
    try:
        from PIL import Image, ImageDraw
        tiles = []
        for shot in findings:
            slot = shot['slot']
            path = output / 'frames' / f'{slot:02d}-mid.jpg'
            tile = Image.new('RGB', (480, 300), '#101010')
            if path.is_file():
                with Image.open(path) as img:
                    tile.paste(img.convert('RGB'), (0, 0))
            ImageDraw.Draw(tile).text((12, 276), f'{slot:02d}  {shot["generation"]} | {"MEDIA" if shot["mediaPresent"] else "MISSING"}', fill='#ffffff')
            tiles.append(tile)
        sheet = Image.new('RGB', (480 * 5, 300 * 6), '#101010')
        for idx, tile in enumerate(tiles):
            sheet.paste(tile, ((idx % 5) * 480, (idx // 5) * 300))
        sheet.save(output / 'contact-sheet.jpg', quality=94, subsampling=0)
    except ImportError:
        warnings.append('Pillow missing: contact sheet unavailable, individual JPEG samples are preserved')
    report = {'schemaVersion': 1, 'status': 'BLOCKED' if errors else 'NEEDS_HUMAN_IDENTITY_AND_UNIQUENESS_SIGNOFF',
              'scope': 'FFprobe + original SHA + three real decoded frames per slot; cannot authenticate Turbo model or licensing',
              'slotCount': 30, 'availableSlots': 30 - len(errors), 'errors': errors, 'warnings': warnings, 'shots': findings}
    (output / 'audit-report.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--source-root', required=True, type=Path)
    parser.add_argument('--beat-map', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    a = parser.parse_args()
    report = audit(json.loads(a.manifest.read_text()), a.source_root.resolve(), a.output,
                   json.loads(a.beat_map.read_text()))
    print(json.dumps({k: report[k] for k in ('status', 'availableSlots', 'errors', 'warnings')}, indent=2))
    raise SystemExit(2 if report['errors'] else 0)


if __name__ == '__main__':
    main()
