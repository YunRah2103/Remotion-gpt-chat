/**
 * EP006 / Agent 5: source-owned mechanical reveal for the V4 rally-hatch.
 *
 * +X forward, +Y up, +Z left; metres, 0-based absolute 30 fps frames.
 * All motion comes from the caller's canonical Agent 2 sample. There is
 * deliberately no road, jump, or force simulation in this module.
 */
import * as T from 'three';
import {animateCinematicVehicle} from '../../modelling-kit/rig.ts';

export const MECHANICAL_CORNERS = ['front-left','front-right','rear-left','rear-right'] as const;
export type MechanicalCorner = typeof MECHANICAL_CORNERS[number];
export type Ep006WheelMotion = {
  compressionM:number; steerRad:number; spinRad:number;
  contact:boolean; surfaceHeightM:number;
};
export type Ep006Motion = {
  frame:number; timeSeconds:number;
  phase:'approach'|'takeoff'|'airborne'|'touchdown'|'rebound'|'driving';
  jumpId:'J1'|'J2'|null;
  positionM:[number,number,number];rotationRad:[number,number,number];
  velocityMps:[number,number,number];
  wheels:Record<MechanicalCorner,Ep006WheelMotion>;
  impact01:number;dust01:number;gravel01:number;
  event?:string|null;
};
export type MechanicalFocus='contact'|'spring'|'damper'|'chassis';
export type RevealInput={motion:Ep006Motion; focus:MechanicalFocus; exposure01:number;
  /** Local fallback only for standalone proof: editor normally applies Agent 1's pose adapter. */
  applyV4FallbackPose?:boolean};
type Ghost={mesh:T.Mesh;materials:T.MeshStandardMaterial[];opacity:number[]};
type CornerRig={corner:MechanicalCorner;mount:T.Object3D;rest:T.Vector3;
  links:T.Object3D; damper:T.Object3D; upper:T.Vector3;lower:T.Vector3;
  overlay:T.Group;coil:T.Mesh;barrel:T.Mesh;shaft:T.Mesh;
  topCollar:T.Mesh;bottomCollar:T.Mesh;tyre:T.Mesh<T.BufferGeometry>;tyreRest:number[];
  wheelRoll:T.Object3D;agent1Assembly:boolean};
export type MechanicalReveal={root:T.Group;vehicle:T.Group;
  update:(input:RevealInput)=>void; corners:ReadonlyArray<MechanicalCorner>};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
