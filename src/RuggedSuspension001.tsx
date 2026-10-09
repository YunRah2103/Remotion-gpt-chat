import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {poseAt,heightAt,RADIUS,HALF_TRACK,HALF_WHEELBASE,SPEED,FRAMES,clamp,Corner} from './suspension/kinematics';

/** Entire original engineering scene. Dimensions are illustrative metres, +Y is up, -Z is forward. */
const INK='#071017', ORANGE='#fa8536', STEEL='#8c9da4', GRAPHITE='#252c33';
type V=[number,number,number];
const v=(x:number,y:number,z:number):V=>[x,y,z];
const fade=(t:number,a:number,b:number)=>clamp((t-a)/(b-a),0,1);
const lerp=(a:number,b:number,t:number)=>a+(b-a)*clamp(t,0,1);

/** Beams are rigid geometric links; orientation and length follow the joint endpoints. */
const Rod:React.FC<{a:V;b:V;r:number;color?:string;metal?:number}>=({a,b,r,color=STEEL,metal=.8})=>{
 const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b);
 const delta=q.clone().sub(p),len=delta.length();
 const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 const c=p.add(q).multiplyScalar(.5);
 return <mesh position={[c.x,c.y,c.z]} quaternion={[rotation.x,rotation.y,rotation.z,rotation.w]} castShadow>
  <cylinderGeometry args={[r,r,len,9,1]}/>
  <meshStandardMaterial color={color} metalness={metal} roughness={.35}/>
 </mesh>;
};
const Ring:React.FC<{pos:V;radius:number;color:string}>=({pos,radius,color})=>
 <mesh position={pos} rotation={[0,Math.PI/2,0]} castShadow>
  <torusGeometry args={[radius,.016,6,20]}/><meshStandardMaterial color={color} metalness={.65} roughness={.39}/>
 </mesh>;

