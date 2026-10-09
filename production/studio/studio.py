#!/usr/bin/env python3
"""Automotive Engineering Studio: reference review, model inventories, mechanical telemetry and library registration."""
import argparse
import csv
import hashlib
import html
import json
import math
import re
import struct
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def slug(value):
    if not isinstance(value, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,64}", value):
        raise ValueError("Invalid safe ID")
    return value

def gallery(source, destination):
    """Offline reference gallery from an existing Media Bridge artifact, never re-downloads assets."""
    root, out = Path(source), Path(destination)
    manifest = load_json(root / "manifest.json")
    slug(manifest["request_id"])
    out.mkdir(parents=True, exist_ok=True)
    assets = out / "media"
    assets.mkdir(exist_ok=True)
    cards = []
    for entry in manifest["items"]:
        key=slug(entry["id"])
        pictures=[entry["preview"]] + entry.get("frames", [])
        validated=[]
        for i, rel in enumerate(dict.fromkeys(pictures)):
            p=(root / rel).resolve()
            if root.resolve() not in p.parents or p.suffix.lower() not in {".jpg",".jpeg",".png",".webp"} or not p.is_file():
                raise ValueError("Invalid preview path")
            with Image.open(p) as image:
                image.verify()
            name=f"{key}-{i}.jpg"
            with Image.open(p) as image:
                ImageOps.contain(image.convert("RGB"),(600,800)).save(assets/name,quality=82)
            validated.append("media/"+name)
        src = html.escape(entry["source_url"],quote=True)
        if not src.startswith("https://"):
            raise ValueError("Source URL must be HTTPS")
        images="".join(f'<img loading="lazy" src="{html.escape(p,quote=True)}" alt="Reference frame">' for p in validated)
        cards.append(f'<article><h2>{html.escape(key)}</h2><p>{html.escape(entry["license"])} • {html.escape(entry.get("attribution",""))}</p><a href="{src}" rel="noopener noreferrer" target="_blank">Original source</a><div class="frames">{images}</div></article>')
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Engineering reference gallery</title><style>body{margin:0;background:#111923;color:#e8eef4;font:16px/1.5 system-ui}main{max-width:1100px;margin:auto;padding:35px}article{background:#202b37;border-radius:16px;padding:24px;margin:22px 0}a{color:#a2d3ff}.frames{display:flex;gap:10px;overflow:auto;margin-top:16px}.frames img{max-width:220px;max-height:360px;object-fit:contain;border-radius:9px;background:#101820}</style><main><h1>Automotive Engineering — References</h1><p>Research-only images; check original source and reuse rights before publication.</p>'''+"".join(cards)+"</main></html>"
    (out / "index.html").write_text(page,encoding="utf-8")
    (out / "manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    return {"references":len(cards),"gallery":str(out/"index.html")}

def glb_json(path):
    """Read GLB JSON chunk, reject malformed lengths; no model rendering dependency."""
    with Path(path).open("rb") as f:
        h=f.read(20)
        if len(h)!=20 or h[:4]!=b"glTF":
            raise ValueError("Not GLB")
        version,total,chunk,kind=struct.unpack_from("<IIII",h,4)
        if version!=2 or total!=Path(path).stat().st_size or kind!=0x4E4F534A or chunk>32_000_000:
            raise ValueError("Invalid GLB header/JSON")
        data=f.read(chunk)
    return json.loads(data)

def inspect_glb(path, output):
    scene=glb_json(path)
    nodes=scene.get("nodes",[])
    meshes=scene.get("meshes",[])
    mats=scene.get("materials",[])
    parents={}
    for i,n in enumerate(nodes):
        for child in n.get("children",[]):
            if child<0 or child>=len(nodes) or child in parents: raise ValueError("Broken GLB hierarchy")
            parents[child]=i
    roots=[i for i in range(len(nodes)) if i not in parents]
    lines=[]
    def visit(i,depth,chain):
        if i in chain: raise ValueError("Cycle in GLB nodes")
        lines.append("  "*depth + "- " + str(nodes[i].get("name",f"node-{i}")))
        for child in nodes[i].get("children",[]):visit(child,depth+1,chain|{i})
    for i in roots:visit(i,0,set())
    result={"file":Path(path).name,"sha256":hashlib.sha256(Path(path).read_bytes()).hexdigest(),
            "nodes":len(nodes),"meshes":len(meshes),"materials":len(mats),"roots":len(roots),
            "meshNames":[str(x.get("name","")) for x in meshes],
            "materialNames":[str(x.get("name","")) for x in mats],
            "requiredAnimations":[str(x.get("name","")) for x in scene.get("animations",[])],
            "warning":"GLB structure inspection is not a physical accuracy or native render PASS."}
    dest=Path(output);dest.mkdir(parents=True,exist_ok=True)
    (dest/"inspection.json").write_text(json.dumps(result,indent=2)+"\n")
    (dest/"hierarchy.md").write_text("# GLB hierarchy\n\n"+"\n".join(lines)+"\n")
    return result

def detect_scenes(video,output,max_frames=16,threshold=.35):
    """Native FFmpeg scene-score selection, capped output; fallback samples for static video."""
    dest=Path(output);dest.mkdir(parents=True,exist_ok=True)
    if not 0.05<=threshold<=.8 or not 1<=max_frames<=24:
        raise ValueError("Invalid scene-extraction setting")
    meta=json.loads(subprocess.run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(video)],check=True,capture_output=True,text=True).stdout)
    if len([s for s in meta["streams"] if s.get("codec_type")=="video"])!=1:
        raise ValueError("Expected one video stream")
    duration=float(meta["format"].get("duration",0))
    if not 0<duration<=360:raise ValueError("Video duration out of reference range")
    command=["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y","-i",str(video),
             "-vf",f"select='gt(scene,{threshold})',scale=480:-2","-vsync","vfr",
             "-frames:v",str(max_frames),str(dest/"scene-%03d.jpg")]
    subprocess.run(command,check=True,timeout=90,capture_output=True)
    paths=sorted(dest.glob("scene-*.jpg"))
    if not paths:
        # A static or continuous-shot reference still deserves spatially useful visual samples.
        for i,frac in enumerate((.1,.35,.6,.85)):
            p=dest/f"scene-{i+1:03d}.jpg"
            subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y",
                            "-ss",str(duration*frac),"-i",str(video),"-frames:v","1",
                            "-vf","scale=480:-2",str(p)],check=True,timeout=50,capture_output=True)
        paths=sorted(dest.glob("scene-*.jpg"))
    # Report counts rather than pretending to have done semantic image understanding.
    details={"video":Path(video).name,"sceneFrames":len(paths),
             "method":"ffmpeg histogram scene-score; fall back to evenly timed stills"}
    (dest/"scene-report.json").write_text(json.dumps(details,indent=2)+"\n")
    return details

