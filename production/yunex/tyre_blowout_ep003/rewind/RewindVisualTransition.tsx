import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {BranchReplaySample} from './branchReplay.ts';

const shadow='0 3px 18px rgba(4,18,30,.75)';
export const RewindVisualTransition:React.FC<{replay:BranchReplaySample}>=({replay})=>{
  if(replay.phase!=='reverse-crash'&&replay.phase!=='reset-to-choice')return null;
  const reversing=replay.phase==='reverse-crash',p=replay.phaseProgress01;
  const opacity=reversing?Math.min(1,p*9,(1-p)*10):Math.max(0,1-p*3);
  return <AbsoluteFill style={{pointerEvents:'none',justifyContent:'center',
    alignItems:'center',background:reversing?
      'linear-gradient(90deg,rgba(15,31,47,.19),transparent 40%,rgba(15,31,47,.24))':'transparent'}}>
    <div style={{opacity,color:'#f8ffff',fontFamily:'Arial,sans-serif',
      letterSpacing:7,fontSize:41,fontWeight:800,textShadow:shadow,
      transform:'translateY(-300px)'}}>
      <span style={{fontSize:52,verticalAlign:'-2px',marginRight:9}}>↶</span>
      {reversing?'REWIND':'TRY AGAIN'}
    </div>
  </AbsoluteFill>;
};
export const ChoiceOverlay:React.FC<{
 replay:BranchReplaySample;developmentAdapter?:boolean
}>=({replay,developmentAdapter=false})=>{
 const bad=replay.phase==='wrong-outcome'||replay.phase==='freeze-impact';
 const good=replay.phase==='correct-response';
 const showBad=bad&&replay.filmTimeSec<14.15;
 const showGood=good&&replay.filmTimeSec<18.5;
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:'Arial,sans-serif',
  justifyContent:'flex-start',padding:'0 58px',boxSizing:'border-box',color:'#f2f9ff'}}>
  {showBad&&<div style={{marginTop:210,textAlign:'center',textShadow:shadow}}>
    <div style={{fontWeight:800,letterSpacing:5,fontSize:24,marginBottom:10}}>
      HYPOTHETICAL WRONG REACTION
    </div>
    <div style={{fontWeight:900,fontSize:54,letterSpacing:1}}>SLAM THE BRAKES?</div>
  </div>}
  {showGood&&<div style={{marginTop:210,textAlign:'center',textShadow:shadow}}>
    <div style={{fontSize:25,fontWeight:800,letterSpacing:5}}>SAME TYRE FAILURE</div>
    <div style={{fontSize:48,fontWeight:900,marginTop:10}}>STEER SMOOTHLY</div>
    <div style={{fontSize:27,marginTop:14,letterSpacing:1}}>GRADUALLY EASE OFF</div>
  </div>}
  {developmentAdapter&&<div style={{position:'absolute',bottom:70,left:44,right:44,
    textAlign:'center',fontSize:16,letterSpacing:2,fontWeight:700,
    color:'#e8f4fa',textShadow:shadow,
    background:'rgba(3,20,33,.42)',padding:'12px 8px'}}>
    DEVELOPMENT MOTION ADAPTER — AGENT 8 DAMAGE NOT YET INTEGRATED
  </div>}
 </AbsoluteFill>;
};
export const CrashVsControlCue:React.FC<{replay:BranchReplaySample}>=({replay})=>
 <ChoiceOverlay replay={replay}/>;
