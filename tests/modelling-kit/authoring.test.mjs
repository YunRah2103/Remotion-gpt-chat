import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const load=()=>import('../../src/yunex/modelling-kit/authoring.ts');
test('project geometry edits isolate source meshes, preserve rigs and are reversible',async()=>{
 const {editModel}=await load();const source=new T.Group();const panel=new T.Mesh(new T.BoxGeometry(2,1,1,4,2,2));panel.name='panel';source.add(panel);
 const original=Array.from(panel.geometry.attributes.position.array);
 const model=editModel(source,{id:'wide',version:1,edits:[{target:'panel',scale:[1,1,1.3],deform:{axis:'y',amount:.2,along:'x'}}]});
 assert.deepEqual(Array.from(panel.geometry.attributes.position.array),original);assert.notDeepEqual(Array.from(model.getObjectByName('panel').geometry.attributes.position.array),original);
 assert.equal(model.getObjectByName('panel').scale.z,1.3);assert.equal(panel.scale.z,1);
 assert.deepEqual(Array.from(editModel(source,{id:'stock',version:1,edits:[]}).getObjectByName('panel').geometry.attributes.position.array),original);
 assert.throws(()=>editModel(source,{id:'bad',version:1,edits:[{target:'missing',scale:[1,1,1]}]}),/missing/);
});
test('assembled turbo pipes terminate at real transformed mounting points and shaft animation seeks deterministically',async()=>{
 const {createAssembly,animateAssembly,validateModel}=await load();
 const model=createAssembly({id:'boosted',version:1,nodes:[{id:'engine',part:'v8'},{id:'turbo',part:'turbo-large',position:[0,.3,1]}],connections:[{from:'engine:exhaust',to:'turbo:exhaust-in',radius:.04},{from:'turbo:outlet',to:'engine:intake',radius:.035}]});
 assert.equal(validateModel(model).errors.length,0);assert.ok(model.getObjectByName('connection-0'));animateAssembly(model,37,30);const pose=model.toJSON();animateAssembly(model,1,30);animateAssembly(model,37,30);assert.deepEqual(model.toJSON(),pose);
 assert.throws(()=>createAssembly({id:'bad',version:1,nodes:[{id:'e',part:'v8'}],connections:[{from:'e:absent',to:'e:intake'}]}),/mount/);
});
test('joint mounting aligns both position and opposing direction with parent transforms',async()=>{
 const {attachAt}=await load();const parent=new T.Group();parent.rotation.y=.7;parent.scale.setScalar(2);const socket=new T.Object3D();socket.name='mount:socket';socket.position.set(1,2,3);socket.userData.direction=[1,0,0];parent.add(socket);
 const child=new T.Group();const plug=new T.Object3D();plug.name='mount:plug';plug.position.set(.2,0,0);plug.userData.direction=[0,1,0];child.add(plug);attachAt(parent,'socket',child,'plug');parent.updateMatrixWorld(true);
 assert.ok(socket.getWorldPosition(new T.Vector3()).distanceTo(plug.getWorldPosition(new T.Vector3()))<1e-8);
 const a=new T.Vector3(1,0,0).transformDirection(socket.matrixWorld),b=new T.Vector3(0,1,0).transformDirection(plug.matrixWorld);assert.ok(a.dot(b)<-.999);
});
test('diagnostics reject nonfinite mesh vertices and report broad-phase overlaps without claiming collision certainty',async()=>{
 const {validateModel}=await load();const root=new T.Group();const a=new T.Mesh(new T.BoxGeometry());a.name='a';const b=a.clone();b.name='b';root.add(a,b);assert.ok(validateModel(root).warnings.some(x=>x.includes('overlap')));a.geometry.attributes.position.setX(0,NaN);assert.ok(validateModel(root).errors.length);
});
test('custom components can add geometry, replace a source panel and restore articulated poses',async()=>{
 const {buildComponents,animateComponents}=await load();const root=new T.Group();const stock=new T.Mesh(new T.BoxGeometry());stock.name='stock-wing';root.add(stock);
 buildComponents(root,[{id:'custom-wing',parent:'',replace:'stock-wing',shape:{kind:'box',size:[.35,.05,1.7]},position:[-1,.8,0],joint:{axis:'z',min:-.2,max:.4}}]);
 assert.equal(stock.visible,false);const wing=root.getObjectByName('custom-wing');assert.ok(wing instanceof T.Mesh);animateComponents(root,{'custom-wing':1});assert.equal(wing.rotation.z,.4);animateComponents(root,{'custom-wing':0});assert.equal(wing.rotation.z,-.2);
 assert.throws(()=>buildComponents(root,[{id:'bad',shape:{kind:'box',size:[1,-1,1]}}]),/size/);
});
test('intentionally hidden damage fragments may have zero scale without failing intact vehicle QA',async()=>{const {validateModel}=await load();const root=new T.Group(),hidden=new T.Group();hidden.visible=false;hidden.scale.setScalar(0);const child=new T.Mesh(new T.BoxGeometry());child.scale.setScalar(0);hidden.add(child);root.add(hidden);assert.deepEqual(validateModel(root).errors,[]);});
test('custom turbo powertrain installs into a fresh vehicle rig and survives reverse animation',async()=>{const {createCinematicVehicle,animateCinematicVehicle}=await import('../../src/yunex/modelling-kit/rig.ts');const {TWIN_TURBO_V8}=await import('../../src/yunex/modelling-kit/v3-proofs.ts');const vehicle=createCinematicVehicle({variant:'supercar',quality:'hero',powertrain:TWIN_TURBO_V8,optimize:false});const engine=vehicle.getObjectByName('engine');assert.ok(engine.getObjectByName('turbo-left'));animateCinematicVehicle(vehicle,{frame:77,fps:30});const a=engine.getObjectByName('turbo-left').getObjectByName('rotating-shaft').rotation.toArray();animateCinematicVehicle(vehicle,{frame:2,fps:30});assert.notDeepEqual(engine.getObjectByName('turbo-left').getObjectByName('rotating-shaft').rotation.toArray(),a);animateCinematicVehicle(vehicle,{frame:77,fps:30});assert.deepEqual(engine.getObjectByName('turbo-left').getObjectByName('rotating-shaft').rotation.toArray(),a);assert.ok(engine.scale.x>0&&engine.scale.x<1);});
test('nested fitted powertrains validate connections in their owning assembly coordinates',async()=>{const {validateModel}=await load();const {createCinematicVehicle}=await import('../../src/yunex/modelling-kit/rig.ts');const {TWIN_TURBO_V8}=await import('../../src/yunex/modelling-kit/v3-proofs.ts');const car=createCinematicVehicle({variant:'supercar',powertrain:TWIN_TURBO_V8,optimize:false});car.position.set(5,1,-2);car.rotation.y=.8;assert.deepEqual(validateModel(car).errors,[]);});
test('aero proofs articulate around local hinges rather than the vehicle origin',async()=>{const {buildComponents,animateComponents}=await load();const {V3_PROOFS}=await import('../../src/yunex/modelling-kit/v3-proofs.ts');for(const [kind,id] of [['sports','v3-rear-wing'],['formula','v3-front-flap']]){const root=new T.Group();root.name='body-shell';const spec=V3_PROOFS[kind].vehicle.components.find(c=>c.id===id);buildComponents(root,[{...spec,replace:undefined}]);const part=root.getObjectByName(id),center=()=>new T.Box3().setFromObject(part).getCenter(new T.Vector3());animateComponents(root,{[id]:0});const before=center();animateComponents(root,{[id]:1});assert.ok(center().distanceTo(before)<.005,kind+' wing stays on hinge');}});
test('GLB adapters roundtrip custom geometry and retain explicit import provenance',async()=>{const {buildComponents,exportGLB,importGLB}=await load();if(!globalThis.FileReader)globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(data=>{this.result=`data:${b.type};base64,${Buffer.from(data).toString('base64')}`;this.onloadend?.();});}};const root=new T.Group();buildComponents(root,[{id:'custom-panel',shape:{kind:'box',size:[.5,.2,.1]}}]);const bytes=await exportGLB(root);assert.ok(bytes instanceof ArrayBuffer);const result=await importGLB(bytes,{id:'imported-panel',units:'metres',source:'custom-panel.glb'});assert.ok(result.scene.getObjectByName('custom-panel'));assert.equal(result.scene.userData.import.source,'custom-panel.glb');const size=new T.Box3().setFromObject(result.scene).getSize(new T.Vector3());assert.ok(Math.abs(size.x-.5)<1e-6);});
