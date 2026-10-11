#!/usr/bin/env python3
"""Inspect exact anonymous Oodrive press file download UI, including preview actions."""
import asyncio,json,pathlib
from playwright.async_api import async_playwright
OUT=pathlib.Path("out/fr-a-ds-original-media-ui");OUT.mkdir(parents=True,exist_ok=True)
SHARE="https://sharing.oodrive.com/share-access/sharings/fkoQfZ_6.yqqSq9z4"
ROOT="2025 - The 70th ANNIVERSARY OF THE 1955 DS"
CASES=[
 ("ds-2025-parade","02 - 20250203 - DS PARADE IN PARIS BEFORE RETROMOBILE","00 - VIDEO_DS_RETROMOBILE_PARADE-PARIS.mp4"),
 ("ds-archive-dynamic","01 - DS Archives- vidéos","DS Bande TV - 4 - Dynamiques - Uncompress 10 bits.mp4")
]
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=["--no-sandbox"])
  output=[]
  for slug,folder,name in CASES:
   ctx=await browser.new_context(accept_downloads=True,viewport={"width":1440,"height":940})
   page=await ctx.new_page()
   record={"id":slug,"folder":folder,"name":name,"events":[]}
   page.on("download",lambda d:print("FILE_DOWNLOAD_EVENT",d.suggested_filename,flush=True))
   try:
    await page.goto(SHARE,wait_until="domcontentloaded",timeout=55000);await page.wait_for_timeout(3000)
    await page.get_by_text(ROOT,exact=True).first.dblclick(timeout=15000);await page.wait_for_timeout(1700)
    await page.get_by_text(folder,exact=True).first.dblclick(timeout=16000);await page.wait_for_timeout(2100)
    item=page.get_by_text(name,exact=True).first
    record["item_found"]=await item.count()
    record["item_ancestor_html"]=await item.evaluate("(e)=>e.parentElement?.parentElement?.outerHTML.slice(0,6500)")
    record["buttons_before"]=await page.locator("button").evaluate_all("(e)=>e.slice(0,90).map(x=>({text:x.innerText,aria:x.getAttribute('aria-label'),title:x.getAttribute('title'),html:x.outerHTML.slice(0,500)}))")
    await page.screenshot(path=str(OUT/(slug+"-before.png")),full_page=False)
    await item.click(timeout=12000);await page.wait_for_timeout(2400)
    record["url_after_click"]=page.url
    record["body_after_click"]=(await page.locator("body").inner_text())[:5000]
    record["buttons_after"]=await page.locator("button").evaluate_all("(e)=>e.slice(0,110).map(x=>({text:x.innerText,aria:x.getAttribute('aria-label'),title:x.getAttribute('title'),html:x.outerHTML.slice(0,450)}))")
    await page.screenshot(path=str(OUT/(slug+"-after.png")),full_page=False)
    print("PRESS_UI_DISCOVERED",slug,"before",record["buttons_before"][-8:],"after",record["buttons_after"][-10:],"body",record["body_after_click"][:700],flush=True)
   except Exception as e:record["error"]=str(e)[:850];print("PRESS_UI_FAILED",slug,str(e)[:400],flush=True)
   output.append(record);(OUT/"manifest.json").write_text(json.dumps(output,indent=2))
   await ctx.close()
  await browser.close()
asyncio.run(main())
