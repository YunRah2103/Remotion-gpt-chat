#!/usr/bin/env python3
"""EP005 Agent 6: strict native MP4 acceptance diagnostics (visual review still required)."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageStat

def run(args):
    subprocess.run(args, check=True)

def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1048576),b''): h.update(chunk)
    return h.hexdigest()

def main():
    video=Path(sys.argv[1]); dest=Path(sys.argv[2])
    dest.mkdir(parents=True,exist_ok=True)
    if not video.is_file() or video.stat().st_size<100000:
        raise RuntimeError('Missing substantial native rendered MP4: '+str(video))
    probe=json.loads(subprocess.check_output([
      'ffprobe','-v','error','-select_streams','v:0',
      '-show_entries','stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_frames,duration',
      '-of','json',str(video)]))['streams'][0]
    assert probe['codec_name']=='h264', probe
    assert (probe['width'],probe['height'])==(1080,1920),probe
    assert probe['r_frame_rate']=='30/1' and int(probe['nb_frames'])==120,probe
    assert probe['pix_fmt'] in ['yuv420p','yuvj420p'],probe
    run(['ffmpeg','-hide_banner','-v','error','-xerror','-i',str(video),'-f','null','-'])
    still_dir=dest/'frames';still_dir.mkdir(exist_ok=True)
    sheet=Image.new('RGB',(1500,1900),(220,228,234));draw=ImageDraw.Draw(sheet)
    hashes=[];lumas=[]
    sample=(0,23,47,71,95,119)
    for idx,frame in enumerate(sample):
        still=still_dir/('frame-%03d.png'%frame)
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),
             '-vf','select=eq(n\\,%d)'%frame,'-vsync','vfr','-frames:v','1',str(still)])
        im=Image.open(still).convert('RGB')
        hashes.append(sha(still))
        lumas.append(sum(ImageStat.Stat(im).mean)/3)
        im.thumbnail((480,900))
        x=idx%3*500+(500-im.width)//2
        y=idx//3*950+(915-im.height)//2
        sheet.paste(im,(x,y))
        draw.text((idx%3*500+22,idx//3*950+923),'frame %03d'%frame,fill=(19,29,39))
    if len(set(hashes))!=len(sample):
        raise RuntimeError('Repeated keyframe images: frozen/static video')
    if min(lumas)<15:
        raise RuntimeError('Near-black image in full-frame still sample')
    contact=dest/'contact-sheet.jpg';sheet.save(contact,quality=92)
    commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
    data={'source_commit':commit,'approved_design_source':'9052a539e10a7cb97487c1435455bb9962ad58e1',
          'approved_scope':'exterior car only','mp4':str(video),
          'mp4_sha256':sha(video),'probe':probe,'all_120_frames_decoded':True,
          'six_distinct_motion_samples':True,'mean_luma_samples':lumas,
          'contact_sheet':str(contact),'contact_sheet_sha256':sha(contact),
          'status':'Native proof verified; independent full-resolution visual owner review still required'}
    (dest/'QA.json').write_text(json.dumps(data,indent=2)+'\n')
    (dest/'SOURCE_COMMIT.txt').write_text(commit+'\n')
    print(json.dumps(data,indent=2))

if __name__=='__main__':main()
