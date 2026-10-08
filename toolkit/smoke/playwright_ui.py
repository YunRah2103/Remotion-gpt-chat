"""Verify that headless Chromium can actually render and capture a page."""
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path("toolkit/out")
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 480, "height": 280}, device_scale_factor=1)
    page.set_content('<main style="font:32px sans-serif;background:#062619;color:white;padding:40px"><h1>Creative Toolkit</h1><p>Browser proof</p></main>')
    assert page.locator("h1").inner_text() == "Creative Toolkit"
    path = out / "playwright.png"
    page.screenshot(path=str(path))
    assert path.stat().st_size > 1000
    browser.close()
print("PLAYWRIGHT_SMOKE_PASS", path)
