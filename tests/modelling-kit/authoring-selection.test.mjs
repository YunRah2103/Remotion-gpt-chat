import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {applyEdits,modelCatalogue,attachAt,buildComponents} from '../../src/yunex/modelling-kit/authoring.ts';
test('catalogue paths edit one duplicate rim and ambiguous names fail with actionable paths',()=>{
 const root=new T.Group();for(let i=0;i<2;i++){const g=new T.Group();g.name='wheel';const m=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());m.name='rim';g.add(m);root.add(g);}
 const rims=modelCatalogue(root).filter(n=>n.name==='rim');assert.equal(rims.length,2);assert.notEqual(rims[0].path,rims[1].path);assert.ok(rims.every(n=>typeof n.path==='string'));
 applyEdits(root,{id:'private',version:1,edits:[{target:rims[1].path,scale:[1,1.1,1]}]});assert.equal(root.children[0].children[0].scale.y,1);assert.equal(root.children[1].children[0].scale.y,1.1);
 assert.throws(()=>applyEdits(root,{id:'ambiguous',version:1,edits:[{target:'rim',match:'unique',visible:false}]}),/Ambiguous.*rim/);applyEdits(root,{id:'legacy',version:1,edits:[{target:'rim',visible:false}]});assert.ok(root.userData.authoringWarnings[0].includes('Ambiguous'));
});
test('typed mounts reject incompatible plugs without changing parentage and align compatible ports',()=>{
 const parent=new T.Group(),child=new T.Group();buildComponents(parent,[{id:'socket',shape:{kind:'box',size:[1,1,1]},mounts:[{name:'seat',position:[0,1,0],direction:[0,1,0],accepts:['engine']}]}]);buildComponents(child,[{id:'part',shape:{kind:'box',size:[.2,.2,.2]},mounts:[{name:'plug',position:[0,0,0],direction:[0,-1,0],kind:'wheel'}]}]);
 assert.throws(()=>attachAt(parent,'seat',child,'plug'),/Incompatible/);assert.equal(child.parent,null);child.getObjectByName('mount:plug').userData.kind='engine';attachAt(parent,'seat',child,'plug');assert.equal(child.parent,parent);
 assert.ok(parent.getObjectByName('mount:seat').getWorldPosition(new T.Vector3()).distanceTo(child.getObjectByName('mount:plug').getWorldPosition(new T.Vector3()))<1e-9);
});
