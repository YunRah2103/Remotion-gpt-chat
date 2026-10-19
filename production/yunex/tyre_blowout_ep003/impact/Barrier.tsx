/**
 * Agent 8 original-highway guardrail response. Animated steel geometry replaces
 * ONLY one visible right-side rail instance, never the approved highway kit.
 *
 * The baseline collision plane remains the rigid, undamaged z=-7.8 m rail.
 * 0..0.18 m localised *visual* rail buckling is bounded, not a physically
 * resolved structural engineering prediction. Samples run in either direction.
 */
import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {createEnvironment} from '../../../../src/yunex/world-kit/environments.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {impactRailZ} from './model.ts';
import type {CrashOutcomeFrame} from './model.ts';

const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=(v:number)=>{const u=clamp(v);return u*u*(3-2*u)};
const RAIL_START=-110,RAIL_END=110,RAIL_SAMPLES=220;
export const MAX_RAIL_BUCKLE_M=.18;

/** Reviewable finite deformation from actual A8 first contact; no random state. */
export function railBuckleAt(x:number,f:CrashOutcomeFrame):number {
 if(!f.contact.occurred||f.contact.firstContactX==null||
  f.contact.firstContactSec==null)return 0;
 const age=Math.max(0,f.relativeTimeSec-f.contact.firstContactSec);
 const centre=f.contact.firstContactX;
 const gaussian=Math.exp(-Math.pow((x-centre)/2.05,2));
 const movingScuff=(x>=centre&&x<=f.scenePositionM[0]+.4)?
  .18*Math.exp(-Math.pow((x-f.scenePositionM[0])/1.8,2)):0;
 return MAX_RAIL_BUCKLE_M*smooth(age/.20)*clamp(gaussian+movingScuff);
}

type Rail={root:T.Group;geom:T.BufferGeometry;original:Float32Array;
 material:T.MeshStandardMaterial};
/** Keep opposite (-X/+Z) rail and the posts as the same original world-kit. */
function prepareWorld():Rail {
 const root=createEnvironment({kind:'highway',timeOfDay:'day',seed:12});
 root.traverse(o=>{
  if(o instanceof T.Mesh&&o.name==='guardrail'&&o.position.z<0){
   o.visible=false; // exactly one right rail, replaced by a deformable tube
  }
 });
 const positions:number[]=[],indices:number[]=[];
 // Rectangular cross section: inside/outside face + two steel lips.
 for(let i=0;i<=RAIL_SAMPLES;i++){
  const x=RAIL_START+(RAIL_END-RAIL_START)*i/RAIL_SAMPLES;
  const z=impactRailZ(x);
  positions.push(x,.55,z+.06,x,.75,z+.06,x,.55,z-.06,x,.75,z-.06);
  if(i<RAIL_SAMPLES){
   const a=i*4,b=a+4;
   indices.push(a,b,a+1,a+1,b,b+1, // traffic face
    a+2,a+3,b+2,a+3,b+3,b+2,     // outside face
    a+1,b+1,a+3,a+3,b+1,b+3,     // rolled upper edge
    a,b+2,b,a,a+2,b+2);         // rolled lower edge
  }
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:'#9facad',metalness:.56,roughness:.42,side:T.DoubleSide});
 const mesh=new T.Mesh(geometry,material);
 mesh.name='agent8-original-rail-buckled-section';mesh.castShadow=true;mesh.receiveShadow=true;
 root.add(mesh);
 return {root,geom:geometry,original:new Float32Array(positions),material};
}
export const CrashBarrierWorld:React.FC<{frame:CrashOutcomeFrame}>=({frame})=>{
 const prepared=useMemo(prepareWorld,[]);
 useEffect(()=>()=>disposeObject(prepared.root),[prepared]);
 const attr=prepared.geom.getAttribute('position') as T.BufferAttribute;
 const arr=attr.array as Float32Array,initial=prepared.original;
 for(let i=0;i<arr.length;i+=3){
  const x=initial[i],buckle=railBuckleAt(x,frame);
  arr[i]=x;
  arr[i+1]=initial[i+1]+.035*buckle/MAX_RAIL_BUCKLE_M;
  arr[i+2]=initial[i+2]-buckle;
 }
 attr.needsUpdate=true;prepared.geom.computeVertexNormals();
 return <primitive object={prepared.root}/>;
};

/**
 * Distinct scraped rail lips, crumpled sheet and roadside paint/metal chips.
 * Visual-only; geometric contact and constrained car stay Agent 8 model-owned.
 * An A4 integrated world can use this exported overlay selectively without
 * hiding/refactoring A4 approved original kit road.
 */
export const ImpactRailScars3D:React.FC<{frame:CrashOutcomeFrame}>=({frame})=>{
 if(!frame.contact.occurred||frame.contact.firstContactX==null||
  frame.contact.firstContactSec==null)return null;
 const elapsed=frame.relativeTimeSec-frame.contact.firstContactSec;
 const impactX=frame.contact.firstContactX,railZ=impactRailZ(impactX);
 const grow=smooth(elapsed/.23);
 const scrapeLength=Math.min(3.5,Math.max(.15,frame.scenePositionM[0]-impactX));
 return <group>
  <mesh position={[impactX+scrapeLength*.5,.66,railZ+.085]}>
   <boxGeometry args={[scrapeLength,.07,.028]}/>
   <meshStandardMaterial color="#3a4044" metalness={.48} roughness={.74}
    transparent opacity={grow*.94}/>
  </mesh>
  <mesh position={[impactX+.22,.765,railZ+.09]} rotation={[.08,.05,-.14*grow]}>
   <boxGeometry args={[.66,.045,.16]}/>
   <meshStandardMaterial color="#707d80" metalness={.68} roughness={.43}
    transparent opacity={grow*.86}/>
  </mesh>
  {Array.from({length:5},(_,i)=>{
   const x=impactX+i*.42;
   return <mesh key={i} position={[x,.69,railZ+.105]}>
    <boxGeometry args={[.20,.012,.018]}/>
    <meshStandardMaterial color={i%2?'#4d5456':'#d2d9d4'}
     metalness={.62} roughness={.58} transparent opacity={grow*.78}/>
   </mesh>;
  })}
 </group>;
};
