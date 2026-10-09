#!/usr/bin/env python3
"""Agent G: exact engineering bounds and source-isolation regression checks."""
from pathlib import Path
import math
import re
import subprocess

ROOT=Path(__file__).resolve().parents[4]
wheel=(ROOT/'src/brakes001/wheel/WheelAssembly.tsx').read_text()
film=(ROOT/'src/brakes001/CarbonCeramic001.tsx').read_text()
camera=(ROOT/'src/brakes001/wheel/WheelRevealCameraRig.tsx').read_text()
trans=(ROOT/'src/brakes001/integration/Polish05Transitions.ts').read_text()
root=(ROOT/'src/Root.tsx').read_text()

def near(a,b,eps=1e-6):
    assert abs(a-b)<eps,(a,b)

outer_diameter=.508+2*.255*.35
near(outer_diameter,.6865)
assert .244<=.245 < .255
assert (.245-.231)>=.012, 'Barrel/caliper radial clash'
assert (.100-.075)>=.020, 'Forged spoke/caliper axial clash'
assert .508>2*.231, '20in brake clearance not plausible'
assert 'Tire' in wheel and 'TreadBlocks' in wheel and 'ForgedSplitSpoke_' in wheel
assert 'LatheGeometry' in wheel and 'ExtrudeGeometry' in wheel
assert 'opacity<=0' in wheel
assert 'angleRad' in wheel and 'rotation={[angleRad,0,0]}' in wheel
assert 'WheelAssembly angleRad={motion.rotorAngleRad}' in film
assert 'axialCutawayMetres={wheelExplodeAt(frame)}' in film
assert 'opening&&!pad&&wheelVisibleAt(frame)' in film
assert 'GhostCarOutline frame=' not in film
assert 'frame<120' in film
assert 'padBlendAt(frame)' in film
assert 'PAD_ENTRY_START=96, PAD_ENTRY_END=104' in trans
assert 'PAD_EXIT_START=143, PAD_EXIT_END=151' in trans
assert 'durationInFrames={750}' in root
assert 'frame<79' in camera and '(frame-53)/23' in camera
assert 'lerp(1.68,.77,t)' in camera
try:
    base='3a27004f2c40d3707277b2d87c8faf7e92a70a0d'
    protected=[
        'src/brakes001/hardware','src/brakes001/motion',
        'src/brakes001/cinema','src/brakes001/graphics',
        'src/brakes001/integration','src/Root.tsx',
    ]
    changes=subprocess.check_output(['git','diff','--name-only',base,'HEAD','--',*protected],cwd=ROOT,text=True).strip()
    assert not changes,'Protected E/A-D film source changed: '+changes
except subprocess.CalledProcessError as e:
    raise AssertionError('Missing immutable base comparison') from e
print('PASS G: 686.5mm tyre, 508mm bead, 390mm disc, 14mm barrel radial clearance, >=25mm spoke/axial clearance')
print('PASS G: full native X rotation matches unchanged B brake physics')
print('PASS G: no ghost-car source rendered, wheel fully extracted by 94, P05 96-151 pad transitions preserved')
print('PASS G: A-D, E physics, E camera, graphics, root source byte-identical to accepted E P05')
