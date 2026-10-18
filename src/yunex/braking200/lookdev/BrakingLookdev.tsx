import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {sampleRoute,routeLength} from '../../world-kit/environments.ts';
import {wheelAnchors} from '../contracts.ts';
import type {BrakingSimulationState,Vec3} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import type {RoutePose} from '../../world-kit/environments.ts';
import {BrakingLighting} from './lighting.tsx';
import {
  applyBrakingFinishes,createAsphaltGrain,disposeOwnedObject,
  illustrativeHeatFromEnergy
} from './materials.ts';
import type {FinishHandle} from './materials.ts';

type FinishMap=Map<T.Object3D,FinishHandle>;
/** Bridge to A1/A3 existing objects. Never creates or replaces either model.
 * Mount AFTER their <primitive>s in the same <ThreeCanvas>.
 * useFrame finds newly mounted objects and avoids patching any source twice. */
export const BrakingFinishes:React.FC<{state?:BrakingSimulationState}>=({state})=>{
 const roots=useRef<FinishMap>(new Map());
 useFrame(({scene})=>{
  const lookups:[string,'car'|'track'][]=[
   ['YUNEX-grand-tourer','car'],['YUNEX-track','track']
  ];
  for(const [name,role] of lookups){
   const object=scene.getObjectByName(name);
   if(object&&!roots.current.has(object)){
    roots.current.set(object,applyBrakingFinishes(object,role));
   }
  }
  const heat=illustrativeHeatFromEnergy(state);
  for(const [obj,handle] of roots.current){
   handle.setHeat(obj.name==='YUNEX-grand-tourer'?heat:0);
   if(obj.parent===null){handle.dispose();roots.current.delete(obj);}
  }
 });
 useEffect(()=>()=>{
  for(const h of roots.current.values())h.dispose();
  roots.current.clear();
 },[]);
 return null;
};
function addTube(group:T.Group,name:string,points:T.Vector3[],radius:number,
 color:string,metalness=.25,roughness=.65):void{
 const geometry=new T.TubeGeometry(new T.CatmullRomCurve3(points),points.length*2,radius,5,false);
 const material=new T.MeshStandardMaterial({color,metalness,roughness});
 const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;
 group.add(mesh);
}
/** Deliberately sparse physical trackside details; complements existing
 * original kit circuit, curbs, barriers and grandstand, never doubles roads.
 */
export function createTrackDressing(seed=12):T.Group{
 const group=new T.Group();group.name='A4-circuit-film-dressing';
 const steel=new T.MeshStandardMaterial({color:'#67757c',metalness:.46,roughness:.5});
 const dark=new T.MeshStandardMaterial({color:'#28373c',metalness:.24,roughness:.61});
 const fence=new T.MeshStandardMaterial({color:'#708185',metalness:.42,roughness:.58});
 const postsGeo=new T.CylinderGeometry(.042,.058,2.35,7);
 const wiresGeo=new T.CylinderGeometry(.013,.013,2.35,5);
 const length=routeLength('track'),count=84;
 let seedValue=seed>>>0;
 const rand=()=>{seedValue=(Math.imul(seedValue,1664525)+1013904223)>>>0;return seedValue/4294967296;};
 for(const sign of [-1,1]){
  const posts=new T.InstancedMesh(postsGeo,steel,count);
  posts.name='trackside-fence-verticals';posts.castShadow=true;
  const cross=new T.InstancedMesh(wiresGeo,fence,count*2);
  cross.name='trackside-fence-wires';cross.castShadow=false;
  const dummy=new T.Object3D();
  const along1:T.Vector3[]=[],along2:T.Vector3[]=[];
  for(let i=0;i<count;i++){
   const pose=sampleRoute('track',length*i/count);
   const outer=12.35*sign;
   const x=pose.position[0]+Math.sin(pose.yaw)*outer;
   const z=pose.position[2]+Math.cos(pose.yaw)*outer;
   dummy.position.set(x,1.175,z);dummy.rotation.set(0,0,0);
   dummy.scale.set(1,1,1);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);
   for(let t=0;t<2;t++){
     dummy.position.set(x,.8+t*.88,z);
     dummy.updateMatrix();cross.setMatrixAt(i*2+t,dummy.matrix);
   }
   along1.push(new T.Vector3(x,.85,z));along2.push(new T.Vector3(x,1.81,z));
  }
  posts.instanceMatrix.needsUpdate=true;cross.instanceMatrix.needsUpdate=true;
  group.add(posts,cross);
  addTube(group,'trackside-catch-fence-upper',along2,.012,'#9ba9a5');
  addTube(group,'trackside-catch-fence-middle',along1,.009,'#667579');
  // Clusters outside the track perimeter: shallow, sun-faded tyre barriers.
  for(let k=0;k<11;k++){
   const d=(k+sign*0.05+11.4)*length/12;
   const route=sampleRoute('track',d);
   const side=sign*(15.1+rand()*1.2);
   const x=route.position[0]+Math.sin(route.yaw)*side;
   const z=route.position[2]+Math.cos(route.yaw)*side;
   const pack=new T.Group();pack.position.set(x,0,z);
   for(let j=0;j<3;j++){
     const tyre=new T.Mesh(new T.TorusGeometry(.33,.10,6,14),dark);
     tyre.rotation.x=Math.PI/2;
     tyre.position.set((j-1)*.51,.23,0);tyre.castShadow=true;
     pack.add(tyre);
   }
   group.add(pack);
  }
 }
 // Small architectural pit lights create scale/depth near grandstand.
 for(let i=0;i<5;i++){
   const x=-29+i*13;
   const pole=new T.Mesh(new T.CylinderGeometry(.07,.09,5.4,8),steel);
   pole.position.set(x,2.7,-69);pole.castShadow=true;group.add(pole);
   const lamp=new T.Mesh(new T.BoxGeometry(1.4,.13,.36),
     new T.MeshStandardMaterial({color:'#d4d6cf',emissive:'#fff2ca',emissiveIntensity:.13}));
   lamp.position.set(x,5.38,-68.3);lamp.castShadow=true;group.add(lamp);
 }
 return group;
}
/** Deterministic anchored contact shadow, supplementary to genuine cast
 * shadows when software GL has a sparse shadow map. No fake cloud of smoke. */
