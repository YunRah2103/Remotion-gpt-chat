import requests,re,json,html
urls=[
"https://www.nascar.com/news-media/2019/03/01/prime-cuts-exclusive-exhilarating-racing-action-from-february/",
"https://www.nascar.com/news-media/2019/04/05/prime-cuts-exclusive-exhilarating-racing-action-from-march/",
"https://www.nascar.com/videos/franchise/nascar-cup-series-highlights/in-car-camera-christopher-bell-spins-from-the-lead/",
]
for url in urls:
 try:
  r=requests.get(url,timeout=25,headers={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36"})
  page=html.unescape(r.text)
  ids=sorted(set(re.findall(r'(?:youtube\.com/(?:embed/|watch\?v=)|youtu\.be/)([a-zA-Z0-9_-]{11})',page)))
  extra=sorted(set(re.findall(r'(?:(?:videoId|video_id|videoID)["\s:=]+)["\']?([A-Za-z0-9_-]{11})',page)))
  tokens=[m.group(0)[:300] for m in re.finditer(r'(?i)(?:brightcove|youtube|vimeo|jwplayer|playlist|videoUrl|mp4|m3u8)',page)][:8]
  print(json.dumps({"url":url,"http":r.status_code,"page_bytes":len(r.content),"youtube":ids,"extra":extra,"snippets":tokens}),flush=True)
 except Exception as e:print(json.dumps({"url":url,"error":str(e)}),flush=True)
