import {installStudioExhaust} from './studio-exhaust.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {installStudioCoachwork,STUDIO_BODY_IDS} from './studio-coachwork.ts';
import {refineGlazing} from './glazing.ts';
import {coachbuiltPanels} from './body-panels.ts';
import {sampleDynamics} from './dynamics.ts';
import {sculptedFascia} from './fascia.ts';
import {coachbuiltFinish} from './coachbuilt.ts';
import {rallyDetails} from './rally.ts';
import {createAssembly,animateAssembly} from './authoring.ts';
import type {AssemblySpec} from './authoring.ts';
import * as T from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {createVehicle} from '../world-kit/vehicles.ts';
import {animateVehicle} from '../world-kit/motion.ts';
import {vehicleSpec} from '../world-kit/catalog.ts';
import type {VehicleOptions,VehicleVariant} from '../world-kit/catalog.ts';
import {createPart} from '../parts-kit/models.ts';
import {animatePart} from '../parts-kit/motion.ts';
import {createDriver,animateDriver} from './occupant.ts';
import {createMechanicalSystems,animateMechanicalSystems,mechanicalLayout} from './systems.ts';
import {batchVehicleDetails} from './optimize.ts';
import {enhanceCabin} from './cabin-depth.ts';
import {engineConfiguration} from './powertrain.ts';
import {premiumExterior} from './exterior.ts';
import {sculptShell,roadHeroDetails,formulaHeroDetails} from './premium.ts';
import {tyreDetail,floorAssembly,suspensionLinks} from './details.ts';
import {deformTyre,deformBody,createFragments,animateFragments,createTornCarcass,damageRim,groundTornCords} from './damage.ts';

