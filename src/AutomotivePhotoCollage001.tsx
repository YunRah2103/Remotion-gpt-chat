import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';

const W = 1080;
const H = 1920;
const asset = (id: string) => staticFile('automotive-collage/' + id + '.jpg');
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const lerp = (f: number, a: number, b: number, v0: number, v1: number) => interpolate(f, [a,b], [v0,v1], {...clamp, easing:ease});
const fade = (f: number, from: number, to: number, enter=10, leave=12) =>
  Math.min(interpolate(f,[from,from+enter],[0,1],clamp), interpolate(f,[to-leave,to],[1,0],clamp));
type Car = 'porsche'|'lambo'|'ferrari'|'mclaren'|'gtr'|'bmw';
const tint: Record<Car,string> = {porsche:'#c9ced2',lambo:'#c490ba',ferrari:'#da4a3b',mclaren:'#cc8e58',gtr:'#bcc1c8',bmw:'#c5c9c7'};
const names: Record<Car,string> = {
  porsche:'911 GT3', lambo:'HURACÁN', ferrari:'488 GTB',
  mclaren:'720S', gtr:'GT-R R35', bmw:'M4 COMPETITION'
};
const cars:Car[]=['porsche','lambo','ferrari','mclaren','gtr','bmw'];

const Background:React.FC<{id:Car; strength?:number}> = ({id,strength=1}) => {
 const f=useCurrentFrame();
 return <AbsoluteFill>
   <Img src={asset(id)} style={{width:'100%',height:'100%',objectFit:'cover',filter:'blur(26px) brightness(.21) saturate(.68)',transform:'scale('+ (1.32 + f/12000) +')'}}/>
   <AbsoluteFill style={{background:'radial-gradient(ellipse at 52% 37%,transparent 0%,rgba(4,5,8,.69) 77%),linear-gradient(155deg,rgba(18,22,26,.50),rgba(0,0,0,.65))',opacity:strength}}/>
   <AbsoluteFill style={{background:'linear-gradient(110deg, transparent 20%,rgba(250,245,229,.04) 49%,transparent 54%)',transform:'translateX('+((f%90-45)*6)+'px)'}}/>
 </AbsoluteFill>;
};
type PhotoProps={id:Car;x:number;y:number;w:number;h:number;inAt:number;delay?:number;angle?:number;fromX?:number;fromY?:number;scale?:number;label?:boolean;index?:number; border?:number; zoom?:number;};
const Photo:React.FC<PhotoProps>=({id,x,y,w,h,inAt,delay=0,angle=0,fromX=0,fromY=150,scale=1,label=false,index,border=8,zoom=1.055})=>{
 const frame=useCurrentFrame();
 const a=spring({frame:frame-inAt-delay,fps:30,config:{damping:19,mass:0.9,stiffness:105},durationInFrames:31});
 const drift=lerp(frame,inAt+delay,inAt+delay+95,0,-24);
 const pop=1+(1-a)*.17;
 return <div style={{position:'absolute',left:x,top:y,width:w,height:h,
    transform:'translate3d('+((1-a)*fromX)+'px,'+((1-a)*fromY + drift)+'px,0) rotate('+(angle+(1-a)*4)+'deg) scale('+(scale*pop)+')',
    opacity:interpolate(a,[0,.12,1],[0,.72,1],clamp),
    boxShadow:'0 26px 70px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.14)',
    background:'#181b1d',padding:border,willChange:'transform'}}>
   <div style={{width:'100%',height:'100%',position:'relative',overflow:'hidden',background:'#181b1d'}}>
      <Img src={asset(id)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center center',
        transform:'scale('+(zoom + lerp(frame,inAt,inAt+150,.025,.13))+') translateX('+(Math.sin((frame-inAt)/70)*1.7)+'%)',
        filter:'contrast(1.10) saturate(.92)'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(0,0,0,.54),transparent 43%)'}}/>
      {label&&<div style={{position:'absolute',left:22,bottom:19,color:'#f4f1e8',font:'bold 25px Arial, sans-serif',letterSpacing:2,textShadow:'0 1px 9px rgba(0,0,0,.7)'}}>{names[id]}</div>}
      {index!==undefined&&<div style={{position:'absolute',right:18,top:16,color:'rgba(255,255,255,.85)',font:'bold 20px Arial',letterSpacing:1.5}}>{String(index).padStart(2,'0')} / 06</div>}
   </div>
 </div>;
};
const Title:React.FC<{small?:string;large:string;align?:'left'|'center';top?:number}>=({small,large,align='left',top=160})=>
 <div style={{position:'absolute',top,left:align==='left'?76:0,width:align==='center'?'100%':940,textAlign:align,
   color:'#f1f0ea',textShadow:'0 4px 30px rgba(0,0,0,.5)'}}>
    {small&&<div style={{font:'bold 21px Arial',letterSpacing:9,marginBottom:16,color:'#dbd4c3'}}>{small}</div>}
    <div style={{font:'normal 106px Georgia,serif',letterSpacing:-5,lineHeight:.98,fontStyle:'italic'}}>{large}</div>
 </div>;
