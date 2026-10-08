import React,{useLayoutEffect,useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';

/**
 * V2 quality gate: first 15 seconds ONLY.
 * A true 3D, anatomically proportioned procedural humanoid + particle field,
 * then a rotating three-dimensional Earth.
 * This is NOT the final 90-second film. No prior-film SVG figures are reused.
 */
const W=1080,H=1920;
const BLUE='#8ac5d9',MIST='#657984';
const ease=(v:number)=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x);};
const lerp=(a:number,b:number,u:number)=>a+(b-a)*u;
const hash=(i:number)=>{let x=Math.sin(i*93.3245+14.234)*135729.12;return x-Math.floor(x);};
const between=(t:number,a:number,b:number,r=.5)=>Math.min(ease((t-a)/r),ease((b-t)/r));
const style={fontFamily:'Arial,Helvetica,sans-serif',color:'#edf3f4'} as const;

const rimShader=()=>new THREE.ShaderMaterial({
  vertexShader: `
  varying vec3 vNormal;varying vec3 vEye;varying vec3 vView;
  void main(){
    vec4 viewPos=modelViewMatrix*vec4(position,1.0);
    vNormal=normalize(normalMatrix*normal);
    vEye=normalize(-viewPos.xyz);
    vView=viewPos.xyz;
    gl_Position=projectionMatrix*viewPos;
  }`,
  fragmentShader: `
  varying vec3 vNormal;varying vec3 vEye;varying vec3 vView;
  void main(){
    vec3 N=normalize(vNormal);vec3 V=normalize(vEye);
    float edge=pow(1.0-abs(dot(N,V)),2.25);
    float side=max(dot(N,normalize(vec3(0.7,0.35,0.85))),0.0);
    float left=max(dot(N,normalize(vec3(-0.6,0.0,0.2))),0.0);
    float surface=0.013+side*0.027+left*0.013;
    vec3 inner=vec3(surface*.80,surface*1.15,surface*1.50);
    vec3 rim=vec3(.12,.30,.42)*edge*0.92;
    gl_FragColor=vec4(inner+rim,0.97);
  }`,
  transparent:false,depthTest:true,depthWrite:true,side:THREE.FrontSide,
});
type Ring={y:number;rx:number;rz:number;z?:number};
const loft=(rings:Ring[],segments=48)=>{
 const pos:number[]=[];const indices:number[]=[];
 rings.forEach(r=>{for(let j=0;j<segments;j++){
  const a=j/segments*Math.PI*2; pos.push(Math.cos(a)*r.rx,r.y,Math.sin(a)*r.rz+(r.z||0));
 }});
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){
  const next=(j+1)%segments,a=i*segments+j,b=i*segments+next,c=(i+1)*segments+j,d=(i+1)*segments+next;
  indices.push(a,b,c,b,d,c);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setIndex(indices);g.computeVertexNormals();return g;
};
const shaft=(from:THREE.Vector3,to:THREE.Vector3,a:number,b:number)=>{
 const d=to.clone().sub(from),len=d.length();
 const geom=new THREE.CylinderGeometry(a,b,len,28,6);
 const mid=from.clone().add(to).multiplyScalar(.5);
 return {geom,mid,rot:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())};
};
const Component:React.FC<{geom:THREE.BufferGeometry;mat:THREE.Material;pos?:[number,number,number];scale?:[number,number,number];rot?:[number,number,number];qua?:THREE.Quaternion}>=({geom,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],qua})=>
 <mesh geometry={geom} material={mat} position={pos} scale={scale} rotation={qua?undefined:rot} quaternion={qua}/>;
const Ellipse:React.FC<{mat:THREE.Material;pos:[number,number,number];size:[number,number,number];rotation?:[number,number,number];geom:THREE.SphereGeometry}>=({mat,pos,size,rotation,geom})=>
 <Component geom={geom} mat={mat} pos={pos} scale={size} rot={rotation}/>;

