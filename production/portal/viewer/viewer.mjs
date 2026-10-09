import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const el=id=>document.getElementById(id);
const message=t=>{el('message').textContent=t};
const stage=el('stage');
const renderer=new THREE.WebGLRenderer({antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
stage.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#101923');
const camera=new THREE.PerspectiveCamera(45,1,.01,10000);
camera.position.set(4,2.5,5);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
const lights=[new THREE.AmbientLight(0xffffff,1.05),new THREE.DirectionalLight(0xffffff,3.1),
new THREE.DirectionalLight(0x8cbae9,1.6)];
scene.add(...lights);lights[1].position.set(4,7,5);lights[2].position.set(-5,1,-3);
scene.add(new THREE.GridHelper(20,20,0x344459,0x202c38));
let model=null,meshes=[],selected=null,wireframe=false,exploded=false,centre=new THREE.Vector3(),
span=1;
const loader=new GLTFLoader();
const normName=(mesh,i)=>mesh.name||('Mesh '+(i+1));
const originalMaterials=new WeakMap();
const originalPositions=new WeakMap();
function restore(){
 for(const mesh of meshes){mesh.position.copy(originalPositions.get(mesh));mesh.visible=true;mesh.material=originalMaterials.get(mesh)}
 selected=null;el('details').textContent='No mesh selected.';
}
function refreshExplosion(){
 if(!meshes.length)return;
 const amount=exploded?Number(el('distance').value)*span*.24:0;
 scene.updateMatrixWorld(true);
 for(const mesh of meshes){
   const initial=originalPositions.get(mesh);
   mesh.position.copy(initial);
 }
 model.updateMatrixWorld(true);
 for(const mesh of meshes){
   const world=new THREE.Vector3();mesh.getWorldPosition(world);
   const dir=world.sub(centre);if(dir.lengthSq()<.0001)dir.set(0,1,0);dir.normalize();
   if(mesh.parent){
     const destination=dir.clone().multiplyScalar(amount);
     const inverse=new THREE.Matrix4().copy(mesh.parent.matrixWorld).invert();
     destination.transformDirection(inverse);
     mesh.position.copy(originalPositions.get(mesh)).add(destination);
   }
 }
}
function fit(){
 const bounds=new THREE.Box3().setFromObject(model);
 const size=bounds.getSize(new THREE.Vector3());
 span=Math.max(size.length(),.05);
 bounds.getCenter(centre);
 controls.target.copy(centre);
 camera.position.copy(centre).add(new THREE.Vector3(span*.8,span*.52,span*.95));
 camera.near=Math.max(span/1000,.001);camera.far=Math.max(span*200,100);
 camera.updateProjectionMatrix();controls.update();
}
function build(modelScene,name){
 if(model)scene.remove(model);
 model=modelScene;scene.add(model);
 meshes=[];model.traverse(obj=>{if(obj.isMesh){
   meshes.push(obj);originalMaterials.set(obj,obj.material);originalPositions.set(obj,obj.position.clone());
 }});
 if(!meshes.length){message('GLB contains no visible mesh');document.body.classList.remove('loaded');return}
 document.body.classList.add('loaded');
 exploded=false;wireframe=false;el('explode').textContent='Exploded view: off';el('wire').textContent='Wireframe: off';
 const parts=el('parts');parts.replaceChildren();
 meshes.forEach((mesh,i)=>{
   const button=document.createElement('button');button.textContent=normName(mesh,i);
   button.addEventListener('click',()=>{selected=mesh;showSelection(mesh);});
   parts.append(button);
 });
 fit();message(name+': '+meshes.length+' mesh objects · original hierarchy preserved');
}
function showSelection(mesh){
 let mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 el('details').textContent=JSON.stringify({
   name:mesh.name||'unnamed',geometry:mesh.geometry?.type,
   triangleCount:mesh.geometry?.index?mesh.geometry.index.count/3:
      (mesh.geometry?.getAttribute('position')?.count||0)/3,
   materials:mats.map(m=>({name:m.name||'',metalness:m.metalness,roughness:m.roughness})),
   scale:mesh.scale.toArray().map(n=>+n.toFixed(3))
 },null,2);
}
function loadBuffer(data,name){
 message('Parsing '+name+' …');
 loader.parse(data,'',(gltf)=>build(gltf.scene,name),(err)=>{console.error(err);message('Could not parse GLB. Use self-contained binary glTF 2.0.')});
}
el('file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(file.size>100*1024*1024){message('File larger than the 100 MB browser viewer limit');return}
 loadBuffer(await file.arrayBuffer(),file.name);
});
el('loadUrl').addEventListener('click',async()=>{
 try{
  const url=new URL(el('url').value);
  if(url.protocol!=='https:'||!url.pathname.toLowerCase().endsWith('.glb')||
      url.username||url.password)throw Error('Use a public HTTPS URL ending in .glb');
  const response=await fetch(url.href,{credentials:'omit',mode:'cors'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const header=Number(response.headers.get('content-length')||0);
  if(header>100*1024*1024)throw Error('GLB exceeds viewer limit');
  const buffer=await response.arrayBuffer();
  if(buffer.byteLength>100*1024*1024)throw Error('GLB exceeds viewer limit');
  loadBuffer(buffer,url.pathname.split('/').pop());
 }catch(e){message(String(e.message||e)+' — source may block CORS')}
});
el('wire').addEventListener('click',()=>{
 wireframe=!wireframe;
 for(const mesh of meshes){
  const clone=(Array.isArray(originalMaterials.get(mesh))?
      originalMaterials.get(mesh):[originalMaterials.get(mesh)]).map(m=>{
        const copy=m.clone();copy.wireframe=wireframe;return copy;
      });
  mesh.material=Array.isArray(originalMaterials.get(mesh))?clone:clone[0];
 }
 el('wire').textContent='Wireframe: '+(wireframe?'on':'off');
});
el('explode').addEventListener('click',()=>{
 exploded=!exploded;refreshExplosion();
 el('explode').textContent='Exploded view: '+(exploded?'on':'off');
});
el('distance').addEventListener('input',refreshExplosion);
el('isolate').addEventListener('click',()=>{
 if(!selected){message('Select a mesh from the hierarchy first');return}
 const now=meshes.some(m=>m!==selected&&m.visible);
 for(const m of meshes)m.visible=now?m===selected:true;
 el('isolate').textContent=now?'Show all meshes':'Show only selected mesh';
});
el('reset').addEventListener('click',()=>{
 if(!model)return;
 restore();exploded=false;wireframe=false;el('wire').textContent='Wireframe: off';
 el('explode').textContent='Exploded view: off';el('isolate').textContent='Show only selected mesh';
 fit();message('Model transforms and camera reset');
});
el('light').addEventListener('change',()=>{
 const choice=el('light').value;
 lights[0].intensity=choice==='neutral'?1.7:choice==='metal'?.6:1.05;
 lights[1].intensity=choice==='metal'?4.2:choice==='neutral'?2.1:3.1;
 lights[2].intensity=choice==='metal'?2.5:choice==='neutral'?.6:1.6;
});
function frame(){
 requestAnimationFrame(frame);
 if(el('spin').checked)controls.rotateLeft(.003);
 controls.update();renderer.render(scene,camera);
}
function resize(){
 const width=Math.max(stage.clientWidth,1),height=Math.max(stage.clientHeight,1);
 camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
}
new ResizeObserver(resize).observe(stage);resize();frame();
