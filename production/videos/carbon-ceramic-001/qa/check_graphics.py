#!/usr/bin/env python3
"""Checks Agent D layout data, not a substitute for native final-video QA."""
import argparse
import json
from pathlib import Path

ALLOWED = {'FrictionRing', 'RotorHat', 'CaliperBody', 'PadInner', 'PadOuter'}
REQUIRED = {
    'HOW CARBON-CERAMIC\nBRAKES HANDLE HEAT',
    'FRICTION → HEAT',
    'REPEATED HEAVY BRAKING',
    'FADE RESISTANCE',
    'THERMAL VISUALISATION — ILLUSTRATIVE',
}

def validate(path):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    c = data['canvas']
    assert (c['width'], c['height']) == (1080, 1920), 'contract canvas mismatch'
    assert c['safeBottom'] >= 360 and c['safeRight'] >= 150
    assert len(data['graphics']) >= 6 and len(data['labels']) >= 6
    actual = {item['text'] for item in data['graphics']}
    assert REQUIRED <= actual, f'missing cues: {REQUIRED - actual}'
    ids = set()
    for e in data['graphics']:
        assert e['id'] not in ids; ids.add(e['id'])
        assert 0 <= e['start'] < e['end'] < 750, e
        assert c['safeLeft'] <= e['x'] and e['x'] + e['width'] <= c['width'] - c['safeRight'] + 10, e
        assert c['safeTop'] <= e['y'] < c['height'] - c['safeBottom'], e
        if e['kind'] == 'disclaimer':
            assert e['start'] <= 321 <= e['end'], 'qualifier must be on thermal proof frame'
    parts = set()
    for e in data['labels']:
        assert e['id'] not in ids; ids.add(e['id'])
        assert 120 <= e['start'] < e['end'] < 750
        assert e['side'] in ('left', 'right') and e['row'] in (0, 1)
        x = 76 if e['side'] == 'left' else 598
        assert x >= c['safeLeft'] and x + 285 <= c['width'] - c['safeRight'], e
        assert set(e['part'].split(',')) <= ALLOWED, e
        parts.add(e['text'])
    assert {'Carbon-Ceramic Disc', 'Friction Ring', 'Caliper', 'Brake Pads', 'Rotor Hat'} <= parts
    for frame in range(750):
        visible = [e for e in data['labels'] if e['start'] <= frame <= e['end']]
        used = [(e['side'], e['row']) for e in visible]
        assert len(set(used)) == len(used), f'label collision at {frame}: {used}'
        assert len(visible) <= 2, f'crowded labels at {frame}'
    print(f'GRAPHICS_QA PASS: 750 frames, {len(data["graphics"])} graphics, '
          f'{len(data["labels"])} labels, five required part names, portrait zones')

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--cues', type=Path,
                   default=Path('src/brakes001/graphics/graphics-cues.json'))
    args = p.parse_args()
    validate(args.cues)
