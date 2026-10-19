/**
 * Agent 10 cinematic view of Agent 8's REAL deformed original blue GT.
 * The source of all motion, barrier contact, and damage is A8/A9;
 * only the original A1 tyre rig's render geometry is authored here.
 */
import React,{useEffect,useLayoutEffect,useMemo} from 'react';
import * as T from 'three';
import type {VehicleDynamicsFrame,TyreFrame} from '../shared/contract.ts';
import type {CrashOutcomeFrame} from '../impact/model.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import {prepareTyreRig,applyTyreFrame,disposeTyreRig} from '../mechanics/tyreRig.ts';
import {finishGrandTourer} from '../look/world.tsx';

type OriginalDamage=Readonly<{
  body:T.Mesh;
  attribute:T.BufferAttribute;
  rest:Float32Array;
  trim:Map<T.Object3D,{position:T.Vector3;scale:T.Vector3}>;
}>;
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
  const damage=useMemo(():OriginalDamage|null=>{
    const body=rig.vehicle.getObjectByName('arched-body');
    if(!(body instanceof T.Mesh)||!(body.geometry instanceof T.BufferGeometry))return null;
    // Clone car-body geometry, never mutate world-kit source or shared cars.
    body.geometry=body.geometry.clone();
    const attribute=body.geometry.getAttribute('position') as T.BufferAttribute;
    const rest=new Float32Array(attribute.array as ArrayLike<number>);
    const trim=new Map<T.Object3D,{position:T.Vector3;scale:T.Vector3}>();
    rig.vehicle.traverse(node=>{
      if(['lamp-lens','headlamp-housing','lamp-reflector','front-lip'].includes(node.name)){
        trim.set(node,{position:node.position.clone(),scale:node.scale.clone()});
      }
    });
    return {body,attribute,rest,trim};
  },[rig]);
  useEffect(()=>()=>disposeTyreRig(rig),[rig]);
  useLayoutEffect(()=>{
    // A1 authoritative body/hub matrices + spinning/deforming rubber FIRST.
    applyTyreFrame(rig,tyre,{dynamics,exposure:0});
    if(!damage)return;
    const {attribute,rest,body,trim}=damage;
    for(let i=0;i<attribute.count;i++){
      const j=i*3,ox=rest[j],oy=rest[j+1],oz=rest[j+2];
      const nose=Math.max(0,Math.min(1,(ox-1.42)/1));
      const side=Math.max(0,Math.min(1,(-oz-.30)/.72));
      const influence=nose*nose*side*side;
      attribute.setXYZ(i,ox-impact.bumperCrushM*influence,
        oy+impact.fenderCrushM*.18*influence,
        oz+impact.fenderCrushM*.72*influence);
    }
    attribute.needsUpdate=true;
    body.geometry.computeVertexNormals();
    trim.forEach((restTransform,node)=>{
      node.position.copy(restTransform.position);
      node.scale.copy(restTransform.scale);
      if(restTransform.position.x>1.7&&restTransform.position.z<-.12){
        node.position.x-=impact.lampCrushM*.8;
        node.position.z+=impact.lampCrushM*.35;
        if(node.name==='lamp-lens'){
          node.scale.x=restTransform.scale.x*(1-impact.lampCrushM*.9);
        }
      }
    });
  },[rig,dynamics,tyre,impact,damage]);
  return <primitive object={rig.vehicle}/>;
};
