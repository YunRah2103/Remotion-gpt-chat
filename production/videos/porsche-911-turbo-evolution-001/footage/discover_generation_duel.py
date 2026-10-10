#!/usr/bin/env python3
"""Find Porsche-hosted media asset for official 1:46 seven-generation Turbo film.

The Porsche Newsroom official 911 listing includes the titled film.
HTML inspection does NOT download or verify media bytes or licensing.
"""
import html,json,re,urllib.request
from pathlib import Path
URLS=["https://newsroom.porsche.com/en/products/911.html",
      "https://newsroom.porsche.com/en_US/2022/products/porsche-911-magazine-episode-21-tale-of-the-turbo-mark-webber-911-turbo-models-cayenne-turbo-gt-911-gt1-27314.html",
      "https://newsroom.porsche.com/en/2020/history/porsche-911-turbo-generations-walter-roehrl-23139.html",
      "https://newsroom.porsche.com/en/2020/products/porsche-911-turbo-seven-generations-2020.html"]
TARGET="A duel between the generations"
def fetch(u):
    req=urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0 (compatible; Porsche source review)"})
    with urllib.request.urlopen(req,timeout=35) as r:
        return r.status, r.read(7*1024*1024).decode('utf8','replace')
def discover(u):
    result={"url":u,"errors":[],"matches":[],"candidates":[]}
    try:status,s=fetch(u)
    except Exception as e:
        result["errors"].append(str(e)[:350]);return result
    result.update({"statusCode":status,"htmlBytes":len(s)})
    needles=[TARGET,"Eight generations","4:55","The tale of the Turbo","Episode 21 of 9:11 Magazine","1975 to 2020","1:46","video-js","newstv.porsche.com","porschevideo","data-video","porschevideos"]
    for needle in needles:
        spans=list(re.finditer(re.escape(needle),s,re.I))
        for m in spans[:8]:
            snippet=html.unescape(s[max(0,m.start()-1700):m.end()+1400])
            result["matches"].append({"needle":needle,"position":m.start(),"context":snippet[:3150]})
    for rg in [r'(?:https?:)?//[^"<>\\\s]{10,400}(?:\.mp4|\.m3u8|\.mpd)[^"<>\\\s]{0,100}',
               r'newstv\.porsche\.com[^"<>\\\s]{0,240}',
               r'(?:(?:video|media|clip)[-_ ]?(?:id|uuid)|videoId)["\x27:\s=]+[0-9a-z-]{5,80}']:
        vals=re.findall(rg,s,re.I)
        for v in vals[:30]:result["candidates"].append(html.unescape(v.replace("\\/","/")))
    result["candidates"]=list(dict.fromkeys(result["candidates"]))[:70]
    return result
def main():
    folder=Path("out/porsche-generation-duel-discovery");folder.mkdir(parents=True,exist_ok=True)
    data={"schemaVersion":1,"status":"HTML_SOURCE_DISCOVERY_NOT_MEDIA_VERIFICATION","pages":[discover(u) for u in URLS]}
    (folder/"duel-discovery.json").write_text(json.dumps(data,indent=2)+"\n")
    print(json.dumps({"status":data["status"],"pages":[{"url":p["url"],"statusCode":p.get("statusCode"),"matches":len(p["matches"]),"mediaCandidates":len(p["candidates"]),"errors":p["errors"]} for p in data["pages"]]},indent=2))
    for p in data["pages"]:
        print("==== "+p["url"])
        for m in p["matches"][:3]:
            print("NEEDLE "+m["needle"]+" "+re.sub(r'\s+',' ',m["context"])[:1600])
        print("CANDIDATES "+str(p["candidates"][:20]))
if __name__=="__main__":main()
