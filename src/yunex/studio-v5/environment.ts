import * as T from 'three';
import {createRoad,sampleRoad,roadGeometry} from './road.ts';
import type {Point,Road} from './road.ts';
import {createTerrain} from './terrain.ts';
import {batchScenery} from './batch.ts';
import {addNature,addArchitecture} from './scenery.ts';
export const PRESETS={
 mountain:{points:[[-140,0,-25],[-65,5,0],[0,9,22],[65,15,0],[115,22,-45],[170,24,-10],[240,28,25]],width:7.5,bank:.025,timeOfDay:'dusk',surface:'asphalt',vegetation:.35},
 circuit:{points:[[-170,0,0],[-90,0,0],[0,0,0],[70,.3,12],[125,1,55],[180,0,70],[250,0,40]],width:12,bank:.012,timeOfDay:'night',surface:'asphalt',vegetation:.05},
 city:{points:[[-180,0,-12],[-90,0,-8],[0,0,0],[90,0,8],[180,0,8],[270,0,-15]],width:10,bank:0,timeOfDay:'night',surface:'asphalt',vegetation:.1},
 rally:{points:[[-150,0,0],[-80,1,-20],[0,3,5],[60,5,28],[125,3,-5],[180,4,-24],[250,7,8]],width:6,bank:.018,timeOfDay:'day',surface:'gravel',vegetation:1},
} as const;
export type Preset=keyof typeof PRESETS;
export type StudioConfig={preset:Preset;road?:{points?:Point[];width?:number;bank?:number;roughness?:number};timeOfDay?:'day'|'dusk'|'night';weather?:'clear'|'wet';surface?:'asphalt'|'gravel';vegetation?:number;quality?:'preview'|'hero';seed?:number;scenery?:boolean;cameraSafeWidth?:number};
export function resolveConfig(input:StudioConfig){
 for(const k of Object.keys(input))if(!['preset','road','timeOfDay','weather','surface','vegetation','quality','seed','scenery','cameraSafeWidth'].includes(k))throw Error('Unknown V5 configuration key: '+k);
 if(!(input.preset in PRESETS))throw Error('Choose preset mountain, circuit, city or rally');
 const p=PRESETS[input.preset],c={...p,...input,road:{points:p.points.map(x=>[...x]) as Point[],width:p.width,bank:p.bank,roughness:input.preset==='rally'?.018:0,...input.road},quality:input.quality??'hero',weather:input.weather??(input.preset==='city'||input.preset==='circuit'?'wet':'clear'),seed:input.seed??37,scenery:input.scenery??true,cameraSafeWidth:input.cameraSafeWidth??12};
 for(const [key,choices] of Object.entries({timeOfDay:['day','dusk','night'],weather:['clear','wet'],surface:['asphalt','gravel'],quality:['preview','hero']}))if(!choices.includes(c[key as keyof typeof c] as string))throw Error('Invalid '+key);
 if(!Number.isFinite(c.vegetation)||c.vegetation<0||c.vegetation>1)throw Error('vegetation must be 0..1');
 if(!Number.isInteger(c.seed))throw Error('seed must be an integer');
 if(!Number.isFinite(c.cameraSafeWidth)||c.cameraSafeWidth<8||c.cameraSafeWidth>40)throw Error('cameraSafeWidth must be 8..40 metres');
 if(input.road)for(const key of Object.keys(input.road))if(!['points','width','bank','roughness'].includes(key))throw Error('Unknown road option '+key);
 return c;
}
export function random(seed:number){let n=seed>>>0;return()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};}
/** Source-authored deterministic aggregate; no external texture/licence dependencies. */
function roadMaterial(gravel:boolean,wet:boolean){
 const n=256,data=new Uint8Array(n*n*4),r=random(741);
 for(let i=0;i<n*n;i++){const a=r(),v=(gravel?98:45)+(a-.5)*(gravel?64:26);data[i*4]=v;data[i*4+1]=v*(gravel?.88:1.04);data[i*4+2]=v*(gravel?.72:1.10);data[i*4+3]=255;}
 const texture=new T.DataTexture(data,n,n,T.RGBAFormat);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(.65,.65);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.needsUpdate=true;
 return new T.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:gravel?.024:.004,roughness:wet?.29:.91,metalness:wet?.10:.015,color:wet?'#8394a2':'#ffffff'});
}
function addRibbon(g:T.Group,road:Road,a:number,b:number,mat:T.Material,name:string,lift=0){const m=new T.Mesh(roadGeometry(road,a,b,600,lift),mat);m.name=name;m.receiveShadow=true;g.add(m);return m;}
export function createStudioEnvironment(input:StudioConfig){
 const config=resolveConfig(input),road=createRoad(config.road),group=new T.Group();group.name='v5-'+config.preset;
 const asphalt=roadMaterial(config.surface==='gravel',config.weather==='wet'),shoulder=new T.MeshStandardMaterial({color:config.surface==='gravel'?'#80715b':'#666258',roughness:.98,side:T.DoubleSide});
 addRibbon(group,road,-road.width/2,road.width/2,asphalt,'v5-road');
 for(const side of [-1,1])addRibbon(group,road,side*road.width/2,side*(road.width/2+1.15),shoulder,'v5-shoulder',-.012);
 if(config.surface==='asphalt'){
 const line=new T.MeshStandardMaterial({color:'#d8d7c7',roughness:.78,side:T.DoubleSide});
 for(const side of [-1,1])addRibbon(group,road,side*(road.width/2-.22),side*(road.width/2-.12),line,'v5-edge-line',.008);
 if(config.preset!=='circuit')for(let d=0;d<road.length;d+=9){
 const q=new T.Mesh(new T.PlaneGeometry(4,.105),line);const s=sampleRoad(road,d);q.position.copy(s.position).addScaledVector(s.normal,.009);q.quaternion.copy(s.quaternion).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2));q.name='v5-centre-dash';group.add(q);
 }
 }
 const landscape=createTerrain(road,config.preset);group.add(landscape.mesh);
 const scenery=new T.Group();scenery.name='v5-scenery';group.add(scenery);
 if(config.scenery){addNature(scenery,road,config,landscape.height);addArchitecture(scenery,road,config);batchScenery(scenery);}
 group.userData.config=config;group.userData.accuracy='Deterministic cinematic route; not calibrated driving simulation';
 return {group,road,config};
}
