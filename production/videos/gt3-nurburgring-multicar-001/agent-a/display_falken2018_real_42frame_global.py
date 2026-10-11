#!/usr/bin/env python3
"""View actual previously downloaded 2018 4K source's global Nürburgring racing frame scan."""
import io,base64,json
from pathlib import Path
from PIL import Image,ImageOps
ROOT=Path("inputs/falken2018_global_actual")
fr=list(ROOT.rglob("GLOBAL_42FRAME_HDR_TONEMAPPED_CONTACT.jpg"))
assert len(fr)==1,fr
audit=list(ROOT.rglob("audit.json"))
assert len(audit)==1,audit
d=json.loads(audit[0].read_text())
print("ORIGINAL_2018_FALKEN_4K_SOURCE",d["source"],"DECODED_GLOBAL_FRAMES",sum(x.get("status")=="FRAME_DECODED" for x in d["frames"]),flush=True)
with Image.open(fr[0]) as photo:
 print("ORIGINAL_FRAME_CONTACT_PIXELS",photo.size,flush=True)
 img=ImageOps.contain(photo.convert("RGB"),(2000,1650))
 out=io.BytesIO();img.save(out,"JPEG",quality=82,optimize=True)
 print("FALKEN_2018_REAL_4K_42_SOURCE_FRAMES_BASE64_START:"+base64.b64encode(out.getvalue()).decode()+":FALKEN_2018_REAL_4K_42_SOURCE_FRAMES_BASE64_END",flush=True)
