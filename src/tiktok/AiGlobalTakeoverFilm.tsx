import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {AI_GLOBE_LAND} from './aiTakeoverWorld';

/**
 * AI GLOBAL TAKEOVER — a speculative 2.5D Remotion short.
 * 1080x1920 / 30fps / 1020 frames (34 seconds).
 * Entirely deterministic animation: spherical lat/lon projection, procedural
 * extruded isometric buildings, live traffic/network paths and orbiting core.
 * No AI-generated stills, stock footage, external assets or CSS videos.
 * Visual master is intentionally VO-free until final narration approval.
 */

const C = {
  ink: '#030b12', night: '#061b28', blue: '#0b3551',
  cyan: '#78f9ff', ice: '#c5fcff', teal: '#2ccee1',
  white: '#effcff', dim: '#a1b9c7', gold: '#f2c578',
  danger: '#ff8d82', charcoal: '#0b2434',
};
const FONT = 'Arial, Helvetica, sans-serif';
const TWOPI = Math.PI * 2;
const RAD = Math.PI / 180;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => 1 - Math.pow(1 - clamp(n), 3);
const smooth = (n: number) => {const x=clamp(n);return x*x*(3-2*x);};
const mix = (a: number,b: number,p: number) => a+(b-a)*p;
const pts = (xy: {x:number,y:number}[]) => xy.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(' ');
const hash = (v: number) => {
 const x = Math.sin(v*127.1+69.7) * 43758.5453123;
 return x - Math.floor(x);
};
const fade = (t:number, a:number,b:number,edge=0.5) =>
 smooth((t-a)/edge) * (1-smooth((t-(b-edge))/edge));
const fadeUp = (t:number,at:number,duration=0.55) => ease((t-at)/duration);
const vecDist=(a:{x:number,y:number},b:{x:number,y:number})=>Math.hypot(a.x-b.x,a.y-b.y);

const STARS = Array.from({length:145},(_,i)=>({
 x:hash(i*7+1)*1080, y:hash(i*13+5)*1920,
 size:0.8+hash(i*21+8)*2.3, flicker:hash(i*29+10)*TWOPI,
}));
const CITY_BUILDINGS = (() => {
 const b:{x:number,y:number,h:number,id:number,kind:number,phase:number}[] = [];
 for(let x=-7;x<=7;x++)for(let y=-7;y<=7;y++){
  if(Math.abs(x-y)>11 || hash(x*47+y*31+500)<0.10)continue;
  const k=(x+8)*31+y+8;
  const central=1/(1+Math.hypot(x*.23,y*.23));
  const h=80+hash(k*37)*220+Math.pow(central,3)*500+
    (hash(k*91)>.93?205:0);
  b.push({x,y,h,id:k,kind:hash(k*25)>.77?1:0,phase:hash(k*43)});
 }
 return b.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
})();
const LINKS=[[0,7],[7,11],[11,18],[18,25],[25,30],[30,34],[34,42],[42,54],
[54,63],[63,67],[67,75],[75,82],[82,93],[93,106],[106,125],[125,140]];
const CITIES:{name:string,lon:number,lat:number}[]=[
 {name:'NEW YORK',lon:-74.0,lat:40.7},{name:'LONDON',lon:-0.1,lat:51.5},
 {name:'SÃO PAULO',lon:-46.6,lat:-23.5},{name:'LAGOS',lon:3.4,lat:6.5},
 {name:'DUBAI',lon:55.3,lat:25.2},{name:'SINGAPORE',lon:103.8,lat:1.3},
 {name:'TOKYO',lon:139.7,lat:35.7},{name:'SYDNEY',lon:151.2,lat:-33.9},
 {name:'MUMBAI',lon:72.9,lat:19.1},{name:'NAIROBI',lon:36.8,lat:-1.3},
 {name:'LOS ANGELES',lon:-118.2,lat:34.1},{name:'SEOUL',lon:127.0,lat:37.6},
];
const CONNECTIONS=[[0,1],[0,10],[1,3],[1,4],[3,9],[4,8],[4,5],[5,6],[5,7],[6,11],[8,9],[9,2],[2,0]];

