import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';

/**
 * YUNEX R35 ATTESA E-TS cinematic documentary. 1920x1080 / 30fps / 27.5s.
 * Nine source excerpts are imported privately at render time from owner-authenticated
 * V4 jobs #97, #98 and #99. Rights and visual angles are NOT yet approved.
 * Voice and music are optional, NEVER substituted.
 */
export type AttesaProps={includeVoice?:boolean; includeMusic?:boolean};
const fps=30, W=1920;
const P='#f0f3f1', G='#94dbb0', A='#ddbea1', M='#c0ccd0';
const sec=(n:number)=>Math.round(n*fps);
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const smooth=(n:number)=>Easing.inOut(Easing.cubic)(clamp(n));
const SHOTS=[
 ['A01_97_scene02.mp4',0,3.08],
 ['A02_97_scene03.mp4',3.08,6.70],
 ['A03_97_scene04.mp4',6.70,10.20],
 ['A04_97_scene05.mp4',10.20,11.55],
 ['B01_98_scene02.mp4',11.55,13.93],
 ['C01_99_scene11.mp4',13.93,16.84],
 ['B02_98_scene06.mp4',16.84,20.64],
 ['C02_99_scene88.mp4',20.64,26.44],
] as const;
const Picture:React.FC<{file:string;duration:number}>=({file,duration})=>{
 const f=useCurrentFrame();
 const z=interpolate(f,[0,sec(duration)],[1.005,1.055],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{overflow:'hidden'}}>
   <OffthreadVideo muted src={staticFile('gtr/'+file)} style={{width:'100%',height:'100%',objectFit:'cover',transform:'scale('+z+')'}}/>
   <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(4,8,11,.58),rgba(4,8,11,.10) 50%,rgba(4,8,11,.31))'}}/>
   <AbsoluteFill style={{background:'linear-gradient(0deg,rgba(0,0,0,.56),transparent 30%,transparent 80%,rgba(0,0,0,.20))'}}/>
 </AbsoluteFill>;
};
const Title:React.FC<{start:number;end:number;eyebrow:string;headline:string;right?:boolean}>=({start,end,eyebrow,headline,right=false})=>{
 const t=useCurrentFrame()/fps,enter=smooth((t-start)/.45),exit=1-smooth((t-end+.48)/.48);
 return <div style={{position:'absolute',top:285,left:right?990:104,opacity:enter*exit,transform:'translateY('+((1-enter)*28)+'px)',width:830,fontFamily:'Arial,Helvetica,sans-serif',pointerEvents:'none'}}>
   <div style={{fontSize:22,fontWeight:700,letterSpacing:'.27em',color:G,marginBottom:23}}>{eyebrow}</div>
   <div style={{fontSize:75,lineHeight:1.07,fontWeight:800,letterSpacing:'-.046em',whiteSpace:'pre-line',color:P,textShadow:'0 6px 30px #000a'}}>{headline}</div>
   <div style={{marginTop:35,width:105*smooth((t-start)/.65),height:4,background:G}}/>
 </div>;
};
const Captions=[
 {a:0,b:4.53,t:'The Nissan GT-R has a secret behind its incredible acceleration.'},
 {a:5.08,b:7.17,t:'Unlike most all-wheel-drive cars,'},
 {a:7.71,b:10.87,t:'the GT-R normally sends its power to the rear wheels.'},
 {a:11.56,b:13.5,t:'But the moment it needs extra traction,'},
 {a:13.94,b:16.43,t:'its intelligent ATTESA E-TS system'},
 {a:16.84,b:20.06,t:'can send up to half the engine torque to the front wheels.'},
 {a:20.62,b:21.14,t:'The result?'},
 {a:21.78,b:24.47,t:'Rear-wheel-drive feeling'},
 {a:24.91,b:26.76,t:'with all-wheel-drive grip.'}
];
const Caption:React.FC<{a:number;b:number;t:string}>=({a,b,t})=>{
 const time=useCurrentFrame()/fps;
 if(time<a||time>b) return null;
 const opacity=smooth((time-a)/.22)*(1-smooth((time-b+.20)/.20));
 return <div style={{position:'absolute',bottom:68,left:240,width:1440,textAlign:'center',fontFamily:'Arial,Helvetica,sans-serif',fontSize:31,fontWeight:560,color:P,textShadow:'0 3px 12px #000,0 4px 27px #000',opacity}}>{t}</div>;
};
/** Top-down conceptual layout: front engine, rear transaxle / transfer;
 * main shaft to rear, second shaft back toward front differential.
 * Torque display illustrates allowed 0:100 -> up to 50:50 range, NOT live telemetry.
 */
