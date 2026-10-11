#!/usr/bin/env python3
"""Load official Stellantis/Citroën public Oodrive press video share SPA in Chromium.

Only anonymous browser navigation; no logins, bypasses, or password guessing.
Surface genuine shared video filenames and publicly offered download URLs.
"""
import asyncio,json,pathlib,re
from playwright.async_api import async_playwright
OUT=pathlib.Path("out/fr-a-ds70-live-public-browser");OUT.mkdir(parents=True,exist_ok=True)
SHARES=[
 ("DS-70-2025-anniversary-200-original-DS-parade","https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4"),
 ("DS-70-official-retromobile-video-kit","https://sharing.oodrive.com/share-access/sharings/35sZY6sv.9qqSq9zw")
]
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=["--no-sandbox"])
  results=[]
  for name,url in SHARES:
   ctx=await browser.new_context(accept_downloads=False,locale="en-GB",
      viewport={"width":1440,"height":900},user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36")
   page=await ctx.new_page()
   record={"id":name,"url":url,"status":"NOT_OPENED","video_files_verified":0,
    "downloadable_originals_count":0,"network_requests":[],"network_responses":[]}
   reqs=[];resps=[]
   def track_req(req):
    u=req.url
    if ("oodrive" in u or ".json" in u or "/api/" in u) and len(reqs)<100:
     reqs.append({"method":req.method,"url":u[:500]})
   async def track_rsp(r):
    ct=r.headers.get("content-type","")
    if "json" in ct and len(resps)<60:
     try:
      txt=await r.text()
      resps.append({"url":r.url[:500],"status":r.status,"content_type":ct,
        "size":len(txt),"source_json_snippet":txt[:2000],
        "potential_media_names":list(dict.fromkeys(re.findall(r'[\w][^"<>]{3,110}\.(?:mp4|mov|webm|m4v)',txt,re.I)))[:25]})
     except Exception as e:resps.append({"url":r.url[:250],"error":str(e)[:130]})
   page.on("request",track_req)
   page.on("response",track_rsp)
   try:
    resp=await page.goto(url,wait_until="domcontentloaded",timeout=52000)
    await page.wait_for_timeout(11000)
    record["http_status"]=resp.status if resp else None
    record["loaded_url"]=page.url
    record["title"]=await page.title()
    body=await page.locator("body").inner_text(timeout=30000)
    record["visible_body_text"]=body[:10000]
    record["visible_links"]=await page.locator("a").evaluate_all("(els)=>els.slice(0,150).map(e=>({text:e.innerText.slice(0,100),href:e.href}))")
    record["visible_buttons"]=await page.locator("button").evaluate_all("(els)=>els.slice(0,100).map(e=>e.innerText.slice(0,100))")
    await page.screenshot(path=str(OUT/(name+".png")),full_page=True,timeout=18000)
    record["status"]="PUBLIC_BROWSER_LOADED" if "password" not in body.lower() else "PASSWORD_REQUESTED_CANNOT_USE"
    record["network_requests"]=reqs[-50:]
    record["network_responses"]=resps[-45:]
    media_names=list(dict.fromkeys(re.findall(r'[^\n]{0,120}\.(?:mp4|mov|webm|m4v)',body,re.I)))
    record["visible_video_filenames"]=media_names[:50]
    print("PUBLIC_PRESS_BROWSER",name,record["status"],"http",record["http_status"],
      "body",repr(body[:350]),"json_responses",len(resps),"media",media_names[:8],flush=True)
   except Exception as e:
    record.update({"status":"BROWSER_FETCH_FAILED","error":str(e)[:450]})
    print("PUBLIC_BROWSER_FAIL",name,str(e)[:200],flush=True)
   results.append(record)
   (OUT/"manifest.json").write_text(json.dumps(results,indent=2,ensure_ascii=False))
   await ctx.close()
  await browser.close()
  print("DS70_SPA_BROWSER_SUMMARY",json.dumps({"shares":len(results),
   "visible_media_files":sum(len(x.get("visible_video_filenames",[])) for x in results),
   "statuses":[x["status"] for x in results],"downloaded_movies":0}),flush=True)
asyncio.run(main())
