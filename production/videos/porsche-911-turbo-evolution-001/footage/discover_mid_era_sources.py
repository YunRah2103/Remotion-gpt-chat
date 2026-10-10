#!/usr/bin/env python3
"""Discover Porsche Newsroom article video files for 996/997/991 Turbo sourcing.

Scouts exact original Porsche-hosted MP4 references; no inferred ownership or
identity, does not download third-party clips, and does not mark shot READY.
"""
from __future__ import annotations
import html
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

PAGES = [
  ("2025 Turbo S launch press kit with 964 Ascari", "https://newsroom.porsche.com/en/press-kits/pfv-porsche-911-turbo-s.html"),
  ("2025 Turbo S press kit EU", "https://newsroom.porsche.eu/en/press-kits/pfv-porsche-911-turbo-s.html"),
  ("991 exclusive","https://newsroom.porsche.com/en/products/porsche-911-turbo-s-exclusive-series-limited-online-campaign-robots-13811.html"),
  ("991 turbo handcraft","https://newsroom.porsche.com/en/products/porsche-911-turbo-s-exclusive-series-porsche-exclusive-manufaktur-finished-by-hand-stuttgart-media-13923.html"),
  ("991 aerodynamics","https://newsroom.porsche.com/en/innovation/engineering/storm-tested-10734.html"),
  ("911 turbo through ages","https://newsroom.porsche.com/en/company/video-magazine-911.html"),
  ("2020 turbo generations","https://newsroom.porsche.com/en/2020/history/porsche-911-turbo-generations-walter-roehrl-23139.html"),
  ("911 2017 Highland roadtrip","https://newsroom.porsche.com/en/company/porsche-one-millionth-911-road-trip-scotland-highlands-13800.html"),
  ("992 Romania + 964/993","https://newsroom.porsche.com/en/2024/scene-passion/porsche-turbo-transfagarasan-highway-romania-37323.html"),
]
class VideoTags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.videos=[]
    def handle_starttag(self, tag, attrs):
        if tag not in ("a","video","source","iframe"): return
        d=dict(attrs)
        url=d.get("data-url") or d.get("src") or d.get("href")
        if url and ("/embed/" in url or re.search(r"\.(?:mp4|webm|m3u8)",url,re.I) or tag in ("video","source")):
            self.videos.append({
                "title":d.get("title") or d.get("data-title") or "not identified",
                "ref":url,"data-video-id":d.get("data-video-id"),
                "listedDuration":d.get("data-time"),
                "format":d.get("data-format")})
def scrape(name,url):
    result={"page":name,"url":url,"videos":[],"candidateDirectMedia":[],"errors":[]}
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (source media QA)"})
        with urllib.request.urlopen(req,timeout=35) as response:
            data=response.read(9_000_000).decode("utf-8","replace")
            result["httpStatus"]=response.status
        parser=VideoTags()
        parser.feed(data)
        result["videos"]=parser.videos
        vals=re.findall(r'(?:https?:)?(?:\\?/){2}[^"\'<>\\\s]{4,180}\.(?:mp4|m3u8)(?:\?[^"\'<>\s]{0,100})?',data,re.I)
        result["candidateDirectMedia"]=list(dict.fromkeys(html.unescape(v.replace("\\/","/")) for v in vals))[:35]
        tokens=[]
        for v in result["videos"]:
            m=re.search(r"/embed/([0-9]{4,9})\.html",v.get("ref") or "")
            if m:v["porscheNewsTvId"]=m.group(1)
            if any(k in (v["title"] or "").lower() for k in ("turbo","generation","911","exclusive","porsche")):tokens.append(v)
        result["turboRelatedVideoTags"]=tokens
        result["videoCount"]=len(result["videos"])
    except Exception as err:
        result["errors"].append(str(err)[:600])
    return result

def main():
    out=Path("out/porsche-mid-era-scout")
    out.mkdir(parents=True,exist_ok=True)
    results=[scrape(n,u) for n,u in PAGES]
    path=out/"source-scout.json"
    path.write_text(json.dumps(results,indent=2)+"\n")
    for v in results:
        print(json.dumps({"page":v["page"],"httpStatus":v.get("httpStatus"),"allVideos":v.get("videoCount"),
                         "likelyTurbo":v.get("turboRelatedVideoTags",[])[:15],
                         "directVideoURLs":v["candidateDirectMedia"][:10],"errors":v["errors"]}))
if __name__=="__main__":main()
