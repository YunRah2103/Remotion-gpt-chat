#!/usr/bin/env python3
"""Deterministic 450-frame exploded motion. Blender coordinates: X length, Y thickness (front=-Y), Z height.
Each group has a world-neutral parent at (0,0,0); displacement is applied to the parent.
Three.js/Y-up conversion of a displacement is [x,z,-y]. No stochastic simulation.
"""
import json, math, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parent
FRAMES=450
PARTS={
 "SHROUD":            {"start":90,"end":179,"delta":[0.00,-0.50,0.00]},
 "FAN_LEFT":          {"start":96,"end":178,"delta":[-0.075,-1.06,0.045]},
 "FAN_CENTER":        {"start":101,"end":179,"delta":[0.00,-1.09,0.095]},
 "FAN_RIGHT":         {"start":106,"end":179,"delta":[0.075,-1.06,0.045]},
 "HEATSINK":          {"start":180,"end":269,"delta":[0.00,0.04,0.00]},
 "HEATPIPES":         {"start":200,"end":304,"delta":[0.00,0.37,0.00]},
 "GPU_PROCESSOR":     {"start":228,"end":324,"delta":[-0.035,0.61,0.005]},
 "VRAM":              {"start":228,"end":324,"delta":[0.01,0.61,0.00]},
 "PCB":               {"start":252,"end":346,"delta":[0.00,0.94,0.00]},
 "PCIE_CONNECTOR":    {"start":252,"end":346,"delta":[0.00,0.94,0.00]},
 "BACKPLATE":         {"start":280,"end":380,"delta":[0.00,1.30,0.00]}
}
def smooth(t):
 t=min(1,max(0,t))
 return t*t*(3-2*t)
def offset(name,frame):
 p=PARTS[name];t=smooth((frame-p["start"])/float(p["end"]-p["start"]))
 return [round(v*t,7) for v in p["delta"]]
def export(path):
 obj={"version":1,"model":"XFX RX-96TS316B7","frames":FRAMES,"fps":30,
   "units":"1 Blender unit = 100 mm","axes":"Blender: X length, -Y front, Z up",
   "threejs_offset":"[x,z,-y] for GLTF/Y-up scene displacements",
   "source_accuracy":"Outer 290x124x49mm and three fans verified; inner layers estimated",
   "parts":PARTS,
   "samples":{str(f):{k:offset(k,f) for k in PARTS} for f in range(FRAMES)}}
 pathlib.Path(path).write_text(json.dumps(obj,separators=(",",":")))
 return obj
if __name__=="__main__":
 p=ROOT/"motion.json"
 out=export(p)
 assert all(all(abs(x)<1e-9 for x in offset(n,89)) for n in PARTS)
 assert all(offset(n,449)==PARTS[n]["delta"] for n in PARTS)
 assert offset("SHROUD",140)[1]<0 and offset("PCB",140)==[0.,0.,0.]
 print("MOTION_PASS",len(out["samples"]),"frames",len(PARTS),"groups",str(p))
