import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Loop, OffthreadVideo, spring, staticFile, useCurrentFrame} from 'remotion';

// Real video media, never <Img/> or CSS animation of a still.
type Car = 'mclaren'|'ferrari'|'lamborghini'|'gtr'|'bmw'|'mclaren2';
const cars: Car[] = ['mclaren','ferrari','lamborghini','gtr','bmw','mclaren2'];
const labels: Record<Car,string> = {
  mclaren:'McLAREN 650S', ferrari:'FERRARI F8', lamborghini:'LAMBORGHINI',
  gtr:'NISSAN S13', bmw:'BMW M4', mclaren2:'McLAREN'
};
const line: Record<Car,string> = {
  mclaren:'BRITISH PRECISION', ferrari:'ITALIAN THEATRE', lamborghini:'PURE DRAMA',
  gtr:'JAPANESE ICON', bmw:'BAVARIAN FOCUS', mclaren2:'DESIGNED TO MOVE'
};
const ease=Easing.bezier(.22,1,.36,1);
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const tween=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],{...clamp,easing:ease});
const clip=(id:Car)=>staticFile('automotive-video-collage/'+id+'.mp4');

const MotionVideo:React.FC<{id:Car;crop?:string;slow?:boolean}>=({id,crop='50% 50%',slow=false})=><Loop durationInFrames={slow?180:210}>
  <OffthreadVideo src={clip(id)} muted style={{height:'100%',width:'100%',objectFit:'cover',objectPosition:crop}}/>
</Loop>;

const Backdrop:React.FC<{id:Car}>=({id})=><AbsoluteFill style={{background:'#07090c'}}>
  <AbsoluteFill style={{filter:'brightness(.16) saturate(.55) blur(25px)',transform:'scale(1.20)'}}>
    <MotionVideo id={id}/>
  </AbsoluteFill>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(2,4,7,.52),rgba(5,6,9,.19) 47%,rgba(4,6,9,.83)),radial-gradient(ellipse at 40% 50%,transparent,rgba(0,0,0,.75) 85%)'}}/>
</AbsoluteFill>;

type PanelProps={id:Car;x:number;y:number;w:number;h:number;at:number;delay?:number;angle?:number;dx?:number;dy?:number;index?:string;caption?:boolean;crop?:string;};
const Panel:React.FC<PanelProps>=({id,x,y,w,h,at,delay=0,angle=0,dx=0,dy=100,index,caption=false,crop})=>{
  const f=useCurrentFrame();
  const appear=spring({fps:30,frame:f-at-delay,config:{mass:.83,damping:20,stiffness:115},durationInFrames:32});
  const drift=tween(f,at+delay,at+delay+160,0,-23);
  const entrance=(1-appear);
  return <div style={{position:'absolute',left:x,top:y,width:w,height:h,padding:8,
    background:'#e6e1d5',borderRadius:1,
    transform:'perspective(1200px) translate3d('+(dx*entrance)+'px,'+(dy*entrance+drift)+'px,0) rotate('+(angle+entrance*2)+'deg) scale('+(1+entrance*.13)+')',
    opacity:interpolate(appear,[0,.12,1],[0,.7,1],clamp),
    boxShadow:'0 22px 90px rgba(0,0,0,.76), 0 0 0 1px rgba(0,0,0,.9)',willChange:'transform'}}>
      <div style={{position:'relative',height:'100%',width:'100%',overflow:'hidden',background:'#10151b'}}>
        <MotionVideo id={id} crop={crop}/>
        <div style={{position:'absolute',inset:0,boxShadow:'inset 0 -90px 90px -20px rgba(0,0,0,.67)',pointerEvents:'none'}}/>
        {caption&&<div style={{position:'absolute',left:18,bottom:20,font:'bold 24px Arial',color:'#fff',letterSpacing:1.6,textShadow:'0 2px 15px #000'}}>{labels[id]}</div>}
        {index&&<div style={{position:'absolute',top:15,right:18,color:'#f2f1ee',font:'bold 18px Arial',letterSpacing:3}}>{index}</div>}
      </div>
  </div>;
};

const Frame:React.FC<{chapter:string;edition:string}>=({chapter,edition})=><>
 <div style={{position:'absolute',left:70,right:70,top:68,borderTop:'2px solid rgba(235,228,214,.65)'}}/>
 <div style={{position:'absolute',left:77,top:85,font:'bold 18px Arial',letterSpacing:6,color:'#e2dccf'}}>MOTOR / CULTURE</div>
 <div style={{position:'absolute',right:74,top:86,font:'bold 18px Arial',letterSpacing:4,color:'#e2dccf'}}>{edition}</div>
 <div style={{position:'absolute',left:70,right:70,bottom:82,borderTop:'1px solid rgba(239,234,226,.45)'}}/>
 <div style={{position:'absolute',left:78,bottom:45,font:'17px Arial',letterSpacing:4,color:'#ccc4b7'}}>{chapter}</div>
 <div style={{position:'absolute',right:78,bottom:45,font:'17px Arial',letterSpacing:4,color:'#ccc4b7'}}>FILM / 001</div>
