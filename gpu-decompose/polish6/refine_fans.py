#!/usr/bin/env python3
"""POLISH06: rebuild POLISH05's 27 baked fan-blade meshes as slimmer, swept,
matte-black rotor blades. Preserve all 19 named animation anchors and every
non-fan mesh. This modifies real binary mesh vertices, not an image overlay."""
import json,math,re,struct,hashlib,sys
from pathlib import Path
BLADE=re.compile(r'^BroadRotorBlade_(\d\d)(?:\.\d\d\d)?$')
def verts(data,g,mesh,key,start):
    a=g['accessors'][g['meshes'][mesh]['primitives'][0]['attributes'][key]]
    v=g['bufferViews'][a['bufferView']]
    assert a['componentType']==5126 and a['type']=='VEC3'
    i=start+v['byteOffset']+a.get('byteOffset',0)
    stride=v.get('byteStride',12)
    return [(i+n*stride,struct.unpack_from('<fff',data,i+n*stride)) for n in range(a['count'])]
def transform(source,target):
    b=bytearray(Path(source).read_bytes())
    assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2
    jl,kind=struct.unpack_from('<I4s',b,12)
    assert kind==b'JSON'
    g=json.loads(b[20:20+jl])
    bi=20+jl
    bl,kind=struct.unpack_from('<I4s',b,bi)
    assert kind==b'BIN\0'
    start=bi+8
    names=[]
    for n in g['nodes']:
        name=n.get('name','')
        if not BLADE.fullmatch(name):continue
        mi=n.get('mesh')
        if mi is None:continue
        suffix=name.split('.')[-1] if '.' in name else '000'
        cx={'000':-.94,'001':0.,'002':.94}[suffix]
        cy=.025
        positions=verts(b,g,mi,'POSITION',start)
        normals=verts(b,g,mi,'NORMAL',start)
        assert len(positions)==len(normals)==56,(name,len(positions))
        ang=[math.atan2(y-cy,x-cx) for _,(x,y,z) in positions
             if .20<math.hypot(x-cx,y-cy)<.40]
        axis=math.atan2(sum(math.sin(a) for a in ang),sum(math.cos(a) for a in ang))
        for (off,(x,y,z)),(no,(nx,ny,nz)) in zip(positions,normals):
            r=math.hypot(x-cx,y-cy)
            theta=math.atan2(y-cy,x-cx)
            d=(theta-axis+math.pi)%(2*math.pi)-math.pi
            t=max(0,min(1,(r-.15)/.29))
            t=t*t*(3-2*t)
            sweep=axis+(1-.47*t)*d-.090*t
            struct.pack_into('<fff',b,off,cx+r*math.cos(sweep),
                             cy+r*math.sin(sweep),.221+(z-.221)*.81)
            a=sweep-theta
            struct.pack_into('<fff',b,no,nx*math.cos(a)-ny*math.sin(a),
                             nx*math.sin(a)+ny*math.cos(a),nz)
        names.append(name)
    assert len(names)==27,len(names)
    for material in g['materials']:
        p=material.get('pbrMetallicRoughness',{})
        mode={
         'M_FAN_BLADE':([.012,.016,.023,1],.015,.91),
         'M_FAN_HUB':([.014,.019,.024,1],.02,.86),
         'M_FAN_LOGOMARK_SILVER':([.19,.22,.25,1],.21,.71),
         'M_FAN_RING':([.014,.017,.021,1],.065,.77),
         'M_P4_HUB_MACHINED_GUNMETAL':([.07,.078,.09,1],.26,.79),
        }.get(material.get('name'))
        if mode:
            p.update(baseColorFactor=mode[0],metallicFactor=mode[1],roughnessFactor=mode[2])
    for n in g['nodes']:
        name=n.get('name','')
        if name.startswith(('Fan_smooth_center_cap_','Fan_hub_chamfer_',
                            'P4_Hub_outer_tooling_ring_','P5_fan_stainless_lockring_')):
            n['scale']=[.81,.81,1.]
        elif name.startswith('Fan_X_silver_insignia_'):
            n['scale']=[.82,.82,1.]
    g['asset']['generator']='POLISH06 fan geometry/material revision, derived from verified POLISH05'
    jb=json.dumps(g,separators=(',',':'),ensure_ascii=False).encode()
    jb+=b' '*((-len(jb))%4)
    bb=bytes(b[start:start+bl])
    bb+=b'\0'*((-len(bb))%4)
    out=struct.pack('<4sII',b'glTF',2,12+8+len(jb)+8+len(bb))+struct.pack('<I4s',len(jb),b'JSON')+jb+struct.pack('<I4s',len(bb),b'BIN\0')+bb
    Path(target).parent.mkdir(parents=True,exist_ok=True)
    Path(target).write_bytes(out)
    print(json.dumps({'fanBladeMeshesRefined':len(names),'glbBytes':len(out),
                      'sha256':hashlib.sha256(out).hexdigest()}))
if __name__=='__main__':
    assert len(sys.argv)==3
    transform(sys.argv[1],sys.argv[2])
