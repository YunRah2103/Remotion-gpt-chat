#!/usr/bin/env python3
"""Exact Agent B v1 contract: Y-UP +Z FRONT offsets, 450 pure frame functions.
Scene scaling 0.01 units/mm. Data is RELATIVE to each named GLB anchor.
"""
import json, pathlib
ROOT=pathlib.Path(__file__).resolve().parent
OUT=ROOT.parent/"assets"
FRAMES=450
PARTS={
 "FAN_LEFT":     {"startFrame":90, "endFrame":162, "delta":[-.120,.025,.430]},
 "FAN_CENTER":   {"startFrame":94, "endFrame":164, "delta":[0,.045,.460]},
 "FAN_RIGHT":    {"startFrame":98, "endFrame":166, "delta":[.120,.025,.430]},
 "FRONT_SHROUD": {"startFrame":125,"endFrame":179,"delta":[0,.020,.660]},
 "HEATSINK":     {"startFrame":184,"endFrame":250,"delta":[0,.050,.220]},
 "GPU_DIE":      {"startFrame":216,"endFrame":282,"delta":[0,.005,.130]},
 "VRAM_CHIPS":   {"startFrame":236,"endFrame":298,"delta":[0,0,.160]},
 "PCB_ASSEMBLY": {"startFrame":260,"endFrame":322,"delta":[0,-.020,-.100]},
 "BACKPLATE":    {"startFrame":284,"endFrame":329,"delta":[0,0,-.620]}
}
def smooth(t):
 t=max(0,min(1,float(t)))
 return t*t*(3-2*t)
def offset(name,frame):
 p=PARTS[name]
 t=smooth((int(frame)-p["startFrame"])/(p["endFrame"]-p["startFrame"]))
 return [round(v*t,7) for v in p["delta"]]
def make():
 return {"schemaVersion":1,"fps":30,"durationInFrames":FRAMES,
  "model":"XFX SWIFT RX-96TS316B7 Black Triple Fan 16GB",
  "sceneUnitsPerMillimetre":0.01,
  "axes":"GLB and JSON: +X fan length right, +Y up, +Z out toward viewer",
  "positionsAreRelativeDeltas":True,"rotationUnits":"radians",
  "nodes":{name:{"startFrame":cfg["startFrame"],"endFrame":cfg["endFrame"],
    "from":{"position":[0,0,0],"rotation":[0,0,0]},
    "to":{"position":cfg["delta"],"rotation":[0,0,0]},
    "easing":"smoothstep"} for name,cfg in PARTS.items()}}
if __name__=="__main__":
 OUT.mkdir(exist_ok=True,parents=True)
 path=OUT/"decomposition.json"
 path.write_text(json.dumps(make(),indent=2))
 assert len(PARTS)==9 and all(offset(n,0)==[0,0,0] for n in PARTS)
 assert all(offset(n,449)==PARTS[n]["delta"] for n in PARTS)
 print("MOTION_PASS",FRAMES,len(PARTS),"node trajectories =>",path)
