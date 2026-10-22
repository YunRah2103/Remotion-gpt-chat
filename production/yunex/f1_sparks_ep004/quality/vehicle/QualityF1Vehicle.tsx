/**
 * EP004 Agent 8: V2 Formula hero adapter. The modelling kit is the only car rig.
 * The EP004 discrete metal contact meshes are the only skid geometry authority.
 * Geometry is illustrative, not homologated Formula 1 CAD.
 */
import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../../../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../../../../src/yunex/world-kit/geometry.ts';
import {sampleRoute} from '../../../../../src/yunex/world-kit/environments.ts';
import {getSkidDescriptors,SKID_LAYOUT,SKID_BOTTOM_Y_M,SKID_THICKNESS_M,SKID_WIDTH_M,PLANK_HALF_LENGTH_M,PLANK_HALF_WIDTH_M} from '../../mechanics/skids.ts';
import {EP004} from '../../shared/contract.ts';
import type {SkidDescriptor,VehicleMotionState,WheelId} from '../../shared/contract.ts';
import {localToWorld} from '../../physics/dynamics.ts';

const close=(a:number,b:number)=>Math.abs(a-b)<1e-6;
const WHEELS:readonly WheelId[]=['front-left','front-right','rear-left','rear-right'];
const engine=new T.MeshPhysicalMaterial({color:'#111a20',metalness:.36,roughness:.37,clearcoat:.24});
const plankMaterial=new T.MeshStandardMaterial({color:'#aa8355',metalness:.02,roughness:.76});
const skidMaterial=new T.MeshPhysicalMaterial({color:'#c7d2d4',metalness:.91,roughness:.19,clearcoat:.12});
const edgeMaterial=new T.MeshStandardMaterial({color:'#485b63',metalness:.61,roughness:.39});

const piece=(parent:T.Group,name:string,size:readonly[number,number,number],point:readonly[number,number,number],material:T.Material)=>{
  const m=new T.Mesh(new T.BoxGeometry(...size),material.clone());
  m.name=name;m.position.set(...point);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
};

/** Pass the original A1/A2 descriptors through unchanged; never invent contact data. */
export const getQualitySkidDescriptors=():readonly SkidDescriptor[]=>getSkidDescriptors();

/**
 * Hide the V2 kit's decorative contacts AFTER every call to the kit animator:
 * animateCinematicVehicle re-enables its flat-ground contact-sparks each frame.
 * The disabled generic skids and plank stay in the rig for non-destructive use.
 */
export function silenceKitContactGeometry(root:T.Group):void {
  root.traverse(node=>{
    if(node.name==='contact-sparks' || node.name==='underfloor' ||
       node.name==='metal-skid' || node.name==='composite-plank' ||
       node.name==='carbon-floor' || node.name==='floor' || node.name==='floor-diffuser')
      node.visible=false;
  });
}

