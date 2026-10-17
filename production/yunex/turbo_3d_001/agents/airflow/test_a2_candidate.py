#!/usr/bin/env python3
import json,math
from pathlib import Path
p=Path(__file__).with_name('a2-candidate-routes.json')
d=json.loads(p.read_text())
assert len(d['sourceCommit'])==40
assert 'NOT_MANAGER_APPROVED' in d['approval']
required=['EXHAUST_IN','EXHAUST_OUT','CLEAN_AIR_IN','COMPRESSED_AIR_OUT','INTERCOOLER_IN','INTERCOOLER_OUT','ENGINE_INTAKE','FUEL_IN']
assert all(k in d['ports'] for k in required)
assert set(d['routes'])=={'exhaust-feed','exhaust-exit','clean-intake','charge-hot','charge-cooled','fuel-pulse'}
for id,pts in d['routes'].items():
 assert len(pts)>=2 and all(len(v)==3 and all(math.isfinite(x) for x in v) for v in pts),id
 assert sum(math.dist(a,b) for a,b in zip(pts,pts[1:]))>.1
assert d['routes']['exhaust-exit'][-4]==d['ports']['EXHAUST_OUT']
assert d['routes']['clean-intake'][-3]==d['ports']['CLEAN_AIR_IN']
assert d['routes']['charge-hot'][1]==d['ports']['COMPRESSED_AIR_OUT']
assert d['routes']['charge-hot'][-1]==d['ports']['INTERCOOLER_IN']
assert d['routes']['charge-cooled'][0]==d['ports']['INTERCOOLER_OUT']
assert d['routes']['charge-cooled'][-2]==d['ports']['ENGINE_INTAKE']
assert d['routes']['fuel-pulse'][0]==d['ports']['FUEL_IN']
print('PASS: A2 candidate route endpoints and eight ports match inspected source; rotor geometry still pending visual QC')
