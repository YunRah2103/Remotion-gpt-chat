import React from 'react';
import {AbsoluteFill,Audio,Easing,interpolate,OffthreadVideo,Sequence,staticFile,useCurrentFrame} from 'remotion';

/** YUNEX Episode 002. 1080×1920/30fps/870 frames. Original Chiron media is
 * imported into public/chiron at runner time, never committed or public.
 * Chiron narration master NOT PRESENT; set includeVoice only when approved file exists.
 * Turbo symbols are deliberately schematic: no asserted OEM component geometry. */
export type ChironProps={includeVoice?:boolean;includeMusic?:boolean};
const FPS=30,WHITE='#f5f8ff',ICE='#72ddff',MUTED='#b3d0e7';
const f=(s:number)=>Math.round(s*FPS);
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>Easing.inOut(Easing.cubic)(clamp(v));
const CUTS=[
 ['CHIRON_105_01.mp4',0,111,-3],
 ['CHIRON_105_03.mp4',111,69,3],
 ['CHIRON_106_01.mp4',180,111,-1],
 ['CHIRON_106_02.mp4',291,111,2],
 ['CHIRON_106_03.mp4',402,111,0],
 ['CHIRON_107_01.mp4',513,90,-3],
 ['CHIRON_105_04.mp4',603,75,3],
 ['CHIRON_107_02.mp4',678,111,-2],
 ['CHIRON_107_03.mp4',789,81,2]
] as const;

