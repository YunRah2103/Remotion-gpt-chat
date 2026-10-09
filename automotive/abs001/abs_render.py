"""Automotive Engineering 001 -- original mechanically explanatory VTK 3D film.
All temporal states are frame-derived; wheel rolling speed relates to forward motion and grip.
A simplified representative return-pump, two-solenoid ABS hydraulic circuit is shown.
"""
import math, os, subprocess, time
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import vtk
from vtk.util.numpy_support import vtk_to_numpy

OUT=os.environ.get('ABS_OUT','out/abs001');os.makedirs(OUT,exist_ok=True);W,H=540,960;N=int(os.environ.get('ABS_FRAMES','750'));FPS=30
NAVY=(.026,.046,.073); STEEL=(.68,.74,.76); BRIGHT=(.9,.94,.96); WHITE=(.94,.96,.95)
CYAN=(.27,.86,.92); AMBER=(1.,.65,.31); RED=(.90,.28,.26); BLUE=(.29,.58,.96); GREEN=(.43,.91,.62)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=lambda size,bold=False:ImageFont.truetype(BOLD if bold else FONT,size)
REN=vtk.vtkRenderer();REN.GradientBackgroundOn();REN.SetBackground(*NAVY);REN.SetBackground2(.067,.109,.16)
WIN=vtk.vtkRenderWindow();WIN.SetOffScreenRendering(1);WIN.SetSize(W,H);WIN.AddRenderer(REN);WIN.SetMultiSamples(0)
CAM=REN.GetActiveCamera();CAM.SetViewUp(0,1,0);CAM.SetClippingRange(.1,100)
CAP=vtk.vtkWindowToImageFilter();CAP.SetInput(WIN);CAP.SetInputBufferTypeToRGB();CAP.ReadFrontBufferOff()

# Actor primitives, with real surface geometry, not labelled placeholder boxes.
def actor(source,color,metal=.2,rough=.38,opacity=1):
    if hasattr(source,'Update'):source.Update()
    mapper=vtk.vtkPolyDataMapper();mapper.SetInputConnection(source.GetOutputPort())
    a=vtk.vtkActor();a.SetMapper(mapper)
    p=a.GetProperty();p.SetColor(*color);p.SetOpacity(opacity);p.SetAmbient(.14);p.SetDiffuse(.85);p.SetSpecular(.33+.45*metal);p.SetSpecularPower(36+55*(1-rough));
    return a

def cylinder(r,length,color,axis='x',n=72,r2=None):
    q=vtk.vtkCylinderSource();q.SetRadius(r);q.SetHeight(length);q.SetResolution(n);q.CappingOn();a=actor(q,color)
    if axis=='x':a.RotateZ(90)
    if axis=='z':a.RotateX(90)
    return a

def sphere(r,color,theta=20,phi=14):
    s=vtk.vtkSphereSource();s.SetRadius(r);s.SetThetaResolution(theta);s.SetPhiResolution(phi);return actor(s,color)

def box(sx,sy,sz,color):
    s=vtk.vtkCubeSource();s.SetXLength(sx);s.SetYLength(sy);s.SetZLength(sz);return actor(s,color)

def ring(major,minor,color):
    s=vtk.vtkParametricTorus();s.SetRingRadius(major);s.SetCrossSectionRadius(minor); src=vtk.vtkParametricFunctionSource();src.SetParametricFunction(s);src.SetUResolution(80);src.SetVResolution(16)
    a=actor(src,color);a.RotateY(90);return a

def tube(pts,r,col):
    v=vtk.vtkPoints();v.SetNumberOfPoints(len(pts));
    for i,p in enumerate(pts):v.SetPoint(i,*p)
    l=vtk.vtkPolyLine();l.GetPointIds().SetNumberOfIds(len(pts))
    for i in range(len(pts)):l.GetPointIds().SetId(i,i)
    cells=vtk.vtkCellArray();cells.InsertNextCell(l);poly=vtk.vtkPolyData();poly.SetPoints(v);poly.SetLines(cells)
    spl=vtk.vtkSplineFilter();spl.SetInputData(poly);spl.SetSubdivideToSpecified();spl.SetNumberOfSubdivisions(max(24,8*len(pts)))
    filt=vtk.vtkTubeFilter();filt.SetInputConnection(spl.GetOutputPort());filt.SetRadius(r);filt.SetNumberOfSides(11);filt.CappingOn();return actor(filt,col)

