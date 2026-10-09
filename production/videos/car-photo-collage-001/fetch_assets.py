#!/usr/bin/env python3
"""Acquire six individually attributed Pexels photos for a genuinely edited film."""
import hashlib, io, json, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from PIL import Image, ImageOps, ImageEnhance

PROJECT=Path("production/videos/car-photo-collage-001")
manifest=json.loads((PROJECT/"assets.json").read_text())
target=Path("public/automotive-collage")
target.mkdir(parents=True, exist_ok=True)
assert len(manifest)==6
result=[]
for entry in manifest:
    url=entry["download_url"]
    parsed=urlparse(url)
    assert parsed.scheme=="https" and parsed.netloc=="images.pexels.com"
    assert str(entry["pexels_id"]) in parsed.path and entry["license"]=="Pexels License"
    data=None
    for n in range(4):
        try:
            req=Request(url,headers={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36", "Accept":"image/avif,image/webp,image/jpeg,image/*;q=0.8","Referer":"https://www.pexels.com/"})
            with urlopen(req,timeout=40) as response:
                if urlparse(response.url).netloc!="images.pexels.com":
                    raise ValueError("Unexpected redirect domain")
                data=response.read(16_000_001)
            if len(data)>16_000_000:raise ValueError("Source image too large")
            break
        except Exception as exc:
            print(f"Retry {entry['id']} {n+1}: {exc}",flush=True)
            if n==3:raise
            time.sleep(5*(n+1))
    raw=Image.open(io.BytesIO(data))
    raw=ImageOps.exif_transpose(raw).convert("RGB")
    width,height=raw.size
    if width<1150 or height<600:raise ValueError(f"Insufficient resolution for {entry['id']} {raw.size}")
    raw.thumbnail((2700,1800),Image.Resampling.LANCZOS)
    raw=ImageEnhance.Contrast(raw).enhance(1.055)
    raw=ImageEnhance.Color(raw).enhance(.96)
    out=target/(entry["id"]+".jpg")
    raw.save(out,quality=91,optimize=True,subsampling=0)
    result.append({**entry, "source_dimensions":[width,height], "delivery_dimensions":list(raw.size),
        "source_sha256":hashlib.sha256(data).hexdigest(), "delivery_sha256":hashlib.sha256(out.read_bytes()).hexdigest()})
    print(entry["id"],width,height,"=>",raw.size,out.stat().st_size,flush=True)
(target/"provenance.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
print(f"Downloaded {len(result)} licensed photographs",flush=True)