def audit_telemetry(path,output):
    """Checks observable kinematics; requires authored measured/simulated telemetry, not a truth oracle."""
    with Path(path).open(newline="") as f: rows=list(csv.DictReader(f))
    if not 2<=len(rows)<=15000:raise ValueError("Expected 2–15000 samples")
    required={"time_s","vehicle_speed_mps","wheel_omega_rad_s","wheel_radius_m","brake_pressure"}
    if not required.issubset(rows[0]):raise ValueError("Missing telemetry columns")
    issues=[]; previous=None; severe=0.0
    for i,r in enumerate(rows):
        vals={k:float(r[k]) for k in required}
        if any(not math.isfinite(v) for v in vals.values()):raise ValueError("Nonfinite telemetry")
        if vals["wheel_radius_m"]<=0 or not 0<=vals["brake_pressure"]<=1 or vals["time_s"]<0:
            raise ValueError("Invalid physical range at sample "+str(i))
        if previous and vals["time_s"]<=previous["time_s"]:raise ValueError("Non-increasing time")
        # Longitudinal kinematic slip proxy; no road-force/traction inference.
        if vals["vehicle_speed_mps"]>2:
            slip=abs(vals["vehicle_speed_mps"]-vals["wheel_omega_rad_s"]*vals["wheel_radius_m"])/vals["vehicle_speed_mps"]
            if slip>.7 and previous:
                severe+=vals["time_s"]-previous["time_s"]
            else: severe=0
            if severe>.2 and not any(x["code"]=="sustained_lockup" for x in issues):
                issues.append({"code":"sustained_lockup","sample":i,
                               "note":"Possible extended wheel lock at nonzero vehicle speed"})
        if "spring_compression_m" in r and r["spring_compression_m"] not in ("",None):
            if abs(float(r["spring_compression_m"]))>.4:
                issues.append({"code":"suspension_travel","sample":i,
                               "note":"Extreme travel; verify design-specific limits"})
        previous=vals
    result={"samples":len(rows),"issues":issues,
            "interpretation":"Heuristic kinematic checks only; model limits must be verified for each mechanism."}
    dest=Path(output);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,indent=2)+"\n")
    return result

def register_model(asset,meta,out):
    """Propose an entry; never silently publish or merge unverified artefacts."""
    data=load_json(meta)
    key=slug(data.get("id"))
    if not isinstance(data.get("title"),str) or not data["title"].strip():
        raise ValueError("Missing title")
    if not isinstance(data.get("units"),str) or data["units"] not in {"metres","millimetres","centimetres"}:
        raise ValueError("Declare model units")
    for k in ("license","source","verified_by"):
        if not isinstance(data.get(k),str) or not data[k].strip():raise ValueError("Missing "+k)
    asset=Path(asset)
    if not asset.is_file() or asset.suffix.lower()!=".glb" or asset.stat().st_size>120*1024*1024:
        raise ValueError("Missing or oversized .glb")
    detail={"schemaVersion":1,"id":key,"title":data["title"],"units":data["units"],
            "license":data["license"],"source":data["source"],
            "verified_by":data["verified_by"],"asset_sha256":hashlib.sha256(asset.read_bytes()).hexdigest(),
            "filesize":asset.stat().st_size,"node_count":len(glb_json(asset).get("nodes",[])),
            "animations":data.get("animations",[]),"connection_points":data.get("connection_points",[]),
            "status":"candidate-for-manual-review"}
    p=Path(out);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(detail,indent=2)+"\n")
    return detail

def main():
    p=argparse.ArgumentParser()
    sub=p.add_subparsers(dest="action",required=True)
    for name,inputs in (("gallery",("source","output")),("inspect",("glb","output")),
                        ("scenes",("video","output")),("telemetry",("csv","output")),
                        ("register",("glb","metadata","output"))):
        q=sub.add_parser(name)
        for arg in inputs:q.add_argument(arg)
    x=p.parse_args()
    if x.action=="gallery":r=gallery(x.source,x.output)
    elif x.action=="inspect":r=inspect_glb(x.glb,x.output)
    elif x.action=="scenes":r=detect_scenes(x.video,x.output)
    elif x.action=="telemetry":r=audit_telemetry(x.csv,x.output)
    else:r=register_model(x.glb,x.metadata,x.output)
    print(json.dumps(r,indent=2))

if __name__=="__main__":main()
