#!/usr/bin/env python3
"""GPU POLISH05 — machine preflight only. NEVER declares visual PASS."""
from __future__ import annotations
from pathlib import Path
from collections import Counter
import hashlib,json,re,struct,sys,math

REQ="GPU_ROOT FAN_ASSEMBLY FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE GPU_DIE VRAM_CHIPS VRM_COMPONENTS PCB_ASSEMBLY PCB PCIE_FINGERS POWER_8PIN IO_BRACKET BACKPLATE".split()
MOVING="FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE GPU_DIE VRAM_CHIPS VRM_COMPONENTS PCB_ASSEMBLY BACKPLATE".split()
SHA40=re.compile(r"^[0-9a-f]{40}$");SHA64=re.compile(r"^[0-9a-f]{64}$")
CONTRACT="5f512efbacaa0446df37fc5c4c07bd3f031fe84a"
def sha(path):
    h=hashlib.sha256()
    with Path(path).open("rb") as f:
        for c in iter(lambda:f.read(1024*1024),b""):h.update(c)
    return h.hexdigest()
def need(condition,reason):
    if not condition:raise ValueError(reason)
def lock(path):
    x=json.loads(Path(path).read_text())
    need(x.get("contractVersion")=="POLISH05-v1","wrong version")
    need(x.get("contractCommitSha")==CONTRACT,"wrong contract version/sha")
    phase=x.get("status")
    need(phase in ("await-model","model-verified","render-approved","release-candidate","release-approved"),"bad phase")
    if phase!="await-model":
        for k in ("hardwareSourceSha",):
            need(isinstance(x.get(k),str) and SHA40.fullmatch(x[k]),"bad "+k)
        for k in ("glbSha256","motionSha256","managerSceneSha256","managerCameraSha256"):
            need(isinstance(x.get(k),str) and SHA64.fullmatch(x[k]),"bad "+k)
        for k in ("hardwareArtifactRunId","hardwareArtifactId"):
            need(type(x.get(k))==int and x[k]>0,"bad "+k)
        need(isinstance(x.get("hardwareArtifactName"),str) and len(x["hardwareArtifactName"])>3,"bad hardware artifact name")
        need(isinstance(x.get("motionCompatibilityAudit"),str) and x["motionCompatibilityAudit"].startswith("gpu-decompose/polish5/"),"missing compatibility report")
    if phase in ("render-approved","release-candidate","release-approved"):
        need(x.get("renderApproved") is True,"native render not authorized")
        for k in ("nativeProofRunId","nativeProofArtifactId"):
            need(type(x.get(k))==int and x[k]>0,"missing native proof run/artifact "+k)
        s=x.get("nativeReviewSha256")
        need(isinstance(s,str) and SHA64.fullmatch(s),"missing independent review digest")
        report=Path(x.get("nativeReviewPath","gpu-decompose/polish5/manager/NATIVE_VISUAL_REVIEW.md"))
        need(report.is_file() and sha(report)==s,"unverified independent native visual report")
        need("RENDER_APPROVED" in report.read_text(),"report does not authorize full render")
    print(json.dumps({"phase":phase,"contract":"PASS","hardwareSha":x.get("hardwareSourceSha"),
                     "glbSha256":x.get("glbSha256"),"motionSha256":x.get("motionSha256")},indent=2))
    return x
def glb_json(path):
    p=Path(path)
    need(p.is_file() and p.stat().st_size>20000,"missing/too-small actual GLB")
    with p.open("rb") as f:
        h=f.read(20)
        need(len(h)==20 and h[:4]==b"glTF","not binary glTF")
        ver,total=struct.unpack_from("<II",h,4)
        need(ver==2 and total==p.stat().st_size,"invalid GLB version/total length")
        n,kind=struct.unpack_from("<I4s",h,12)
        need(kind==b"JSON" and n>100,"missing glTF JSON chunk")
        doc=json.loads(f.read(n))
    return doc
