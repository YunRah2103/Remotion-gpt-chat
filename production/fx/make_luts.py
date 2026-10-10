#!/usr/bin/env python3
"""Generate original 3D .cube colour grades deterministically (not third-party LUTs).

Use FFmpeg lut3d to grade a final mezzanine ONCE. 17-point cubes are fast to render.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path

PRESETS={
    "natural-punch": {"contrast":1.055,"sat":1.035,"shadow":[1.0,1.0,1.012],"highlight":[1.01,1.015,1.01],"lift":0.002},
    "classic-archive": {"contrast":1.045,"sat":.88,"shadow":[1.02,1.005,.99],"highlight":[1.015,1.008,.99],"lift":0.01},
    "warm-vintage": {"contrast":1.04,"sat":.92,"shadow":[1.018,1.0,.985],"highlight":[1.04,1.018,.995],"lift":.003},
    "titanium-modern": {"contrast":1.08,"sat":.95,"shadow":[.985,1.0,1.035],"highlight":[1.01,1.012,1.02],"lift":0.002},
    "night-circuit": {"contrast":1.11,"sat":.92,"shadow":[.97,.993,1.055],"highlight":[1.005,1.015,1.028],"lift":.001}
}

def limit(x):
    return max(0.,min(1.,x))

def grade(rgb,setting):
    mid=.5
    after=[limit((v-mid)*setting["contrast"]+mid+setting["lift"]) for v in rgb]
    luma=after[0]*.2126+after[1]*.7152+after[2]*.0722
    sat=setting["sat"]
    adjusted=[limit(luma+(v-luma)*sat) for v in after]
    # Shadow-to-highlight smooth split; split itself depends on pixel luminance.
    shw=1-limit(luma)
    high=1-shw
    return [limit(adjusted[i]*(setting["shadow"][i]*shw+setting["highlight"][i]*high)) for i in range(3)]

def cube(name,setting,size):
    lines=[f"TITLE \"Automotive {name}\"","LUT_3D_SIZE "+str(size),"DOMAIN_MIN 0.0 0.0 0.0","DOMAIN_MAX 1.0 1.0 1.0"]
    # .cube order: RED axis fastest.
    for b in range(size):
        for g in range(size):
            for r in range(size):
                graded=grade([r/(size-1),g/(size-1),b/(size-1)],setting)
                lines.append(" ".join(f"{v:.7f}" for v in graded))
    return "\n".join(lines)+"\n"

def generate(directory,size=17):
    if size not in (17,33):raise ValueError("LUT size must be 17 or 33")
    output=Path(directory);output.mkdir(parents=True,exist_ok=True)
    manifest={"schemaVersion":1,"colourSpace":"sRGB approximate/gamma-encoded input (not linear light, HDR, or calibrated camera log)",
              "gammaAssumption":"Standard Rec.709 SDR-oriented source and output, inspect source log/colour metadata before application",
              "size":size,"presets":[]}
    for name,values in PRESETS.items():
        path=output/(name+".cube")
        path.write_text(cube(name,values,size),encoding="ascii")
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        manifest["presets"].append({"name":name,"path":path.name,"sha256":digest,"bytes":path.stat().st_size})
    (output/"lut-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    return manifest

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",default="out/fx-luts")
    p.add_argument("--size",type=int,default=17,choices=[17,33])
    x=p.parse_args()
    result=generate(x.out,x.size)
    print(json.dumps(result,indent=2))
