#!/usr/bin/env python3
"""Validate source-scene contracts for original mechanical Blender / GLB handoffs."""
import argparse
import json
import re
from pathlib import Path

def validate(config):
    if not isinstance(config,dict) or config.get("schemaVersion")!=1:
        raise ValueError("Contract schemaVersion must be 1")
    key=config.get("id")
    if not isinstance(key,str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,55}",key):
        raise ValueError("Invalid asset ID")
    if config.get("units") not in ("metres","centimetres","millimetres"):
        raise ValueError("Explicit asset units required")
    parts=config.get("movingParts")
    if not isinstance(parts,list) or len(parts)>80:
        raise ValueError("movingParts must be a list of at most 80")
    names=set()
    for part in parts:
        if not isinstance(part,dict) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.-]{0,80}",str(part.get("name",""))):
            raise ValueError("Invalid moving-part object name")
        if part["name"] in names:raise ValueError("Duplicate moving part")
        names.add(part["name"])
        if part.get("mode") not in ("rotation","translation"):
            raise ValueError("Part mode must be rotation or translation")
        axis=part.get("axis")
        if not isinstance(axis,list) or len(axis)!=3 or any(type(x) not in (float,int) for x in axis) or sum(x*x for x in axis)<.95 or sum(x*x for x in axis)>1.05:
            raise ValueError("Part axis must be an approximately unit XYZ vector")
        for key in ("start","end"):
            value=part.get(key)
            if type(value) not in (float,int) or abs(value)>10000:
                raise ValueError("Invalid animated range")
        if type(part.get("frameStart"))!=int or type(part.get("frameEnd"))!=int or not 0<=part["frameStart"]<part["frameEnd"]<=10000:
            raise ValueError("Invalid part timeline")
    source=config.get("source")
    if not isinstance(source,str) or not 5<=len(source)<=300:
        raise ValueError("Document original source/provenance")
    return config

def document(config,path):
    config=validate(config)
    output=Path(path);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(config,indent=2)+"\n")
    return output

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("config");p.add_argument("--output")
    x=p.parse_args();data=validate(json.loads(Path(x.config).read_text()))
    if x.output:document(data,x.output)
    print(json.dumps({"status":"PASS","asset":data["id"],"parts":len(data["movingParts"])}))