const AnatomicalHuman=({frame}:{frame:number})=>{
 const mat=useMemo(rimShader,[]);
 const ball=useMemo(()=>new THREE.SphereGeometry(1,32,24),[]);
 const torso=useMemo(()=>loft([
  {y:-.65,rx:.255,rz:.205,z:0},{y:-.53,rx:.35,rz:.22,z:0},
  {y:-.38,rx:.355,rz:.24,z:0},{y:-.11,rx:.285,rz:.205,z:.00},
  {y:.15,rx:.30,rz:.215,z:0},{y:.41,rx:.355,rz:.245,z:0},
  {y:.72,rx:.432,rz:.283,z:.015},{y:1.00,rx:.525,rz:.292,z:0},
  {y:1.21,rx:.51,rz:.252,z:0},{y:1.39,rx:.40,rz:.20,z:0},
  {y:1.48,rx:.16,rz:.12,z:0}
 ]),[]);
 const neck=useMemo(()=>loft([
  {y:1.40,rx:.12,rz:.11},{y:1.52,rx:.13,rz:.12},
  {y:1.72,rx:.137,rz:.127},{y:1.78,rx:.17,rz:.16}
 ]),[]);
 const meshParts:React.ReactNode[]=[];
 const seg=(label:string,start:number[],end:number[],r1:number,r2:number)=>{
  const sh=shaft(new THREE.Vector3(start[0],start[1],start[2]),new THREE.Vector3(end[0],end[1],end[2]),r2,r1);
  meshParts.push(<Component key={label} geom={sh.geom} mat={mat} pos={sh.mid.toArray() as [number,number,number]} qua={sh.rot}/>);
 };
 [-1,1].forEach(side=>{
  const sx=(v:number)=>v*side;
  // Scapula, upper arm, forearm, joint, palm and individual fingers.
  meshParts.push(<Ellipse key={'deltoid'+side} geom={ball} mat={mat} pos={[sx(.52),1.22,-.02]} size={[.212,.28,.225]}/>);
  seg('upper'+side,[sx(.57),1.15,0],[sx(.655),.42,.025],.182,.13);
  meshParts.push(<Ellipse key={'elbow'+side} geom={ball} mat={mat} pos={[sx(.655),.39,.028]} size={[.126,.134,.119]}/>);
  seg('lower'+side,[sx(.666),.36,.055],[sx(.67),-.27,.12],.128,.085);
  meshParts.push(<Ellipse key={'wrist'+side} geom={ball} mat={mat} pos={[sx(.67),-.26,.12]} size={[.08,.092,.072]}/>);
  meshParts.push(<Ellipse key={'palm'+side} geom={ball} mat={mat} pos={[sx(.677),-.415,.145]} size={[.112,.19,.075]} rotation={[.12,0,side*.16]}/>);
  for(let f=0;f<4;f++){
   seg('finger'+side+f,[sx(.602+f*.048),-.49,.17],[sx(.60+f*.052),-.72+Math.abs(f-1.5)*.03,.17],.023,.012);
  }
  seg('thumb'+side,[sx(.574),-.35,.20],[sx(.53),-.51,.235],.04,.018);
  // Anatomical glutes + separate thighs, kneecaps, shins and feet.
  meshParts.push(<Ellipse key={'hip'+side} geom={ball} mat={mat} pos={[sx(.183),-.59,0]} size={[.205,.22,.24]}/>);
  seg('thigh'+side,[sx(.205),-.69,0],[sx(.213),-1.45,.035],.201,.119);
  meshParts.push(<Ellipse key={'kneecap'+side} geom={ball} mat={mat} pos={[sx(.215),-1.44,.10]} size={[.135,.14,.105]}/>);
  seg('calf'+side,[sx(.22),-1.47,0],[sx(.20),-2.22,.075],.138,.074);
  meshParts.push(<Ellipse key={'ankle'+side} geom={ball} mat={mat} pos={[sx(.2),-2.23,.085]} size={[.075,.13,.083]}/>);
  meshParts.push(<Ellipse key={'foot'+side} geom={ball} mat={mat} pos={[sx(.20),-2.34,.255]} size={[.142,.095,.31]}/>);
  for(let toe=0;toe<5;toe++)meshParts.push(<Ellipse key={'toe'+side+toe} geom={ball} mat={mat}
   pos={[sx(.10+toe*.048),-2.37,.515-(toe>2?.035:0)]} size={[.032,.029,.052]}/>);
  // Pectoral shape, obliques, clavicle and understated anatomy.
  meshParts.push(<Ellipse key={'pec'+side} geom={ball} mat={mat} pos={[sx(.238),1.03,.238]} size={[.272,.155,.085]} rotation={[.11,0,side*.16]}/>);
 });
 return <group scale={.76} position={[0,-.02,0]} rotation={[0,lerp(-.44,-1.45,ease(frame/290)),0]}>
  <Component geom={torso} mat={mat}/>
  <Component geom={neck} mat={mat}/>
  <Ellipse geom={ball} mat={mat} pos={[0,2.025,0]} size={[.25,.328,.237]}/>
  <Ellipse geom={ball} mat={mat} pos={[0,1.775,.088]} size={[.211,.18,.194]}/>
  <Ellipse geom={ball} mat={mat} pos={[0,1.95,.229]} size={[.08,.089,.11]}/>
  <Ellipse geom={ball} mat={mat} pos={[0,2.09,.184]} size={[.20,.085,.095]}/>
  {[-1,1].map(side=><React.Fragment key={side}>
   <Ellipse geom={ball} mat={mat} pos={[side*.255,2.005,-.01]} size={[.056,.096,.076]}/>
   <Ellipse geom={ball} mat={mat} pos={[side*.107,2.09,.208]} size={[.055,.028,.036]}/>
   <Ellipse geom={ball} mat={mat} pos={[side*.104,2.16,.192]} size={[.08,.017,.024]}/>
  </React.Fragment>)}
  {meshParts}
 </group>;
};

