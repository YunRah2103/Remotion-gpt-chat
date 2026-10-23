/** Node 22.18+/24. Exports original meshes with reusable steering/roll node names. */
import {mkdir,writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
if(!globalThis.FileReader)globalThis.FileReader=class {
 readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}).catch(error=>this.onerror?.(error));}
 readAsDataURL(blob){blob.arrayBuffer().then(data=>{this.result=`data:${blob.type};base64,${Buffer.from(data).toString('base64')}`;this.onloadend?.();}).catch(error=>this.onerror?.(error));}
};
const dir=process.argv[2]??'out/world-kit/glb';await mkdir(dir,{recursive:true});const exporter=new GLTFExporter(),manifest=[];
for(const spec of VEHICLES){const model=createVehicle({variant:spec.id});const binary=await exporter.parseAsync(model,{binary:true,onlyVisible:true});await writeFile(`${dir}/${spec.id}.glb`,Buffer.from(binary));manifest.push({...spec,file:`${spec.id}.glb`,bytes:binary.byteLength});disposeObject(model);console.log('EXPORTED',spec.id,binary.byteLength);}
await writeFile(`${dir}/catalog.json`,JSON.stringify({units:'metres',forward:'+X',up:'+Y',groundY:0,models:manifest},null,2));