def put(a,x=0,y=0,z=0,parent=None):
    a.SetPosition(x,y,z)
    (parent.AddPart(a) if parent is not None else REN.AddActor(a))
    return a

def assembly(x=0,y=0,z=0):
    a=vtk.vtkAssembly();a.SetPosition(x,y,z);REN.AddActor(a);return a

def set_cam(pos,look,fov=30):
    CAM.SetPosition(*pos);CAM.SetFocalPoint(*look);CAM.SetViewAngle(fov);CAM.SetViewUp(0,1,0);CAM.SetClippingRange(.1,120)

def lights():
    a=vtk.vtkLight();a.SetLightTypeToSceneLight();a.SetPosition(-5,8,9);a.SetFocalPoint(0,0,0);a.SetIntensity(1.35);REN.AddLight(a)
    b=vtk.vtkLight();b.SetLightTypeToSceneLight();b.SetPosition(5,6,-4);b.SetFocalPoint(0,0,0);b.SetIntensity(.85);REN.AddLight(b)
    c=vtk.vtkLight();c.SetLightTypeToSceneLight();c.SetPosition(0,2,11);c.SetIntensity(.55);REN.AddLight(c)


def wheel(cx=0,cy=0,cz=0,scale=1,face_sign=1,sensor=True,caliper=True):
    """Spin group rotates about lateral X axle; fixed caliper and sensor do not rotate."""
    base=assembly(cx,cy,cz);base.SetScale(scale)
    spin=vtk.vtkAssembly();base.AddPart(spin)
    # tyre: annular cross section with tread crown, visible rubber side wall, bead ring
    for x in [-.17,-.06,.06,.17]:put(ring(.80,.13,(.065,.073,.081)),x,0,0,spin)
    for x in [-.235,.235]:put(ring(.70,.055,(.085,.096,.107)),x,0,0,spin)
    # tread shoulder ribs and lateral grooves, genuinely rotate with wheel
    for i in range(32):
        th=i*2*math.pi/32
        for x in (-.15,.15):
            groove=box(.18,.025,.13,(.115,.128,.14));groove.RotateX(-math.degrees(th));put(groove,x,.865*math.cos(th),.865*math.sin(th),spin)
    # forged hub and rim, annular spoke structure
    for x in (.27,.31):put(ring(.55,.042,(.63,.68,.70)),x,0,0,spin)
    put(cylinder(.14,.48,(.56,.62,.65)),0,0,0,spin)
    put(cylinder(.23,.035,(.79,.82,.82)),.30,0,0,spin)
    for i in range(10):
        th=2*math.pi*i/10
        spoke=box(.05,.40,.075,(.58,.64,.67));spoke.RotateX(-math.degrees(th));put(spoke,.30,.32*math.cos(th),.32*math.sin(th),spin)
        nut=sphere(.038,(.23,.27,.29));put(nut,.345,.17*math.cos(th),.17*math.sin(th),spin)
    # Brake disc behind wheel, with friction annulus, vents and rotor-drill holes
    disc=vtk.vtkAssembly();base.AddPart(disc)
    for x in (-.11,-.06):put(cylinder(.61,.026,(.58,.63,.65)),x,0,0,disc)
    for x in (-.10,-.05):put(ring(.57,.018,(.75,.81,.82)),x,0,0,disc)
    for i in range(24):
        a=i*math.pi/12
        for rr in (.44,.52):put(sphere(.018,(.12,.18,.21),10,10),-.025,rr*math.cos(a),rr*math.sin(a),disc)
    for i in range(16):
        a=i*math.pi/8
        fin=box(.04,.035,.15,(.23,.29,.31));fin.RotateX(-math.degrees(a));put(fin,-.083,.28*math.cos(a),.28*math.sin(a),disc)
    fixed=vtk.vtkAssembly();base.AddPart(fixed)
    pads=[]
    if caliper:
        # Two fixed cast caliper halves straddle moving steel rotor at upper edge.
        for x in (-.26,.09):
            sh=box(.14,.41,.34,RED);sh.RotateX(14);put(sh,x,.37,-.37,fixed)
            p=box(.045,.25,.22,(.17,.20,.22));put(p,x+(.065 if x<0 else -.065),.37,-.37,fixed);pads.append(p)
        bridge=box(.43,.10,.27,(.82,.34,.29));put(bridge,-.08,.61,-.37,fixed)
        for i in range(3):put(cylinder(.022,.35,(.73,.78,.78),'x'),-.08,.51-i*.115,-.54,fixed)
        piston=cylinder(.11,.07,(.52,.57,.62));put(piston,.06,.36,-.37,fixed)
    if sensor:
        # Sensor head held fixed against toothed encoder target carried by hub
        put(ring(.31,.015,(.77,.52,.25)),-.19,0,0,spin)
        for i in range(44):
            a=2*math.pi*i/44
            tooth=box(.018,.055,.038,(.96,.69,.34));tooth.RotateX(-math.degrees(a));put(tooth,-.21,.31*math.cos(a),.31*math.sin(a),spin)
        head=box(.15,.11,.10,CYAN);put(head,-.30,.28,.19,fixed)
        put(tube([(-.30,.28,.19),(-.55,.41,.21),(-.73,.57,.33)],.026,(.19,.55,.61)),parent=fixed)
    return dict(base=base,spin=spin,disc=disc,pads=pads)

