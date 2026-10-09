"""Headless Blender UV AO and high-to-low tangent-space normal-map baker.

For each target, requires UVs; stores PNGs and hashes. Does not overwrite
source blend materials, auto-apply to GLB, or claim physically authentic maps.
"""
import hashlib
import json
import sys
from pathlib import Path
import bpy

def main(config_path,directory):
    cfg=json.loads(Path(config_path).read_text())
    names=cfg.get("objects")
    size=cfg.get("size",512)
    samples=cfg.get("samples",16)
    mode=cfg.get("mode","ao")
    if mode not in ("ao","normal","both"):raise ValueError("mode must be ao, normal or both")
    high_sources=cfg.get("highSources",{})
    if mode in ("normal","both") and (not isinstance(high_sources,dict) or any(name not in high_sources for name in names)):
        raise ValueError("Normal baking requires explicit highSources for every low-poly mesh")
    if type(size)!=int or size not in (128,256,512,1024):raise ValueError("Invalid AO map size")
    if type(samples)!=int or not 4<=samples<=64:raise ValueError("Samples must be 4-64")
    if not isinstance(names,list) or not 1<=len(names)<=15 or len(names)!=len(set(names)):
        raise ValueError("Select 1–15 meshes with authored UV maps")
    out=Path(directory);out.mkdir(parents=True,exist_ok=True)
    scene=bpy.context.scene
    scene.render.engine="CYCLES";scene.cycles.samples=samples
    scene.render.bake.use_clear=True
    images=[]
    for name in names:
        obj=bpy.data.objects.get(name)
        if not obj or obj.type!="MESH":raise ValueError("Missing named mesh "+str(name))
        if not obj.data.uv_layers or len(obj.data.vertices)>250000:
            raise ValueError("Bake requires UV-unwrapped mesh under vertex cap: "+name)
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True);bpy.context.view_layer.objects.active=obj
        if not obj.data.materials:
            obj.data.materials.append(bpy.data.materials.new(name+"_BakeTemporaryMaterial"))
        for texture_type in (["ao","normal"] if mode=="both" else [mode]):
            image=bpy.data.images.new(texture_type.upper()+"_"+name,width=size,height=size,alpha=False)
            for material in obj.data.materials:
                if not material:continue
                material.use_nodes=True
                nodes=material.node_tree.nodes
                texture=nodes.new("ShaderNodeTexImage")
                texture.name="AE_"+texture_type.upper()+"_TARGET_"+name
                texture.image=image
                nodes.active=texture
            if texture_type=="ao":
                bpy.ops.object.bake(type="AO",margin=4)
            else:
                high=bpy.data.objects.get(high_sources[name])
                if high is None or high.type!="MESH" or high.name==obj.name:
                    raise ValueError("High-poly normal bake source missing or not separate from target: "+name)
                high.select_set(True)
                obj.select_set(True)
                bpy.context.view_layer.objects.active=obj
                bpy.ops.object.bake(type="NORMAL",normal_space="TANGENT",
                   use_selected_to_active=True,cage_extrusion=0.025,margin=4)
                high.select_set(False)
            target=out/(name+"-"+texture_type+".png")
            image.filepath_raw=str(target.resolve())
            image.file_format="PNG"
            image.save()
            images.append({"object":name,"type":texture_type,"file":target.name,"size":size,
                           "sha256":hashlib.sha256(target.read_bytes()).hexdigest()})
        # We intentionally do not overwrite the original materials or blend project.
    report={"type":"AO and/or high-to-low tangent-space normal texture maps","bakes":images,
            "shaderIntegration":"Manual review required; PNG maps are NOT automatically connected to glTF occlusion slots.",
            "source":"Cycles AO bake from existing mesh UV maps",
            "approval":"Artist must review seams, scale, and material response"}
    (out/"bake-manifest.json").write_text(json.dumps(report,indent=2)+"\n")
    print("NATIVE_TEXTURE_BAKE_PASS",len(images))

if __name__=="__main__":
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    if len(args)!=2:raise SystemExit("Expected bake-config.json output-folder")
    main(*args)