const Picture:React.FC<{file:string;frames:number;pan:number}>=({file,frames,pan})=>{
 const fr=useCurrentFrame(),p=clamp(fr/frames);
 const shift=pan+Math.sin(p*Math.PI)*2.6;
 const src=staticFile('chiron/'+file);
 return <AbsoluteFill style={{overflow:'hidden',background:'#050914'}}>
   <OffthreadVideo src={src} muted style={{width:'100%',height:'100%',objectFit:'cover',
       filter:'blur(55px) saturate(1.3) brightness(.62)',transform:'scale(1.24)'}}/>
   <OffthreadVideo src={src} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',
       objectFit:'cover',objectPosition:'center center',
       transform:'translateX('+shift+'%) scale('+(1.03+p*.055)+')',
       filter:'saturate(1.16) contrast(1.10) brightness(.88)'}}/>
   <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(0,7,21,.40),transparent 26%,transparent 59%,rgba(0,6,18,.6))'}}/>
   <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(0,3,9,.24),transparent 30%,transparent 73%,rgba(0,3,9,.26))'}}/>
 </AbsoluteFill>;
};
const Title:React.FC<{start:number;end:number;small:string;main:string;low?:boolean;scale?:number}>=
({start,end,small,main,low=false,scale=1})=>{
 const t=useCurrentFrame()/FPS;if(t<start||t>end)return null;
 const a=smooth((t-start)/.48),b=1-smooth((t-end+.45)/.45),opacity=a*b;
 return <div style={{position:'absolute',left:72,right:62,top:low?undefined:244,bottom:low?246:undefined,
  fontFamily:'Arial,Helvetica,sans-serif',opacity,overflow:'hidden',
  transform:'translateX('+((1-a)*-66)+'px) skewX('+((1-a)*-3)+'deg)'}}>
   <div style={{fontSize:20,color:ICE,fontWeight:800,letterSpacing:'.24em',
    textShadow:'0px 4px 20px #000b',paddingBottom:23}}>{small}</div>
   <div style={{fontSize:99*scale,fontWeight:900,lineHeight:.97,whiteSpace:'pre-line',
    color:WHITE,letterSpacing:'-.068em',textShadow:'0 5px 25px #000c',
    clipPath:'inset(0 '+((1-a)*100)+'% 0 0)'}}>{main}</div>
   <div style={{width:144*a,height:3,marginTop:26,
    background:'linear-gradient(90deg,#91e4f6,transparent)'}}/>
 </div>;
};
const Turbo:React.FC<{x:number;y:number;on:number;phase:number}>=({x,y,on,phase})=>{
 const t=useCurrentFrame()/FPS,rot=t*88+phase*45;
 return <g transform={'translate('+x+','+y+')'}>
  <circle r="67" fill="rgba(1,9,20,.65)" stroke="#c0e9f5"
    strokeOpacity={.22+on*.58} strokeWidth="3"/>
  <circle r="54" fill="none" stroke="#7fdaf7" strokeOpacity={.14+on*.7}
    strokeWidth="6" strokeDasharray="19 11" transform={'rotate('+rot+')'}/>
  {[0,60,120,180,240,300].map(n=><path key={n} d="M0 0 Q30 -5 21 -36 Q0 -26 0 0"
    transform={'rotate('+(n+rot)+')'} fill="#93def7" opacity={.15+.72*on}/>)}
  <circle r="7" fill={on>.2?ICE:'#586c7b'}/>
 </g>;
};
const Diagram:React.FC=()=>{
 const t=useCurrentFrame()/FPS,first=12.7,last=17.05;
 if(t<first||t>last)return null;
 const p=smooth((t-first)/.42)*(1-smooth((t-last+.44)/.44));
 const stage=smooth((t-14.55)/.75);
 return <AbsoluteFill style={{pointerEvents:'none',opacity:p,
  background:'linear-gradient(180deg,rgba(0,6,18,.08),rgba(1,8,21,.42) 48%,rgba(0,5,16,.40))'}}>
   <div style={{position:'absolute',top:265,left:72,right:72,fontFamily:'Arial',textShadow:'0 4px 25px #000d'}}>
    <div style={{fontWeight:800,fontSize:20,letterSpacing:'.20em',color:ICE}}>W16 / TWO-STAGE TURBOCHARGING</div>
    <div style={{fontWeight:900,color:WHITE,fontSize:91,letterSpacing:'-.06em',
      marginTop:23}}>{stage>.30?'FOUR TURBOS':'TWO ACTIVE'}</div>
    <div style={{fontSize:26,color:'#d2e0ee',marginTop:11}}>
      {stage>.30?'Second pair joins as engine speed rises':'Responsive boost at lower engine speeds'}</div>
   </div>
   <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position:'absolute',inset:0}}>
     <line x1="130" y1="1165" x2="950" y2="1165" stroke="#9ce2fa" strokeWidth="2" strokeOpacity=".30" strokeDasharray="10 18"/>
     <line x1="130" y1="1412" x2="950" y2="1412" stroke="#9ce2fa" strokeWidth="2" strokeOpacity=".30" strokeDasharray="10 18"/>
     <Turbo x={335} y={1120} on={1} phase={0}/>
     <Turbo x={747} y={1120} on={1} phase={1}/>
     <Turbo x={335} y={1370} on={stage} phase={2}/>
     <Turbo x={747} y={1370} on={stage} phase={3}/>
     {[335,747].map(x=><React.Fragment key={x}><text x={x} y="1233" textAnchor="middle" fill={WHITE} fontSize="24" fontFamily="Arial" letterSpacing="3">STAGE 01</text>
       <text x={x} y="1487" textAnchor="middle" fill={WHITE} fillOpacity={.45+.55*stage}
         fontSize="24" fontFamily="Arial" letterSpacing="3">STAGE 02</text></React.Fragment>)}
   </svg>
   <div style={{position:'absolute',bottom:230,left:75,fontFamily:'Arial',
     display:'flex',alignItems:'baseline',gap:22,color:WHITE}}>
      <span style={{fontSize:86,fontWeight:900,letterSpacing:'-.05em'}}>{stage>.18?'~3,800':'LOW'}</span>
      <span style={{color:ICE,fontSize:25,fontWeight:800,letterSpacing:'.15em'}}>RPM</span>
   </div>
   <div style={{position:'absolute',bottom:176,left:75,color:MUTED,fontFamily:'Arial',
      fontSize:17,letterSpacing:'.07em'}}>SCHEMATIC OPERATION / NOT AN OEM HARDWARE CUTAWAY</div>
 </AbsoluteFill>;
};
const Chrome:React.FC=()=>{
 const t=useCurrentFrame()/FPS;
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:'Arial',textShadow:'0 3px 18px #000d'}}>
 <div style={{position:'absolute',top:70,left:72,right:72,display:'flex',
     justifyContent:'space-between',alignItems:'center',color:WHITE}}>
   <span style={{fontSize:25,fontWeight:900,letterSpacing:'.16em'}}>YUNEX <span style={{color:ICE}}>002</span></span>
   <span style={{fontSize:16,letterSpacing:'.15em'}}>BUGATTI / CHIRON</span>
 </div>
 <div style={{position:'absolute',top:117,left:72,right:72,height:1,
   background:'linear-gradient(90deg,#d9edff80,transparent)'}}/>
 <div style={{position:'absolute',bottom:77,left:72,right:72,color:'#e2eafa',
  fontSize:16,letterSpacing:'.16em',display:'flex',justifyContent:'space-between'}}>
   <span>ENGINEERING / FOUR TURBOS</span><span>{Math.floor(t).toString().padStart(2,'0')} / 29</span>
 </div>
 </AbsoluteFill>;
};
export const ChironFourTurbosFilm:React.FC<ChironProps>=({includeVoice=false,includeMusic=false})=>{
 const t=useCurrentFrame()/FPS;
 return <AbsoluteFill style={{background:'#050916',color:WHITE}}>
  {CUTS.map(([name,start,frames,pan])=><Sequence key={name} from={start}
    durationInFrames={frames} layout="none"><Picture file={name} frames={frames} pan={pan}/></Sequence>)}
  <AbsoluteFill style={{pointerEvents:'none'}}>
    <Title start={.20} end={3.4} small="THE ENGINEERING QUESTION" main={'WHY FOUR\nTURBOS?'} scale={.99}/>
    <Title start={3.82} end={5.95} small="16 CYLINDERS / 8.0 LITRES" main="W16."/>
    <Title start={8} end={11.52} small="RESPONSIVE AT LOW REVS" main="TWO FIRST." low={true} scale={.84}/>
    <Diagram/>
    {t>17.25&&t<19.95&&<div style={{position:'absolute',top:320,left:72,
      fontFamily:'Arial Black,Arial',fontSize:92,fontWeight:900,color:WHITE,
      letterSpacing:'-.065em',textShadow:'0 4px 28px #000b',
      opacity:smooth((t-17.25)/.45)*(1-smooth((t-19.5)/.45))}}>1,500 PS<span style={{color:ICE}}>.</span></div>}
    <Title start={22.85} end={26.18} small="TWO STAGES / ONE EXTRAORDINARY ENGINE"
      main={'POWER\nON DEMAND.'} low={true} scale={.90}/>
    <Chrome/>
  </AbsoluteFill>
  {includeVoice&&<Audio src={staticFile('chiron/approved-voice.mp3')}/>}
  {includeMusic&&<Audio src={staticFile('chiron/approved-music.m4a')} volume={.12}/>}
 </AbsoluteFill>;
};
