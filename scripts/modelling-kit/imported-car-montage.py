#!/usr/bin/env python3
"""Create an attributed 10-car YUNEX montage from actual Remotion GLB still renders.

The images are ONLY from pinned CC-credited catalogue entries; no unverified
candidate imagery is publicly uploaded. Requires Pillow and ffmpeg.
"""
import json
import math
import pathlib
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT=pathlib.Path(__file__).resolve().parents[2]
CAT=json.loads((ROOT/'production/assets/imported-cars/catalog.json').read_text())['vehicles']
CARS=[c for c in CAT if c['readiness']=='attribution-required']
OUT=ROOT/'out/imported-cars/showcase'
OUT.mkdir(parents=True,exist_ok=True)
W,H=1080,1920
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def font(sz,bold=False):
 p='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else FONT
 return ImageFont.truetype(p,sz)

def rectgrad(img,x1,y1,x2,y2,color,alpha,maxalpha=None):
 # Blend a translucent dark banner so its caption never obscures a car.
 if maxalpha is None:maxalpha=alpha
 px=Image.new('RGBA',(x2-x1,y2-y1),(0,0,0,0))
 d=ImageDraw.Draw(px)
 for y in range(y2-y1):
  a=int(alpha+(maxalpha-alpha)*(y/max(1,y2-y1-1)))
  d.line((0,y,x2-x1,y),fill=(*color,a))
 img.alpha_composite(px,(x1,y1))

def make_frame(car,i):
 source=OUT/'stills'/f"{car['id']}.png"
 if not source.exists():raise RuntimeError('Missing REAL GLB still: '+str(source))
 img=Image.open(source).convert('RGB').resize((W,H),Image.Resampling.LANCZOS).convert('RGBA')
 rectgrad(img,0,0,W,325,(8,14,18),235,175)
 rectgrad(img,0,1510,W,H,(8,14,18),25,248)
 draw=ImageDraw.Draw(img)
 draw.rectangle([48,65,66,130],fill=(40,222,168))
 draw.text((92,64),'YUNEX  /  MODEL LIBRARY',font=font(30,True),fill='#bdf5e3')
 draw.text((92,120),'IMPORTED 3D VEHICLE  •  REAL SOURCE MESH',font=font(19),fill='#bdd1ce')
 draw.rounded_rectangle([755,65,1030,127],radius=12,fill=(34,68,67,240))
 draw.text((776,77),f'{i:02d} / {len(CARS):02d}',font=font(29,True),fill='#dcfff3')
 name=car['name']
 size=57 if len(name)<21 else 42
 draw.text((58,1548),name,font=font(size,True),fill='#ffffff',stroke_width=2,stroke_fill='#122027')
 draw.text((61,1637),car['kind'].upper()+'  •  REAL GLB MODEL',font=font(28,True),fill='#54e8ba')
 creator='MODEL: '+car['creator']+'  |  '+car['license']
 if len(creator)>57:creator=creator[:54]+'...'
 draw.text((61,1738),creator,font=font(23),fill='#d8e2e4')
 draw.text((61,1804),'PRODUCTION VISUAL CHECK  •  NOT PHOTOREAL CERTIFIED',font=font(18),fill='#afbfc2')
 result=OUT/'posters'/f"{i:02d}-{car['id']}.png"
 result.parent.mkdir(parents=True,exist_ok=True)
 img.convert('RGB').save(result,optimize=True)
 return result

def make_card(title,subtitle,out):
 bg=Image.new('RGB',(W,H),(8,16,20))
 d=ImageDraw.Draw(bg)
 for y in range(H):
  g=int(16+19*(y/H))
  d.line((0,y,W,y),fill=(6,g,g+4))
 d.rectangle([68,690,81,1006],fill='#36deab')
 d.text((115,740),title,font=font(64,True),fill='#e5fff5')
 d.text((115,850),subtitle,font=font(28),fill='#bcd8d1')
 d.text((115,1036),'YUNEX  •  2026',font=font(23,True),fill='#41deae')
 bg.save(out)

def render_clip(png,duration_frames,out):
 # Animate actual rendered GLB image with a subtle scale-in; do not fake a moving car.
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-framerate','30',
  '-i',str(png),'-vf',"zoompan=z='min(zoom+0.0008,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,format=yuv420p",
  '-frames:v',str(duration_frames),'-r','30','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',str(out)],check=True)
def main():
 if len(CARS)!=10:raise RuntimeError('Only the 10 attributed-ready imported GLBs are eligible for showcase')
 cards=[]
 intro=OUT/'intro.png';make_card('THE REAL CAR KIT','10 ATTRIBUTED IMPORTED 3D MODELS',intro)
 cards.append(intro)
 for i,car in enumerate(CARS,1):cards.append(make_frame(car,i))
 outro=OUT/'outro.png';make_card('MORE TO EXPLORE','96 additional candidates remain PRIVATE REVIEW ONLY',outro)
 cards.append(outro)
 clips=[]
 for j,card in enumerate(cards):
  clip=OUT/'clips'/f'{j:02d}.mp4'
  clip.parent.mkdir(parents=True,exist_ok=True)
  render_clip(card,45 if j in (0,len(cards)-1) else 63,clip)
  clips.append(clip)
 concat=OUT/'clips.txt'
 concat.write_text(''.join(f"file '{p.as_posix()}'\n" for p in clips))
 final=OUT/'YUNEX-Real-Imported-Cars-Showcase.mp4'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),
  '-c','copy','-movflags','+faststart',str(final)],check=True)
 expected=90+63*len(CARS)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0',
  '-show_entries','stream=width,height,avg_frame_rate,nb_read_frames','-of','json',str(final)]))
 p=probe['streams'][0]
 if(p['width'],p['height'],p['avg_frame_rate'],int(p['nb_read_frames']))!=(W,H,'30/1',expected):
  raise RuntimeError('Invalid video properties: '+str(probe))
 subprocess.run(['ffmpeg','-v','error','-i',str(final),'-f','null','-'],check=True)
 report={'title':'YUNEX 10 attributed GLB car showcase',
  'movie':str(final),'frames':expected,'fps':30,'dimensions':[W,H],
  'rights':'CC BY/CC0 attribution included. No rights-unverified external GLB material rendered.',
  'note':'Montage consists of REAL rendered GLB stills with an editorial camera push, not simulated driving',
  'cars':[{'id':c['id'],'name':c['name'],'creator':c['creator'],'license':c['license'],
   'originalUrl':c['originalUrl']} for c in CARS]}
 (OUT/'showcase-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
 print('VERIFIED SHOWCASE',final,'frames',expected)
if __name__=='__main__':main()
