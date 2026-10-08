import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/**
 * ORIGINAL recreation of the FIRST NINETY SECONDS of the supplied
 * neutrino / IceCube motion-documentary reference.
 *
 * Every illustration is generated here from SVG paths, parametric geometry,
 * deterministic particle positions, animated diagrams and text. No source
 * video frames, stills, or stock images are used.
 *
 * Composition: 1080x1920 / 30fps / 2700 frames.
 */
const WHITE = '#e9f1f5';
const MUTE = '#647784';
const BLUE = '#5cc9f6';
const ICE = '#9de9ff';
const LIME = '#c6ed73';
const FPS = 30;
const clamp=(n:number,a=0,b=1)=>Math.min(b,Math.max(a,n));
const sm=(n:number)=>{const x=clamp(n);return x*x*(3-2*x);};
const fade=(t:number,a:number,b:number,f=0.8)=>Math.min(sm((t-a)/f),sm((b-t)/f));
const rnd=(seed:number)=>{let z=Math.sin(seed*153.79+17.2)*41389.23;return z-Math.floor(z);};
const lerp=(a:number,b:number,u:number)=>a+(b-a)*u;
const strokes={stroke:WHITE,strokeWidth:1.5,fill:'none'} as const;

type LabelProps={x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end';mono?:boolean;opacity?:number;spacing?:number};
const L=({x,y,children,size=27,color=WHITE,weight=400,anchor='start',mono=false,opacity=1,spacing=0}:LabelProps)=>
  <text x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity} fontSize={size} fontWeight={weight} letterSpacing={spacing} fontFamily={mono?'"SFMono-Regular",Consolas,monospace':'Inter,Arial,Helvetica,sans-serif'}>{children}</text>;

const Caption=({lines}: {lines:string[]})=><g>
  {lines.map((ln,i)=><L key={i} x={540} y={1558+i*48-(lines.length-1)*23} size={32} weight={500} anchor="middle">{ln}</L>)}
</g>;

const Top=({title,sub,year}: {title:string;sub?:string;year?:string})=><g>
 <line x1="75" y1="183" x2="1005" y2="183" stroke="#273843" strokeWidth="1"/>
 <circle cx="75" cy="183" r="4" fill={LIME}/>
 <L x={80} y={154} size={17} mono color="#708995" spacing={2}>ICECUBE  /  THE INVISIBLE UNIVERSE</L>
 <L x={76} y={246} size={32} weight={650}>{title}</L>
 {sub&&<L x={78} y={284} size={20} mono color={MUTE}>{sub}</L>}
 {year&&<L x={995} y={155} size={19} mono color={WHITE} anchor="end">{year}</L>}
 </g>;

const Footer=({section,t}:{section:string;t:number})=><g opacity={0.8}>
 <line x1="76" y1="1758" x2="1004" y2="1758" stroke="#1a2b32" strokeWidth="1"/>
 <line x1="76" y1="1758" x2={76+928*clamp(t/90)} y2="1758" stroke={BLUE} strokeWidth="2"/>
 <L x={77} y={1798} mono size={17} color={MUTE} spacing={1.5}>NEUTRINO OBSERVATORY    /    {section}</L>
 <L x={1004} y={1798} mono size={17} color="#8095a0" anchor="end">{Math.floor(t/60).toString().padStart(2,'0')}:{Math.floor(t%60).toString().padStart(2,'0')}  /  01:30</L>
</g>;

