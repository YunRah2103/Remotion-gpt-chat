"""Real headless Bullet rigid-body gravity and ground-contact test."""
import json
from pathlib import Path
import pybullet as p

client = p.connect(p.DIRECT)
try:
    p.setGravity(0, 0, -9.81, physicsClientId=client)
    ground_collision = p.createCollisionShape(p.GEOM_BOX, halfExtents=[3,3,0.1])
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=ground_collision, basePosition=[0,0,-0.1])
    sphere = p.createCollisionShape(p.GEOM_SPHERE, radius=0.15)
    ball = p.createMultiBody(baseMass=1, baseCollisionShapeIndex=sphere, basePosition=[0,0,1.0])
    initial_z = p.getBasePositionAndOrientation(ball)[0][2]
    for _ in range(240):
        p.stepSimulation()
    final_z = p.getBasePositionAndOrientation(ball)[0][2]
    assert 0.14 < final_z < 0.20, (initial_z, final_z)
    assert final_z < initial_z
    Path("toolkit/out").mkdir(parents=True, exist_ok=True)
    Path("toolkit/out/physics.json").write_text(json.dumps({
        "engine": "PyBullet", "steps": 240, "initial_z": initial_z,
        "final_z": final_z, "result": "PASS"
    }, indent=2))
    print("PYBULLET_SMOKE_PASS", final_z)
finally:
    p.disconnect(client)
