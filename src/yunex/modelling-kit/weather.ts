import * as T from 'three';
import {random} from '../world-kit/scenery.ts';
import type {V3} from '../world-kit/geometry.ts';
export type WeatherKind='rain'|'spray'|'dust';
export type WeatherQuality='lightweight'|'standard'|'hero';
type Pool={kind:WeatherKind;particles:T.InstancedMesh;seeds:Float32Array;dummy:T.Object3D};
const pools=new WeakMap<T.Group,Pool>();
/** One bounded draw call; no textures, simulation clock, lights or per-frame allocation. */
export function createWeather({kind,quality='standard',seed=12}:{kind:WeatherKind;quality?:WeatherQuality;seed?:number}){
 if(!['rain','spray','dust'].includes(kind))throw new Error('Unknown weather kind');
 if(!['lightweight','standard','hero'].includes(quality))throw new Error('Unknown weather quality');
 if(!Number.isFinite(seed))throw new Error('Weather seed must be finite');
 const count={lightweight:64,standard:192,hero:384}[quality],rng=random(seed),seeds=new Float32Array(count*4);
 for(let i=0;i<seeds.length;i++)seeds[i]=rng();
 const g=new T.Group();g.name=`weather-${kind}`;
 const mat=new T.MeshBasicMaterial({color:kind==='dust'?'#b9a385':'#a8c5d2',transparent:true,opacity:kind==='rain'?.35:.12,depthWrite:false});
 const particles=new T.InstancedMesh(kind==='rain'?new T.BoxGeometry(1,1,1):new T.IcosahedronGeometry(1,0),mat,count);particles.name=`${kind}-particles`;particles.frustumCulled=false;g.add(particles);
 pools.set(g,{kind,particles,seeds,dummy:new T.Object3D()});g.userData={kind,quality,seed,pooled:true};animateWeather(g,{frame:0,fps:30});return g;
}
/** Absolute frame sampling, including negative speed and arbitrary backward seeking. Focus is world-space metres. */
export function animateWeather(g:T.Group,{frame,fps,speed=0,focus=[0,0,0]}:{frame:number;fps:number;speed?:number;focus?:V3}){
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0||!Number.isFinite(speed)||focus.length!==3||!focus.every(Number.isFinite))throw new Error('Weather needs finite frame, positive fps, finite speed and focus');
 const pool=pools.get(g);if(!pool)throw new Error('Group was not created by createWeather');
 const {kind,particles,seeds,dummy}=pool,t=frame/fps,wrap=(n:number)=>((n%1)+1)%1;
 g.position.set(...focus);
 for(let i=0;i<particles.count;i++){
  const a=seeds[i*4],b=seeds[i*4+1],c=seeds[i*4+2],d=seeds[i*4+3];
  if(kind==='rain'){
   dummy.position.set((wrap(a-t*speed/32)-.5)*32,wrap(b-t*(.8+d*.4))*12,(c-.5)*24);dummy.scale.set(.012,.3+d*.35,.012);dummy.rotation.set(0,0,.08+speed*.008);
  }else{
   const age=wrap(a+t*(kind==='spray'?.9:.25)),direction=speed<0?1:-1;
   dummy.position.set(direction*(1.8+age*(5+Math.min(Math.abs(speed),40)*.18)),.18+Math.sin(age*Math.PI)*(kind==='spray'?1.4:2.2),(b-.5)*(1+age*5));
   const s=(kind==='spray'?.05:.18)+age*(kind==='spray'?.16:.65);dummy.scale.set(s,s*(.6+c),s);dummy.rotation.set(c*3,d*3,b*3);
  }
  dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);
 }
 particles.instanceMatrix.needsUpdate=true;
}