const Human=({x=535,y=980,scale=1,rotate=0,dim=1}:{x?:number;y?:number;scale?:number;rotate?:number;dim?:number})=><g transform={'translate('+x+' '+y+') scale('+(scale*Math.cos(rotate))+','+scale+')'} opacity={dim}>
 <g stroke={ICE} strokeWidth={2.0} fill="none" strokeLinejoin="round" opacity={0.85} filter="url(#softglow)">
   <ellipse cx="0" cy="-315" rx="37" ry="49"/>
   <path d="M-16 -269 L-18 -246 Q-75 -240 -91 -206 L-123 -110 -139 -25 -131 12 -118 10 -112 -24 -108 -87 -82 -170 -75 -81 -75 22 -53 91 -44 236 -39 349 -33 412 -11 418 -7 404 -13 318 -15 218 0 132 15 218 13 318 7 404 11 418 33 412 39 349 44 236 53 91 75 22 75 -81 82 -170 108 -87 112 -24 118 10 131 12 139 -25 123 -110 91 -206 Q75 -240 18 -246 L16 -269"/>
   <path d="M-64 -215 Q0 -181 64 -215 M-71 -85 C-42 -110 37 -110 71 -85 M-55 38 Q0 62 55 38 M0 -209 L0 102 M-43 99 L0 123 43 99"/>
   <path d="M-19 -275 Q0 -261 19 -275 M-22 -316 L-12 -321 M12 -321 L22 -316"/>
 </g>
 <g fill="none" stroke={BLUE} strokeWidth="1" opacity="0.46">
  {Array.from({length:24},(_,i)=>{
    const cy=-242+i*13;const half=cy<60?79-(cy+242)*0.075:50-(cy-60)*0.08;
    return <path key={'r'+i} d={'M'+(-half)+' '+cy+' Q0 '+(cy+17*Math.sin(i*.62))+' '+half+' '+cy}/>;
  })}
  {Array.from({length:18},(_,i)=><path key={'v'+i} d={'M'+(-73+i*8.4)+' -224 Q'+(-68+i*8.1)+' -30 '+(-35+i*4.1)+' 104'}/>)}
  <path d="M-84 -181 L-117 -75 M84 -181 L117 -75 M-54 94 L-30 387 M54 94 L30 387"/>
 </g>
</g>;

const Particles=({t}:{t:number})=><g>
 {Array.from({length:55},(_,i)=>{
   const x=rnd(i+8)*1300-100;
   const yy=(rnd(i+95)*2100+160*t*(0.3+rnd(i+74)) )%2280-190;
   const len=120+370*rnd(i+317);
   const angle=0.45+rnd(i+999)*1.2;
   return <g key={i} opacity={.06+.19*rnd(i+31)}>
    <line x1={x} y1={yy} x2={x+len*Math.cos(angle)} y2={yy-len*Math.sin(angle)} stroke={i%8===0?ICE:'#58717f'} strokeWidth={i%7===0?2:1}/>
    {i%6===0&&<circle cx={x} cy={yy} r={2.6} fill={BLUE}/>}
   </g>;
 })}
 </g>;

