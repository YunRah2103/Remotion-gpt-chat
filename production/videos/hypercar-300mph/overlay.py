import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1080,1920
F='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'
FL='/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf'
if not os.path.exists(FL): FL=F
def font(s,f=F): return ImageFont.truetype(f,s)
def ss(a,b,x):
    u=max(0,min(1,(x-a)/(b-a))); return u*u*(3-2*u)
def win(t,a,b,fi=0.25,fo=0.25): return ss(a,a+fi,t)*(1-ss(b-fo,b,t))
CAPS=[(0.77,5.54,"At 300 miles per hour, you're travelling 134 metres every second."),
(5.96,8.48,"Your tyres are spinning thousands of times per minute."),
(8.86,11.3,"The air pushes against you with incredible force."),
(11.8,12.7,"And at this speed,"),(12.95,15.5,"even the smallest mistake can be catastrophic."),
(16.1,19.3,"This is what it takes to reach 300 miles per hour.")]
def wrap(d,txt,f,maxw):
    lines=[];cur=''
    for w in txt.split():
        tr=(cur+' '+w).strip()
        if d.textlength(tr,font=f)<=maxw: cur=tr
        else: lines.append(cur);cur=w
    lines.append(cur);return lines
def text(img,xy,s,f,fill,alpha=1.0,anchor='la',glow=None):
    if alpha<=0.01: return
    lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    if glow:
        g=Image.new('RGBA',img.size,(0,0,0,0)); ImageDraw.Draw(g).text(xy,s,font=f,fill=(*glow,int(200*alpha)),anchor=anchor)
        g=g.filter(ImageFilter.GaussianBlur(14)); img.alpha_composite(g)
    d.text((xy[0]+3,xy[1]+4),s,font=f,fill=(0,0,0,int(170*alpha)),anchor=anchor)
    d.text(xy,s,font=f,fill=(*fill,int(255*alpha)),anchor=anchor); img.alpha_composite(lay)
def line(img,p0,p1,col,alpha,wd=3):
    lay=Image.new('RGBA',img.size,(0,0,0,0)); ImageDraw.Draw(lay).line([p0,p1],fill=(*col,int(255*alpha)),width=wd); img.alpha_composite(lay)
def dot(img,p,col,alpha,r=9):
    lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.ellipse([p[0]-r,p[1]-r,p[0]+r,p[1]+r],outline=(*col,int(255*alpha)),width=3); d.ellipse([p[0]-3,p[1]-3,p[0]+3,p[1]+3],fill=(*col,int(255*alpha))); img.alpha_composite(lay)
CY=(90,210,255); OR=(255,150,60); RD=(255,60,50); WH=(255,255,255)
os.makedirs('ov',exist_ok=True)
vig=Image.new('RGBA',(W,H),(0,0,0,0))
for i in range(645):
    t=i/30; img=Image.new('RGBA',(W,H),(0,0,0,0))
    # speed counter
    a=win(t,0.25,5.4,0.2,0.4)
    if a>0:
        mph=int(round(120+180*ss(0.2,3.4,t))); 
        text(img,(540,1130),f"{mph}",font(230),WH,a,'mm',CY)
        text(img,(540,1262),"MPH",font(56),CY,a,'mm')
        bw=520; lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
        d.rounded_rectangle([540-bw/2,1310,540+bw/2,1318],4,fill=(255,255,255,int(60*a)))
        d.rounded_rectangle([540-bw/2,1310,540-bw/2+bw*mph/300,1318],4,fill=(*CY,int(255*a))); img.alpha_composite(lay)
    a=win(t,2.0,5.2,0.3,0.3)
    text(img,(540,1360),"= 134 METRES EVERY SECOND",font(34,FL),OR,a,'mm')
    # tyre callouts
    a=win(t,6.2,8.6,0.35,0.3)
    if a>0:
        x=ss(6.2,6.9,t); p=(630,1010)
        dot(img,p,CY,a); line(img,p,(p[0]+(300)*x,p[1]-110*x),CY,a); line(img,(p[0]+300*x,p[1]-110*x),(1040,p[1]-110*x),CY,a)
        text(img,(1040,p[1]-215),"3,660",font(120),WH,a*x,'ra',CY); text(img,(1040,p[1]-92+0),"RPM · TYRE ROTATION",font(30,FL),CY,a*x,'ra')
        b=ss(7.0,7.7,t); p2=(560,1090)
        line(img,(60,1330),(60+420*b,1330),OR,a*b); 
        text(img,(60,1235),"≈ 5,200 G",font(104),WH,a*b,'la',OR); text(img,(60,1348),"FORCE ON THE TREAD",font(30,FL),OR,a*b,'la')
    # air
    a=win(t,9.1,11.4,0.35,0.3)
    if a>0:
        text(img,(60,300),"≈ 8,000 N",font(124),WH,a,'la',CY); text(img,(60,430),"AERODYNAMIC DRAG",font(34,FL),CY,a,'la')
        line(img,(60,480),(60+380*ss(9.1,9.6,t),480),CY,a,3)
    a=win(t,10.5,12.0,0.3,0.3)
    text(img,(540,1490-110),"DRAG RISES WITH SPEED²",font(40,FL),OR,a,'mm')
    # mistake
    a=win(t,12.5,15.4,0.3,0.4)
    if a>0:
        pulse=0.55+0.45*math.sin(t*9)
        text(img,(540,330),"ZERO MARGIN",font(96),RD,a*pulse+0.3*a,'mm',RD)
        text(img,(540,430),"ONE MISTAKE · ONE SECOND",font(32,FL),WH,a*0.9,'mm')
    # finale
    a=win(t,19.85,21.5,0.12,0.25)
    if a>0:
        k=ss(19.85,20.15,t); text(img,(540,900),"300 MPH",font(190),WH,a*k,'mm',CY)
        text(img,(540,1050),"134 m/s  ·  483 km/h",font(46,FL),OR,a*ss(20.2,20.6,t),'mm')
        text(img,(540,1130),"FOLLOW FOR MORE",font(36,FL),CY,a*ss(20.8,21.1,t),'mm')
    # captions
    for s,e,txt in CAPS:
        ca=win(t,s,e,0.12,0.15)
        if ca>0:
            d=ImageDraw.Draw(img); f=font(58); L=wrap(d,txt,f,900)
            y=1560+(0 if len(L)<3 else -30)
            for j,l in enumerate(L): text(img,(540,y+j*74),l,f,WH,ca,'mm')
    # red vignette pulse in mistake
    if 12.8<t<15.4:
        p=(0.5+0.5*math.sin(t*9))*0.35*win(t,12.8,15.4,.3,.4)
        if i%1==0:
            v=Image.new('RGBA',(W,H),(0,0,0,0)); dv=ImageDraw.Draw(v)
            for r in range(10): dv.rectangle([r*7,r*7,W-r*7,H-r*7],outline=(255,30,20,int(p*255*(1-r/10))),width=7)
            img.alpha_composite(v)
    img.save(f'ov/o{i:04d}.png')
