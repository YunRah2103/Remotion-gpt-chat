#!/usr/bin/env python3
"""Download only pre-declared, licensed Wikimedia Commons photos and optimize."""
import hashlib
import io
import json
import os
import time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
from PIL import Image, ImageOps, ImageEnhance

PROJECT=Path("production/videos/car-photo-collage-001")
data=json.loads((PROJECT/"assets.json").read_text())
target=Path("public/automotive-collage")
target.mkdir(parents=True,exist_ok=True)
results=[]
for row in data:
    file=row["file"]
    hashed=hashlib.md5(file.encode("utf-8")).hexdigest()
    url=f"https://upload.wikimedia.org/wikipedia/commons/{hashed[0]}/{hashed[:2]}/{quote(file)}"
    if row.get("license")!="CC BY-SA 4.0":
        raise RuntimeError("License allowlist mismatch: "+file)
    response=None
    for attempt in range(5):
        try:
            req=Request(url,headers={"User-Agent":"AutoCollageEditorial/1.0 (public-domain-media-usage; see GitHub YunRah2103/Remotion-gpt-chat)","Accept":"image/jpeg,image/*"})
            with urlopen(req, timeout=75) as web:
                raw=web.read(18_000_001)
                if len(raw)>18_000_000: raise RuntimeError("Download too large")
                response=raw
            break
        except Exception as e:
            print("Download failed",file,attempt+1,str(e),flush=True)
            if attempt==4: raise
            time.sleep(3*(attempt+1))
    im=Image.open(io.BytesIO(response))
    im=ImageOps.exif_transpose(im).convert("RGB")
    source_size=im.size
    if im.width<1100 or im.height<650:raise RuntimeError(f"Source {file} insufficient size {source_size}")
    im.thumbnail((2700,1800), Image.Resampling.LANCZOS)
    im=ImageEnhance.Contrast(im).enhance(1.07)
    out=target/(row["id"]+".jpg")
    im.save(out,quality=91,optimize=True,subsampling=0)
    result={**row,"download_url":url,"source_dimensions":source_size,"render_dimensions":im.size,
            "source_sha256":hashlib.sha256(response).hexdigest(),
            "render_sha256":hashlib.sha256(out.read_bytes()).hexdigest()}
    results.append(result)
    print(row["id"],source_size,"=>",im.size,out.stat().st_size,flush=True)
(target/"provenance.json").write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n")
print("Fetched",len(results),"licensed images")