const NightSky:React.FC<{t:number}> =({t})=><AbsoluteFill style={{background:'radial-gradient(ellipse at 51% 56%, #0a3042 0%, #041723 51%, #02070e 100%)',overflow:'hidden'}}>
 <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <defs><radialGradient id="nebula"><stop stopColor="#2d8396" stopOpacity=".32"/><stop offset="1" stopColor="#2d8396" stopOpacity="0"/></radialGradient></defs>
  <ellipse cx={580+Math.sin(t*.12)*30} cy="900" rx="800" ry="770" fill="url(#nebula)"/>
  {STARS.map((s,i)=><circle key={i} cx={s.x} cy={s.y} r={s.size}
    fill={i%4===0?C.cyan:C.white} opacity={.16+.28*(1+Math.sin(t*(.55+hash(i)*1.4)+s.flicker))*.5}/>)}
 </svg>
 <div style={{position:'absolute',left:0,right:0,bottom:0,height:470,
   background:'linear-gradient(transparent,rgba(0,5,12,.55))'}}/>
 </AbsoluteFill>;

type V3={x:number,y:number,z:number};
const projectGeo=(lon:number,lat:number,rot:number,cx:number,cy:number,r:number)=>{
 const lonR=(lon-rot)*RAD, latR=lat*RAD;
 const cl=Math.cos(latR);
 return {x:cx+r*cl*Math.sin(lonR),y:cy-r*Math.sin(latR),z:cl*Math.cos(lonR)};
};
const projRing=(ring:number[][],rot:number,cx:number,cy:number,r:number)=>{
 // Segment long spherical polygon edges in geographic angular space.
 let d='',open=false,visibleCount=0,firstX=0,firstY=0;
 const add=(lon:number,lat:number)=>{
  const p=projectGeo(lon,lat,rot,cx,cy,r);
  if(p.z>0.012){
   if(!open){d+='M'+p.x.toFixed(1)+' '+p.y.toFixed(1);open=true;firstX=p.x;firstY=p.y;}
   else d+='L'+p.x.toFixed(1)+' '+p.y.toFixed(1);
   visibleCount++;
  }else if(open){
   if(visibleCount>2)d+='Z';
   open=false;visibleCount=0;
  }
 };
 for(let i=0;i<ring.length;i++){
  const prev=ring[i],next=ring[(i+1)%ring.length];
  let dx=next[0]-prev[0]; if(dx>180)dx-=360;if(dx< -180)dx+=360;
  const dy=next[1]-prev[1];
  const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/4));
  for(let k=0;k<count;k++)add(prev[0]+dx*k/count,prev[1]+dy*k/count);
 }
 if(open&&visibleCount>2)d+='Z';
 return d;
};
const globeGridPath=(rot:number,cx:number,cy:number,r:number,type:'lat'|'lon',v:number)=>{
 let d='',pen=false;
 for(let k=0;k<=120;k++){
  const other=-180+k*3;
  const p=type==='lat'?projectGeo(other,v,rot,cx,cy,r):projectGeo(v,-88+k*176/120,rot,cx,cy,r);
  if(p.z>=0.01){d+=(pen?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1);pen=true;}
  else pen=false;
 }
 return d;
};

