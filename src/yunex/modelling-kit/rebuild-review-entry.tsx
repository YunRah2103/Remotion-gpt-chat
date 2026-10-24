/** Matched whole-catalogue geometry inspection; each frame is one six-vehicle page. */
import React,{useMemo,useEffect} from 'react';
import {AbsoluteFill,Composition,registerRoot,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {VEHICLES} from '../world-kit/catalog';
import {createFleetVehicle} from './fleet';
import {CinematicLighting} from './Lighting';
import {CameraAim} from '../world-kit/components';
import {disposeObject} from '../world-kit/geometry';
const Tile:React.FC<{index:number;profile:boolean}>=({index,profile})=>{
 const s=VEHICLES[index];const car=useMemo(()=>createFleetVehicle({variant:s.id,quality:'hero'}),[s.id]);
 useEffect(()=>()=>disposeObject(car),[car]);
 const r=Math.max(s.length*2.15,s.height*4);
 return <div style={{width:600,height:600,position:'relative'}}>
 <ThreeCanvas width={600} height={600} shadows camera={{fov:32,near:.03,far:300}}>
 <CinematicLighting timeOfDay="day" shadowMapSize={1024}/><primitive object={car}/>
 <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[100,100]}/><meshStandardMaterial color="#39454c" roughness={.9}/></mesh>
 <CameraAim position={profile?[0,s.height*.6,r]:[r*.72,s.height*.7+r*.14,r*.70]} target={[0,s.height*.5,0]} fov={32}/>
 </ThreeCanvas>
 <div style={{position:'absolute',left:18,top:18,color:'white',fontFamily:'sans-serif',fontSize:24}}>{s.id}</div>
 </div>;
};
const Sheet:React.FC<{profile:boolean}>=({profile})=>{const page=useCurrentFrame();return <AbsoluteFill style={{background:'#14202a',display:'grid',gridTemplateColumns:'repeat(3,600px)',gridTemplateRows:'repeat(2,600px)'}}>{Array.from({length:6},(_,i)=><Tile key={page*6+i} index={page*6+i} profile={profile}/>)}</AbsoluteFill>;};
registerRoot(()=> <Composition id="FleetRebuildSheet" component={Sheet} width={1800} height={1200} fps={1} durationInFrames={6} defaultProps={{profile:false}}/>);
