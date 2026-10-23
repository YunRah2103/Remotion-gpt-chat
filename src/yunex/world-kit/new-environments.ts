/** Generic reusable locations. Road surfaces stay at y=0 for all vehicle types. */
import * as T from 'three';
import {box,mesh,rod,surface} from './geometry.ts';import type {V3} from './geometry.ts';
import {instances,trees,random} from './scenery.ts';import type {Instance} from './scenery.ts';
import {createProp} from './props.ts';import type {PropKind} from './props.ts';
import {environmentSpec,scenicOffset,isScenic} from './world-catalog.ts';
import type {EnvironmentKind,TimeOfDay} from './catalog.ts';
type BuildOptions={kind:EnvironmentKind;seed:number;timeOfDay:TimeOfDay};
function prop(g:T.Group,kind:PropKind,p:V3,ry=0,lit=false){const o=createProp({kind,lit});o.position.set(...p);o.rotation.y=ry;g.add(o);return o;}
function ground(g:T.Group,color:string,y=-.12){box(g,surface(color),[520,.12,520],[0,y-.06,0],.001,'terrain');}
function road(g:T.Group,kind:string,width=10){
 const curved=isScenic(kind),pos:number[]=[],idx:number[]=[],lines:Instance[]=[];
 const offset=(x:number)=>curved?scenicOffset(x,kind):0;
 for(let i=0;i<=120;i++){const x=-120+i*2,z=offset(x);pos.push(x,0,z-width/2,x,0,z+width/2);if(i<120){const j=i*2;idx.push(j,j+1,j+2,j+1,j+3,j+2);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,surface(kind==='rally'?'#8e826c':'#3e484e',.02,.94),[0,0,0],[0,0,0],'road');
 for(let x=-118;x<119;x+=4){const z=offset(x),ry=-Math.atan((offset(x+.1)-offset(x-.1))/.2);for(const side of [-1,1])lines.push({p:[x,.012,z+side*(width/2-.25)],s:[4.1,.018,.11],ry});if(Math.round(x/4)%2===0)lines.push({p:[x,.013,z],s:[2.4,.018,.10],ry});}
 if(kind==='rally')return;
 instances(g,'lane-markings',new T.BoxGeometry(),surface(kind==='snow'?'#c5b368':'#dbddcf'),lines);
}
function rocks(g:T.Group,rng:()=>number,items:number,snow=false){
 const base:Instance[]=[],caps:Instance[]=[];
 for(let i=0;i<items;i++){const x=(rng()-.5)*245,sign=i%2?1:-1,z=sign*(55+rng()*65),h=12+rng()*40,r=12+rng()*22;base.push({p:[x,h/2-2,z],s:[r,h,r*.8],ry:rng()*6,color:i%2?'#858a82':'#777e77'});if(snow)caps.push({p:[x,h-2-h*.18,z],s:[r*.36,h*.36,r*.288],ry:base[i].ry});}
 instances(g,'rock-peaks',new T.ConeGeometry(1,1,7),surface('#ffffff',.02,.95),base);if(snow)instances(g,'snow-caps',new T.ConeGeometry(1,1,7),surface('#e0e7e5'),caps);
}
function scenic(g:T.Group,{kind,seed}:BuildOptions){
 const rng=random(seed),winter=kind==='snow';
 if(kind==='coast')box(g,surface('#b6b093'),[520,.12,285],[0,-.18,117.5],.001,'coastal-land');else ground(g,environmentSpec(kind).ground);road(g,kind);
 if(kind==='coast'){
  box(g,surface('#4b899b',.28,.31),[520,.10,230],[0,-.38,-140],.002,'sea');
  const foam:Instance[]=[];for(let x=-120;x<130;x+=8)foam.push({p:[x,-.30,-25.5+(Math.sin(x*.1)*.7)],s:[6,.02,.24]});instances(g,'shore-foam',new T.BoxGeometry(),surface('#e1dfc7'),foam);
  for(let i=0;i<15;i++)prop(g,'palm-tree',[-110+i*15,0,i%2?15+(i%3)*2:-17]);
  const rails:Instance[]=[];for(let x=-118;x<120;x+=4)rails.push({p:[x,.40,scenicOffset(x,kind)-6.4],s:[4.1,.8,.35],ry:-Math.atan((scenicOffset(x+.1,kind)-scenicOffset(x-.1,kind))/.2)});instances(g,'coastal-wall',new T.BoxGeometry(),surface('#b6b4a3'),rails);
  for(let i=0;i<4;i++)prop(g,'bench',[-90+i*48,0,11],Math.PI/2);
 }else if(kind==='mountain'){
  rocks(g,rng,28,true);const rail:Instance[]=[];for(let x=-118;x<120;x+=4)rail.push({p:[x,.42,scenicOffset(x,kind)-6.4],s:[4.1,.84,.45],ry:-Math.atan((scenicOffset(x+.1,kind)-scenicOffset(x-.1,kind))/.2)});instances(g,'pass-retaining-wall',new T.BoxGeometry(),surface('#9c9f92'),rail);
  trees(g,Array.from({length:40},(_,i)=>[-117+i*6,0,scenicOffset(-117+i*6,kind)+13+(i%5)*2]));
 }else if(kind==='forest'||winter){
  const forest:V3[]=[];for(let i=0;i<150;i++){const x=(rng()-.5)*260,z=scenicOffset(x,kind)+(i%2?1:-1)*(10+rng()*44);forest.push([x,0,z]);}trees(g,forest,winter);
  if(winter){rocks(g,rng,14,true);const banks:Instance[]=[];for(let x=-118;x<120;x+=5)for(const side of [-1,1])banks.push({p:[x,.10,scenicOffset(x,kind)+side*5.65],s:[5.2,.45,1.2],ry:-Math.atan((scenicOffset(x+.1,kind)-scenicOffset(x-.1,kind))/.2)});instances(g,'ploughed-snow-banks',new T.BoxGeometry(),surface('#e7ece7'),banks);}
  else{const stones:Instance[]=[];for(let i=0;i<35;i++){const x=(rng()-.5)*240;stones.push({p:[x,.28,scenicOffset(x,kind)+(i%2?1:-1)*(8+rng()*3)],s:[.8+rng(),.7+rng()*.3,.9]});}instances(g,'roadside-stones',new T.IcosahedronGeometry(1,0),surface('#899183'),stones);}
 }else{
  const dunes:Instance[]=[];for(let i=0;i<32;i++)dunes.push({p:[(rng()-.5)*270,-2,(i%2?1:-1)*(55+rng()*65)],s:[14+rng()*22,5+rng()*8,12+rng()*18],color:i%2?'#c4a179':'#d0ad80'});instances(g,'sand-dunes',new T.SphereGeometry(1,16,8),surface('#ffffff'),dunes);
  for(let i=0;i<16;i++){const x=-113+i*15,z=(i%2?1:-1)*(14+rng()*6);rod(g,surface('#6b805b'),[x,0,z],[x,2.3,z],.16);rod(g,surface('#6b805b'),[x,1.1,z],[x+.52,1.1,z],.12);rod(g,surface('#6b805b'),[x+.52,1.1,z],[x+.52,1.8,z],.12);}
 }
 for(let i=0;i<5;i++){const x=-95+i*44;prop(g,'road-sign',[x,0,scenicOffset(x,kind)+7],-Math.PI/2);}
}
function tunnel(g:T.Group,night:boolean){
 ground(g,'#47515a');road(g,'tunnel',12);
 // An open semicylinder along X: the road stays open at each end and clear above 6m.
 mesh(g,new T.CylinderGeometry(7.2,7.2,240,48,1,true,0,Math.PI),new T.MeshStandardMaterial({color:'#737f82',roughness:.82,side:T.DoubleSide}),[0,0,0],[0,0,Math.PI/2],'tunnel-vault');
 for(const z of [-6.25,6.25])box(g,surface('#909b95'),[240,.50,.35],[0,.25,z],.01,'tunnel-curb');
 const bars:Instance[]=[],wall:Instance[]=[];for(let x=-116;x<120;x+=8){for(const z of [-4.1,4.1])bars.push({p:[x,5.4,z],s:[2.8,.10,.16]});for(const z of [-6.77,6.77])wall.push({p:[x,1.0,z],s:[4,.12,.07]});}
 instances(g,'tunnel-ceiling-lights',new T.BoxGeometry(),new T.MeshStandardMaterial({color:'#ecf1df',emissive:'#ddeccc',emissiveIntensity:3}),bars);instances(g,'wall-reflectors',new T.BoxGeometry(),surface('#d8bb69'),wall);
 // Local lights illuminate the actual meshes, not just the lamp lens material.
 for(let x=-90;x<110;x+=24){const light=new T.PointLight('#dceeff',night?60:30,24,2);light.position.set(x,5.3,0);g.add(light);}
}
function bridge(g:T.Group){
 ground(g,'#527d90',-14);road(g,'bridge',13);box(g,surface('#9baba9',.1),[240,.70,14],[0,-.37,0],.01,'bridge-deck');
 for(const z of [-7.0,7.0]){box(g,surface('#b4b9b1',.3),[240,.90,.30],[0,.45,z],.01,'deck-rail');for(const x of [-45,45]){box(g,surface('#a6b2ae'),[2.5,32,1.3],[x,5,z],.03,'bridge-tower');for(let end=-108;end<=108;end+=18)if(Math.abs(end-x)<75)rod(g,surface('#c3cbc2',.45),[x,20,z],[end,1,z],.055);}}
 for(const x of [-45,45])box(g,surface('#a6b2ae'),[2.5,1.1,15.5],[x,16,0],.025,'tower-crossbeam');
 const ripples:Instance[]=[];for(let i=0;i<50;i++)ripples.push({p:[-130+i*5,-13.95,(i%2?1:-1)*(20+i%7*7)],s:[3,.02,.15]});instances(g,'water-ripples',new T.BoxGeometry(),surface('#80a4ac',.2,.4),ripples);
}
function industrial(g:T.Group,lit:boolean){
 ground(g,'#7c8079');road(g,'industrial',12);
 const walls=surface('#919c99'),roof=surface('#64797c',.3),door=surface('#4a626b');
 for(let i=0;i<7;i++){const x=-100+i*33;for(const sign of [-1,1]){box(g,walls,[25,7,18],[x,3.5,sign*23],.03,'warehouse');box(g,roof,[26,.22,19],[x,7.1,sign*23],.02,'warehouse-roof');for(const dx of [-7,0,7])box(g,door,[5.1,4.6,.055],[x+dx,2.31,sign*13.97],.01,'loading-door');}}
 for(let i=0;i<12;i++){const x=-105+i*18,z=(i%2?1:-1)*41,mat=surface(['#738d8a','#ad775b','#667c98'][i%3],.25);box(g,mat,[11.8,2.6,2.5],[x,1.30,z],.02,'shipping-container');for(let j=0;j<10;j++)box(g,mat,[.055,2.5,.06],[x-5+j*1.1,1.3,z+1.27],.005,'container-rib');}
 for(let i=0;i<10;i++)prop(g,'crate',[-100+i*20,0,10]);for(let i=0;i<7;i++)prop(g,'streetlight',[-96+i*32,0,-9],Math.PI,lit);
}
function parking(g:T.Group,lit:boolean){
 ground(g,'#828b84');box(g,surface('#5c686d',.02,.95),[240,.10,100],[0,-.05,0],.002,'parking-asphalt');
 const marks:Instance[]=[],stops:Instance[]=[];
 for(let x=-110;x<115;x+=3.6)for(const sign of [-1,1]){for(const row of [11,29]){marks.push({p:[x,.012,sign*row],s:[.10,.015,6]});stops.push({p:[x+1.75,.11,sign*(row+2)],s:[2.3,.22,.20]});}}
 instances(g,'parking-bays',new T.BoxGeometry(),surface('#dfdfd1'),marks);instances(g,'wheel-stops',new T.BoxGeometry(),surface('#aea991'),stops);
 for(let i=0;i<7;i++){const x=-100+i*34;prop(g,'streetlight',[x,0,21],0,lit);prop(g,'charging-point',[x,0,-16]);box(g,surface('#b4b5a5'),[3,.16,5],[x,.08,21],.02,'landscape-island');}
 trees(g,Array.from({length:7},(_,i)=>[-100+i*34,0,21]));
}
function airfield(g:T.Group){
 ground(g,'#7f8b70');box(g,surface('#515e63',.02,.95),[270,.1,34],[0,-.05,0],.001,'runway');
 const marks:Instance[]=[];for(let x=-124;x<130;x+=10)marks.push({p:[x,.012,0],s:[5,.02,.32]});for(const z of [-16,16])marks.push({p:[0,.012,z],s:[270,.02,.18]});for(let i=-5;i<=5;i++)for(const x of [-105,105])marks.push({p:[x,.012,i*1.8],s:[12,.02,.70]});instances(g,'runway-markings',new T.BoxGeometry(),surface('#e1e4db'),marks);
 for(let i=0;i<4;i++){const x=-75+i*50,z=i%2?52:-52;box(g,surface('#a4aba2'),[32,9,20],[x,4.5,z],.04,'hangar');box(g,surface('#536e76'),[25,7,.06],[x,3.5,z-Math.sign(z)*10.03],.01,'hangar-door');}
 box(g,surface('#b4b7aa'),[5,14,5],[45,7,-45],.02,'control-tower');box(g,surface('#3f606d',.4,.25),[9,3,9],[45,15,-45],.05,'control-glazing');box(g,surface('#bec1b4'),[10,.30,10],[45,16.65,-45],.02,'tower-roof');
}
function indoor(g:T.Group,kind:string,lit:boolean){
 const workshop=kind==='garage';ground(g,'#a4ada7');box(g,surface(workshop?'#727e82':'#aeb9b7',.15,workshop?.7:.26),[30,.12,26],[0,-.06,0],.001,'display-floor');
 const walls=surface(workshop?'#b3b8ac':'#d1d8cf'),metal=surface('#52646c',.4),glow=new T.MeshStandardMaterial({color:'#f1f4dc',emissive:'#e1ecd8',emissiveIntensity:lit?3:1});
 // Open camera-side wall and roof: the set is framed for reusable vehicle shots.
 box(g,walls,[30,6.6,.22],[0,3.3,-13],.02,'rear-wall');box(g,walls,[.22,6.6,26],[-15,3.3,0],.02,'side-wall');
 for(const x of [-13,-6.5,6.5,13]){box(g,metal,[.18,6.4,.18],[x,3.2,-10.6],.01,'support-column');box(g,glow,[.18,.10,15],[x,6.35,-3.3],.01,'overhead-strip');}
 if(workshop){
  for(const x of [-10,0,10]){box(g,metal,[6.4,4.9,.06],[x,2.45,-12.85],.01,'service-door');for(let j=0;j<9;j++)box(g,surface('#879595'),[6.2,.025,.025],[x,.35+j*.52,-12.80],.003,'door-rib');}
  prop(g,'workbench',[-9,0,-8]);prop(g,'tool-cabinet',[-11,0,-8]);prop(g,'tool-cabinet',[10,0,-9]);for(let i=0;i<4;i++)prop(g,'tyre-stack',[8+i*.85,0,-7]);
  // Yellow service bay outline leaves ample space for the largest supplied truck.
  for(const z of [-2.0,2.0])box(g,surface('#ceb46a'),[10,.018,.08],[0,.009,z],.001,'bay-marking');for(const x of [-5,5])box(g,surface('#ceb46a'),[.08,.018,4],[x,.009,0],.001,'bay-marking');
 }else{
  for(let i=0;i<30;i++)box(g,surface(i%2?'#a6b4ac':'#bac5bd'),[.10,5.7,.12],[-14+i*.96,2.85,-12.78],.01,'wall-slat');
  const mat=new T.MeshPhysicalMaterial({color:'#94b3bb',metalness:.28,roughness:.18,transparent:true,opacity:.30,side:T.DoubleSide});
  for(const x of [-10,0,10]){box(g,mat,[8.8,5.7,.035],[x,2.85,12.7],.005,'display-glazing');box(g,metal,[.10,6,.10],[x-4.5,3,12.7],.005,'window-mullion');}
  for(const p of [[-11,0,-8],[11,0,-8]] as V3[]){mesh(g,new T.CylinderGeometry(.65,.48,.8,16),surface('#a6afa9'),[p[0],.40,p[2]]);mesh(g,new T.SphereGeometry(1,12,8),surface('#668a72'),[p[0],1.55,p[2]]);}
 }
 for(const x of [-7,7]){const light=new T.PointLight('#e4f2f4',45,25,2);light.position.set(x,5,-2);g.add(light);}
}

function extraLocation(g:T.Group,opts:BuildOptions){
 const {kind,timeOfDay}=opts,lit=timeOfDay!=='day';
 if(kind==='harbour'){
  box(g,surface('#a4a797'),[520,.12,280],[0,-.18,122],.001,'dock-land');box(g,surface('#527e8e',.25,.35),[520,.1,240],[0,-.45,-138],.001,'harbour-water');road(g,kind,12);
  for(let i=0;i<8;i++){const x=-110+i*30;box(g,surface('#7d8e8c'),[10,.4,16],[x,-.05,-23],.02,'jetty');const hull=box(g,surface(i%2?'#788f9d':'#ad9c79'),[8,.9,2.6],[x,.15,-34],.12,'moored-boat');box(g,surface('#d2d5c8'),[3.1,1.6,2.0],[x,1.1,-34],.08,'boat-cabin');prop(g,'bollard',[x-3,0,-12]);}
  for(const x of [-70,40]){const m=surface('#a58b58',.3);for(const z of [15,23])box(g,m,[.5,15,.5],[x,7.5,z],.02,'crane-leg');box(g,m,[2,1.5,32],[x,15,8],.03,'crane-jib');rod(g,m,[x,16,22],[x,16,-10],.14);rod(g,surface('#46565b'),[x,15,-8],[x,4,-8],.05);}
 }else if(kind==='suburb'){
  ground(g,'#829275');road(g,kind,11);const rng=random(opts.seed);
  for(let i=0;i<12;i++)for(const sign of [-1,1]){const x=-110+i*20,z=sign*20,colour=['#c0b89e','#b3bdaf','#b4b4b1'][i%3];box(g,surface(colour),[9,5.2,8],[x,2.6,z],.02,'house');mesh(g,new T.ConeGeometry(1,1,4),surface('#7d6b5e'),[x,6.45,z],[0,Math.PI/4,0],'pitched-roof').scale.set(7.4,2.5,6.3);for(const dx of [-2.4,2.4])box(g,surface('#5b7980',.3,.3),[1.7,1.5,.04],[x+dx,3.2,z-sign*4.03],.01,'house-window');box(g,surface('#727e75'),[3,.05,10],[x,-.025,sign*10],.002,'driveway');for(let j=0;j<12;j++)box(g,surface('#b8b4a0'),[.15,1.0,.12],[x-5.5+j,0.5,sign*12.5],.01,'garden-fence');}
  trees(g,Array.from({length:18},(_,i)=>[-114+i*13,0,(i%2?1:-1)*30]));
 }else if(kind==='canyon'){
  ground(g,'#b6977b');road(g,kind,10);const rng=random(opts.seed),r:T.Object3D[]=[];
  for(let i=0;i<38;i++){const x=-120+i*6.5;for(const sign of [-1,1]){const h=9+rng()*15;mesh(g,new T.IcosahedronGeometry(1,1),surface(i%2?'#ad8c72':'#be9d7f'),[x,h*.40,sign*(25+rng()*9)],[0,rng()*2,0],'canyon-wall').scale.set(10,h,9);}}
  for(let i=0;i<6;i++)prop(g,'road-sign',[-100+i*40,0,scenicOffset(-100+i*40,kind)+7],-Math.PI/2);
 }else if(kind==='rally'){
  ground(g,'#858566');road(g,kind,10);const rng=random(opts.seed);trees(g,Array.from({length:110},(_,i)=>{const x=(rng()-.5)*250;return [x,0,scenicOffset(x,kind)+(i%2?1:-1)*(12+rng()*40)];}));
  const gravel:Instance[]=[];for(let i=0;i<150;i++){const x=(rng()-.5)*240;gravel.push({p:[x,.008,scenicOffset(x,kind)+(rng()-.5)*8],s:[.10,.016,.08],color:i%2?'#b5aa8c':'#8e826a'});}instances(g,'gravel-speckles',new T.BoxGeometry(),surface('#ffffff'),gravel);
  for(let i=0;i<10;i++){const x=-100+i*22;prop(g,'barrier',[x,0,scenicOffset(x,kind)+6.4]);}
 }else{
  ground(g,'#929888');road(g,kind,12);box(g,surface('#a5aaa1'),[58,.08,34],[0,-.04,-25],.002,'forecourt');
  const beam=surface('#d4d6c6'),accent=surface('#4e9389',.25);for(const x of [-18,0,18])for(const z of [-16,-31])box(g,beam,[.45,5.9,.45],[x,2.95,z],.02,'fuel-canopy-column');box(g,beam,[42,.5,20],[0,6.1,-23.5],.03,'fuel-canopy');box(g,accent,[42,.22,.18],[0,6.15,-13.4],.01,'canopy-trim');
  for(const x of [-13,-5,5,13])prop(g,'fuel-pump',[x,0,-21],0,lit);for(const x of [-22,22])prop(g,'charging-point',[x,0,-12],0,lit);
  box(g,surface('#b5b9a9'),[35,4,9],[0,2,-43],.03,'service-shop');box(g,surface('#5b7e85',.25,.3),[31,2.4,.05],[0,1.6,-38.46],.01,'shopfront');for(const x of [-25,25])prop(g,'streetlight',[x,0,-13],Math.PI,lit);
 }
}

export function buildNewEnvironment(g:T.Group,opts:BuildOptions){
 const {kind,timeOfDay}=opts,lit=timeOfDay!=='day';
 if(['coast','mountain','forest','desert','snow'].includes(kind))scenic(g,opts);
 else if(kind==='tunnel')tunnel(g,lit);else if(kind==='bridge')bridge(g);else if(kind==='industrial')industrial(g,lit);else if(kind==='parking')parking(g,lit);else if(kind==='airfield')airfield(g);else if(kind==='garage'||kind==='showroom')indoor(g,kind,lit);else if(['suburb','harbour','canyon','rally','service-station'].includes(kind))extraLocation(g,opts);else throw new Error(`Unknown environment: ${kind}`);
}
