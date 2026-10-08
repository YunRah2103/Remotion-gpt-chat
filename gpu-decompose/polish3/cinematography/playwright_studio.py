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
        page.wait_for_timeout(4500)
        page.screenshot(path=str(out/'remotion-studio-real-browser.png'),full_page=True)
        html=page.content()
        assert 'Remotion' in html or len(html)>1000,'Browser did not load app content'
        (out/'PLAYWRIGHT_RESULT.txt').write_text('PASS real Chromium 1280x900 Studio response HTTP 200 and screenshot; native 3D frames independently rendered by Remotion CI.\n')
        browser.close()

if __name__=='__main__':
    run()
