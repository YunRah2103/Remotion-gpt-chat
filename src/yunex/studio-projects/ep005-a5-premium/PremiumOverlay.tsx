import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {frameBeat} from './picture-contract';

/** Callouts must be derived from actually animated Agent-1 real nozzle nodes.
 * Screen-space arbitrary guesses are not accepted as real mechanical tracking. */
export type ScreenTarget={x:number;y:number;visible:boolean;source:'mount:exhaust-tip-left'|'mount:exhaust-tip-right'};
export type VerifiedCaption={text:string;start:number;end:number};
type Props={exhaustTarget?:ScreenTarget|null;verifiedCaptions?:readonly VerifiedCaption[];originalAudioVerified?:boolean};
const font='Inter,Arial,Helvetica,sans-serif';
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const shadow='0 3px 16px rgba(0,0,0,.88)';
const chapters=[
 {id:'hook',number:'00',eyebrow:'THE QUESTION',title:'WHY DO SUPERCARS SHOOT FLAMES?',detail:''},
 {id:'launch',number:'01',eyebrow:'IT DOES NOT ALWAYS HAPPEN',title:'ONLY IN CERTAIN CONDITIONS',detail:''},
 {id:'engine-reveal',number:'02',eyebrow:'INSIDE THE ENGINE',title:'FUEL MAY STAY UNBURNT',detail:''},
 {id:'mechanism',number:'03',eyebrow:'THE EXHAUST PATH',title:'HOT EXHAUST + UNBURNT FUEL',detail:'SIMPLIFIED EXPLANATION'},
 {id:'exhaust',number:'04',eyebrow:'THE IGNITION',title:'A FLASH OF AFTERFIRE',detail:''},
 {id:'payoff',number:'05',eyebrow:'THE PAYOFF',title:'A MOMENTARY BURST',detail:''}
] as const;
const peak=(local:number,length:number,delay=0)=>Math.min(clamp((local-delay)/10),clamp((length-local)/8));
const lane={left:90,right:90,top:1578,height:207};
const diagramNodes=['UNBURNT FUEL','HOT EXHAUST','POSSIBLE IGNITION'];
export const PremiumOverlay:React.FC<Props>=({exhaustTarget,verifiedCaptions=[],originalAudioVerified=false})=>{
 const frame=useCurrentFrame(),beat=frameBeat(frame),local=frame-beat.start,remaining=beat.end-frame;
 const cue=chapters.find(x=>x.id===beat.id)!;
 const hook=beat.id==='hook',mechanism=beat.id==='mechanism';
 const payoff=beat.id==='payoff',flameMoment=payoff&&frame>=674&&frame<=710;
 const finale=payoff&&frame>=711;
 const alpha=peak(local,beat.end-beat.start,hook?12:6);
 const text=finale?'THAT IS AFTERFIRE.':cue.title;
 const textOpacity=flameMoment?0:finale?clamp((frame-711)/10):alpha;
 const introSafe=frame<12;
 const footerCaption=originalAudioVerified&&verifiedCaptions.length>0?
  verifiedCaptions.find(c=>frame/30>=c.start&&frame/30<c.end):undefined;
 const showMount=beat.id==='exhaust'&&frame>=441&&frame<524&&
  exhaustTarget?.visible&&exhaustTarget.x>150&&exhaustTarget.x<820&&
  exhaustTarget.y>240&&exhaustTarget.y<1400;
 const labelX=exhaustTarget?.x??0,labelY=exhaustTarget?.y??0;
 const cta=payoff?'YUNEX / THE SCIENCE OF SPEED':'YUNEX / AUTOMOTIVE SCIENCE';
 return <AbsoluteFill style={{pointerEvents:'none',fontFamily:font,color:'#f5fbff',overflow:'hidden'}}>
  {/* restrained optical vignette and soft framing; no animated game-like fog */}
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(2,8,16,.35) 0%,transparent 28%,transparent 68%,rgba(3,8,17,.26) 100%)'}}/>
  <AbsoluteFill style={{boxShadow:'inset 0 0 190px 12px rgba(2,8,15,.22)'}}/>
  {!introSafe&&<div style={{position:'absolute',left:78,right:78,top:99,
    display:'flex',alignItems:'center',justifyContent:'space-between',
    opacity:.87,textShadow:shadow}}>
    <span style={{fontSize:26,fontWeight:900,letterSpacing:6}}>YUNEX</span>
    <span style={{fontSize:16,letterSpacing:2.3,fontWeight:760}}>{cta}</span>
  </div>}
  {!introSafe&&<div style={{position:'absolute',top:151,left:78,right:78,height:2,
   background:'rgba(208,241,241,.24)',opacity:.6}}>
   <div style={{height:'100%',width:((frame/750)*100)+'%',background:'#9fddd7'}}/>
  </div>}
  {!introSafe&&!flameMoment&&<div style={{position:'absolute',
    left:76,right:76,top:finale?490:mechanism?289:hook?345:321,
    opacity:textOpacity,transform:'translateY('+((1-textOpacity)*16)+'px)'}}>
    <div style={{fontSize:19,fontWeight:830,letterSpacing:3.4,
      textShadow:shadow,color:'#a8e1db',marginBottom:16}}>
      {finale?'THE REVEAL':cue.number+' / '+cue.eyebrow}
    </div>
    <div style={{maxWidth:875,width:'fit-content',padding:'16px 25px 19px',
      background:'linear-gradient(90deg,rgba(5,16,25,.86),rgba(5,16,25,.49))',
      borderLeft:'4px solid #a4e3d9',boxShadow:'0 17px 45px rgba(0,0,0,.24)'}}>
      <div style={{fontSize:hook?53:finale?62:mechanism?42:46,
        fontWeight:860,letterSpacing:-.7,lineHeight:1.10,
        maxWidth:805,textShadow:shadow}}>{text}</div>
      {!finale&&cue.detail&&<div style={{marginTop:13,fontSize:20,
        fontWeight:690,letterSpacing:1.7,color:'#bad6d7'}}>{cue.detail}</div>}
      {beat.id==='engine-reveal'&&frame>=207&&frame<273&&
        <div style={{marginTop:13,fontSize:25,color:'#d2e7e5'}}>
          Especially during some throttle-lift or tuned conditions.
        </div>}
      {beat.id==='exhaust'&&frame>=466&&frame<520&&
        <div style={{marginTop:13,fontSize:24,color:'#d2e7e5'}}>
          Hot exhaust can ignite that fuel.
        </div>}
    </div>
  </div>}
  {/* High-retention mechanism explanation is explicitly a schematic, NOT
     world-projected manifold geometry or a computational fluid simulation. */}
  {mechanism&&frame>=303&&remaining>8&&<div style={{position:'absolute',
    left:78,right:78,top:592,opacity:Math.min(clamp((frame-303)/9),clamp(remaining/9))}}>
    <div style={{display:'flex',gap:12,alignItems:'center'}}>
      {diagramNodes.map((node,i)=><React.Fragment key={node}>
        <div style={{minWidth:0,flex:1,background:'rgba(5,16,24,.85)',
          border:'1px solid rgba(166,221,217,.45)',borderRadius:5,
          padding:'24px 13px',textAlign:'center',
          boxShadow:'0 9px 25px rgba(0,0,0,.28)'}}>
          <div style={{fontSize:16,color:'#7bd9cb',fontWeight:850,marginBottom:8}}>0{i+1}</div>
          <div style={{fontSize:24,lineHeight:1.14,fontWeight:850,letterSpacing:.25}}>{node}</div>
        </div>
        {i<2&&<div style={{fontSize:28,color:'#c6e6dd',fontWeight:900,opacity:.9}}>→</div>}
      </React.Fragment>)}
    </div>
    <div style={{fontSize:17,letterSpacing:1.5,marginTop:12,
      fontWeight:710,color:'#d2e6e4',textShadow:shadow}}>ILLUSTRATIVE PATH — NOT TO SCALE</div>
  </div>}
  {/* Physically tracked annotation only when the REAL exhaust mount projects
      clearly inside the view and away from the phone-safe caption strip. */}
  {showMount&&exhaustTarget&&<svg width="1080" height="1920" style={{
    position:'absolute',inset:0,opacity:clamp((frame-441)/9)*clamp((524-frame)/9)}}>
    <path d={'M '+labelX+' '+labelY+' L '+(labelX+55)+' '+(labelY-60)+' H '+(labelX+185)}
      fill="none" stroke="#a4e7dc" strokeWidth="3"/>
    <circle cx={labelX} cy={labelY} r="7" stroke="#05222a" strokeWidth="2" fill="#e1fff4"/>
    <text x={labelX+61} y={labelY-76} fill="#e8f6f4" fontSize="27"
      fontWeight="800" letterSpacing="2">TAILPIPE</text>
   </svg>}
  {!introSafe&&!flameMoment&&<div style={{position:'absolute',left:80,right:80,
    top:finale?745:mechanism?890:724,opacity:finale?clamp((frame-711)/13)*.9:alpha*.7,
    display:'flex',gap:8}}>
    {chapters.map((c,i)=><span key={c.id} style={{width:i===chapters.findIndex(x=>x.id===beat.id)?36:16,
      height:3,background:c.id===beat.id?'#9be1d4':'rgba(230,247,247,.27)'}}/>)}
  </div>}
  {/* ONE authenticated spoken subtitle lane. Never fake Cedar/word timestamps. */}
  {footerCaption&&<div style={{position:'absolute',...lane,
    display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',
    color:'#fff',fontSize:57,fontWeight:830,lineHeight:1.15,
    textShadow:'0 4px 14px #000,0 7px 29px #000'}}>
    {footerCaption.text}
  </div>}
  <div style={{position:'absolute',bottom:55,right:76,fontSize:15,fontWeight:750,
    textShadow:shadow,letterSpacing:1.4,opacity:.70}}>
   {originalAudioVerified?'ORIGINAL AUDIO VERIFIED':'SILENT PICTURE REVIEW / NOT FINAL'}
  </div>
 </AbsoluteFill>;
};