const StreakField=({frame}:{frame:number})=>{
 const data=useMemo(()=>Array.from({length:76},(_,i)=>{
  const z=-3+(hash(i+7)*5.7),x=-5+hash(i+173)*10,y=-4+hash(i+423)*8;
  const len=1.0+hash(i+91)*4.1;
  const a=hash(i+33)*.65+.16, b=.12+hash(i+65)*.47;
  return {x,y,z,len,a,b,alpha:.028+hash(i+10)*.095};
 }),[]);
 return <group>{data.map((p,i)=>{
  const speed=.008+hash(i+329)*.045;
  const offset=(frame*speed+hash(i+53)*12)%14-7;
  const coords=[p.x+offset,p.y-offset*.21,p.z];
  const dx=p.len*Math.cos(p.a),dy=-p.len*Math.sin(p.a);
  return <group key={i} position={coords as [number,number,number]}>
   <mesh position={[dx/2,dy/2,p.b/2]} rotation={[0,0,-p.a]}>
     <boxGeometry args={[p.len,.005,.005]}/>
     <meshBasicMaterial color={i%6===0?'#64899b':'#66727a'} transparent opacity={p.alpha} depthWrite={false}/>
   </mesh>
  </group>;
 })}</group>;
};
const earthShader=()=>new THREE.ShaderMaterial({
 vertexShader:`varying vec3 vNormal;varying vec2 vUv;varying vec3 vPos;
 void main(){vNormal=normalize(normalMatrix*normal);vUv=uv;vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`
 varying vec3 vNormal;varying vec2 vUv;varying vec3 vPos;
 void main(){
  vec3 V=normalize(vec3(0.,0.,1.));float s=max(dot(normalize(vNormal),V),0.);
  float f=pow(1.-s,3.);
  float lat=abs(sin(vUv.y*3.1415926*12.));
  float lon=abs(sin(vUv.x*6.2831853*18.));
  float grid=pow(lat,45.)*.08+pow(lon,48.)*.08;
  float fractal=sin(vUv.x*53.+sin(vUv.y*18.))*sin(vUv.y*30.+sin(vUv.x*16.));
  float land=step(.25,fractal);
  vec3 base=vec3(.010,.027,.036)+vec3(.006,.017,.026)*land+vec3(.035,.08,.102)*grid;
  vec3 rim=vec3(.02,.21,.33)*f*.64;
  gl_FragColor=vec4(base+rim,1.);
 }`,
});
const Globe=({frame}:{frame:number})=>{
 const m=useMemo(earthShader,[]);
 return <group rotation={[.21,frame*.004+.6,0]}>
  <mesh material={m}><sphereGeometry args={[1.58,96,72]}/></mesh>
  <mesh scale={1.02}><sphereGeometry args={[1.58,56,40]}/><meshBasicMaterial color="#0b5a82" wireframe transparent opacity={.04} depthWrite={false}/></mesh>
 </group>;
};
const Direction=({frame}:{frame:number})=>{
 const {camera}=useThree();
 useLayoutEffect(()=>{
  camera.position.set(0,.05,10.75);
  camera.lookAt(0,0,0);
  camera.updateProjectionMatrix();
 },[camera,frame]);
 return null;
};
const TextOver=({frame}:{frame:number})=>{
 const t=frame/30, earth=between(t,10.1,15,.9),human=between(t,-.8,10.7,1.0);
 return <>
  <div style={{position:'absolute',top:293,left:82,right:80,opacity:human,...style}}>
    <div style={{fontWeight:650,fontSize:27,letterSpacing:-.4}}>Through your body, every second</div>
    <div style={{marginTop:19,color:'#aeb6b9',fontFamily:'Consolas,Monaco,monospace',letterSpacing:2.2,fontSize:21}}>≈ 100,000,000,000,000 neutrinos</div>
  </div>
  <div style={{position:'absolute',top:293,left:82,right:80,opacity:earth,...style}}>
    <div style={{fontWeight:650,fontSize:27}}>Through your body, every second</div>
    <div style={{marginTop:18,color:'#687985',letterSpacing:2.1,fontSize:20,fontFamily:'Consolas,monospace'}}>Earth, 12,742 km across</div>
  </div>
  <div style={{position:'absolute',top:760,left:730,color:'#7d9096',fontFamily:'Consolas,monospace',fontSize:17,opacity:human*.65}}>1.75 m</div>
  <div style={{position:'absolute',bottom:361,left:105,right:105,textAlign:'center',fontSize:30,fontWeight:600,lineHeight:1.38,letterSpacing:-.6,opacity:human,...style}}>
    {t<5.4?<>About 100 trillion neutrinos pass<br/>through your body every second.</>:<>They are tiny particles that go straight<br/>through you, and straight through the Earth.</>}
  </div>
  <div style={{position:'absolute',bottom:361,left:105,right:105,textAlign:'center',fontSize:30,fontWeight:600,lineHeight:1.38,letterSpacing:-.6,opacity:earth,...style}}>
    They are tiny particles that go straight<br/>through you, and straight through the Earth.
  </div>
  <div style={{position:'absolute',top:1700,...style,left:100,right:100,color:'#525b60',lineHeight:1.35,fontSize:15,opacity:human*.75}}>
    An original, procedural recreation of the visual presentation.<br/>Scientific figures are diagrammatic, not exact engineering CAD.
  </div>
  {earth>.05&&<div style={{position:'absolute',top:935,right:244,color:'#bbde76',fontSize:21,opacity:earth}}>● <span style={{fontSize:17}}>YOU</span></div>}
 </>;
};
export const IceCubeOpeningProof=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig(),t=frame/30;
 const human=between(t,-1,10.55,.65),earth=between(t,10.03,15,.65);
 return <AbsoluteFill style={{background:'#000',overflow:'hidden'}}>
  <ThreeCanvas width={width} height={height} camera={{position:[0,.05,10.75],fov:31,near:.1,far:120}}
    gl={{antialias:true,preserveDrawingBuffer:true,alpha:false}}>
   <Direction frame={frame}/>
   <color attach="background" args={['#000000']}/>
   <ambientLight intensity={.3} />
   <directionalLight position={[-3,4,5]} intensity={.5}/>
   {human>.01&&<group visible={human>.05}>
     <AnatomicalHuman frame={frame}/>
     <StreakField frame={frame}/>
   </group>}
   {earth>.05&&<Globe frame={frame}/>}
  </ThreeCanvas>
  <AbsoluteFill style={{background:'#000000',opacity:Math.min(1,Math.max(0,1-human))*(1-earth),pointerEvents:'none'}}/>
  <TextOver frame={frame}/>
 </AbsoluteFill>;
};
