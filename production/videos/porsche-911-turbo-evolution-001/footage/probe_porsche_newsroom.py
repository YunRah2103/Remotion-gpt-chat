#!/usr/bin/env python3
"""Discover linked public press-kit video resources; no video bytes downloaded."""
import argparse,html,json,re,urllib.request
from html.parser import HTMLParser
from pathlib import Path
URL='https://newsroom.porsche.com/en/press-kits/50-years-porsche-turbo.html'
class ResourceParser(HTMLParser):
    def __init__(self):super().__init__();self.resources=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('video','source','iframe','a','meta','script'):
            for k,v in dict(attrs).items():
                if v and (k in ('src','href','content','data-src','data-video','data-url','data-video-url','data-id') or re.search('video|media|stream',k,re.I)):
                    if 'http' in v or tag in ('video','source','iframe'):self.resources.append({'element':tag,'attribute':k,'value':v[:350]})
def inspect_markup(page):
    parser=ResourceParser();parser.feed(page)
    candidates=[]
    for m in re.finditer(r'(https?:\\?/\\?/[^\\s"<>]+|[^\\s"<>]+\.(?:mp4|m3u8|mov|webm|mpd))',page,re.I):
        val=html.unescape(m.group(0)).replace('\\/','/')
        if re.search(r'mp4|m3u8|mov|webm|mpd|vimeo|youtube|video',val,re.I):candidates.append(val[:400])
    terms=[]
    for phrase in ['b-roll','header-b-roll','video','930 Turbo','13:53','yt-player','vimeo','flowcenter']:
        m=re.search(re.escape(phrase),page,re.I)
        if m:terms.append({'term':phrase,'sample':re.sub(r'\s+',' ',page[max(0,m.start()-220):m.end()+300])[:560]})
    return {'htmlBytes':len(page.encode()),'elements':parser.resources[:120],
            'inlineUrls':list(dict.fromkeys(candidates))[:90],'textSnippets':terms}
def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=Path('out/porsche-a-newsroom.json'));p.add_argument('--self-test',action='store_true');a=p.parse_args()
    if a.self_test:
        q=inspect_markup('<video src="https://example.org/clip.mp4"></video>');assert q['elements'][0]['value'].endswith('.mp4');print('SELF_TEST_PASS');return 0
    result={'sourcePage':URL,'downloadedMedia':False,'rightsConfirmed':False}
    try:
        req=urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=35) as r:
            raw=r.read(6*1024*1024);result.update({'statusCode':r.status,'contentType':r.headers.get('content-type')});page=raw.decode('utf8','replace')
        result.update(inspect_markup(page))
    except Exception as e:result['error']=str(e)[:500]
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'statusCode':result.get('statusCode'),'mediaElements':len(result.get('elements',[])),'inlineMediaCandidates':len(result.get('inlineUrls',[])),'error':result.get('error')}))
    return 0 if result.get('statusCode')==200 else 2
if __name__=='__main__':raise SystemExit(main())