const Drivetrain:React.FC=()=>{
 const time=useCurrentFrame()/fps,fade=smooth((time-11.55)/.52)*(1-smooth((time-20.45)/.4));
 const assist=smooth((time-16.48)/1.25);
 const front=Math.round(assist*50),rear=100-front;
 return <AbsoluteFill style={{opacity:fade,background:'linear-gradient(120deg,rgba(5,13,16,.96),rgba(10,25,27,.95),rgba(5,11,14,.96))'}}>
  <div style={{position:'absolute',left:102,top:122,fontFamily:'Arial,Helvetica,sans-serif'}}>
   <div style={{fontSize:21,color:G,fontWeight:800,letterSpacing:'.26em'}}>THE SYSTEM / 02</div>
   <div style={{fontSize:69,color:P,fontWeight:760,letterSpacing:'-.05em',marginTop:15}}>ATTESA E-TS</div>
   <div style={{fontSize:24,color:M,marginTop:12}}>Rear-wheel bias. Front-wheel assistance on demand.</div>
  </div>
  <div style={{position:'absolute',right:118,top:138,display:'flex',gap:72,fontFamily:'Arial,Helvetica,sans-serif'}}>
   <div><div style={{color:M,fontSize:20,letterSpacing:'.1em'}}>FRONT</div><div style={{fontSize:60,color:G,fontWeight:760}}>{front}%</div></div>
   <div><div style={{color:M,fontSize:20,letterSpacing:'.1em'}}>REAR</div><div style={{fontSize:60,color:A,fontWeight:760}}>{rear}%</div></div>
  </div>
  <svg width={1470} height={585} viewBox="0 0 1470 585" style={{position:'absolute',left:226,top:322}}>
   <defs><linearGradient id="attbody"><stop stopColor="#14242a"/><stop offset=".5" stopColor="#1d3135"/><stop offset="1" stopColor="#15292c"/></linearGradient></defs>
   {/* Nose LEFT. Wires conceptual, not exact CAD. */}
   <path d="M158 189 L224 143 Q250 107 330 99 L1150 99 Q1220 110 1287 187 L1324 231 L1324 378 L1287 419 Q1220 476 1150 487 L330 487 Q250 479 224 441 L158 398 Q130 293 158 189Z" fill="url(#attbody)" stroke="#78989d" strokeWidth={3}/>
   <path d="M356 137 L1070 137 L1140 189 L1140 404 L1070 445 L356 445 L290 400 L290 191Z" stroke="#78989d" strokeOpacity={.28} fill="none" strokeDasharray="12 16" strokeWidth={2}/>
   {[ [315,62],[315,460],[1055,62],[1055,460] ].map(([x,y],i)=><rect key={i} x={x} y={y} width={142} height={70} rx={23} fill="#050c0d" stroke="#99acb0" strokeWidth={3}/>)}
   <g stroke="#536b6d" strokeWidth="5"><path d="M387 132 V460"/><path d="M1126 132 V460"/></g>
   <rect x={510} y={240} width={137} height={98} rx={18} fill="#34454a" stroke={A} strokeWidth={3}/>
   <text x={579} y={295} fill={P} fontFamily="Arial" fontSize={22} fontWeight="bold" textAnchor="middle">ENGINE</text>
   <rect x={1039} y={240} width={167} height={98} rx={20} fill="#31454a" stroke={A} strokeWidth={3}/>
   <text x={1122} y={282} fill={P} fontFamily="Arial" fontSize={21} fontWeight="bold" textAnchor="middle">REAR</text>
   <text x={1122} y={309} fill={M} fontFamily="Arial" fontSize={16} textAnchor="middle">TRANSAXLE</text>
   <path d="M647 290 H1039" stroke="#859b9c" strokeWidth={12} strokeLinecap="round"/>
   <path d="M647 290 H1039" stroke={A} strokeWidth={3} strokeDasharray="17 18" strokeDashoffset={-time*42}/>
   <path d="M1126 240 V132 M1126 338 V460" stroke={A} strokeWidth={10}/>
   {/* Second propshaft comes forward FROM rear transfer to front differential. */}
   <path d="M1050 343 L979 389 H387 V340" stroke="#456067" strokeWidth={15} strokeLinejoin="round" fill="none"/>
   <path d="M1050 343 L979 389 H387 V340" stroke={G} strokeOpacity={.08+.92*assist} strokeWidth={3+8*assist} strokeDasharray="22 24" strokeDashoffset={time*52} strokeLinejoin="round" fill="none"/>
   <rect x={349} y={279} width={76} height={63} rx={13} fill="#2d4043" stroke={G} strokeOpacity={.3+assist*.7} strokeWidth={3}/>
   <text x={387} y={319} fontFamily="Arial" fontSize={19} fill={P} textAnchor="middle">F/D</text>
   <path d="M387 279 V132 M387 342 V460" stroke={G} strokeOpacity={.10+.90*assist} strokeWidth={3+assist*8}/>
   <circle cx={387} cy={98} r={35+assist*14} stroke={G} strokeOpacity={.06+assist*.64} strokeWidth={6} fill="none"/>
   <circle cx={387} cy={496} r={35+assist*14} stroke={G} strokeOpacity={.06+assist*.64} strokeWidth={6} fill="none"/>
   <circle cx={1126} cy={98} r={42} stroke={A} strokeOpacity={.71} strokeWidth={5} fill="none"/>
   <circle cx={1126} cy={496} r={42} stroke={A} strokeOpacity={.71} strokeWidth={5} fill="none"/>
   <text x={174} y={300} transform="rotate(-90 174 300)" fill={M} fontSize={20} fontFamily="Arial" textAnchor="middle">FRONT</text>
   <text x={1365} y={300} transform="rotate(90 1365 300)" fill={M} fontSize={20} fontFamily="Arial" textAnchor="middle">REAR</text>
  </svg>
  <div style={{position:'absolute',right:120,bottom:160,fontFamily:'Arial',fontSize:18,color:M}}>Illustration only • 0:100 to 50:50 front:rear • not live vehicle data</div>
 </AbsoluteFill>;
};
export const GtrAttesaFilm:React.FC<AttesaProps>=({includeVoice=false,includeMusic=false})=>{
 const frame=useCurrentFrame(),time=frame/fps;
 return <AbsoluteFill style={{background:'#05090b',color:P}}>
  {SHOTS.map(([file,start,end])=><Sequence key={file} from={sec(start)} durationInFrames={sec(end)-sec(start)}><Picture file={file} duration={end-start}/></Sequence>)}
  <AbsoluteFill style={{pointerEvents:'none'}}>
   <div style={{position:'absolute',top:60,left:103,display:'flex',gap:23,alignItems:'center',fontFamily:'Arial',color:P}}>
    <span style={{fontSize:32,fontWeight:850,letterSpacing:'.24em'}}>YUNEX</span><span style={{height:3,width:43,background:G}}/><span style={{fontSize:17,letterSpacing:'.18em',color:M}}>ENGINEERING / 001</span>
   </div>
   <div style={{position:'absolute',top:75,right:108,fontSize:21,fontFamily:'Arial',letterSpacing:'.08em',color:'#dce8df'}}>NISSAN / R35</div>
   <Title start={.12} end={4.5} eyebrow="NISSAN GT-R R35" headline={'THE SECRET\nBEHIND THE LAUNCH'}/>
   <Title start={5.1} end={10.89} eyebrow="THE POWER BALANCE / 01" headline={'REAR-WHEEL\nBIAS'} right/>
   {time>=11.5&&time<=20.85&&<Drivetrain/>}
   <Title start={21.72} end={26.82} eyebrow="THE PERFORMANCE PAYOFF" headline={'REAR-DRIVE FEEL.\nALL-WHEEL GRIP.'}/>
   {Captions.map((caption,i)=><Caption key={i} {...caption}/>)}
   <AbsoluteFill style={{backgroundColor:'#05090b',opacity:smooth((time-26.80)/.7),pointerEvents:'none'}}/>
  </AbsoluteFill>
  {includeMusic&&<Audio src={staticFile('gtr/music.m4a')} volume={.12}/>}
  {includeVoice&&<Audio src={staticFile('gtr/voice.mp3')}/>}
 </AbsoluteFill>;
};