def road(x=0,z=0):
    a=box(20,.07,30,(.12,.15,.19));put(a,x,-.94,z)
    stripes=[]
    for i in range(16):
        q=box(.09,.012,.77,(.36,.43,.47));put(q,x+2.45,-.898,(i-8)*1.3);stripes.append(q)
    return stripes

def reset():
    REN.RemoveAllViewProps();REN.RemoveAllLights();lights()

# Shared scene visuals driven by frame time.
def wheels_scene(stage):
    reset()
    elems={}
    if stage==0:
        elems['road']=road()
        elems['rolling']=wheel(cx=.12,cy=0.0,cz=0,scale=1.0)
        set_cam((3.4,1.7,7.7),(.0,-.09,0),27)
    elif stage==1:
        elems['road']=road();elems['rolling']=wheel(cx=-.93,cy=-.36,cz=0,scale=.62);elems['locked']=wheel(cx=.94,cy=-.36,cz=0,scale=.62)
        set_cam((2.45,1.9,9.4),(.0,-.05,0),33)
    elif stage==2:
        elems['rolling']=wheel(cx=-.92,cy=-.1,cz=0,scale=.88)
        # custom board: PCB with chip + trace + steel contacts, next to the wheel
        pcb=box(.25,1.8,1.45,(.075,.26,.28));put(pcb,2,-.02,0)
        chip=box(.20,.65,.65,(.16,.19,.24));put(chip,2.17,-.02,0)
        for i in range(12):
            y=-.62+i*.115
            put(box(.08,.025,.23,(.86,.66,.32)),2.22,y,-.52 if i%2 else .52)
        for i in range(8):
            tr=tube([(2.16,-.7+i*.19,-.57),(2.19,-.5+i*.15,-.38),(2.19,-.42+i*.09,-.12)],.014,(.22,.80,.64));put(tr)
        put(tube([(-1.38,.35,.5),(-.35,.65,.3),(.6,.78,.3),(1.3,.42,.3),(1.87,.42,.3)],.022,CYAN))
        elems['pulses']=[]
        for i in range(11):
            p=sphere(.056,CYAN,12,9);put(p,0,-10,0);elems['pulses'].append(p)
        set_cam((3.6,2.2,10.8),(.4,0,0),34)
    elif stage==4:
        elems['road']=road();elems['locked']=wheel(cx=-.92,cy=-.34,cz=0,scale=.65);elems['rolling']=wheel(cx=.96,cy=-.34,cz=0,scale=.65)
        set_cam((2.7,2.0,9.7),(0,0,0),34)
    return elems

