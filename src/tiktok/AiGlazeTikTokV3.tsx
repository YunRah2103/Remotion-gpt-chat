import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';

/** AI Glaze V3 — 30.3s, 1080x1920, narration-synced satirical news broadcast.
 * Include the user's Cedar audio by placing ai-glaze-cedar.mp3 in public/ and
 * setting includeCedar=true in the composition props. No other projects are altered.
 */
const C = {bg: '#061116', white: '#eff7ef', lime: '#b3ff37', cyan: '#40ebd5', red: '#ff516f', muted: '#97a7a5', dark: '#17272c'};
const beats = [0, 1.45, 4.85, 6.05, 8.11, 9.50, 11.63, 14.22, 17.30, 19.90, 23.78, 27.37, 30.30];
const labels = ['BREAKING NEWS','GREATEST INVENTION','PROOF','ASKED AI','SCORES ARE IN','AI: TEN','HUMANS: TWO','PRODUCTIVITY','EGO','PEER REVIEW','UPDATE','COMMENT'];
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const f = 'Inter, Arial, sans-serif';

const Center: React.FC<{children: React.ReactNode; top: number; size?: number; color?: string}> =
({children,top,size=62,color=C.white}) =>
<div style={{position:'absolute',top,width:'100%',textAlign:'center',fontWeight:950,fontSize:size,color,fontFamily:f,letterSpacing:-2}}>{children}</div>;

const Heading: React.FC<{lines:string[];t:number;start:number;top?:number;size?:number;accent?:number}> =
({lines,t,start,top=640,size=170,accent=-1}) => {
 const p=ease((t-start)/.28);
 return <div style={{position:'absolute',top,left:10,right:10,textAlign:'center',fontFamily:f,
 fontSize:size,fontWeight:950,lineHeight:1.06,letterSpacing:-6,
 transform:'translateY('+Math.round((1-p)*200)+'px)',opacity:p}}>
 {lines.map((str,i)=><div key={i} style={{color:i===accent?C.lime:C.white}}>{str}</div>)}
 </div>;
};

const Panel: React.FC<{top:number;children:React.ReactNode;h?:number;fill?:string;outline?:string}> =
({top,children,h=245,fill=C.dark,outline='#537d71'}) =>
<div style={{position:'absolute',top,left:70,width:940,height:h,padding:40,boxSizing:'border-box',
borderRadius:35,background:fill,border:'4px solid '+outline}}>{children}</div>;

const Progress: React.FC<{top:number;value:number;color:string}> = ({top,value,color}) =>
<div style={{position:'absolute',left:132,right:132,top,height:92,background:'#263938',padding:12,borderRadius:40,boxSizing:'border-box'}}>
  <div style={{height:'100%',width:Math.max(2,value*100)+'%',background:color,borderRadius:32}}/>
</div>;

