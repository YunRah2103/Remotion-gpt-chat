import * as T from 'three';
import {random,instances,trees} from './scenery.ts';
import type {Instance} from './scenery.ts';
import {environmentSpec,isScenic,scenicOffset} from './world-catalog.ts';
import {buildNewEnvironment} from './new-environments.ts';
import {box,mesh,surface} from './geometry.ts';
import type {V3} from './geometry.ts';
import type {EnvironmentKind,TimeOfDay} from './catalog.ts';
export type EnvironmentOptions={kind:EnvironmentKind;seed?:number;timeOfDay?:TimeOfDay};
export type RoutePose={position:V3;yaw:number};
const circuit=new T.CatmullRomCurve3([[56,0,-24],[37,0,-43],[-38,0,-43],[-65,0,-19],[-65,0,20],[-36,0,42],[39,0,42],[65,0,18]].map(p=>new T.Vector3(...p)),true,'catmullrom',.35);
const circuitLength=circuit.getLength();
const wrap=(n:number,m:number)=>((n%m)+m)%m;
export function routeLength(kind:EnvironmentKind){if(kind==='track')return circuitLength;environmentSpec(kind);return 180;}
export function sampleRoute(kind:EnvironmentKind,distance:number):RoutePose{
 if(!Number.isFinite(distance))throw new Error('Route distance must be finite');
 const len=routeLength(kind);
 if(kind!=='track'){
  if(environmentSpec(kind).mode==='display')return {position:[0,0,0],yaw:0};
  const x=wrap(distance+90,len)-90,z=isScenic(kind)?scenicOffset(x,kind):0;
  const derivative=isScenic(kind)?(scenicOffset(x+.01,kind)-scenicOffset(x-.01,kind))/.02:0;
  return {position:[x,0,z+(kind==='parking'?0:-1.85)],yaw:-Math.atan(derivative)};
 }
 const u=wrap(distance,len)/len,p=circuit.getPointAt(u),t=circuit.getTangentAt(u);
 return {position:[p.x,0,p.z],yaw:Math.atan2(-t.z,t.x)};
}
function highway(g:T.Group){
 const asphalt=surface('#353e45',.02,.91),white=surface('#d8ded7'),steel=surface('#9faeae',.5,.45);
 box(g,asphalt,[220,.10,15],[0,-.05,0],.005,'road');
 const stripes:Instance[]=[];
 for(let x=-106;x<110;x+=7)for(const z of [-3.7,3.7])stripes.push({p:[x,.007,z],s:[3,.013,.12]});
 for(const z of [-7.05,7.05])stripes.push({p:[0,.007,z],s:[220,.013,.13]});
 instances(g,'lane-markings',new T.BoxGeometry(1,1,1),white,stripes);
 for(const z of [-7.8,7.8]){box(g,steel,[220,.20,.12],[0,.65,z],.012,'guardrail');}
 box(g,surface('#87938d'),[220,.55,.50],[0,.275,0],.02,'median');
 const posts:Instance[]=[];for(let x=-108;x<=108;x+=6)for(const z of [-7.8,7.8])posts.push({p:[x,.34,z],s:[.10,.68,.10]});instances(g,'barrier-posts',new T.BoxGeometry(),steel,posts);
 const poles:Instance[]=[],arms:Instance[]=[];
 for(let x=-90;x<110;x+=27)for(const z of [-9,9]){poles.push({p:[x,3.4,z],s:[.13,6.8,.13]});arms.push({p:[x,6.8,z-Math.sign(z)*1.2],s:[.12,.12,2.4]});}
 instances(g,'lamp-poles',new T.BoxGeometry(),surface('#66767e',.4),poles);instances(g,'lamp-arms',new T.BoxGeometry(),surface('#66767e',.4),arms);
 instances(g,'lamp-heads',new T.BoxGeometry(),new T.MeshStandardMaterial({color:'#f9e6af',emissive:'#ffd892',emissiveIntensity:1}),arms.map(a=>({p:[a.p[0],6.72,a.p[2]-Math.sign(a.p[2])*1],s:[.55,.08,.36]})));
 trees(g,Array.from({length:30},(_,i)=>[-106+i*7.4,0,(i%2?1:-1)*(16+(i%4)*3)]));
 // Generic overhead gantry; intentionally no brand or language-specific signs.
 box(g,steel,[.23,6.8,.23],[31,3.4,-8.4],.01);box(g,steel,[.23,6.8,.23],[31,3.4,8.4],.01);box(g,steel,[.28,.25,17],[31,6.8,0],.01);
 for(const z of [-4.8,4.8])box(g,surface('#3c6c67'),[.10,1.15,3.5],[31,6.13,z],.025,'gantry-sign');
}
function city(g:T.Group,seed:number,night:boolean){
 const rng=random(seed),buildings:Instance[]=[],glass:Instance[]=[],plinths:Instance[]=[],pavement:Instance[]=[],streetLines:Instance[]=[];
 const road=surface('#3b444c',.03,.9);
 box(g,road,[230,.08,12],[0,-.04,0],.004,'boulevard');
 for(const sign of [-1,1])box(g,surface('#9a9f99'),[230,.16,5],[0,-.08,sign*8.5],.01,'sidewalk');
 for(let x=-100;x<110;x+=36){
  box(g,road,[11,.08,120],[x,-.04,0],.005,'cross-street');
  for(let k=-4;k<=4;k++)for(const sign of [-1,1])pavement.push({p:[x+sign*7,.009,k*.65],s:[2.5,.014,.32]});
 }
 for(let x=-110;x<115;x+=7)streetLines.push({p:[x,.009,0],s:[3,.014,.12]});
 instances(g,'road-lines',new T.BoxGeometry(),surface('#e1e1cf'),streetLines);
 instances(g,'crosswalks',new T.BoxGeometry(),surface('#e0e3d8'),pavement);
 for(let row=0;row<2;row++)for(let i=0;i<12;i++){
  const x=-102+i*18+(row?4:0),z=(row?1:-1)*(19+rng()*5),w=9+rng()*5,d=9+rng()*7,h=7+rng()*25;
  const colors=['#777d7d','#c0b8a7','#8b9290','#707e87','#a19489'];const color=colors[Math.floor(rng()*colors.length)];
  buildings.push({p:[x,h/2,z],s:[w,h,d],color});plinths.push({p:[x,h+.15,z],s:[w+.15,.30,d+.15],color:'#66716e'});
  const front=z-Math.sign(z)*(d/2+.012);
  for(let level=1.7;level<h-.4;level+=2.5)for(let col=-w/2+1;col<w/2-.5;col+=1.8){glass.push({p:[x+col,level,front],s:[.95,1.35,.035],color:night?(rng()>.38?'#d5b780':'#354953'):(rng()>.5?'#68848d':'#425e6c')});}
 }
 instances(g,'buildings',new T.BoxGeometry(),surface('#ffffff',.08,.72),buildings);
 instances(g,'roof-caps',new T.BoxGeometry(),surface('#ffffff',.15,.6),plinths);
 instances(g,'windows',new T.BoxGeometry(),new T.MeshStandardMaterial({color:'#ffffff',metalness:.28,roughness:.35,emissive:night?'#a68b57':'#000000',emissiveIntensity:night?.26:0}),glass);
 trees(g,Array.from({length:20},(_,i)=>[-104+i*11,0,(i%2?1:-1)*9]));
 for(let i=0;i<10;i++){const x=-93+i*21;box(g,surface('#58646a',.4),[.12,5,.12],[x,2.5,7],.01,'street-lamp');box(g,new T.MeshStandardMaterial({color:'#fff1c3',emissive:'#ffcd88',emissiveIntensity:night?2:.2}),[.55,.13,.35],[x,5,6.85],.015,'lamp');}
}
function ribbon(width:number,y:number){
 const positions:number[]=[],indices:number[]=[];const n=256;
 for(let i=0;i<=n;i++){const p=circuit.getPointAt(i/n),t=circuit.getTangentAt(i/n),normal=new T.Vector3(-t.z,0,t.x);for(const sign of [-1,1])positions.push(p.x+normal.x*width*.5*sign,y,p.z+normal.z*width*.5*sign);if(i<n){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function track(g:T.Group){
 mesh(g,ribbon(22,-.02),surface('#a79e8c',.02,.98),[0,0,0],[0,0,0],'runoff');
 const road=surface('#3d454b',.02,.94);road.side=T.DoubleSide;mesh(g,ribbon(12,0),road,[0,0,0],[0,0,0],'circuit-asphalt');
 const curbs:Instance[]=[],edges:Instance[]=[],barriers:Instance[]=[];
 for(let i=0;i<160;i++){
  const u=i/160,p=circuit.getPointAt(u),t=circuit.getTangentAt(u),n=new T.Vector3(-t.z,0,t.x),ry=Math.atan2(-t.z,t.x);
  for(const sign of [-1,1]){
   curbs.push({p:[p.x+n.x*6.4*sign,.025,p.z+n.z*6.4*sign],s:[circuitLength/160+.08,.05,.8],ry,color:i%2?'#e4dfcf':'#a74d46'});
   edges.push({p:[p.x+n.x*5.75*sign,.012,p.z+n.z*5.75*sign],s:[circuitLength/160+.08,.018,.10],ry});
   barriers.push({p:[p.x+n.x*11.7*sign,.45,p.z+n.z*11.7*sign],s:[circuitLength/160+.12,.9,.3],ry});
  }
 }
 instances(g,'red-white-curbs',new T.BoxGeometry(),surface('#ffffff'),curbs);instances(g,'edge-lines',new T.BoxGeometry(),surface('#dedfd4'),edges);instances(g,'circuit-barriers',new T.BoxGeometry(),surface('#98a29c',.25),barriers);
 // Start grid follows actual circuit tangent.
 const start=circuit.getPointAt(0),t=circuit.getTangentAt(0),n=new T.Vector3(-t.z,0,t.x);
 const checks:Instance[]=[];for(let row=0;row<2;row++)for(let i=0;i<16;i++)checks.push({p:[start.x+n.x*(i-7.5)*.7+t.x*row*.65,.018,start.z+n.z*(i-7.5)*.7+t.z*row*.65],s:[.65,.025,.7],ry:Math.atan2(-t.z,t.x),color:(i+row)%2?'#ddddcf':'#20292d'});instances(g,'start-line',new T.BoxGeometry(),surface('#ffffff'),checks);
 for(let i=0;i<8;i++){box(g,surface('#bcb9a9'),[6,3.8,7],[-28+i*7,1.9,-66],.03,'pit-garage');box(g,surface('#3d555a'),[4.7,2.7,.06],[-28+i*7,1.36,-62.45],.01,'pit-door');}
 for(let row=0;row<4;row++)box(g,surface(row%2?'#737c7b':'#a2aaa4'),[46,.7,2.1],[0,.4+row*.7,67+row*2.1],.01,'grandstand');
 box(g,surface('#414f55',.2),[49,.15,11],[0,5.7,71],.03,'grandstand-roof');
 for(const x of [-22,-7,7,22])for(const z of [66,76])box(g,surface('#687978',.3),[.17,5.7,.17],[x,2.85,z],.01,'grandstand-support');
 trees(g,Array.from({length:24},(_,i)=>[Math.cos(i*Math.PI/12)*100,0,Math.sin(i*Math.PI/12)*90]));
}
export function createEnvironment({kind,seed=12,timeOfDay='day'}:EnvironmentOptions):T.Group{
 routeLength(kind);if(!Number.isFinite(seed))throw new Error('Seed must be finite');
 const spec=environmentSpec(kind);const g=new T.Group();g.name=`YUNEX-${kind}`;g.userData={kind,seed,units:'metres',roadY:0};
 if(['highway','city','track'].includes(kind))box(g,surface(spec.ground),[520,.12,520],[0,-.18,0],.001,'terrain');
 if(kind==='highway')highway(g);else if(kind==='city')city(g,seed,timeOfDay==='night');else if(kind==='track')track(g);else buildNewEnvironment(g,{kind,seed,timeOfDay});
 return g;
}