const Globe=({t}:{t:number})=>{
  const x=540,y=872,r=285,angle=(t-10)*0.21;
  const latitudes=[-60,-40,-20,0,20,40,60];
  const longitudes=[0,30,60,90,120,150];
  return <g>
   <circle cx={x} cy={y} r={r+12} stroke="#183745" strokeWidth="8" opacity=".34" fill="none" filter="url(#softglow)"/>
   <circle cx={x} cy={y} r={r} fill="url(#globe)" stroke="#3386ad" strokeWidth="2.8"/>
   <g clipPath="url(#earthClip)" stroke="#4c8daf" strokeWidth="1.1" fill="none" opacity={0.6}>
     {latitudes.map(lat=>{
       const ry=r*Math.cos(lat*Math.PI/180);
       return <ellipse key={lat} cx={x} cy={y-r*Math.sin(lat*Math.PI/180)} rx={r} ry={Math.max(6,ry*.15)} opacity={Math.abs(lat)>40?.3:.65}/>;
     })}
     {longitudes.map(a=><ellipse key={a} cx={x} cy={y} rx={r*Math.abs(Math.cos((a/180*Math.PI)+angle))} ry={r} opacity=".55"/>)}
     <path d="M420 678 L463 714 450 753 492 775 472 843 493 876 472 926 495 981 514 1032 483 1094 458 1031 418 998 410 910 387 870 405 800 380 759Z"/>
     <path d="M566 654 L608 667 647 690 682 733 679 775 715 802 697 841 654 848 645 905 600 958 587 1036 556 1075 545 1019 571 971 552 930 567 885 538 853 560 805 525 759Z"/>
     <path d="M733 924 L779 938 785 971 764 987 730 971Z"/>
   </g>
   {Array.from({length:58},(_,i)=>{
     const lat=(rnd(i+303)-.5)*2.5,lon=i*2.399+angle;
     const z=Math.sqrt(Math.max(0,1-lat*lat*.12));
     return <circle key={i} cx={x+r*.93*Math.sin(lon)*z} cy={y+r*lat*.7} r={i%11===0?2.8:1.1} fill={i%9===0?LIME:ICE} opacity={.1+.35*rnd(i+3)}/>;
   })}
   <circle cx="604" cy="636" r="7" fill={LIME}/>
   <line x1="604" y1="636" x2="641" y2="590" stroke={LIME} strokeWidth="1.5"/>
   <L x={650} y={590} size={22} color={LIME} weight={700}>YOU</L>
  </g>;
};

const Timeline=({t}:{t:number})=><g>
 <Top title="A body your size, at these energies" sub="probability  /  one high-energy neutrino"/>
 <Human x={540} y={857} scale={0.29} dim={0.75}/>
 <line x1="132" y1="1148" x2="948" y2="1148" stroke="#596875" strokeWidth="1.7"/>
 {Array.from({length:9},(_,i)=><line key={i} x1={132+i*102} y1={1140} x2={132+i*102} y2="1157" stroke="#70828c" opacity=".6"/>)}
 <circle cx={lerp(132,948,sm((t-15.3)/6.8))} cy="1148" r="7" fill={ICE} filter="url(#softglow)"/>
 <L x={132} y={1192} color={MUTE} mono size={20}>0</L>
 <L x={948} y={1192} color={MUTE} mono size={20} anchor="end">100,000 years</L>
 <L x={540} y={1280} anchor="middle" size={27} mono color={BLUE}>{Math.floor(100000*sm((t-15.3)/6.8)).toLocaleString('en-US')} YEARS TO STOP ONE</L>
 <Caption lines={t<17?['For the high-energy ones in this story,']:t<20?['a body your size would wait about']:['100,000 years to stop a single one.']}/>
</g>;

const SouthPole=({t}:{t:number})=>{
 const p=sm((t-24)/4);
 return <g>
 <Top title="1988  /  The South Pole" sub="the idea begins with one person" year="1988"/>
 <Human x={530} y={850} scale={.67*(1-p)} dim={1-p}/>
 <g opacity={p}>
  <path d="M190 965 L520 850 850 961 517 1081Z" fill="#061016" stroke="#3f5a67" strokeWidth="2"/>
  <path d="M190 965 L190 1020 517 1141 517 1081 M850 961 L850 1017 517 1141" fill="none" stroke="#28414d" strokeWidth="1.5"/>
  {Array.from({length:14},(_,i)=><line key={i} x1={232+i*45} y1="961" x2={280+i*34} y2="1050" stroke="#5d889c" strokeWidth="1" opacity=".25"/>)}
  <circle cx="519" cy="958" r="6" fill={LIME}/>
  <L x={561} y={928} size={21} color={LIME} mono>YOU: 1.75 m</L>
  <L x={520} y={1182} size={18} color={MUTE} mono anchor="middle">the ice at the South Pole</L>
  <line x1="695" y1="1162" x2="880" y2="1162" stroke={WHITE}/>
  <L x={884} y={1168} size={18} mono color={MUTE}>1 m</L>
 </g>
 <Caption lines={t<27?['In 1988, a physicist named','Francis Halzen had an idea.']:['If one body is too small,','use a billion tonnes of ice.']}/>
</g>;
};