function addPhysicsFloor(root:T.Group):void {
  const floor=new T.Group();floor.name='EP004-QUALITY-PHYSICS-FLOOR';root.add(floor);
  piece(floor,'EP004-quality-carbon-tub',[4.29,.060,.82],[-.045,.163,0],engine);
  for(const side of [-1,1]){
    piece(floor,'EP004-quality-carbon-floor-edge',[3.90,.075,.13],[-.05,.175,side*.47],edgeMaterial);
    piece(floor,'EP004-quality-plank-side-rail',[2*PLANK_HALF_LENGTH_M,.035,.055],[0,.0875,side*(PLANK_HALF_WIDTH_M-.0275)],plankMaterial);
    for(const x of [-1.54,-.54,.46,1.50]){
      // Structural spacers bridge nonmetal plank's top (.105) to carbon bottom (.133).
      piece(floor,'EP004-quality-plank-standoff',[.085,.038,.060],[x,.120,side*.16],edgeMaterial);
      piece(floor,'EP004-quality-plank-fastener',[.045,.008,.030],[x,.103,side*.16],skidMaterial);
    }
  }
  // Nonmetal plank is continuous except at the three exact EP004 metal inserts.
  const sorted=[...SKID_LAYOUT].sort((a,b)=>a.xM-b.xM);
  let cursor=-PLANK_HALF_LENGTH_M;
  for(const skid of sorted){
    const left=skid.xM-skid.lengthM/2;
    if(left>cursor+1e-7)
      piece(floor,'EP004-quality-composite-plank',[left-cursor,.035,SKID_WIDTH_M],[(left+cursor)/2,.0875,0],plankMaterial);
    cursor=skid.xM+skid.lengthM/2;
  }
  if(cursor<PLANK_HALF_LENGTH_M)
    piece(floor,'EP004-quality-composite-plank',[PLANK_HALF_LENGTH_M-cursor,.035,SKID_WIDTH_M],[(PLANK_HALF_LENGTH_M+cursor)/2,.0875,0],plankMaterial);
  for(const skid of SKID_LAYOUT){
    // Centred box bottom = SKID_BOTTOM_Y_M, with no parent/shell translations.
    const metal=piece(floor,`EP004-skid-${skid.id}`,
      [skid.lengthM,SKID_THICKNESS_M,SKID_WIDTH_M],
      [skid.xM,SKID_BOTTOM_Y_M+SKID_THICKNESS_M/2,0],skidMaterial);
    metal.userData={metalSkid:true,skidId:skid.id,material:skid.material,
      mandatory:skid.mandatory,localBottomPoint:[skid.xM,SKID_BOTTOM_Y_M,0]};
    for(const side of [-1,1])
      piece(floor,`EP004-quality-skid-${skid.id}-edge`,[skid.lengthM-.025,.007,.018],
        [skid.xM,.0835,side*(SKID_WIDTH_M/2-.012)],edgeMaterial);
  }
  // The new EP004 floor is the ONE visible contact assembly. The V2 shell,
  // tyres, suspension, wings, brake discs and body are all retained.
}

export function createQualityF1Vehicle({driver=false}:{driver?:boolean}={}):T.Group {
  const root=createCinematicVehicle({
    variant:'formula-modern',quality:'hero',color:'#079f9e',accent:'#e4a35a',
    wheelColor:'#bdcbd2',paintPreset:'lacquer',tyreType:'slick',
    interior:false,driver,lights:true,optimize:true,
  });
  root.name='EP004-QUALITY-V2-FORMULA';
  addPhysicsFloor(root);
  silenceKitContactGeometry(root);
  root.userData.ep004QualityKitV2=true;
  root.userData.skidDescriptors=getQualitySkidDescriptors();
  assertQualitySkidGeometry(root);
  return root;
}

export function assertQualitySkidGeometry(root:T.Group,motion?:VehicleMotionState):void {
  const descriptors=getQualitySkidDescriptors();
  const names:string[]=[];
  root.updateMatrixWorld(true);
  for(const descriptor of descriptors){
    const mesh=root.getObjectByName(`EP004-skid-${descriptor.id}`);
    if(!(mesh instanceof T.Mesh)||mesh.userData.metalSkid!==true)
      throw new Error(`EP004 quality missing physical skid: ${descriptor.id}`);
    const geo=mesh.geometry;geo.computeBoundingBox();
    if(!geo.boundingBox)throw new Error('Missing skid bounds');
    const pt=new T.Vector3(
      (geo.boundingBox.min.x+geo.boundingBox.max.x)/2,
      geo.boundingBox.min.y,
      (geo.boundingBox.min.z+geo.boundingBox.max.z)/2,
    );
    const inRoot=mesh.localToWorld(pt).clone();
    const local=root.worldToLocal(inRoot.clone());
    if(local.toArray().some((v,i)=>!close(v,descriptor.localBottomPoint[i])))
      throw new Error(`EP004 quality metal/descriptor mismatch: ${descriptor.id}`);
    if(motion){
      const expected=localToWorld(descriptor.localBottomPoint,motion);
      if(inRoot.toArray().some((v,i)=>Math.abs(v-expected[i])>1e-5))
        throw new Error(`EP004 quality world-contact mismatch: ${descriptor.id}`);
    }else if(!close(local.y,EP004.initialSkidBottomClearanceM)) {
      throw new Error(`EP004 quality baseline clearance mismatch: ${descriptor.id}`);
    }
    names.push(mesh.name);
  }
  if(new Set(names).size!==3)throw new Error('Exactly three unique real metal skids required');
  for(const name of ['contact-sparks','underfloor','metal-skid','composite-plank']){
    root.traverse(o=>{if(o.name===name&&o.visible)throw new Error(`Unapproved V2 emission/duplicate source visible: ${name}`);});
  }
}

