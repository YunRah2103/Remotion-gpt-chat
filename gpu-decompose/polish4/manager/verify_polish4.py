#!/usr/bin/env python3
"""POLISH04 fail-closed asset/release-lock validator. Does not grant creative approval."""
from __future__ import annotations
import hashlib, json, math, pathlib, re, struct, sys
from collections import Counter
SHA40=re.compile(r"^[0-9a-f]{40}$"); SHA64=re.compile(r"^[0-9a-f]{64}$")
BASE_GLB="21f529ccbe7f4bb69f2df602f7f28b15ef06ba915151bba4468b44ef652097e5"
BASE_MOTION="d70aae4a6f6d637ef93d6fbb9eee6a94be5b9a4e9a65c5c78ff9401fd086187b"
CONTRACT_SHA="102064938a9a45540434c93d9ff03cdcd72f9cba"
REQUIRED="GPU_ROOT FAN_ASSEMBLY FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE PCB_ASSEMBLY PCB GPU_DIE VRAM_CHIPS VRM_COMPONENTS PCIE_FINGERS POWER_8PIN IO_BRACKET BACKPLATE".split()
MOVING="FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK GPU_DIE VRAM_CHIPS PCB_ASSEMBLY BACKPLATE".split()
def digest(path):
    h=hashlib.sha256()
    with pathlib.Path(path).open("rb") as fp:
        for block in iter(lambda: fp.read(1024*1024), b""): h.update(block)
    return h.hexdigest()
def require(pred, msg):
    if not pred: raise ValueError(msg)
def lock_check(file):
    p=pathlib.Path(file);require(p.is_file(),f"missing release lock {file}")
    x=json.loads(p.read_text())
    require(x.get("contractVersion")=="POLISH04-v1","wrong POLISH04 contract")
    require(x.get("contractCommitSha")==CONTRACT_SHA,"contract SHA mismatch")
    require(x.get("status") in ("proofs","release"),"status must be proofs or release")
    for k in ("agentASourceSha","agentBSourceSha","agentCSourceSha","integratedSourceSha"):
        require(isinstance(x.get(k),str) and SHA40.fullmatch(x[k]),f"invalid {k}")
    for k in ("glbSha256","motionSha256","sceneSourceSha256","cameraSourceSha256"):
        require(isinstance(x.get(k),str) and SHA64.fullmatch(x[k]),f"invalid {k}")
    require(x["glbSha256"]!=BASE_GLB,"POLISH03 GLB prohibited as new model")
    require(x["motionSha256"]!=BASE_MOTION,"POLISH03 motion prohibited as new choreography")
    for k in ("hardwareArtifactId","hardwareRunId","cameraProofArtifactId","cameraProofRunId","motionProofArtifactId","motionProofRunId"):
        require(type(x.get(k)) is int and x[k]>0,f"invalid {k}")
    require(isinstance(x.get("hardwareArtifactName"),str) and x["hardwareArtifactName"],"missing hardware artifact name")
    for k in ("sceneSourcePath","cameraSourcePath"):
        p=x.get(k)
        require(isinstance(p,str) and p.startswith("src/gpu-polish4/") and ".." not in p,f"invalid {k}")
    if x["status"]=="release":
        require(x.get("renderApproved") is True and x.get("independentVisualQa")=="PASS","independent proof review not approved")
        for k in ("nativeIntegratedProofRunId","nativeIntegratedProofArtifactId"):
            require(type(x.get(k)) is int and x[k]>0,f"missing {k}")
        require(isinstance(x.get("qaReportSha256"),str) and SHA64.fullmatch(x["qaReportSha256"]),"missing proof QA report hash")
    print(json.dumps({"phase":x["status"],"lock":"PASS","A":x["agentASourceSha"],"B":x["agentBSourceSha"],"C":x["agentCSourceSha"]},indent=2))
    return x
def glb_document(path):
    with path.open("rb") as f:
        header=f.read(20)
        require(len(header)==20 and header[:4]==b"glTF","not binary glTF")
        version,length=struct.unpack_from("<II",header,4)
        require(version==2 and length==path.stat().st_size,"bad GLB version/length")
        count,kind=struct.unpack_from("<I4s",header,12)
        require(kind==b"JSON" and count>40,"GLB missing JSON")
        return json.loads(f.read(count))
def descend(doc,index,found=None):
    found=set() if found is None else found
    require(index not in found,"cyclic scene hierarchy")
    found.add(index)
    for child in doc["nodes"][index].get("children",[]):descend(doc,child,found)
    return found
