import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {RACE_COLORS} from '../contract.ts';
import type {RaceCarId,RacePath} from '../contract.ts';
import type {EpisodePaths} from './model.ts';
import {visibleArc} from './model.ts';

const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
type Vector=[number,number,number];
const v3=(p:Vector)=>new THREE.Vector3(...p);

/** Explicit 3D road ribbon. Derived from the *actual* A1 arc-distance sampler. */
export function buildWorldRibbon(path:RacePath,startM:number,endM:number,width=.1,height=.08){
 const geometry=new THREE.BufferGeometry();
 if(!(endM>startM)||!(width>0))return geometry;
 const n=clamp(Math.ceil((endM-startM)/.42),2,512);
 const positions:number[]=[],indices:number[]=[];
 for(let i=0;i<=n;i++){
   const d=startM+(endM-startM)*i/n;
   const p=v3(path.sampleAtDistance(d).position);
   const before=v3(path.sampleAtDistance(Math.max(0,d-.035)).position);
   const after=v3(path.sampleAtDistance(Math.min(path.lengthM,d+.035)).position);
   const tangent=after.sub(before).normalize();
   let normal=new THREE.Vector3(-tangent.z,0,tangent.x);
   if(normal.lengthSq()<.0001)normal=new THREE.Vector3(0,0,1);
   normal.normalize();
   // Slight taper at leading tip. Stays entirely in world space, above asphalt.
   const taper=clamp(Math.min((i+1)/5,(n-i+1)/5),.22,1);
   for(const side of [-1,1]){
     const point=p.clone().addScaledVector(normal,side*width*.5*taper);
     positions.push(point.x,point.y+height,point.z);
   }
   if(i<n){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
 }
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

export const WorldLine:React.FC<{
 path:RacePath;progressM:number;color:string;opacity?:number;revealed?:boolean;
}>=({path,progressM,color,opacity=1,revealed=true})=>{
 const arc=visibleArc(path,progressM);
 const from=arc?Math.floor(arc.startM*4)/4:0;
 const until=arc?Math.ceil(arc.endM*4)/4:0;
 const core=useMemo(()=>buildWorldRibbon(path,from,until,.14,.085),[path,from,until]);
 const light=useMemo(()=>buildWorldRibbon(path,from,until,.34,.067),[path,from,until]);
 useEffect(()=>()=>{core.dispose();light.dispose();},[core,light]);
 if(!revealed||!arc)return null;
 return <group>
   <mesh geometry={light} renderOrder={12}>
     <meshBasicMaterial color={color} transparent opacity={.16*opacity} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/>
   </mesh>
   <mesh geometry={core} renderOrder={13}>
     <meshBasicMaterial color={color} transparent opacity={.91*opacity} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/>
   </mesh>
 </group>;
};

export const WorldApex:React.FC<{
 path:RacePath;color:string;frame:number;highlight?:boolean
}>=({path,color,frame,highlight=false})=>{
 const pos=path.sampleAtDistance(path.apexDistanceM).position;
 const scale=highlight?1+.085*Math.sin(frame*.10):.83;
 return <group position={[pos[0],pos[1]+.085,pos[2]]} scale={[scale,scale,scale]}>
  <mesh rotation={[-Math.PI/2,0,0]} renderOrder={15}>
   <ringGeometry args={[.48,.57,48]}/>
   <meshBasicMaterial color={color} side={THREE.DoubleSide} depthWrite={false} transparent opacity={.95} toneMapped={false}/>
  </mesh>
  <mesh rotation={[-Math.PI/2,0,0]} renderOrder={15}>
   <ringGeometry args={[.10,.16,32]}/>
   <meshBasicMaterial color="#fffef6" side={THREE.DoubleSide} depthWrite={false} transparent opacity={.85} toneMapped={false}/>
  </mesh>
 </group>;
};

/** A5 never moves cars or supplies telemetry. Agent 6 injects A1 paths and A2 travel. */
export const RaceLineWorld:React.FC<{
 paths:EpisodePaths;
 progressM:Record<RaceCarId,number>;
 frame:number;
 highlight?:RaceCarId|'both'|'none';
 showApex?:boolean;
}>=({paths,progressM,frame,highlight='both',showApex=true})=><group>
 <WorldLine path={paths.shortcut} color={RACE_COLORS.shortcut} progressM={progressM.shortcut} opacity={highlight==='racing'?.35:1}/>
 <WorldLine path={paths.racing} color={RACE_COLORS.racing} progressM={progressM.racing} opacity={highlight==='shortcut'?.35:1}/>
 {showApex&&<WorldApex path={paths.shortcut} color={RACE_COLORS.shortcut} frame={frame} highlight={highlight==='shortcut'}/>}
 {showApex&&<WorldApex path={paths.racing} color={RACE_COLORS.racing} frame={frame} highlight={highlight==='racing'}/>}
 </group>;
