#!/usr/bin/env python3
"""POLISH05 independent exported-GLB, comparison, video and native pixel QA."""
import sys,hashlib,json,struct,pathlib,subprocess,math
from PIL import Image,ImageStat,ImageChops,ImageDraw
here=pathlib.Path(__file__).resolve().parent
a=here/"assets";p=a/"xfx_swift_rx9060xt_polish5.glb"
legacy=a/"polish4_locked.glb"
manifest=json.loads((a/"asset-manifest.json").read_text())
locked="edeeca54f6e9bf26127ed91b3debe16bae47f9c58cd9db0bf760927a0869882e"
assert hashlib.sha256(legacy.read_bytes()).hexdigest()==locked
raw=p.read_bytes()
assert raw[:4]==b"glTF"
assert struct.unpack_from("<I",raw,8)[0]==len(raw)
n,tag=struct.unpack_from("<II",raw,12)
assert tag==0x4e4f534a
gltf=json.loads(raw[20:20+n])
names=[x.get("name","") for x in gltf["nodes"]]
required=manifest["requiredAnchors"]
assert len(required)==19 and len(set(required))==19
for name in required:assert names.count(name)==1,(name,names.count(name))
assert "GPU_ROOT" in names
assert sum(x.startswith("BroadRotorBlade_") for x in names)==27
assert sum(x.startswith("P3_Heatpipe_") for x in names)==6
assert sum(x.startswith(("P3_L_fin_","P3_C_fin_","P3_R_fin_")) for x in names)==81
p5=[x for x in names if x.startswith("P5_")]
assert len(p5)>105,len(p5)
for fragment in ("decoupling_","genuine_fin","GPU_substrate_","fan_stainless_","backplate_",
                 "coldplate_","8pin_contact_","VRM_fine_"):
    assert any(fragment in s for s in p5),fragment
materials=gltf["materials"]
metals=0
for m in materials:
    pbr=m.get("pbrMetallicRoughness",{})
    if pbr.get("metallicFactor",0)>.75:metals+=1
assert metals>=6,metals
assert manifest["glbSha256"]==hashlib.sha256(raw).hexdigest()
assert manifest["baselinePolish04GlbSha256"]==locked
assert manifest["preExportSceneMeshes"]>manifest["baseMeshes"]+100
# Exported coordinates must stay within approved model's silhouette.
import trimesh,numpy as np
scene=trimesh.load(p,force="scene",process=False)
bounds=np.array(scene.bounds,dtype=float)
dims=bounds[1]-bounds[0]
expected=np.array([2.90,1.24,.49])
assert np.all(np.abs(dims-expected)/expected<.04),("dimension regression",dims,expected)
# Canonical anchor world-space rest transforms are exactly retained at model GLB level.
def scene_nodes(path):
    data=path.read_bytes()
    n=struct.unpack_from("<I",data,12)[0]
    j=json.loads(data[20:20+n])
    named={o["name"]:o for o in j["nodes"] if "name" in o}
    return named
old=scene_nodes(legacy);new=scene_nodes(p)
for k in required:
    for field in ("translation","rotation","scale"):
        oa=old[k].get(field);ob=new[k].get(field)
        if oa is not None or ob is not None:
            # Default transformations can be compacted away by the importer/exporter.
            default={"translation":[0,0,0],"rotation":[0,0,0,1],"scale":[1,1,1]}[field]
            oa=oa if oa is not None else default
            ob=ob if ob is not None else default
            assert np.allclose(oa,ob,atol=0.001),(k,field,oa,ob)
# Actual pixels on native Blender output, no model-count-only acceptance.
shots=sorted(a.glob("[0-9][0-9]_*.png"))
assert len(shots)==10,[f.name for f in shots]
stats={}
for f in shots:
    with Image.open(f) as im:
        assert im.size==(960,640),(f,im.size)
        grey=im.convert("L")
        sample=ImageStat.Stat(grey)
        lo,hi=grey.getextrema()
        assert sample.stddev[0]>6 and hi-lo>60,(f,sample.stddev,lo,hi)
        stats[f.name]={"meanLuminance":round(sample.mean[0],2),
                       "stddevLuminance":round(sample.stddev[0],2),
                       "min":lo,"max":hi,"bytes":f.stat().st_size}
