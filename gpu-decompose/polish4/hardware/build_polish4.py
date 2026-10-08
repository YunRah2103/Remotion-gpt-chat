#!/usr/bin/env python3
"""Non-destructive POLISH04 Blender build from the pinned POLISH03 source.

This is intentionally a wrapper: avoids mutating the historical POLISH03
generator and renders all proof images from actual modified Blender geometry.
No relative path outside this repository is loaded.
"""
import pathlib
import sys

HERE=pathlib.Path(__file__).resolve().parent
SOURCE=HERE.parent.parent/"agent-a"/"blender_generate.py"
source=SOURCE.read_text(encoding="utf8")
assert 'ASSETS=HERE.parent/"polish3"/"assets"; ASSETS.mkdir(parents=True,exist_ok=True)' in source
source=source.replace(
    'ASSETS=HERE.parent/"polish3"/"assets"; ASSETS.mkdir(parents=True,exist_ok=True)',
    'ASSETS=HERE.parent/"polish4"/"hardware"/"assets"; ASSETS.mkdir(parents=True,exist_ok=True)',
    1,
)
needle='from polish3_detail import augment\naugment(globals())'
assert source.count(needle)==1,"POLISH03 hook changed; audit before editing!"
source=source.replace(
    needle,
    needle+"\nsys.path.insert(0,str(HERE.parent/'polish4'/'hardware'))"
          +"\nfrom polish4_detail import augment as polish4_augment, polish_studio"
          +"\npolish4_augment(globals())",
    1,
)
needle='studio()\nscene=bpy.context.scene'
assert source.count(needle)==1
source=source.replace(needle,'studio()\npolish_studio(bpy.context.scene)\nscene=bpy.context.scene',1)
source=source.replace("xfx_swift_rx9060xt_polish3","xfx_swift_rx9060xt_polish4")
# With source file path (not wrapper path), baseline HERE and imported P3 stay
# identical to their proven values. All new output lands in polish4/hardware.
environment={"__name__":"__main__","__file__":str(SOURCE)}
exec(compile(source,str(SOURCE),"exec"),environment,environment)
print("POLISH4_NATIVE_BUILD_COMPLETE",environment["ASSETS"])
