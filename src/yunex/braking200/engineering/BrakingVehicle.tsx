import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import type {BrakingSimulationState,WheelKey,WheelAnchor} from '../contracts.ts';
import {wheelAnchors,BRAKING_EP001} from '../contracts.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {createVehicle} from '../../world-kit/vehicles.ts';
import {animateVehicle,placeVehicle} from '../../world-kit/motion.ts';
import type {RoutePose} from '../../world-kit/environments.ts';
import {disposeObject} from '../../world-kit/geometry.ts';
import {createBrakeAssembly,applyBrakeAssemblyPose} from './BrakeAssembly.tsx';
import type {BrakeRig} from './BrakeAssembly.tsx';
import {clamp01,poseFromSimulation} from './mechanics.ts';

export type BrakingVehicleProps = {
  simulation: BrakingSimulationState;
  pose?: RoutePose;
  steerRad?: number;
  cutawayWheel?: WheelKey;
  cutaway01?: number;
  heatIllustration01?: number;
};

type WheelMount = {
  anchor: WheelAnchor;
  roll: THREE.Group;
  rig: BrakeRig;
};
type DecorativeSill = {side:'left'|'right'; object:THREE.Object3D};

function createContextVehicle():{model:THREE.Group;mounts:WheelMount[];sills:DecorativeSill[]} {
  const spec=vehicleSpec(BRAKING_EP001.vehicleVariant);
  const model=createVehicle({
    variant:BRAKING_EP001.vehicleVariant,
    color:BRAKING_EP001.carPaint,
    accent:BRAKING_EP001.caliperAccent,
    lights:false,
  });
  const mounts:WheelMount[]=[];
  const sills:DecorativeSill[]=[];
  const anchors=wheelAnchors(spec);
  model.traverse(obj=>{
    if(obj.name==='brake-caliper') obj.visible=false;
    if(obj.name==='sill'){
      sills.push({side:obj.position.z>=0?'left':'right',object:obj});
    }
  });
  for(const anchor of anchors){
    let pivot:THREE.Group|undefined;
    model.traverse(obj=>{
      if(obj instanceof THREE.Group && obj.name.startsWith('steer-') &&
        Math.abs(obj.position.x-anchor.center[0])<.00001 &&
        Math.abs(obj.position.z-anchor.center[2])<.00001) pivot=obj;
    });
    if(!pivot) throw new Error('Kit wheel pivot missing at '+anchor.id);
    const roll=pivot.children.find(child=>child.name==='wheel-roll');
    if(!(roll instanceof THREE.Group)) throw new Error('Kit wheel roll missing: '+anchor.id);
    const sign=anchor.side==='left'?1:-1;
    const rig=createBrakeAssembly({
      wheelRadiusM:anchor.radiusM,wheel:anchor.id,
      accent:BRAKING_EP001.caliperAccent,
      axialOffsetM:sign*.047,
    });
    pivot.add(rig.root);
    mounts.push({anchor,roll,rig});
  }
  if(mounts.length!==4) throw new Error('Four braking rigs required');
  return {model,mounts,sills};
}

/** Reuses the untouched kit car and steering pivots; A2 state is authoritative. */
export const BrakingVehicle: React.FC<BrakingVehicleProps> = ({
  simulation,pose,steerRad=0,cutawayWheel,cutaway01=0,heatIllustration01=0,
})=>{
  const context=useMemo(createContextVehicle,[]);
  useEffect(()=>()=>disposeObject(context.model),[context]);
  animateVehicle(context.model,simulation.traveledM,steerRad);
  // The generic kit's thin decorative side sill traverses the wheel opening.
  // In this FILM-ONLY cutaway hide the near-side sill instead of allowing a
  // black chassis strip to cover the educational rotor macro. The upstream
  // car model, other films and the far-side sill remain untouched.
  const exposed=cutawayWheel!==undefined && clamp01(cutaway01)>=.35;
  for(const sill of context.sills){
    sill.object.visible=!(exposed && cutawayWheel?.endsWith('-'+sill.side));
  }
  for (const mount of context.mounts){
    const selected=mount.anchor.id===cutawayWheel;
    const cutaway=selected?clamp01(cutaway01):0;
    const poseForWheel=poseFromSimulation(
      simulation,mount.anchor.id,cutaway,selected?heatIllustration01:0,
    );
    // No independent speed curve: both roll by -A2 positive travel angle.
    mount.roll.rotation.z=poseForWheel.wheelRotationRad;
    // Clear film-level cutaway shows the rotor instead of falsely placing it
    // on top of the kit's opaque wheel and spokes.
    mount.roll.visible=cutaway<.35;
    applyBrakeAssemblyPose(mount.rig,poseForWheel);
  }
  if(pose) placeVehicle(context.model,pose);
  else {context.model.position.set(0,0,0);context.model.rotation.set(0,0,0);}
  return <primitive object={context.model}/>;
};
