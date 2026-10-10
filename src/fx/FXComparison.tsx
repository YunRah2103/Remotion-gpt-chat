import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame} from 'remotion';
import {BeatFxTransform,FilmTexture} from './FXComponents';
import type {BeatCut} from './beat';

/**
 * Native original-graphics A/B, with identical animated content and exact cut
 * frames. First 60 frames are clean, last 60 apply 3 opt-in transitions.
 * No copyrighted video or music. 1080x1920, 30fps, 120 frames.
 */
const enhancedCuts:BeatCut[]=[
  {frame:0,style:'cut'},
  {frame:15,style:'whip-right'},
  {frame:30,style:'zoom-through'},
  {frame:45,style:'light-leak'},
];
const cleanCuts:BeatCut[]=enhancedCuts.map(({frame})=>({frame,style:'cut'}));
const backgrounds=['#101b31','#26313d','#302139','#162c32'];
const accents=['#65cbe6','#d3a47b','#d3a7dd','#88dfc2'];

const TestScene:React.FC<{enhanced:boolean}>=({enhanced})=>{
  const frame=useCurrentFrame();
  const index=Math.min(3,Math.floor(frame/15));
  const local=frame%15;
  const drift=local*27;
  const accent=accents[index];
  return <AbsoluteFill style={{overflow:'hidden',background:'#080c13'}}>
    <BeatFxTransform duration={60} cuts={enhanced?enhancedCuts:cleanCuts} strength={.65}>
      <AbsoluteFill style={{background:`linear-gradient(150deg,${backgrounds[index]},#070b12 84%)`}}>
        <div style={{position:'absolute',left:-330+drift,top:665,width:940,height:620,
          transform:'skewX(-21deg) rotate(-8deg)',border:`18px solid ${accent}`,
          borderRadius:155,boxShadow:`0 0 80px ${accent}44`}}/>
        <div style={{position:'absolute',left:250+drift*.65,top:880,width:850,height:290,
          borderRadius:85,background:`linear-gradient(120deg,${accent}b0,#151923 79%)`,
          transform:'rotate(-13deg)',boxShadow:'0 36px 90px #0009'}}/>
        {Array.from({length:5},(_,i)=><div key={i} style={{
          position:'absolute',left:-110+drift*1.3,top:1150+i*105,
          width:660,height:3,transform:'rotate(-13deg)',
          background:'rgba(247,249,255,.34)'}}/>)}
        <div style={{position:'absolute',top:190,left:70,right:70,color:'#f1f4fa',
          fontFamily:'Arial,Helvetica,sans-serif'}}>
          <div style={{fontSize:27,letterSpacing:7,color:accent}}>DETERMINISTIC CINEMATIC FX</div>
          <div style={{fontSize:94,fontWeight:900,letterSpacing:-4,marginTop:20}}>
            CUT {String(index+1).padStart(2,'0')}
          </div>
          <div style={{fontSize:32,marginTop:15,letterSpacing:2}}>SAME SOURCE · SAME FRAME</div>
        </div>
      </AbsoluteFill>
    </BeatFxTransform>
    <FilmTexture grain={.025} vignette={.09}/>
    <div style={{position:'absolute',left:70,right:70,bottom:176,padding:'25px 30px',
      background:'rgba(0,0,0,.8)',borderLeft:`6px solid ${accent}`,
      color:'#f1f4fa',font:'bold 33px Arial,sans-serif',letterSpacing:4}}>
      {enhanced?'ENHANCED / WHIP · ZOOM · LIGHT LEAK':'CONTROL / CLEAN CUTS'}
    </div>
  </AbsoluteFill>;
};
export const FXComparison:React.FC=()=> <AbsoluteFill style={{background:'#070b10'}}>
  <Sequence from={0} durationInFrames={60}><TestScene enhanced={false}/></Sequence>
  <Sequence from={60} durationInFrames={60}><TestScene enhanced={true}/></Sequence>
</AbsoluteFill>;