def hydraulic_scene():
    reset();e={}
    # solid milled manifold, semi-transparent exposing physical bores, installed valve bodies
    body=box(4.85,2.52,.85,(.28,.35,.40));put(body,0,-.18,-.42);body.GetProperty().SetOpacity(.36)
    # 4 machined ports and fastening features along block edge
    for x in [-1.87,-.62,.62,1.87]:
        put(cylinder(.11,.4,(.74,.76,.78),'y'),x,1.08,-.30)
        put(ring(.13,.028,(.8,.67,.37)),x,1.28,-.30)
    # two valves in series main line: default normally open inlet, normally closed outlet
    for x,name,c in [(-.9,'inlet',CYAN),(.85,'outlet',AMBER)]:
        sol=cylinder(.34,.74,(.17,.21,.25),'y');put(sol,x,.31,.13)
        # distinctive turns, steel rod, valve seat cutaway
        for j in range(6):
            coil=ring(.28,.027,(.76,.44,.20));coil.RotateX(90);put(coil,x,-.04+j*.11,.17)
        put(cylinder(.084,1.13,(.84,.88,.89),'y'),x,-.34,.17)
        seat=ring(.19,.037,(.62,.69,.71));seat.RotateX(90);put(seat,x,-.81,.19)
        plunger=cylinder(.17,.15,c,'y');put(plunger,x,-.73,.18);e[name]=plunger
    # master cylinder cutaway left: bore, piston and return spring.
    put(cylinder(.32,1.35,(.57,.63,.67),'x'),-3.75,.15,.08)
    e['master']=cylinder(.24,.22,(.76,.82,.82),'x');put(e['master'],-4.17,.15,.08)
    for j in range(6):put(ring(.21,.022,(.80,.69,.40)),-4.18+j*.12,.15,.08)
    # caliper piston and curved jaws at the far end
    put(cylinder(.41,.33,(.73,.77,.78),'x'),3.52,.12,.1)
    e['piston']=cylinder(.28,.15,(.45,.64,.73),'x');put(e['piston'],3.71,.12,.1)
    for j in (-.20,.20):put(box(.18,.65,.35,(.85,.30,.29)),4.10+j,.13,.12)
    # distinctly mapped hydraulic circuits: master -> inlet -> caliper / outlet -> accumulator -> pump -> inlet
    e['supply']=put(tube([(-3.08,.16,.05),(-2.58,.14,.06),(-1.85,.14,.06),(-.9,.12,.09),(.1,.12,.09),(2.4,.12,.1),(3.35,.12,.1)],.105,(.25,.65,.93)))
    e['return']=put(tube([(.86,-.76,.19),(1.4,-1.42,.19),(2.2,-1.43,.19),(2.45,-1.66,.19),(.1,-1.72,.19),(-.9,-.75,.19)],.080,(.93,.59,.28)))
    # low pressure accumulator + return pump, pump is drawn below circuit
    put(cylinder(.38,.70,(.45,.52,.57),'y'),2.32,-1.33,.2)
    put(cylinder(.49,.32,(.61,.68,.72),'x'),.75,-1.93,.24)
    e['pump']=vtk.vtkAssembly();e['pump'].SetPosition(.75,-1.93,.52);REN.AddActor(e['pump'])
    for j in range(5):
        a=j*math.tau/5;blade=box(.10,.35,.085,(.84,.88,.88));blade.RotateX(-math.degrees(a));put(blade,0,.24*math.cos(a),.24*math.sin(a),e['pump'])
    # signal ECU enclosure + board + controller traces
    put(box(1.4,.83,.52,(.12,.20,.25)),.0,1.83,-.33)
    put(box(.57,.35,.55,(.25,.30,.34)),0,1.85,-.05)
    for i in range(6):put(box(.035,.15,.075,(.82,.68,.35)),-.49+i*.2,1.48,.02)
    put(tube([(0,1.48,.1),(-.9,1.12,.13)],.028,CYAN));put(tube([(0,1.48,.1),(.85,1.12,.13)],.028,CYAN))
    # animated fluid indicators ride along pressure/return branches; flow direction explicit.
    e['blueflow']=[];e['amberflow']=[]
    for i in range(10):
        p=sphere(.068,(.49,.88,1.),10,9);put(p,-10,-10,0);e['blueflow'].append(p)
    for i in range(7):
        p=sphere(.062,(1.,.76,.44),10,9);put(p,-10,-10,0);e['amberflow'].append(p)
    set_cam((4.0,2.85,14.3),(.12,-.16,.0),35)
    return e

