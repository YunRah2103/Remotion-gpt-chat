import {mkdir,writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Box3} from 'three';
import assert from 'node:assert/strict';
import {createCinematicVehicle,animateCinematicVehicle,HERO_VEHICLES} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
if(!globalThis.FileReader)globalThis.FileReader=class {readAsArrayBuffer(b){b.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(data=>{this.result=`data:${b.type};base64,${Buffer.from(data).toString('base64')}`;this.onloadend?.();});}};
const out='out/modelling-kit-v2/glb';await mkdir(out,{recursive:true});const manifest=[];
for(const variant of HERO_VEHICLES)for(const pose of ['intact','mechanical']){
 const g=createCinematicVehicle({variant,quality:'hero'});animateCinematicVehicle(g,{frame:40,fps:24,cutaway:pose==='mechanical'?.98:0,exploded:pose==='mechanical'?.4:0});
 // Rest arrays are runtime data, not model metadata; exported pose is intentionally baked.
 g.traverse(o=>{for(const key of ['restVertices','baseline','link','restPosition','rest','motion','explode'])delete o.userData[key];});
 const binary=await new GLTFExporter().parseAsync(g,{binary:true,onlyVisible:true}),bytes=Buffer.from(binary);assert.equal(bytes.toString('ascii',0,4),'glTF');
 const loaded=await new GLTFLoader().parseAsync(binary,'');let wheels=0;loaded.scene.traverse(o=>{if(o.userData.wheel)wheels++;});assert.equal(wheels,4);assert.ok(new Box3().setFromObject(loaded.scene).max.y>0);
 await writeFile(`${out}/${variant}-${pose}.glb`,bytes);manifest.push({variant,pose,bytes:bytes.length,wheels,animation:'baked pose; recreate TS rig for damage/cutaway animation'});disposeObject(g);disposeObject(loaded.scene);
}
await writeFile(`${out}/catalog.json`,JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));
