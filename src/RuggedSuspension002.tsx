import React,{useLayoutEffect,useMemo} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree,useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {AbsoluteFill,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FRAMES,FPS,RADIUS,CORNERS,Corner,heightAt,zAt,BOULDERS,RUTS,clamp} from './suspension/polish02/terrain';
import {poseAt,solveFourBar,upperChassis,lowerChassis,distance,Vec,Pose} from './suspension/polish02/motion';
const CITRUS='#f68b39', STEEL='#aeb9b8';
const lerp=(a:number,b:number,t:number)=>a+(b-a)*clamp(t,0,1);
const on=(f:number,a:number,b:number)=>clamp((f-a)/(b-a),0,1);
const p=(a:THREE.Vector3):Vec=>[a.x,a.y,a.z];
/** A rod's cylinder is evaluated from actual endpoints; no visual stretching independent of joint motion. */
const Link:React.FC<{a:Vec;b:Vec;radius:number;color:string;metal?:number}>=({a,b,radius,color,metal=.71})=>{
 const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b),delta=v2.clone().sub(v1);
 const center=v1.add(v2).multiplyScalar(.5);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
 return <mesh position={p(center)} quaternion={[q.x,q.y,q.z,q.w]} castShadow receiveShadow>
  <cylinderGeometry args={[radius,radius,delta.length(),11]}/>
  <meshStandardMaterial color={color} metalness={metal} roughness={.31}/>
 </mesh>;
};
const Joint:React.FC<{pos:Vec;r?:number;color?:string}>=({pos,r=.064,color='#d0d7d3'})=>
 <mesh position={pos} castShadow><sphereGeometry args={[r,12,9]}/>
  <meshStandardMaterial color={color} metalness={.78} roughness={.28}/></mesh>;
