import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W,H=1080,1920
FB='/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'; FM='/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf'
if not os.path.exists(FM): FM=FB
_f={}
def font(s,b=True):
    k=(s,b)
    if k not in _f: _f[k]=ImageFont.truetype(FB if b else FM,s)
    return _f[k]
def ss(a,b,x):
    u=max(0,min(1,(x-a)/(b-a))); return u*u*(3-2*u)
def win(t,a,b,fi=0.3,fo=0.3): return ss(a,a+fi,t)*(1-ss(b-fo,b,t))
CY=(70,210,255); OR=(255,150,50); RD=(255,60,50); WH=(255,255,255); YL=(255,224,70)
def glow(img,draw_fn,col,rad,amt):
    g=Image.new('RGBA',img.size,(0,0,0,0)); draw_fn(ImageDraw.Draw(g),col); g=g.filter(ImageFilter.GaussianBlur(rad))
    if amt!=1: g.putalpha(g.getchannel('A').point(lambda v:min(255,int(v*amt))))
    img.alpha_composite(g)
def text(img,xy,s,f,fill,a=1,anchor='la',gl=None,stroke=0):
    if a<=0.01: return
    if gl: glow(img,lambda d,c:d.text(xy,s,font=f,fill=(*c,int(230*a)),anchor=anchor),gl,14,1.0)
    lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.text((xy[0]+2,xy[1]+4),s,font=f,fill=(0,0,0,int(160*a)),anchor=anchor)
    d.text(xy,s,font=f,fill=(*fill,int(255*a)),anchor=anchor,stroke_width=stroke,stroke_fill=(0,0,0,int(255*a))); img.alpha_composite(lay)
def card(img,box,a,accent=CY,r=26):
    x0,y0,x1,y1=box; lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.rounded_rectangle(box,r,fill=(8,12,20,int(165*a)),outline=(255,255,255,int(55*a)),width=2)
    d.rounded_rectangle([x0,y0+16,x0+7,y1-16],3,fill=(*accent,int(255*a))); img.alpha_composite(lay)
def arc(img,c,rad,v,a,wd=26):
    x,y=c; lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    bb=[x-rad,y-rad,x+rad,y+rad]
    d.arc(bb,135,405,fill=(255,255,255,int(45*a)),width=wd)
    n=60
    for i in range(int(n*v)):
        u=i/n; col=tuple(int(CY[k]+(OR[k]-CY[k])*u) for k in range(3))
        d.arc(bb,135+270*u,135+270*(u+1/n)+1.2,fill=(*col,int(255*a)),width=wd)
    for i in range(31):
        ang=math.radians(135+270*i/30); r0=rad+22; r1=rad+(40 if i%5==0 else 30)
        d.line([(x+r0*math.cos(ang),y+r0*math.sin(ang)),(x+r1*math.cos(ang),y+r1*math.sin(ang))],fill=(255,255,255,int((180 if i%5==0 else 80)*a)),width=3)
    glow(img,lambda dd,c:dd.bitmap((0,0),lay.getchannel('A'),fill=(*c,255)),CY,16,0.8)
    img.alpha_composite(lay)
CAPS=[(0.77,5.54,"At 300 miles per hour, you're travelling 134 metres every second."),
(5.96,8.48,"Your tyres are spinning thousands of times per minute."),
(8.86,11.3,"The air pushes against you with incredible force."),
(11.8,12.64,"And at this speed,"),(12.95,15.5,"even the smallest mistake can be catastrophic."),
(16.1,19.3,"This is what it takes to reach 300 miles per hour.")]
def wrap(d,words,f,maxw):
    lines=[[]]
    for w in words:
        if d.textlength(' '.join(lines[-1]+[w]),font=f)<=maxw or not lines[-1]: lines[-1].append(w)
        else: lines.append([w])
    return lines
def captions(img,t):
    for s,e,txt in CAPS:
        ca=win(t,s,e,0.1,0.15)
        if ca<=0: continue
        words=txt.split(); L=[len(w)+2 for w in words]; tot=sum(L); acc=0; spans=[]
        for l in L: spans.append((s+(e-s)*0.97*acc/tot, s+(e-s)*0.97*(acc+l)/tot)); acc+=l
        f=font(66); d=ImageDraw.Draw(img); lines=wrap(d,words,f,880); idx=0
        y=1480-(len(lines)-1)*44
        for ln in lines:
            wds=[d.textlength(w,font=f) for w in ln]; sp=d.textlength(' ',font=f)+14; tw=sum(wds)+sp*(len(ln)-1); x=540-tw/2
            for w,ww in zip(ln,wds):
                a0,a1=spans[idx]; act=1 if a0<=t<a1 else 0; past=t>=a1; idx+=1
                col=YL if act else WH; 
                text(img,(x+ww/2,y+ (-6 if act else 0)),w,font(70 if act else 66),col,ca*(1 if (act or past) else 0.55),'mm',stroke=6)
                x+=ww+sp
            y+=88