const IceCube=({t}:{t:number})=>{
 const flash=sm((t-34.0)/3.0);const radius=27+flash*185;const q=sm((t-38.5)/3);
 return <g>
 <Top title="Under the South Pole" sub="the instrument is buried in transparent ice" year="1988"/>
 <g opacity=".65">
  <path d="M212 720 L540 622 867 753 548 861Z" stroke={ICE} strokeWidth="2" fill="#0c1d28" fillOpacity=".29"/>
  <path d="M212 720 L212 1225 548 1364 548 861 M867 753 L867 1235 548 1364" stroke="#65899c" strokeWidth="1.8" fill="#061016" fillOpacity=".24"/>
  <path d="M212 1225 L548 1115 867 1235 M212 720 L548 861 867 753" stroke="#345768" strokeWidth="1" fill="none"/>
  {Array.from({length:19},(_,i)=>{
   const x=228+i*30;
   return <line key={'s'+i} x1={x} y1={716-78*Math.sin(i*.126)} x2={x} y2={1225+135*Math.sin(i*.14)} stroke="#33718c" strokeWidth="1.4" opacity=".25"/>;
  })}
  {Array.from({length:18},(_,i)=><line key={'h'+i} x1={223} y1={746+i*26} x2={854} y2={783+i*26} stroke="#3c7c94" strokeWidth="1" opacity={.08+i*.004}/>)}
 </g>
 <L x={195} y={755} size={19} mono color={MUTE}>1,450 m</L>
 <L x={195} y={1219} size={19} mono color={MUTE}>2,450 m</L>
 <line x1="546" y1="853" x2="546" y2="1338" stroke="#729aab" strokeDasharray="4 12" opacity=".5"/>
 <circle cx="572" cy="1038" r={Math.max(4,radius)} fill="url(#flash)" opacity={flash*.4}/>
 <circle cx="572" cy="1038" r="13" fill={ICE} opacity={flash}/>
 <circle cx="572" cy="1038" r={radius*.83} fill="none" stroke={ICE} strokeWidth="1.5" opacity={flash*(1-q)}/>
 <circle cx="572" cy="1038" r={radius*.6} fill="none" stroke={BLUE} strokeWidth="1" opacity={flash*.6}/>
 <L x={643} y={913} size={24} color={ICE}>a flash of blue light</L>
 {q>0.03&&<g opacity={q}>
  <line x1="572" y1="1038" x2="783" y2="1038" stroke="#94d5ed" strokeWidth="1" strokeDasharray="4 7"/>
  <L x={781} y={1072} color={MUTE} size={20} mono anchor="end">300 m</L>
  <L x={178} y={1395} size={18} mono color={MUTE}>bedrock</L>
 </g>}
 <Caption lines={t<36?['When a neutrino hits an atom in the ice,','it makes a faint flash of blue light.']:t<43?['Under the South Pole, the ice is clear enough','for that light to travel hundreds of metres.']:['He calls that part pure luck.']}/>
</g>;
};

const Quote=({t}:{t:number})=><g>
 <Top title="One idea that sounded impossible" sub="an account from the early IceCube years" year="1988"/>
 <rect x="91" y="720" width="898" height="268" rx="16" fill="#081118" stroke="#405360" strokeWidth="1.6"/>
 <rect x="111" y="740" width="6" height="229" rx="3" fill={BLUE} opacity=".75"/>
 <L x={154} y={803} size={29} color={WHITE} weight={600}>“everybody thought it was a cute</L>
 <L x={154} y={850} size={29} color={WHITE} weight={600}>idea that wouldn't work”</L>
 <line x1="155" y1="885" x2="932" y2="885" stroke="#263a47" />
 <L x={155} y={924} size={18} mono color={MUTE}>Francis Halzen  /  Nobel Prize interview, Oct 2024</L>
 <g opacity=".35">
  <IceShaftMini x={540} y={1170} size={.49}/>
 </g>
 <Caption lines={['Back then, he says, everybody thought','it was a cute idea that would not work.']}/>
