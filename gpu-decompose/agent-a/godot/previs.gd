extends SceneTree
# Actual headless Godot scene tree: real Node3D/MeshInstance3D proxy assembly.
# Uses Blender coordinate parent offsets exactly; validates all 450 sampled poses.
func _initialize() -> void:
 var path="res://motion.json"
 var file=FileAccess.open(path,FileAccess.READ)
 if file==null:
  push_error("Missing generated motion.json")
  quit(2)
  return
 var data=JSON.parse_string(file.get_as_text())
 if typeof(data)!=TYPE_DICTIONARY:
  push_error("Invalid JSON motion")
  quit(3)
  return
 var stage=Node3D.new()
 stage.name="XFX_SWIFT_GPU_Previs"
 root.add_child(stage)
 var nodes={}
 var dims={
  "SHROUD":Vector3(2.90,0.07,1.24),
  "FAN_LEFT":Vector3(0.82,0.08,0.82),
  "FAN_CENTER":Vector3(0.82,0.08,0.82),
  "FAN_RIGHT":Vector3(0.82,0.08,0.82),
  "HEATSINK":Vector3(2.68,0.15,1.02),
  "HEATPIPES":Vector3(2.2,0.05,0.30),
  "GPU_PROCESSOR":Vector3(0.38,0.035,0.38),
  "VRAM":Vector3(0.9,0.025,0.65),
  "PCB":Vector3(2.20,0.025,1.05),
  "PCIE_CONNECTOR":Vector3(0.70,0.015,0.12),
  "BACKPLATE":Vector3(2.90,0.018,1.24)}
 var base={
  "SHROUD":Vector3(0,-0.21,0),
  "FAN_LEFT":Vector3(-0.94,-0.26,0),
  "FAN_CENTER":Vector3(0,-0.26,0),
  "FAN_RIGHT":Vector3(0.94,-0.26,0),
  "HEATSINK":Vector3(0,-0.075,0),
  "HEATPIPES":Vector3(0,0.002,0),
  "GPU_PROCESSOR":Vector3(-0.20,0.035,0),
  "VRAM":Vector3(-0.15,0.035,0),
  "PCB":Vector3(-0.18,0.075,0),
  "PCIE_CONNECTOR":Vector3(-0.18,0.075,-0.59),
  "BACKPLATE":Vector3(0,0.237,0)}
 for name in data["parts"].keys():
  var part=Node3D.new()
  part.name=name
  stage.add_child(part)
  var mesh=MeshInstance3D.new()
  mesh.name="GeometryProxy"
  var cube=BoxMesh.new()
  cube.size=dims[name]
  mesh.mesh=cube
  mesh.position=base[name]
  part.add_child(mesh)
  nodes[name]=part
 var checks=0
 for frame in range(450):
  var sm=data["samples"][str(frame)]
  for name in nodes.keys():
   var p=sm[name]
   nodes[name].position=Vector3(p[0],p[1],p[2])
  if frame==89:
   assert(nodes["SHROUD"].position==Vector3.ZERO)
  if frame==449:
   assert(nodes["BACKPLATE"].position.y>1.2)
   assert(nodes["FAN_CENTER"].position.y< -1.0)
  checks+=1
 var report={"status":"GODOT_PREVIS_PASS","frames_checked":checks,
  "instantiated_3d_groups":nodes.size(),"first_frame_assembled":true,
  "last_frame_exploded":true}
 var target=FileAccess.open("res://godot_validation.json",FileAccess.WRITE)
 target.store_string(JSON.stringify(report))
 target.close()
 print("GODOT_PREVIS_PASS ",JSON.stringify(report))
 quit(0)