stage_titles=[('THE PROBLEM','WHAT DOES ABS ACTUALLY DO?'),('LOCKED VS ROLLING','GRIP NEEDS A ROLLING TYRE'),('THE SENSOR','WHEEL SPEED, NOT ROAD GRIP'),('THE HYDRAULICS','PRESSURE. RELEASE. REAPPLY.'),('THE DIFFERENCE','ABS HELPS YOU STEER WHILE BRAKING.')]
stage_windows=[(0,120),(120,240),(240,360),(360,600),(600,750)]
subtitles=[
(0.00,2.0,'When you slam on the brakes,'),
(2.0,4.6,'a wheel can stop spinning while the car is still moving.'),
(4.6,6.6,'This is called wheel lockup,'),
(6.6,8.6,'and it makes steering much harder.'),
(8.6,10.1,'ABS uses sensors'),
(10.1,12.65,'to monitor each wheel’s speed.'),
(12.65,14.45,'If a wheel is about to lock,'),
(14.45,19.25,'the system rapidly reduces and reapplies brake pressure.'),
(19.25,21.6,'This helps the wheels keep rolling,'),
(21.6,25,'allowing you to steer during emergency braking.')]

def stage_of(frame):
    for i,(s,e) in enumerate(stage_windows):
        if s<=frame<e:return i
    return 4

def clamp(x):return max(0.,min(1.,x))
def ease(x):x=clamp(x);return x*x*(3-2*x)

def dyn(frame,stage,e):
    sec=frame/FPS
    if stage==0:
        # Rolling tyre v=R*omega, then sudden lock while road still moving.
        omega=-(frame*.20 if frame<76 else 76*.20+(frame-76)*(.20*(1-clamp((frame-76)/18))))
        e['rolling']['spin'].SetOrientation(omega*180/math.pi,0,0)
        for i,a in enumerate(e['road']):a.SetPosition(2.45,-.898,((i-8)*1.3+frame*.11+12)%21-10)
    elif stage==1:
        e['rolling']['spin'].SetOrientation(-frame*.20*180/math.pi,0,0)
        e['locked']['spin'].SetOrientation(-120*.20*180/math.pi,0,0)
        for i,a in enumerate(e['road']):a.SetPosition(2.45,-.898,((i-8)*1.3+frame*.12+12)%21-10)
    elif stage==2:
        e['rolling']['spin'].SetOrientation(-frame*.11*180/math.pi,0,0)
        for i,p in enumerate(e['pulses']):
            t=(frame-240)*.026-i*.15
            if 0<=t<=1:
                x=-.62+2.75*t;y=.72-.1*t;p.SetPosition(x,y,.50)
            else:p.SetPosition(0,-100,0)
    elif stage==3:
        loc=frame-360
        # 1) build 2) pressure reduction 3) hold 4) reapply; repeating representative loop.
        cycle=(loc%117)/117
        if cycle<.22:
            pressure=.35+.65*cycle/.22;mode='APPLY';inlet_open=True;outlet_open=False
        elif cycle<.47:
            pressure=1-.80*(cycle-.22)/.25;mode='REDUCE';inlet_open=False;outlet_open=True
        elif cycle<.63:
            pressure=.20;mode='HOLD';inlet_open=False;outlet_open=False
        else:
            pressure=.20+.65*(cycle-.63)/.37;mode='REAPPLY';inlet_open=True;outlet_open=False
        # Moving valve poppets actually open/close hydraulic seats.
        e['inlet'].SetPosition(-.9,-.57 if inlet_open else -.82,.18)
        e['outlet'].SetPosition(.85,-.57 if outlet_open else -.82,.18)
        e['piston'].SetPosition(3.63+pressure*.11,.12,.1)
        e['master'].SetPosition(-4.20+.2*ease(loc/28),.15,.08)
        e['pump'].SetOrientation((loc*14)%360,0,0)
        for i,p in enumerate(e['blueflow']):
            t=((loc*.018+i*.10)%1)
            if inlet_open:
                p.SetPosition(-3.0+6.35*t,.12+.035*math.sin(i+loc*.14),.11)
            else:p.SetPosition(0,-100,0)
        for i,p in enumerate(e['amberflow']):
            t=((loc*.014+i*.143)%1)
            if outlet_open:
                p.SetPosition(.85+1.55*math.sin(math.pi*t),-.83-.84*t,.25)
            else:p.SetPosition(0,-100,0)
        e['pressure']=pressure;e['mode']=mode;e['inlet_open']=inlet_open;e['outlet_open']=outlet_open
    else:
        l=frame-600
        e['locked']['spin'].SetOrientation(-120*.20*180/math.pi,0,0)
        # Oscillating anti-lock release prevents imminent stall while road translates.
        phase=l%43
        omega=.10+(.07*math.sin(phase*math.tau/43))
        old=e.get('rolling_angle',0.0);new=old-omega;e['rolling_angle']=new
        e['rolling']['spin'].SetOrientation(new*180/math.pi,0,0)
        # Steering input is resisted in sliding case but induces change of heading at right.
        e['rolling']['base'].SetOrientation(0,10*ease((l-40)/72),0)
        for i,a in enumerate(e['road']):a.SetPosition(2.45,-.898,((i-8)*1.3+frame*.13+12)%21-10)