</g>;

const holes=Array.from({length:86},(_,i)=>{
 const angle=i*2.399963;const rr=80+Math.sqrt(i/86)*320;
 return {x:540+Math.cos(angle)*rr,y:965+Math.sin(angle)*rr*.83};
});
const HoleArray=({t}:{t:number})=>{
 const amount=clamp((t-57.8)/12);
 return <g>
  <Top title="The South Pole, from above" sub="schematic plan  /  boreholes 125 m apart" year="1988"/>
  <circle cx="540" cy="965" r="396" stroke="#1d2c34" fill="none" strokeWidth="1" strokeDasharray="2 14"/>
  <circle cx="540" cy="965" r="264" stroke="#182d39" fill="none" strokeWidth="1"/>
  {holes.map((pt,i)=>{
   const active=i/86<amount;
   return <g key={i}>
    <circle cx={pt.x} cy={pt.y} r={active?6.4:5} fill={active?WHITE:'#22343e'} opacity={active?0.96:.35}/>
    {active&&<circle cx={pt.x} cy={pt.y} r="14" fill="none" stroke={BLUE} strokeWidth="1" opacity={.11+.15*Math.sin(t*5+i)}/>}
   </g>;
  })}
  <L x={500} y={1418} color={MUTE} mono size={21}>{'holes '+String(Math.floor(amount*86)).padStart(2,'0')+' / 86'}</L>
  <Caption lines={['So they drilled 86 holes with hot','water, almost 2.5 kilometres deep.']}/>
 </g>;
};

const IceShaftMini=({x=540,y=950,size=1}:{x?:number;y?:number;size?:number})=><g transform={'translate('+x+' '+y+') scale('+size+')'}>
 <line x1="0" y1="-470" x2="0" y2="460" stroke="#3c6577" strokeWidth="5"/>
 {Array.from({length:60},(_,i)=>{
  const yy=-463+i*15.4;
  return <g key={i}>
   <rect x="-10" y={yy} width="20" height="7" rx="3" fill="#4db7e8" opacity={.4+i*.009}/>
   <circle cx="0" cy={yy+3} r="3" fill={i%8===0?ICE:BLUE} opacity=".8"/>
  </g>;
 })}
 </g>;

const StringScene=({t}:{t:number})=>{
 const p=sm((t-70.1)/4.4);
 return <g>
 <Top title="One hole, one string" sub="vertical detector array   /   60 optical sensors" year="1988"/>
 <line x1="123" y1="624" x2="958" y2="624" stroke="#69808c" strokeWidth="2"/>
 <L x={951} y={606} size={17} mono color={MUTE} anchor="end">Eiffel Tower, 324 m</L>
 <IceShaftMini x={540} y={982} size={.84}/>
 <rect x="530" y="642" width="20" height={Math.max(0,p*715)} fill={BLUE} opacity=".19"/>
 <rect x="536" y="642" width="8" height={Math.max(0,p*715)} fill={ICE} opacity=".55"/>
 <line x1="170" y1="641" x2="170" y2="1369" stroke="#4d7487" strokeWidth="1"/>
 <line x1="162" y1="641" x2="177" y2="641" stroke={WHITE}/>
 <line x1="162" y1="1369" x2="177" y2="1369" stroke={WHITE}/>
 <L x={187} y={803} color={MUTE} mono size={19}>1,450 m</L>
 <L x={187} y={1262} color={MUTE} mono size={19}>2,450 m</L>
 <L x={195} y={1420} color={MUTE} mono size={19}>bedrock</L>
 <L x={886} y={1403} size={22} mono color={BLUE} anchor="end">sensors {String(Math.floor(60*p)).padStart(2,'0')} / 60</L>
 <L x={886} y={1434} size={22} mono color={BLUE} anchor="end">all strings: 5,160</L>
 <Caption lines={t<74?['Down each one went 60 light sensors.']:['5,160 in all.']}/>
 </g>;
};

