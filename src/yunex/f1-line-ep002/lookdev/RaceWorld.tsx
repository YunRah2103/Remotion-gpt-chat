import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {WorldLighting} from '../../world-kit/components';
import {createEnvironment,sampleRoute,routeLength} from '../../world-kit/environments.ts';
import {createVehicle} from '../../world-kit/vehicles.ts';
import {animateVehicle,placeVehicle} from '../../world-kit/motion.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import type {RaceCarId,RacePose,V3} from '../contract.ts';
import {RACE_COLORS} from '../contract.ts';
import {closestRouteDistance,offsetPose,RACE_LOOK} from './layout.ts';
import type {RoadPose} from './layout.ts';

export type RaceWorldQuality='baseline'|'premium';
export const RACE_LOOKDEV_INFO={
 environment:'track',car:'formula-modern',sourceRoadWidthM:12,
 additive:true,worldY:0,previewIsPhysics:false,
 shadowMapSize:1024,decorSeed:2404
} as const;

function tuneCircuit(root:T.Group) {
 root.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const m=o.material;
  if(!(m instanceof T.MeshStandardMaterial))return;
  if(o.name==='circuit-asphalt'){
   // Reuse the kit's existing road geometry and world-space UVs; no second surface.
   m.color.set('#434d54');m.roughness=.77;m.metalness=.065;
   m.bumpScale=.011;m.envMapIntensity=.35;
   o.receiveShadow=true;o.castShadow=false;
  }
  if(o.name==='runoff'){m.color.set('#b9b1a0');m.roughness=.96;o.castShadow=false;}
  if(o.name==='red-white-curbs'){m.roughness=.60;m.metalness=.03;o.castShadow=false;o.receiveShadow=true;}
  if(o.name==='circuit-barriers'){m.roughness=.52;m.metalness=.21;}
  if(o.name==='circuit-catch-fence-wires'){m.roughness=.40;m.metalness=.45;}
  if(o.name==='grandstand-roof'){m.roughness=.49;m.metalness=.28;}
 });
}

type Placement={at:V3;yaw?:number;scale?:V3;color?:string};
function batch(root:T.Group,name:string,geometry:T.BufferGeometry,material:T.Material,positions:Placement[],castShadow=false){
 if(!positions.length){geometry.dispose();material.dispose();return;}
 const mesh=new T.InstancedMesh(geometry,material,positions.length);
 mesh.name=name;mesh.castShadow=castShadow;mesh.receiveShadow=true;
 const dummy=new T.Object3D();
 positions.forEach((p,i)=>{
  dummy.position.set(...p.at);dummy.rotation.set(0,p.yaw??0,0);
  dummy.scale.set(...(p.scale??[1,1,1]));dummy.updateMatrix();
  mesh.setMatrixAt(i,dummy.matrix);
  if(p.color)mesh.setColorAt(i,p.color);
 });
 mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 root.add(mesh);
}

