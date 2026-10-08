import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
const ink='#050709', mint='#b7ffdb', white='#f1f8f4';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const fade=(n:number,a:number,b:number)=>clamp((n-a)/(b-a));
const m=(n:number,a:number[],b:number[])=>interpolate(n,a,b,{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const Wheel=({x,f}:{x:number;f:number})=><g transform={'translate('+x+' 280)'}>
  <circle r="67" fill="#06090b" stroke="#303a3c" strokeWidth="8"/>
  <circle r="49" fill="#0d1517" stroke="#9bafae" strokeWidth="4"/>
  <g transform={'rotate('+(f*13)+')'} stroke="#c4d5ce" strokeWidth="7" strokeLinecap="round">
    {Array.from({length:6},(_,i)=><line key={i} x1="0" y1="-12" x2="0" y2="-42" transform={'rotate('+(i*60)+')'}/>)}
  </g>
  <circle r="15" fill="#e2eee7" stroke="#242b2e" strokeWidth="5"/>
  <path d="M-62 -22 Q-70 0 -61 22" fill="none" stroke="#65efbf" strokeWidth="3" opacity=".7"/>
</g>;
const Car=({f}:{f:number})=><svg width="1160" height="505" viewBox="0 0 1160 505" style={{overflow:'visible',filter:'drop-shadow(0 35px 26px rgba(0,0,0,.8))'}}>
<defs>
  <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1fff6"/><stop offset=".21" stopColor="#7a9c97"/><stop offset=".48" stopColor="#273b3b"/><stop offset=".66" stopColor="#a4bdba"/><stop offset="1" stopColor="#182528"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bdfde2" stopOpacity=".79"/><stop offset=".32" stopColor="#264647"/><stop offset="1" stopColor="#060c12"/></linearGradient>
  <filter id="light"><feGaussianBlur stdDeviation="7"/></filter>
</defs>
<ellipse cx="570" cy="341" rx="510" ry="36" fill="#83ffd3" opacity=".16" filter="url(#light)"/>
<path d="M73 260 Q89 219 156 211 L288 193 Q360 115 490 100 L744 103 Q830 113 893 188 L1018 211 Q1060 220 1071 250 L1084 288 Q1069 306 1027 310 L149 313 Q75 307 64 286Z" fill="url(#metal)" stroke="#d6ebe1" strokeWidth="4"/>
<path d="M310 196 Q374 125 498 117 L729 121 Q804 130 862 194Z" fill="url(#glass)" stroke="#defbe8" strokeWidth="3"/>
<path d="M570 120 L545 196 M746 125 L781 194" stroke="#b6d6c7" strokeWidth="9" opacity=".85"/>
<path d="M88 242 Q193 246 318 218 L857 216 Q997 226 1047 245" fill="none" stroke="#f1ffef" strokeWidth="6" opacity=".78"/>
<path d="M162 300 L1038 300 L1023 326 L179 328Z" fill="#0b181b"/>
<path d="M105 267 L207 264" stroke="#ff465e" strokeWidth="13" strokeLinecap="round"/>
<path d="M986 241 L1061 248" stroke="#bdffe1" strokeWidth="11" strokeLinecap="round"/>
<path d="M985 240 L1087 247" stroke="#a4ffcb" strokeWidth="21" opacity=".45" filter="url(#light)"/>
<path d="M78 293 L31 293 L24 276 L75 261" fill="#0a1215"/>
<path d="M1022 305 L1092 300 L1104 287 L1083 284" fill="#05090b"/>
<path d="M408 219 L741 219" stroke="#b4cebe" strokeWidth="2" opacity=".75"/>
<path d="M744 229 Q760 237 782 229" fill="none" stroke="#0f1f23" strokeWidth="8"/>
<path d="M467 146 L545 125" fill="none" stroke="#d2ffed" strokeWidth="7" opacity=".45"/>
<Wheel x={286} f={f}/><Wheel x={896} f={f}/>
<path d="M119 315 L201 320 M384 319 L801 319 M983 319 L1062 314" stroke="#83ffcc" strokeWidth="4" opacity=".8"/>
</svg>;
const Head=({children,size,color=white}:{children:React.ReactNode;size:number;color?:string})=><div style={{fontSize:size,color,letterSpacing:-8,fontWeight:900,lineHeight:.94,fontFamily:'Arial Black,Arial,sans-serif'}}>{children}</div>;
export const VectorFilm=()=>{
const f=useCurrentFrame();const {fps}=useVideoConfig();
const a=m(f,[0,12,62,78],[0,1,1,0]),b=m(f,[65,83,167,184],[0,1,1,0]),c=m(f,[177,200,254],[0,1,1]);
const x=m(f,[0,35,70,138,200,269],[230,0,-40,-140,-50,25]);
const scale=m(f,[0,65,95,150,199,269],[.8,1.08,1.13,1.22,1,.93]);
const y=m(f,[0,90,140,220,269],[0,-12,3,-20,0]);
const burst=spring({frame:f,fps,config:{damping:17,stiffness:110}});
return <AbsoluteFill style={{background:ink,color:white,overflow:'hidden',fontFamily:'Arial,Helvetica,sans-serif'}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse 760px 560px at 55% 53%,#174136 0%,#0a1515 37%,#050709 88%)'}}/>
  <AbsoluteFill style={{opacity:.28,backgroundImage:'linear-gradient(90deg,transparent 97%,#92dfbc25 100%),linear-gradient(transparent 97%,#92dfbc19 100%)',backgroundSize:'82px 82px',transform:'perspective(900px) rotateX(59deg) translateY('+((f*30)%82)+'px) scale(1.4)'}}/>
  <div style={{position:'absolute',top:0,left:0,right:0,height:8,background:mint}}/>
  <div style={{position:'absolute',top:70,left:66,fontSize:24,color:mint,letterSpacing:8,fontWeight:800}}>VECTOR / 001</div>
  <div style={{position:'absolute',top:74,right:67,fontSize:20,color:'#a6bbb3',letterSpacing:3}}>MOTION STUDY</div>
  <div style={{position:'absolute',top:220,left:66,width:948,height:1,background:'#ffffff32'}}/>
  <div style={{position:'absolute',top:280,left:67,right:65,opacity:a,transform:'translateY('+((1-a)*82)+'px)'}}>
    <Head size={134}>SPEED</Head><Head size={120} color={mint}>IS A FEELING.</Head>
    <div style={{width:260*burst,height:7,background:mint,marginTop:35}}/>
    <div style={{fontSize:23,letterSpacing:7,color:'#bed2c8',marginTop:28}}>NOT A NUMBER.</div>
  </div>
  <div style={{position:'absolute',top:295,left:67,opacity:b,transform:'translateY('+((1-b)*35)+'px)'}}>
    <Head size={144}>CHASE</Head><Head size={158} color={mint}>THE EDGE.</Head>
    <div style={{fontSize:23,letterSpacing:7,color:'#bed2c8',marginTop:35}}>PRECISION IN EVERY FRAME</div>
  </div>
  <div style={{position:'absolute',top:288,left:67,opacity:c,transform:'translateY('+((1-c)*65)+'px)'}}>
    <div style={{fontSize:23,letterSpacing:9,color:mint,marginBottom:25}}>ENGINEERED MOTION</div>
    <Head size={182}>NEVER</Head><Head size={182} color={mint}>STATIC.</Head>
  </div>
  <div style={{position:'absolute',left:-70,top:950,width:1250,height:600,opacity:.65,transform:'skewY(-8deg) translateX('+(-((f*10)%360))+'px)'}}>
    {Array.from({length:13},(_,i)=><div key={i} style={{position:'absolute',left:i*150,width:65,height:4,top:360+(i%3)*20,background:'#ddffee',boxShadow:'0 0 12px #c1ffdc',opacity:.12+(i%3)*.1}}/>)}
  </div>
  <div style={{position:'absolute',left:-190,top:970,transform:'translateX('+x+'px) translateY('+y+'px) scale('+scale+')',transformOrigin:'center center'}}><Car f={f}/></div>
  <div style={{position:'absolute',top:1430,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#baffdb77,transparent)',boxShadow:'0 0 40px #8effcc5a',opacity:fade(f,25,70)}}/>
  <div style={{position:'absolute',top:1515,left:70,right:70}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
      <div><div style={{fontSize:20,letterSpacing:6,color:mint,marginBottom:15}}>DESIGN / MOVEMENT / IMPACT</div><div style={{fontSize:24,fontWeight:700,color:'#c8d2cc',letterSpacing:4}}>AN ORIGINAL ANIMATED CONCEPT</div></div>
      <div style={{fontSize:92,color:'#dffff0',fontWeight:900,letterSpacing:-7,lineHeight:1}}>01</div>
    </div>
    <div style={{height:1,background:'#ffffff55',marginTop:35}}/>
    <div style={{display:'flex',justifyContent:'space-between',marginTop:27,letterSpacing:5,fontSize:21,fontWeight:700,color:'#a8b7b0'}}><span>BUILT WITH REMOTION</span><span>30 FPS / 09 SEC</span></div>
  </div>
  <div style={{position:'absolute',left:0,right:0,bottom:0,height:200,background:'linear-gradient(transparent,#050709)'}}/>
  <AbsoluteFill style={{border:'2px solid #c1ffda16',pointerEvents:'none'}}/>
  <AbsoluteFill style={{background:'#000',opacity:m(f,[0,8,255,269],[1,0,0,1]),pointerEvents:'none'}}/>
</AbsoluteFill>;
};