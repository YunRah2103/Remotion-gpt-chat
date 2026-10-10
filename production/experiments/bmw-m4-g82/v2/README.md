# BMW M4 G82 V2 — detailed native Blender model

V2 replaces the first simplistic, blocky procedural geometry with the actual detailed **BMW M4 Competition M Package** model by **SRT Performance**, used under **Creative Commons Attribution 4.0**.

Original asset: https://sketchfab.com/3d-models/bmw-m4-competition-m-package-5c0a2dafb1ad408d9fc9eeef9aee531b

Permitted redistributed GLB: https://github.com/coopercodes/bmwGLB

Asset SHA256: 913ac951ba2645777c91393b86aed2def2433a807e57e626b203908aa474b8fb

Modifications: coordinate normalization, scene setup, softbox lighting, studio floor, camera movement, Blender packaging. Attribution to original artist must be preserved. Unofficial project not affiliated with BMW.

## Result
The **car remains still in the centre**, and **only the camera** orbits. No interface graphics. GitHub Actions workflow **m4-g82-v2.yml** makes four diagnostic proof renders and then a 144-frame, six-second native Blender MP4 at 720x1280 24 FPS. The final artifact contains an **editable .blend** and **MP4**. Do not confuse this source with the older, simplified procedural V1 scene.

## How to run
In GitHub Actions select **BMW M4 G82 V2 - detailed studio turntable** and choose Run workflow on the experiments branch. Output artifacts: **M4-G82-V2-FOUR-ANGLE-QA** and **BMW-M4-G82-V2-DETAIL-FINAL**.