const Globe:React.FC<{t:number;opacity:number;cx?:number;cy?:number;r?:number;rot?:number;network?:number;scale?:number}> =
({t,opacity,cx=540,cy=1020,r=480,rot=-62,network=1,scale=1})=>{
 const orbit = (t*29)%360;
 const cityPositions=CITIES.map(c=>({...c,...projectGeo(c.lon,c.lat,rot,cx,cy,r)}));
 const drift=0.72+Math.sin(t*.71)*.08;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920"
   style={{position:'absolute',inset:0,opacity,overflow:'visible'}}>
  <defs>
   <radialGradient id="takeover-water" cx="33%" cy="24%" r="81%">
    <stop offset="0" stopColor="#207b8b"/><stop offset=".25" stopColor="#0b4969"/>
    <stop offset=".61" stopColor="#08293e"/><stop offset=".88" stopColor="#04121e"/>
    <stop offset="1" stopColor="#00060b"/>
   </radialGradient>
   <radialGradient id="takeover-atmosphere">
    <stop offset=".59" stopColor="#32d8f5" stopOpacity="0"/>
    <stop offset=".82" stopColor="#45e1f5" stopOpacity=".2"/>
    <stop offset="1" stopColor="#53ecfa" stopOpacity="0"/>
   </radialGradient>
   <radialGradient id="takeover-flare">
    <stop stopColor="#93fdff" stopOpacity=".62"/><stop offset="1" stopColor="#7dfcff" stopOpacity="0"/>
   </radialGradient>
   <clipPath id="takeover-sphere"><circle cx={cx} cy={cy} r={r}/></clipPath>
  </defs>
  <circle cx={cx} cy={cy} r={r*1.26} fill="url(#takeover-atmosphere)" opacity=".8"/>
  <circle cx={cx} cy={cy} r={r} fill="url(#takeover-water)" stroke="#66e4ee" strokeWidth="2.5"/>
  <g clipPath="url(#takeover-sphere)">
   {Array.from({length:11},(_,i)=><path key={'la'+i}
    d={globeGridPath(rot,cx,cy,r,'lat',-75+i*15)} fill="none" stroke="#5bc6e1"
    strokeWidth="1.15" opacity=".25"/>)}
   {Array.from({length:18},(_,i)=><path key={'lo'+i}
    d={globeGridPath(rot,cx,cy,r,'lon',-180+i*20)} fill="none" stroke="#53b5d1"
    strokeWidth="1.1" opacity=".23"/>)}
   {AI_GLOBE_LAND.map((land,i)=>{
    const d=projRing(land,rot,cx,cy,r);
    return d?<path key={i} d={d} fill="#3aced9" fillOpacity=".23"
      stroke="#6cf6f4" strokeOpacity=".64" strokeWidth="1.1"/>:null;
   })}
   {CITIES.map((city,i)=>{
    const q=cityPositions[i];
    if(q.z<.02)return null;
    const a=.4+.6*q.z;
    return <g key={'n'+i} opacity={a*network}>
     <circle cx={q.x} cy={q.y} r={21+Math.sin(t*3+i)*6} stroke={C.cyan} strokeWidth="1.8" fill="none" opacity=".65"/>
     <circle cx={q.x} cy={q.y} r="7.5" fill={C.white}/>
     <circle cx={q.x} cy={q.y} r="17" fill="#70ffff" opacity=".22"/>
    </g>;
   })}
   {CONNECTIONS.map(([ia,ib],i)=>{
    const a=cityPositions[ia],b=cityPositions[ib];
    if(a.z<0.03||b.z<0.03)return null;
    const mx=(a.x+b.x)/2,my=Math.min(a.y,b.y)-Math.min(140,vecDist(a,b)*.35);
    const d='M'+a.x.toFixed(1)+' '+a.y.toFixed(1)+'Q'+mx.toFixed(1)+' '+my.toFixed(1)+' '+b.x.toFixed(1)+' '+b.y.toFixed(1);
    return <g key={'c'+i} opacity={network}>
     <path d={d} stroke="#5df0fe" strokeWidth="5" opacity=".13" fill="none"/>
     <path d={d} stroke="#a6fcff" strokeWidth="2.1" fill="none" strokeDasharray="9 15"
      strokeDashoffset={-(t*62+i*23)}/>
    </g>;
   })}
  </g>
  <circle cx={cx} cy={cy} r={r+1} fill="none" stroke="#a6fbff" strokeWidth="1.8" opacity=".52"/>
  <ellipse cx={cx} cy={cy} rx={r*1.25} ry={r*.29} transform={'rotate(-24 '+cx+' '+cy+')'}
    stroke="#58eff4" strokeWidth="2" strokeDasharray="10 19" fill="none" opacity={network*.38}
    strokeDashoffset={-(t*40)}/>
  <ellipse cx={cx} cy={cy} rx={r*1.17} ry={r*.48} transform={'rotate(53 '+cx+' '+cy+')'}
    stroke="#4ca8cc" strokeWidth="1.5" fill="none" opacity={network*.2}/>
  <circle cx={cx-r*.39+Math.sin(t*.15)*10} cy={cy-r*.59} r={r*.47}
    fill="url(#takeover-flare)" opacity=".16"/>
  {network>.3 && cityPositions.filter(x=>x.z>.65).slice(0,4).map((p,i)=>
    <g key={'lbl'+i} opacity={network*.7}>
     <path d={'M'+p.x+' '+p.y+' l24 -37 h120'} stroke={C.cyan} strokeWidth="1.4" fill="none" opacity=".65"/>
     <text x={p.x+28} y={p.y-47} fill={C.ice} fontSize="20" fontWeight="700" letterSpacing="2">{p.name}</text>
    </g>)}
  <circle cx={cx+r*.92*Math.cos(orbit*RAD)} cy={cy+r*.24*Math.sin(orbit*RAD)}
    r="9" fill="#ecffff" opacity={network*.8}/>
 </svg>;
};

