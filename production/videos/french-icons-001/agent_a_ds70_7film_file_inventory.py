#!/usr/bin/env python3
"""Enumerate original Citroen DS video files in publicly shared Stellantis press archive.

Open only the publisher-public Oodrive links in a normal browser.
Collect actual file sizes, video MIME and file names rather than asserting footage from folders.
"""
import asyncio,json,pathlib,re
from playwright.async_api import async_playwright
OUT=pathlib.Path("out/fr-a-ds-original-seven-videos");OUT.mkdir(parents=True,exist_ok=True)
URL="https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4"
ROOTFOLDER="2025 - The 70th ANNIVERSARY OF THE 1955 DS"
FOLDERS=[
 ("archive-original-seven-films","01 - DS Archives- vidéos"),
 ("paris-february-115-media","02 - 20250203 - DS PARADE IN PARIS BEFORE RETROMOBILE"),
 ("paris-october-event","00 - 202510_18&19_DS ANNIVERSARY_EVENT in PARIS")
]
async def main():
 all_results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=["--no-sandbox"])
  ctx=await browser.new_context(viewport={"width":1500,"height":1200},locale="en-GB")
  page=await ctx.new_page()
  events=[]
  async def on_response(response):
   if "/share-access/api/v1/items" not in response.url: return
   try:
    js=await response.json()
    coll=js.get("$collection",[])
    if isinstance(coll,list):
     events.append({"url":response.url,"items":[{
       "id":i.get("id"),"name":i.get("name"),"mime":i.get("contentType"),
       "size":i.get("size"),"isDir":i.get("isDir"),"childFolderCount":i.get("childFolderCount"),
       "childFileCount":i.get("childFileCount"),"actions":i.get("actions"),
       "sizeBytes":i.get("sizeBytes"),"checksum":i.get("checksum")
       } for i in coll]})
   except Exception as e:events.append({"error":str(e)[:220]})
  page.on("response",on_response)
  for tag,folder in FOLDERS:
   item={"folder_label":folder,"id":tag,"status":"NOT_ACCESSED"}
   try:
    await page.goto(URL,wait_until="domcontentloaded",timeout=50_000)
    await page.wait_for_timeout(3500)
    await page.get_by_text(ROOTFOLDER,exact=True).first.dblclick(timeout=21000)
    await page.wait_for_timeout(2500)
    events.clear()
    await page.get_by_text(folder,exact=True).first.dblclick(timeout=20000)
    await page.wait_for_timeout(3900)
    body=await page.locator("body").inner_text(timeout=14000)
    last=events[-1] if events else {}
    files=last.get("items",[])
    # Recover correct response when chunks/pagination duplicate.
    if not files:
     files=[a for res in events for a in res.get("items",[])]
    video=[a for a in files if str(a.get("mime","")).startswith("video/") or
      re.search(r"\.(?:mp4|webm|mov|mkv|m4v|avi)$",str(a.get("name","")),re.I)]
    item.update({"status":"FOLDER_OPENED","body_text":body[:15000],"files":files,
      "listed_file_count":len(files),"real_video_filename_candidates":video,
      "media_candidate_count":len(video)})
    print("PUBLISHER_DS_FOLDER",tag,"file_count",len(files),"video_count",len(video),
      "body",repr(body[:450]),flush=True)
    for v in video:print("ACTUAL_PUBLISHER_VIDEO_FILE",tag,v.get("name"),v.get("mime"),v.get("size"),v.get("id"),flush=True)
    await page.screenshot(path=str(OUT/(tag+".png")),full_page=True)
   except Exception as e:
    item.update({"status":"FOLDER_INACCESSIBLE","error":str(e)[:450]})
    print("CITROEN_VIDEO_FOLDER_ERROR",tag,item["error"],flush=True)
   all_results.append(item)
   (OUT/"manifest.json").write_text(json.dumps(all_results,indent=2,ensure_ascii=False))
  await browser.close()
 print("CITROEN_SEVEN_VIDEOS_RESULT",json.dumps({"folders_checked":len(all_results),
  "publisher_video_items":sum(x.get("media_candidate_count",0) for x in all_results),
  "actual_downloaded_video_files":0,"gate":"PENDING_REAL_DOWNLOAD"}),flush=True)
asyncio.run(main())
