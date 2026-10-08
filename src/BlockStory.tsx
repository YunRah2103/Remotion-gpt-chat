import React, {useLayoutEffect} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const C={teal:'#83bcba',stone:'#8b8983',gold:'#d1a342',cream:'#f1e3c0',grass:'#4c7042'};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*clamp(t);
const between=(f:number,a:number,b:number)=>clamp((f-a)/(b-a));
const motion=(f:number)=>Math.sin(f/18);
const segments=[
 [0,2,'if wine spills on your'],
 [2,4,"you can’t"],
 [4,6,'the church leader takes it'],
 [6,8,'washes it and then'],
 [8,10,'drinks the water'],
 [10,12,'and if a piece of bread'],
 [12,14,"they don’t just pick it up"],
 [14,16,'they burn the carpet'],
 [16,18,'and wine like this'],
 [18,20,'because in Catholic tradition'],
 [20,22,'they have a ritual called'],
 [22,24,'the Eucharist'],
 [24,26,'and drink wine'],
 [26,28,'they believe that after'],
 [28,30,'the bread turns into the'],
 [30,32,'and the wine turns into'],
 [32,34,'his real blood'],
 [34,36,'instead of glorifying and'],
 [36,38,'worshipping a piece of bread'],
 [38,40,'Islam calls you'],
 [40,42,'away from all this'],
 [42,44,'where God is far greater'],
] as const;
type BProps={at?:[number,number,number];s:[number,number,number];color:string;metal?:number;rot?:[number,number,number]};
const B:React.FC<BProps>=({at=[0,0,0],s,color,metal=0,rot=[0,0,0]})=><mesh castShadow receiveShadow position={at} rotation={rot}><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={metal?.25:.93} metalness={metal}/></mesh>;
const Cyl:React.FC<{at:[number,number,number],r:number,h:number,c:string,segments?:number,rot?:[number,number,number]}>=({at,r,h,c,segments=20,rot=[0,0,0]})=><mesh castShadow position={at} rotation={rot}><cylinderGeometry args={[r,r,h,segments]}/><meshStandardMaterial color={c} roughness={.63} metalness={c===C.gold?.65:0}/></mesh>;
const Sphere:React.FC<{at:[number,number,number],scale:[number,number,number],c:string}>=({at,scale,c})=><mesh castShadow position={at} scale={scale}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={c} roughness={.95}/></mesh>;

const Goblet:React.FC<{frame:number;at?:[number,number,number];scale?:number;wine?:boolean}>=({frame,at=[0,0,0],scale=1,wine=true})=><group position={at} scale={scale} rotation={[.07*Math.sin(frame/30),frame*.004,0]}>
  <Cyl at={[0,.1,0]} r={.34} h={.09} c={C.gold}/>
  <Cyl at={[0,.37,0]} r={.09} h={.57} c={C.gold}/>
  <mesh castShadow position={[0,.87,0]}><cylinderGeometry args={[.40,.19,.47,28]}/><meshStandardMaterial color="#80a527" metalness={.34} roughness={.31}/></mesh>
  <mesh position={[0,1.111,0]}><torusGeometry args={[.39,.055,10,32]}/><meshStandardMaterial color="#d8c16b" metalness={.53} roughness={.24}/></mesh>
  {wine&&<mesh position={[0,1.104,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.35,32]}/><meshStandardMaterial color="#b6293a" roughness={.28}/></mesh>}
</group>;

const Human:React.FC<{at:[number,number,number];robe?:string;frame:number;angle?:number;rightArm?:number;leftArm?:number;scale?:number}>=({at,robe='#171a20',frame,angle=0,rightArm=.08,leftArm=-.1,scale=1})=><group position={at} rotation={[0,angle,0]} scale={scale}>
  <B s={[.65,.9,.34]} at={[0,1.24,0]} color={robe}/>
  <B s={[.50,.50,.51]} at={[0,2.01,.02]} color="#eac58d"/>
  <B s={[.31,.79,.31]} at={[-.21,.42,0]} color="#171b23"/>
  <B s={[.31,.79,.31]} at={[.21,.42,0]} color="#171b23"/>
  <group position={[-.43,1.59,0]} rotation={[Math.sin(frame/17)*.035,0,leftArm]}><B s={[.24,.69,.28]} at={[0,-.34,0]} color={robe}/><B s={[.25,.25,.27]} at={[0,-.73,0]} color="#ecc992"/></group>
  <group position={[.43,1.59,0]} rotation={[Math.sin(frame/17)*.045,0,rightArm]}><B s={[.24,.69,.28]} at={[0,-.34,0]} color={robe}/><B s={[.25,.25,.27]} at={[0,-.73,0]} color="#ecc992"/></group>