export const BrakingContactShadow:React.FC<{pose:RoutePose}>=({pose})=>{
 const anchors=wheelAnchors(vehicleSpec('grand-tourer'));
 const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);
 return <group>
  {anchors.map(a=>{
   const local=a.center,x=pose.position[0]+c*local[0]+s*local[2],
    z=pose.position[2]-s*local[0]+c*local[2];
   return <group key={a.id}>
    <mesh position={[x,.018,z]} rotation={[-Math.PI/2,0,-pose.yaw]}>
     <circleGeometry args={[1,32]}/>
     <meshBasicMaterial color="#050b0e" transparent opacity={.24}
       depthWrite={false} polygonOffset polygonOffsetFactor={-1}/>
    </mesh>
    <mesh position={[x,.020,z]} rotation={[-Math.PI/2,0,-pose.yaw]} scale={[.49,.88,1]}>
     <circleGeometry args={[1,32]}/>
     <meshBasicMaterial color="#081319" transparent opacity={.13} depthWrite={false}/>
    </mesh>
   </group>;
  })}
 </group>;
};
export type BrakingLookdevProps={
  state?:BrakingSimulationState;
  route?:RoutePose;
  focus?:Vec3;
  seed?:number;
  studio?:boolean;
  environmentDressing?:boolean;
  contactShadow?:boolean;
};
/** Mounts LIGHTS + FINISHES + optional original track props ONLY.
 * Car and circuit are owned and rendered by A1/A3 or caller.
 * No createVehicle() or createEnvironment() calls are permitted here. */
export const BrakingLookdev:React.FC<BrakingLookdevProps>=({
 state,route,focus,seed=12,studio=false,environmentDressing=true,contactShadow=true
})=>{
 const location=route??sampleRoute('track',state?.traveledM??0);
 const grain=useMemo(()=>createAsphaltGrain(seed),[seed]);
 const dressing=useMemo(()=>createTrackDressing(seed),[seed]);
 useEffect(()=>()=>{disposeOwnedObject(grain);disposeOwnedObject(dressing);},[grain,dressing]);
 return <>
  <BrakingLighting focus={focus??location.position} studio={studio}/>
  <BrakingFinishes state={state}/>
  {environmentDressing&&<><primitive object={grain}/><primitive object={dressing}/></>}
  {contactShadow&&<BrakingContactShadow pose={location}/>}
 </>;
};
