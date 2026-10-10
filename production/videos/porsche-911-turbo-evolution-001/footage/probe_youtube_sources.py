#!/usr/bin/env python3
"""Metadata-only native yt-dlp Porsche source probe: NO video content downloaded."""
import argparse,json,subprocess,sys
from pathlib import Path
SOURCES=[
{"id":"carwow-2026-all-turbos","url":"https://www.youtube.com/watch?v=gbnBo2Au-uA","creator":"carwow"},
{"id":"carwow-2022-turbos","url":"https://www.youtube.com/watch?v=FFmT22sq6u8","creator":"carwow"},
{"id":"savagegeese-history","url":"https://www.youtube.com/watch?v=Jj2yUtiy7rk","creator":"savagegeese"}]
def summarize(data,spec):
    formats=[]
    for f in data.get('formats') or []:
        w,h,fps=f.get('width') or 0,f.get('height') or 0,f.get('fps') or 0
        if f.get('vcodec')=='none' or not h or not w:continue
        formats.append({'formatId':str(f.get('format_id','')),'width':int(w),'height':int(h),'fps':float(fps),'videoCodec':f.get('vcodec'),'ext':f.get('ext'),'tbrKbps':f.get('tbr'),'filesize':f.get('filesize') or f.get('filesize_approx')})
    formats.sort(key=lambda f:(f['height'],f['fps'],f['tbrKbps'] or 0),reverse=True)
    return {'id':spec['id'],'url':spec['url'],'originCreator':spec['creator'],
            'status':'METADATA_ONLY','sourceTitle':data.get('title'),'youtubeId':data.get('id'),
            'durationSeconds':data.get('duration'),'channel':data.get('channel'),
            'availableVideoFormatCount':len(formats),'topFormats':formats[:14],
            'nativeMediaDownloaded':False,'sha256':None,
            'identityVerified':False,'distinctMovingScenesVerified':0,'rightsVerified':False}
def probe(spec):
    cmd=[sys.executable,'-m','yt_dlp','--ignore-config','--no-playlist',
         '--skip-download','--dump-single-json','--no-warnings','--js-runtimes','node',
         '--socket-timeout','15','--retries','1','--extractor-retries','1',spec['url']]
    try:
        p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=150,text=True)
    except (subprocess.TimeoutExpired,OSError) as e:
        return {'id':spec['id'],'url':spec['url'],'status':'FAILED','error':str(e)[:350],'nativeMediaDownloaded':False}
    if p.returncode:
        return {'id':spec['id'],'url':spec['url'],'status':'FAILED','error':p.stderr[-1100:],'nativeMediaDownloaded':False}
    try:return summarize(json.loads(p.stdout),spec)
    except (ValueError,TypeError,KeyError) as e:
        return {'id':spec['id'],'url':spec['url'],'status':'FAILED','error':str(e)[:350],'nativeMediaDownloaded':False}
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,default=Path('out/porsche-a-source-probe.json'))
    parser.add_argument('--self-test',action='store_true')
    args=parser.parse_args()
    if args.self_test:
        example={'id':'TEST','formats':[
            {'format_id':'a','vcodec':'av01','width':1920,'height':1080,'fps':60,'tbr':2000},
            {'format_id':'b','vcodec':'avc1','width':1280,'height':720,'fps':30,'tbr':1200},
            {'format_id':'audio','vcodec':'none','acodec':'opus'}]}
        s=summarize(example,SOURCES[0]);assert s['topFormats'][0]['height']==1080
        assert len(s['topFormats'])==2 and s['distinctMovingScenesVerified']==0
        print('SELF_TEST_PASS: no video downloaded or visually verified')
        return 0
    data={'schemaVersion':1,'purpose':'Non-downloading real source format discovery, not a Porsche footage handoff','sources':[probe(s) for s in SOURCES]}
    data['metadataSuccessCount']=sum(s['status']=='METADATA_ONLY' for s in data['sources'])
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'metadataSuccessCount':data['metadataSuccessCount'],'sources':[
        {'id':s['id'],'status':s['status'],'topHeight':s.get('topFormats',[{}])[0].get('height') if s.get('topFormats') else None,'error':s.get('error')} for s in data['sources']]},indent=2))
    return 0 if data['metadataSuccessCount'] else 2
if __name__=='__main__':
    raise SystemExit(main())