</group>;

const Window:React.FC<{x:number}>=({x})=><group position={[x,2.6,-3.69]}>
  <B at={[0,0,-.01]} s={[1.28,2.38,.14]} color="#252b2c"/>
  {Array.from({length:6},(_,i)=>Array.from({length:4},(_,j)=><B key={i+'-'+j} at={[(j-1.5)*.29,(i-2.5)*.34,.09]} s={[.265,.315,.04]} color={['#b14f3f','#cf8b37','#548b9e','#aa6781','#cfb36e','#83a2b1'][(i*3+j*5)%6]}/>))}
  <B at={[0,0,.15]} s={[.075,2.3,.07]} color="#273031"/>
  <B at={[0,0,.16]} s={[1.25,.066,.06]} color="#273031"/>
</group>;

const Church:React.FC<{frame:number;mode:number}>=({frame,mode})=><group>
  <B at={[0,-.18,0]} s={[18,.36,18]} color={mode>=2?C.grass:'#574439'}/>
  {mode<2&&<>
    {Array.from({length:7},(_,i)=><B key={i} at={[0,-.003,6-i*1.55]} s={[15,.018,.045]} color={i%2?'#382c27':'#796258'}/>)}
    <B at={[0,2.6,-3.93]} s={[11,6,.55]} color="#8d8b88"/>
    {Array.from({length:8},(_,row)=>Array.from({length:11},(_,col)=><B key={row+'-'+col} at={[(col-5)*.99+(row%2)*.45,.35+row*.72,-3.59]} s={[.945,.04,.025]} color="#646761"/>))}
    <Window x={-2.85}/><Window x={2.85}/>
    <B at={[0,.03,-.65]} s={[2.9,.035,7.4]} color="#87232b"/>
    {Array.from({length:7},(_,i)=>Array.from({length:3},(_,j)=><B key={i+'-'+j} at={[(j-1)*.79,.068,-3.3+i*.95]} s={[.11,.015,.13]} color={C.gold}/>))}
    {[-3.9,3.9].map(x=><group key={x}><B at={[x,.66,1.45]} s={[1.3,.16,2.3]} color="#4c2e20"/><B at={[x,1.05,.55]} s={[1.3,.7,.17]} color="#433026"/></group>)}
    <B at={[0,.65,-2.2]} s={[3.9,1.3,1.16]} color="#dfdcd1"/>
    <B at={[0,1.32,-2.2]} s={[4.2,.16,1.32]} color="#f4f3eb"/>
    <B at={[0,2.40,-3.39]} s={[.13,1.4,.13]} color={C.gold}/>
    <B at={[0,2.58,-3.39]} s={[.7,.12,.14]} color={C.gold}/>
    <Goblet frame={frame} at={[-.75,1.44,-2.15]} scale={.45}/>
    <Human at={[-1.9,0,-.5]} robe="#f0eee8" frame={frame} angle={-.3} rightArm={-.25}/>
    <Human at={[1.3,0,-1]} robe="#12191c" frame={frame} angle={.32} rightArm={-.55}/>
  </>}
  {mode===2&&<>
    <B at={[0,.04,-1.8]} s={[8,.09,5]} color="#962c29"/>
    {Array.from({length:7},(_,i)=><B key={i} at={[-3+i*1,.095,-1.8]} s={[.06,.02,4.9]} color="#b99944"/>)}
    <Human at={[-2.1,.13,.4]} robe="#0e171c" frame={frame} rightArm={-.65}/>
    {Array.from({length:14},(_,i)=>{
      const x=(i%5-2)*.48, z=Math.floor(i/5)*.65-1.9, t=frame/9+i;
      return <group key={i} position={[x,.16,z]}>
        <mesh position={[0,.15+Math.sin(t)*.09,0]} rotation={[0,t*.06,Math.sin(t)*.11]}><coneGeometry args={[.14,.60+Math.sin(t)*.14,5]}/><meshStandardMaterial color={i%2?'#f6a43c':'#db5026'} emissive={i%2?'#ed7a1b':'#b53f18'} emissiveIntensity={.32}/></mesh>
      </group>;
    })}
  </>}
</group>;

