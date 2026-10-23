#!/usr/bin/env python3
"""Bundle ALL hash-verified original .glb assets into separate GitHub release archives.
The catalogue, creator attribution and licence notes are included in every shard.
Git history stays lean: the archives live in GitHub Releases, not in commits.
"""
import argparse, hashlib, json, pathlib, zipfile

ROOT=pathlib.Path(__file__).resolve().parent
CATALOG=json.loads((ROOT/'catalog.json').read_text(encoding='utf-8'))
LICENSE=(ROOT/'UPSTREAM_LICENSE.md').read_text(encoding='utf-8')

def blob_sha(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',default='public/external-cars')
    parser.add_argument('--dest',default='out/external-cars-release')
    parser.add_argument('--shard-mb',type=int,default=260)
    args=parser.parse_args()
    src,dest=pathlib.Path(args.source),pathlib.Path(args.dest)
    dest.mkdir(parents=True,exist_ok=True)
    maximum=args.shard_mb*1024*1024
    chunks=[]; current=[]; current_bytes=0
    for car in CATALOG['models']:
        if car['bytes']>maximum:raise ValueError('Model bigger than configured shard: '+car['id'])
        if current and current_bytes+car['bytes']>maximum:
            chunks.append(current);current=[];current_bytes=0
        current.append(car);current_bytes+=car['bytes']
    if current:chunks.append(current)
    written=[]
    for i,group in enumerate(chunks,1):
        archive=dest/f'yunex-original-cars-{i:02d}-of-{len(chunks):02d}.zip'
        print('Packing',archive,'models',len(group),flush=True)
        credits=[
          'YUNEX original GLB car model archive',
          'Source: '+CATALOG['source']['sourceURL'],
          'Pinned commit: '+CATALOG['source']['commit'],
          'Preserves upstream processed assets (weld/simplify/prune/meshopt).',
          'Review the included UPSTREAM_LICENSE.md and per-model Sketchfab source.',
          'CC BY 4.0 requires attribution; CC BY-SA 4.0 has ShareAlike obligations.',
          'The catalogue transcribes upstream license claims; provenance not independently audited.',''
        ]
        for car in group:
            c=car['credit']
            credits.append(f"{car['file']} | {c['sourceName']} | {c['author']} | {c['license']} | {c['sourceUrl']}")
        with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED,allowZip64=True) as z:
            z.writestr('README-CREDITS.txt','\n'.join(credits)+'\n')
            z.writestr('UPSTREAM_LICENSE.md',LICENSE)
            z.writestr('catalog-subset.json',json.dumps({'source':CATALOG['source'],'models':group},indent=2,ensure_ascii=False))
            for car in group:
                asset=src/car['file']
                data=asset.read_bytes()
                if len(data)!=car['bytes'] or data[:4]!=b'glTF' or blob_sha(data)!=car['githubBlobSha']:
                    raise RuntimeError(f'Cannot package unverified asset: {car["id"]}')
                z.writestr('cars/'+car['file'],data)
        with zipfile.ZipFile(archive) as z:
            bad=z.testzip()
            if bad:raise RuntimeError('Corrupted archive member: '+bad)
        written.append({'file':archive.name,'models':len(group),'uncompressedGLBBytes':sum(c['bytes'] for c in group),'archiveBytes':archive.stat().st_size})
    output={
      'name':'YUNEX Real Car Library',
      'version':'2026-10-23',
      'source':CATALOG['source'],
      'totalCars':len(CATALOG['models']),
      'totalGLBBytes':sum(x['bytes'] for x in CATALOG['models']),
      'shards':written
    }
    (dest/'release-index.json').write_text(json.dumps(output,indent=2)+'\n',encoding='utf-8')
    (dest/'README.md').write_text(
      '# YUNEX full original car library\n\n'+
      f"{output['totalCars']} original GLB files in {len(chunks)} downloadable ZIP archives.\n\n"+
      'All asset filenames, original authors, source links, licence records, sizes and pinned git blob hashes are in external-assets/cars/catalog.json.\n\n'+
      'Models from https://github.com/pedrosoandre/carros at commit '+CATALOG['source']['commit']+'.\n'+
      'Files are stored in each ZIP under cars/. Models were optimized upstream; review original author licences before publishing derivative works.\n',
      encoding='utf-8'
    )
    print(json.dumps(output,indent=2),flush=True)

if __name__=='__main__':main()
