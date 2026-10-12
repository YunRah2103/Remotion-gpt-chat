"""Measure tyre envelope runout on the actual imported hero mesh."""
import sys
from pathlib import Path
import bpy
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
args = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=args[0])
if '--correct' in args:
    from wheel_motion import prepare_wheels
    prepare_wheels()
for label in ['FL','FR','RL','RR']:
    wheel = next(o for o in bpy.data.objects['Spin_'+label].children if o.type == 'MESH')
    points = np.array([tuple(v.co) for v in wheel.data.vertices])
    radii = np.linalg.norm(points[:,1:],axis=1)
    angles = np.arctan2(points[:,2],points[:,1])
    envelope = [float(radii[(angles>=t)&(angles<t+np.pi/18)].max())
                for t in np.linspace(-np.pi,np.pi,37)[:-1]]
    runout = max(envelope)-min(envelope)
    print(label, 'tyre radial runout in metres', runout, flush=True)
    assert runout < 0.0015, (label, 'rotating elliptical tyre changes ground contact', runout)
    spin = bpy.data.objects['Spin_'+label]
    hub = spin.matrix_world.translation.copy()
    axle = spin.matrix_world.to_3x3().col[0].normalized()
    for angle in np.linspace(0,np.pi*2,25):
        spin.rotation_euler.x = float(angle)
        bpy.context.view_layer.update()
        assert (spin.matrix_world.translation-hub).length < 1e-6
        assert (spin.matrix_world.to_3x3().col[0].normalized()-axle).length < 1e-6
print('WHEEL_QA_PASS',flush=True)
