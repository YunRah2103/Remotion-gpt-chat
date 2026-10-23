import * as T from 'three';
import {box,mesh,rod,surface,disposeObject} from './geometry.ts';
import {instances,random,trees} from './scenery.ts';
import type {Instance} from './scenery.ts';
import type {V3} from './geometry.ts';
import type {EnvironmentKind,TimeOfDay} from './catalog.ts';
import type {RoutePose} from './environments.ts';
import {environmentSpec,isScenic,scenicOffset} from './world-catalog.ts';
import {sky,relief} from './world-terrain.ts';
import {refineSurfaces} from './world-surfaces.ts';

type Options={kind:EnvironmentKind;seed:number;timeOfDay:TimeOfDay};
const batch=(g:T.Group,name:string,mat:T.Material,items:Instance[])=>items.length?instances(g,name,new T.BoxGeometry(),mat,items):undefined;
function urban(g:T.Group,root:T.Group,seed:number,lit:boolean){
 const buildings=root.getObjectByName('buildings') as T.InstancedMesh,frames:Instance[]=[],cornices:Instance[]=[],glass:Instance[]=[],fixtures:Instance[]=[],balconies:Instance[]=[],rng=random(seed+201),matrix=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();
 for(let i=0;i<buildings.count;i++){
  buildings.getMatrixAt(i,matrix);matrix.decompose(p,q,s);const sign=Math.sign(p.z),front=p.z-sign*(s.z/2+.055);
  cornices.push({p:[p.x,.32,front],s:[s.x+.15,.64,.22]});
  for(let y=3.3;y<s.y-.5;y+=2.7){cornices.push({p:[p.x,y,front],s:[s.x+.05,.14,.16]});if(i%3===1)balconies.push({p:[p.x,y+.12,front-sign*.5],s:[s.x*.75,.13,1.1]});}
  for(let x=-s.x/2+.35;x<s.x/2;x+=2.4)frames.push({p:[p.x+x,s.y*.5,front-sign*.025],s:[.13,s.y,.14]});
  for(let x=-s.x/2+1.35;x<s.x/2-.7;x+=2.4){glass.push({p:[p.x+x,1.7,front-sign*.08],s:[2.0,2.45,.06],color:lit?'#9b9982':'#45636d'});frames.push({p:[p.x+x,3.06,front-sign*.36],s:[2.25,.14,.82]});}
  fixtures.push({p:[p.x,s.y+.42,p.z],s:[s.x*.32,.75,s.z*.3]});
 }
 batch(g,'facade-pilasters',surface('#b4b6ad',.05,.75),frames);batch(g,'facade-cornices',surface('#b4b9af',.08,.7),cornices);batch(g,'balcony-slabs',surface('#899a99',.18,.6),balconies);batch(g,'roof-services',surface('#6e7d80',.35,.65),fixtures);
 batch(g,'streetfront-glazing',new T.MeshStandardMaterial({color:'#ffffff',metalness:.35,roughness:.24,emissive:lit?'#9f8b61':'#000000',emissiveIntensity:lit?.25:0}),glass);
 const skyline:Instance[]=[],ribs:Instance[]=[];for(let i=0;i<24;i++){const x=-150+i*13,z=(i%2?1:-1)*(65+rng()*25),h=20+rng()*43,w=7+rng()*8;skyline.push({p:[x,h/2,z],s:[w,h,11],color:['#81939c','#a0aaa6','#758a94'][i%3]});for(let y=4;y<h;y+=3.2)ribs.push({p:[x,y,z-Math.sign(z)*5.53],s:[w+.1,.12,.07]});}batch(g,'distant-city-blocks',surface('#ffffff',.20,.55),skyline);batch(g,'skyline-floor-bands',surface('#afbab9',.3,.4),ribs);
 const curb:Instance[]=[],joints:Instance[]=[],grates:Instance[]=[];for(let x=-114;x<116;x+=2)for(const sign of [-1,1]){if(Math.abs(((x+100)%36+36)%36)<5.8)continue;curb.push({p:[x,.08,sign*6.08],s:[1.98,.16,.16]});joints.push({p:[x,.012,sign*8.45],s:[.025,.014,4.8]});if(x%12===0)grates.push({p:[x,.012,sign*5.7],s:[.65,.02,.30]});}batch(g,'granite-curbs',surface('#c2c6bb'),curb);batch(g,'paving-joints',surface('#737d7a'),joints);batch(g,'storm-grates',surface('#3e5156',.6,.6),grates);
}
function grasses(g:T.Group,kind:EnvironmentKind,seed:number){
 if(!['highway','coast','mountain','forest','desert','canyon','rally'].includes(kind))return;
 const rng=random(seed+911),p:number[]=[],idx:number[]=[],tufts:Instance[]=[];
 for(let j=0;j<3;j++){const a=j*Math.PI/3,dx=Math.cos(a)*.12,dz=Math.sin(a)*.12,k=p.length/3;p.push(-dx,0,-dz,dx,0,dz,dx*.25,.65,dz*.25,dx*.35,1,dz*.35);idx.push(k,k+1,k+2,k,k+2,k+3);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();
 for(let i=0;i<(kind==='desert'?110:850);i++){const x=-130+rng()*260,side=i%2?1:-1,z=(isScenic(kind)?scenicOffset(x,kind):0)+side*((kind==='highway'?8.6:6.2)+rng()*8),h=.12+rng()*.35;tufts.push({p:[x,0,z],s:[.6+rng(),h,.6+rng()],ry:rng()*Math.PI,color:['#89956a','#667e5b','#a8a17a'][i%3]});}
 const mat=surface('#ffffff',0,.97);mat.side=T.DoubleSide;const m=instances(g,'natural-verge-grasses',geo,mat,tufts);m.castShadow=false;
}
function roadsides(g:T.Group,kind:EnvironmentKind,route:(d:number)=>RoutePose){
 if(environmentSpec(kind).mode==='display'||kind==='track')return;
 const delineators:Instance[]=[],reflectors:Instance[]=[],rumble:Instance[]=[],patches:Instance[]=[];
 const width=kind==='highway'?15:kind==='airfield'?34:kind==='city'?12:kind==='bridge'?13:12;
 for(let d=-86;d<=86;d+=4){const pose=route(d),x=pose.position[0],centre=isScenic(kind)?scenicOffset(x,kind):0,ry=pose.yaw;
  for(const sign of [-1,1]){
   const z=centre+sign*(isScenic(kind)?6.6:width/2+.7);
   if(!['city','parking','harbour','industrial','service-station','airfield'].includes(kind)){delineators.push({p:[x,.46,z],s:[.10,.92,.12],ry});reflectors.push({p:[x,.72,z-sign*.068],s:[.08,.10,.018],ry,color:sign>0?'#d7c397':'#d4d9c8'});}
   if(kind==='highway')rumble.push({p:[x,.010,sign*7.22],s:[1.4,.018,.25],ry});
  }
  if(kind!=='rally')for(const z of [-.62,.62])patches.push({p:[x,.002,pose.position[2]+z],s:[4.04,.002,.30],ry});
 }
 batch(g,'road-delineators',surface('#bdc5bc'),delineators);batch(g,'road-reflectors',surface('#ffffff',.18,.35),reflectors);batch(g,'shoulder-rumble',surface('#a8afa6'),rumble);const m=surface('#151e25',.02,.95);m.transparent=true;m.opacity=.10;m.depthWrite=false;batch(g,'road-use-patina',m,patches);
}
function circuitDetails(g:T.Group,route:(d:number)=>RoutePose,length:number){
 const poles:Instance[]=[],rails:Instance[]=[],seats:Instance[]=[],lights:Instance[]=[];
 for(let d=0;d<length;d+=5){const p=route(d),nx=Math.sin(p.yaw),nz=Math.cos(p.yaw);for(const sign of [-1,1]){const z=p.position[2]+nz*13.4*sign,x=p.position[0]+nx*13.4*sign;poles.push({p:[x,1.8,z],s:[.075,3.6,.075]});for(const y of [1.1,2.1,3.1])rails.push({p:[x,y,z],s:[5.1,.027,.027],ry:p.yaw});}}
 for(let row=0;row<4;row++)for(let i=0;i<65;i++)seats.push({p:[-22.5+i*.70,.89+row*.7,67+row*2.1],s:[.52,.20,.58],color:['#4d8083','#afbcaf','#688b90'][i%3]});
 batch(g,'circuit-catch-fence-posts',surface('#748681',.65,.4),poles);batch(g,'circuit-catch-fence-wires',surface('#84928d',.6,.6),rails);batch(g,'grandstand-seats',surface('#ffffff',.08,.7),seats);
 box(g,surface('#606b6e',.04,.88),[84,.035,7],[0,-.019,-56],.001,'pit-lane');for(const z of [-52.7,-59.3])box(g,surface('#e1d58e'),[84,.016,.08],[0,.010,z],.001,'pit-lane-lines');
 for(let i=0;i<8;i++){const x=-28+i*7;box(g,surface('#557d83',.35,.28),[5.6,1.2,.05],[x,4.25,-62.43],.01,'pit-control-glass');lights.push({p:[x,3.1,-62.30],s:[4.8,.10,.15]});}batch(g,'pit-work-lights',new T.MeshStandardMaterial({color:'#e5ecde',emissive:'#c8e0d6',emissiveIntensity:.8}),lights);
}
function location(g:T.Group,o:Options){
 const {kind,seed,timeOfDay}=o,rng=random(seed+61),lit=timeOfDay!=='day',steel=surface('#788b8a',.55,.45),stone=surface('#a4aea3',.05,.8);
 if(kind==='highway'){
  for(const x of [-68,47]){for(const z of [-8.5,8.5])rod(g,steel,[x,0,z],[x,7.2,z],.12);rod(g,steel,[x,7.2,-8.5],[x,7.2,8.5],.13);for(const z of [-4.7,4.7]){box(g,surface('#345f5f'),[.14,1.25,3.65],[x,6.48,z],.04,'direction-board');for(const dz of [-.8,.5]){box(g,surface('#d7e0cf'),[.018,.38,.065],[x-.08,6.44,z+dz],.001,'direction-arrow');box(g,surface('#d7e0cf'),[.018,.07,.60],[x-.08,6.72,z+dz+.15],.001,'direction-arrow');}}}
  const shrubs:V3[]=[];for(let i=0;i<65;i++)shrubs.push([-125+i*4,0,(i%2?1:-1)*(25+rng()*30)]);trees(g,shrubs);
 }else if(kind==='coast'){
  const rocks:Instance[]=[];for(let i=0;i<70;i++)rocks.push({p:[-135+i*4,-.02,-23+rng()*3],s:[1.1+rng(),.65+rng(),.8+rng()],ry:rng()*6});instances(g,'coastal-rock-armour',new T.IcosahedronGeometry(1,1),surface('#8d9995'),rocks);
  for(let x=-110;x<120;x+=12){box(g,stone,[.25,.65,.25],[x,.325,scenicOffset(x,kind)-6.55],.02,'promenade-post');rod(g,steel,[x,.8,scenicOffset(x,kind)-6.55],[x+11.8,.8,scenicOffset(x+11.8,kind)-6.55],.027);}
 }else if(['mountain','canyon','desert','forest','snow','rally'].includes(kind)){
  const boulders:Instance[]=[],grass:Instance[]=[];
  for(let i=0;i<65;i++){const x=-138+rng()*276,side=i%2?1:-1,z=scenicOffset(x,kind)+side*(9+rng()*10),size=.20+Math.pow(rng(),2)*1.4;boulders.push({p:[x,size*.27,z],s:[size,size*.7,size*.8],ry:rng()*6,color:kind==='snow'?'#c8d3cc':kind==='desert'||kind==='canyon'?'#aa9178':'#8b9688'});if(!['snow','desert'].includes(kind))grass.push({p:[x,.20,z+side*1.2],s:[.30,.40,.30],ry:rng()*6,color:['#73856a','#8a956e','#576d57'][i%3]});}
  instances(g,'roadside-boulder-clusters',new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#ffffff',roughness:.96,flatShading:true}),boulders);instances(g,'verge-plants',new T.ConeGeometry(1,1,5),surface('#ffffff'),grass);
  if(kind==='snow'){const stakes:Instance[]=[];for(let x=-115;x<120;x+=10)for(const sign of [-1,1])stakes.push({p:[x,.95,scenicOffset(x,kind)+sign*6.4],s:[.045,1.9,.045],color:'#b38466'});batch(g,'snow-depth-poles',surface('#ffffff'),stakes);}
 }else if(kind==='tunnel'){
  const ribs:Instance[]=[],panels:Instance[]=[];for(let x=-116;x<120;x+=6){for(let a=.18;a<Math.PI-.1;a+=.18){const z=Math.cos(a)*7.12,y=Math.sin(a)*7.12;panels.push({p:[x,y,z],s:[.10,.13,.13]});}for(const z of [-6.25,6.25])ribs.push({p:[x,.63,z],s:[.60,.11,.03],color:x%12===0?'#bd8a6c':'#bcc9bf'});}batch(g,'tunnel-segment-joints',surface('#55676c'),panels);batch(g,'tunnel-guidance-reflectors',surface('#ffffff',.2,.3),ribs);
  for(const x of [-72,0,72]){box(g,surface('#486e62'),[1.2,2.1,.06],[x,1.05,-6.92],.02,'tunnel-service-door');box(g,new T.MeshStandardMaterial({color:'#b5dbb7',emissive:'#88c49c',emissiveIntensity:1.5}),[.65,.20,.08],[x,2.4,-6.88],.01,'exit-marker');}
 }else if(kind==='bridge'){
  for(const z of [-7.0,7.0])for(let x=-117;x<120;x+=3){rod(g,steel,[x,.65,z],[x,1.55,z],.022);rod(g,steel,[x,1.55,z],[x+3,1.55,z],.025);}for(const x of [-90,0,90])for(const z of [-6.8,6.8])rod(g,steel,[x,.5,z],[x,7,z],.08);
 }else if(kind==='industrial'||kind==='harbour'){
  const frames:Instance[]=[],marks:Instance[]=[];for(let x=-108;x<115;x+=18){for(const sign of [-1,1]){frames.push({p:[x,.45,sign*10],s:[1.5,.9,.18],color:'#a7a56e'});for(let j=0;j<4;j++)marks.push({p:[x+j*.7,.012,sign*8.5],s:[.25,.018,2.5]});}}batch(g,'yard-safety-bollards',surface('#ffffff'),frames);batch(g,'loading-zone-hatching',surface('#c6b477'),marks);
  if(kind==='industrial')for(let i=0;i<7;i++){const x=-100+i*33;for(const sign of [-1,1]){for(const y of [5.5,6.2])box(g,surface('#657e82',.3,.25),[23,.38,.04],[x,y,sign*13.94],.006,'warehouse-clerestory');box(g,steel,[5,.55,4],[x,7.45,sign*23],.03,'warehouse-roof-vent');}}
  else{box(g,surface('#8a9893'),[260,.65,.65],[0,-.02,-17.8],.015,'quay-retaining-edge');for(let i=0;i<6;i++){const x=-110+i*42;rod(g,steel,[x,.5,-27],[x,6,-27],.055);rod(g,steel,[x,5,-27],[x+5,5,-27],.035);}}
 }else if(kind==='parking'||kind==='airfield'){
  const lamps:Instance[]=[],bases:Instance[]=[];for(let x=-115;x<120;x+=8)for(const sign of [-1,1]){const z=sign*(kind==='airfield'?17.4:46);lamps.push({p:[x,.12,z],s:[.14,.16,.14]});bases.push({p:[x,.035,z],s:[.30,.07,.30]});}batch(g,'edge-light-bases',steel,bases);batch(g,'edge-light-lenses',new T.MeshStandardMaterial({color:'#a6c4d1',emissive:'#87b5c9',emissiveIntensity:lit?2:.25}),lamps);
  if(kind==='airfield'){for(let i=0;i<4;i++){const x=-75+i*50,sign=i%2?1:-1;box(g,steel,[30,.23,.17],[x,8.4,sign*42.0],.008,'hangar-door-header');}rod(g,steel,[45,16.8,-45],[45,21,-45],.09);rod(g,steel,[41,20,-45],[49,20,-45],.04);}
  else{const pavers:Instance[]=[];for(let x=-112;x<115;x+=3)for(const sign of [-1,1])pavers.push({p:[x,.012,sign*39],s:[2.92,.018,.12]});batch(g,'parking-footpaths',stone,pavers);}
 }else if(kind==='garage'||kind==='showroom'){
  const joints:Instance[]=[],rafters:Instance[]=[],trim:Instance[]=[];
  for(let x=-14;x<=14;x+=2)joints.push({p:[x,.006,0],s:[.012,.008,25.8]});for(let z=-12;z<=12;z+=2)joints.push({p:[0,.006,z],s:[29.8,.008,.012]});
  batch(g,'floor-tile-joints',surface(kind==='garage'?'#586a70':'#8faaa7'),joints);
  for(const x of [-13,-6.5,6.5,13])rafters.push({p:[x,6.55,-3.3],s:[.16,.22,18]});batch(g,'open-set-ceiling-structure',steel,rafters);
  if(kind==='garage'){
   for(const x of [-10,10]){box(g,steel,[.25,3.5,.30],[x,1.75,-8],.02,'stored-service-lift');box(g,surface('#527d82'),[2.6,.18,.18],[x,2.8,-8],.02,'lift-crossarm');for(let j=0;j<8;j++)box(g,steel,[.30,.035,.025],[x-1.0+j*.30,1.8,-12.70],.004,'tool-wall-hooks');}
   box(g,surface('#557e83'),[29,.45,.045],[0,3.15,-12.83],.005,'workshop-wall-band');
   for(const x of [-7,7])box(g,steel,[.25,3.5,.30],[x,1.75,-8],.02,'lift-paired-post');
   for(const x of [-11,10]){box(g,surface('#73827d'),[2.8,1.25,.30],[x,2.15,-12.72],.01,'workshop-pegboard');for(let j=0;j<8;j++)rod(g,steel,[x-1.1+j*.3,1.85,-12.52],[x-1.1+j*.3,2.4,-12.52],.018);}
   for(let i=0;i<10;i++){box(g,surface('#86968d'),[.15,.20,.15],[-10+i*.22,1.05,-8],.01,'bench-components');}
  }else{
   for(const x of [-9,9])mesh(g,new T.CylinderGeometry(3.3,3.3,.06,64),surface('#bbc9c4',.25,.32),[x,.032,-6],[0,0,0],'secondary-display-pad');
   for(const x of [-10,10])box(g,steel,[.06,2.5,.06],[x,1.25,12.67],.004,'glass-door-handle');
   for(const z of [-10.8,10.8])box(g,new T.MeshStandardMaterial({color:'#c9e7e0',emissive:'#a8ccc4',emissiveIntensity:.6}),[27,.035,.035],[0,.23,z],.003,'architectural-light-strip');
  }
 }else if(kind==='suburb'){
  const details:Instance[]=[],hedges:Instance[]=[];for(let i=0;i<12;i++)for(const sign of [-1,1]){const x=-110+i*20,z=sign*15.94;details.push({p:[x,1.25,z],s:[1.2,2.5,.10],color:'#637971'});details.push({p:[x,2.63,z-sign*.75],s:[2.0,.16,1.65],color:'#c6c5b4'});hedges.push({p:[x+4,.65,sign*12],s:[2.3,1.3,1.1],color:['#5c785d','#758d67'][i%2]});}batch(g,'house-porches-and-doors',surface('#ffffff'),details);batch(g,'garden-hedges',surface('#ffffff'),hedges);
 }else if(kind==='service-station'){
  const panels:Instance[]=[],islands:Instance[]=[];for(const x of [-13,-5,5,13]){islands.push({p:[x,.065,-21],s:[3.4,.13,7.0]});panels.push({p:[x,5.82,-23.5],s:[5.5,.09,7.5]});}batch(g,'pump-protection-islands',stone,islands);batch(g,'canopy-light-panels',new T.MeshStandardMaterial({color:'#e2e7d2',emissive:'#c9e1d0',emissiveIntensity:lit?1.4:.4}),panels);for(const x of [-14,-7,0,7,14])box(g,steel,[.08,2.8,.08],[x,1.8,-38.40],.008,'shopfront-mullion');
 }
 if(lit&&['city','industrial','harbour','service-station'].includes(kind))for(const x of kind==='service-station'?[-13,13]:[-70,-30,10]){const light=new T.PointLight('#f0d6ac',70,23,2);light.position.set(x,5,kind==='service-station'?-21:7);g.add(light);}
}
export function enhanceEnvironment(root:T.Group,opts:Options,route:(d:number)=>RoutePose,length:number){
 const removed:T.Object3D[]=[];root.traverse(o=>{if(['rock-peaks','snow-caps','sand-dunes','canyon-wall'].includes(o.name))removed.push(o);});for(const o of removed){o.removeFromParent();disposeObject(o);}
 const g=new T.Group();g.name='environment-detail';g.userData={revision:'scenic-depth',seed:opts.seed};root.add(g);
 if(!['garage','showroom'].includes(opts.kind))sky(g,opts.timeOfDay);
 relief(g,opts.kind,opts.seed);grasses(g,opts.kind,opts.seed);roadsides(g,opts.kind,route);
 if(opts.kind==='city')urban(g,root,opts.seed,opts.timeOfDay!=='day');
 if(opts.kind==='track')circuitDetails(g,route,length);else location(g,opts);
 refineSurfaces(root,opts.seed);
}
