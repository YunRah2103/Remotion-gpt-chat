import React, {useLayoutEffect} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RoadWorld,TurboWorld} from './turbo/Mechanical';

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const mix=(a:number,b:number,t:number)=>a+(b-a)*clamp(t);
const stageAt=(frame:number)=>frame<150?0:frame<300?1:frame<450?2:frame<630?3:4;
const sceneStart=[0,150,300,450,630];
const sceneEnd=[150,300,450,630,840];
const titles=['POWER FROM EXHAUST?','WASTED ENERGY','ONE SHAFT. TWO WHEELS.','MORE AIR. MORE POWER.','ENGINEERED TO BREATHE.'];
const chapters=['01 / THE QUESTION','02 / EXHAUST TURBINE','03 / MECHANICAL LINK','04 / PRESSURISED AIR','05 / THE PAYOFF'];
const narrative=[
 {start:0,end:149,text:'A turbocharger uses energy most engines throw away.'},
 {start:150,end:299,text:'Exhaust gas spins a turbine at incredible speed.'},
 {start:300,end:449,text:'A shaft connects it to a compressor, which forces more fresh air into the engine.'},
 {start:450,end:536,text:'More oxygen means more fuel can burn, producing more power.'},
 {start:537,end:575,text:'But compressing air also heats it up.'},
 {start:576,end:655,text:'An intercooler helps cool that air before it reaches the cylinders.'},
 {start:656,end:839,text:'Exhaust energy, turned into performance.'},
];
const textFor=(frame:number)=>narrative.find(n=>frame>=n.start&&frame<=n.end)?.text||'';
const pos=(f:number,frames:number[],vs:number[])=>interpolate(f,frames,vs,{extrapolateLeft:'clamp',extrapolateRight:'clamp'});