const FrameData:React.FC<{chapter:string;number:string}>=({chapter,number})=><>
  <div style={{position:'absolute',left:70,top:65,width:940,borderTop:'2px solid rgba(244,242,233,.58)'}}/>
  <div style={{position:'absolute',left:76,top:84,color:'#ddd8c8',font:'bold 19px Arial',letterSpacing:5}}>MOTOR / CULTURE</div>
  <div style={{position:'absolute',right:72,top:84,color:'#ddd8c8',font:'bold 19px Arial',letterSpacing:3}}>{number}</div>
  <div style={{position:'absolute',left:70,bottom:76,width:940,borderTop:'1px solid rgba(244,242,233,.36)'}}/>
  <div style={{position:'absolute',left:75,bottom:40,color:'#bbb7ad',font:'16px Arial',letterSpacing:4}}>{chapter}</div>
  <div style={{position:'absolute',right:73,bottom:40,color:'#bbb7ad',font:'16px Arial',letterSpacing:4}}>AUTOMOTIVE EDIT 001</div>
</>;
const Scene:React.FC<{start:number;end:number;children:React.ReactNode}>=({start,end,children})=>{
 const f=useCurrentFrame();
 const opacity=fade(f,start,end,11,11);
 if(opacity<=0)return null;
 return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};
const Intro:React.FC=()=> {
 const f=useCurrentFrame();
 return <Scene start={0} end={128}>
   <Background id="porsche"/>
   <Title small="AN EDITORIAL STUDY OF SPEED" large="Motion / Emotion" top={205}/>
   <Photo id="porsche" x={-35} y={575} w={1090} h={740} inAt={0} fromY={190} angle={-2.2} border={12} label/>
   <Photo id="lambo" x={675} y={1200} w={480} h={340} inAt={32} fromX={560} fromY={45} angle={8} border={10}/>
   <Photo id="ferrari" x={-155} y={1370} w={565} h={380} inAt={46} fromX={-500} fromY={35} angle={-8} border={10}/>
   <div style={{position:'absolute',left:77,top:470,height:5,width:lerp(f,0,36,0,270),background:'#c6bba5'}}/>
   <FrameData chapter="01 / THE INTRODUCTION" number="001"/>
 </Scene>;
};
const Explosion:React.FC=()=> <Scene start={114} end={252}>
  <Background id="mclaren"/>
  <Title small="SIX MACHINES  /  ONE OBSESSION" large="Anatomy of desire" top={198}/>
  <Photo id="porsche" x={-105} y={420} w={700} h={440} angle={-8} inAt={119} delay={0} fromX={-520} label border={8}/>
  <Photo id="lambo" x={510} y={365} w={600} h={450} angle={7} inAt={119} delay={6} fromX={500} fromY={-200} label border={8}/>
  <Photo id="ferrari" x={-125} y={845} w={670} h={460} angle={5} inAt={119} delay={12} fromX={-400} label border={8}/>
  <Photo id="mclaren" x={540} y={862} w={670} h={500} angle={-5} inAt={119} delay={17} fromX={570} label border={8}/>
  <Photo id="gtr" x={-40} y={1298} w={685} h={462} angle={-5} inAt={119} delay={23} fromX={-550} label border={8}/>
  <Photo id="bmw" x={575} y={1347} w={550} h={386} angle={7} inAt={119} delay={27} fromX={540} label border={8}/>
  <FrameData chapter="02 / THE COLLAGE" number="002"/>
 </Scene>;
const Hero:React.FC<{id:Car;start:number;end:number;second:Car;third:Car;seq:number}>=({id,start,end,second,third,seq})=>{
 const f=useCurrentFrame();
 const opacity=fade(f,start,end,7,8);
 if(opacity<=0)return null;
 return <AbsoluteFill style={{opacity}}>
  <Background id={id}/>
  <div style={{position:'absolute',left:80,top:277,color:'#dad3c5',font:'bold 19px Arial',letterSpacing:8}}>SCULPTED FOR THE ROAD / 0{seq}</div>
  <div style={{position:'absolute',left:74,top:360,color:'#f4f0e8',font:'italic 105px Georgia',letterSpacing:-5}}>{names[id]}</div>
  <Photo id={id} x={-34} y={620} w={1144} h={785} inAt={start} fromX={-300} fromY={100} angle={-1.5} border={13}/>
  <Photo id={second} x={-78} y={1450} w={550} h={328} inAt={start} delay={13} fromX={-400} fromY={0} angle={-6} border={9}/>
  <Photo id={third} x={640} y={1423} w={530} h={356} inAt={start} delay={17} fromX={470} fromY={-70} angle={7} border={9}/>
  <div style={{position:'absolute',left:78,top:1467,width:150,height:3,background:tint[id]}}/>
  <FrameData chapter="03 / THE SHOWCASE" number={'00'+(seq+2)}/>
 </AbsoluteFill>;
};
const Showcase:React.FC=()=> <Scene start={239} end={410}>
   <Hero id="ferrari" second="porsche" third="mclaren" start={243} end={302} seq={1}/>
   <Hero id="mclaren" second="ferrari" third="gtr" start={296} end={356} seq={2}/>
   <Hero id="bmw" second="lambo" third="porsche" start={350} end={407} seq={3}/>
 </Scene>;