const MiniChurch:React.FC<{frame:number}>=({frame})=><group rotation={[0,-.32+Math.sin(frame/65)*.15,0]} position={[0,-.2,0]}>
  <B at={[0,.32,0]} s={[4.3,.30,5.4]} color="#a7b1aa"/>
  <B at={[0,1.45,0]} s={[3.65,2.15,4.8]} color="#c3c8ba"/>
  <B at={[0,2.77,0]} s={[4.15,.45,5.23]} color="#72513b" rot={[0,0,.18]}/>
  <B at={[0,3.26,-1.62]} s={[1.1,3.65,1.25]} color="#d6d4c5"/>
  <B at={[0,5.28,-1.62]} s={[1.65,.32,1.55]} color="#74553d" rot={[0,0,.22]}/>
  <B at={[0,6.05,-1.62]} s={[.11,.9,.09]} color={C.gold}/><B at={[0,6.19,-1.62]} s={[.53,.10,.09]} color={C.gold}/>
  <B at={[0,1.15,2.46]} s={[.75,1.6,.07]} color="#9a6d38"/>
  {[-1.1,0,1.1].map(x=><B key={x} at={[x,1.6,-2.43]} s={[.35,1.04,.05]} color="#314b4e"/>)}
  <B at={[0,2.02,2.48]} s={[.08,.85,.06]} color={C.gold}/><B at={[0,2.16,2.5]} s={[.46,.08,.08]} color={C.gold}/>
</group>;

const Bread:React.FC<{frame:number;split?:boolean}>=({frame,split=false})=><group rotation={[.1,frame*.004,.15]}>
  <Sphere at={[-.79,0,0]} scale={[1.05,.43,.48]} c="#d3ab67"/>
  <Sphere at={[-.86,.16,-.018]} scale={[1.03,.32,.46]} c="#e7c591"/>
  {[0,1,2].map(i=><group key={i} position={[i*.39,0,0]}>
   <Cyl at={[.03,0,0]} r={.43} h={.22} c="#dbb984" segments={14} rot={[0,0,Math.PI/2]}/>
   <Cyl at={[.152,0,0]} r={.375} h={.035} c="#f5e5bb" segments={14} rot={[0,0,Math.PI/2]}/>
  </group>)}
  {split&&<Sphere at={[1.36+.15*Math.sin(frame/19),.17,0]} scale={[.35,.27,.3]} c="#d9b777"/>}
</group>;

const Book:React.FC<{frame:number}>=({frame})=><group position={[0,.05,0]} rotation={[-.32+Math.sin(frame/67)*.11,-.32+Math.sin(frame/79)*.22,-.22]}>
  <B at={[0,0,-.10]} s={[3.05,4.15,.46]} color="#ecebd8"/>
  <B at={[0,0,.16]} s={[3.15,4.25,.12]} color="#07545b" metal={.1}/>
  <B at={[0,0,.24]} s={[2.88,4.00,.038]} color="#e1b86e"/>
  <B at={[0,0,.27]} s={[2.73,3.85,.04]} color="#07545b"/>
  {[-1,1].map(s=><React.Fragment key={s}>
    <B at={[s*1.25,0,.29]} s={[.025,3.67,.018]} color="#d6b16a"/>
    <B at={[0,s*1.76,.29]} s={[2.48,.025,.018]} color="#d6b16a"/>
    <B at={[s*.94,s*1.46,.31]} s={[.35,.35,.026]} color="#d6b16a" rot={[0,0,Math.PI/4]}/>
  </React.Fragment>)}
  <mesh position={[0,0,.34]}><torusGeometry args={[.76,.050,8,10]}/><meshStandardMaterial color="#e7c27c" metalness={.36} roughness={.4}/></mesh>
  <mesh position={[0,0,.35]} rotation={[0,0,Math.PI/8]}><torusGeometry args={[.57,.033,8,8]}/><meshStandardMaterial color="#e7c27c" metalness={.4}/></mesh>
  <mesh position={[0,0,.35]}><ringGeometry args={[.27,.31,12]}/><meshStandardMaterial color="#e7c27c" side={2}/></mesh>
  {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <B key={i} at={[Math.sin(a)*1.0,Math.cos(a)*1.15,.35]} s={[.18,.085,.02]} rot={[0,0,-a]} color="#e7c27c"/>})}
</group>;

const SofaScene:React.FC<{frame:number}>=({frame})=><group>
  <B at={[0,-.2,0]} s={[14,.3,14]} color="#c0cdc2"/>
  <B at={[0,.49,-.75]} s={[4.4,1.42,.82]} color="#df9696"/>
  <B at={[0,.48,.45]} s={[4.4,.58,2.1]} color="#edaaa7"/>
  {[-2.06,2.06].map(x=><B key={x} at={[x,.75,0]} s={[.48,1.02,2.7]} color="#cc848b"/>)}
  <Human at={[.35,.70,.62]} frame={frame} robe="#eee9d6" rightArm={-.35-.36*between(frame%180,35,95)} leftArm={.32} scale={1.14}/>
  <Bread frame={frame}/>
</group>;

