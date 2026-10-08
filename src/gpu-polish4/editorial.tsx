import React from 'react';
import {ease,SHOT_MAP} from './camera';

/** Editorial is deliberately sparse; the real 3D hardware is the hero. */
export const Editorial:React.FC<{frame:number;stages?:typeof SHOT_MAP}>=({frame,stages=SHOT_MAP})=>{
  const stage=stages.find(s=>frame>=s.from&&frame<=s.to) || stages[stages.length-1];
  const titleIn=ease(frame,4,17)*(1-ease(frame,39,54));
  const endIn=ease(frame,405,423);
  const techAlpha=ease(frame,stage.from,stage.from+8);
  return <React.Fragment>
    <div style={{position:'absolute',left:62,right:62,top:80,
      display:'flex',justifyContent:'space-between',alignItems:'center',
      fontSize:18,fontWeight:700,letterSpacing:3.7,
      color:'#e4e5e4',opacity:.82,pointerEvents:'none'}}>
      <span>XFX / SWIFT</span><span>RX 9060 XT</span>
    </div>
    <div style={{position:'absolute',top:160,left:62,right:55,
      opacity:titleIn,pointerEvents:'none',
      transform:'translateY('+(14*(1-titleIn))+'px)'}}>
      <div style={{fontSize:73,fontWeight:800,letterSpacing:-2.9,
        lineHeight:.98}}>ENGINEERED</div>
      <div style={{fontSize:35,fontWeight:700,letterSpacing:3.9,
        marginTop:13,color:'#b8c0c4'}}>TO COME APART.</div>
    </div>
    <div style={{position:'absolute',left:64,right:64,bottom:229,
      display:'flex',alignItems:'flex-end',justifyContent:'space-between',
      gap:22,opacity:Math.max(.66,techAlpha),pointerEvents:'none'}}>
      <div>
        <div style={{fontSize:18,fontWeight:700,letterSpacing:3.6,
          color:'#a9b7be',marginBottom:10}}>{stage.label}</div>
        <div style={{fontSize:19,fontWeight:600,letterSpacing:1.7,
          color:'#dae0e4'}}>{frame<90?'THREE FANS. ONE MACHINE.':
          frame<160?'AN AXIAL COOLING SYSTEM':
          frame<210?'PRECISION THERMAL PATH':
          frame<280?'THE HARDWARE UNDERNEATH':
          frame<330?'EVERY LAYER HAS A PURPOSE':
          'THE ANATOMY OF PERFORMANCE'}</div>
      </div>
      <span style={{fontSize:18,fontWeight:700,color:'#a7b6bf',
        letterSpacing:2,whiteSpace:'nowrap'}}>{String(Math.floor(frame/30)).padStart(2,'0')} / 15</span>
    </div>
    <div style={{position:'absolute',bottom:103,left:64,right:64,height:2,
      background:'#c1cbd030'}}>
      <div style={{height:'100%',width:((frame+1)/450*100)+'%',
        background:'#e9eaeb'}}/>
    </div>
    <div style={{position:'absolute',top:190,left:64,right:64,
      opacity:endIn,pointerEvents:'none',
      transform:'translateY('+(16*(1-endIn))+'px)'}}>
      <div style={{fontSize:72,fontWeight:800,letterSpacing:1.1,lineHeight:1}}>
        DECONSTRUCTED
      </div>
      <div style={{fontSize:21,letterSpacing:4,marginTop:19,
        color:'#c3cbd0',fontWeight:700}}>XFX SWIFT · 16GB</div>
    </div>
  </React.Fragment>;
};