const iso=(x:number,y:number,z:number) => ({x:540+(x-y)*81,y:1220+(x+y)*42-z});
const polygon=(...p:{x:number,y:number}[])=>pts(p);
const windowPath=(x:number,y:number,h:number,s:number,id:number)=>{
 let path='';
 for(let floor=0;floor<Math.min(13,Math.floor(h/42));floor++){
  const z=floor*41+17;
  if(z>h-12)break;
  for(let window=0;window<3;window++){
   if(hash(id*41+floor*7+window*3)<.22)continue;
   let k=.11+window*.21,w=.12;
   const p1=iso(x+s,y+k,z),p2=iso(x+s,y+k+w,z),p3=iso(x+s,y+k+w,z+9),p4=iso(x+s,y+k,z+9);
   path+='M'+polygon(p1,p2,p3,p4)+'Z';
  }
 }
 return path;
};
const Building:React.FC<{b:(typeof CITY_BUILDINGS)[number];power:number;rise:number}> =({b,power,rise})=>{
 const {x,y,id}=b;
 const s=.86, h=b.h*rise;
 const p00=iso(x,y,0),p10=iso(x+s,y,0),p11=iso(x+s,y+s,0),p01=iso(x,y+s,0);
 const q00=iso(x,y,h),q10=iso(x+s,y,h),q11=iso(x+s,y+s,h),q01=iso(x,y+s,h);
 const bright=.10+power*(.28+hash(id)*.38);
 const rim=power>.3?C.cyan:'#35657e';
 return <g>
  <polygon points={polygon(p10,p11,q11,q10)} fill={b.kind?'#173b52':'#14384c'} stroke="#427c8a" strokeWidth=".7"/>
  <polygon points={polygon(p11,p01,q01,q11)} fill={b.kind?'#0a2639':'#0d2b3e'} stroke="#32647b" strokeWidth=".9"/>
  <polygon points={polygon(q00,q10,q11,q01)} fill={power>.4?'#236879':'#194958'} stroke={rim} strokeWidth="1.2"/>
  <path d={windowPath(x,y,h,s,id)} fill={C.cyan} opacity={bright}/>
  <line x1={q11.x} y1={q11.y} x2={p11.x} y2={p11.y} stroke={rim} strokeWidth={1+power*.9} opacity=".65"/>
  {b.h>500&&power>.1&&<line x1={q11.x} y1={q11.y} x2={q11.x} y2={q11.y-22} stroke={C.ice}
   strokeWidth="2.2" opacity={.4+.6*power}/>}
 </g>;
};
const City:React.FC<{t:number;opacity:number;network:number;camera:number}> =({t,opacity,network,camera})=>{
 const scale=1.13+camera*.29;
 const dy=mix(120,-140,camera);
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,opacity}}>
  <defs>
   <radialGradient id="takeover-cityhalo"><stop stopColor="#28bfd3" stopOpacity=".45"/><stop offset="1" stopColor="#25d5dd" stopOpacity="0"/></radialGradient>
   <linearGradient id="takeover-cityground" x1="0" y1="0" x2="0" y2="1">
    <stop stopColor="#15435a"/><stop offset="1" stopColor="#030d17"/>
   </linearGradient>
  </defs>
  <ellipse cx="540" cy="1280" rx="600" ry="680" fill="url(#takeover-cityhalo)" opacity=".8"/>
  <g transform={'translate(540 '+(1110+dy)+') scale('+scale+') translate(-540 -1110)'}>
   <path d="M540 340L1670 1190L540 1810L-590 1190Z" fill="url(#takeover-cityground)" opacity=".65"/>
   {Array.from({length:19},(_,i)=>{
    const q=i-9, a=iso(q,-9,0),b=iso(q,9,0),c=iso(-9,q,0),d=iso(9,q,0);
    return <g key={i} opacity=".37">
     <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3991ab" strokeWidth={i%3===0?3:1.3}/>
     <line x1={c.x} y1={c.y} x2={d.x} y2={d.y} stroke="#3991ab" strokeWidth={i%3===0?3:1.3}/>
    </g>;
   })}
   {CITY_BUILDINGS.map((b,i)=>{
    const radius=Math.hypot(b.x,b.y), scan=network*10.5;
    const power=network===0?.06:smooth((scan-radius+1.1)/2.2);
    const rise=.82+.18*ease((t-.15-i*.0013)/2.5);
    return <Building key={b.id} b={b} power={power} rise={rise}/>;
   })}
   {Array.from({length:34},(_,i)=>{
    const x=-7+hash(i*13+3)*14,y=-7+hash(i*17+8)*14;
    const a=iso(x,y,2),rate=.06+(hash(i*24+4)*.1);
    const c=(t*rate+i*.23)%1;
    const b=iso(x+2*c,y+2*c,2);
    return <path key={'traffic'+i} d={'M'+a.x+' '+a.y+' L'+b.x+' '+b.y}
      stroke={i%3===0?C.gold:C.cyan} strokeWidth={2.5} opacity={(i%3===0?.43:.26)*(.3+network*.7)}/>;
   })}
   {network>.06 && Array.from({length:16},(_,i)=>{
    const ix=-5+(i%5)*2.2,iy=-5+Math.floor(i/5)*3.0;
    const p=iso(ix,iy,14);
    const active=smooth((network*12-Math.hypot(ix,iy))*.4);
    return <g key={'signal'+i} opacity={active*.92}>
      <circle cx={p.x} cy={p.y} r={18+((t*21+i*17)%32)} fill="none" stroke={C.cyan} strokeWidth="2"/>
      <circle cx={p.x} cy={p.y} r="7" fill={C.ice}/>
    </g>;
   })}
  </g>
  <rect x="0" y="1540" width="1080" height="380" fill="#01070b" opacity=".25"/>
 </svg>;
};