def assets(path,lockfile):
    root=Path(path);x=lock(lockfile)
    need(x["status"]!="await-model","model not independently verified")
    g=root/"xfx_swift_rx9060xt_polish5.glb"
    m=root/"decomposition.v1.json"
    need(sha(g)==x["glbSha256"],"FINAL POLISH05 GLB SHA256 DOES NOT MATCH A")
    need(sha(m)==x["motionSha256"],"FINAL POLISH05 motion SHA256 mismatch")
    for rel,key in (("src/gpu-polish5/GpuDecompositionPolish5.tsx","managerSceneSha256"),
                    ("src/gpu-polish5/camera.ts","managerCameraSha256")):
        need(sha(rel)==x[key],"source drift: "+rel)
    doc=glb_json(g)
    nodes=doc.get("nodes",[])
    names=Counter(n.get("name","") for n in nodes)
    for name in REQ:
        need(names[name]==1,f"required unique node {name} found {names[name]}")
    need(len(doc.get("meshes",[]))>=12,"insufficient real 3D component meshes")
    need(len(doc.get("materials",[]))>=4,"insufficient differentiated GLB materials")
    need(len(doc.get("scenes",[]))>0 and bool(nodes),"missing glTF scene")
    for n in nodes:
        for k in ("translation","rotation","scale"):
            if k in n:need(all(isinstance(t,(int,float)) and math.isfinite(t) for t in n[k]),"nonfinite "+k)
    anim=json.loads(m.read_text())
    need((anim.get("schemaVersion"),anim.get("fps"),anim.get("durationInFrames"))==(1,30,450),"wrong animation schedule")
    need(anim.get("compatibilityStatus") in (("CANDIDATE_POLISH05_A_ANCHORS_VERIFIED","FINAL_POLISH05_A_VERIFIED") if x["status"]=="model-verified" else ("FINAL_POLISH05_A_VERIFIED",)),"motion not compatible with current render gate")
    need(set(anim.get("nodes",{}))==set(MOVING),"wrong 13 moving hardware anchors")
    for name,move in anim["nodes"].items():
        a,b=move.get("startFrame"),move.get("endFrame")
        need(type(a)==int and type(b)==int and 90<=a<b<=329 and move.get("easing")=="smoothstep","bad movement "+name)
        for typ in ("from","to"):
            pos=move[typ]
            for attr in ("position","rotation"):
                val=pos[attr]
                need(len(val)==3 and all(isinstance(t,(int,float)) and math.isfinite(t) for t in val),f"bad {name}.{typ}.{attr}")
        need(all(abs(v)<1e-7 for v in move["from"]["position"]+move["from"]["rotation"]),"nonzero rest delta "+name)
    scene=Path("src/gpu-polish5/GpuDecompositionPolish5.tsx").read_text()
    need("xfx_swift_rx9060xt_polish5.glb" in scene and "decomposition.v1.json" in scene,"scene does not point to exact new GLB + motion")
    need("polish4.glb" not in scene and "polish3.glb" not in scene,"legacy fallback in POLISH05 scene")
    need(Path(x["motionCompatibilityAudit"]).is_file(),"motion compatibility audit missing")
    print(json.dumps({"phase":x["status"],"assets":"PASS (technical only, NOT visual)","glbBytes":g.stat().st_size,
         "nodes":len(nodes),"meshes":len(doc.get("meshes",[])),"materials":len(doc.get("materials",[])),
         "uniqueAnchors":len(REQ),"motionTracks":len(MOVING),"glbSha256":sha(g),"motionSha256":sha(m)},indent=2))
if __name__=="__main__":
    try:
        if len(sys.argv)==3 and sys.argv[1]=="lock":lock(sys.argv[2])
        elif len(sys.argv)==4 and sys.argv[1]=="assets":assets(sys.argv[2],sys.argv[3])
        else:raise ValueError("usage: verify_polish5.py lock LOCK.json | assets STAGED_DIR LOCK.json")
    except Exception as exc:
        print("POLISH05 HARD GATE FAILED: "+str(exc),file=sys.stderr);sys.exit(1)
