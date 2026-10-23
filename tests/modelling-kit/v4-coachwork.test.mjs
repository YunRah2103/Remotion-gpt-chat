import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
for(const variant of ['supercar','coupe','rally-hatch'])test(`studio ${variant} has authored body, continuous cabin and real arch clearance`,()=>{
 const m=createCinematicVehicle({variant,quality:'hero',bodyDetail:'studio',optimize:false});
 try{
 assert.equal(m.userData.bodyArchitecture,'section-loft-v4');
 const shell=m.getObjectByName('body-shell'),body=m.getObjectByName('arched-body');
 assert.ok(body.geometry.attributes.position.count>1000);
 for(const name of ['roof','windshield','rear-glass','studio-door-left','studio-door-right','studio-fender-lip'])assert.ok(m.getObjectByName(name),name);
 const b=new T.Box3().setFromObject(m.getObjectByName('roof'));
 assert.ok(b.max.y>(variant==='rally-hatch'?1.45:1.30));
 assert.ok(b.max.y<1.72);
 const ray=new T.Raycaster(new T.Vector3(1.39,.45,-3),new T.Vector3(0,0,1));
 if(variant==='supercar')assert.equal(ray.intersectObject(body).length,0,'wheel aperture must remain open');
 const before=body.geometry.attributes.position.array.slice();animateCinematicVehicle(m,{frame:90,fps:30,distance:22});animateCinematicVehicle(m,{frame:0,fps:30});assert.deepEqual(body.geometry.attributes.position.array,before);
 const sidePane=m.getObjectByName('side-glass');assert.ok(new T.Box3().setFromObject(sidePane).max.y>b.min.y-.18,'glass reaches roof pillar');
 let invalid=0;m.traverse(o=>{if(o instanceof T.Mesh){for(const k of ['position','normal']){const a=o.geometry.attributes[k];if(a)for(const v of a.array)if(!Number.isFinite(v))invalid++;}}});assert.equal(invalid,0);
 }finally{disposeObject(m);}
});
test('studio detail rejects unsupported vehicle without silently choosing another body',()=>assert.throws(()=>createCinematicVehicle({variant:'sport-bike',bodyDetail:'studio'}),/studio.*(supercar|supported)/i));
test('studio fascia cap is opaque outward-facing bodywork between its actual apertures',()=>{
 const m=createCinematicVehicle({variant:'supercar',bodyDetail:'studio',optimize:false});m.updateMatrixWorld(true);
 try{const body=m.getObjectByName('arched-body');for(const sign of [-1,1]){const hits=new T.Raycaster(new T.Vector3(sign*3,.55,0),new T.Vector3(-sign,0,0)).intersectObject(body);assert.ok(hits.length,`missing ${sign>0?'front':'rear'} fascia`);assert.ok(hits[0].face.normal.x*sign>.5);}}finally{disposeObject(m);}
});
test('studio glass and replaceable doors have closed inward returns',()=>{
 const m=createCinematicVehicle({variant:'supercar',bodyDetail:'studio',optimize:false});
 try{for(const name of ['windshield','side-glass','rear-glass','studio-door-left','studio-door-right']){const o=m.getObjectByName(name);assert.ok(o.userData.wallThickness>=.005,name);const g=o.geometry.index?o.geometry:o.geometry.toNonIndexed(),p=g.attributes.position,idx=g.index,edges=new Map();const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');for(let i=0;i<(idx?idx.count:p.count);i+=3){const v=[0,1,2].map(j=>key(idx?idx.getX(i+j):i+j));for(let j=0;j<3;j++){const edge=[v[j],v[(j+1)%3]].sort().join('/');edges.set(edge,(edges.get(edge)??0)+1);}}assert.ok([...edges.values()].every(n=>n===2),name+' must be manifold');}}finally{disposeObject(m);}
});
test('studio bodies never silently downgrade to legacy geometry at another quality',()=>{for(const quality of ['standard','lightweight'])assert.throws(()=>createCinematicVehicle({variant:'supercar',bodyDetail:'studio',quality}),/studio.*hero/i);});
test('installed studio outlets remain open through their actual bumper recess',()=>{
 const m=createCinematicVehicle({variant:'supercar',bodyDetail:'studio',optimize:false});m.updateMatrixWorld(true);try{const mount=m.getObjectByName('exhaust-outlet-left');assert.ok(mount);const p=mount.getWorldPosition(new T.Vector3()),direction=new T.Vector3(0,0,-1).transformDirection(mount.matrixWorld);const ray=new T.Raycaster(p.clone().addScaledVector(direction,-.025),direction,0,.20);const bumper=m.getObjectByName('rear-diffuser');assert.equal(ray.intersectObject(bumper).length,0,'diffuser must not plug the open exhaust bore');assert.ok(m.getObjectByName('connected-exhaust-route'));}finally{disposeObject(m);}
});