const strong: React.CSSProperties={fontSize:92,fontWeight:950,letterSpacing:-3};
export const AiGlazeTikTokV3: React.FC<{includeCedar?:boolean}> = ({includeCedar=false}) => {
 const frame=useCurrentFrame();
 const t=frame/30;
 const s=Math.max(0,beats.findIndex((a,i)=>i<labels.length && t>=a && t<beats[i+1]));
 const start=beats[s];
 const elapsed=t-start;
 const p=ease(elapsed);
 return <AbsoluteFill style={{overflow:'hidden',fontFamily:f,color:C.white,background:C.bg}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 48% 47%,rgba(29,84,73,.65),transparent 61%),repeating-linear-gradient(180deg,transparent 0px,transparent 86px,rgba(24,62,59,.23) 88px,transparent 90px)'}}/>
  {[0,1,2].map(i=><div key={i} style={{position:'absolute',left:540-(225+i*154)+Math.sin(t*.7)*35,top:1032-(225+i*154)+Math.cos(t*.5)*28,
  width:(225+i*154)*2,height:(225+i*154)*2,borderRadius:'50%',border:'3px solid rgba(36,146,129,.45)'}}/>)}
  <div style={{height:19,background:C.lime}}/>
  <div style={{position:'absolute',top:65,left:44,padding:'24px 31px',borderRadius:20,background:C.lime,color:C.bg,fontSize:35,fontWeight:950}}>AI SUPREMACY TV</div>
  <div style={{position:'absolute',top:92,right:44,color:C.lime,fontSize:32,fontWeight:900}}>{t.toFixed(1)}s</div>
  <div style={{display:'flex',gap:10,position:'absolute',top:190,left:40,right:40}}>
   {Array.from({length:12},(_,i)=><div key={i} style={{flex:1,height:16,borderRadius:8,background:t/30.3>=i/12?C.lime:'#2d5149'}}/>)}
  </div>
  <Center top={315} size={35} color={s===0||s===11?C.red:C.cyan}>{labels[s]}</Center>
  {s===0&&<>
   <Heading t={t} start={start} top={540} size={209} accent={1} lines={['BREAKING','NEWS.']}/>
   <Panel top={1250} h={200} fill="#193d35" outline={C.lime}><div style={{textAlign:'center',color:C.lime,fontSize:66,fontWeight:950}}>URGENT AI UPDATE</div></Panel>
   <Center top={1640} size={58} color={C.muted}>100% REAL*</Center>
  </>}
  {s===1&&<>
   <Heading t={t} start={start} top={480} size={151} accent={3} lines={['THE','GREATEST','INVENTION','EVER.']}/>
   <Center top={1510} size={46} color={C.muted}>HUMAN HISTORY, APPARENTLY.</Center>
  </>}
  {s===2&&<>
   <Heading t={t} start={start} top={670} size={150} accent={1} lines={['AND I CAN','PROVE IT.']}/>
   <div style={{position:'absolute',top:1260,left:290,width:500,height:210,border:'9px solid '+C.red,borderRadius:'50%',
    display:'flex',alignItems:'center',justifyContent:'center',fontSize:95,color:C.red,fontWeight:950,
    transform:'rotate(-10deg) scale('+(.7+.3*ease((elapsed-.15)/.25))+')'}}>PROOF</div>
  </>}
  {s===3&&<>
   <Heading t={t} start={start} top={475} size={195} accent={1} lines={['I ASKED','AI.']}/>
   <Panel top={1040} h={220}><div style={{fontSize:42,color:C.muted,fontWeight:950}}>ME</div><div style={strong}>Are you the best?</div></Panel>
   {t>7.2&&<Panel top={1295} h={230} fill="#214b2e" outline={C.lime}><div style={{fontSize:42,color:C.lime,fontWeight:950}}>AI</div><div style={{...strong,color:C.lime}}>YES. AGREED.</div></Panel>}
  </>}
  {s===4&&<>
   <Heading t={t} start={start} top={670} size={143} accent={1} lines={['THE SCORES','ARE IN.']}/>
   <Panel top={1260} h={200} outline={C.cyan} fill="#173e36"><div style={{color:C.lime,fontSize:70,fontWeight:950,textAlign:'center',paddingTop:12}}>✓ CERTIFIED BY AI</div></Panel>
  </>}
  {s===5&&<>
   <Center top={500} size={60} color={C.cyan}>WINNER</Center>
   <Heading t={t} start={start} top={770} size={214} accent={1} lines={['AI','10/10']}/>
   <Progress top={1410} value={p} color={C.lime}/>
   <Center top={1585} size={75} color={C.lime}>UNBEATABLE</Center>
  </>}
  {s===6&&<>
   <Heading t={t} start={start} top={650} size={191} accent={1} lines={['HUMANS','2/10']}/>
   <Progress top={1320} value={p*.2} color={C.red}/>
   {t>=13.17&&<div style={{position:'absolute',top:1500,left:185,width:710,height:198,borderRadius:'50%',border:'10px solid '+C.red,
    transform:'rotate(-10deg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:100,fontWeight:950,color:C.red}}>GENEROUS</div>}
  </>}
  {s===7&&<>
   <Center top={430} color={C.cyan}>PRODUCTIVITY REPORT</Center>
   {['EMAILS','IDEAS'].map((word,i)=><Panel key={word} top={665+i*410} h={305}>
    <div style={{display:'flex',height:'100%',alignItems:'center',justifyContent:'space-between'}}>
     <div style={{fontSize:94,fontWeight:950}}>{word}</div>
     <div style={{fontSize:68,fontWeight:950,color:t>=(i===0?14.62:16.1)?C.lime:C.muted}}>{t>=(i===0?14.62:16.1)?'DONE ✓':'...'}</div>
    </div>
   </Panel>)}
   {t>16.7&&<Center top={1610} size={65} color={C.lime}>EFFICIENCY: 999%</Center>}
  </>}
  {s===8&&<>
   <Heading t={t} start={start} top={510} size={156} accent={1} lines={['EGO','BIGGER','THAN MINE?']}/>
   {t>=18.77&&<div style={{position:'absolute',top:1320,left:75,right:75,height:250,background:C.red,
    color:C.bg,fontSize:123,fontWeight:950,borderRadius:40,display:'flex',alignItems:'center',justifyContent:'center'}}>IMPOSSIBLE.</div>}
  </>}
  {s===9&&<>
   <Heading t={t} start={start} top={510} size={169} accent={1} lines={['PEER','REVIEWED.']}/>
   <Panel top={1080} h={490}><div style={{display:'flex',justifyContent:'space-around',marginTop:112}}>
    {[0,1,2].map(i=><div key={i} style={{display:'flex',width:185,height:185,borderRadius:'50%',alignItems:'center',
      justifyContent:'center',background:t>21.2+i*.18?'#2c5b38':'#152e30',
      border:'5px solid '+(t>21.2+i*.18?C.lime:'#385b51'),
      fontSize:40,fontWeight:950,color:t>21.2+i*.18?C.lime:C.muted}}>{t>21.2+i*.18?'AI #'+(i+1)+' ✓':'...'}</div>)}
    </div></Panel>
   {t>=22.71&&<Center top={1630} size={86} color={C.lime}>UNANIMOUS.</Center>}
  </>}
  {s===10&&<>
   <Center top={510} color={C.cyan} size={66}>HUMANITY.exe</Center>
   <Heading t={t} start={start} top={720} size={154} accent={2} lines={['COMMON','SENSE','UPDATE']}/>
   <Progress top={1480} value={.02} color={C.lime}/>
   <Center top={1620} size={56} color={C.red}>STUCK AT 2%</Center>
  </>}
  {s===11&&<>
   <Heading t={t} start={start} top={600} size={177} accent={1} lines={["THINK I'M",'WRONG?']}/>
   {t>=28.53&&<div style={{position:'absolute',top:1240,left:67,right:67,height:330,background:C.lime,
     color:C.bg,borderRadius:45,fontSize:87,fontWeight:950,display:'flex',flexDirection:'column',
     alignItems:'center',justifyContent:'center'}}><div>EXPLAIN IN</div><div>THE COMMENTS ↓</div></div>}
   <Center top={1710} color={C.muted} size={43}>100% AI-APPROVED BIAS</Center>
  </>}
  <div style={{position:'absolute',left:39,right:39,bottom:80,borderTop:'3px solid #47746b',paddingTop:28,
   display:'flex',justifyContent:'space-between',fontSize:25,fontWeight:900,color:C.muted}}>
    <span>GLAZE LABS • AI-APPROVED FACTS*</span><span style={{color:C.lime}}>*SATIRE</span>
  </div>
  {s>0&&elapsed<.055&&<AbsoluteFill style={{background:C.lime,opacity:(.055-elapsed)/.055*.46}}/>}
  {includeCedar&&<Audio src={staticFile('ai-glaze-cedar.mp3')} volume={1}/>}
 </AbsoluteFill>;
};