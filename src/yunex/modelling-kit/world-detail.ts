import * as T from 'three';
import {box,rod,surface} from '../world-kit/geometry.ts';
import {instances,random} from '../world-kit/scenery.ts';
import type {Instance} from '../world-kit/scenery.ts';
import type {EnvironmentOptions} from '../world-kit/environments.ts';
import {scenicOffset} from '../world-kit/world-catalog.ts';
/** Additive location-specific dressing, outside the route. Repeated detail is instanced. */
export function premiumWorldDetail(root:T.Group,o:EnvironmentOptions,hero:boolean){
 const g=new T.Group();g.name='premium-world-detail';root.add(g);
 const steel=surface('#687780',.65,.36),concrete=surface('#a4a396',.02,.88),dark=surface('#23313b',.08,.68);
 const batch=(name:string,items:Instance[],mat:T.Material=steel,geo:T.BufferGeometry=new T.BoxGeometry())=>instances(g,name,geo,mat,items);
 const rng=random((o.seed??12)+702),night=o.timeOfDay==='night';
 // World-space planar UVs keep the existing relief silhouette/route exactly intact.
 const relief=root.getObjectByName('terrain-relief') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>|undefined;
 if(relief){
  const pos=relief.geometry.getAttribute('position'),uv=new Float32Array(pos.count*2),data=new Uint8Array(64*64*4),noise=random((o.seed??12)+521);
  for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)/14;uv[i*2+1]=pos.getZ(i)/14;}
  relief.geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const k=(y*64+x)*4,v=Math.round(145+Math.sin(y*.65+Math.sin(x*.18))*24+noise()*35);data[k]=data[k+1]=data[k+2]=v;data[k+3]=255;}
  const texture=new T.DataTexture(data,64,64,T.RGBAFormat);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
  relief.material.bumpMap=texture;relief.material.bumpScale=o.kind==='snow'?.035:.12;relief.material.roughnessMap=texture;relief.material.roughness=1;relief.material.needsUpdate=true;
 }

 if(o.kind==='highway'){
  const bridge=new T.Group();bridge.name='motorway-overpass';g.add(bridge);
  box(bridge,concrete,[9,.85,39],[49,6.4,0],.05,'overpass-deck');
  for(const z of [-12,12])box(bridge,concrete,[2.2,5.95,1.2],[49,2.98,z],.08,'overpass-pier');
  for(const x of [44.6,53.4])box(bridge,steel,[.12,.70,39],[x,7.18,0],.01,'bridge-parapet');
  const arrows:Instance[]=[],reflectors:Instance[]=[];
  for(const z of [-4.8,4.8]){
   arrows.push({p:[30.935,6.12,z],s:[.018,.55,.065]});
   // Real triangular arrow heads on the upstream face of the existing sign.
   const head=new T.Mesh(new T.ConeGeometry(.16,.23,3),surface('#e5e9dc'));head.name='gantry-arrowhead';head.position.set(30.92,5.8,z);head.rotation.x=Math.PI;g.add(head);
   for(const y of [5.64,6.65])box(g,steel,[.05,.035,3.38],[30.93,y,z],0,'sign-border');
  }
  batch('gantry-direction-arrows',arrows,surface('#e5e9dc'));
  for(let x=-106;x<110;x+=6)for(const side of [-1,1])reflectors.push({p:[x,.7,side*7.72],s:[.15,.08,.025],color:side<0?'#d9dfcc':'#dba55e'});
  batch('barrier-reflectors',reflectors,surface('#ffffff',.3,.3));
  const panels:Instance[]=[],frames:Instance[]=[],bolts:Instance[]=[];
  for(let x=-106;x<110;x+=4)for(const side of [-1,1]){
   if(Math.abs(x-49)<7)continue;
   for(let j=0;j<3;j++)panels.push({p:[x,1+j*.65,side*11],s:[3.86,.61,.11],color:['#536d67','#607c72','#698578'][j]});
   frames.push({p:[x-2,1.50,side*11],s:[.12,3,.18]});
   if(hero)for(const y of [.35,2.65])bolts.push({p:[x-2,y,side*10.89],s:[.07,.07,.035]});
  }
  batch('motorway-acoustic-panels',panels,surface('#ffffff',.08,.78));batch('acoustic-uprights',frames);if(bolts.length)batch('acoustic-fasteners',bolts);
 }else if(o.kind==='city'){
  const mullions:Instance[]=[],awnings:Instance[]=[],shopglass:Instance[]=[],signals:Instance[]=[];
  // Read the actual seeded building matrices: frontages must never float on an invented grid.
  const buildings=root.getObjectByName('buildings') as T.InstancedMesh,matrix=new T.Matrix4();
  for(let i=0;i<(buildings?.count??0);i++){
   buildings.getMatrixAt(i,matrix);const e=matrix.elements,x=e[12],side=Math.sign(e[14]),z=e[14]-side*(Math.abs(e[10])/2+.045),w=Math.abs(e[0])*.82;
   shopglass.push({p:[x,1.65,z],s:[w,2.7,.06],color:i%2?'#36545a':'#46656b'});
   for(let j=0;j<5;j++)mullions.push({p:[x-w/2+j*w/4,1.65,z-side*.06],s:[.07,2.9,.10]});
   awnings.push({p:[x,3.2,z-side*.42],s:[w+.3,.16,.9],color:['#566c5c','#845747','#3d6473'][i%3]});
  }
  for(const x of [-64,-28,8,44,80])for(const side of [-1,1]){
   rod(g,steel,[x,0,side*6.65],[x,3.8,side*6.65],.06).name='signal-post';
   box(g,dark,[.24,.82,.30],[x,3.6,side*6.65],.04,'traffic-signal');
   signals.push({p:[x+.126,3.40,side*6.65],s:[.018,.15,.15]});
  }
  batch('shopfront-mullions',mullions);batch('shopfront-awnings',awnings,surface('#ffffff'));batch('street-level-glazing',shopglass,new T.MeshStandardMaterial({color:'#ffffff',metalness:.35,roughness:.22,emissive:night?'#6d9387':'#000000',emissiveIntensity:.45}));
  batch('signal-green-lenses',signals,new T.MeshStandardMaterial({color:'#66cfa1',emissive:'#32c875',emissiveIntensity:2}));
 }else if(o.kind==='track'){
  const seats:Instance[]=[],backs:Instance[]=[],stairs:Instance[]=[];
  for(let row=0;row<4;row++)for(let col=0;col<52;col++){
   const x=-21.8+col*.85;if(Math.abs(x)<1.4||Math.abs(x-12)<.7||Math.abs(x+12)<.7)continue;
   seats.push({p:[x,.84+row*.7,67+row*2.1],s:[.65,.10,.64],color:col%8<4?'#466c78':'#adaca0'});
   backs.push({p:[x,1.09+row*.7,67.31+row*2.1],s:[.65,.45,.09],color:col%8<4?'#466c78':'#adaca0'});
  }
  for(const x of [-12,0,12])for(let i=0;i<8;i++)stairs.push({p:[x,.08+i*.35,66.2+i*1.05],s:[1.1,.16,1.05]});
  batch('grandstand-seats',seats,surface('#ffffff',.05,.62));batch('grandstand-seat-backs',backs,surface('#ffffff',.05,.62));batch('grandstand-access-steps',stairs,concrete);
  const tyres:Instance[]=[],seams:Instance[]=[],garage:Instance[]=[];
  for(let x=-30;x<=30;x+=.75)for(let row=0;row<3;row++)tyres.push({p:[x,.16+row*.32,56],s:[.68,.31,.68]});
  batch('circuit-tyre-stacks',tyres,surface('#1d272c',.02,.92),new T.CylinderGeometry(.5,.5,1,hero?16:8));
  for(let i=0;i<8;i++){
   const x=-28+i*7;
   for(let j=0;j<7;j++)seams.push({p:[x, .32+j*.36,-62.405],s:[4.65,.018,.018]});
   garage.push({p:[x,3.05,-61.8],s:[5.8,.20,1.3],color:i%2?'#296e72':'#9c4c46'});
  }
  batch('pit-shutter-seams',seams);batch('pit-box-canopies',garage,surface('#ffffff',.12,.47));
 }else if(['mountain','canyon','coast','forest','rally','snow','desert'].includes(o.kind)){
  const stones:Instance[]=[],caps:Instance[]=[],kind=o.kind;
  for(let x=-110;x<112;x+=1.3){const z=scenicOffset(x,kind)+8.3;for(let row=0;row<4;row++)stones.push({p:[x+(row%2)*.25,.20+row*.36,z],s:[1.22,.34,.65],ry:0,color:['#777e72','#8d9080','#939384'][Math.floor(rng()*3)]});caps.push({p:[x,1.52,z],s:[1.29,.13,.78]});}
  const buttresses:Instance[]=[];
  for(let x=-108;x<110;x+=8)buttresses.push({p:[x,.66,scenicOffset(x,kind)+8.8],s:[.65,1.32,1.5]});
  batch('retaining-buttresses',buttresses,concrete);
  batch('retaining-wall',stones,surface('#ffffff',.02,.98));batch('wall-coping',caps,concrete);
 }else if(o.kind==='garage'){
  const floor:Instance[]=[];
  for(let x=-12;x<=12;x+=3)floor.push({p:[x,.012,-8],s:[.018,.012,7]});
  for(const z of [-11,-8,-5])floor.push({p:[0,.012,z],s:[25,.012,.018]});
  batch('workshop-floor-seams',floor,surface('#59645f',.2,.5));
  for(const x of [-9,-4,4,9])box(g,steel,[2.8,.065,1.1],[x,1.04,-10.8],.02,'steel-worktop');
  const drawers:Instance[]=[],handles:Instance[]=[],cans:Instance[]=[];
  for(const x of [-9,-4,4,9]){
   box(g,dark,[2.5,1.0,.75],[x,.50,-10.8],.04,'workshop-tool-chest');
   for(let j=0;j<5;j++){drawers.push({p:[x,.16+j*.18,-10.40],s:[2.3,.155,.025]});handles.push({p:[x,.19+j*.18,-10.35],s:[.65,.022,.035]});}
   for(let j=0;j<4;j++)cans.push({p:[x-.9+j*.3,1.12,-10.8],s:[.13,.25,.13],color:j%2?'#b99455':'#56747f'});
  }
  batch('workshop-drawers',drawers,surface('#426970',.32,.40));batch('drawer-handles',handles);batch('workshop-service-cans',cans,surface('#ffffff'),new T.CylinderGeometry(.5,.5,1,12));
 }else if(o.kind==='showroom'){
  const inlays:Instance[]=[];
  for(let x=-12;x<=12;x+=3)inlays.push({p:[x,.012,-5],s:[.018,.01,14]});
  for(let z=-11;z<=2;z+=3)inlays.push({p:[0,.012,z],s:[26,.01,.018]});
  batch('showroom-floor-inlays',inlays,surface('#788982',.45,.26));
  const baffles:Instance[]=[],panels:Instance[]=[];
  for(let i=0;i<28;i++)baffles.push({p:[-13.5+i,4.4,-12.6],s:[.12,4.6,.35]});
  for(const x of [-7,0,7])panels.push({p:[x,6.15,-1],s:[4.5,.06,8]});
  batch('showroom-light-baffles',baffles,surface('#677c77',.32,.48));batch('showroom-softbox-panels',panels,new T.MeshStandardMaterial({color:'#d9e8e6',emissive:'#d5e6e2',emissiveIntensity:.85}));
 }
 g.userData.quality=hero?'hero':'standard';
}
