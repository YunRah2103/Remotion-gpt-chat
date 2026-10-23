import * as T from 'three';
import {instances} from '../world-kit/scenery.ts';
import type {Instance} from '../world-kit/scenery.ts';
/** The same inspection scenery, batched by material/geometry instead of hundreds of meshes. */
export function createInspectionScenery({farSideOnly=false}:{farSideOnly?:boolean}={}){
 const g=new T.Group(),lanes:Instance[]=[],rails:Instance[]=[],posts:Instance[]=[],kerbs:Instance[]=[],poles:Instance[]=[],heads:Instance[]=[];
 for(let i=0;i<22;i++){const x=(i-11)*8;lanes.push({p:[x,-.008,-2.7],s:[3,.001,.10]});for(const side of (farSideOnly?[-1]:[-1,1])){
  rails.push({p:[x,.32,side*5.4],s:[7.95,.24,.12]});for(const offset of [0,4])posts.push({p:[x+offset,.16,side*5.4],s:[.08,.32,.10]});
  for(let j=0;j<8;j++)kerbs.push({p:[x+j-4,.018,side*4.5],s:[.99,.06,.48],color:j%2?'#a23832':'#c4ceca'});
  if(i%3===0){poles.push({p:[x,3,side*7],s:[.075,6,.075]});heads.push({p:[x,6,side*6.45],s:[.5,.05,1.3]});}
 }}
 const add=(name:string,items:Instance[],color:string,roughness:number,metalness=0,geometry:T.BufferGeometry=new T.BoxGeometry())=>{const m=instances(g,name,geometry,new T.MeshStandardMaterial({color,roughness,metalness}),items);m.castShadow=name==='inspection-rails';m.receiveShadow=name==='inspection-kerbs';return m;};
 add('inspection-lanes',lanes,'#c7d3d5',.55);add('inspection-rails',rails,'#71828b',.38,.7);add('inspection-posts',posts,'#53616a',.5,.6);add('inspection-kerbs',kerbs,'#ffffff',.7);
 add('inspection-poles',poles,'#44525b',1,.5,new T.CylinderGeometry(.6,1,1,8));const lamps=add('inspection-lamps',heads,'#d3efff',1);const mat=lamps.material as T.MeshStandardMaterial;mat.emissive.set('#9ccde9');mat.emissiveIntensity=2;
 return g;
}
