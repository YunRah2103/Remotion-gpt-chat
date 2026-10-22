/** Editable source stays canonical; exported GLBs are interchange/baked previews. Units: metres. */
import * as T from 'three';
import {createPart} from '../parts-kit/models.ts';
import type {PartVariant} from '../parts-kit/catalog.ts';
import {animatePart,partMount} from '../parts-kit/motion.ts';
import {pipe} from '../parts-kit/helpers.ts';
import type {V3} from '../world-kit/geometry.ts';
export type ModelEdit={target:string;position?:V3;rotation?:V3;scale?:V3;visible?:boolean;deform?:{axis:'x'|'y'|'z';amount:number;along:'x'|'y'|'z'}};
export type ModelVariation={id:string;version:1;edits:ModelEdit[]};
export type AssemblyNode={id:string;part:PartVariant|string;components?:ComponentSpec[];position?:V3;rotation?:V3;scale?:V3};
export type AssemblySpec={id:string;version:1;nodes:AssemblyNode[];connections:{from:string;to:string;radius?:number;via?:V3[]}[]};
const finite=(v:number[])=>v.every(Number.isFinite);
export function applyEdits(root:T.Object3D,variation:ModelVariation){
 if(variation.version!==1||!variation.id||!Array.isArray(variation.edits))throw Error('Invalid model variation');
 for(const edit of variation.edits){const object=root.getObjectByName(edit.target);if(!object)throw Error(`Missing model target: ${edit.target}`);
  for(const key of ['position','rotation','scale'] as const){const value=edit[key];if(value&&(!Array.isArray(value)||value.length!==3||!finite(value)||(key==='scale'&&value.some(v=>v<=0))))throw Error(`Invalid ${key}`);}
  if(edit.position)object.position.fromArray(edit.position);if(edit.rotation)object.rotation.set(...edit.rotation);if(edit.scale)object.scale.fromArray(edit.scale);if(edit.visible!==undefined)object.visible=edit.visible;
  if(edit.deform){const d=edit.deform;if(!['x','y','z'].includes(d.axis)||!['x','y','z'].includes(d.along)||!Number.isFinite(d.amount))throw Error('Invalid deformation');
   const meshes:T.Mesh[]=[];object.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});if(!meshes.length)throw Error('Deformation target has no mesh');
   for(const mesh of meshes){mesh.geometry=mesh.geometry.clone();const g=mesh.geometry,a=g.attributes.position;g.computeBoundingBox();const bounds=g.boundingBox!,span=bounds.max[d.along]-bounds.min[d.along];
    for(let i=0;i<a.count;i++){const point=new T.Vector3().fromBufferAttribute(a,i),u=span?(point[d.along]-bounds.min[d.along])/span:0;point[d.axis]+=d.amount*Math.sin(Math.PI*u);a.setXYZ(i,point.x,point.y,point.z);}
    a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
    // Body damage sampling restores this edited rest geometry instead of undoing the authoring change.
    if(mesh.userData.restVertices)mesh.userData.restVertices=Array.from(a.array);if(mesh.userData.restNormals)mesh.userData.restNormals=Array.from(g.attributes.normal.array);
   }
  }
 }
 root.userData.variation=structuredClone(variation);root.updateMatrixWorld(true);return root;
}
/** Clone meshes/materials; no shared mutable geometry. Use applyEdits on freshly built vehicles to retain their WeakMap rigs. */
export function editModel(source:T.Group,variation:ModelVariation):T.Group{const root=source.clone(true);root.traverse(o=>{if(o instanceof T.Mesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}});return applyEdits(root,variation) as T.Group;}
function anchor(root:T.Object3D,name:string){const result=root.getObjectByName(`mount:${name}`);if(!result)throw Error(`Unknown mount: ${name}`);return result;}
/** Attach child plug to parent socket in parent-local space, including opposing port directions. */
export function attachAt(parent:T.Object3D,socketName:string,child:T.Object3D,plugName='mount'){
 const socket=anchor(parent,socketName),plug=anchor(child,plugName);parent.add(child);child.position.set(0,0,0);child.quaternion.identity();parent.updateWorldMatrix(true,true);
 const desired=new T.Vector3(...(socket.userData.direction??[1,0,0])).transformDirection(socket.matrixWorld).negate();
 const parentRotation=parent.getWorldQuaternion(new T.Quaternion());desired.applyQuaternion(parentRotation.clone().invert());
 const actual=new T.Vector3(...(plug.userData.direction??[1,0,0])).transformDirection(plug.matrixWorld).applyQuaternion(parentRotation.clone().invert());child.quaternion.setFromUnitVectors(actual,desired);parent.updateWorldMatrix(true,true);
 const target=parent.worldToLocal(socket.getWorldPosition(new T.Vector3())),origin=parent.worldToLocal(plug.getWorldPosition(new T.Vector3()));child.position.add(target.sub(origin));parent.updateWorldMatrix(true,true);return child;
}
function endpoint(root:T.Object3D,address:string):V3{const split=address.indexOf(':'),id=address.slice(0,split),name=address.slice(split+1),node=root.children.find(n=>n.name===id);if(split<1||!node)throw Error(`Unknown assembly mount: ${address}`);return root.worldToLocal(new T.Vector3(...partMount(node,name).position)).toArray() as V3;}
export function createAssembly(spec:AssemblySpec,resolvePart?:(id:string)=>T.Group):T.Group{
 if(spec.version!==1||!spec.id||!Array.isArray(spec.nodes)||!Array.isArray(spec.connections))throw Error('Invalid assembly');
 const root=new T.Group();root.name=spec.id;root.userData.assembly=structuredClone(spec);const ids=new Set<string>();
 for(const node of spec.nodes){if(!/^[a-z][a-z0-9-]*$/.test(node.id)||ids.has(node.id))throw Error('Duplicate or invalid assembly node');ids.add(node.id);const part=resolvePart?resolvePart(node.part):createPart({variant:node.part as PartVariant,cutaway:true});part.name=node.id;if(node.components)buildComponents(part,node.components);root.add(part);applyEdits(part,{id:node.id,version:1,edits:[{target:node.id,position:node.position,rotation:node.rotation,scale:node.scale}]});}
 spec.connections.forEach((c,i)=>{if(c.radius!==undefined&&(!Number.isFinite(c.radius)||c.radius<=0||c.radius>.2))throw Error('Pipe radius must be 0..0.2');const a=endpoint(root,c.from),b=endpoint(root,c.to);if(new T.Vector3(...a).distanceTo(new T.Vector3(...b))<1e-6)throw Error('Connection has zero length');const via=c.via??[new T.Vector3(...a).lerp(new T.Vector3(...b),.5).add(new T.Vector3(0,.18,0)).toArray() as V3];if(via.some(p=>p.length!==3||!finite(p)))throw Error('Invalid pipe route');const link=pipe(root,new T.MeshStandardMaterial({color:c.from.includes('exhaust')?'#ad7756':'#3ba6ad',metalness:.65,roughness:.32}),[a,...via,b],c.radius??.035,`connection-${i}`);link.userData.connection={from:c.from,to:c.to,start:a,end:b};});
 return root;
}
export function animateAssembly(root:T.Group,frame:number,fps:number){if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw Error('Invalid animation time');for(const node of root.children)if(node.userData.variant)animatePart(node,{shaftAngle:frame/fps*(node.userData.family==='turbo'?36:8)});root.updateMatrixWorld(true);}
export function validateModel(root:T.Object3D){
 const errors:string[]=[],warnings:string[]=[],meshes:T.Mesh[]=[];root.updateMatrixWorld(true);
 root.traverse(o=>{let shown=true;for(let p:T.Object3D|null=o;p;p=p.parent)if(!p.visible)shown=false;if(!shown)return;if(!finite([...o.position.toArray(),...o.scale.toArray(),...o.quaternion.toArray()]))errors.push(`Nonfinite transform: ${o.name}`);if(o.scale.toArray().some(v=>v<=0))errors.push(`Nonpositive scale: ${o.name}`);if(o instanceof T.Mesh&&o.visible){meshes.push(o);const a=o.geometry.attributes.position;if(!a||!finite(Array.from(a.array)))errors.push(`Nonfinite or absent vertices: ${o.name}`);}});
 // Bounded broad phase. Overlapping intentional assemblies are warnings, never fake triangle-level failures.
 const boxes=meshes.slice(0,150).map(m=>new T.Box3().setFromObject(m));for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(boxes[i].intersectsBox(boxes[j])&&warnings.length<30)warnings.push(`Bounds overlap (review required): ${meshes[i].name} / ${meshes[j].name}`);
 root.traverse(o=>{const c=o.userData.connection;let owner:T.Object3D|null=o.parent;while(owner&&!owner.userData.assembly)owner=owner.parent;if(c)for(const [address,key] of [[c.from,'start'],[c.to,'end']] as const){try{if(new T.Vector3(...endpoint(owner??root,address)).distanceTo(new T.Vector3(...c[key]))>.001)errors.push(`Broken connection: ${address}`);}catch(e){errors.push(String(e));}}});
 return {errors,warnings,meshCount:meshes.length,bounds:new T.Box3().setFromObject(root).getSize(new T.Vector3()).toArray(),coverage:'Finite geometry, transforms, static port endpoints and bounded AABB broad phase; visual/triangle clearance still requires review'};
}
/** Inventory stable named editing surfaces, bounds and mounting metadata. */
export function modelCatalogue(root:T.Object3D){root.updateMatrixWorld(true);const nodes:{name:string;type:string;bounds:number[];mount?:unknown}[]=[];root.traverse(o=>{if(o.name)nodes.push({name:o.name,type:o.type,bounds:new T.Box3().setFromObject(o).getSize(new T.Vector3()).toArray(),mount:o.userData.direction});});return nodes;}
export type ComponentSpec={id:string;parent?:string;replace?:string;position?:V3;rotation?:V3;scale?:V3;color?:string;shape:{kind:'box';size:V3}|{kind:'pipe';points:V3[];radius:number}|{kind:'loft';sections:{x:number;y:number;halfWidth:number;height:number}[]};joint?:{axis:'x'|'y'|'z';min:number;max:number};mounts?:{name:string;position:V3;direction:V3}[]};
/** Build declarative geometry; raw TS factories remain available for unrestricted custom meshes. */
export function buildComponents(root:T.Object3D,components:ComponentSpec[]){
 for(const c of components){if(!c.id||root.getObjectByName(c.id))throw Error(`Duplicate component: ${c.id}`);const parent=c.parent?root.getObjectByName(c.parent):root;if(!parent)throw Error(`Missing component parent: ${c.parent}`);const shape=c.shape;let geometry:T.BufferGeometry;
  if(shape.kind==='box'){if(shape.size.length!==3||!finite(shape.size)||shape.size.some(v=>v<=0))throw Error('Invalid box size');geometry=new T.BoxGeometry(...shape.size,4,2,4);}
  else if(shape.kind==='pipe'){if(shape.points.length<2||shape.points.some(p=>p.length!==3||!finite(p))||!Number.isFinite(shape.radius)||shape.radius<=0)throw Error('Invalid pipe');geometry=new T.TubeGeometry(new T.CatmullRomCurve3(shape.points.map(p=>new T.Vector3(...p))),48,shape.radius,12,false);}
  else if(shape.kind==='loft'){if(shape.sections.length<2||shape.sections.some(s=>!finite([s.x,s.y,s.halfWidth,s.height])||s.halfWidth<=0||s.height<=0))throw Error('Invalid loft');const positions:number[]=[],indices:number[]=[];shape.sections.forEach((s,i)=>{for(let j=0;j<16;j++){const a=j/16*Math.PI*2;positions.push(s.x,s.y+Math.sin(a)*s.height/2,Math.cos(a)*s.halfWidth);if(i){const k=i*16+j,n=i*16+(j+1)%16;indices.push(k-16,n-16,n,k-16,n,k);}}});geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();}
  else throw Error('Unknown shape');
  const mesh=new T.Mesh(geometry,new T.MeshPhysicalMaterial({color:c.color??'#215e67',metalness:.55,roughness:.29,clearcoat:.8,side:T.DoubleSide}));mesh.name=c.id;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);applyEdits(root,{id:c.id,version:1,edits:[{target:c.id,position:c.position,rotation:c.rotation,scale:c.scale}]});
  if(c.replace){const target=root.getObjectByName(c.replace);if(!target||target===mesh)throw Error(`Missing replacement target: ${c.replace}`);target.visible=false;}
  if(c.joint){if(!['x','y','z'].includes(c.joint.axis)||!finite([c.joint.min,c.joint.max])||c.joint.min>c.joint.max)throw Error('Invalid joint limits');mesh.userData.authorJoint={...c.joint,rest:mesh.rotation.toArray().slice(0,3)};}
  for(const m of c.mounts??[]){if(!m.name||!finite([...m.position,...m.direction]))throw Error('Invalid mount');const node=new T.Object3D();node.name=`mount:${m.name}`;node.position.fromArray(m.position);node.userData={mount:true,mountName:m.name,direction:m.direction};mesh.add(node);}
 }
 root.updateMatrixWorld(true);return root;
}
export function animateComponents(root:T.Object3D,controls:Record<string,number>){root.traverse(o=>{const joint=o.userData.authorJoint;if(!joint)return;const value=controls[o.name]??0;if(!Number.isFinite(value)||value<0||value>1)throw Error('Joint control must be 0..1');o.rotation.set(...joint.rest as V3);o.rotation[joint.axis as 'x'|'y'|'z']+=T.MathUtils.lerp(joint.min,joint.max,value);});root.updateMatrixWorld(true);}
/** Load a caller-provided GLB buffer; runtime source, clips and import metadata remain available separately. */
export async function importGLB(bytes:ArrayBuffer,metadata:{id:string;units:'metres';source:string}){if(metadata.units!=='metres'||!metadata.id)throw Error('GLB metadata requires id and metres');const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');const loaded=await new GLTFLoader().parseAsync(bytes,'');loaded.scene.userData.import={...metadata,animationNames:loaded.animations.map(c=>c.name)};return loaded;}
export async function exportGLB(root:T.Object3D){const {GLTFExporter}=await import('three/examples/jsm/exporters/GLTFExporter.js');return new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true});}
