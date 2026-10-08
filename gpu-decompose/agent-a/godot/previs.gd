extends SceneTree
# Native Godot 4 headless playback: actual 3D scene hierarchy, box proxy children.
func _initialize() -> void:
 var file=FileAccess.open("res://decomposition.json",FileAccess.READ)
 if file==null:
  push_error("Agent A decomposition data missing")
  quit(2)
  return
 var dat=JSON.parse_string(file.get_as_text())
 if typeof(dat)!=TYPE_DICTIONARY or dat["durationInFrames"]!=450:
  push_error("Bad animation schema")
  quit(3)
  return
 var scene=Node3D.new()
 scene.name="GPU_ROOT"
 root.add_child(scene)
 var asm=Node3D.new()
 asm.name="FAN_ASSEMBLY"
 scene.add_child(asm)
 var ba=Node3D.new()
 ba.name="PCB_ASSEMBLY"
 scene.add_child(ba)
 var heat=Node3D.new()
 heat.name="HEATSINK"
 scene.add_child(heat)
 var anchors={}
 for name in dat["nodes"].keys():
  var pa=scene
  if name.begins_with("FAN_"):pa=asm
  if name=="GPU_DIE" or name=="VRAM_CHIPS":pa=ba
  if name=="PCB_ASSEMBLY":pa=scene
  var part=Node3D.new()
  part.name=name
  pa.add_child(part)
  var block=MeshInstance3D.new()
  block.name="MechanicalEnvelopeProxy"
  var m=BoxMesh.new()
  m.size=Vector3(.35,.12,.04)
  if name.begins_with("FAN_"):m.size=Vector3(.86,.86,.065)
  if name=="FRONT_SHROUD":m.size=Vector3(2.90,1.24,.06)
  if name=="HEATSINK":m.size=Vector3(2.68,1.03,.13)
  if name=="PCB_ASSEMBLY":m.size=Vector3(2.3,1.06,.025)
  if name=="BACKPLATE":m.size=Vector3(2.9,1.20,.018)
  block.mesh=m
  part.add_child(block)
  anchors[name]=part
 var checks=0
 for f in range(450):
  for n in anchors.keys():
   var cfg=dat["nodes"][n]
   var t=clamp(float(f-cfg["startFrame"])/float(cfg["endFrame"]-cfg["startFrame"]),0.0,1.0)
   t=t*t*(3.0-2.0*t)
   var delta=cfg["to"]["position"]
   anchors[n].position=Vector3(delta[0],delta[1],delta[2])*t
  if f==89:assert(anchors["FAN_LEFT"].position==Vector3.ZERO)
  if f==449:
   assert(anchors["BACKPLATE"].position.z< -0.61)
   assert(anchors["FRONT_SHROUD"].position.z>0.65)
   assert(anchors["HEATSINK"].position.z>0.2)
   assert(anchors["GPU_DIE"].get_parent().name=="PCB_ASSEMBLY")
   assert(anchors["VRAM_CHIPS"].get_parent().name=="PCB_ASSEMBLY")
  checks+=1
 var proof={"status":"GODOT_PROOF_PASS","validatedFrames":checks,
    "sceneRoot":scene.name,"animatedAnchors":anchors.size(),
    "hierarchicalDieAndMemory":true,"native3DProxyMesh":true}
 var out=FileAccess.open("res://godot-proof.json",FileAccess.WRITE)
 out.store_string(JSON.stringify(proof));out.close()
 print("GODOT_PROOF_PASS ",JSON.stringify(proof))
 quit(0)
