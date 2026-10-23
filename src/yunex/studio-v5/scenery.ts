import * as T from 'three';
import {sampleRoad} from './road.ts';
import type {Road} from './road.ts';
import {random} from './environment.ts';
import type {resolveConfig} from './environment.ts';
type Config=ReturnType<typeof resolveConfig>;
const mat=(color:string,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
function cube(g:T.Object3D,size:number[],pos:number[],material:T.Material,name:string){const m=new T.Mesh(new T.BoxGeometry(...size as [number,number,number]),material);m.position.fromArray(pos);m.name=name;m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function at(road:Road,d:number,offset:number){const s=sampleRoad(road,d,offset),g=new T.Group();g.position.copy(s.position);g.rotation.y=s.yaw;return g;}
function instances(g:T.Group,geo:T.BufferGeometry,material:T.Material,transforms:T.Object3D[],name:string){if(!transforms.length){geo.dispose();material.dispose();return;}const mesh=new T.InstancedMesh(geo,material,transforms.length);mesh.name=name;mesh.castShadow=!name.includes('foliage')&&!name.includes('verge');mesh.receiveShadow=true;transforms.forEach((o,i)=>{o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.computeBoundingSphere();g.add(mesh);}
export function addNature(g:T.Group,road:Road,c:Config,heightAt:(x:number,z:number)=>number){
 const r=random(c.seed),count=Math.round((c.quality==='hero'?220:90)*c.vegetation),trunks:T.Object3D[]=[],crowns:T.Object3D[]=[],rocks:T.Object3D[]=[],grass:T.Object3D[]=[];
 for(let i=0;i<count;i++){
 const d=r()*road.length,side=r()<.5?-1:1,offset=side*(Math.max(road.width/2+3,c.cameraSafeWidth+4)+r()*18),s=sampleRoad(road,d,offset),height=5+r()*9;
 s.position.y=heightAt(s.position.x,s.position.z);
 const trunk=new T.Object3D();trunk.position.copy(s.position).add(new T.Vector3(0,height*.36,0));trunk.scale.set(.18+r()*.16,height*.72,.18+r()*.16);trunk.rotation.z=(r()-.5)*.12;trunks.push(trunk);
 // Radial needle clusters: distinct branch tiers, scanned foliage is applied by the native asset loader.
 const near=d>55&&d<230,layers=near?14:5,rays=near?9:5;
 for(let layer=0;layer<layers;layer++)for(let ray=0;ray<rays;ray++){
 const u=Math.min(.98,(layer+r()*.4)/layers),a=ray*2.399+layer*.45+r()*.3,length=(1-u)*2.9+.3;
 for(let segment=0;segment<(near?3:1);segment++){
 const o=new T.Object3D(),rad=length*(.25+segment*.32);o.position.copy(s.position).add(new T.Vector3(Math.cos(a)*rad,height*(.30+u*.65)+(segment?.12:0),Math.sin(a)*rad));o.scale.set(1.7+length*.35,1.1+length*.20,1);o.rotation.order='YXZ';o.rotation.set(-.8+(r()-.5)*.4,a,r()*.25);crowns.push(o);
 }}
 }
 for(let i=0;i<(c.preset==='rally'||c.preset==='mountain'?180:25);i++){
 const side=r()<.5?-1:1,s=sampleRoad(road,r()*road.length,side*(Math.max(c.cameraSafeWidth+2,road.width/2+2)+r()*8)),o=new T.Object3D();o.position.copy(s.position);o.position.y=heightAt(o.position.x,o.position.z);o.scale.set(.2+r()*.9,.15+r()*.5,.25+r()*.8);o.rotation.set(r(),r()*6,r());rocks.push(o);
 }
 for(let i=0;i<Math.round(1500*c.vegetation);i++){
 const side=r()<.5?-1:1,s=sampleRoad(road,r()*road.length,side*(road.width/2+1.2+r()*3)),o=new T.Object3D();o.position.copy(s.position);o.position.y=heightAt(o.position.x,o.position.z)+.16;o.scale.set(.12+r()*.16,.2+r()*.4,.12+r()*.16);o.rotation.y=r()*6;grass.push(o);
 }
 instances(g,new T.CylinderGeometry(.65,1,1,7),mat('#51483a'),trunks,'v5-instanced-branch-trunks');
 instances(g,new T.PlaneGeometry(1,1),new T.MeshStandardMaterial({color:'#647452',alphaTest:.4,side:T.DoubleSide,roughness:1}),crowns,'v5-instanced-foliage-branches');
 instances(g,new T.IcosahedronGeometry(1,1),mat('#716f62'),rocks,'v5-instanced-rocks');
 instances(g,new T.PlaneGeometry(.6,1),new T.MeshStandardMaterial({color:'#777c53',alphaTest:.4,side:T.DoubleSide,roughness:1}),grass,'v5-instanced-verge-growth');
}
export function addArchitecture(g:T.Group,road:Road,c:Config){
 const metal=mat('#68777f',.42,.65),concrete=mat('#8e8c82'),dark=mat('#283039'),glass=mat('#243f4d',.18,.42),trim=mat('#b5aa93');
 const warm=new T.MeshStandardMaterial({color:'#e4c997',emissive:'#d6ab64',emissiveIntensity:1.2,roughness:.3});
 const cool=new T.MeshStandardMaterial({color:'#b6d9ef',emissive:'#82b7e3',emissiveIntensity:1.6,roughness:.3});
 // Roadside architecture always leaves the declared tracking camera corridor open.
 const setback=Math.max(c.cameraSafeWidth+1,road.width/2+3);
 if(c.preset==='city')for(let i=0;i<23;i++)for(const side of [-1,1]){
 const d=8+i*20,b=at(road,d,side*(setback+6.5)),r=random(c.seed+i*37+(side+1)*83),floors=3+Math.floor(r()*7),w=16+r()*3,h=floors*3.2;
 const stone=mat(['#726b62','#5b666d','#8a8172','#655c57'][i%4]);
 cube(b,[w,h,10],[0,h/2,0],stone,'masonry-building');
 // Recessed curtain wall bays, deep lintels, pilasters and roof parapets.
 const front=-side*5.04;
 for(let floor=0;floor<floors;floor++){
 cube(b,[w+.3,.24,10.3],[0,3.2*(floor+1),0],trim,'projecting-cornice');
 for(let bay=0;bay<4;bay++){
 const x=(bay-1.5)*w/4,win=c.timeOfDay==='night'&&r()>.38?warm:glass;
 cube(b,[w/4-.8,2.25,.12],[x,floor*3.2+1.7,front],win,'recessed-window-bay');
 cube(b,[.14,2.4,.3],[x,floor*3.2+1.7,front-side*.09],metal,'window-mullion');
 cube(b,[w/4-.6,.12,.45],[x,floor*3.2+.53,front],trim,'window-sill');
 }
 }
 for(const x of [-w/2+.3,0,w/2-.3])cube(b,[.48,h,.4],[x,h/2,front],trim,'stone-pilaster');
 cube(b,[w+.5,.7,10.5],[0,h+.35,0],stone,'roof-parapet');
 for(let bay=0;bay<3;bay++){
 const x=(bay-1)*w/3;cube(b,[w/3-.7,2.3,.18],[x,1.3,front-side*.12],glass,'shopfront-glazing');
 cube(b,[w/3-.3,.5,1.5],[x,2.8,front-side*.5],i%2?dark:trim,'shop-awning');
 cube(b,[w/3-1,.35,.2],[x,3.35,front-side*.24],i%2?cool:warm,'illuminated-shop-sign');
 }
 g.add(b);
 const paving=at(road,d,side*(road.width/2+1.8));cube(paving,[19,.18,2.4],[0,.02,0],concrete,'pavement-module');g.add(paving);
 }
 if(c.preset==='circuit'){
 for(let d=0;d<road.length;d+=2)for(const side of [-1,1]){
 const q=at(road,d,side*(road.width/2+.38));cube(q,[1.95,.10,.72],[0,.02,0],mat(Math.floor(d/2)%2?'#e9dfd3':'#b84237'),'circuit-kerb');g.add(q);
 }
 for(let i=0;i<10;i++){
 const p=at(road,12+i*14,setback+7);cube(p,[13,5,10],[0,2.5,0],concrete,'pit-garage');cube(p,[11,3,.15],[0,1.6,-5.06],dark,'garage-door');
 for(let y=1;y<3;y+=.35)cube(p,[11,.035,.1],[0,y,-5.16],metal,'garage-door-slat');cube(p,[13,1.7,10],[0,5.9,0],glass,'pit-hospitality-glass');cube(p,[14,.3,11],[0,6.9,0],trim,'pit-roof');g.add(p);
 }
 }
 if(c.preset!=='rally')for(let d=0;d<road.length;d+=8)for(const side of [-1,1]){
 if(c.preset==='city')continue;
 if(c.preset==='mountain'&&side===1)continue;const q=at(road,d,side*(c.preset==='mountain'?road.width/2+.65:setback));cube(q,[8,.18,.16],[0,.70,0],metal,'formed-guardrail');cube(q,[8,.15,.14],[0,.95,0],metal,'upper-guardrail');cube(q,[.13,1.1,.15],[0,.45,0],metal,'guardrail-post');g.add(q);
 }
 if(c.preset==='circuit'||c.preset==='city')for(let d=0;d<road.length;d+=30)for(const side of [-1,1]){
 const p=at(road,d,side*setback),h=c.preset==='circuit'?12:8;cube(p,[.16,h,.16],[0,h/2,0],metal,'light-mast');cube(p,[.2,.15,2.2],[0,h,-side],metal,'luminaire-arm');cube(p,[1.4,.12,.5],[0,h,-side*2],cool,'luminaire');
 const light=new T.PointLight('#c5dded',c.preset==='city'?90:160,30,2);light.position.set(0,h-.2,-side*2);if(d>50&&d<240)p.add(light);g.add(p);
 }
}