const Direction:React.FC<{frame:number;stage:number}>=({frame,stage})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const t=frame-sceneStart[stage];
  if(stage===0){
   camera.position.set(pos(t,[0,65,149],[6.7,6.4,5.6]),pos(t,[0,149],[2.85,2.42]),pos(t,[0,75,149],[13.3,12.1,10.6]));
   camera.lookAt(0,.75,0);
  }else if(stage===1){
   camera.position.set(pos(t,[0,149],[3.2,2.2]),pos(t,[0,149],[2.2,1.4]),pos(t,[0,149],[7.7,5.8]));
   camera.lookAt(-.8,.1,0);
  }else if(stage===2){
   camera.position.set(pos(t,[0,149],[4.2,2.5]),pos(t,[0,149],[1.5,.85]),pos(t,[0,149],[6.8,5.7]));
   camera.lookAt(0,0,0);
  }else if(stage===3){
   camera.position.set(pos(t,[0,90,179],[5.1,6.5,6.4]),pos(t,[0,179],[1.9,2.9]),pos(t,[0,179],[8.3,7.5]));
   camera.lookAt(pos(t,[0,179],[1.1,3]),0,0);
  }else{
   camera.position.set(pos(t,[0,110,209],[10.8,10.2,8.5]),pos(t,[0,110,209],[4.1,3.8,3.25]),pos(t,[0,110,209],[21.0,20.5,17.8]));
   camera.lookAt(0,.77,0);
  }
  camera.updateProjectionMatrix();
 },[camera,frame,stage]);
 return null;
};
const fade=(frame:number,start:number,end:number)=>{
 const into=clamp((frame-start)/10);
 const out=clamp((end-frame-1)/10);
 return Math.min(into,out);
};
export const TurboDocumentary:React.FC=()=>{
 const frame=useCurrentFrame();
 const {width,height}=useVideoConfig();
 const stage=stageAt(frame);
 const local=frame-sceneStart[stage];
 const show=fade(frame,sceneStart[stage],sceneEnd[stage]);
 const headerOpacity=stage===4?clamp((local-64)/25):stage===0?clamp((local-12)/26):clamp((local-10)/18);
 const subtitle=textFor(frame);
 const cardFade=Math.min(clamp((local-3)/8),clamp((sceneEnd[stage]-frame-1)/8));
 return <AbsoluteFill style={{background:'#071018',overflow:'hidden',fontFamily:'Arial,Helvetica,sans-serif',color:'#f1f6f4'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[5,2.3,8.7],fov:stage===4?35:stage===0?38:37,near:.1,far:160}} gl={{antialias:true,preserveDrawingBuffer:true}}>
   <Direction frame={frame} stage={stage}/>
   {stage===0||stage===4?<RoadWorld frame={frame} hero={stage===4}/>:<TurboWorld frame={frame} stage={stage}/>}
  </ThreeCanvas>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(3,10,15,.78) 0%,rgba(3,10,15,.07) 26%,transparent 53%,rgba(2,8,14,.70) 88%,rgba(2,8,14,.94) 100%)',pointerEvents:'none'}}/>
  <div style={{position:'absolute',left:76,right:74,top:92,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
   <div style={{fontWeight:800,fontSize:24,letterSpacing:7,color:'#bfece2'}}>TURBO / 01</div>
   <div style={{fontSize:20,letterSpacing:4,fontWeight:700,color:'#d6e6e6'}}>AUTOMOTIVE ENGINEERING</div>
  </div>
  <div style={{position:'absolute',left:76,right:76,top:153,display:'flex',alignItems:'center',gap:19}}>
   <div style={{height:2,width:64,background:'#79dcde'}}/>
   <div style={{fontSize:21,letterSpacing:5,color:'#a2c5c9'}}>{chapters[stage]}</div>
  </div>
  <div style={{position:'absolute',left:76,right:76,top:stage===4?345:stage===0?385:365,opacity:headerOpacity*cardFade,transform:'translateY('+(1-headerOpacity)*25+'px)'}}>
   <div style={{fontSize:stage===2?66:stage===4?82:stage===0?78:70,letterSpacing:-2,fontWeight:900,lineHeight:1.02,maxWidth:920,textShadow:'0 6px 30px rgba(0,0,0,.8)'}}>
    {titles[stage]}
   </div>
   <div style={{width:126,height:5,marginTop:25,background:'#82e8df',boxShadow:'0 0 18px #66dfdf66'}}/>
  </div>
  {stage===1?<div style={{position:'absolute',right:90,top:995,fontWeight:700,fontSize:23,letterSpacing:4,color:'#ffc37e',opacity:show}}>EXHAUST FLOW → TURBINE</div>:null}
  {stage===2?<div style={{position:'absolute',right:90,top:1030,fontWeight:700,fontSize:23,letterSpacing:4,color:'#cde5e6',opacity:show}}>LINKED ROTATION • COMMON SHAFT</div>:null}
  {stage===3?<div style={{position:'absolute',right:90,top:1100,fontWeight:700,fontSize:23,letterSpacing:4,color:'#8fe4fa',opacity:show}}>INTAKE → COMPRESS → COOL</div>:null}
  <div style={{position:'absolute',left:76,right:76,bottom:188,opacity:cardFade}}>
   <div style={{fontSize:32,fontWeight:600,lineHeight:1.33,color:'#f2f5f4',textShadow:'0 3px 14px #000,0 0 17px #000',maxWidth:924}}>
    {subtitle}
   </div>
   <div style={{height:2,marginTop:30,background:'#ffffff37',position:'relative'}}>
    <div style={{position:'absolute',left:0,top:0,height:2,width:(frame/839*100)+'%',background:'#a2ecdf'}}/>
   </div>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:19,fontWeight:800,letterSpacing:4,color:'#b1c9cb',fontSize:18}}>
    <span>THE HIDDEN POWER OF A TURBOCHARGER</span>
    <span>{String(Math.floor(frame/30)).padStart(2,'0')} / 28</span>
   </div>
  </div>
  <AbsoluteFill style={{background:'#030910',pointerEvents:'none',opacity:1-show}}/>
 </AbsoluteFill>;
};