</>;

const Heading:React.FC<{eyebrow:string;title:string;y?:number;size?:number}>=({eyebrow,title,y=185,size=95})=><div style={{position:'absolute',left:72,top:y,right:55}}>
  <div style={{font:'bold 19px Arial',letterSpacing:8,color:'#d8d2c5',marginBottom:20}}>{eyebrow}</div>
  <div style={{font:'italic '+size+'px Georgia,serif',letterSpacing:-4.4,lineHeight:1.01,color:'#faf7ed',textShadow:'0 4px 32px #000'}}>{title}</div>
</div>;

const Chapter:React.FC<{start:number;end:number;children:React.ReactNode}>=({start,end,children})=>{
  const f=useCurrentFrame();
  if(f<start||f>=end)return null;
  const opacity=Math.min(tween(f,start,start+12,0,1),tween(f,end-12,end,1,0));
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

const Introduction:React.FC=()=> {
 const f=useCurrentFrame();
 return <Chapter start={0} end={131}>
  <Backdrop id="mclaren"/>
  <Heading eyebrow="THE CINEMATIC MOTION ISSUE" title="The art of speed." y={180} size={103}/>
  <Panel id="mclaren" x={-45} y={555} w={1110} h={765} at={0} angle={-2.5} dy={240} caption index="01 / 06"/>
  <Panel id="ferrari" x={-125} y={1400} w={570} h={365} at={37} dx={-510} dy={0} angle={-8}/>
  <Panel id="lamborghini" x={625} y={1265} w={565} h={405} at={28} dx={510} dy={-20} angle={7}/>
  <div style={{position:'absolute',left:73,top:470,height:5,width:tween(f,0,35,0,300),background:'#d4c9b4'}}/>
  <Frame chapter="01 / THE ARRIVAL" edition="VOL. 01"/>
 </Chapter>;
};

const Grid:React.FC=()=> <Chapter start={115} end={261}>
 <Backdrop id="gtr"/>
 <Heading eyebrow="SIX FRAMES / ALL IN MOTION" title="Obsession, in motion." y={188} size={83}/>
 <Panel id="lamborghini" x={-115} y={463} w={724} h={448} at={122} dx={-490} angle={-6} caption/>
 <Panel id="ferrari" x={568} y={435} w={633} h={452} at={122} delay={5} dx={510} dy={-30} angle={6} caption/>
 <Panel id="bmw" x={-100} y={899} w={690} h={439} at={122} delay={11} dx={-510} dy={35} angle={5} caption/>
 <Panel id="gtr" x={545} y={908} w={677} h={435} at={122} delay={16} dx={545} dy={-15} angle={-6} caption/>
 <Panel id="mclaren" x={-70} y={1350} w={684} h={400} at={122} delay={22} dx={-520} dy={0} angle={-5} caption/>
 <Panel id="mclaren2" x={570} y={1362} w={653} h={385} at={122} delay={26} dx={570} dy={0} angle={8} caption/>
 <Frame chapter="02 / SIX MACHINES" edition="VOL. 02"/>
 </Chapter>;

const ShowcaseSegment:React.FC<{id:Car;second:Car;third:Car;start:number;end:number;seq:string}>=({id,second,third,start,end,seq})=><Chapter start={start} end={end}>
 <Backdrop id={id}/>
 <Heading eyebrow={'SCULPTED TO MOVE / '+seq} title={labels[id]} y={220} size={id==='lamborghini'?74:84}/>
 <Panel id={id} x={-60} y={520} w={1180} h={845} at={start+1} dx={-420} dy={70} angle={-1.5} caption/>
 <Panel id={second} x={-85} y={1445} w={620} h={349} at={start+1} delay={6} dx={-540} dy={0} angle={-7}/>
 <Panel id={third} x={596} y={1411} w={635} h={385} at={start+1} delay={10} dx={550} dy={0} angle={7}/>
 <div style={{position:'absolute',left:77,top:1414,color:'#dfd7c9',font:'bold 20px Arial',letterSpacing:5}}>{line[id]}</div>
 <Frame chapter="03 / THE ICONS" edition={seq}/>
 </Chapter>;
const Showcase:React.FC=()=> <><ShowcaseSegment id="ferrari" second="lamborghini" third="mclaren" start={245} end={300} seq="01/03"/>
 <ShowcaseSegment id="gtr" second="bmw" third="ferrari" start={293} end={350} seq="02/03"/>
 <ShowcaseSegment id="lamborghini" second="mclaren" third="gtr" start={343} end={405} seq="03/03"/></>;

const Rapid:React.FC=()=>{
 const f=useCurrentFrame();
 const stage=Math.floor(Math.max(0,f-399)/31)%3;
 const palettes:Car[][]=[
  ['mclaren','gtr','lamborghini','ferrari','bmw','mclaren2'],
  ['bmw','ferrari','mclaren2','gtr','mclaren','lamborghini'],
  ['lamborghini','mclaren','gtr','bmw','ferrari','mclaren2']
 ];
 const c=palettes[stage];
 return <Chapter start={396} end={518}>
  <Backdrop id={c[1]}/>
  <Heading eyebrow="VISUAL RHYTHM / CUT TO THE BEAT" title="Speed is a feeling." size={86} y={185}/>
  <Panel id={c[0]} x={-90} y={455} w={750} h={470} at={399} dx={-310} dy={0} angle={-7}/>
  <Panel id={c[1]} x={595} y={425} w={624} h={476} at={399} delay={3} dx={400} dy={0} angle={7}/>
  <Panel id={c[2]} x={-120} y={940} w={683} h={456} at={399} delay={5} dx={-460} dy={0} angle={6}/>
  <Panel id={c[3]} x={530} y={916} w={687} h={476} at={399} delay={7} dx={480} dy={0} angle={-6}/>
  <Panel id={c[4]} x={-75} y={1415} w={732} h={380} at={399} delay={9} dx={-470} dy={0} angle={-4}/>
  <Panel id={c[5]} x={590} y={1380} w={620} h={422} at={399} delay={11} dx={500} dy={0} angle={6}/>
  <Frame chapter="04 / THE CUT" edition="CUT / 03"/>
 </Chapter>;
};

const Closing:React.FC=()=>{
 const f=useCurrentFrame();
 return <Chapter start={508} end={600}>
  <Backdrop id="mclaren2"/>
  <Panel id="mclaren" x={-105} y={175} w={762} h={523} at={510} dx={-500} angle={-6}/>
  <Panel id="lamborghini" x={595} y={158} w={562} h={520} at={511} delay={3} dx={560} angle={8}/>
  <Panel id="ferrari" x={-139} y={692} w={700} h={464} at={514} delay={5} dx={-550} angle={6}/>
  <Panel id="gtr" x={476} y={662} w={762} h={514} at={514} delay={8} dx={540} angle={-7}/>
  <Panel id="bmw" x={-118} y={1200} w={704} h={460} at={516} delay={9} dx={-550} angle={-6}/>
  <Panel id="mclaren2" x={528} y={1209} w={690} h={450} at={516} delay={12} dx={570} angle={7}/>
  <div style={{position:'absolute',left:0,right:0,top:792,height:378,
      background:'linear-gradient(90deg,rgba(4,6,9,.92),rgba(7,9,11,.76),rgba(4,6,9,.92))',
      opacity:tween(f,548,570,0,1),boxShadow:'0 0 90px #08090b'}}/>
  <div style={{position:'absolute',left:0,right:0,top:851,textAlign:'center',
     font:'italic 104px Georgia,serif',letterSpacing:-5,color:'#f7f3eb',textShadow:'0 3px 30px #000',
     opacity:tween(f,550,569,0,1),transform:'scale('+tween(f,548,585,1.12,1)+')'}}>The art of speed.</div>
  <div style={{position:'absolute',left:0,right:0,top:996,textAlign:'center',
     font:'bold 20px Arial',letterSpacing:12,color:'#d8cdb7',opacity:tween(f,560,582,0,1)}}>ALWAYS IN MOTION</div>
  <Frame chapter="05 / THE FINAL CUT" edition="END / 001"/>
 </Chapter>;
};

export const AutomotiveVideoCollage001:React.FC=()=> <AbsoluteFill style={{background:'#06080a',overflow:'hidden'}}>
 <Introduction/><Grid/><Showcase/><Rapid/><Closing/>
 <AbsoluteFill style={{pointerEvents:'none',opacity:.16,mixBlendMode:'screen',
     background:'repeating-linear-gradient(0deg,transparent 0px,rgba(255,255,255,.035) 1px,transparent 2px,transparent 8px)'}}/>
 <Audio src={staticFile('automotive-collage/original-soundtrack.wav')} volume={0.8}/>
</AbsoluteFill>;