/** Apply ONLY approved A2 route and wheel phase: heave is already in worldPosition.
 * compression:0 prevents kit shell auto-lowering a second time.
 * Absolute state => reverse seek / out-of-order frame deterministic.
 */
export function applyQualityF1Motion(root:T.Group,motion:VehicleMotionState,reveal01=0):void {
  if(!Number.isFinite(motion.tSec)||motion.tSec<0)throw new Error('Invalid EP004 absolute time');
  const dist=-motion.wheelRotationRad*EP004.wheelRadiusM;
  // Steering is a modest VISUAL derivative of the accepted track tangent.
  // The authoritative A2 world pose still determines the actual trajectory.
  const nextYaw=sampleRoute('track',motion.routeDistanceM+1.2).yaw;
  const yawDelta=Math.atan2(Math.sin(nextYaw-motion.yawRad),Math.cos(nextYaw-motion.yawRad));
  const visualSteer=Math.max(-.18,Math.min(.18,yawDelta*.85));
  animateCinematicVehicle(root,{
    frame:Math.round(motion.tSec*EP004.fps),fps:EP004.fps,
    distance:dist,steer:visualSteer,compression:0,
    cutaway:Math.max(0,Math.min(.55,reveal01*.55)),
  });
  // Kit rig has a separate suspension-mount group for each of these four wheels.
  for(const id of WHEELS){
    const m=root.getObjectByName(`mount-${id}`);
    if(!(m instanceof T.Group)||!m.userData.restPosition)
      throw new Error(`Missing genuine V2 suspension mount ${id}`);
    const rest=m.userData.restPosition as number[];
    const travel=Math.max(0,motion.wheelCompressionM[id]??0);
    m.position.y=rest[1]+travel;
    // The kit's wishbones and inboard pushrods are separate THREE objects.
    // Updating only the wheel pivot would make the suspension detach in close-ups.
    const links=root.getObjectByName(`links-mount-${id}`);
    if(!(links instanceof T.Group))throw new Error(`Missing V2 suspension links for ${id}`);
    for(const linkObj of links.children){
      const link=linkObj.userData.link as
        {a:[number,number,number];b:[number,number,number];unit?:boolean}|undefined;
      if(!link)continue;
      const a=new T.Vector3(...link.a),b=new T.Vector3(...link.b);
      b.y+=travel;
      const delta=b.clone().sub(a),length=delta.length();
      if(length<=0)throw new Error(`Invalid suspension link on ${id}`);
      linkObj.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());
      if(link.unit){linkObj.position.copy(a);linkObj.scale.y=length;}
      else{
        linkObj.position.copy(a).add(b).multiplyScalar(.5);
        linkObj.scale.y=length/new T.Vector3(...link.a).distanceTo(new T.Vector3(...link.b));
      }
    }
    // Kit steering yaw remains on its original front-wheel pivot; chassis yaw is root-only.
  }
  root.rotation.order='YZX'; // Yaw(Y) * Pitch(Z) * Roll(X), matching A2 localToWorld
  root.rotation.set(motion.rollRad,motion.yawRad,motion.pitchRad);
  root.position.set(...motion.worldPosition);
  silenceKitContactGeometry(root); // must follow kit animation, which reactivates spark instance
  root.updateMatrixWorld(true);
  assertQualitySkidGeometry(root,motion);
}

export type QualityF1VehicleProps={motion:VehicleMotionState;reveal01?:number;driver?:boolean};
export const QualityF1Vehicle:React.FC<QualityF1VehicleProps>=({motion,reveal01=0,driver=false})=>{
  const model=useMemo(()=>createQualityF1Vehicle({driver}),[driver]);
  useEffect(()=>()=>disposeObject(model),[model]);
  applyQualityF1Motion(model,motion,reveal01);
  return <primitive object={model}/>;
};