const HoloSystem:React.FC<{t:number;opacity:number}> =({t,opacity})=>{
 const entries=[
 {name:'TRAFFIC',icon:'↗',x:66,y:480,target:{x:335,y:955}},
 {name:'ENERGY',icon:'⌁',x:626,y:557,target:{x:683,y:970}},
 {name:'SUPPLY',icon:'◈',x:118,y:1270,target:{x:400,y:1150}},
 {name:'HEALTH',icon:'+',x:617,y:1350,target:{x:660,y:1190}},
 ];
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,opacity}}>
  {entries.map((s,i)=>{
   const show=ease((t-13.4-i*.58)/.6);
   const w=362,h=142;
   return <g key={s.name} opacity={show}>
    <path d={'M'+(s.x+180)+' '+(s.y+90)+' Q'+(s.target.x+100)+' '+(s.y+190)+' '+s.target.x+' '+s.target.y}
      stroke={C.cyan} strokeWidth="1.8" fill="none" strokeDasharray="7 8" opacity=".6"/>
    <circle cx={s.target.x} cy={s.target.y} r={6+Math.sin(t*3+i)*3} fill={C.ice}/>
    <rect x={s.x} y={s.y} rx="20" width={w} height={h} stroke="#70d9ed" fill="#092c3c" fillOpacity=".84" strokeWidth="2.3"/>
    <rect x={s.x+11} y={s.y+11} width="78" height={h-22} rx="14" fill="#21596d"/>
    <text x={s.x+50} y={s.y+92} textAnchor="middle" fontSize="60" fontWeight="900" fill={C.cyan}>{s.icon}</text>
    <text x={s.x+115} y={s.y+61} fontSize="38" fontWeight="900" letterSpacing="1.8" fill={C.white}>{s.name}</text>
    <text x={s.x+116} y={s.y+104} fontSize="22" fontWeight="700" letterSpacing="3" fill={C.cyan}>AI ASSISTED</text>
   </g>;
  })}
 </svg>;
};