def render_overlay(raw,frame,stage,e):
    img=Image.fromarray(raw,'RGB').resize((W,H))
    canvas=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(canvas)
    t=frame/FPS;loc=frame-stage_windows[stage][0];s0,s1=stage_windows[stage]
    # Dark top and bottom low-visual-interference scrims, preserves spotlight on hardware.
    for i in range(290):
        alpha=int(198*(1-i/290)**2)
        d.line((0,i,W,i),fill=(5,13,22,alpha))
    for i in range(280):
        alpha=int(220*(1-i/280)**2)
        yy=H-1-i;d.line((0,yy,W,yy),fill=(3,11,20,alpha))
    d.text((35,34),'ENGINEERING / 001',font=font(14,True),fill=(126,224,225,255))
    d.text((W-35,34),'ABS  •  3D',font=font(13,True),fill=(205,223,230,255),anchor='ra')
    d.line((35,70,W-35,70),fill=(101,142,153,170),width=1)
    badge,title=stage_titles[stage]
    fade=min(ease(loc/13),ease((s1-frame)/13))
    d.text((35,92),badge,font=font(13,True),fill=(130,220,229,int(255*fade)))
    # Explicitly legible one/two-line headline, 50px field.
    title_lines=[];words=title.split();part=''
    for wd in words:
        try_line=(part+' '+wd).strip()
        if d.textbbox((0,0),try_line,font=font(32,True))[2]>W-68 and part:
            title_lines.append(part);part=wd
        else:part=try_line
    if part:title_lines.append(part)
    for j,ln in enumerate(title_lines):d.text((34,119+j*39),ln,font=font(32,True),fill=(237,246,246,int(255*fade)))
    # Scene-specific physical legend, intentionally much less UI than technical content.
    if stage==1:
        d.text((106,688),'ROLLING',font=font(22,True),fill=(94,230,188,255),anchor='mm')
        d.text((415,688),'LOCKED / SKIDDING',font=font(18,True),fill=(255,180,117,255),anchor='mm')
        d.line((270,382,270,695),fill=(160,180,187,90),width=2)
    elif stage==2:
        d.text((112,668),'TOOTHED ENCODER',font=font(15,True),fill=(255,197,98,255),anchor='mm')
        d.text((417,668),'ABS CONTROLLER',font=font(16,True),fill=(117,218,229,255),anchor='mm')
        # live pulses, interpretable electronic signal waveform not grip indicator
        pts=[]
        for i in range(90):
            x=60+i*3
            y=717-(31 if ((i+int((frame-240)*.7))//8)%2 else 0)
            pts.append((x,y))
        d.line(pts,fill=(116,226,233,235),width=2)
    elif stage==3:
        mode=e.get('mode','APPLY');p=e.get('pressure',.6)
        d.text((35,650),'INLET',font=font(14,True),fill=(129,223,231,255))
        d.text((192,650),'OUTLET',font=font(14,True),fill=(250,194,123,255))
        d.text((35,681),'OPEN' if e.get('inlet_open') else 'CLOSED',font=font(18,True),fill=(117,224,230,255))
        d.text((192,681),'OPEN' if e.get('outlet_open') else 'CLOSED',font=font(18,True),fill=(255,186,99,255))
        d.text((390,665),mode,font=font(18,True),fill=(255,231,212,255),anchor='mm')
        d.rounded_rectangle((345,692,502,705),radius=5,fill=(35,60,70,230))
        d.rounded_rectangle((345,692,345+int(157*p),705),radius=5,fill=(83,195,228,255))
        d.text((422,721),'CALIPER PRESSURE',font=font(11,True),fill=(182,219,228,255),anchor='mm')
    elif stage==4:
        d.text((119,674),'NO ABS',font=font(20,True),fill=(255,171,125,255),anchor='mm')
        d.text((407,674),'WITH ABS',font=font(20,True),fill=(113,226,170,255),anchor='mm')
        d.text((407,704),'↷  STEERING RESPONSE',font=font(15,True),fill=(113,226,170,255),anchor='mm')
        if frame>639:
            d.arc((344,380,485,555),220,315,fill=(113,226,170,225),width=4)
            d.polygon([(470,393),(480,419),(454,418)],fill=(113,226,170,230))
            d.line([(110,496),(115,465),(120,436)],fill=(244,163,116,210),width=4)
            d.polygon([(120,430),(110,444),(133,449)],fill=(244,163,116,230))
        d.line((269,345,269,708),fill=(142,166,176,116),width=2)
    # user-provided exact narration, synced short on-screen lines
    speech=next((s for a,b,s in subtitles if a<=t<b),'')
    words=speech.split();lines=[];current=''
    for word in words:
        candidate=(current+' '+word).strip()
        if d.textbbox((0,0),candidate,font=font(21,True))[2]>W-80 and current:
            lines.append(current);current=word
        else:current=candidate
    if current:lines.append(current)
    for j,line in enumerate(lines):d.text((W//2,803+j*31),line,font=font(21,True),fill=(248,249,246,255),anchor='mm',stroke_width=1,stroke_fill=(4,12,15,255))
    d.line((35,891,W-35,891),fill=(116,145,148,150),width=2)
    d.line((35,891,35+int((W-70)*frame/749),891),fill=(106,236,225,255),width=3)
    d.text((35,909),'ABS CONTROLS BRAKE PRESSURE',font=font(10,True),fill=(169,197,197,255))
    d.text((W-35,909),f'{int(t):02d} / 25',font=font(10,True),fill=(169,197,197,255),anchor='ra')
    return Image.alpha_composite(img.convert('RGBA'),canvas).convert('RGB')

def main():
    st=None;elems={};start=time.time()
    # render genuine dynamic 3D geometry with software VTK (not still-image effects).
    ff=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-an','-c:v','libx264','-preset','ultrafast','-crf','20','-pix_fmt','yuv420p',OUT+'/visual-540.mp4'],stdin=subprocess.PIPE)
    for f in ([int(x) for x in os.environ["ABS_ONLY_FRAMES"].split(",")] if os.environ.get("ABS_ONLY_FRAMES") else range(N)):
        s=stage_of(f)
        if s!=st:
            st=s;elems=hydraulic_scene() if s==3 else wheels_scene(s)
            print('scene',s,'frame',f,'elapsed',round(time.time()-start,1),flush=True)
        dyn(f,s,elems)
        WIN.Render();CAP.Modified();CAP.Update()
        vtkarr=vtk_to_numpy(CAP.GetOutput().GetPointData().GetScalars()).reshape(H,W,3)
        raw=np.ascontiguousarray(vtkarr[::-1])
        final=render_overlay(raw,f,s,elems)
        ff.stdin.write(np.asarray(final,dtype=np.uint8).tobytes())
        if f in (73,314,473,532,689,724) or os.environ.get('ABS_ONLY_FRAMES'):
            final.resize((1080,1920),Image.Resampling.LANCZOS).save(OUT+f'/abs-preview-{f:03d}.png')
        if f%100==0:print('frame',f,'elapsed',round(time.time()-start,1),flush=True)
    ff.stdin.close();status=ff.wait();assert status==0,status
    print('raw render complete',round(time.time()-start,1),flush=True)

if __name__=='__main__':main()