/** A real 3D spring helix, rescaled between independently moving joint mounts. */
function coilGeometry(){
 const pts:THREE.Vector3[]=[];
 const turns=8,segments=112;
 for(let i=0;i<=segments;i++){
  const t=i/segments,theta=turns*2*Math.PI*t;
  pts.push(new THREE.Vector3(.103*Math.cos(theta),t-.5,.103*Math.sin(theta)));
 }
 return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),segments,.016,6,false);
}
const Coil:React.FC<{a:V;b:V}>=({a,b})=>{
 const mesh=useMemo(coilGeometry,[]);
 const pa=new THREE.Vector3(...a),pb=new THREE.Vector3(...b);
 const delta=pb.clone().sub(pa),length=delta.length();
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 const mid=pa.add(pb).multiplyScalar(.5);
 return <mesh geometry={mesh} castShadow position={[mid.x,mid.y,mid.z]}
  quaternion={[q.x,q.y,q.z,q.w]} scale={[1,length,1]}>
  <meshStandardMaterial color="#ff8f38" metalness={.8} roughness={.25}/>
 </mesh>;
};
const Hub:React.FC<{x:number;y:number;z:number;spin:number;side:number}>=({x,y,z,spin,side})=>{
 return <group position={[x,y,z]}>
  <mesh rotation={[0,0,Math.PI/2]} castShadow>
   <cylinderGeometry args={[.31,.31,.09,28]}/>
   <meshStandardMaterial color="#68747e" metalness={.87} roughness={.42}/>
  </mesh>
  <mesh rotation={[0,0,Math.PI/2]} position={[side*.11,0,0]}>
   <cylinderGeometry args={[.29,.29,.025,36]}/>
   <meshStandardMaterial color="#c1a68c" metalness={.84} roughness={.32}/>
  </mesh>
  <mesh position={[side*.18,.19,0.08]} castShadow>
   <boxGeometry args={[.085,.19,.12]}/>
   <meshStandardMaterial color={ORANGE} metalness={.6} roughness={.32}/>
  </mesh>
  <group rotation={[spin,0,0]}>
   <mesh rotation={[0,0,Math.PI/2]} castShadow>
    <cylinderGeometry args={[RADIUS,RADIUS,.34,40,1]}/>
    <meshStandardMaterial color="#171b1f" roughness={.96}/>
   </mesh>
   {[-1,1].map(s=><mesh key={s} position={[s*.173,0,0]} rotation={[0,Math.PI/2,0]} castShadow>
    <torusGeometry args={[.405,.061,8,40]}/>
    <meshStandardMaterial color="#101419" roughness={1}/>
   </mesh>)}
   {Array.from({length:24},(_,i)=>{
    const th=i*Math.PI/12;
    return [-1,1].map((s)=><mesh key={i+'-'+s} position={[s*.13,.475*Math.cos(th),.475*Math.sin(th)]}
     rotation={[th,0,s*.27]} castShadow>
      <boxGeometry args={[.175,.058,.12]}/>
      <meshStandardMaterial color="#292c2c" roughness={.96}/>
     </mesh>);
   })}
   <mesh position={[side*.19,0,0]} rotation={[0,0,Math.PI/2]} castShadow>
    <cylinderGeometry args={[.296,.296,.035,24]}/>
    <meshStandardMaterial color="#2f373e" metalness={.86} roughness={.24}/>
   </mesh>
   <mesh position={[side*.216,0,0]} rotation={[0,Math.PI/2,0]}>
    <torusGeometry args={[.24,.016,6,28]}/>
    <meshStandardMaterial color="#a7afb1" metalness={.94} roughness={.2}/>
   </mesh>
   {Array.from({length:8},(_,i)=>{
    const a=i*Math.PI/4;
    return <Rod key={i} a={[side*.217,.04*Math.cos(a),.04*Math.sin(a)]}
     b={[side*.217,.236*Math.cos(a+.1),.236*Math.sin(a+.1)]} r={.017} color="#bdc5c3"/>;
   })}
   <mesh position={[side*.245,0,0]} rotation={[0,0,Math.PI/2]}>
    <cylinderGeometry args={[.052,.052,.034,12]}/>
    <meshStandardMaterial color={ORANGE} metalness={.6} roughness={.28}/>
   </mesh>
  </group>
 </group>;
};
const SuspensionCorner:React.FC<{corner:Corner;hubY:number;spin:number;highlight:boolean}>=({corner,hubY,spin,highlight})=>{
 const side=corner.endsWith('L')?-1:1,z=corner.startsWith('F')?-HALF_WHEELBASE:HALF_WHEELBASE;
 const pivot=side*.62,outer=side*1.03,hubX=side*HALF_TRACK;
 const upperInnerA=v(pivot,.05,z-.33),upperInnerB=v(pivot,.05,z+.33);
 const lowerInnerA=v(pivot,-.42,z-.39),lowerInnerB=v(pivot,-.42,z+.39);
 const upperBall=v(outer,hubY+.22,z),lowerBall=v(outer,hubY-.23,z);
 const mount=v(side*.65,.26,z+.055),lowerDamper=v(side*.97,hubY-.15,z+.055);
 const coilUpper=v(side*.67,.20,z+.055),coilLower=v(side*.94,hubY-.075,z+.055);
 return <group>
  <Rod a={upperInnerA} b={upperBall} r={.053} color={highlight?ORANGE:'#89979d'}/>
  <Rod a={upperInnerB} b={upperBall} r={.053} color={highlight?ORANGE:'#89979d'}/>
  <Rod a={lowerInnerA} b={lowerBall} r={.069} color={highlight?'#c4d4d8':'#63717b'}/>
  <Rod a={lowerInnerB} b={lowerBall} r={.069} color={highlight?'#c4d4d8':'#63717b'}/>
  <Rod a={upperBall} b={lowerBall} r={.088} color="#39434b"/>
  <Rod a={v(side*.51,-.21,z+.19)} b={v(outer,hubY-.02,z+.13)} r={.03} color="#8c9699"/>
  <Rod a={mount} b={lowerDamper} r={.078} color="#525c68"/>
  <Rod a={coilUpper} b={coilLower} r={.026} color="#ddd3c4"/>
  <Coil a={coilUpper} b={coilLower}/>
  <Ring pos={upperBall} radius={.069} color={ORANGE}/>
  <Ring pos={lowerBall} radius={.071} color={ORANGE}/>
  <Hub x={hubX} y={hubY} z={z} spin={spin} side={side}/>
 </group>;
};
/** Longitudinal ring sections form triangulated sheet metal; not just boxed body panels. */
function bodyGeometry(cabin=false){
 const cuts=cabin?
 [{z:-1.22,w:.67,top:1.02,bottom:.39},{z:-.85,w:.83,top:1.13,bottom:.43},
  {z:1.1,w:.83,top:1.12,bottom:.43},{z:1.5,w:.68,top:.91,bottom:.37}]:
 [{z:-2.38,w:.84,top:.02,bottom:-.28},{z:-2.05,w:1.10,top:.25,bottom:-.3},
  {z:-1.2,w:1.13,top:.43,bottom:-.30},{z:1.25,w:1.13,top:.40,bottom:-.30},
  {z:2.06,w:1.07,top:.24,bottom:-.29},{z:2.33,w:.83,top:.05,bottom:-.25}];
 const rings=cuts.map(c=>{
 const {w,bottom,top,z}=c;
 return [[-w*.82,bottom,z],[w*.82,bottom,z],[w,bottom+.13,z],[w,top-.08,z],[w-.23,top,z],[-w+.23,top,z],[-w,top-.08,z],[-w,bottom+.13,z]] as V[];
 });
 const pts:number[]=[];
 const triangle=(a:V,b:V,c:V)=>pts.push(...a,...b,...c);
 for(let k=0;k<rings.length-1;k++){
  for(let j=0;j<8;j++){
   const n=(j+1)%8;
   triangle(rings[k][j],rings[k+1][j],rings[k+1][n]);
   triangle(rings[k][j],rings[k+1][n],rings[k][n]);
  }
 }
 for(let j=1;j<7;j++){
  triangle(rings[0][0],rings[0][j+1],rings[0][j]);
  const n=rings.length-1;
  triangle(rings[n][0],rings[n][j],rings[n][j+1]);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.computeVertexNormals();return g;
}
const Body:React.FC<{transparent:boolean}>=({transparent})=>{
 const chassis=useMemo(()=>bodyGeometry(),[]);
 const cabin=useMemo(()=>bodyGeometry(true),[]);
 return <group>
  <mesh geometry={chassis} castShadow receiveShadow>
   <meshPhysicalMaterial color={GRAPHITE} metalness={.67} roughness={.28} clearcoat={.88} clearcoatRoughness={.2}
    transparent={transparent} opacity={transparent?.18:1} side={THREE.DoubleSide}/>
  </mesh>
  <mesh geometry={cabin} castShadow>
   <meshPhysicalMaterial color="#303940" metalness={.5} roughness={.24} clearcoat={.9}
     transparent={transparent} opacity={transparent?.15:1} side={THREE.DoubleSide}/>
  </mesh>
  {[-1,1].map(side=><group key={side}>
   <mesh position={[side*.83,.73,-.14]} rotation={[0,0,side*.14]}>
    <boxGeometry args={[.045,.48,1.77]}/>
    <meshPhysicalMaterial color="#0d222b" metalness={.23} roughness={.16} transparent opacity={transparent?.13:.72}/>
   </mesh>
   <mesh position={[side*.96,.05,0]}>
    <boxGeometry args={[.087,.09,3.12]}/><meshStandardMaterial color={ORANGE} metalness={.65} roughness={.3}/>
   </mesh>
   <mesh position={[side*.95,-.30,-.0]} castShadow>
    <boxGeometry args={[.26,.12,2.8]}/><meshStandardMaterial color="#151b20" metalness={.45} roughness={.58}/>
   </mesh>
   <mesh position={[side*.8,1.21,0]} castShadow>
    <boxGeometry args={[.06,.09,2.0]}/><meshStandardMaterial color="#141b20" metalness={.7} roughness={.29}/>
   </mesh>
   <mesh position={[side*.72,.24,-2.36]}>
    <boxGeometry args={[.42,.10,.07]}/>
    <meshStandardMaterial color="#f0ebd6" emissive="#ffcf7a" emissiveIntensity={.9}/>
   </mesh>
   <mesh position={[side*.77,.14,2.34]}>
    <boxGeometry args={[.31,.11,.07]}/>
    <meshStandardMaterial color="#f94e39" emissive="#ff4030" emissiveIntensity={.7}/>
   </mesh>
   <mesh position={[side*.91,.75,-.87]}>
    <boxGeometry args={[.22,.11,.35]}/>
    <meshStandardMaterial color="#222c34" metalness={.65} roughness={.28}/>
   </mesh>
  </group>)}
  <mesh position={[0,.03,-2.375]} rotation={[0,0,0]}>
   <boxGeometry args={[1.23,.33,.08]}/>
   <meshStandardMaterial color="#0b1318" metalness={.46} roughness={.39}/>
  </mesh>
  {Array.from({length:8},(_,i)=><mesh key={i} position={[-.51+i*.145,.025,-2.431]}>
    <boxGeometry args={[.044,.24,.025]}/>
    <meshStandardMaterial color="#78848c" metalness={.78} roughness={.32}/>
   </mesh>)}
  <mesh position={[0,-.27,-2.4]} castShadow>
   <boxGeometry args={[1.96,.16,.2]}/>
   <meshStandardMaterial color="#171d22" metalness={.56} roughness={.5}/>
  </mesh>
  <mesh position={[0,-.17,2.45]} castShadow>
   <boxGeometry args={[1.88,.21,.18]}/>
   <meshStandardMaterial color="#161e23" metalness={.5} roughness={.45}/>
  </mesh>
  <mesh position={[0,-.47,0]} castShadow>
   <boxGeometry args={[1.08,.09,3.7]}/>
   <meshStandardMaterial color="#4c5960" metalness={.7} roughness={.48}/>
  </mesh>
  {[-1,1].map(side=><Rod key={side} a={[side*.54,-.44,-2]} b={[side*.54,-.44,2]} r={.075} color="#636f76"/>)}
 </group>;
};
const Vehicle:React.FC<{frame:number;cutaway:boolean}>=({frame,cutaway})=>{
 const pose=poseAt(frame);
 const roll=pose.roll,pitch=pose.pitch;
 return <group position={[0,pose.chassisY,pose.z]}>
  <group rotation={[pitch,0,roll]}>
   <Body transparent={cutaway}/>
   {(['FL','FR','RL','RR'] as Corner[]).map(c=>
    <SuspensionCorner key={c} corner={c} hubY={pose.wheels[c].localY} spin={pose.wheels[c].spin}
     highlight={cutaway||(c==='FR'&&frame>=120&&frame<270)}/>
   )}
  </group>
 </group>;
};
/** Terrain is tessellated real world-space geometry using the EXACT wheel-contact height function. */
function terrainGeometry(){
 const nX=68,nZ=150,w=30,z0=-62,z1=23;
 const verts:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let iz=0;iz<=nZ;iz++){
  const z=z0+(z1-z0)*iz/nZ;
  for(let ix=0;ix<=nX;ix++){
   const x=-w/2+w*ix/nX,h=heightAt(x,z);
   verts.push(x,h,z);
   const tint=clamp((h+.35)/1.2,0,1),variety=.08*Math.sin(ix*1.29+iz*.65);
   colors.push(.20+tint*.11+variety,.19+tint*.09+variety,.16+tint*.065+variety);
  }
 }
 for(let iz=0;iz<nZ;iz++)for(let ix=0;ix<nX;ix++){
  const a=iz*(nX+1)+ix,b=a+1,c=a+(nX+1),d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
 return g;
}
const Terrain:React.FC=()=>{
 const geom=useMemo(terrainGeometry,[]);
 return <group>
  <mesh geometry={geom} receiveShadow>
   <meshStandardMaterial vertexColors roughness={1} side={THREE.DoubleSide}/>
  </mesh>
  {Array.from({length:46},(_,i)=>{
   const x=(i%2===0?-1:1)*(2.55+(i*17%11)*.54);
   const z=19-(i*23%79);
   const size=.17+(i*7%9)*.085,rot=i*.77;
   return <mesh key={i} position={[x,heightAt(x,z)+size*.24,z]} rotation={[rot*.3,rot,rot*.16]} scale={[1.1,.49,.85]} castShadow receiveShadow>
    <icosahedronGeometry args={[size,1]}/><meshStandardMaterial color={i%5===0?'#817665':'#4e4d46'} roughness={.96}/>
   </mesh>;
  })}
  {Array.from({length:20},(_,i)=>{
   const x=(i%2===0?-1:1)*(4.2+(i*13%7)*1.19),z=18-(i*19%76);
   return <group key={i} position={[x,heightAt(x,z),z]}>
    <mesh position={[0,.42,0]} castShadow>
     <coneGeometry args={[.51,1.3,6]}/><meshStandardMaterial color="#354639" roughness={1}/>
    </mesh>
    <mesh position={[.08,.10,.10]}>
     <cylinderGeometry args={[.10,.16,.47,6]}/><meshStandardMaterial color="#453b2f" roughness={1}/>
    </mesh>
   </group>;
  })}
 </group>;
};
const CameraRig:React.FC<{frame:number}>=({frame})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const t=frame/30,pose=poseAt(frame),z=pose.z,cy=pose.chassisY;
  const shot=frame<120?0:frame<270?1:frame<420?2:frame<540?3:4;
  let eye:V,target:V;
  if(shot===0){
   eye=[lerp(5.0,3.7,frame/120),lerp(3.25,2.4,frame/120),z-7.8];
   target=[0,cy+.17,z-.12];
  } else if(shot===1){
   eye=[lerp(3.5,2.3,(frame-120)/150),lerp(1.55,.92,(frame-120)/150),z-2.18];
   target=[.92,cy-.44,z-1.50];
  } else if(shot===2){
   eye=[-5.0,lerp(2.0,1.6,(frame-270)/150),z+1.4];
   target=[0,cy-.18,z];
  } else if(shot===3){
   eye=[lerp(2.8,3.2,(frame-420)/120),lerp(.58,1.15,(frame-420)/120),z+2.6];
   target=[.55,cy-.54,z+.1];
  }else{
   eye=[lerp(3.5,5.7,(frame-540)/60),lerp(2.2,3.8,(frame-540)/60),z+lerp(6,10,(frame-540)/60)];
   target=[0,cy+.1,z-.9];
  }
  camera.position.set(...eye);camera.lookAt(...target);camera.updateProjectionMatrix();
 },[camera,frame]);
 return null;
};
const World:React.FC<{frame:number}>=({frame})=>{
 const stage=frame<120?0:frame<270?1:frame<420?2:frame<540?3:4;
 return <>
  <color attach="background" args={['#87989d']}/>
  <fog attach="fog" args={['#87989d',24,76]}/>
  <hemisphereLight args={['#cfe5fa','#514b40',1.35]}/>
  <ambientLight intensity={.38}/>
  <directionalLight position={[8,19,7]} intensity={3.0} color="#fff3db" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}
   shadow-camera-left={-17} shadow-camera-right={17} shadow-camera-top={17} shadow-camera-bottom={-17}/>
  <directionalLight position={[-9,5,-7]} intensity={.9} color="#d6e4ff"/>
  <CameraRig frame={frame}/>
  <Terrain/>
  <Vehicle frame={frame} cutaway={stage===3}/>
 </>;
};
const captions=[
 ['BUILT FOR THE UNPREDICTABLE','01 / RUGGED TERRAIN'],
 ['EACH WHEEL. ITS OWN TRAVEL.','02 / CONTROL ARMS + COILOVER'],
 ['OPPOSITE WHEELS. DIFFERENT LOADS.','03 / ARTICULATION'],
 ['LINKS ROTATE. SPRINGS RESPOND.','04 / UNDERBODY STUDY'],
 ['CONTROL, WITHOUT LOSING CONTACT.','05 / ENGINEERED TO MOVE']
];
export const RuggedSuspension001:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const stage=frame<120?0:frame<270?1:frame<420?2:frame<540?3:4;
 const starts=[0,120,270,420,540],ends=[120,270,420,540,600];
 const opacity=Math.min(fade(frame,starts[stage],starts[stage]+10),1-fade(frame,ends[stage]-10,ends[stage]));
 const [headline,eyebrow]=captions[stage];
 return <AbsoluteFill style={{background:INK,fontFamily:'Arial,Helvetica,sans-serif',color:'#f1f2ec'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:[5,3,-6],fov:38,near:.1,far:160}}
    gl={{antialias:true,preserveDrawingBuffer:true}}>
   <World frame={frame}/>
  </ThreeCanvas>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(5,10,14,.64) 0%,transparent 27%,transparent 58%,rgba(5,10,14,.70) 100%)',pointerEvents:'none'}}/>
  <div style={{position:'absolute',left:64,right:64,top:88,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
   <div style={{fontSize:22,fontWeight:800,letterSpacing:6}}>AE / 001</div>
   <div style={{fontSize:18,fontWeight:700,letterSpacing:3,color:'#f4ad75'}}>SUSPENSION LAB</div>
  </div>
  <div style={{position:'absolute',top:148,left:64,right:64,opacity,display:'flex',alignItems:'center',gap:16}}>
   <div style={{height:3,width:52,background:ORANGE}}/>
   <div style={{fontSize:20,letterSpacing:4,fontWeight:700}}>{eyebrow}</div>
  </div>
  <div style={{position:'absolute',bottom:218,left:64,right:64,opacity,transform:'translateY('+((1-opacity)*15)+'px)'}}>
   <div style={{fontSize:stage===2?60:stage===4?68:65,fontWeight:900,letterSpacing:-1.9,lineHeight:1.07,textShadow:'0 7px 24px #101010b5'}}>
    {headline}
   </div>
   <div style={{height:4,width:120,background:ORANGE,marginTop:25}}/>
  </div>
  <div style={{position:'absolute',bottom:85,left:64,right:64,display:'flex',justifyContent:'space-between',borderTop:'1px solid #f1f1ee66',paddingTop:19,fontSize:18,letterSpacing:3,fontWeight:700}}>
   <span>4-WHEEL INDEPENDENT / 3D</span><span>{String(Math.floor(frame/30)).padStart(2,'0')} / 20</span>
  </div>
  <AbsoluteFill style={{background:INK,pointerEvents:'none',opacity:1-fade(frame,0,10)}}/>
  <AbsoluteFill style={{background:INK,pointerEvents:'none',opacity:fade(frame,591,599)}}/>
 </AbsoluteFill>;
};
