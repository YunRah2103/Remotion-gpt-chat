"""Measured media diagnostics and review evidence; never automatic aesthetic approval.

python scripts/modelling-kit/v4-media-qc.py out/proof.mp4 --out out/perceptual
Add --plan plan.json --geometry geometry.json --review moving-review.json when available.
Exit 1: objective failure; exit 2: --require-final requested with pending gates.
A contact sheet is a navigation aid, never evidence that moving footage was watched.
"""
import argparse
import datetime
import hashlib
import json
import math
import pathlib
import subprocess
import sys
from PIL import Image, ImageChops, ImageDraw, ImageStat


def read_json(path):
    return json.loads(pathlib.Path(path).read_text()) if path else None


def run(*args):
    return subprocess.check_output(list(args), stderr=subprocess.PIPE)


def review_state(review, sha, frames):
    """Require explicit moving-review attestation tied to this exact encoded file."""
    if not review:
        return 'pending', 'No recorded moving visual review.'
    if review.get('sha256') != sha:
        return 'pending', 'Review belongs to a different video SHA256.'
    if not isinstance(review.get('reviewer'), str) or not review['reviewer'].strip():
        return 'pending', 'Review needs a named reviewer.'
    if review.get('movingReview') is not True or not isinstance(review.get('findings'), list):
        return 'pending', 'Review must explicitly attest moving playback and record findings.'
    try:
        datetime.datetime.fromisoformat(review['reviewedAt'].replace('Z', '+00:00'))
        ranges = sorted(review['reviewedRanges'])
        covered = 0
        for a, b in ranges:
            if type(a) is not int or type(b) is not int or a < 0 or b < a or b >= frames or a > covered:
                return 'pending', 'Review ranges must cover every decoded frame without gaps.'
            covered = max(covered, b + 1)
        if covered != frames:
            return 'pending', 'Review ranges do not cover the whole film.'
    except (KeyError, TypeError, ValueError):
        return 'pending', 'Review timestamp or ranges are invalid.'
    decision = review.get('decision')
    if decision not in ('pass', 'fail'):
        return 'pending', 'Explicit review decision must be pass or fail.'
    return decision, 'Recorded moving review; automation cannot verify reviewer honesty.'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=pathlib.Path)
    parser.add_argument('--out', required=True, type=pathlib.Path)
    parser.add_argument('--plan', type=pathlib.Path)
    parser.add_argument('--geometry', type=pathlib.Path)
    parser.add_argument('--review', type=pathlib.Path)
    parser.add_argument('--source-fingerprint', help='Current independently computed source fingerprint; compare with source-contract.json.')
    parser.add_argument('--frames', type=int, help='Expected frame count if no plan is supplied.')
    parser.add_argument('--require-final', action='store_true')
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    sha = hashlib.file_digest(args.video.open('rb'), 'sha256').hexdigest()
    plan_path = args.plan or (args.video.parent / 'plan.json')
    plan = read_json(plan_path) if plan_path.exists() else None
    contract_path = args.video.parent / 'source-contract.json'
    contract = read_json(contract_path) if contract_path.exists() else None
    meta = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(args.video)))
    v = next(s for s in meta['streams'] if s['codec_type'] == 'video')
    num, den = map(int, v['r_frame_rate'].split('/'))
    fps = num / den
    problems, warnings = [], []
    stages = dict(source='pending', native='pending', geometry='pending', visual='pending')
    if contract:
        if contract.get('sha256') != sha:
            problems.append('Source contract SHA256 differs from the actual video.'); stages['source'] = 'fail'
        elif args.source_fingerprint:
            stages['source'] = 'pass' if contract.get('source') == args.source_fingerprint else 'fail'
            if stages['source'] == 'fail': problems.append('Current source fingerprint differs from render contract.')
    source_problem_count = len(problems)
    # Reuse showcase contract/full-decode/motion verification where its native schema applies.
    reused = None
    if contract and plan and args.video.name == 'proof.mp4' and (v['width'], v['height']) == (1080, 1920):
        verifier = pathlib.Path(__file__).with_name('showcase-verify.py')
        if plan_path.resolve() == (args.video.parent / 'plan.json').resolve():
            result = subprocess.run([sys.executable, str(verifier), str(args.video.parent)], capture_output=True, text=True)
            reused = {'verifier': verifier.name, 'state': 'pass' if result.returncode == 0 else 'fail', 'diagnostic': result.stderr[-2000:] if result.returncode else None}
            if result.returncode: problems.append('Existing showcase verifier rejected native media; see reusedVerifier diagnostic.')
    if reused is None:
        subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(args.video), '-f', 'null', '-'], check=True, capture_output=True)
    if (v['width'], v['height']) not in ((1080, 1920), (1920, 1080)):
        problems.append('Native proof must be 1080x1920 or 1920x1080.')
    if fps != 30 or v['codec_name'] != 'h264' or v.get('pix_fmt') != 'yuv420p':
        problems.append('Expected native H264 yuv420p at 30 fps.')
    if any(s['codec_type'] == 'audio' for s in meta['streams']):
        problems.append('Proof contract is silent; unexpected audio stream.')
    width = 160
    height = int(v['height'] * width / v['width'] / 2) * 2
    process = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(args.video), '-an', '-vf', f'scale={width}:{height}', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    # Sample the actual moving scene, excluding caption/title edges from motion metrics.
    crop = (int(width*.1), int(height*.18), int(width*.9), int(height*.78))
    frames, previous, samples, frozen, cuts, exposure = 0, None, [], [], [], []
    luma_min, luma_max, black_peak, white_peak = 255., 0., 0., 0.
    freeze_start = None
    expected = plan.get('frames') if plan else args.frames
    boundaries = {s['range'][0] for s in (plan or {}).get('shots', []) if 'range' in s}
    while True:
        raw = process.stdout.read(width * height * 3)
        if not raw: break
        if len(raw) != width * height * 3: raise ValueError('Partial decoded frame.')
        image = Image.frombytes('RGB', (width, height), raw)
        scene = image.crop(crop).convert('L')
        histogram = scene.histogram(); pixels = scene.width * scene.height
        mean = ImageStat.Stat(scene).mean[0]
        black, white = sum(histogram[:4])/pixels, sum(histogram[252:])/pixels
        luma_min, luma_max = min(luma_min, mean), max(luma_max, mean)
        black_peak, white_peak = max(black_peak, black), max(white_peak, white)
        if black > .80 or white > .10:
            exposure.append({'frame': frames, 'meanLuma': round(mean, 3), 'nearBlackFraction': round(black, 4), 'nearWhiteFraction': round(white, 4)})
        delta = sum(ImageStat.Stat(ImageChops.difference(previous, scene)).mean) if previous is not None else None
        at_cut = frames in boundaries
        if delta is not None and delta < .15 and not at_cut:
            if freeze_start is None: freeze_start = frames - 1
        elif freeze_start is not None:
            if frames - freeze_start >= math.ceil(fps*.5): frozen.append([freeze_start, frames-1])
            freeze_start = None
        if delta is not None and delta > 35 and not at_cut:
            cuts.append({'frame': frames, 'meanLumaDelta': round(delta, 3)})
        # Retain small thumbnails for equally spaced actual decoded-frame review.
        if frames % max(1, round(fps / 2)) == 0: samples.append((frames, image.copy()))
        previous = scene; frames += 1
    error = process.stderr.read().decode(); process.wait()
    if process.returncode: raise RuntimeError(error)
    if freeze_start is not None and frames-freeze_start >= math.ceil(fps*.5): frozen.append([freeze_start, frames-1])
    if expected is not None and frames != expected: problems.append(f'Decoded {frames} frames; expected {expected}.')
    if v.get('nb_frames') and int(v['nb_frames']) != frames: problems.append('Container frame count differs from decoded frame count.')
    duration = float(meta['format']['duration'])
    if abs(duration - frames/fps) > .05: problems.append('Duration differs from decoded frame count / fps.')
    stages['native'] = 'fail' if len(problems) > source_problem_count else 'pass'
    if frozen: problems.append('Frozen/near-frozen scene spans >= 0.5 seconds; inspect camera/animation, do not dismiss unique-frame hashes.')
    if exposure: warnings.append('Large near-black (>80%) or near-white (>10%) scene areas detected; inspect intended backgrounds/fades and highlight clipping.')
    if cuts: warnings.append('Large unplanned frame changes detected; inspect cuts, flashes or geometry pops.')
    # Exposure/cut diagnostics are review flags: darkness and large edits are not proof of defects.
    if frozen: stages['native'] = 'fail'
    geometry_path = args.geometry or args.video.parent/'geometry-report.json'
    geometry = read_json(geometry_path) if geometry_path.exists() else None
    if geometry:
        stages['geometry'] = geometry.get('state') if geometry.get('state') in ('pass', 'fail') else 'pending'
    review = read_json(args.review)
    stages['visual'], review_note = review_state(review, sha, frames)
    stages['final'] = 'fail' if 'fail' in stages.values() else 'pass' if all(s == 'pass' for s in stages.values()) else 'pending'
    selected = samples if len(samples) <= 18 else [samples[round(i*(len(samples)-1)/17)] for i in range(18)]
    thumb_w, thumb_h = 240, round(height*240/width)
    sheet = Image.new('RGB', (thumb_w*3, (thumb_h+34)*math.ceil(len(selected)/3)), '#12202b')
    draw = ImageDraw.Draw(sheet)
    for i, (frame, image) in enumerate(selected):
        x, y = i%3*thumb_w, i//3*(thumb_h+34)
        sheet.paste(image.resize((thumb_w, thumb_h)), (x, y)); draw.text((x+8, y+thumb_h+8), f'frame {frame} / {frame/fps:.2f}s', fill='white')
    sheet.save(args.out/'contact-review.jpg', quality=92)
    # Do not invent caption rectangles through OCR guesses. Supplied normalized boxes can be measured.
    caption_boxes = (plan or {}).get('captionBounds', [])
    unsafe = [b for b in caption_boxes if not (0.05 <= b['x'] and 0.05 <= b['y'] and b['x']+b['width'] <= .95 and b['y']+b['height'] <= .95)]
    if unsafe:
        warnings.append('Supplied caption rectangles exceed the 5% inset safe area.')
        stages['visual'] = 'fail'; stages['final'] = 'fail'
    report = {'schema': 'yunex-v4-media-qc/1', 'file': str(args.video), 'sha256': sha, 'stages': stages, 'decodedFrames': frames, 'expectedFrames': expected, 'dimensions': [v['width'], v['height']], 'fps': fps, 'fullDecode': 'pass', 'reusedVerifier': reused, 'problems': problems, 'warnings': warnings, 'frozenSpans': frozen, 'unplannedChanges': cuts, 'lumaSummary': {'minMean': round(luma_min,3), 'maxMean': round(luma_max,3), 'peakNearBlackFraction': round(black_peak,4), 'peakNearWhiteFraction': round(white_peak,4)}, 'exposureFrames': exposure, 'captionSafety': {'state': 'fail' if unsafe else 'pass' if caption_boxes else 'unassessed', 'unsafeBoxes': unsafe, 'method': 'Supplied normalized rectangles only; no OCR or occlusion certification.'}, 'visualReview': review_note, 'contactSheet': str(args.out/'contact-review.jpg'), 'limitations': ['Downsampled luma diagnostics do not certify beauty, sharpness, shading, mesh intersections or caption readability.', 'Review every moving frame in the actual full-resolution MP4 before recording visual pass.', 'Source stays pending without current independently computed --source-fingerprint and matching source contract.', 'A geometry report must describe the same source revision; this script cannot establish that association.']}
    (args.out/'quality-report.json').write_text(json.dumps(report, indent=2)+'\n')
    if not args.review:
        template = {'sha256': sha, 'reviewer': '', 'reviewedAt': '', 'movingReview': False, 'reviewedRanges': [], 'findings': [], 'decision': 'pending', 'instructions': f'Watch the entire actual MP4 at full resolution including cuts, roof/glass/door seams, wheel hardware/contact, lighting and captions; only then record [0,{frames-1}] and an honest decision.'}
        (args.out/'moving-review-template.json').write_text(json.dumps(template, indent=2)+'\n')
    print(json.dumps({'stages': stages, 'report': str(args.out/'quality-report.json'), 'problems': problems}))
    return 1 if stages['final'] == 'fail' else 2 if args.require_final and stages['final'] != 'pass' else 0


if __name__ == '__main__':
    sys.exit(main())
