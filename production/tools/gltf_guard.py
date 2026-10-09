#!/usr/bin/env python3
"""Minimal glTF/GLB structure guard; keeps canonical mechanical animation anchors."""
import argparse
import json
import struct
from pathlib import Path

CANONICAL_GPU_ANCHORS = [
    "GPU_ROOT","FAN_ASSEMBLY","FAN_LEFT","FAN_CENTER","FAN_RIGHT",
    "FRONT_SHROUD","HEATSINK","HEATSINK_FINS","HEATPIPE_BUNDLE","COLD_PLATE",
    "PCB_ASSEMBLY","PCB","GPU_DIE","VRAM_CHIPS","VRM_COMPONENTS",
    "PCIE_FINGERS","POWER_8PIN","IO_BRACKET","BACKPLATE"
]

def glb_json(path):
    data=Path(path).read_bytes()
    if len(data)<20 or data[:4]!=b"glTF":raise ValueError("Not a binary glTF")
    magic,version,length=struct.unpack_from("<III",data)
    if version!=2 or length!=len(data):raise ValueError("Malformed GLB header")
    chunk_len,chunk_type=struct.unpack_from("<II",data,12)
    if chunk_type!=0x4E4F534A or 20+chunk_len>len(data):raise ValueError("GLB JSON chunk missing")
    return json.loads(data[20:20+chunk_len])

def summary(path, required=()):
    doc=glb_json(path)
    names=[n.get("name","") for n in doc.get("nodes",[])]
    for anchor in required:
        if names.count(anchor)!=1:raise ValueError(f"GLB requires exactly one {anchor}; got {names.count(anchor)}")
    return {"file":str(path),"nodes":len(names),"meshes":len(doc.get("meshes",[])),
            "materials":len(doc.get("materials",[])),"requiredAnchorsVerified":list(required)}

def compare(original,candidate,required=()):
    old=glb_json(original)
    new=glb_json(candidate)
    def anchor_parents(doc):
        nodes=doc.get("nodes",[])
        parents={child:index for index,n in enumerate(nodes) for child in n.get("children",[])}
        names={n.get("name",""):i for i,n in enumerate(nodes)}
        result={}
        for anchor in required:
            i=names.get(anchor)
            if i is None:raise ValueError("Anchor absent: "+anchor)
            chain=[]
            seen=set()
            while i in parents:
                i=parents[i]
                if i in seen:raise ValueError("Cycle")
                seen.add(i)
                chain.append(nodes[i].get("name",""))
            result[anchor]=chain
        return result
    summary(original,required);summary(candidate,required)
    if anchor_parents(old)!=anchor_parents(new):raise ValueError("Compressed model changed anchor parents")
    return summary(candidate,required)

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("input");p.add_argument("--compare")
    p.add_argument("--gpu-anchors",action="store_true")
    x=p.parse_args()
    required=CANONICAL_GPU_ANCHORS if x.gpu_anchors else []
    print(json.dumps(compare(x.input,x.compare,required) if x.compare else summary(x.input,required),indent=2))
