import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {fitInspectionCamera} from '../../src/yunex/modelling-kit/framing.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
test('portrait hero cameras retain every padded vehicle corner during the complete orbit',()=>{
 for(const variant of ['hot-hatch','supercar','formula-modern'])for(let frame=0;frame<90;frame++){
  const s=vehicleSpec(variant),t=frame/30,angle=.55+t*.23;
  const size=[s.length+.5,s.height+.3,s.width+.4],target=[0,s.height/2,0];
  const position=fitInspectionCamera([Math.cos(angle)*11.8,2.05,Math.sin(angle)*11.8],target,size,9/16,42);
  const camera=new T.PerspectiveCamera(42,9/16,.05,300);camera.position.fromArray(position);camera.lookAt(...target);camera.updateMatrixWorld();
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
   const p=new T.Vector3(x*size[0]/2,target[1]+y*size[1]/2,z*size[2]/2).project(camera);
   assert.ok(Math.abs(p.x)<=.861&&Math.abs(p.y)<=.861,`${variant} frame ${frame}: cropped corner`);
  }
 }
});
