import * as T from "three";
import {createCinematicEnvironment} from "../../../../src/yunex/modelling-kit/environments.ts";
import {EP005_ROUTE, EP005_CAMERA_CLEARANCE} from "./route.ts";

type Item = {p: [number, number, number]; s: [number, number, number]; c?: string};
const material = (color: string, roughness = 0.65, metalness = 0.1, emissive?: string, intensity = 0) =>
  new T.MeshStandardMaterial({color,roughness,metalness,emissive:emissive ?? "#000000",emissiveIntensity:intensity});
const makeBatch = (parent: T.Group,name: string,geometry: T.BufferGeometry,mat: T.MeshStandardMaterial,items: Item[]) => {
  const batch = new T.InstancedMesh(geometry,mat,items.length);
  const tmp = new T.Object3D();
  batch.name = "ep005-" + name;batch.frustumCulled = false;
  items.forEach((item,i) => {
    tmp.position.set(...item.p);tmp.scale.set(...item.s);tmp.rotation.set(0,0,0);
    tmp.updateMatrix();batch.setMatrixAt(i,tmp.matrix);
    if(item.c)batch.setColorAt(i,new T.Color(item.c));
  });
  batch.instanceMatrix.needsUpdate = true;
  if(batch.instanceColor)batch.instanceColor.needsUpdate = true;
  parent.add(batch);
  return batch;
};
/** Real bespoke, named reusable 3D dressing. All heavy objects stay outside the driveable corridor. */
export function createEP005NightBoulevard({premium=true}:{premium?:boolean}={}) {
  const root = createCinematicEnvironment({
    kind: EP005_ROUTE.kind, seed: EP005_ROUTE.seed,
    timeOfDay: EP005_ROUTE.timeOfDay, wetness: EP005_ROUTE.wetness,
    quality: "hero"
  });
  root.name = "EP005-midnight-boulevard";
  root.userData.ep005 = {route:EP005_ROUTE,clearance:EP005_CAMERA_CLEARANCE,premium};
  if(!premium)return root;
  const layer = new T.Group();layer.name = "ep005-premium-environment";
  root.add(layer);
  // The authoritative V3 road is NOT replaced or translated; dry-to-damp asphalt retains high roughness.
  const lane = material("#bbc0ad",.85,.04),metal = material("#566b70",.42,.55);
  const amber = material("#f9dfac",.28,.02,"#ffd19b",2.2);
  const cyan = material("#74e0ed",.38,.12,"#40a6c8",1.35);
  const edge: Item[] = [], reflectors: Item[] = [], inset: Item[] = [];
  for(let x=-86;x<=85;x+=3.5) {
    for(const side of [-1,1]) {
      edge.push({p:[x,.015,side*5.73],s:[2.75,.014,.055]});
      if(Math.round((x+86)/3.5)%2===0)
        reflectors.push({p:[x,.026,side*6.08],s:[.16,.023,.082],c:side>0?"#fff3cc":"#dba67a"});
    }
  }
  for(let x=-70;x<81;x+=12)for(const side of [-1,1])
    inset.push({p:[x,.016,side*4.96],s:[.42,.009,.045]});
  makeBatch(layer,"edge-markings",new T.BoxGeometry(),lane,edge);
  makeBatch(layer,"road-reflectors",new T.BoxGeometry(),material("#ffffff",.32,.05),reflectors);
  makeBatch(layer,"lane-insets",new T.BoxGeometry(),material("#48545b",.9,.01),inset);

  // Slim street furniture: object footprints at |Z| >= 9m, 3+m outside the car.
  const masts:Item[]=[],arms:Item[]=[],heads:Item[]=[],sockets:Item[]=[];
  for(let x=-74;x<=72;x+=18)for(const side of [-1,1]){
    masts.push({p:[x,3.24,side*9.9],s:[1,1,1]});
    arms.push({p:[x,6.4,side*9.05],s:[.09,.09,1.75]});
    heads.push({p:[x,6.34,side*8.22],s:[.65,.09,.30]});
    sockets.push({p:[x,.08,side*9.9],s:[.65,.16,.65]});
  }
  makeBatch(layer,"lamp-masts",new T.CylinderGeometry(.065,.09,6.48,9),metal,masts);
  makeBatch(layer,"lamp-arms",new T.BoxGeometry(),metal,arms);
  makeBatch(layer,"lamp-warm-luminaires",new T.BoxGeometry(),amber,heads);
  makeBatch(layer,"lamp-footings",new T.BoxGeometry(),material("#7a8282",.86),sockets);

  // Raised portals read as an architectural tunnel threshold: 6.95m unobstructed headroom.
  const columns:Item[]=[],caps:Item[]=[],indirect:Item[]=[],joints:Item[]=[];
  for(const x of [28,40,52]){
    for(const side of [-1,1]) {
      columns.push({p:[x,3.55,side*8.7],s:[.62,7.1,.56]});
      joints.push({p:[x,1.4,side*8.39],s:[.09,2.5,.04]});
    }
    caps.push({p:[x,7.20,0],s:[.75,.36,18]});
    indirect.push({p:[x,6.96,0],s:[.32,.045,14.9]});
  }
  makeBatch(layer,"tunnel-portal-columns",new T.BoxGeometry(),material("#2c424b",.53,.35),columns);
  makeBatch(layer,"tunnel-portal-heads",new T.BoxGeometry(),material("#374b56",.51,.25),caps);
  makeBatch(layer,"tunnel-architectural-glow",new T.BoxGeometry(),cyan,indirect);
  makeBatch(layer,"tunnel-column-joints",new T.BoxGeometry(),material("#9cacb1",.28,.65),joints);

  // Distant facade highlights; no mirror-road plane, thick fog sheet or foreground particles.
  const windows:Item[]=[],pilasters:Item[]=[],signs:Item[]=[];
  for(let x=-76;x<=78;x+=14)for(const side of [-1,1]){
    const z=side*12.25;
    windows.push({p:[x,3.5,z],s:[6.4,3.5,.075],c:(x+76)%3===0?"#e8be86":"#a6bec0"});
    pilasters.push({p:[x-3.6,3.4,side*12.12],s:[.15,6.8,.12]});
    signs.push({p:[x,6.1,side*12.10],s:[6.2,.075,.1]});
  }
  makeBatch(layer,"facade-reveal-windows",new T.BoxGeometry(),material("#f3f3f3",.24,.26,"#6f919d",.35),windows);
  makeBatch(layer,"facade-trims",new T.BoxGeometry(),material("#617e86",.47,.38),pilasters);
  makeBatch(layer,"facade-accent-band",new T.BoxGeometry(),cyan,signs);
  layer.userData = {
    units:"m",route:"src/yunex/world-kit/environments.ts::sampleRoute(city,distance)",
    routeMeshUnchanged:true,vehicleLaneZ:-1.85,
    highPropsOutsideAbsZ:7.75,headroomMetres:6.95,
    staticInstancedBatches:14,weather:"none",surface:"restrained 0.16 wetness; no mirror surface"
  };
  return root;
}
