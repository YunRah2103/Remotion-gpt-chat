#!/usr/bin/env python3
"""Find *real post URLs* and original direct MP4s; discovery != acquisition.

Only public pages, bounded number of requests, no account bypass.
"""
import json,re,sys,time,html
from pathlib import Path
from urllib.parse import quote,unquote,urljoin
import requests
from bs4 import BeautifulSoup

OUT=Path(sys.argv[1]) if len(sys.argv)>1 else Path("out/gt3-discovery")
OUT.mkdir(parents=True,exist_ok=True)
SESSION=requests.Session();SESSION.headers["User-Agent"]="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36"
ROWS=[]
SEARCHES=[
 ("tiktok","site:tiktok.com/@24hnbr/video/ 2025 24h GT3"),
 ("tiktok","site:tiktok.com/@nuerburgring/video/ GT3 race"),
 ("tiktok","site:tiktok.com/@gtworld/video/ Nürburgring GT3"),
 ("tiktok","site:tiktok.com/@24hnbr/video/ BMW Porsche AMG"),
 ("instagram","site:instagram.com/reel/ 24hnbr GT3"),
 ("instagram","site:instagram.com/p/ 24hnbr Nürburgring GT3"),
 ("instagram","site:instagram.com/reel/ walkenhorst_motorsport nürburgring GT3"),
 ("instagram","site:instagram.com/reel/ manthey_racing 24h Nürburgring"),
 ("instagram","site:instagram.com/reel/ scherer_sport_phx Nürburgring"),
]
def fetch(url,limit=1_800_000):
    try:
        r=SESSION.get(url,timeout=12)
        return r.status_code,r.url,r.text[:limit]
    except Exception as exc:return None,url,str(exc)

def clean_url(v):
    v=html.unescape(unquote(v))
    for p in ("https://www.","https://"):
        if p in v:v=v[v.index(p):]
    return v.split("&")[0].split("?")[0]

for platform,q in SEARCHES:
    for engine,url in [
       ("bing","https://www.bing.com/search?q="+quote(q)),
       ("ddg","https://www.google.com/search?q="+quote(q))
    ]:
        status,final,page=fetch(url,600000)
        matches=re.findall(r'https?[^\s"<>]{10,260}',page)
        keep=[]
        for m in matches:
            m=clean_url(m)
            if platform=="tiktok" and re.search(r'tiktok\.com/@[\w.]+/video/\d{16,22}',m):
                keep.append(re.search(r'https?://(?:www\.)?tiktok\.com/@[\w.]+/video/\d{16,22}',m).group(0))
            if platform=="instagram" and re.search(r'instagram\.com/(?:reel|p)/[\w-]{6,20}',m):
                keep.append(re.search(r'https?://(?:www\.)?instagram\.com/(?:reel|p)/[\w-]{6,20}',m).group(0))
        keep=list(dict.fromkeys(keep))
        ROWS.append({"kind":"social-search","platform":platform,"engine":engine,"query":q,"http":status,"destination":final,"post_links":keep[:20],"response_bytes":len(page)})
        print("SOCIAL",platform,engine,status,len(keep),keep[:3],flush=True)

PAGES=[
"https://newstv.porsche.com/en/",
"https://newstv.porsche.com/en/motorsport/",
"https://newstv.porsche.com/en/article/133713.html",
"https://newstv.porsche.com/en/article/322821.html",
"https://newsroom.porsche.com/en/2025/motorsports/porsche-24-hours-nuerburgring-2025-race.html"
]
terms=("nürburgring","nurburgring","green hell","gt3 r","24-hour race","24h race")
all_articles={}
for url in PAGES:
    status,final,page=fetch(url)
    soup=BeautifulSoup(page,"html.parser")
    anchors=[]
    for a in soup.find_all("a",href=True):
        href=urljoin(final,a["href"]);title=a.get_text(" ",strip=True)
        parent=a.parent.get_text(" ",strip=True) if a.parent else title
        if any(t in (title+" "+parent).lower() for t in terms):
            anchors.append({"title":title[:120],"context":parent[:200],"url":href})
            if "newstv.porsche.com" in href and "/article/" in href:all_articles[href]=title or parent[:80]
    urls=list(dict.fromkeys(re.findall(r'https?://[^\s"<>]+?\.mp4',page)))
    ROWS.append({"kind":"official-site","url":url,"http":status,"destination":final,"page_bytes":len(page),
                 "articles":anchors[:50],"mp4_urls":urls[:30],
                 "article_refs":len(all_articles)})
    print("OFFICIAL",status,len(page),"links",len(anchors),"mp4",len(urls),url,flush=True)

# Deep inspect discovered official article pages, maximum 18 independent requests.
for u,title in list(all_articles.items())[:18]:
    status,final,page=fetch(u)
    urls=list(dict.fromkeys(re.findall(r'(?:https?://|/)[^\s"<>]+?\.mp4',page)))
    links=[]
    soup=BeautifulSoup(page,"html.parser")
    for tag in soup.find_all(["a","video","source"],href=True)+soup.find_all(["source","video"],src=True):
        dest=urljoin(final,tag.get("href") or tag.get("src"))
        if any(s in dest.lower() for s in (".mp4","download","/video/")):links.append(dest)
    ROWS.append({"kind":"porsche-article","url":u,"title":title[:140],"http":status,
                 "mp4_urls":urls[:15],"video_links":list(dict.fromkeys(links))[:15],
                 "page_bytes":len(page),"first_1000":page[:1000] if status!=200 else ""})
    print("ARTICLE",status,title[:60],"direct",len(urls),"video",len(links),flush=True)

(OUT/"discovery.json").write_text(json.dumps({"disclaimer":"Unverified web links, not evidence of actual downloadable 1080p video.","results":ROWS},indent=2))
with (OUT/"FOUND_URLS.txt").open("w") as f:
 for r in ROWS:
    for u in r.get("post_links",[])+r.get("mp4_urls",[])+r.get("video_links",[]):
      f.write(u+"\n")
    for a in r.get("articles",[]):f.write(a["url"]+"\n")
print("TOTAL POST LINKS",sum(len(r.get("post_links",[])) for r in ROWS))
