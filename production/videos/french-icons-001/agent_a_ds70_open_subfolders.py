#!/usr/bin/env python3
"""Explore PUBLIC Oodrive Stellantis DS70 anniversary archive subfolders in real Chromium."""
import asyncio,json,pathlib,re
from playwright.async_api import async_playwright
O=pathlib.Path("out/fr-a-ds70-video-folder-audit");O.mkdir(parents=True,exist_ok=True)
ROOT="https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4"
TARGET="2025 - The 70th ANNIVERSARY OF THE 1955 DS"
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=["--no-sandbox"])
  ctx=await browser.new_context(viewport={"width":1440,"height":950},locale="en-GB")
  page=await ctx.new_page()
  log=[];calls=[]
  def track_req(req):
   if "/api/v1/items" in req.url:
    calls.append({"url":req.url,"method":req.method,"body":str(req.post_data)[:1300]})
  async def track_res(r):
   if "/api/v1/items" in r.url and "json" in r.headers.get("content-type",""):
    try:
     d=await r.json()
     items=d.get("$collection",[]) if isinstance(d,dict) else []
     log.append({"url":r.url,"http":r.status,"count":len(items),
       "items":[{"id":it.get("id"),"name":it.get("name"),"contentType":it.get("contentType"),
         "size":it.get("size"),"isDir":it.get("isDir"),"children":it.get("childFolderCount"),
         "childFiles":it.get("childFileCount"),"actions":it.get("actions")}
          for it in items[:100]]})
    except Exception as e:log.append({"error":str(e)[:300]})
  page.on("request",track_req);page.on("response",track_res)
  rows=[]
  try:
   await page.goto(ROOT,wait_until="domcontentloaded",timeout=55000)
   await page.wait_for_timeout(5500)
   rows.append({"stage":"homepage","body":(await page.locator("body").inner_text())[:6000]})
   print("DS_SHARING_ROOT",rows[-1]["body"][:600],flush=True)
   target=page.get_by_text(TARGET,exact=True)
   print("DS_TARGET_VISIBLE",await target.count(),flush=True)
   if await target.count():
    await target.first.dblclick(timeout=25000)
    await page.wait_for_timeout(4500)
    rows.append({"stage":"inside-anniversary-folder","body":(await page.locator("body").inner_text())[:11000]})
    await page.screenshot(path=str(O/"inside-anniversary-folder.png"),full_page=True)
    print("DS_ANNIVERSARY_CONTENTS",rows[-1]["body"][:2400],flush=True)
    # Open one obvious media/videos folder, if offered.
    names=re.findall(r"[^\\n]*(?:vid[ée]o|film|clip|rush|motion)[^\\n]*",rows[-1]["body"],re.I)
    for name in names[:2]:
     item=page.get_by_text(name.strip(),exact=True)
     if await item.count():
      try:
       await item.first.dblclick(timeout=12000)
       await page.wait_for_timeout(3800)
       rows.append({"stage":"video-subfolder","clicked":name,"body":(await page.locator("body").inner_text())[:10000]})
       await page.screenshot(path=str(O/"video-subfolder.png"),full_page=True)
       print("DS_VIDEO_FOLDER_CONTENTS",repr(rows[-1]["body"][:2800]),flush=True)
       break
      except Exception as e:print("DS_VIDEO_CLICK_FAILED",str(e)[:180],flush=True)
   else:print("DS_FOLDER_MISSING",flush=True)
  except Exception as e:print("BROWSER_ERROR",str(e)[:400],flush=True)
  (O/"manifest.json").write_text(json.dumps({"pages":rows,"api_responses":log,"api_request_summaries":calls},indent=2,ensure_ascii=False))
  print("DS70_SUBFOLDER_SUMMARY",json.dumps({"response_pages":len(log),"listed_items":sum(len(x.get("items",[])) for x in log),
   "pages_opened":len(rows),
   "video_file_candidates":[{"name":i.get("name"),"contentType":i.get("contentType")} for x in log for i in x.get("items",[]) if re.search(r'\.(?:mp4|mov|webm|m4v)$',str(i.get("name","")),re.I)]}),flush=True)
  await browser.close()
asyncio.run(main())
