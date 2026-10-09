import React,{useMemo} from 'react';
import * as THREE from 'three';
import {ghostOpacityAt,GHOST_FRONT_BRAKE_ANCHOR} from './cameraMath';
export type GhostCarOutlineProps={
 frame:number;opacity?:number;showEndingGhost?:boolean;position?:[number,number,number];
};
type Stroke={id:string;points:THREE.Vector3[];weight:number;thickness:number};
const V=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const SIDE_WIDTH=.82;
/** Procedural thin tube curves only, no complete car geometry, no external assets. */
function strokes():Stroke[]{
 const out:Stroke[]=[];
 for(const side of [-1,1]){
  const x=side*SIDE_WIDTH,far=side<0?.34:1;
  const edge=(id:string,pts:THREE.Vector3[],thickness=.0042,weight=1)=>
    out.push({id:id+'-'+side,points:pts,thickness,weight:weight*far});
  edge('roof',[V(x,1.17,-.63),V(x,1.32,-.25),V(x,1.39,.42),V(x,1.24,.82)],.0052,.9);
  edge('windscreen',[V(x,1.17,-.63),V(x,.91,-1.04),V(x,.84,-1.37)],.0042,.75);
  edge('bonnet',[V(x,.84,-1.37),V(x,.74,-1.94),V(x,.64,-2.42),V(x,.51,-2.53)],.0049,1);
  edge('rear',[V(x,1.24,.82),V(x,.96,1.2),V(x,.78,1.86),V(x,.55,2.42)],.0049,.93);
  edge('waist',[V(x,.79,-2.3),V(x,.82,-1.03),V(x,.83,.62),V(x,.77,1.53),V(x,.65,2.29)],.0039,.53);
  edge('sill',[V(x,.24,-1),V(x,.23,.1),V(x,.25,1.1)],.0052,.82);
  edge('nose',[V(x,.51,-2.53),V(x,.3,-2.55),V(x,.24,-2.37)],.0038,.75);
  edge('tail',[V(x,.55,2.42),V(x,.32,2.5),V(x,.24,2.28)],.0038,.72);
  for(const z of [-1.42,1.45]){
   edge('wheel-arch'+z,Array.from({length:28},(_,i)=>{
    const a=.03+Math.PI*i/27;return V(x,.45+Math.sin(a)*.42,z+Math.cos(a)*.42);
   }),.0053,1.13);
   edge('hub-arc'+z,Array.from({length:30},(_,i)=>{
    const a=i/29*Math.PI*1.74+.21;return V(x,.45+Math.sin(a)*.24,z+Math.cos(a)*.24);
   }),.0025,.28);
  }
 }
 out.push({id:'front-bridge',points:[V(-.82,.54,-2.49),V(0,.51,-2.57),V(.82,.54,-2.49)],weight:.37,thickness:.0034});
 out.push({id:'rear-bridge',points:[V(-.82,.56,2.41),V(0,.54,2.54),V(.82,.56,2.41)],weight:.25,thickness:.0034});
 return out;
}
export const GhostCarOutline:React.FC<GhostCarOutlineProps>=({
 frame,opacity=1,position=[0,0,0],showEndingGhost=false
})=>{
 const base=ghostOpacityAt(frame,showEndingGhost)*Math.max(0,Math.min(1,opacity));
 const lines=useMemo(()=>strokes().map(s=>({
  id:s.id,weight:s.weight,
  geometry:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(s.points),Math.max(24,(s.points.length-1)*8),s.thickness,5,false)
 })),[]);
 const locator=Math.max(0,Math.min(1,(frame-47)/36))*(1-Math.max(0,Math.min(1,(frame-110)/10)));
 const ring=useMemo(()=>{
  const pts=Array.from({length:65},(_,i)=>{
   const a=i/64*Math.PI*2;
   return V(GHOST_FRONT_BRAKE_ANCHOR[0]+.025,GHOST_FRONT_BRAKE_ANCHOR[1]+.315*Math.sin(a),GHOST_FRONT_BRAKE_ANCHOR[2]+.315*Math.cos(a));
  });
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),96,.006,6,true);
 },[]);
 if(base<.0001)return null;
 return <group position={position} name="GhostCarOutline">
  {lines.map(({id,weight,geometry})=><mesh key={id} geometry={geometry} frustumCulled={false}>
   <meshBasicMaterial color="#8fb7bd" transparent opacity={base*weight} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}/>
  </mesh>)}
  {locator>0&&<mesh geometry={ring} frustumCulled={false}>
   <meshBasicMaterial color="#83d2cb" transparent opacity={base*locator*.65} depthWrite={false} toneMapped={false}/>
  </mesh>}
 </group>;
};