const Camera:React.FC<{frame:number;stage:number}>=({frame,stage})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
   const t=frame/30;const drift=Math.sin(frame/53)*.17;
   if(stage===0){camera.position.set(4.1+drift,3.8,7.4-t*.055);camera.lookAt(.0,1.55,-1.4);}
   else if(stage===1){camera.position.set(3.0+drift,2.9,5.6);camera.lookAt(.2,1.25,-1.1);}
   else if(stage===2){camera.position.set(3.5,2.9,6.3);camera.lookAt(0,.9,-1.1);}
   else if(stage===3){camera.position.set(3.4+drift,3.35,10.2);camera.lookAt(0,.8,-.4);}
   else if(stage===4){camera.position.set(2.25+drift,2.0,7.8);camera.lookAt(.0,.6,0);}
   else if(stage===5){camera.position.set(3.5+drift,2.6,13.4);camera.lookAt(0,.45,0);}
   else if(stage===6){camera.position.set(3.4+drift,3.1,7.6);camera.lookAt(0,1.15,0);}
   else {camera.position.set(2.7+drift,1.55,12.5);camera.lookAt(0,.15,0);}
   camera.updateProjectionMatrix();
 },[camera,frame,stage]);return null;
};

const Scene:React.FC<{frame:number;stage:number}>=({frame,stage})=>{
 const local=frame-(stage===0?0:stage===1?180:stage===2?330:stage===3?480:stage===4?600:stage===5?690:stage===6?990:1140);
 return <group>
  <color attach="background" args={[stage<3?'#777c69':stage===6?'#bfd0c7':C.teal]}/>
  <ambientLight intensity={1.42}/>
  <hemisphereLight args={['#f7ffff','#525f42',2.1]}/>
  <directionalLight position={[-3,9,7]} intensity={2.75} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
  <directionalLight position={[5,4,-4]} intensity={1} color="#f8e8c7"/>
  <Camera frame={frame} stage={stage}/>
  {stage===0&&<Church frame={frame} mode={0}/>}
  {stage===1&&<Church frame={frame} mode={1}/>}
  {stage===2&&<Church frame={frame} mode={2}/>}
  {stage===3&&<group scale={.67} position={[0,-1.25,0]}><MiniChurch frame={frame}/></group>}
  {stage===4&&<group position={[0,.1,0]} rotation={[.10,0,0]} scale={1.22}><Bread frame={frame}/></group>}
  {stage===5&&<group position={[0,.08,0]}>
     <group position={[-1.45,.18,0]} scale={1.1}><Bread frame={frame} split/></group>
     <Goblet frame={frame} at={[1.67,-.7,0]} scale={1.75} wine/>
     {local>235&&<mesh position={[1.67,1.25,0]}><sphereGeometry args={[.03,6,6]}/><meshStandardMaterial color="#fff6cd"/></mesh>}
  </group>}
  {stage===6&&<SofaScene frame={frame}/>}
  {stage===7&&<group position={[0,.18,0]} scale={1.05}><Book frame={frame}/></group>}
 </group>;
};

const stageFor=(f:number)=>f<180?0:f<330?1:f<480?2:f<600?3:f<690?4:f<990?5:f<1140?6:7;
export const BlockStory:React.FC=()=>{
 const frame=useCurrentFrame();const {width,height}=useVideoConfig();const stage=stageFor(frame);const second=frame/30;
 const text=segments.find(([start,end])=>second>=start&&second<end)?.[2]??'';
 const starts=[0,180,330,480,600,690,990,1140];
 const flash=Math.max(0,1-between(frame-starts[stage],0,8));
 return <AbsoluteFill style={{background:C.teal,overflow:'hidden'}}>
   <ThreeCanvas width={width} height={height} shadows camera={{position:[3.2,3.0,7.0],fov:35,near:.05,far:160}} gl={{antialias:true,preserveDrawingBuffer:true}}>
      <Scene frame={frame} stage={stage}/>
   </ThreeCanvas>
   <AbsoluteFill style={{background:'linear-gradient(180deg,transparent 72%,rgba(0,0,0,.22) 100%)',pointerEvents:'none'}}/>
   <div style={{position:'absolute',bottom:145,left:52,right:52,textAlign:'center',font:'bold 45px Georgia, serif',lineHeight:1.12,color:'#fff',WebkitTextStroke:'1.7px #141411',textShadow:'2px 3px 1px #000, -2px -2px 1px #000, 0 5px 3px #000'}}>
     {text}
   </div>
   <AbsoluteFill style={{background:'#d6dfd6',opacity:flash*.18,pointerEvents:'none'}}/>
 </AbsoluteFill>;
};