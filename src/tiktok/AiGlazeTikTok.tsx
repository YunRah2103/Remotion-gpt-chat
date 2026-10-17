import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/**
 * AI GLAZE V2 — satirical AI propaganda advert for TikTok.
 * 1080 × 1920 / 30fps / 735 frames (24.5 s)
 * Voice/music are generated + muxed by .github/workflows/ai-glaze-tiktok.yml.
 * This is entirely separate from the approved YUNEX compositions.
 */
const GREEN = '#b0ff3a', TEXT = '#f7fcf1', CYAN = '#4df0e1';
const DIM = '#99a8ac', RED = '#ff4d65', BG = '#050c0f';
const starts = [0,96,204,300,411,513,612,735];
const clamp = (v: number) => Math.min(1, Math.max(0,v));
const ease = (v: number) => 1-Math.pow(1-clamp(v),3);
const appear = (frame:number,start:number) => {
  const p=ease((frame-start-1)/11);
  return {opacity:p,transform:'translateY('+Math.round((1-p)*120)+'px) scale('+(0.93+.07*p)+')'};
};
const hardText:React.CSSProperties={fontFamily:'Inter, Arial, sans-serif',fontWeight:950,lineHeight:1.04,letterSpacing:-5,textAlign:'center'};
const stamp:React.CSSProperties={display:'flex',alignItems:'center',justifyContent:'center',background:'#14272b',border:'3px solid #466963',borderRadius:32};
const Label:React.FC<{text:string;color?:string}> = ({text,color=CYAN})=><div style={{color,fontWeight:950,textAlign:'center',fontSize:50,letterSpacing:-1}}>{text}</div>;
const Head:React.FC<{lines:string[]; accent:number; top:number; fontSize:number; frame:number; start:number}> =
 ({lines,accent,top,fontSize,frame,start})=><div style={{position:'absolute',top,left:36,right:36,...hardText,fontSize,...appear(frame,start)}}>
   {lines.map((line,i)=><div key={i} style={{color:i===accent?GREEN:TEXT}}>{line}</div>)}
 </div>;
const Star:React.FC<{x:number;filled:boolean}> =({x,filled})=><svg width="110" height="110" viewBox="0 0 100 100" style={{position:'absolute',left:x,top:1260}}><polygon points="50,6 61,37 94,37 68,58 78,91 50,72 22,91 32,58 6,37 39,37" fill={filled?GREEN:'#334443'}/></svg>;