CH=[(0,5.6,"01  THE HOOK"),(5.6,8.75,"02  THE TYRES"),(8.75,11.55,"03  THE AIR"),(11.55,15.7,"04  THE RISK"),(15.7,21.5,"05  THE LIMIT")]
os.makedirs('ov2',exist_ok=True)
for i in range(645):
    t=i/30; img=Image.new('RGBA',(W,H),(0,0,0,0))
    # chapter progress (top)
    for k,(a,b,nm) in enumerate(CH):
        x0=60+k*(960/5)+(4 if k else 0); x1=60+(k+1)*(960/5)-4
        lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
        d.rounded_rectangle([x0,92,x1,98],3,fill=(255,255,255,70)); p=ss(a,b,t)
        if p>0: d.rounded_rectangle([x0,92,x0+(x1-x0)*p,98],3,fill=(*CY,255))
        img.alpha_composite(lay)
        if a<=t<b: text(img,(60,130),nm,font(30,False),CY,win(t,a,b,0.3,0.3)*0.95,'la')
    # hook gauge
    a=win(t,0.3,5.4,0.3,0.45)
    if a>0:
        v=ss(0.2,3.4,t); mph=int(round(120+180*v)); pv=(mph-120)/180
        arc(img,(540,1130),195,0.05+0.95*pv,a,22)
        text(img,(540,1115),f"{mph}",font(175),WH,a,'mm',CY)
        text(img,(540,1215),"MPH",font(44),CY,a,'mm')
        b=0
        if b>0:
            lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
            d.rounded_rectangle([300,1335,780,1390],30,fill=(8,12,20,int(170*b)),outline=(*OR,int(200*b)),width=2); img.alpha_composite(lay)
            text(img,(540,1363),"134 m  EVERY SECOND",font(34),OR,b,'mm')
    # tyres
    a=win(t,6.2,8.6,0.4,0.35)
    if a>0:
        x=ss(6.2,6.9,t); p=(640,1050)
        lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
        d.ellipse([p[0]-11,p[1]-11,p[0]+11,p[1]+11],outline=(*CY,int(255*a)),width=3); d.ellipse([p[0]-4,p[1]-4,p[0]+4,p[1]+4],fill=(*CY,int(255*a)))
        d.line([p,(p[0]+170*x,p[1]-130*x),(1000,p[1]-130*x)] if x>0 else [p,p],fill=(*CY,int(230*a)),width=3); img.alpha_composite(lay)
        k=ss(6.5,7.1,t); card(img,(470,p[1]-330,1020,p[1]-135),a*k)
        text(img,(510,p[1]-300),"TYRE ROTATION",font(28,False),CY,a*k,'la'); text(img,(510,p[1]-262),"3,660",font(110),WH,a*k,'la',CY); text(img,(1000,p[1]-190),"RPM",font(34),CY,a*k,'ra')
        k2=ss(7.2,7.8,t); card(img,(60,1170,640,1330),a*k2,OR)
        text(img,(100,1190),"FORCE ON THE TREAD",font(28,False),OR,a*k2,'la'); text(img,(100,1228),"≈ 5,200 G",font(90),WH,a*k2,'la',OR)
    # air
    a=win(t,9.1,11.4,0.4,0.35)
    if a>0:
        k=ss(9.1,9.7,t); card(img,(60,260,720,560),a*k)
        text(img,(100,285),"AERODYNAMIC DRAG",font(28,False),CY,a*k,'la'); text(img,(100,323),"≈ 8,000 N",font(104),WH,a*k,'la',CY)
        lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay); g=ss(9.6,10.4,t)
        d.rounded_rectangle([100,470,100+130*g,488],8,fill=(*CY,int(255*a*k))); d.rounded_rectangle([100,500,100+420*g,518],8,fill=(*OR,int(255*a*k))); img.alpha_composite(lay)
        text(img,(540,466),"150 MPH",font(24,False),CY,a*k*g,'la'); text(img,(540,496),"300 MPH  ×4",font(24,False),OR,a*k*g,'la')
    # risk
    a=win(t,12.5,15.4,0.3,0.4)
    if a>0:
        pulse=0.65+0.35*math.sin(t*10)
        lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
        d.rounded_rectangle([140,262,940,372],18,fill=(30,6,6,int(190*a)),outline=(*RD,int(255*a*pulse)),width=4)
        for k in range(-3,26):  # hazard stripes
            xx=140+k*34; d.polygon([(xx,372),(xx+17,372),(xx+37,392),(xx+20,392)],fill=(*RD,int(220*a))) if 140<=xx<=900 else None
        img.alpha_composite(lay)
        text(img,(540,318),"ZERO MARGIN",font(88),WH,a,'mm',RD)
        text(img,(540,430),"ONE MISTAKE  ·  AT 134 m/s",font(32,False),WH,a*0.9,'mm')
    # finale
    a=win(t,19.85,21.5,0.12,0.25)
    if a>0:
        k=ss(19.85,20.2,t); sc=1.15-0.15*k
        text(img,(540,880),"300",font(int(330*sc)),WH,a*k,'mm',CY); text(img,(540,1060),"MILES PER HOUR",font(52),CY,a*k,'mm')
        text(img,(540,1140),"134 m/s  ·  483 km/h",font(40,False),OR,a*ss(20.2,20.6,t),'mm')
        b=ss(20.7,21.0,t)*a
        lay=Image.new('RGBA',img.size,(0,0,0,0)); d=ImageDraw.Draw(lay); d.rounded_rectangle([340,1210,740,1290],40,fill=(*CY,int(255*b))); img.alpha_composite(lay)
        text(img,(540,1250),"FOLLOW FOR MORE",font(34),(5,15,25),b,'mm')
    captions(img,t)
    if 12.8<t<15.4:
        p=(0.5+0.5*math.sin(t*9))*0.4*win(t,12.8,15.4,.3,.4); v=Image.new('RGBA',(W,H),(0,0,0,0)); dv=ImageDraw.Draw(v)
        for r in range(10): dv.rectangle([r*8,r*8,W-r*8,H-r*8],outline=(255,30,20,int(p*255*(1-r/10))),width=8)
        img.alpha_composite(v)
    img.save(f'ov2/o{i:04d}.png')
