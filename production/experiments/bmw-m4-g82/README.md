# BMW M4 G82 Blender 360 studio experiment

Actual Blender procedural model with an animated camera orbit. The car is stationary and central. A stylised visual study — not genuine BMW CAD or a photoreal model.

BMW M4 Coupe is chassis G82; G80 refers to the M3 saloon.

GitHub Actions workflow m4-g82-blender.yml automatically renders a 6-second, 540x960, 24fps H264 MP4 and saves a native editable Blender .blend file in one artifact called BMW-M4-G82-BLENDER-TURNTABLE.

Run locally with: blender -b -t 4 --python production/experiments/bmw-m4-g82/scene.py

To save just the Blender model without rendering, set M4_RENDER=0. Optional M4_OUTPUT sets the output directory. Other repository films are untouched.