function buildTrackside():T.Group{
 const root=new T.Group();root.name='agent4-trackside-additive';
 const length=routeLength('track'),sample=(d:number)=>sampleRoute('track',d);
 const apex=closestRouteDistance(sample,length);
 const black=new T.MeshBasicMaterial({color:'#10191c',transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
 const scuffs:Placement[]=[],grooves:Placement[]=[],gravel:Placement[]=[],safetyPaint:Placement[]=[];
 // Everything is placed by sampleRoute: no world-origin decals or camera-attached texture swimming.
 for(let j=-58;j<=72;j+=2.5){
  const d=apex+j,pose=sample(d);
  if(j%5===0)for(const off of [-1.48,1.48]) {
   const q=offsetPose(pose,off);
   scuffs.push({at:[q.position[0],.016,q.position[2]],yaw:q.yaw,scale:[.62,1,1]});
  }
  if(Math.round(j*2)%5===0)for(const sign of [-1,1]){
   // Painted refuge remains OFF the 12m asphalt ribbon, inside the existing runoff.
   const q=offsetPose(pose,sign*8.35);
   safetyPaint.push({at:[q.position[0],-.005,q.position[2]],yaw:q.yaw,scale:[1.6,1,1]});
   for(const offset of [-.35,.45]){
    const p=offsetPose(pose,sign*(9.15+offset));
    gravel.push({at:[p.position[0],-.002,p.position[2]],yaw:q.yaw,scale:[.13,.07,.12],color:(j%2===0?'#b5a88d':'#928979')});
   }
  }
  if(j%10===0){
   const q=offsetPose(pose,-.85);
   grooves.push({at:[q.position[0],.017,q.position[2]],yaw:q.yaw,scale:[.55,1,1]});
  }
 }
 const smearGeo=new T.PlaneGeometry(6,.19);smearGeo.rotateX(-Math.PI/2);
 batch(root,'corner-rubber-use',smearGeo,black,scuffs);
 const grooveGeo=new T.PlaneGeometry(3,.04);grooveGeo.rotateX(-Math.PI/2);
 batch(root,'rubber-tread-faint',grooveGeo,new T.MeshBasicMaterial({color:'#141b1d',opacity:.13,transparent:true,depthWrite:false,side:T.DoubleSide}),grooves);
 const runoffGeo=new T.PlaneGeometry(1.8,.20);runoffGeo.rotateX(-Math.PI/2);
 batch(root,'runoff-refuge-stripes',runoffGeo,new T.MeshStandardMaterial({color:'#748c7b',roughness:.9,side:T.DoubleSide}),safetyPaint);
 batch(root,'runoff-gravel-detail',new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#ffffff',roughness:1,vertexColors:false}),gravel);
 // Small trackside distance boards / marshals' marshal-free generic hazard markers.
 // Positive setbacks exceed the outer guardrail and fence, so do not obstruct the racing corridor.
 const face=new T.MeshStandardMaterial({color:'#e2dfd3',roughness:.55});
 const rear=new T.MeshStandardMaterial({color:'#25343a',metalness:.27,roughness:.5});
 const highlighted=new T.MeshStandardMaterial({color:'#ea7f61',roughness:.48});
 const boardOffsets=[-35,-21,-8,9,24,40];
 for(let k=0;k<boardOffsets.length;k++){
  const base=sample(apex+boardOffsets[k]);
  const sign=k%2===0?1:-1;
  const loc=offsetPose(base,sign*RACE_LOOK.boardSetbackM);
  const post=new T.Mesh(new T.BoxGeometry(.10,2.3,.10),rear);
  post.position.set(loc.position[0],1.15,loc.position[2]);post.castShadow=true;root.add(post);
  const board=new T.Group();
  board.position.set(loc.position[0],2.40,loc.position[2]);board.rotation.y=base.yaw;
  const panel=new T.Mesh(new T.BoxGeometry(3.1,1.25,.16),rear);panel.castShadow=true;board.add(panel);
  const plate=new T.Mesh(new T.BoxGeometry(2.80,.82,.03),face);plate.position.z=sign*.098;board.add(plate);
  const band=new T.Mesh(new T.BoxGeometry(.48,.83,.04),highlighted);band.position.set(-1.08,0,sign*.12);board.add(band);
  for(let i=0;i<3;i++){const stripe=new T.Mesh(new T.BoxGeometry(.17,.57,.04),rear);stripe.position.set(-.38+i*.48,0,sign*.13);board.add(stripe);}
  root.add(board);
 }
 // Hero corner marshal-side grandstand silhouette, without obstructing the existing fence.
 const pose=sample(apex+21),stand=offsetPose(pose,26);
 const standGroup=new T.Group();standGroup.position.set(stand.position[0],0,stand.position[2]);standGroup.rotation.y=pose.yaw;
 const concrete=new T.MeshStandardMaterial({color:'#87938d',roughness:.88});
 const seatPalette=['#778e91','#a0b4a8','#dcaa71','#526f75'];
 for(let row=0;row<4;row++){
  const slab=new T.Mesh(new T.BoxGeometry(19,.38,2.5),concrete);
  slab.position.set(0,1.0+row*.70,row*2.55);slab.castShadow=true;slab.receiveShadow=true;standGroup.add(slab);
  const seats:Placement[]=[];
  for(let i=0;i<21;i++)seats.push({at:[-8.8+i*.87,1.32+row*.70,row*2.55],scale:[.65,.43,.65],color:seatPalette[(row+i)%4]});
  batch(standGroup,'corner-spectator-seats',new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:'#ffffff',roughness:.75}),seats);
 }
 const canopy=new T.Mesh(new T.BoxGeometry(21,.16,13),new T.MeshStandardMaterial({color:'#3d565e',roughness:.48,metalness:.32}));
 canopy.position.set(0,5,3.6);canopy.castShadow=true;standGroup.add(canopy);
 root.add(standGroup);
 // Shadow-catching shrubs behind the barriers, not in the racing line.
 const shrubs:Placement[]=[];
 for(let j=-60;j<=68;j+=7.2){
  const p=sample(apex+j),n=offsetPose(p,j%2?21.7:-22.4);
  shrubs.push({at:[n.position[0],.32,n.position[2]],scale:[1.0+(j%3)*.1,.65,1.1],color:j%3===0?'#718c72':'#8a9a71'});
 }
 batch(root,'corner-verge-shrubs',new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#ffffff',roughness:.97}),shrubs,true);
 return root;
}

/** Episode-scoped adapter. Owns one kit track and adds details; NEVER constructs a second road. */
export const RaceWorld:React.FC<{quality?:RaceWorldQuality;seed?:number}>=({quality='premium',seed=12})=>{
 const world=useMemo(()=>{
  const g=createEnvironment({kind:'track',seed,timeOfDay:'dusk'});
  if(quality==='premium')tuneCircuit(g);
  return g;
 },[quality,seed]);
 const details=useMemo(()=>quality==='premium'?buildTrackside():null,[quality]);
 useEffect(()=>()=>{disposeObject(world);if(details)disposeObject(details);},[world,details]);
 return <><primitive object={world}/>{details&&<primitive object={details}/>}</>;
};

export const RaceLighting:React.FC<{quality?:RaceWorldQuality;focus?:V3}>=({quality='premium',focus=RACE_LOOK.turnAnchor})=>{
 // Reuse the kit's safe PMREM, sunset sky fill and shadow light; add restrained edge light only.
 return <>
  <WorldLighting timeOfDay={quality==='premium'?'dusk':'day'} focus={focus}/>
  {quality==='premium'&&<directionalLight position={[focus[0]-30,20,focus[2]-12]} color="#b7dbf3" intensity={.32}/>}
 </>;
};

function tuneCar(g:T.Group){
 g.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  o.castShadow=true;o.receiveShadow=true;
  for(const mat of Array.isArray(o.material)?o.material:[o.material]){
   if(o.name==='tyre' && mat instanceof T.MeshStandardMaterial){
    mat.roughness=.94;mat.metalness=0;mat.color.set('#191d21');
   }
   if(o.name==='floor' && mat instanceof T.MeshStandardMaterial)mat.roughness=.73;
   if(mat instanceof T.MeshPhysicalMaterial){
    // The generic kit builds one owned body material per vehicle, so these are additive.
    if(mat.metalness>.28){mat.metalness=.48;mat.roughness=.23;mat.clearcoat=.93;mat.clearcoatRoughness=.16;mat.envMapIntensity=1.65;}
    if(mat.transparent){mat.roughness=.13;mat.envMapIntensity=1.3;}
   }
  }
 });
}
export const RaceCar:React.FC<{
 id:RaceCarId;pose:RacePose|RoadPose;wheelTravelM:number;steerRad?:number;quality?:RaceWorldQuality;
}>=({id,pose,wheelTravelM,steerRad=0,quality='premium'})=>{
 const car=useMemo(()=>{
  const c=createVehicle({variant:'formula-modern',color:RACE_COLORS[id],accent:id==='shortcut'?'#c8faf1':'#ffe3ac',wheelColor:'#82949a',interior:false,lights:false});
  if(quality==='premium')tuneCar(c);
  return c;
 },[id,quality]);
 useEffect(()=>()=>disposeObject(car),[car]);
 animateVehicle(car,wheelTravelM,steerRad);
 placeVehicle(car,pose);
 return <primitive object={car}/>;
};

/** Deterministic, optional physical-speed-driven cues; safe to omit if A2 has not supplied speed. */
export const RaceSpeedCues:React.FC<{pose:RoadPose;speedMps:number}>=({pose,speedMps})=>{
 if(!Number.isFinite(speedMps)||speedMps<24)return null;
 const alpha=Math.min(.17,.04+(speedMps-24)*.004);
 return <group position={pose.position} rotation={[0,pose.yaw,0]}>
  {[-.75,.75].map((z,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[-4.8-i*.45,.021,z]}>
   <planeGeometry args={[Math.min(4.0,(speedMps-20)*.10),.024]}/>
   <meshBasicMaterial color="#d9d0be" transparent opacity={alpha} depthWrite={false}/>
  </mesh>)}
 </group>;
};