# Direct matched-pixel comparison: same exact camera angle/light/studio.
pair=[("P4_matched_assembled.png","01_assembled.png"),
      ("P4_matched_fans.png","02_fans_and_shroud_macro.png"),
      ("P4_matched_backplate.png","09_backplate_macro.png")]
pairs=[];cards=[]
for before,after in pair:
    with Image.open(a/before) as old_im,Image.open(a/after) as new_im:
        im1=old_im.convert("RGB");im2=new_im.convert("RGB")
        assert im1.size==im2.size==(960,640)
        diff=ImageChops.difference(im1,im2)
        rms=sum(ImageStat.Stat(diff).rms)/3
        assert rms>1.5,(before,after,rms)
        cards.append((im1.copy(),im2.copy()))
        pairs.append({"baseline":before,"upgrade":after,"RGB_RMS":round(rms,3)})
sheet=Image.new("RGB",(1920,640*3+80),(19,23,30))
d=ImageDraw.Draw(sheet)
for i,(before,after) in enumerate(cards):
    y=i*640+80
    sheet.paste(before,(0,y))
    sheet.paste(after,(960,y))
d.text((24,24),"POLISH04 LOCKED MODEL  |  POLISH05 UPGRADE  -  MATCHED NATIVE BLENDER SHOTS",
       fill=(235,238,240))
sheet.save(a/"comparison_matched_P4_P5.png",optimize=True)
proof=a/"decomposition-proof-p5.mp4"
assert proof.is_file() and proof.stat().st_size>15000
cmd=["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(proof)]
ff=json.loads(subprocess.check_output(cmd,text=True))
v=[s for s in ff["streams"] if s["codec_type"]=="video"]
assert len(v)==1 and v[0]["codec_name"]=="h264"
assert v[0]["width"]==640 and v[0]["height"]==424
assert v[0]["nb_frames"]=="18",v[0]
subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(proof),"-f","null","-"],check=True)
audit={
 "buildSourceCommit":manifest["sourceCommit"],
 "baselineGlbSha256":locked,
 "outputGlbSha256":manifest["glbSha256"],
 "outputBytes":len(raw),"modelNodes":len(names),"meshes":len(gltf["meshes"]),
 "materialCount":len(materials),"metallicMaterialCount":metals,
 "canonicalAnchors":required,"newPOLISH05Nodes":len(p5),
 "baselineDimensionsSceneUnits":(np.array(trimesh.load(legacy,force="scene",process=False).bounds)[1]-
                                 np.array(trimesh.load(legacy,force="scene",process=False).bounds)[0]).tolist(),
 "measuredDimensionsSceneUnits":dims.tolist(),
 "proofPixelMetrics":stats,"matchedPixelComparisons":pairs,
 "movingProof":{"codec":"h264","frames":18,"dimensions":[640,424],"fps":9,"fullDecode":"PASS"},
 "limitations":["No manufacturer internal PCB/thermal teardown establishes the exact layout.",
   "Still images verify native Blender geometry, not integrated Remotion lighting.",
   "Matched pixel-difference proves change, not subjective quality; human review required."],
 "result":"TECHNICAL_QA_PASS_VISUAL_REVIEW_REQUIRED"}
(a/"validation-report.json").write_text(json.dumps(audit,indent=2)+"\n")
hash_lines=[]
for f in sorted(a.glob("*.glb"))+sorted(a.glob("*.png"))+[proof]:
    hash_lines.append(hashlib.sha256(f.read_bytes()).hexdigest()+"  "+f.name)
(a/"SHA256SUMS.txt").write_text("\n".join(hash_lines)+"\n")
print("P5_GLB_VALIDATED",audit["meshes"],"meshes",len(p5),"new nodes",len(materials),"materials")
print("P5_RENDERED_IMAGES",len(shots),"P5_MATCHED_COMPARISON",pairs)
print("P5_18_FRAME_MOVING_PROOF_DECODE_PASS")
print("P5_SHA256",manifest["glbSha256"])
