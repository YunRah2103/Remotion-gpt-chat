#!/usr/bin/env python3
"""Safe, OPT-IN glTF Transform optimizer with anchor checks; never overwrites input."""
import argparse
import json
import subprocess
from pathlib import Path
from gltf_guard import CANONICAL_GPU_ANCHORS, compare

def optimize(original,output,method="dedup",gpu_anchors=False):
    original=Path(original); output=Path(output)
    if not original.is_file():raise FileNotFoundError(original)
    if original.resolve()==output.resolve():raise ValueError("Never overwrite the source GLB")
    if method not in ("dedup","meshopt"):raise ValueError("Unapproved method")
    output.parent.mkdir(parents=True,exist_ok=True)
    command=["npx","--yes","--package=@gltf-transform/cli@4.5.1","gltf-transform",
             method,str(original),str(output)]
    subprocess.run(command,check=True)
    result=compare(original,output,CANONICAL_GPU_ANCHORS if gpu_anchors else ())
    result.update({"originalBytes":original.stat().st_size,"optimizedBytes":output.stat().st_size,
                   "method":method,
                   "meshoptRequiresRuntimeDecoder":method=="meshopt"})
    return result

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("original");p.add_argument("optimized")
    p.add_argument("--method",choices=["dedup","meshopt"],default="dedup")
    p.add_argument("--gpu-anchors",action="store_true")
    p.add_argument("--report",default="out/production/model-optimisation.json")
    x=p.parse_args()
    data=optimize(x.original,x.optimized,x.method,x.gpu_anchors)
    Path(x.report).parent.mkdir(parents=True,exist_ok=True)
    Path(x.report).write_text(json.dumps(data,indent=2)+"\n")
    print(json.dumps(data,indent=2))
