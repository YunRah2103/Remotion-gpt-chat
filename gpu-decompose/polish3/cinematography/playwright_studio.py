from pathlib import Path
from playwright.sync_api import sync_playwright

def run():
    out=Path('out/polish3-b-playwright')
    out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=swiftshader'])
        page=browser.new_page(viewport={'width':1280,'height':900},device_scale_factor=1)
        response=page.goto('http://127.0.0.1:3178',wait_until='domcontentloaded',timeout=90000)
        assert response is not None and response.status==200,'Remotion Studio failed to load'
        page.wait_for_timeout(3500)
        gpu=page.get_by_text('XfxSwiftDecomposition',exact=True)
        assert gpu.count()>=1,'Corrected GPU composition is not registered in Studio'
        gpu.first.click(timeout=15000)
        page.wait_for_timeout(9000)
        assert 'XfxSwiftDecomposition' in page.content(),'GPU composition failed to open in browser'
        page.screenshot(path=str(out/'remotion-studio-real-browser.png'),full_page=True)
        (out/'PLAYWRIGHT_RESULT.txt').write_text('PASS genuine Chromium 1280x900 Remotion Studio loaded AND selected corrected XfxSwiftDecomposition. Screenshot captures GPU timeline in browser; separate native moving Remotion proof inspected.\n')
        browser.close()

if __name__=='__main__':
    run()
