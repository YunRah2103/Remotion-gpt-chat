#!/usr/bin/env python3
"""Generate preview SVGs FROM production graphics cue JSON, not from the 3D film.

These prove bounds and readability only. Placeholder rings are deliberately
marked so this cannot be mistaken for actual film QA or a brake model review.
"""
import argparse
import json
from html import escape
from pathlib import Path

FRAME_TARGETS = (48, 168, 321, 531, 705)

def generate(data, frame):
    graphics = [e for e in data['graphics'] if e['start'] <= frame <= e['end']]
    labels = [e for e in data['labels'] if e['start'] <= frame <= e['end']]
    result = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs><radialGradient id="bg"><stop stop-color="#173031"/><stop offset="1" stop-color="#070b10"/></radialGradient><linearGradient id="ring" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#506562"/><stop offset="1" stop-color="#1e282d"/></linearGradient></defs>
<rect width="1080" height="1920" fill="url(#bg)"/>
<!-- This schematic is NOT the real rotor and is NOT a film QA pass. -->
<g transform="translate(540 955)" opacity=".40"><circle r="335" stroke="#294345" stroke-width="7" fill="none"/><circle r="255" stroke="url(#ring)" stroke-width="135" fill="none"/><circle r="126" stroke="#8dada6" stroke-width="17" fill="none"/><circle r="43" fill="#191f24"/></g>
<rect x="70" y="145" width="820" height="1365" stroke="#65877c" opacity=".12" fill="none" stroke-dasharray="8 16"/>
''']
    for e in graphics:
        font = {'title': 64, 'headline': 51, 'kicker': 24, 'disclaimer':19}[e['kind']]
        weight = 800 if e['kind'] in ('title','headline') else 600
        y = e['y'] + font
        color = '#c3d4d1' if e['kind']=='disclaimer' else '#f2f7f5'
        for line in e['text'].split('\n'):
            result.append(f'<text x="{e["x"]}" y="{y}" font-family="Arial,Helvetica,sans-serif" font-size="{font}" font-weight="{weight}" fill="{color}">{escape(line)}</text>')
            y += 75
    for e in labels:
        x = 76 if e['side']=='left' else 598
        y = 1230 if e['row']==0 else 1360
        result.append(f'<path d="M{x} {y} h285" stroke="#91f0ce" stroke-width="2"/><text x="{x}" y="{y+42}" font-family="Arial,Helvetica,sans-serif" font-size="23" font-weight="700" fill="#f2f7f5">{escape(e["text"])}</text>')
    result.append(f'<g opacity=".78"><rect x="68" y="1723" width="945" height="90" rx="12" fill="#101d22"/><text x="88" y="1759" font-family="Arial" font-size="24" fill="#91f0ce">LAYOUT / PLACEHOLDER — NOT NATIVE 3D FOOTAGE</text><text x="88" y="1791" font-family="Arial" font-size="19" fill="#aebebb">FRAME {frame} · FILM QA PENDING</text></g></svg>')
    return ''.join(result)

if __name__=='__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cues', type=Path, default=Path('src/brakes001/graphics/graphics-cues.json'))
    parser.add_argument('--output', type=Path, default=Path('production/videos/carbon-ceramic-001/qa/proofs'))
    args=parser.parse_args()
    data=json.loads(args.cues.read_text(encoding='utf-8'))
    args.output.mkdir(parents=True,exist_ok=True)
    for frame in FRAME_TARGETS:
        path = args.output/f'layout-frame-{frame:03d}.svg'
        path.write_text(generate(data,frame),encoding='utf-8')
        print(path)