function springShape(){
 const vertices:THREE.Vector3[]=[];const loops=11,segments=180;
 for(let k=0;k<=segments;k++){
  const t=k/segments,a=loops*2*Math.PI*t;
  vertices.push(new THREE.Vector3(.112*Math.cos(a),t-.5,.112*Math.sin(a)));
 }
 return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vertices),segments,.018,6,false);
}
const Coil:React.FC<{a:Vec;b:Vec}>=({a,b})=>{
 const geom=useMemo(springShape,[]),A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);
 const c=A.add(B).multiplyScalar(.5);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
 return <group position={p(c)} quaternion={[q.x,q.y,q.z,q.w]}>
  <mesh geometry={geom} scale={[1,d.length(),1]} castShadow>
   <meshStandardMaterial color={CITRUS} metalness={.75} roughness={.26}/>
  </mesh>
  {[-1,1].map(sign=><mesh key={sign} position={[0,sign*(d.length()/2),0]} rotation={[0,0,Math.PI/2]}>
   <cylinderGeometry args={[.18,.18,.027,16]}/>
   <meshStandardMaterial color="#353e43" metalness={.77} roughness={.32}/>
  </mesh>)}
 </group>;
};
const Damper:React.FC<{top:Vec;bottom:Vec}>=({top,bottom})=>{
 const a=new THREE.Vector3(...top),b=new THREE.Vector3(...bottom);
 const q=b.clone().sub(a).normalize(),len=a.distanceTo(b);
 const mid=a.clone().add(b).multiplyScalar(.5);
 const center1=mid.clone().addScaledVector(q,len*.19),center2=mid.clone().addScaledVector(q,-len*.19);
 const axis=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),q);
 return <group>
  <mesh position={p(center1)} quaternion={[axis.x,axis.y,axis.z,axis.w]} castShadow>
   <cylinderGeometry args={[.063,.07,len*.62,15]}/>
   <meshStandardMaterial color="#252e35" metalness={.65} roughness={.36}/>
  </mesh>
  <mesh position={p(center2)} quaternion={[axis.x,axis.y,axis.z,axis.w]} castShadow>
   <cylinderGeometry args={[.029,.029,len*.62,12]}/>
   <meshStandardMaterial color="#c8d1cf" metalness={.9} roughness={.17}/>
  </mesh>
  <Joint pos={top} r={.073} color="#46535b"/><Joint pos={bottom} r={.072} color="#56636d"/>
 </group>;
};
const RotatingWheel:React.FC<{centre:Vec;side:number;spin:number}>=({centre,side,spin})=>{
 return <group position={centre}>
  <mesh rotation={[0,0,Math.PI/2]} castShadow>
   <cylinderGeometry args={[.352,.352,.070,40]}/>
   <meshStandardMaterial color="#3d464f" metalness={.82} roughness={.31}/>
  </mesh>
  <mesh position={[side*.08,0,0]} rotation={[0,0,Math.PI/2]}>
   <cylinderGeometry args={[.327,.327,.045,48]}/>
   <meshStandardMaterial color="#a2abb1" metalness={.94} roughness={.3}/>
  </mesh>
  {/* Caliper is attached to knuckle: it must not rotate with the tyre. */}
  <group position={[side*.135,.245,.04]} rotation={[0,0,-.16]}>
   <mesh castShadow><boxGeometry args={[.13,.17,.24]}/>
    <meshStandardMaterial color={CITRUS} metalness={.66} roughness={.28}/>
   </mesh>
   <mesh position={[side*.07,0,.02]}>
    <boxGeometry args={[.04,.10,.16]}/>
    <meshStandardMaterial color="#191f23" roughness={.48}/>
   </mesh>
  </group>
  <group rotation={[spin,0,0]}>
   <mesh rotation={[0,0,Math.PI/2]} castShadow receiveShadow>
    <cylinderGeometry args={[RADIUS,RADIUS,.36,48]}/>
    <meshStandardMaterial color="#151919" metalness={.04} roughness={.98}/>
   </mesh>
   {/* Off-road tyre has shoulder beads, sidewall ridges and staggered 3D lugs. */}
   {[-.183,.183].map((x,i)=><mesh key={i} position={[x,0,0]} rotation={[0,Math.PI/2,0]} castShadow>
    <torusGeometry args={[.425,.067,9,56]}/>
    <meshStandardMaterial color="#1d2324" roughness={.97}/>
   </mesh>)}
   {Array.from({length:32},(_,i)=>{
    const a=(i+.14)*Math.PI/16;
    return [-1,0,1].map((track)=>{
     const sh=(i%2)*.038,rad=.503;
     return <mesh key={i+'-'+track} position={[track*.119+sh,rad*Math.sin(a),rad*Math.cos(a)]}
      rotation={[a,0,track*.13]} castShadow>
      <boxGeometry args={[track===0?.12:.14,.079,track===0?.18:.14]}/>
      <meshStandardMaterial color={i%3===0?'#282b2b':'#333637'} roughness={.94}/>
     </mesh>;
    });
   })}
   {[-1,1].map((s)=><mesh key={s} position={[s*.192,0,0]} rotation={[0,0,Math.PI/2]}>
    <cylinderGeometry args={[.31,.31,.031,42]}/>
    <meshStandardMaterial color="#232a2e" metalness={.70} roughness={.36}/>
   </mesh>)}
   {[-1,1].map((s)=>Array.from({length:8},(_,i)=>{
    const a=i*Math.PI/4;
    return <Link key={s+'_'+i} a={[s*.214,.088*Math.cos(a),.088*Math.sin(a)]}
     b={[s*.214,.285*Math.cos(a+.095),.285*Math.sin(a+.095)]} radius={.031} color="#a0abad"/>;
   }))}
   <mesh position={[side*.233,0,0]} rotation={[0,0,Math.PI/2]}>
    <cylinderGeometry args={[.068,.068,.043,16]}/>
    <meshStandardMaterial color={CITRUS} metalness={.75} roughness={.28}/>
   </mesh>
   {Array.from({length:6},(_,i)=>{
    const a=i*Math.PI/3;
    return <mesh key={i} position={[side*.251,.047*Math.cos(a),.047*Math.sin(a)]}>
     <sphereGeometry args={[.013,7,6]}/>
     <meshStandardMaterial color="#d7d8cf" metalness={.85} roughness={.3}/>
    </mesh>;
   })}
  </group>
 </group>;
};
const CornerAssembly:React.FC<{corner:Corner;pose:Pose;cutaway:boolean}>=({corner,pose,cutaway})=>{
 const c=pose.wheels[corner],l=c.link,s=corner.endsWith('L')?-1:1;
 const z=corner.startsWith('F')?-1.76:1.76;
 const upper=upperChassis(s,z),lower=lowerChassis(s,z);
 // Two longitudinal chassis mounts to outer ball: physically joined A-frame.
 const upperA:Vec=[upper[0],upper[1],z-.36],upperB:Vec=[upper[0],upper[1],z+.36];
 const lowerA:Vec=[lower[0],lower[1],z-.39],lowerB:Vec=[lower[0],lower[1],z+.39];
 return <group>
  {[upperA,upperB].map((a,i)=><Link key={'u'+i} a={a} b={l.upper} radius={.049}
   color={cutaway?'#ffd9a8':'#939b9e'}/>)}
  {[lowerA,lowerB].map((a,i)=><Link key={'l'+i} a={a} b={l.lower} radius={.068}
   color="#73818a"/>)}
  <Link a={upperA} b={upperB} radius={.045} color="#52616a"/>
  <Link a={lowerA} b={lowerB} radius={.058} color="#556269"/>
  <Link a={l.upper} b={l.lower} radius={.102} color="#383f48"/>
  <Link a={[s*.32,-.20,z+.19]} b={[l.hub[0],l.hub[1]+.07,z+.17]} radius={.032} color="#aab5b4"/>
  <Damper top={l.damperTop} bottom={l.damperBottom}/>
  <Coil a={l.springTop} b={l.springBottom}/>
  {[l.upper,l.lower].map((v,i)=><Joint key={i} pos={v} r={.08} color={i===0?CITRUS:'#bdc4c1'}/>)}
  <RotatingWheel centre={l.hub} side={s} spin={c.spin}/>
 </group>;
};
const BlenderSUV:React.FC<{cutaway:boolean}>=({cutaway})=>{
 const gltf=useLoader(GLTFLoader,staticFile('mechanics/rugged-suv-body-002.glb'));
 const model=useMemo(()=>{
  const copy=gltf.scene.clone(true);
  copy.traverse(obj=>{
   if(obj instanceof THREE.Mesh){
    obj.castShadow=true;obj.receiveShadow=true;
    const old=obj.material;
    if(old instanceof THREE.Material){
     const m=old.clone();
     if(cutaway && /CERAMIC GRAPHITE|GREENHOUSE|FENDER GRAPHITE|ROOF COMPOSITE/.test(m.name)){
      (m as THREE.MeshStandardMaterial).transparent=true;
      (m as THREE.MeshStandardMaterial).opacity=.14;
      m.depthWrite=false;
     }
     obj.material=m;
    }
   }
  });
  return copy;
 },[gltf.scene,cutaway]);
 return <primitive object={model}/>;
};
const Vehicle:React.FC<{frame:number;cutaway:boolean}>=({frame,cutaway})=>{
 const pose=poseAt(frame);
 return <group position={[0,pose.y,pose.z]}>
  <group rotation={[pose.pitch,0,pose.roll]}>
   <BlenderSUV cutaway={cutaway}/>
   {CORNERS.map(c=><CornerAssembly key={c} corner={c} pose={pose} cutaway={cutaway}/>)}
  </group>
 </group>;
};
function buildTerrain(){
 const nx=88,nz=254,xmin=-14,xmax=14,zmin=-57,zmax=18;
 const xyz:number[]=[],colors:number[]=[],idx:number[]=[];
 for(let iz=0;iz<=nz;iz++){
  const z=zmin+(zmax-zmin)*iz/nz;
  for(let ix=0;ix<=nx;ix++){
   const x=xmin+(xmax-xmin)*ix/nx,h=heightAt(x,z);
   xyz.push(x,h,z);
   const rough=.08*Math.sin(ix*.71+iz*.3)+.04*Math.cos(ix*.27-iz*2.4);
   let red=.23+rough+.10*Math.max(0,h),green=.225+rough*.78+.08*Math.max(0,h),blue=.208+rough*.56;
   for(const c of BOULDERS){
    const r=((x-c.x)/c.rx)**2+((z-c.z)/c.rz)**2;
    if(r<1.7){const a=clamp((1.7-r)/.55,0,1);red=lerp(red,.34+rough*.5,a);green=lerp(green,.33+rough*.45,a);blue=lerp(blue,.31+rough*.35,a);}
   }
   colors.push(red,green,blue);
  }
 }
 for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
  const a=iz*(nx+1)+ix,b=a+1,c=a+nx+1,d=c+1;
  idx.push(a,c,b,b,c,d);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 g.setIndex(idx);g.computeVertexNormals();
 return g;
}
const Terrain:React.FC=()=>{
 const geom=useMemo(buildTerrain,[]);
 return <>
  <mesh geometry={geom} receiveShadow castShadow>
   <meshStandardMaterial vertexColors roughness={.99} side={THREE.DoubleSide}/>
  </mesh>
  {/* Rock scatter avoids rolling footprints; centre-track features are actual heightfield. */}
  {Array.from({length:115},(_,i)=>{
   const side=i%2===0?-1:1,dist=2.55+(i*17%24)*.19;
   const z=17-(i*37%74),x=side*dist;
   const size=.11+(i*11%12)*.065;
   return <mesh key={i} position={[x,heightAt(x,z)+size*.21,z]}
    rotation={[i*.40,i*.67,i*.33]} scale={[1.25,.63,.87]} castShadow>
    <icosahedronGeometry args={[size,i%4===0?1:0]}/>
    <meshStandardMaterial color={i%5===0?'#8e8070':'#665f56'} roughness={.98}/>
   </mesh>;
  })}
  {Array.from({length:40},(_,i)=>{
   const s=i%2===0?-1:1,x=s*(4+(i*11%12)*.56),z=12-(i*17%74);
   return <group key={i} position={[x,heightAt(x,z),z]} scale={[.55+(i%5)*.16,.55+(i%5)*.16,.55+(i%5)*.16]}>
    <mesh position={[0,.36,0]} castShadow>
     <icosahedronGeometry args={[.58,1]}/>
     <meshStandardMaterial color={i%4===0?'#536653':'#43543e'} roughness={1}/>
    </mesh>
    <mesh position={[.32,.25,.18]} castShadow>
     <icosahedronGeometry args={[.43,1]}/>
     <meshStandardMaterial color="#40543e" roughness={1}/>
    </mesh>
    <mesh position={[0,.10,0]}><cylinderGeometry args={[.13,.16,.39,6]}/>
     <meshStandardMaterial color="#484239" roughness={1}/></mesh>
   </group>;
  })}
  {/* Distant cliffs layered behind the track, not a smooth dune. */}
  {Array.from({length:16},(_,i)=>{
   const x=(i%2?1:-1)*(9.5+(i*13%8)*.8),z=10-(i*11%65);
   return <mesh key={i} position={[x,heightAt(x,z)+1.6,z]}
    scale={[1.5+(i%3),2.6+(i%5)*.55,2+(i%4)]}
    rotation={[.04*i,.3*i,.07*i]}>
    <dodecahedronGeometry args={[1,0]}/>
    <meshStandardMaterial color={i%2===0?'#656960':'#73746a'} roughness={.99}/>
   </mesh>;
  })}
 </>;
};
const Camera:React.FC<{frame:number}>=({frame})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  const pose=poseAt(frame),z=pose.z,y=pose.y;
  const stage=frame<120?0:frame<270?1:frame<420?2:frame<540?3:4;
  let eye:Vec,target:Vec;
  if(stage===0){
   const t=(frame)/120;
   eye=[lerp(-7.5,-6.1,t),lerp(3.25,2.75,t),z-lerp(10.5,9.2,t)];
   target=[-.05,y+.04,z-.20];
  } else if(stage===1){
   const t=(frame-120)/150;
   eye=[lerp(-4.65,-3.3,t),lerp(1.7,1.4,t),z-lerp(3.9,2.7,t)];
   target=[-1.03,y-.56,z-1.72];
  } else if(stage===2){
   const t=(frame-270)/150;
   eye=[lerp(-7.0,-5.55,t),lerp(3.0,2.10,t),z-lerp(7.4,5.2,t)];
   target=[0,y-.08,z-.4];
  }else if(stage===3){
   const t=(frame-420)/120;
   eye=[lerp(-4.25,-3.8,t),lerp(.88,1.35,t),z+lerp(3.6,2.8,t)];
   target=[-.56,y-.59,z+.12];
  }else{
   const t=(frame-540)/60;
   eye=[lerp(7.3,8.1,t),lerp(3.0,3.65,t),z+lerp(10,11.3,t)];
   target=[0,y+.14,z-1.0];
  }
  camera.position.set(...eye);camera.lookAt(...target);
  camera.updateProjectionMatrix();
 },[camera,frame]);
 return null;
};
const Scene:React.FC<{frame:number}>=({frame})=>{
 const stage=frame<120?0:frame<270?1:frame<420?2:frame<540?3:4;
 return <>
  <color attach="background" args={['#73858b']}/>
  <fog attach="fog" args={['#73858b',24,81]}/>
  <hemisphereLight args={['#e9f0e8','#5a5c52',1.7]}/>
  <ambientLight intensity={.46}/>
  <directionalLight position={[-9,18,-9]} intensity={3.6} color="#ffe9cf" castShadow
    shadow-mapSize-width={2048} shadow-mapSize-height={2048}
    shadow-camera-left={-18} shadow-camera-right={18}
    shadow-camera-top={18} shadow-camera-bottom={-18}
    shadow-bias={-.00024}/>
  <directionalLight position={[9,6,5]} color="#c7e2f4" intensity={1.2}/>
  <Camera frame={frame}/>
  <Terrain/>
  <Vehicle frame={frame} cutaway={stage===1||stage===3}/>
 </>;
};
const TEXTS=[
 {small:'01 / ROCK TRAIL',large:'BUILT FOR THE ROUGH.'},
 {small:'02 / FRONT LEFT UNDER LOAD',large:'EVERY JOINT MOVES.'},
 {small:'03 / OPPOSING WHEEL TRAVEL',large:'THE TERRAIN IS NEVER EVEN.'},
 {small:'04 / FOUR-BAR KINEMATICS',large:'LINKED. NOT FAKED.'},
 {small:'05 / COMPOSED UNDER PRESSURE',large:'CONTROL IN MOTION.'}
];
export const RuggedSuspension002:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const stage=frame<120?0:frame<270?1:frame<420?2:frame<540?3:4;
 const starts=[0,120,270,420,540],ends=[120,270,420,540,600];
 const opacity=Math.min(on(frame,starts[stage],starts[stage]+12),1-on(frame,ends[stage]-12,ends[stage]));
 const title=TEXTS[stage];
 return <AbsoluteFill style={{background:'#081015',color:'#f1f2ed',fontFamily:'Arial,Helvetica,sans-serif',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} shadows
    camera={{position:[-7.5,3.25,-11],fov:44,near:.12,far:155}}
    gl={{antialias:true,preserveDrawingBuffer:true}}>
    <Scene frame={frame}/>
  </ThreeCanvas>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(4,11,17,.68),transparent 28%,transparent 61%,rgba(4,11,17,.80))',pointerEvents:'none'}}/>
  <div style={{position:'absolute',top:82,left:65,right:65,display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:20,letterSpacing:5}}>
   <span>AE / 001</span><span style={{color:'#f5ab77'}}>SUSPENSION LAB</span>
  </div>
  <div style={{position:'absolute',top:152,left:65,right:65,display:'flex',alignItems:'center',gap:17,opacity}}>
   <div style={{width:50,height:3,background:CITRUS}}/>
   <div style={{fontSize:20,fontWeight:700,letterSpacing:4}}>{title.small}</div>
  </div>
  <div style={{position:'absolute',left:65,right:65,bottom:211,opacity}}>
   <div style={{fontSize:stage===2?61:70,lineHeight:1.03,letterSpacing:-2,fontWeight:900,textShadow:'0 8px 22px #050a0dda'}}>{title.large}</div>
   <div style={{width:112,height:4,background:CITRUS,marginTop:22}}/>
  </div>
  <div style={{position:'absolute',left:65,right:65,bottom:80,borderTop:'1px solid #f3f4f166',paddingTop:20,
    display:'flex',justifyContent:'space-between',fontSize:18,fontWeight:700,letterSpacing:3}}>
   <span>DOUBLE WISHBONE / 4 CORNERS</span><span>{String(Math.floor(frame/30)).padStart(2,'0')} / 20</span>
  </div>
  <AbsoluteFill style={{background:'#081015',opacity:1-on(frame,0,9),pointerEvents:'none'}}/>
  <AbsoluteFill style={{background:'#081015',opacity:on(frame,591,599),pointerEvents:'none'}}/>
 </AbsoluteFill>;
};