def asset_check(directory,lock):
    base=pathlib.Path(directory)
    glb=base/"xfx_swift_rx9060xt_polish4.glb"
    motion=base/"decomposition.json"
    require(glb.is_file() and glb.stat().st_size>10000,"new GLB absent/too small")
    require(motion.is_file(),"new C motion JSON absent")
    require(digest(glb)==lock["glbSha256"],"GLB SHA256 mismatch / old model")
    require(digest(motion)==lock["motionSha256"],"motion SHA256 mismatch / old data")
    for kind in ("scene","camera"):
        path=pathlib.Path(lock[kind+"SourcePath"])
        require(path.is_file() and digest(path)==lock[kind+"SourceSha256"],kind+" source mismatch")
    doc=glb_document(glb)
    names=[n.get("name","") for n in doc.get("nodes",[])]
    counts=Counter(names)
    require(all(counts[n]==1 for n in REQUIRED),"missing / duplicate anchor: "+str({n:counts[n] for n in REQUIRED if counts[n]!=1}))
    require(len(doc.get("meshes",[]))>=30 and len(doc.get("materials",[]))>=4,"not enough real separate mesh/material detail")
    idx={n:names.index(n) for n in REQUIRED}
    for parent,children in {
        "FAN_ASSEMBLY":["FAN_LEFT","FAN_CENTER","FAN_RIGHT"],
        "HEATSINK":["HEATSINK_FINS","HEATPIPE_BUNDLE","COLD_PLATE"],
        "PCB_ASSEMBLY":["PCB","GPU_DIE","VRAM_CHIPS","VRM_COMPONENTS","PCIE_FINGERS","POWER_8PIN","IO_BRACKET"],
    }.items():
        subtree=descend(doc,idx[parent]);require(all(idx[n] in subtree for n in children),f"invalid parent for {parent}")
    for fan in ("FAN_LEFT","FAN_CENTER","FAN_RIGHT"):
        require(sum("mesh" in doc["nodes"][n] for n in descend(doc,idx[fan]))>=6,f"{fan} needs real 3D blades")
    anim=json.loads(motion.read_text())
    require((anim.get("schemaVersion"),anim.get("fps"),anim.get("durationInFrames"))==(1,30,450),"motion schema incompatible")
    for name in MOVING:
        m=anim.get("nodes",{}).get(name,{})
        s=m.get("startFrame");e=m.get("endFrame")
        require(type(s) is int and type(e) is int and 90<=s<e<=329,f"{name} frame window invalid")
        require(m.get("easing")=="smoothstep",f"{name} easing invalid")
        for state in ("from","to"):
            for key in ("position","rotation"):
                vec=m.get(state,{}).get(key)
                require(isinstance(vec,list) and len(vec)==3 and all(type(v) in (int,float) and math.isfinite(v) and abs(v)<12 for v in vec),f"{name} {state}.{key} invalid")
        require(all(abs(v)<1e-7 for v in m["from"]["position"]+m["from"]["rotation"]),f"{name} from must be zero additive")
    shroud=anim["nodes"]["FRONT_SHROUD"]["to"]["position"][2]
    fans=[anim["nodes"][n]["to"]["position"][2] for n in ("FAN_LEFT","FAN_CENTER","FAN_RIGHT")]
    require(min(fans)-shroud>=0.32,"trapped fans: insufficient final local Z offset")
    require(anim["nodes"]["FRONT_SHROUD"]["startFrame"]>=min(anim["nodes"][n]["startFrame"] for n in ("FAN_LEFT","FAN_CENTER","FAN_RIGHT")),"shroud begins before fan exit")
    print(json.dumps({"assetValidation":"PASS","glbSha256":digest(glb),"motionSha256":digest(motion),"meshes":len(doc["meshes"]),"materials":len(doc["materials"]),"nodes":len(doc["nodes"]),"minFanVsShroudDeltaZ":min(fans)-shroud,"caveat":"Proxy endpoint clearance alone does not establish collision-free final native pixels"},indent=2))
if __name__=="__main__":
    try:
        require(len(sys.argv) in (3,4),"usage: verify_polish4.py lock LOCK | assets ASSET_DIR LOCK")
        if sys.argv[1]=="lock":lock_check(sys.argv[2])
        elif sys.argv[1]=="assets" and len(sys.argv)==4:asset_check(sys.argv[2],lock_check(sys.argv[3]))
        else:raise ValueError("bad mode")
    except (OSError,ValueError,AssertionError,KeyError,TypeError,IndexError) as e:
        sys.exit("POLISH04 PREFLIGHT FAIL: "+str(e))