const Core:React.FC<{t:number;opacity:number}> =({t,opacity})=>{
 const a=t*17;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,opacity}}>
  <defs><radialGradient id="takeover-corelight"><stop stopColor="#a3fdff" stopOpacity=".62"/><stop offset=".5" stopColor="#50e8f5" stopOpacity=".12"/><stop offset="1" stopColor="#50e8f5" stopOpacity="0"/></radialGradient></defs>
  <ellipse cx="540" cy="1070" rx="590" ry="570" fill="url(#takeover-corelight)"/>
  {Array.from({length:7},(_,i)=> <ellipse key={i} cx="540" cy="1070"
    rx={210+i*47} ry={(210+i*47)*(.30+hash(i*19)*.6)}
    transform={'rotate('+(a*(i%2?1:-1)+i*27)+' 540 1070)'}
    stroke={i%2===0?C.cyan:'#4b83c0'} strokeWidth={i%3===0?4:2} fill="none"
    opacity={.23+i*.06} strokeDasharray={i%2===0?'11 12':'none'}/>)}
  <circle cx="540" cy="1070" r="191" fill="#082b42" stroke={C.cyan} strokeWidth="4"/>
  <circle cx="540" cy="1070" r="157" fill="#12445a" stroke="#8cf9ff" strokeWidth="1.8"/>
  <text x="540" y="1120" textAnchor="middle" fontFamily={FONT} fontSize="147" fontWeight="900" fill={C.ice}>AI</text>
  {Array.from({length:58},(_,i)=>{
   const rr=240+hash(i*13+5)*280,angle=i*2.4+t*(i%2?.09:-.08);
   const x=540+Math.cos(angle)*rr,y=1070+Math.sin(angle)*rr*.76;
   const x2=540+Math.cos(angle+.18)*(rr-125),y2=1070+Math.sin(angle+.18)*(rr-125)*.76;
   return <g key={i} opacity={.22+.54*hash(i*11)}>
    <line x1={x} y1={y} x2={x2} y2={y2} stroke={C.cyan} strokeWidth={1.2}/>
    <circle cx={x} cy={y} r={2+hash(i*39)*3.8} fill={C.ice}/>
   </g>;
  })}
 </svg>;
};

const SceneTitle:React.FC<{t:number;start:number;end:number;eyebrow:string;title:string[];sub?:string;accent?:number;top?:number}> =
({t,start,end,eyebrow,title,sub,accent=1,top=310})=>{
 const inP=ease((t-start-.24)/.55),outP=ease((end-.32-t)/.32),p=inP*outP;
 const fontSize=title.some(s=>s.length>16)?93:title.some(s=>s.length>13)?103:120;
 return <div style={{position:'absolute',inset:0,opacity:p,pointerEvents:'none',color:C.white}}>
  <div style={{position:'absolute',top:top,left:65,right:65,color:C.cyan,
    fontSize:28,fontWeight:900,letterSpacing:7}}>
    <span style={{display:'inline-block',width:52,height:3,verticalAlign:'middle',background:C.cyan,marginRight:18}}/>
    {eyebrow}
  </div>
  <div style={{position:'absolute',top:top+70,left:55,right:55,fontSize,fontWeight:950,lineHeight:.98,
    fontFamily:FONT,letterSpacing:-4,textShadow:'0 4px 32px rgba(0,2,9,.75)',
    transform:'translateY('+Math.round((1-inP)*100)+'px)'}}>
    {title.map((line,i)=><div key={i} style={{color:i===accent?C.cyan:C.white}}>{line}</div>)}
  </div>
  {sub&&<div style={{position:'absolute',top:1540,left:66,right:66,fontWeight:800,fontSize:32,letterSpacing:3,
    color:C.ice,textShadow:'0 3px 16px #000'}}>{sub}</div>}
 </div>;
};

const HEADER:React.FC<{t:number}> =({t})=><div style={{position:'absolute',left:58,right:58,top:70,
display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:FONT,fontWeight:900,color:C.ice}}>
 <span style={{fontSize:30,letterSpacing:7}}>FUTURE / 001</span>
 <span style={{fontSize:23,color:C.cyan,letterSpacing:2}}>{String(Math.floor(t)).padStart(2,'0')}:{String(Math.floor((t%1)*30)).padStart(2,'0')}</span>
</div>;

