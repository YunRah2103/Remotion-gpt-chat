#!/usr/bin/env python3
"""Validate a safe original-video catalogue and generate a small static gallery."""
import argparse
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

def validate(data):
    if data.get("schemaVersion")!=1 or not isinstance(data.get("videos"),list):
        raise ValueError("catalog requires schemaVersion 1 and videos[]")
    ids=set()
    for entry in data["videos"]:
        if not isinstance(entry,dict):raise ValueError("Invalid video")
        slug=entry.get("slug","")
        if not isinstance(slug,str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,70}",slug):
            raise ValueError("Invalid video slug")
        if slug in ids:raise ValueError("Duplicate slug: "+slug)
        ids.add(slug)
        if not isinstance(entry.get("title"),str) or not entry["title"].strip():
            raise ValueError("Missing title")
        for field in ("url","thumbnail"):
            v=entry.get(field)
            if v is not None:
                if not isinstance(v,str) or urlsplit(v).scheme!="https" or not urlsplit(v).netloc:
                    raise ValueError(field+" must be HTTPS")
    return data

def build(catalog,site):
    data=validate(json.loads(Path(catalog).read_text()))
    site=Path(site);site.mkdir(parents=True,exist_ok=True)
    def e(v):return html.escape(str(v),quote=True)
    cards=[]
    for v in data["videos"]:
        link=e(v.get("url","#"))
        thumb=f'<img src="{e(v["thumbnail"])}" alt="" loading="lazy">' if v.get("thumbnail") else '<span class="thumb">▶</span>'
        target=' target="_blank" rel="noopener noreferrer"' if link!="#" else ""
        cards.append(f'<a class="card" href="{link}"{target}>{thumb}<h2>{e(v["title"])}</h2><p>{e(v.get("description",""))}</p></a>')
    if not cards:cards=['<section class="empty"><h2>Production gallery ready</h2><p>Publish an approved MP4 as a GitHub Release, then add its link to production/catalog.json. No placeholder films are shown as finished.</p></section>']
    page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Automotive Engineering Films</title><style>
*{box-sizing:border-box}body{background:#11161c;color:#f2f5f7;font:16px/1.55 system-ui,sans-serif;margin:0}main{max-width:1100px;margin:auto;padding:64px 24px}header{padding-bottom:24px;border-bottom:1px solid #343b46}h1{font-size:clamp(2rem,7vw,4rem);line-height:1.1;margin:0 0 16px}p{color:#b8c3cc}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:22px;margin-top:35px}.card,.empty{background:#1c242d;border:1px solid #303d4a;border-radius:16px;padding:20px}.card{display:block;color:inherit;text-decoration:none}.card:hover{border-color:#9cb8cc}.card img{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:9px}.thumb{display:grid;place-items:center;aspect-ratio:9/16;background:#293543;font-size:3rem;border-radius:9px}.card h2{font-size:1.2rem}footer{margin-top:80px;border-top:1px solid #343b46;padding-top:20px;font-size:.85rem}</style></head><body><main><header><p>ORIGINAL 3D EDUCATIONAL ANIMATIONS</p><h1>Automotive Engineering</h1><p><a href="./dashboard/">Production Dashboard</a> &nbsp;·&nbsp; <a href="./viewer/">Interactive 3D Model Lab</a> &nbsp;·&nbsp; <a href="./compare/">Shot Comparison Studio</a></p><p>Mechanisms explained with reusable 3D models, careful motion and real technical review.</p></header><div class="grid">''' + "".join(cards)+'''</div><footer>Separate educational video series. Not affiliated with any automotive manufacturer.</footer></main></body></html>'''
    (site/"index.html").write_text(page)
    (site/".nojekyll").write_text("")
    (site/"catalog.json").write_text(json.dumps(data,indent=2)+"\n")
    return len(data["videos"])

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--catalog",default="production/catalog.json")
    p.add_argument("--site",default="out/production/site");x=p.parse_args()
    print(f"Gallery generated ({build(x.catalog,x.site)} published titles)")