function connect(node:T.Object3D,a:T.Vector3,b:T.Vector3){
  const d=new T.Vector3().subVectors(b,a),length=d.length();
  node.position.copy(a).addScaledVector(d,.5);
  node.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.multiplyScalar(1/Math.max(length,.000001)));
  node.scale.y=length;
}
function section(material:T.Material,r:number,name:string){
  const result=new T.Mesh(new T.CylinderGeometry(r,r,1,16),material);
  result.name=name;result.castShadow=true;result.receiveShadow=true;
  return result;
}
function helix(material:T.Material,name:string){
  const points:T.Vector3[]=[];
  for(let i=0;i<=240;i++){
    const t=i/240,theta=t*7.5*Math.PI*2;
    points.push(new T.Vector3(Math.cos(theta)*.055,t-.5,Math.sin(theta)*.055));
  }
  const result=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),240,.009,7,false),material);
  result.name=name;result.castShadow=true;result.receiveShadow=true;
  return result;
}
const shellNames=(name:string)=>{
  const n=name.toLowerCase();
  return n==='arched-body'||n==='roof'||n==='sill'||n==='wheel-well-return'||n==='studio-fender-lip'||n.includes('studio-panel')||
    n.includes('studio-door')||n.includes('studio-roof')||
    n.includes('body-panel')||n.includes('studio-bonnet')||
    n.includes('studio-quarter')||n.includes('rally-wide-arch')||
    n.includes('studio-glass')||n.includes('windscreen')||
    n.includes('windshield')||n.includes('side-glass')||
    n.includes('door-skin')||n.includes('rally-livery');
};
function assertMotion(m:Ep006Motion){
  if(!Number.isInteger(m.frame)||m.frame<0||!Number.isFinite(m.timeSeconds))throw Error('EP006 requires finite absolute frame/time');
  for(const n of [...m.positionM,...m.rotationRad,...m.velocityMps,m.impact01,m.dust01,m.gravel01])if(!Number.isFinite(n))throw Error('Non-finite EP006 pose');
  for(const c of MECHANICAL_CORNERS){
    const w=m.wheels[c];
    if(!w)throw Error('Missing wheel '+c);
    for(const n of [w.compressionM,w.steerRad,w.spinRad,w.surfaceHeightM])if(!Number.isFinite(n))throw Error('Non-finite wheel '+c);
    // Negative travel is valid suspension droop during flight. Agent 2 currently allows -0.085m. 
    if(w.compressionM<-.20||w.compressionM>.45)throw Error('Unexpected bump/droop metres: '+c);
  }
}
/** Do not call createCinematicVehicle here: this is an overlay on the exact shared car. */
export function createEp006MechanicalReveal(vehicle:T.Group):MechanicalReveal{
  if(vehicle.userData.variant!=='rally-hatch')throw Error('EP006 mechanics require the existing V4 rally-hatch');
  const root=new T.Group();root.name='ep006-fitted-mechanical-reveal';vehicle.add(root);
  const metal=new T.MeshStandardMaterial({color:'#b5c0c8',metalness:.91,roughness:.2});
  const dark=new T.MeshStandardMaterial({color:'#28343e',metalness:.72,roughness:.35});
  const gold=new T.MeshStandardMaterial({color:'#e5a73d',metalness:.7,roughness:.29});
  const chrome=new T.MeshStandardMaterial({color:'#e4e7e5',metalness:.98,roughness:.12});
  const corners:CornerRig[]=[];
  const shell=vehicle.getObjectByName('body-shell');
  if(!shell)throw Error('Missing canonical body-shell');
  for(const corner of MECHANICAL_CORNERS){
    const mount=vehicle.getObjectByName('mount-'+corner);
    const links=vehicle.getObjectByName('links-mount-'+corner);
    const damper=links?.getObjectByName('damper');
    const coil=links?.getObjectByName('coil-spring');
    const tyre=mount?.getObjectByName('tyre');
    const wheelRoll=mount?.getObjectByName('wheel-roll');
    if(!mount||!links||!damper||!coil||!(tyre instanceof T.Mesh)||!wheelRoll)
      throw Error('Missing V4 connected suspension/tyre at '+corner);
    const datum=damper.userData.link as {a:[number,number,number];b:[number,number,number]};
    if(!datum?.a||!datum.b)throw Error('No suspension hardpoint data at '+corner);
    // Agent 1's upgraded hardware supersedes this self-contained V4 proof fallback.
    // Do not duplicate pistons/springs or re-enable the V4 links after integration.
    const agent1Assembly=!!vehicle.getObjectByName('ep006-'+corner+'-suspension');
    const overlay=new T.Group();overlay.name='ep006-coaxial-damper-'+corner;root.add(overlay);
    const barrel=section(dark,.042,'shock-pressure-body-'+corner);
    const shaft=section(chrome,.018,'shock-chrome-piston-'+corner);
    const topCollar=section(metal,.057,'shock-top-collar-'+corner);
    const bottomCollar=section(metal,.032,'shock-lower-eye-'+corner);
    const spring=helix(gold,'active-coil-spring-'+corner);
    overlay.add(barrel,shaft,topCollar,bottomCollar,spring);
    const pos=tyre.geometry.attributes.position.array;
    const tyreRest=Array.from(((tyre.userData.restVertices as number[]|undefined)??pos) as ArrayLike<number>);
    corners.push({corner,mount,rest:new T.Vector3(...(mount.userData.restPosition as [number,number,number])),
      links,damper,upper:new T.Vector3(...datum.a),lower:new T.Vector3(...datum.b),
      overlay,coil:spring,barrel,shaft,topCollar,bottomCollar,
      tyre:tyre as T.Mesh<T.BufferGeometry>,tyreRest,wheelRoll,agent1Assembly});
  }
  // Fade only exterior coachwork: cabin cage, chassis rails, wheels, shafts and fittings remain opaque.
  const ghosts:Ghost[]=[];
  const wheelGhosts:Ghost[]=[];
  shell.traverse(node=>{
    if(!(node instanceof T.Mesh)||!shellNames(node.name))return;
    const materials=(Array.isArray(node.material)?node.material:[node.material]);
    if(!materials.every(mat=>mat instanceof T.MeshStandardMaterial))return;
    const cloned=materials.map(mat=>mat.clone() as T.MeshStandardMaterial);
    node.material=Array.isArray(node.material)?cloned:cloned[0];
    ghosts.push({mesh:node,materials:cloned,opacity:cloned.map(mat=>mat.opacity)});
  });

  // Ghost only the nearer wheel during spring/damper cutaways; the exact
  // fitted V4 wheel stays on its real pivot, rolling and connected.
  const nearWheel=vehicle.getObjectByName('mount-front-left')?.getObjectByName('wheel-roll');
  nearWheel?.traverse(node=>{
    if(!(node instanceof T.Mesh))return;
    const materials=Array.isArray(node.material)?node.material:[node.material];
    if(!materials.every(m=>m instanceof T.MeshStandardMaterial))return;
    const cloned=materials.map(m=>(m as T.MeshStandardMaterial).clone());
    node.material=Array.isArray(node.material)?cloned:cloned[0];
    wheelGhosts.push({mesh:node,materials:cloned,opacity:cloned.map(m=>m.opacity)});
  });
  const update=(input:RevealInput)=>{
    const {motion,focus,exposure01,applyV4FallbackPose=false}=input;
    assertMotion(motion);
    const exposure=clamp(exposure01);
    const compressions=MECHANICAL_CORNERS.map(c=>motion.wheels[c].contact?motion.wheels[c].compressionM:0);
    const mean=compressions.reduce((a,b)=>a+b,0)/4;
    if(applyV4FallbackPose){
      // Existing V4 only accepts global 0..0.12m compression. This is an explicitly
      // temporary compatibility adapter; the final editor uses Agent 1+2's pose.
      animateCinematicVehicle(vehicle,{
        // Body pose is supplied by motion, so do not double-compress V4 shell.
        frame:motion.frame,fps:30,compression:0,
        distance:motion.positionM[0],speed:Math.hypot(...motion.velocityMps),
        steer:motion.wheels['front-left'].steerRad,roughness:0,
        cutaway:0,braking:0,impact:clamp(motion.impact01),
      });
      vehicle.position.set(...motion.positionM);
      vehicle.rotation.set(...motion.rotationRad);
      // The V4 rig has only one compression channel. During this temporary
      // preview, adapt each existing four wheel pivot from the motion fixture.
      // The final production uses Agent 1's pose adapter instead.
      for(const c of corners){
        const w=motion.wheels[c.corner];
        c.mount.position.y=c.rest.y+clamp(w.compressionM,-.15,.16);
        c.mount.rotation.y=w.steerRad;
        c.wheelRoll.rotation.z=w.spinRad;
      }
    }
    // Compute all reveal coordinates from the actual named attachment points.
    const body=vehicle.getObjectByName('body-shell')!;
    for(const c of corners){
      const data=motion.wheels[c.corner],travel=data.contact?clamp(data.compressionM,0,.20):0;
      const springTop=c.upper.clone().applyEuler(body.rotation).add(body.position);
      const wheelBottom=c.lower.clone();
      wheelBottom.y+=c.mount.position.y-c.rest.y;
      const direction=wheelBottom.clone().sub(springTop);
      const barrelEnd=springTop.clone().addScaledVector(direction,.57);
      const shaftStart=wheelBottom.clone().addScaledVector(direction,-.69);
      connect(c.barrel,springTop,barrelEnd);
      connect(c.shaft,shaftStart,wheelBottom);
      connect(c.topCollar,springTop.clone().lerp(wheelBottom,.02),springTop.clone().lerp(wheelBottom,.09));
      connect(c.bottomCollar,springTop.clone().lerp(wheelBottom,.92),springTop.clone().lerp(wheelBottom,.985));
      connect(c.coil,springTop.clone().lerp(wheelBottom,.09),springTop.clone().lerp(wheelBottom,.90));
      // Reveal augments existing links. The original load path stays attached to the car.
      c.overlay.visible=exposure>.08&&!c.agent1Assembly;
      // Deform the tyre's existing named mesh, never the rim or the wheel-to-body rig.
      // Work in the inverse current wheel-roll frame so the flattened patch stays at the road.
      if(!c.agent1Assembly){
      const p=c.tyre.geometry.attributes.position;
      const base=c.tyreRest,theta=c.wheelRoll.rotation.z;
      const sx=Math.sin(theta),cy=Math.cos(theta);
      const crush=(data.contact?Math.min(.032,travel*.28+.006*clamp(motion.impact01)):0);
      const r=.36;
      for(let i=0;i<p.count;i++){
        const k=i*3,x=base[k],y=base[k+1],z=base[k+2];
        const down=-(sx*x+cy*y)/r;
        const w=Math.pow(clamp((down-.53)/.47),2);
        p.setXYZ(i,x+sx*crush*w,y+cy*crush*w,z*(1+crush*w*.35));
      }
      p.needsUpdate=true;c.tyre.geometry.computeVertexNormals();
      }
      // Compression and rebound both visibly change spring span; the damper controls
      // velocity, not stored energy. We do not portray heat/energy as glowing particles.
      c.coil.material instanceof T.MeshStandardMaterial &&
        c.coil.material.color.set(focus==='spring'?'#ffc05d':'#b98b47');
      // Existing V4 coil belongs to its registered assembly and remains in place.
      // Do not overlay original lightweight shock and our detailed shock.
      if(!c.agent1Assembly)c.links.visible=focus==='contact';
    }
    for(const g of wheelGhosts){
      const revealWheel=focus==='spring'||focus==='damper';
      for(let i=0;i<g.materials.length;i++){
        const mat=g.materials[i],opacity=g.opacity[i];
        mat.opacity=opacity*(revealWheel?.23:1);
        mat.transparent=revealWheel||opacity<1;
        mat.depthWrite=!revealWheel;
        mat.needsUpdate=true;
      }
    }
    for(const g of ghosts)for(let i=0;i<g.materials.length;i++){
      const mat=g.materials[i];
      mat.opacity=g.opacity[i]*(1-.95*exposure);
      mat.transparent=exposure>.001||g.opacity[i]<1;
      mat.depthWrite=exposure<.001;
      mat.needsUpdate=true;
    }
    root.visible=exposure>.08;
    // Always deterministic: no previous-frame integration or accumulated squash.
    vehicle.updateMatrixWorld(true);
  };
  return {root,vehicle,update,corners:MECHANICAL_CORNERS};
}
/**
 * The editor can pass this adapter to a scene after Agent 1 has posed wheels
 * and body and Agent 2 has supplied the canonical sample. No duplicate physics.
 */
export function updateMechanicalFromSharedPose(reveal:MechanicalReveal,motion:Ep006Motion,
  focus:MechanicalFocus,exposure01:number){reveal.update({motion,focus,exposure01});}
