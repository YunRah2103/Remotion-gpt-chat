import React, {useMemo,useLayoutEffect} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useLoader,useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * First 15 seconds of the supplied reference, rebuilt as genuine 3D.
 * Uses a CC0 anatomical MakeHuman 3D mesh processed in Blender,
 * a geographic Earth texture, cinematic Fresnel shader and sparse
 * neutrino streaks. No original footage or screenshots are reused.
 */
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
const hash=(i:number)=>{const n=Math.sin(i*127.132+19.317)*92131.913;return n-Math.floor(n);};
const fade=(t:number,a:number,b:number,d=.8)=>Math.min(ease((t-a)/d),ease((b-t)/d));

const Body=({frame}:{frame:number})=>{
  const gltf=useLoader(GLTFLoader,staticFile('assets/icecube-human.glb'));
  const material=useMemo(()=>{
    const m=new THREE.MeshStandardMaterial({
      color:new THREE.Color('#091016'),
      roughness:.73,metalness:.19,
      emissive:new THREE.Color('#061017'),emissiveIntensity:.7,
      side:THREE.FrontSide
    });
    m.onBeforeCompile=(shader)=>{
      shader.fragmentShader=shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        \`float eyeAngle = clamp(abs(dot(normalize(normal), normalize(vViewPosition))),0.0,1.0);
        float edgeFresnel = pow(1.0-eyeAngle,3.45);
        float coolSide = pow(1.0-eyeAngle,1.3)*.08;
        outgoingLight += vec3(0.12,0.45,0.66)*edgeFresnel*1.23 + vec3(0.05,0.13,0.17)*coolSide;
        #include <opaque_fragment>\`
      );
    };
    return m;
  },[]);
  useLayoutEffect(()=>{
    gltf.scene.traverse(o=>{
      if((o as THREE.Mesh).isMesh){
        const mesh=o as THREE.Mesh;
        mesh.material=material;
        mesh.frustumCulled=false;
      }
    });
  },[gltf,material]);
  const slowTurn=THREE.MathUtils.lerp(-.33,-1.53,ease(frame/325));
  // Level head and body rotation: the reference gradually reveals the profile.
  return <group rotation={[0,slowTurn,0]} position={[0,-.03,0]}>
    <primitive object={gltf.scene}/>
  </group>;
};

const Earth=({frame}:{frame:number})=>{
  const map=useLoader(THREE.TextureLoader,staticFile('assets/earth-daymap.jpg'));
  useMemo(()=>{map.colorSpace=THREE.SRGBColorSpace;return map;},[map]);
  return <group rotation={[.11,.44+frame*.004,-.10]}>
    <mesh>
      <sphereGeometry args={[1.03,96,64]}/>
      <meshStandardMaterial map={map} color="#19506a" roughness={1} metalness={0} emissive="#102d3c" emissiveIntensity={.12}/>
    </mesh>
    <mesh scale={[1.01,1.01,1.01]}>
      <sphereGeometry args={[1.03,64,48]}/>
      <meshBasicMaterial color="#76c8ec" wireframe transparent opacity={.035} depthWrite={false}/>
    </mesh>
    <mesh scale={[1.025,1.025,1.025]}>
      <sphereGeometry args={[1.03,64,48]}/>
      <shaderMaterial
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
        vertexShader={\`varying vec3 vn;varying vec3 ve; void main(){
          vec4 p=modelViewMatrix*vec4(position,1.);
          vn=normalize(normalMatrix*normal);ve=normalize(-p.xyz);
          gl_Position=projectionMatrix*p;
        }\`}
        fragmentShader={\`varying vec3 vn;varying vec3 ve;void main(){
          float f=pow(1.-abs(dot(normalize(vn),normalize(ve))),4.2);
          gl_FragColor=vec4(vec3(.09,.43,.67)*f,f*.50);
        }\`}
      />
    </mesh>
  </group>;
};
const Camera=()=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    camera.position.set(0,0,6.52);
    camera.lookAt(0,0,0);
    camera.updateProjectionMatrix();
  },[camera]);
  return null;
};
const NeutrinoTrails=({frame}:{frame:number})=>{
  const t=frame/30;
  const segments=useMemo(()=>{
    return Array.from({length:59},(_,i)=>{
      const x=-190+hash(i+71)*1480;
      const y=-170+hash(i+141)*2300;
      const len=140+hash(i+271)*900;
      const ang=.20+hash(i+481)*2.25;
      const dx=Math.cos(ang)*len;
      const dy=Math.sin(ang)*len;
      return {x,y,dx,dy,opacity:.08+hash(i+391)*.18,width:i%9===0?1.6:.9};
    });
  },[]);
  return <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{position:'absolute',inset:0}}>
    {segments.map((s,i)=>{
      const slide=((t*.95+i*.019)%1)*18;
      return <line key={i}
        x1={s.x+slide} y1={s.y-slide*.75}
        x2={s.x+s.dx+slide} y2={s.y+s.dy-slide*.75}
        stroke="#6d8792" opacity={s.opacity} strokeWidth={s.width} strokeLinecap="round"/>;
    })}
  </svg>;
};
const Overlay=({frame}:{frame:number})=>{
  const t=frame/30;
  const human=fade(t,-1,12.6,1.45);
  const earth=fade(t,11.3,16,1.05);
  return <>
    <div style={{position:'absolute',left:84,top:292,right:60,color:'#e5eef1',opacity:human,fontFamily:'Arial,Helvetica,sans-serif'}}>
      <div style={{fontSize:26,fontWeight:650,letterSpacing:-.45}}>Through your body, every second</div>
      <div style={{fontSize:22,color:'#b9c5ca',fontFamily:'Consolas,monospace',marginTop:18,letterSpacing:1.45}}>≈ 100,000,000,000,000 neutrinos</div>
    </div>
    <div style={{position:'absolute',left:84,top:292,right:60,color:'#e5eef1',opacity:earth,fontFamily:'Arial,Helvetica,sans-serif'}}>
      <div style={{fontSize:26,fontWeight:650,letterSpacing:-.45}}>Through your body, every second</div>
      <div style={{fontSize:22,color:'#a1b3bc',marginTop:18,fontFamily:'Consolas,monospace',letterSpacing:1.5}}>Earth · 12,742 km across</div>
    </div>
    {t<12.2&&<div style={{
      position:'absolute',left:622,top:600,fontSize:19,fontFamily:'Consolas,monospace',
      color:'#7d9098',opacity:human*.70,letterSpacing:2
    }}>1.75 m</div>}
    <div style={{
      position:'absolute',left:82,right:82,top:1480,textAlign:'center',fontFamily:'Arial,Helvetica,sans-serif',
      color:'#f4f7f8',fontSize:33,fontWeight:600,letterSpacing:-.45,lineHeight:1.32
    }}>
      {t<5.1?
        <>About 100 trillion neutrinos pass<br/>through your body every second.</>:
        <>They are tiny particles that go straight<br/>through you, and straight through the Earth.</>}
    </div>
    {t<4.3&&<div style={{
      position:'absolute',left:100,right:120,bottom:100,
      color:'#60646a',fontFamily:'Arial,Helvetica,sans-serif',fontSize:15,lineHeight:1.36,opacity:.83
    }}>
      This visual recreation uses an original animation and a public-domain<br/>
      scientific-scale human model rather than footage from the reference.
    </div>}
    {earth>.1&&<div style={{position:'absolute',left:618,top:682,
      fontFamily:'Consolas,monospace',fontSize:20,color:'#c5e87c',opacity:earth}}>
      ● YOU
    </div>}
  </>;
};
export const IceCube3DProof:React.FC=()=>{
  const frame=useCurrentFrame();
  const t=frame/30;
  const {width,height}=useVideoConfig();
  const human=fade(t,-2,12.6,1.45),earth=fade(t,11.25,16,1.05);
  return <AbsoluteFill style={{backgroundColor:'#000',overflow:'hidden'}}>
    <NeutrinoTrails frame={frame}/>
    <ThreeCanvas width={width} height={height}
      camera={{position:[0,0,6.52],near:.1,far:80,fov:31.8}}
      gl={{alpha:true,antialias:true,preserveDrawingBuffer:true}}>
      <Camera/>
      <ambientLight intensity={.48} color="#6c9db6"/>
      <pointLight position={[-3,2,5]} color="#70c9fb" intensity={5}/>
      <directionalLight position={[3,1,-5]} color="#38769f" intensity={7}/>
      {human>.005&&<group visible={human>.005} scale={1}>
        <Body frame={frame}/>
      </group>}
      {earth>.005&&<Earth frame={frame}/>}
    </ThreeCanvas>
    {/* Fade on black over model only; keep background streaks throughout. */}
    <AbsoluteFill style={{backgroundColor:'#000000',opacity:0,pointerEvents:'none'}}/>
    <Overlay frame={frame}/>
  </AbsoluteFill>;
};