const CompleteScene=({t}:{t:number})=><g>
 <Top title="IceCube, complete" sub="86 strings   /   5,160 sensors   /   1 km³" year="2011"/>
 <g>
  {Array.from({length:27},(_,i)=>{
   const xx=290+(i%9)*61+(Math.floor(i/9)%2)*19;
   const yy=670+Math.floor(i/9)*15;
   return <g key={i}>
    <line x1={xx} y1={yy} x2={xx-32} y2={1292} stroke={i%3===0?ICE:'#548da9'} strokeWidth="2" opacity={.16+.1*rnd(i)}/>
    {Array.from({length:12},(_,j)=><circle key={j} cx={lerp(xx,xx-32,j/12)} cy={lerp(yy,1292,j/12)} r={2.2} fill={j%7===0?LIME:BLUE} opacity={.3+.5*rnd(i+j*50)}/>)}
   </g>;
  })}
  <path d="M260 654 L816 654 817 1319 256 1319Z" fill="url(#beam)" opacity=".16"/>
  <ellipse cx="537" cy="663" rx="278" ry="74" stroke="#2f6886" strokeWidth="1" fill="none"/>
  <ellipse cx="536" cy="1317" rx="282" ry="65" stroke="#325268" strokeWidth="1" fill="none"/>
 </g>
 <Caption lines={['It was finished in 2011, and it is noisy.']}/>
</g>;

const Atmosphere=({t}:{t:number})=><g>
 <Top title="Particles from the atmosphere" sub="background events  /  logarithmic detections per year" year="2011"/>
 <L x={899} y={614} size={20} mono color={MUTE} anchor="end">~3,000 per second</L>
 <line x1="193" y1="702" x2="900" y2="702" stroke={WHITE} opacity=".6"/>
 <line x1="193" y1="700" x2={193+707*sm((t-82.5)/4.5)} y2="700" stroke={ICE} strokeWidth="7"/>
 <g>
 {Array.from({length:45},(_,i)=>{
  const xx=250+i*13.2;const h=100+rnd(i+31)*260;
  const p=sm((t-83.0-i*.045)/2);
  return <line key={i} x1={xx} y1="1160" x2={xx+Math.sin(i)*6} y2={1160-h*p} stroke={i%9===0?ICE:'#8bb4c7'} strokeWidth={i%7===0?5:2} opacity={.12+.25*rnd(i+8)} />;
 })}
 {Array.from({length:45},(_,i)=>{
   const x=180+(rnd(i+21)*700); const y=530+(rnd(i+40)*690);
   const p=clamp((t-83.4)*170-i*18);
   return <circle key={i} cx={x} cy={y+(p%600)} r={rnd(i)*2+1} opacity={p>0?.15+.4*rnd(i+3):0} fill={ICE}/>;
 })}
 </g>
 <line x1="181" y1="1191" x2="899" y2="1191" stroke="#668191" strokeWidth="1.5"/>
 {[['1,000',248],['1 million',524],['1 billion',833]].map(([s,x],i)=><L key={i} x={Number(x)} y={1233} mono size={18} color={MUTE}>{s}</L>)}
 <L x={890} y={1261} size={17} color={MUTE} mono anchor="end">detections per year, log scale</L>
 <Caption lines={['About 3,000 times a second, particles','from our own atmosphere set it off.']}/>
</g>;

