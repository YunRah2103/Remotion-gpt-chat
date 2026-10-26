# 300 MPH hypercar (Blender Eevee) — reusable assets

- `assets/ferrari-f40.glb` — Ferrari F40 by Black Snow, CC BY 4.0 (https://sketchfab.com/3d-models/ferrari-f40-52a66c41cfcd4f999fb1b1c49bf24d70). Keep attribution when published; trademarks belong to their owners. Front of car is -Y; wheels are split in `scene.py` for spinning.
- `scene.py` (Blender `bpy` scene, track, cameras, cutaway shader, airflow), `run.py` (frame renderer), `audio.py` (synth mix), `overlay.py` (PIL overlays). Run under `xvfb-run python3 run.py 0 645` with `pip install bpy`; GLB path is set at the top of `scene.py`.