export const AiGlobalTakeoverFilm:React.FC =()=>{
 const frame=useCurrentFrame(),t=frame/30;
 const globeFirst=fade(t,3.9,9.5,.68);
 const cityFirst=fade(t,0,4.75,.45);
 const cityNetwork=fade(t,8.9,18.95,.7);
 const globeWide=fade(t,18.2,24.85,.7);
 const core=fade(t,23.7,29.1,.7);
 const finale=fade(t,28,34.3,.85);
 const flash=([4.15,9.05,18.45,23.9,28.5].reduce((s,at)=>Math.max(s,(1-clamp(Math.abs(t-at)/.09))*.27),0));
 return <AbsoluteFill style={{background:C.ink,color:C.white,overflow:'hidden',fontFamily:FONT}}>
  <NightSky t={t}/>
  {cityFirst>.001&&<City t={t} opacity={cityFirst} network={0} camera={ease(t/4.0)}/>}
  {globeFirst>.001&&<Globe t={t} opacity={globeFirst} r={mix(515,445,smooth((t-4)/5))}
    rot={-126+(t-4)*13} network={.25+smooth((t-4)/4)*.7}/>}
  {cityNetwork>.001&&<City t={t} opacity={cityNetwork} network={smooth((t-9.3)/8.6)}
    camera={.20+.43*smooth((t-9)/9)}/>}
  {cityNetwork>.05&&t>13.3&&<HoloSystem t={t} opacity={cityNetwork*smooth((t-13.3)/1)}/>}
  {globeWide>.001&&<Globe t={t} opacity={globeWide} r={mix(435,485,smooth((t-18.4)/6))}
    rot={-3+(t-18.3)*23} network={1}/>}
  {core>.001&&<Core t={t} opacity={core}/>}
  {finale>.001&&<Globe t={t} opacity={finale} r={mix(345,485,smooth((t-28)/6))}
    cy={1080} rot={120+(t-28)*10} network={1}/>}
  {/* small grounded vignette, grain illusion, safe area HUD */}
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 52% 48%,transparent 33%,rgba(1,5,12,.17) 70%,rgba(0,2,9,.75) 100%)',pointerEvents:'none'}}/>
  <HEADER t={t}/>
  <div style={{position:'absolute',top:144,left:58,width:964,height:2,background:'linear-gradient(90deg,#86faff,#12576e,transparent)',opacity:.7}}/>
  <SceneTitle t={t} start={0} end={4.7} top={276} eyebrow="A DIFFERENT KIND OF TAKEOVER"
    title={["IT WON'T","LOOK LIKE","ROBOTS."]} accent={2} sub="THE FUTURE ARRIVES QUIETLY."/>
  <SceneTitle t={t} start={4.18} end={9.5} top={287} eyebrow="PHASE 01 / SIGNAL"
    title={["IT STARTS","WITH A","NETWORK."]} accent={2} sub="ONE SIGNAL. MILLIONS OF CONNECTIONS."/>
  <SceneTitle t={t} start={9.05} end={13.6} top={277} eyebrow="PHASE 02 / URBAN SYSTEMS"
    title={["FIRST,","OUR CITIES."]} accent={1} sub="THE PHYSICAL WORLD GOES DIGITAL."/>
  <SceneTitle t={t} start={13.56} end={18.95} top={255} eyebrow="PHASE 03 / INFRASTRUCTURE"
    title={["THEN THE","SYSTEMS."]} accent={1} sub="TRAFFIC · POWER · LOGISTICS · HEALTH"/>
  <SceneTitle t={t} start={18.4} end={24.9} top={280} eyebrow="PHASE 04 / EXPANSION"
    title={["THEN THE","PLANET."]} accent={1} sub="CONNECTED SYSTEMS. SHARED SIGNALS."/>
  <SceneTitle t={t} start={23.95} end={29.15} top={270} eyebrow="PHASE 05 / FEEDBACK LOOP"
    title={["EVERY","DECISION","FEEDS","THE NEXT."]} accent={3} sub="DATA → DECISION → ACTION → DATA"/>
  <SceneTitle t={t} start={28.4} end={31.15} top={251} eyebrow="THE REAL QUESTION"
    title={["WHO'S IN","CONTROL?"]} accent={1} sub="AN AI FUTURE IS NOT PREDETERMINED."/>
  <SceneTitle t={t} start={31.05} end={34.45} top={247} eyebrow="A POSSIBLE FUTURE"
    title={["WHO HOLDS","THE KEYS?"]} accent={1} sub="THAT'S STILL OUR DECISION."/>
  <div style={{position:'absolute',bottom:65,left:57,right:57,
    display:'flex',justifyContent:'space-between',color:C.dim,fontWeight:800,
    fontSize:23,letterSpacing:2}}>
   <span>SPECULATIVE FUTURE / AI SYSTEMS</span>
   <span>{(t/34*100).toFixed(0)}%</span>
  </div>
  <div style={{position:'absolute',bottom:36,left:0,width:(frame/1020*1080)+'px',height:4,
    background:C.cyan,boxShadow:'0 0 25px rgba(92,236,254,.9)'}}/>
  {flash>0&&<AbsoluteFill style={{background:'#bbfaff',opacity:flash,pointerEvents:'none'}}/>}
 </AbsoluteFill>;
};
