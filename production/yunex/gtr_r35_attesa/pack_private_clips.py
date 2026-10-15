#!/usr/bin/env python3
"""Cut nine PRIVATE source-scene options; full-decode and checksum. Not a visual approval."""
import argparse,hashlib,json,subprocess
from pathlib import Path

CLIPS=[
 ('A01_97_scene02',97,5.82,8.90,'hero opening candidate'),
 ('A02_97_scene03',97,10.00,13.60,'cinematic movement candidate'),
 ('A03_97_scene04',97,19.00,22.50,'exterior/detail candidate'),
 ('A04_97_scene05',97,29.00,33.10,'rolling footage candidate'),
 ('A05_97_scene06',97,38.45,42.30,'hero closing candidate'),
 ('B01_98_scene02',98,6.55,11.10,'launch/cockpit candidate'),
 ('B02_98_scene06',98,27.00,31.00,'acceleration/cockpit candidate'),
 ('C01_99_scene11',99,9.45,14.15,'official Nissan R35 insert'),
 ('C02_99_scene88',99,86.00,91.80,'official Nissan R35 closing insert'),
]
def run(args):
    return subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True).stdout
def sha256(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for block in iter(lambda:f.read(2*1024*1024),b''):
            h.update(block)
    return h.hexdigest()
def main():
    p=argparse.ArgumentParser()
    p.add_argument('--out',required=True)
    p.add_argument('--source',nargs=2,action='append',required=True)
    a=p.parse_args()
    root=Path(a.out);root.mkdir(parents=True,exist_ok=True)
    sources={int(n):path for n,path in a.source}
    meta={'project':'Nissan GT-R R35 ATTESA E-TS','state':'PRIVATE technically verified shot candidates — NOT visually approved','rights':'UNVERIFIED / not permitted for public distribution','clips':[]}
    for name,job,start,end,target_label in CLIPS:
        path=root/f'{name}.mp4'
        run(['ffmpeg','-hide_banner','-loglevel','error','-xerror','-ss',str(start),'-i',sources[job],'-t',str(round(end-start,3)),'-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart','-y',str(path)])
        run(['ffmpeg','-hide_banner','-loglevel','error','-xerror','-i',str(path),'-f','null','-'])
        probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)]))
        v=next(x for x in probe['streams'] if x['codec_type']=='video')
        record={'file':path.name,'phone_job':job,'source_start_seconds':start,'source_end_seconds':end,'planned_use_UNVERIFIED':target_label,'duration':float(probe['format']['duration']),'width':v['width'],'height':v['height'],'codec':v['codec_name'],'fps':v['avg_frame_rate'],'bytes':path.stat().st_size,'sha256':sha256(path),'full_decode':'PASS','audio':'removed','rights':'unverified/private review'}
        meta['clips'].append(record)
        print('R35_PRIVATE_EXTRACT_PASS',json.dumps(record),flush=True)
    (root/'manifest.json').write_text(json.dumps(meta,indent=2))
    (root/'README.txt').write_text('PRIVATE SOURCE REVIEW ONLY. These nine files were re-encoded and full-decoded; their contents and vertical subject position have NOT been visually approved. Rights unverified; do not publish. For time-labeled contact sheets see the companion private source QA draft Release.\n')
    print('PRIVATE_EXTRACTS_TOTAL',len(meta['clips']),flush=True)
if __name__=='__main__':main()
