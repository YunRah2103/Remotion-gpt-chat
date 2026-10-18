import {readFile,readdir} from 'node:fs/promises';import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
const dir=process.argv[2]??'out/world-kit/glb';const files=(await readdir(dir)).filter(f=>f.endsWith('.glb'));assert.equal(files.length,19);
const loader=new GLTFLoader();
for(const file of files){const b=await readFile(`${dir}/${file}`);assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);const gltf=await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.length),'');gltf.scene.updateMatrixWorld(true);const bounds=new Box3().setFromObject(gltf.scene,true),size=bounds.getSize(new Vector3());assert.ok(Math.abs(bounds.min.y)<.025,file);assert.ok(size.x>1.7,file);let wheels=0;gltf.scene.traverse(o=>{if(o.userData.wheel)wheels++;});assert.equal(wheels,file.includes('bike')?2:file.includes('tractor')?6:4,file);console.log('ROUNDTRIP',file);}
