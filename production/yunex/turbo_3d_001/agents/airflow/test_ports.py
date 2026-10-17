#!/usr/bin/env python3
import json,math
from pathlib import Path
d=json.loads(Path(__file__).with_name('flow-ports.json').read_text())
assert d['status']=='TEMPORARY_STUB_UNVERIFIED_A2'
required={'EXHAUST_IN','EXHAUST_OUT','CLEAN_AIR_IN','COMPRESSED_AIR_OUT','INTERCOOLER_IN','INTERCOOLER_OUT','ENGINE_INTAKE','FUEL_IN'}
assert set(d['ports'])==required
for k,v in {**d['ports'],**d['nodes']}.items():
 assert len(v)==3 and all(isinstance(x,(int,float)) and math.isfinite(x) for x in v),k
rs={r['id']:r for r in d['routes']}
assert len(rs)==6
assert rs['exhaust-feed']['downstream']==rs['exhaust-exit']['upstream']=='TURBINE_WHEEL_FLOW'
assert rs['clean-intake']['downstream']==rs['charge-hot']['upstream']=='COMPRESSOR_WHEEL_FLOW'
assert rs['charge-hot']['downstream']=='INTERCOOLER_IN' and rs['charge-cooled']['upstream']=='INTERCOOLER_OUT'
assert rs['charge-cooled']['downstream']==rs['fuel-pulse']['downstream']=='CYLINDER'
for r in rs.values():
 assert {r['upstream'],r['downstream'],*r['via']}<=set(d['ports'])|set(d['nodes'])
 assert (r['gas']=='exhaust') == r['id'].startswith('exhaust')
 assert (r['gas']=='fuel') == (r['id']=='fuel-pulse')
print('PASS: named ports, six directional routes, separated gases and no new cooler air')
