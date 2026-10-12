"""Correct small source-wheel ellipticity; preserve axle pivots, UVs and brakes."""
import bpy
import numpy as np

def prepare_wheels():
    specs = []
    for label in ['FL', 'FR', 'RL', 'RR']:
        spin = bpy.data.objects['Spin_'+label]
        wheel = next(o for o in spin.children if o.type == 'MESH')
        wheel.data = wheel.data.copy()
        coords = np.array([tuple(v.co) for v in wheel.data.vertices])
        axes = np.max(np.abs(coords[:,1:]),axis=0)
        radius = float(axes.mean())
        # glTF import rotates Y-up geometry into Blender's Z-up coordinates.
        # The source front/rear tyre diameters differ; use each wheel's radius.
        coords[:,1:] *= radius / axes
        for vertex, co in zip(wheel.data.vertices, coords):
            vertex.co = co
        wheel.data.update()
        spin.rotation_mode = 'XYZ'
        spin.rotation_euler = (0,0,0)
        spin.location.z -= float(axes[1] - radius)
        specs.append((spin, radius))
    bpy.context.view_layer.update()
    return specs

def set_wheel_distance(specs, distance):
    for spin, radius in specs:
        # Unwrapped scalar angle permits correct temporal interpolation and blur.
        spin.rotation_euler.x = distance / radius