const Montage:React.FC=()=>{
 const f=useCurrentFrame();
 const beat=Math.min(3,Math.floor(Math.max(0,f-408)/29));
 const xoffset=((f-408)%29+29)%29;
 const variants:Car[][]=[['gtr','porsche','lambo','ferrari','bmw','mclaren'],['bmw','lambo','ferrari','gtr','mclaren','porsche'],['ferrari','mclaren','gtr','bmw','porsche','lambo'],['porsche','gtr','bmw','mclaren','lambo','ferrari']];
 const ids=variants[beat];
 return <Scene start={395} end={520}>
   <Background id={ids[0]}/>
   <Title small="A FEW FRAMES.  /  A LOT OF FEELING." large="Fast / Faster" top={205}/>
   <Photo id={ids[0]} x={-90} y={470} w={730} h={460} inAt={398} fromX={-340} fromY={0} angle={-7} border={7}/>
   <Photo id={ids[1]} x={585} y={410} w={610} h={460} inAt={398} delay={3} fromX={460} fromY={-30} angle={6} border={7}/>
   <Photo id={ids[2]} x={-110} y={950} w={670} h={445} inAt={398} delay={6} fromX={-460} fromY={15} angle={7} border={7}/>
   <Photo id={ids[3]} x={530} y={900} w={690} h={472} inAt={398} delay={8} fromX={480} fromY={0} angle={-7} border={7}/>
   <Photo id={ids[4]} x={-80} y={1400} w={700} h={385} inAt={398} delay={11} fromX={-540} fromY={0} angle={-3} border={7}/>
   <Photo id={ids[5]} x={580} y={1370} w={610} h={425} inAt={398} delay={13} fromX={460} fromY={0} angle={5} border={7}/>
   <div style={{position:'absolute',left:74,top:445,height:5,width:lerp(xoffset,0,25,0,260),background:'#d9d0bf'}}/>
   <FrameData chapter="04 / THE MONTAGE" number="006"/>
  </Scene>;
};
const Finale:React.FC=()=>{
 const f=useCurrentFrame();
 const come=lerp(f,515,565,0,1);
 return <Scene start={505} end={600}>
  <Background id="porsche"/>
  <Photo id="porsche" x={-98} y={195} w={740} h={495} inAt={510} fromX={-480} angle={-5} border={9}/>
  <Photo id="lambo" x={590} y={185} w={560} h={446} inAt={512} delay={4} fromX={530} angle={8} border={9}/>
  <Photo id="ferrari" x={-140} y={690} w={680} h={460} inAt={515} delay={7} fromX={-600} angle={6} border={9}/>
  <Photo id="mclaren" x={480} y={670} w={740} h={500} inAt={516} delay={9} fromX={560} angle={-5} border={9}/>
  <Photo id="gtr" x={-120} y={1205} w={700} h={450} inAt={519} delay={12} fromX={-500} angle={-5} border={9}/>
  <Photo id="bmw" x={540} y={1222} w={670} h={465} inAt={519} delay={15} fromX={540} angle={7} border={9}/>
  <div style={{position:'absolute',left:0,right:0,top:790,height:370,background:'linear-gradient(90deg,rgba(7,9,11,.92),rgba(7,9,11,.65),rgba(7,9,11,.92))',opacity:lerp(f,546,564,0,1),
      boxShadow:'0 0 95px rgba(0,0,0,.56)'}}/>
  <div style={{position:'absolute',top:846,left:0,right:0,textAlign:'center',color:'#f8f5ee',font:'italic 105px Georgia',letterSpacing:-6,
    transform:'scale('+lerp(f,545,583,1.14,1)+')',opacity:lerp(f,550,571,0,1)}}>The art of speed.</div>
  <div style={{position:'absolute',top:987,left:0,right:0,textAlign:'center',color:'#d5cbb7',font:'bold 20px Arial',letterSpacing:11,opacity:lerp(f,556,585,0,1)}}>DRIVEN BY DESIGN</div>
  <FrameData chapter="05 / THE FINAL FRAME" number="007"/>
 </Scene>;
};
export const AutomotivePhotoCollage001:React.FC=()=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:'#090b0d',color:'#faf9f5',overflow:'hidden'}}>
  <Intro/><Explosion/><Showcase/><Montage/><Finale/>
  <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:.20,
    background:'repeating-linear-gradient(0deg,transparent 0px,rgba(255,255,255,.03) 1px,transparent 2px,transparent 7px)',mixBlendMode:'screen'}}/>
  <div style={{position:'absolute',top:0,left:0,right:0,height:lerp(f,0,599,0,W),background:'transparent'}}/>
  <Audio src={staticFile('automotive-collage/original-soundtrack.wav')} volume={0.42}/>
 </AbsoluteFill>;
};
