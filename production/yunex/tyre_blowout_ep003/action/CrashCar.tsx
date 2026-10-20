/**
 * Agent 10 integrates the USER-APPROVED Agent 8 original GT damage rig
 * (front-right body vertices, lamp and restrained crease) with the exact
 * Agent 1 tyre carcass / Agent 2 four-wheel hubs. No second car or tyre.
 * The Agent 8 rig owns the mesh lifetime and rewindable damage; this
 * adapter supplies the original prepared vehicle and A1 post-pose callback.
 */
import React,{useCallback,useMemo} from 'react';
import * as T from 'three';
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import type {CrashOutcomeFrame} from '../impact/model.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import {prepareTyreRig,applyTyreFrame} from '../mechanics/tyreRig.ts';
import {finishGrandTourer} from '../look/world.tsx';
import {CrashCarRig} from '../impact/Preview.tsx';

export const Agent10DamagedOriginalCar:React.FC<{
  dynamics:VehicleDynamicsFrame;
  tyre:TyreFrame;
  impact:CrashOutcomeFrame;
}>=({dynamics,tyre,impact})=>{
  const rig=useMemo(()=>{
    const original=prepareTyreRig(EP003_SCENE.failedWheel,0);
    finishGrandTourer(original.vehicle);
    return original;
  },[]);
  const makeVehicle=useCallback(()=>rig.vehicle,[rig]);
  const afterPose=useCallback((_car:T.Group,_frame:CrashOutcomeFrame)=>{
    // Apply A1 authoritative rubber/hub matrices AFTER A8's original
    // kit body/lamp/crease damage, including negative-time rewind.
    // A2 rebased dynamics already shares the A8 -86m world-cut X.
    applyTyreFrame(rig,tyre,{dynamics,exposure:0});
  },[rig,tyre,dynamics]);
  // CrashCarRig disposes the original vehicle on unmount; do not dispose
  // rig a second time here. No duplicate car/road-side tyre is rendered.
  return <CrashCarRig frame={impact} makeVehicle={makeVehicle}
    afterPose={afterPose}/>;
};