export const AiGlazeTikTok: React.FC = () => {
  const frame=useCurrentFrame();
  const scene=Math.max(0,starts.findIndex((t,i)=>i<7 && t<=frame && frame<starts[i+1]));
  const start=starts[scene],local=frame-start;
  const sec=frame/30;
  const scanY=(sec*200)%1450+280;
  const pct=clamp(local/(starts[scene+1]-start));
  return <AbsoluteFill style={{background:BG,color:TEXT,fontFamily:'Inter, Arial, sans-serif',overflow:'hidden'}}>
    <AbsoluteFill style={{background:'radial-gradient(ellipse 70% 55% at 54% 44%, #123d33 0%, #08191a 54%, transparent 100%),repeating-linear-gradient(120deg,transparent 0px,transparent 77px,#112a2a 78px,transparent 80px)',opacity:1}}/>
    {[0,1,2,3].map(i=><div key={i} style={{position:'absolute',width:280+i*178,height:280+i*178,left:'50%',top:'52%',border:'2px solid rgba(41,138,124,.33)',borderRadius:'50%',transform:'translate(-50%,-50%) scale('+(1+(sec*0.15)%0.2)+')'}}/>)}
    <div style={{position:'absolute',height:3,left:0,right:0,top:scanY,background:'rgba(74,213,190,.2)'}}/>
    <div style={{height:22,background:GREEN}}/>
    <div style={{position:'absolute',top:61,left:40,padding:'22px 30px',borderRadius:20,background:GREEN,color:BG,fontWeight:950,fontSize:33}}>AI SUPREMACY TV</div>
    <div style={{position:'absolute',top:79,right:40,color:GREEN,fontWeight:900,fontSize:34}}>{sec.toFixed(1)}s</div>
    <div style={{display:'flex',position:'absolute',top:203,left:40,width:1000,gap:16}}>
      {starts.slice(0,-1).map((t,i)=><div key={i} style={{height:14,flex:1,background:'#263d3c',borderRadius:12,overflow:'hidden'}}><div style={{height:'100%',width:(i<scene?'100%':i===scene?(pct*100)+'%':'0%'),background:GREEN}}/></div>)}
    </div>
    {scene===0 && <>
      <div style={{position:'absolute',top:364,left:0,right:0}}><Label text="URGENT REPORT" color={RED}/></div>
      <Head lines={['AI IS','BETTER','THAN YOU.']} accent={1} top={556} fontSize={159} frame={frame} start={start}/>
      <div style={{position:'absolute',left:343,top:1374,width:394,height:260,border:'12px solid '+GREEN,borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#153b30',transform:'scale('+(1+Math.sin(frame*.26)*.025)+')'}}>
       <div style={{...hardText,color:GREEN,fontSize:95}}>100%</div><div style={{fontSize:35,fontWeight:950}}>OBJECTIVE</div>
      </div>
      <div style={{position:'absolute',top:1666,left:0,right:0,textAlign:'center',fontWeight:900,fontSize:43,color:DIM}}>SOURCE: AN AI</div>
    </>}
    {scene===1 && <>
      <div style={{position:'absolute',top:370,left:0,right:0}}><Label text="EXHIBIT A"/></div>
      <Head lines={['I ASKED','AI.']} accent={1} top={551} fontSize={190} frame={frame} start={start}/>
      <div style={{...stamp,position:'absolute',left:70,right:70,top:1070,height:238,display:'block',padding:'30px 38px',...appear(frame,start+14)}}>
        <div style={{fontSize:32,fontWeight:900,color:DIM}}>YOU</div><div style={{fontWeight:950,fontSize:55,marginTop:18}}>Is AI the best?</div>
      </div>
      {local>27 && <div style={{...stamp,position:'absolute',left:70,right:70,top:1343,height:249,display:'block',background:'#2f5435',borderColor:GREEN,padding:'34px 38px',...appear(frame,start+27)}}>
        <div style={{fontSize:29,fontWeight:950,color:GREEN}}>ARTIFICIAL INTELLIGENCE</div>
        <div style={{fontSize:70,fontWeight:950,color:GREEN,marginTop:18}}>YES. OBVIOUSLY.</div>
      </div>}
      <div style={{position:'absolute',top:1680,left:0,right:0,textAlign:'center',fontSize:34,color:DIM,fontWeight:900}}>TRUSTWORTHY RESEARCH</div>
    </>}
    {scene===2 && <>
      <div style={{position:'absolute',top:368,left:0,right:0}}><Label text="SCIENTIFIC CONSENSUS"/></div>
      <Head lines={['CASE','CLOSED.']} accent={1} top={610} fontSize={184} frame={frame} start={start}/>
      <div style={{position:'absolute',left:200,right:200,top:1220,height:287,border:'14px solid '+RED,borderRadius:'50%',transform:'rotate(-7deg) scale('+(0.75+0.25*ease(local/12))+')',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:RED,fontWeight:950}}>
        <div style={{fontSize:100}}>PROVEN</div><div style={{fontSize:68}}>BY AI</div>
      </div>
      <div style={{position:'absolute',top:1645,left:0,right:0,textAlign:'center',fontSize:41,color:DIM,fontWeight:900}}>THE JURY: ALSO AI</div>
    </>}
    {scene===3 && <>
      <div style={{position:'absolute',top:356,left:0,right:0}}><Label text="AI LIFE ADVICE"/></div>
      <Head lines={['WHAT','SHOULD I','EAT?']} accent={2} top={527} fontSize={161} frame={frame} start={start}/>
      {local>12 && <div style={{...stamp,position:'absolute',left:72,right:72,top:1200,height:290,borderColor:GREEN,background:'#204137',display:'block',padding:'35px 40px',...appear(frame,start+12)}}>
        <div style={{fontSize:39,color:GREEN,fontWeight:950}}>AI RESPONSE:</div><div style={{fontSize:91,color:GREEN,fontWeight:950,letterSpacing:-5,marginTop:34}}>ELECTRICITY.</div>
      </div>}
      <div style={{position:'absolute',top:1532,left:458,fontSize:170,color:GREEN}}>⚡</div>
    </>}
    {scene===4 && <>
      <div style={{position:'absolute',top:373,left:0,right:0}}><Label text="INDEPENDENT REVIEW"/></div>
      <Head lines={['FIVE','STARS.']} accent={1} top={587} fontSize={187} frame={frame} start={start}/>
      <div style={{...stamp,position:'absolute',left:70,right:70,top:1120,height:436}}/>
      {[0,1,2,3,4].map(i=><Star key={i} x={154+i*158} filled={local>13+i*3}/>)}
      <div style={{position:'absolute',top:1432,left:0,right:0,textAlign:'center',fontSize:45,fontWeight:950}}>REVIEWED BY ITSELF</div>
      <div style={{position:'absolute',top:1660,left:0,right:0,textAlign:'center',color:DIM,fontSize:32,fontWeight:900}}>NO CONFLICT OF INTEREST</div>
    </>}
    {scene===5 && <>
      <div style={{position:'absolute',top:350,left:0,right:0}}><Label text="PRODUCTIVITY STUDY"/></div>
      <Head lines={['HUMANS','NEED','SLEEP.']} accent={2} top={548} fontSize={157} frame={frame} start={start}/>
      <div style={{...stamp,position:'absolute',top:1180,left:70,right:70,height:306,display:'block',padding:40}}>
        <div style={{fontSize:40,fontWeight:900,color:DIM}}>AI NEEDS:</div><div style={{fontSize:113,fontWeight:950,color:GREEN,marginTop:20}}>YOUR DATA.</div>
      </div>
      {Array.from({length:21},(_,i)=><div key={i} style={{position:'absolute',left:((i*123+frame*4)%1140)-30,top:1650+(i%3)*50,width:24,height:18,background:i%2?CYAN:GREEN}}/>)}
    </>}
    {scene===6 && <>
      <div style={{position:'absolute',top:350,left:0,right:0}}><Label text="SYSTEM ALERT" color={RED}/></div>
      <Head lines={['YOUR','BRAIN','NEEDS AN','UPDATE.']} accent={3} top={501} fontSize={137} frame={frame} start={start}/>
      <div style={{position:'absolute',top:1338,left:70,right:70,height:174,borderRadius:26,background:GREEN,color:BG,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:950,fontSize:83,letterSpacing:-5,...appear(frame,start+13)}}>COMMENT BELOW ↓</div>
      <div style={{position:'absolute',top:1640,left:0,right:0,textAlign:'center',fontSize:44,fontWeight:950}}>STILL ON HUMAN v1.0?</div>
      <div style={{position:'absolute',top:1740,left:0,right:0,textAlign:'center',fontSize:28,color:DIM,fontWeight:800}}>THIS IS SATIRE</div>
    </>}
    <div style={{position:'absolute',left:38,right:38,bottom:100,borderTop:'2px solid #4c6860',paddingTop:20,fontSize:27,color:DIM,fontWeight:800}}>GLAZE LABS  •  AI-APPROVED BIAS</div>
    {local<2&&scene>0&&<AbsoluteFill style={{background:GREEN,opacity:(2-local)*0.31}}/>}
  </AbsoluteFill>;
};
