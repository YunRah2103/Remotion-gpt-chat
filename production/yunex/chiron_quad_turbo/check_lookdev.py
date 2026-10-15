#!/usr/bin/env python3
"""Inspect actual Remotion stills for fill/black-bar failures, contrast and dimensions.
This is a technical automated gate; not an aesthetic or vehicle-identity approval.
"""
import json,sys,statistics
from pathlib import Path
from PIL import Image,ImageStat

root=Path(sys.argv[1]); reports=[]
for stem in ('opening','turbo','payoff'):
    f=root/('lookdev_'+stem+'.png')
    if not f.is_file():raise SystemExit('LOOKDEV_MISSING '+str(f))
    im=Image.open(f).convert('RGB')
    if im.size!=(1080,1920):raise SystemExit('LOOKDEV_BAD_DIMENSIONS '+str(im.size))
    reduced=im.resize((108,192))
    top=reduced.crop((0,0,108,35))
    bottom=reduced.crop((0,157,108,192))
    def block_black(x):
        s=ImageStat.Stat(x.convert('L'))
        return (s.mean[0] < 10 and s.stddev[0] < 4)
    # Only fail on truly blank black slabs; genuine night footage can be dark.
    top_black=block_black(top)
    bottom_black=block_black(bottom)
    band_fail=top_black and bottom_black
    s=ImageStat.Stat(reduced.convert('L'))
    report={'frame':f.name,'width':im.width,'height':im.height,
            'mean_luma':round(s.mean[0],2),'stdev_luma':round(s.stddev[0],2),
            'top_black_slab':top_black,'bottom_black_slab':bottom_black,
            'suspected_letterboxing':band_fail}
    reports.append(report)
    print('CHIRON_LOOKDEV_REAL_FRAME_QA',json.dumps(report),flush=True)
    if band_fail:raise SystemExit('BLACK_BAR_FAILURE: '+str(f))
(root/'lookdev-technical-check.json').write_text(json.dumps({'results':reports,
  'verdict':'TECHNICAL_PICTURE_PASS_NOT_AESTHETIC_APPROVAL',
  'requires_human_review':'shot beauty, model identity, crop, source permissions'},indent=2)+'\n')