export const HERO_VEHICLES=['hot-hatch','supercar','formula-modern'] as const satisfies readonly VehicleVariant[];
export type CinematicOptions=VehicleOptions & {quality?:'lightweight'|'standard'|'hero';paintPreset?:'lacquer'|'satin';bodyDetail?:'legacy'|'coachbuilt'|'studio';tyreType?:'road'|'slick';optimize?:boolean;driver?:boolean;powertrain?:AssemblySpec};
export type WheelCorner='front-left'|'front-right'|'rear-left'|'rear-right'|'rear-aux-left'|'rear-aux-right';
export type CinematicState={frame:number;fps:number;distance?:number;speed?:number;acceleration?:number;curvature?:number;roughness?:number;roadFrontLeft?:number;roadFrontRight?:number;roadRearLeft?:number;roadRearRight?:number;steer?:number;compression?:number;tyreDamage?:number;damagedWheel?:WheelCorner;bodyDamage?:number;cutaway?:number;exploded?:number;highlight?:'engine'|'underfloor'|'wheels';heat?:number;failureFrame?:number;braking?:number;impact?:number;gearChange?:number};
type Rig={driver?:T.Group;systems?:T.Group;shell:T.Group;mounts:T.Group[];engine?:T.Group;floor?:T.Group;links:T.Group[];sparks:T.InstancedMesh;fragments:T.Group;body?:T.Mesh;panels:T.Mesh[]};
const rigs=new WeakMap<T.Object3D,Rig>();
function materials(root:T.Object3D,fn:(m:T.MeshStandardMaterial)=>void){root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial)fn(m);});}
function rememberMaterials(root:T.Object3D){materials(root,m=>{m.userData.shaderTransparent=m.transparent;m.userData.baseline={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,emissive:m.emissive.getHex(),intensity:m.emissiveIntensity};});}
function fade(root:T.Object3D,value:number,highlight=false){materials(root,m=>{const b=m.userData.baseline;if(!b)return;m.opacity=b.opacity*(1-value*.94);m.transparent=value>0||b.transparent;m.depthWrite=value>0?false:b.depthWrite;m.emissive.setHex(highlight?0x15c7bd:b.emissive);m.emissiveIntensity=highlight?.65:b.intensity;});}
export function createCinematicVehicle(options:CinematicOptions):T.Group{
 if(options.bodyDetail!==undefined&&!['legacy','coachbuilt','studio'].includes(options.bodyDetail))throw Error('Unknown body detail');
 if(options.bodyDetail==='studio'&&!STUDIO_BODY_IDS.includes(options.variant as typeof STUDIO_BODY_IDS[number]))throw Error('Studio body supported for supercar, coupe and rally-hatch; choose coachbuilt for other vehicles');
 if(options.bodyDetail==='studio'&&options.quality!==undefined&&options.quality!=='hero')throw Error('Studio body requires quality:hero; use coachbuilt for standard/lightweight');
 const quality=options.quality??'hero';if(!['lightweight','standard','hero'].includes(quality))throw new Error('Unknown quality');
 const root=createVehicle(options),s=vehicleSpec(options.variant);root.userData.quality=quality;root.userData.accuracy='Illustrative kinematic rig; not validated engineering simulation';
 if(quality==='lightweight')return root;
 const shell=new T.Group();shell.name='body-shell';root.add(shell);
 const mounts:T.Group[]=[],corners=new Set<string>();
 for(const o of [...root.children]){
  if(o===shell)continue;
  if(o.name.startsWith('steer-')){const mount=o as T.Group;let corner=`${o.position.x>0?'front':'rear'}-${o.position.z>=0?'left':'right'}`;if(corners.has(corner))corner=`rear-aux-${o.position.z>=0?'left':'right'}`;corners.add(corner);mount.name=`mount-${corner}`;mount.userData.restPosition=mount.position.toArray();mounts.push(mount);
   mount.traverse(n=>{if(n instanceof T.Mesh&&n.name==='tyre'){const original=n.geometry;n.geometry=original.clone();original.dispose();n.userData.restVertices=Array.from(n.geometry.attributes.position.array);}});
   createTornCarcass(mount.getObjectByName('wheel-roll')!,s.radius,s.family==='formula'?.32:s.family==='sports'?.28:.235);
   if(quality==='hero'){const roll=mount.getObjectByName('wheel-roll')!;tyreDetail(roll,s.radius,s.family==='formula'?.32:s.family==='sports'?.28:.235,options.tyreType==='slick'||s.family==='formula');}
  }else shell.add(o);
 }
 if(quality==='hero'){
  roadHeroDetails(shell,s);
  if(options.bodyDetail==='studio'){
   enhanceCabin(shell,s,options);installStudioCoachwork(shell,s);rallyDetails(shell,mounts,s,true);
   for(const name of ['rally-exhaust-tip','rally-exhaust-route','rally-rear-silencer']){const old=shell.getObjectByName(name);if(old){old.parent?.remove(old);old.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});}}
   const exhaust=installStudioExhaust(shell,s),diffuser=shell.getObjectByName('rear-diffuser') as T.Mesh;
   for(const outlet of exhaust.outlets){const p=outlet.mount.position,r=outlet.outerDiameter/2+.009,old=diffuser.geometry;diffuser.updateMatrix();const inverse=diffuser.matrix.clone().invert(),a=new T.Vector3(-s.length/2-.1,p.y-r,p.z-r).applyMatrix4(inverse),b=new T.Vector3(-s.length/2+.35,p.y+r,p.z+r).applyMatrix4(inverse);diffuser.geometry=cutOpening(old,a.toArray(),b.toArray());old.dispose();
    const engineX=mechanicalLayout(s).engineX,points=[new T.Vector3(engineX,.38,Math.sign(p.z)*.28),new T.Vector3(engineX-.15,.26,Math.sign(p.z)*.24),new T.Vector3(-s.length*.38,.26,Math.sign(p.z)*.32),new T.Vector3(p.x+.25,p.y,p.z),new T.Vector3(p.x+.05,p.y,p.z)];const pipe=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,.028,12,false),new T.MeshStandardMaterial({color:'#8d7a67',metalness:.8,roughness:.43}));pipe.name='connected-exhaust-route';shell.add(pipe);}
   root.userData.bodyArchitecture='section-loft-v4';
  }else{
   premiumExterior(shell,s);if(options.bodyDetail!=='legacy'){sculptedFascia(shell,s);coachbuiltPanels(shell,s);}sculptShell(shell,s);formulaHeroDetails(shell,mounts,s);enhanceCabin(shell,s,options);if(options.bodyDetail!=='legacy')coachbuiltFinish(shell,mounts,s);rallyDetails(shell,mounts,s,options.bodyDetail!=='legacy');if(options.bodyDetail!=='legacy')refineGlazing(shell);
  }
 }

 // Material clones isolate fades/highlights between components and between vehicles.
 const originals=new Set<T.Material>();
 for(const scope of [shell,...mounts]){const clones=new Map<T.Material,T.Material>();scope.traverse(o=>{if(o instanceof T.Mesh){const clone=(m:T.Material)=>{let c=clones.get(m);if(!c){c=m.clone();clones.set(m,c);originals.add(m);}return c;};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);}});}
 originals.forEach(m=>m.dispose());
 materials(shell,m=>{if(m instanceof T.MeshPhysicalMaterial&&m.transparent){m.roughness=.075;m.envMapIntensity=.8;}else if(m instanceof T.MeshPhysicalMaterial&&m.clearcoat>0){m.clearcoat=1;m.roughness=options.paintPreset==='satin'?.43:options.bodyDetail==='studio'?.28:.22;m.clearcoatRoughness=options.bodyDetail==='studio'?.16:.13;m.envMapIntensity=options.bodyDetail==='studio'?.9:1.1;}});
 let engine:T.Group|undefined,floor:T.Group|undefined;
 const engineConfig=engineConfiguration(s);
 if(engineConfig){engine=options.powertrain?createAssembly(options.powertrain):createPart({variant:engineConfig.variant,cutaway:true});engine.name='engine';if(options.powertrain){const bounds=new T.Box3().setFromObject(engine).getSize(new T.Vector3());engine.scale.setScalar(Math.min(.9/Math.max(bounds.x,.001),.65/Math.max(bounds.y,.001),s.width*.7/Math.max(bounds.z,.001)));}else engine.scale.setScalar(engineConfig.scale);engine.position.fromArray(engineConfig.position);engine.userData.mount=engine.position.toArray();shell.add(engine);}
 if(s.family==='formula'){
  shell.traverse(o=>{if(['floor','floor-diffuser','pushrod','lower-wishbone'].includes(o.name))o.visible=false;if(o instanceof T.Mesh&&o.name===''&&o.geometry instanceof T.CylinderGeometry&&o.geometry.parameters.radiusTop===.025&&Math.abs(o.position.x)>.7&&o.position.y<.65)o.visible=false;});floor=floorAssembly(shell,s);
 }
 const systems=s.family==='bike'?undefined:createMechanicalSystems(s,mounts);if(systems)root.add(systems);
 const driver=options.driver?createDriver(shell,s,options):undefined;
 const links=mounts.map(m=>suspensionLinks(root,m,s));
 const sparks=new T.InstancedMesh(new T.BoxGeometry(.10,.012,.012),new T.MeshBasicMaterial({color:'#ffbd4f',toneMapped:false}),100);sparks.name='contact-sparks';sparks.frustumCulled=false;root.add(sparks);
 const fragments=createFragments();root.add(fragments);
 const body=shell.getObjectByName('arched-body') as T.Mesh|undefined;
 if(body){const original=body.geometry,geometry=original.clone();original.dispose();body.geometry=mergeVertices(geometry,.00001);geometry.dispose();body.userData.restNormals=Array.from(body.geometry.attributes.normal.array);body.userData.restVertices=Array.from(body.geometry.attributes.position.array);}
 const panels:T.Mesh[]=[];shell.traverse(o=>{if(o instanceof T.Mesh&&o.userData.editablePanel){o.userData.restVertices=Array.from(o.geometry.attributes.position.array);o.userData.restNormals=Array.from(o.geometry.attributes.normal.array);panels.push(o);}});
 if(options.optimize!==false)batchVehicleDetails(root);
 rememberMaterials(root);rigs.set(root,{driver,systems,shell,mounts,engine,floor,links,sparks,fragments,body,panels});animateCinematicVehicle(root,{frame:0,fps:30});return root;
}
export function animateCinematicVehicle(root:T.Group,state:CinematicState){
 for(const [k,v] of Object.entries(state))if(!['highlight','damagedWheel'].includes(k)&&v!==undefined&&(!Number.isFinite(v)||typeof v!=='number'))throw new Error(`${k} must be finite`);
 if(!Number.isFinite(state.frame))throw new Error('frame must be finite');
 if(!(state.fps>0))throw new Error('fps must be positive');
 for(const k of ['tyreDamage','bodyDamage','cutaway','exploded','heat','braking','impact','gearChange'] as const)if(state[k]!==undefined&&(state[k]!<0||state[k]!>1))throw new Error(`${k} must be 0..1`);
 if(state.compression!==undefined&&(state.compression<0||state.compression>.12))throw new Error('compression must be 0..0.12 metres');
 const {distance=0,steer=0,compression=0,tyreDamage=0,bodyDamage=0,cutaway=0,exploded=0,highlight,heat=0}=state;
 const roadKeys=['roadFrontLeft','roadFrontRight','roadRearLeft','roadRearRight'] as const;
 if(roadKeys.some(k=>state[k]!==undefined)&&!roadKeys.every(k=>state[k]!==undefined))throw Error('Supply all four road heights together');
 const s=vehicleSpec(root.userData.variant);const dynamics=sampleDynamics(s,{speed:state.speed??0,distance,curvature:state.curvature??Math.tan(steer)/s.wheelbase,acceleration:state.acceleration??0,roughness:state.roughness??0,roadHeights:state.roadFrontLeft===undefined?undefined:[state.roadFrontLeft,state.roadFrontRight!,state.roadRearLeft!,state.roadRearRight!]});
 animateVehicle(root,distance,steer);const rig=rigs.get(root);if(!rig)return;
 const {driver,systems,shell,mounts,engine,floor,links,sparks,fragments,body,panels}=rig;
 shell.position.set(0,(s.bodyStyle==='rally'?.045:0)-Math.min(compression,floor?.05:.12)-tyreDamage*.025+exploded*.65,0);
 shell.position.y+=dynamics.heave; shell.rotation.set(dynamics.roll,0,dynamics.pitch-tyreDamage*.012);
 fade(shell,cutaway);if(body)deformBody(body,bodyDamage,s.width);for(const panel of panels)deformBody(panel,bodyDamage,s.width);
 let damagedOrigin=new T.Vector3();
 mounts.forEach((m,i)=>{
  const damaged=m.name===`mount-${state.damagedWheel??'front-left'}`,d=damaged?tyreDamage:0,rest=m.userData.restPosition as number[];
  m.position.set(rest[0],rest[1]-d*Math.min(.08,s.radius*.22),rest[2]+Math.sign(rest[2])*exploded*.65);
  if(m.position.x>0&&state.curvature!==undefined)m.rotation.y=m.position.z>0?dynamics.steeringLeft:dynamics.steeringRight;
  const roadIndex=(rest[0]>0?0:2)+(rest[2]>0?0:1);m.position.y+=dynamics.roadHeights[roadIndex];
  const roll=m.getObjectByName('wheel-roll')!,tyre=m.getObjectByName('tyre') as T.Mesh;deformTyre(tyre,d,roll.rotation.z,m.position.y);
  // Detailed rolling marks are hidden on a failed carcass to avoid rigid floating tread.
  roll.traverse(o=>{if(['hero-tread','sidewall-mould-ring','sidewall-mark','tyre-groove','sidewall-bead','rally-tread'].includes(o.name))o.visible=d<.1;});
  const torn=roll.getObjectByName('torn-cords')!;torn.visible=d>.55;torn.scale.setScalar(Math.max(0,(d-.55)/.45));
  roll.traverse(o=>{if(o instanceof T.Mesh&&['rim-lip','rim-barrel'].includes(o.name))damageRim(o,Math.max(0,(d-.65)/.35));});
  roll.rotation.x=d*.055*Math.sin(state.frame/state.fps*19);
  if(damaged)damagedOrigin=m.position.clone();fade(m,0,highlight==='wheels');
  m.traverse(o=>{if(o instanceof T.Mesh&&o.name==='brake-rotor'){const mat=o.material as T.MeshStandardMaterial;mat.emissive.setRGB(heat,heat*.06,0);mat.emissiveIntensity=heat*1.8;}});
  links[i].children.forEach(o=>{const link=o.userData.link;if(!link)return;const a=new T.Vector3(...link.a),b=new T.Vector3(...link.b);a.applyEuler(shell.rotation).add(shell.position);a.z+=Math.sign(a.z)*exploded*.10;b.y+=m.position.y-rest[1];b.z+=m.position.z-rest[2];const delta=b.clone().sub(a);o.position.copy(a.add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());if(link.unit){o.position.copy(a.addScaledVector(delta,-.5));o.scale.y=delta.length();}else o.scale.y=delta.length()/new T.Vector3(...link.a).distanceTo(new T.Vector3(...link.b));});
 });
 animateFragments(fragments,tyreDamage,Math.max(0,(state.frame-(state.failureFrame??state.fps*1.6))/state.fps),damagedOrigin);
 if(engine){engine.position.fromArray(engine.userData.mount);engine.position.y+=exploded*.35;if(engine.userData.assembly)animateAssembly(engine,state.frame,state.fps);else animatePart(engine,{shaftAngle:state.frame/state.fps*12,explode:exploded*.25});fade(engine,0,highlight==='engine');}
 if(floor){fade(floor,0);const carbon=floor.getObjectByName('carbon-floor')!;carbon.scale.z=1-cutaway*.65;carbon.position.z=-cutaway*s.width*.22;floor.traverse(o=>{if(o instanceof T.Mesh&&o.name==='metal-skid'){const m=o.material as T.MeshStandardMaterial;m.emissive.setHex(highlight==='underfloor'?0xeeb84e:0);m.emissiveIntensity=highlight==='underfloor'?.45:0;}});}
 const contact=!!floor&&.050+shell.position.y<=0&&exploded===0;
 sparks.visible=contact;const dummy=new T.Object3D(),t=state.frame/state.fps;
 for(let i=0;i<sparks.count;i++){const age=(t*3+i*.61803398875)%1,side=Math.sin(i*12.9);dummy.position.set((i%2?.8:-.8)-age*4.5,.014+Math.sin(age*Math.PI)*(.035+(i%7)*.012),side*age*.95);dummy.scale.set(.8+age*3.5,.65,.65);dummy.rotation.z=-.2;dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);}sparks.instanceMatrix.needsUpdate=true;
 if(systems)animateMechanicalSystems(systems,root,shell.position.y,shell.rotation);
 if(driver){const cabin=shell.getObjectByName('interior');if(cabin){fade(cabin,0);for(const name of ['door-panel-left','door-panel-right','roof-liner']){const panel=cabin.getObjectByName(name);if(panel)panel.visible=cutaway<.5;}}animateDriver(driver,steer,state.braking??0,state.impact??0,state.gearChange??0);fade(driver,0);}
 materials(root,m=>{if(m.userData.shaderTransparent!==m.transparent){m.needsUpdate=true;m.userData.shaderTransparent=m.transparent;}});
 root.updateMatrixWorld(true);groundTornCords(root,mounts);
}
