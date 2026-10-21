import * as T from 'three';
const tyreTopology=new WeakMap<T.Mesh,{closed:T.BufferAttribute;open?:T.BufferAttribute}>();
/** Deform from immutable rest vertices in the wheel's current rolling frame. */
export function deformTyre(tyre:T.Mesh,damage:number,angle:number,support:number){
 const a=tyre.geometry.attributes.position,rest=tyre.userData.restVertices as number[],c=Math.cos(angle),s=Math.sin(angle);
 let topology=tyreTopology.get(tyre);if(!topology){topology={closed:tyre.geometry.index!};tyreTopology.set(tyre,topology);}
 const restIndex=topology.closed.array;
 if(damage===0){if(tyre.userData.lastDamage!==0){a.array.set(rest);a.needsUpdate=true;tyre.geometry.setIndex(topology.closed);tyre.geometry.computeVertexNormals();tyre.geometry.computeBoundingSphere();tyre.geometry.computeBoundingBox();}tyre.userData.lastDamage=0;return;}
 if(damage>.55){if(!topology.open){const kept:number[]=[];for(let j=0;j<restIndex.length;j+=3){const ia=restIndex[j],ib=restIndex[j+1],ic=restIndex[j+2],cx=(rest[ia*3]+rest[ib*3]+rest[ic*3])/3,cy=(rest[ia*3+1]+rest[ib*3+1]+rest[ic*3+1])/3,angle=Math.atan2(cy,cx);if(angle<.32||angle>1.52)kept.push(ia,ib,ic);}topology.open=new T.Uint16BufferAttribute(kept,1);}if(tyre.geometry.index!==topology.open)tyre.geometry.setIndex(topology.open);}else if(tyre.geometry.index!==topology.closed)tyre.geometry.setIndex(topology.closed);
 tyre.userData.lastDamage=damage;
 for(let i=0;i<a.count;i++){
  const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];
  const wx=(x*c-y*s)*(1-damage*.18),wy=(x*s+y*c)*(1-damage*.18);
  const flat=damage===0?wy:Math.max(wy,-support+.004),bulge=damage*.025*Math.exp(-Math.pow((wy+support)/.09,2));
  a.setXYZ(i,wx*c+flat*s,-wx*s+flat*c,z+Math.sign(z)*bulge);
 }
 a.needsUpdate=true;tyre.geometry.computeVertexNormals();tyre.geometry.computeBoundingSphere();tyre.geometry.computeBoundingBox();
}
export function deformBody(body:T.Mesh,damage:number,width:number){
 if(body.userData.lastBodyDamage===damage)return;body.userData.lastBodyDamage=damage;
 const a=body.geometry.attributes.position,rest=body.userData.restVertices as number[];
 for(let i=0;i<a.count;i++){
  const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],dent=damage*.18*Math.exp(-((x-1.3)**2/.23+(y-.55)**2/.10));
  a.setXYZ(i,x-dent*.4,y+dent*.14,z-Math.sign(z)*dent*T.MathUtils.smoothstep(Math.abs(z),width*.3,width*.48));
 }
 a.needsUpdate=true;body.geometry.computeVertexNormals();body.geometry.computeBoundingSphere();body.geometry.computeBoundingBox();
}
export function createFragments(){
 const g=new T.Group();g.name='rubber-fragments';const mat=new T.MeshStandardMaterial({color:'#171d22',roughness:.94,side:T.DoubleSide});
 for(let i=0;i<24;i++){const p:number[]=[],idx:number[]=[];for(let j=0;j<=6;j++){const t=j/6;for(const side of [-1,1])p.push((t-.5)*(.10+i%4*.045),Math.sin(t*Math.PI)*.018,side*(.012+i%3*.008));if(j<6){const k=j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();const m=new T.Mesh(geo,mat);m.name=`rubber-${i}`;g.add(m);}return g;
}
/** Absolute-time ejection, two damped bounces and frictional settling. No frame history. */
export function animateFragments(g:T.Group,amount:number,seconds:number,origin:T.Vector3){
 g.visible=amount>.02;
 const gravity=9.81,clearance=.002;
 const rotation=new T.Matrix4(),point=new T.Vector3();
 g.children.forEach((o,i)=>{
  const t=Math.max(0,seconds-i*.018),up=1.2+i%5*.17;
  const height=Math.max(0,origin.y-clearance);
  const impactSpeed=Math.sqrt(up*up+2*gravity*height),impact=(up+impactSpeed)/gravity;
  const rebound=impactSpeed*(.27+i%3*.035),bounceDuration=2*rebound/gravity;
  const second=rebound*.28,secondDuration=2*second/gravity,landed=impact+bounceDuration+secondDuration;
  let y:number;
  if(t<impact)y=height+up*t-.5*gravity*t*t;
  else if(t<impact+bounceDuration){const b=t-impact;y=rebound*b-.5*gravity*b*b;}
  else if(t<landed){const b=t-impact-bounceDuration;y=second*b-.5*gravity*b*b;}
  else y=0;
  // Horizontal travel loses speed after first contact, then reaches a finite rest position.
  const speed=2+i%7*.6,friction=4.5,slide=Math.min(Math.max(0,t-impact),speed/friction);
  const travel=speed*Math.min(t,impact)+speed*slide-.5*friction*slide*slide;
  const settle=Math.min(1,Math.max(0,(t-impact)/Math.max(.001,landed-impact)));
  const tumble=Math.min(t,landed),a=i*2.399;
  o.position.set(origin.x-travel,clearance+Math.max(0,y),origin.z+Math.sin(a)*travel*.22);
  o.rotation.set((i+tumble*4)*(1-settle),i+tumble*6,(i+tumble*3)*(1-settle));
  o.scale.setScalar(amount*(t>0?1:0));
  // Support the actual rotated ribbon, rather than just clamping its centre.
  if(o instanceof T.Mesh&&o.scale.x>0){
   rotation.makeRotationFromEuler(o.rotation);const vertices=o.geometry.attributes.position;let bottom=Infinity;
   for(let j=0;j<vertices.count;j++){point.fromBufferAttribute(vertices,j).applyMatrix4(rotation);bottom=Math.min(bottom,point.y*o.scale.y);}
   o.position.y-=bottom;
  }
 });
}
/** Open sector plus hanging ribbons/cords; all vertices remain in the rolling wheel rig. */
export function createTornCarcass(roll:T.Object3D,r:number,w:number){
 const g=new T.Group();g.name='torn-cords';g.visible=false;roll.add(g);
 const rubber=new T.MeshStandardMaterial({color:'#111820',roughness:.95,side:T.DoubleSide}),cord=new T.MeshStandardMaterial({color:'#9c9c8d',metalness:.4,roughness:.8});
 for(let i=0;i<11;i++){
  const a=.3+i*.135,points=[];
  for(let j=0;j<=7;j++){const t=j/7,angle=a+t*.18;points.push(new T.Vector3(Math.cos(angle)*(r*(.80+t*.25)),Math.sin(angle)*(r*(.80+t*.25))-.10*t*t,(i%2?1:-1)*w*(.40+t*.55)));}
  const curve=new T.CatmullRomCurve3(points);const m=new T.Mesh(new T.TubeGeometry(curve,14,i%3===0?.012:.002,5,false),i%3===0?rubber:cord);m.name=i%3===0?'torn-rubber-ribbon':'exposed-cord';g.add(m);
 }
}
export function damageRim(rim:T.Mesh,amount:number){
 if(rim.userData.lastRimDamage===amount)return;
 if(!rim.userData.rimRest){const old=rim.geometry;rim.geometry=old.clone();old.dispose();rim.userData.rimRest=Array.from(rim.geometry.attributes.position.array);}
 const a=rim.geometry.attributes.position,rest=rim.userData.rimRest;
 for(let i=0;i<a.count;i++){const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],angle=Math.atan2(y,x),dent=amount*.035*Math.exp(-(((angle-.75)/.22)**2));a.setXYZ(i,x*(1-dent),y*(1-dent),z+dent*.6);}
 a.needsUpdate=true;rim.geometry.computeVertexNormals();rim.geometry.computeBoundingSphere();rim.userData.lastRimDamage=amount;
}

/** Clamp hanging material in vehicle-local road space after steering/roll/wobble transforms. */
export function groundTornCords(root:T.Group,mounts:T.Group[]){
 const rootInverse=root.matrixWorld.clone().invert(),relative=new T.Matrix4(),inverse=new T.Matrix4(),p=new T.Vector3();
 for(const mount of mounts){const group=mount.getObjectByName('torn-cords');if(!group?.visible)continue;
  group.traverse(o=>{if(!(o instanceof T.Mesh))return;const a=o.geometry.attributes.position;const rest=(o.userData.restVertices??=Array.from(a.array)) as number[];
   relative.multiplyMatrices(rootInverse,o.matrixWorld);inverse.copy(relative).invert();
   for(let i=0;i<a.count;i++){p.fromArray(rest,i*3).applyMatrix4(relative);p.y=Math.max(.003,p.y);p.applyMatrix4(inverse);a.setXYZ(i,p.x,p.y,p.z);}
   a.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();
  });
 }
}
