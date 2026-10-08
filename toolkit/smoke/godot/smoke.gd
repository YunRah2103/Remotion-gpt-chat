extends SceneTree

func _initialize() -> void:
    var body := RigidBody3D.new()
    body.mass = 4.0
    assert(body.mass > 0.0)
    var visual := MeshInstance3D.new()
    visual.mesh = BoxMesh.new()
    body.add_child(visual)
    assert(body.get_child_count() == 1)
    print("GODOT_SMOKE_PASS 3D physics and mesh objects created")
    body.free()
    quit(0)