export const IceCubeNeutrinos90=()=>{
 const frame=useCurrentFrame(); const t=frame/FPS;
 const globeAlpha=fade(t,10.2,15.2,1);
 const humanAlpha=fade(t,-.5,10.9,1.05);
 const scene=(start:number,end:number,f=.8)=>fade(t,start,end,f);
 let section=t<15?'01 / THROUGH YOU':t<24?'02 / TIME':t<30?'03 / THE IDEA':t<47?'04 / DEEP ICE':t<54?'05 / THE BET':t<70?'06 / DRILLING':t<77?'07 / SENSORS':t<83?'08 / ICECUBE':'09 / BACKGROUND';
 return <AbsoluteFill style={{background:'#010407',overflow:'hidden'}}>
 <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',width:'100%',height:'100%',display:'block'}}>
  <defs>
   <radialGradient id="globe"><stop offset="0" stopColor="#0d2a3a"/><stop offset=".76" stopColor="#07151f"/><stop offset="1" stopColor="#061018"/></radialGradient>
   <radialGradient id="flash"><stop offset="0" stopColor="#d3f5ff" stopOpacity=".9"/><stop offset=".16" stopColor="#38c6ff" stopOpacity=".48"/><stop offset="1" stopColor="#009ef8" stopOpacity="0"/></radialGradient>
   <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#70d6ff" stopOpacity=".1"/><stop offset=".6" stopColor="#49caff" stopOpacity=".6"/><stop offset="1" stopColor="#02567f" stopOpacity="0"/></linearGradient>
   <clipPath id="earthClip"><circle cx="540" cy="872" r="284"/></clipPath>
   <filter id="softglow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.4"/></filter>
  </defs>
  <rect width="1080" height="1920" fill="#010407"/>
  <g opacity=".43">
   {Array.from({length:24},(_,i)=><line key={i} x1={76+i*40} x2={76+i*40} y1="205" y2="1703" stroke="#06131b" strokeWidth="1"/>)}
   {Array.from({length:28},(_,i)=><line key={i} x1="76" x2="1004" y1={320+i*49} y2={320+i*49} stroke="#06131b" strokeWidth="1"/>)}
  </g>
  <g opacity={humanAlpha}>
   <Particles t={t}/>
   <Top title="Through your body, every second" sub="≈ 100,000,000,000,000 neutrinos" />
   <Human x={540} y={923} scale={.85} rotate={Math.max(0,t-2)*.09}/>
   <L x={713} y={702} size={19} mono color={MUTE}>1.75 m</L>
   <line x1="694" y1="707" x2="690" y2="1269" stroke="#465b6a" strokeWidth="1" strokeDasharray="3 11" opacity=".4"/>
   <Caption lines={t<5?['About 100 trillion neutrinos pass','through your body every second.']:['They are tiny particles that go straight','through you, and straight through the Earth.']}/>
  </g>
  <g opacity={globeAlpha}>
   <Top title="Through your body, every second" sub="Earth  /  12,742 km across" />
   <Globe t={t}/>
   <Caption lines={['They are tiny particles that go straight','through you, and straight through the Earth.']}/>
  </g>
  <g opacity={scene(14.8,24.1,.8)}><Timeline t={t}/></g>
  <g opacity={scene(23.2,31.1,.85)}><SouthPole t={t}/></g>
  <g opacity={scene(30,47,.8)}><IceCube t={t}/></g>
  <g opacity={scene(46.3,54.4,.75)}><Quote t={t}/></g>
  <g opacity={scene(53.5,70.7,.75)}><HoleArray t={t}/></g>
  <g opacity={scene(69.9,77.6,.7)}><StringScene t={t}/></g>
  <g opacity={scene(76.9,83.1,.7)}><CompleteScene t={t}/></g>
  <g opacity={scene(82.4,90.6,.7)}><Atmosphere t={t}/></g>
  <Footer t={t} section={section}/>
  <g opacity=".8">
   <line x1="541" y1="1838" x2="541" y2="1855" stroke="#425b69" strokeWidth="1"/>
   <circle cx="541" cy="1847" r="2" fill={BLUE}/>
  </g>
 </svg>
 </AbsoluteFill>;
};
