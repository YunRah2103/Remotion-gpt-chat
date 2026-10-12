#!/usr/bin/env python3
"""Actual official Porsche 6Mbps source grab (no 720p/fake upscale)."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import agent_d_acquire as a
orig=a.getcuts
def limited_scenes(path,meta):
    cuts=orig(path,meta)
    return cuts[:4]
a.getcuts=limited_scenes
for ident in ("245385","245346"):
    url=f"https://newstv.porsche.com/porschevideos/{ident}_en_6000000.mp4"
    dst=a.RAW/("missionx_"+ident+"_6000000.mp4")
    try:
        meta=a.get(url,dst,limit=800*1024*1024);a.sources.append(meta)
        a.register(dst,"Porsche Mission X",
            "https://newsroom.porsche.com/en/press-kits/Porsche-Mission-X.html",
            url,"Porsche AG Newsroom",
            "Porsche press footage; rights for unrestricted publication not confirmed")
    except Exception as ex:
        a.rejected.append(dict(file=url,reason="DOWNLOAD_OR_QA_FAILED: "+str(ex)[:300]))
        print("MISSION_X_REJECT",repr(ex),flush=True)
a.finish()
