/** Optional production-grade ground contact. This is a visual cue, not tyre physics.
 * It does not change the vehicle, its wheel rig, lighting or existing shaders. */
import * as T from 'three';
import {vehicleSpec} from '../world-kit/catalog.ts';
export type GroundContactOptions={opacity?:number;groundHeight?:number};
const UP=new T.Vector3(0,1,0);
const PLANE=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
function finite(name:string,value:number){if(!Number.isFinite(value))throw Error(name+' must be finite');}
/** Pure geometry overlay, never parented to a rotating wheel or vehicle. */
export function createGroundContactShadows(vehicle:T.Object3D,options:GroundContactOptions={}):T.Group{
 const opacity=options.opacity??.22;finite('Ground opacity',opacity);
 if(opacity<0||opacity>.45)throw Error('Ground opacity must be 0..0.45');
 finite('Ground height',options.groundHeight??0);
 const variant=vehicle.userData.variant;
 const s=vehicleSpec(variant),mounts:T.Object3D[]=[];
 vehicle.traverse(o=>{if(/^mount-(front|rear)(-aux)?-(left|right)$/.test(o.name))mounts.push(o);});
 if(mounts.length!==s.axles*2)throw Error('Ground contact needs the intact mounted wheel rig');
 const group=new T.Group();group.name='opt-in-ground-contact';
 const material=(strength:number)=>new T.ShaderMaterial({
  transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,
  uniforms:{strength:{value:strength}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying vec2 vUv;uniform float strength;void main(){vec2 p=(vUv-.5)*2.;float d=dot(p,p);float feather=exp(-4.8*d);float core=exp(-18.*(p.x*p.x*.65+p.y*p.y*1.7));gl_FragColor=vec4(.012,.016,.022,strength*(.55*feather+.45*core));}'
 });
 const soft=material(opacity),body=material(opacity*.35);
 const make=(name:string,w:number,h:number,mat:T.ShaderMaterial)=>{
  const m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.name=name;m.renderOrder=2;m.frustumCulled=false;
  m.castShadow=false;m.receiveShadow=false;m.quaternion.copy(PLANE);group.add(m);return m;
 };
 make('contact-body',s.length*.83,s.width*.82,body);
 for(const mount of mounts){
  const m=make('contact-'+mount.name.slice(6),s.radius*2.5,s.radius*1.85,soft);
  m.userData.mount=mount;
 }
 group.userData.groundHeight=options.groundHeight??0;
 updateGroundContactShadows(group,vehicle,options.groundHeight??0);
 return group;
}
/** Absolute pose update: safe for Remotion's nonsequential frame rendering and seeks. */
export function updateGroundContactShadows(group:T.Group,vehicle:T.Object3D,groundHeight=0){
 finite('Ground height',groundHeight);
 vehicle.updateWorldMatrix(true,true);
 const face=new T.Vector3(1,0,0).transformDirection(vehicle.matrixWorld);
 const yaw=Math.atan2(face.z,face.x);
 const orient=new T.Quaternion().setFromAxisAngle(UP,-yaw).multiply(PLANE);
 const origin=vehicle.getWorldPosition(new T.Vector3());
 for(const shadow of group.children){
  if(!(shadow instanceof T.Mesh))continue;
  const wheel=shadow.userData.mount as T.Object3D|undefined;
  const p=wheel?wheel.getWorldPosition(new T.Vector3()):origin;
  shadow.position.set(p.x,groundHeight+(wheel?.004:.003),p.z);
  shadow.quaternion.copy(orient);
 }
 group.userData.groundHeight=groundHeight;
}
