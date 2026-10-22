import * as THREE from "three";
import {createEP005NightCircuit} from "./NightCircuit.ts";
import {EP005_ROUTE,trackPoint,sampleEP005Route} from "./route.ts";

/** EP005 A4 V2: an additive cinematic set. A3 owns drive speed/cameras.
 * Never alter the canonical V3 track geometry, kerbs or route sampler. */
type Placement={d:number;side:number;y:number;s:[number,number,number];tint?:string};
const mat=(c:string,r=.6,m=.1,e="#000000",ei=0)=>
 new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,emissive:e,emissiveIntensity:ei});
function batch(g:THREE.Group,name:string,geo:THREE.BufferGeometry,material:THREE.MeshStandardMaterial,items:Placement[]){
 const mesh=new THREE.InstancedMesh(geo,material,items.length),o=new THREE.Object3D();
 mesh.name="ep005-v2-"+name;mesh.frustumCulled=false;mesh.receiveShadow=true;
 items.forEach((v,i)=>{const p=trackPoint(v.d,v.side,v.y);o.position.fromArray(p.position);
  o.rotation.set(0,p.yaw,0);o.scale.set(...v.s);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);
  if(v.tint)mesh.setColorAt(i,new THREE.Color(v.tint));});
 mesh.instanceMatrix.needsUpdate=true;
 if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 g.add(mesh);return mesh;
}
/** A deep, directionally graduated sky dome, not an image/video plate. */
function skyDome(){
 const vertex="varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
 const fragment=[
  "varying vec3 vD;",
  "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
  "void main(){vec3 d=normalize(vD);float h=smoothstep(-.18,.64,d.y);",
  "vec3 c=mix(vec3(.040,.088,.144),vec3(.007,.015,.037),h);",
  "c+=vec3(.055,.029,.019)*exp(-pow((d.y+.08)*10.,2.));",
  "vec2 id=floor(vec2(atan(d.z,d.x)*194.,d.y*340.));",
  "float stars=step(.999,hash(id))*smoothstep(.18,.55,d.y);",
  "c+=vec3(.075,.11,.15)*stars;gl_FragColor=vec4(c,1.);}"
 ].join("");
 const dome=new THREE.Mesh(new THREE.SphereGeometry(235,48,24),
  new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,
   side:THREE.BackSide,depthWrite:false,fog:false}));
 dome.name="ep005-v2-twilight-gradient-sky";
 return dome;
}
export function createEP005CinematicNightCircuit():THREE.Group{
 const world=createEP005NightCircuit({premium:true}),set=new THREE.Group();
 world.name="EP005-cinematic-night-circuit-v2";
 set.name="ep005-v2-environment";world.add(set);set.add(skyDome());
 // The generic V3 circuit's bright green parkland and ochre runoff read as
 // daylight/game scenery. Retain every source mesh and its route coordinates,
 // but grade only this independently constructed EP005 world into night.
 const grade=(name:string,color:string,roughness=.94)=>{
  const node=world.getObjectByName(name);
  if(node instanceof THREE.Mesh && node.material instanceof THREE.MeshStandardMaterial){
   node.material.color.set(color);node.material.roughness=roughness;
   node.material.metalness=Math.min(.07,node.material.metalness);
   node.material.needsUpdate=true;
  }
 };
 grade("terrain","#1b2a2c",.99);
 grade("runoff","#2c373d",.93);
 grade("tree-crowns","#52616a",.96);
 grade("conifer-tiers","#526875",.96);
 grade("tree-trunks","#4a4d4d",.95);
 const L=EP005_ROUTE.lapMetres;
 const steel=mat("#596d79",.36,.62),dark=mat("#1e2931",.9,.035);
 const roadWhite=mat("#9da9af",.76,.07),rubber=mat("#1b252c",.96,.01);
 const damp=mat("#30414d",.49,.05),bronze=mat("#806e64",.5,.4);
 const glazing=mat("#1b3444",.18,.37,"#163a4d",.23);
 const windows=mat("#bed0d5",.3,.14,"#86a8b1",.65);
 const amber=mat("#dbbc96",.34,.1,"#c68a4d",1.25);
 const cyan=mat("#9bc8d5",.37,.14,"#3c829a",1.04);
 // Fine flush wear/markings, versus flat grey tarmac. No tyre-contact geometry moved.
 const lines:Placement[]=[],tyre:Placement[]=[],wet:Placement[]=[];
 const rail:Placement[]=[],posts:Placement[]=[],bolts:Placement[]=[];
 for(let i=0;i<144;i++){
  const d=L*(i+.12)/144;
  if(i%3===0)for(const side of [-1,1])lines.push({d,side:side*5.73,y:.013,s:[.92,.006,.08]});
  if(i%4===0){tyre.push({d,side:((i%7)-3)*.50,y:.012,s:[2.5,.004,.078]});
   wet.push({d:d+1,side:((i%5)-2)*.58,y:.011,s:[1.9,.004,.13]});}
  if(i%2===0)for(const side of [-1,1]){
   posts.push({d,side:side*12.04,y:.64,s:[.075,1.22,.09]});
   bolts.push({d,side:side*12.07,y:1.02,s:[.14,.07,.13]});}
  if(i%6===0)for(const side of [-1,1])
   rail.push({d,side:side*12.04,y:1.01,s:[5.1,.14,.12]});
 }
 batch(set,"painted-circuit-edge",new THREE.BoxGeometry(),roadWhite,lines);
 batch(set,"rubber-accumulation",new THREE.BoxGeometry(),rubber,tyre);
 batch(set,"broken-wetness",new THREE.BoxGeometry(),damp,wet);
 batch(set,"armco-rail",new THREE.BoxGeometry(),steel,rail);
 batch(set,"armco-posts",new THREE.BoxGeometry(),steel,posts);
 batch(set,"armco-fasteners",new THREE.BoxGeometry(),bronze,bolts);
 // Distinct pit / motorsport hospitality structures, 32m+ outside camera corridor.
 const walls:Placement[]=[],roof:Placement[]=[],facades:Placement[]=[],mullion:Placement[]=[],lit:Placement[]=[];
 for(let k=0;k<4;k++){
  const d=L*[.15,.42,.69,.92][k],side=k%2===0?-1:1;
  walls.push({d,side:side*36.6,y:5.2,s:[19,10.2,8.5]});
  roof.push({d,side:side*36.6,y:10.5,s:[19.8,.42,9.2]});
  for(let j=0;j<9;j++){
   const at=d+(j-4)*2.04;
   facades.push({d:at,side:side*32.26,y:5.1,s:[1.78,6.9,.15]});
   for(let f=0;f<3;f++){
    mullion.push({d:at,side:side*32.17,y:3+f*2.25,s:[1.77,.10,.07]});
    if((j+f+k)%5!==0)lit.push({d:at,side:side*32.10,y:3.84+f*2.25,
      s:[1.5,.11,.065],tint:(j+f)%3===0?"#e8c198":"#a0c1d2"});
   }
  }
 }
 batch(set,"pit-building-walls",new THREE.BoxGeometry(),dark,walls);
 batch(set,"pit-building-rooflines",new THREE.BoxGeometry(),steel,roof);
 batch(set,"pit-layered-glass",new THREE.BoxGeometry(),glazing,facades);
 batch(set,"pit-window-mullions",new THREE.BoxGeometry(),bronze,mullion);
 batch(set,"pit-selective-windows",new THREE.BoxGeometry(),windows,lit);
 // Layered softer ridgelines with controlled haze, never cardboard low-poly cliff props.
 const far:Placement[]=[],near:Placement[]=[],tower:Placement[]=[],beacon:Placement[]=[];
 for(let i=0;i<56;i++){
  const d=L*(i+.45)/56,side=i%2?1:-1;
  far.push({d,side:side*(77+(i%7)*3.8),y:3+(i%6)*1.3,
   s:[10+(i%7),13+(i%8)*2.1,12+(i%6)*2]});
  if(i%2===0)near.push({d,side:side*(46+(i%5)*4),y:1.8,s:[4.5+(i%5),4+(i%3),5.5]});
  if(i%8===0){tower.push({d,side:side*52,y:8,s:[.10,6.8,.10]});
   beacon.push({d,side:side*52,y:11.55,s:[.2,.2,.2]});}
 }
 batch(set,"atmospheric-ridgelines",new THREE.IcosahedronGeometry(1,3),mat("#24353e",.99,.01),far);
 batch(set,"midground-smooth-scree",new THREE.IcosahedronGeometry(1,2),dark,near);
 batch(set,"paddock-service-masts",new THREE.BoxGeometry(),steel,tower);
 batch(set,"service-indicator-lights",new THREE.BoxGeometry(),cyan,beacon);
 const accent:Placement[]=[],lantern:Placement[]=[];
 for(let i=0;i<24;i++){
  const d=L*(i+.07)/24,side=i%2?1:-1;
  accent.push({d,side:side*20.45,y:6.83,s:[1.6,.08,.09]});
  lantern.push({d,side:side*24.5,y:.21,s:[.36,.13,.21]});
 }
 batch(set,"tungsten-motivated-lamps",new THREE.BoxGeometry(),amber,accent);
 batch(set,"restrained-ground-bollards",new THREE.BoxGeometry(),cyan,lantern);
 set.userData={routeMeshUnchanged:true,routeSampler:EP005_ROUTE.canonicalSampler,
  roadY:0,clearCameraNormalToMetres:12,minArchitectureNormalMetres:32.1,
  noRaisedTireLaneObstacles:true,noFakeFlames:true};
 world.userData.ep005CinemaV2={route:"track",roadY:0,independentWorld:true,
  frameSafe:true,lightStyle:"deep navy with motivated amber/cyan practicals"};
 return world;
}
export const sampleEP005CinematicRoute=sampleEP005Route;
