import * as T from 'three';
/** Deform from immutable rest vertices in the wheel's current rolling frame. */
export function deformTyre(tyre:T.Mesh,damage:number,angle:number,support:number){
 const a=tyre.geometry.attributes.position,rest=tyre.userData.restVertices as number[],c=Math.cos(angle),s=Math.sin(angle);
 for(let i=0;i<a.count;i++){
  const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];
  const wx=(x*c-y*s)*(1-damage*.18),wy=(x*s+y*c)*(1-damage*.18);
  const flat=Math.max(wy,-support+.004),bulge=damage*.025*Math.exp(-Math.pow((wy+support)/.09,2));
  a.setXYZ(i,wx*c+flat*s,-wx*s+flat*c,z+Math.sign(z)*bulge);
 }
 a.needsUpdate=true;tyre.geometry.computeVertexNormals();tyre.geometry.computeBoundingSphere();tyre.geometry.computeBoundingBox();
}
export function deformBody(body:T.Mesh,damage:number,width:number){
 const a=body.geometry.attributes.position,rest=body.userData.restVertices as number[];
 for(let i=0;i<a.count;i++){
  const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],dent=damage*.18*Math.exp(-((x-1.3)**2/.23+(y-.55)**2/.10));
  a.setXYZ(i,x-dent*.4,y+dent*.14,z-Math.sign(z)*dent*T.MathUtils.smoothstep(Math.abs(z),width*.3,width*.48));
 }
 a.needsUpdate=true;body.geometry.computeVertexNormals();body.geometry.computeBoundingSphere();body.geometry.computeBoundingBox();
}
export function createFragments(){
 const g=new T.Group();g.name='rubber-fragments';const mat=new T.MeshStandardMaterial({color:'#171d22',roughness:.94});
 const geo=new T.BoxGeometry(.045,.018,.070);
 for(let i=0;i<14;i++){const m=new T.Mesh(geo,mat);m.name=`rubber-${i}`;g.add(m);}return g;
}
/** Prescribed repeatable fragment trajectory, not an impact simulation. */
export function animateFragments(g:T.Group,amount:number,seconds:number,origin:T.Vector3){
 g.visible=amount>.02;g.children.forEach((o,i)=>{const t=(seconds*.7+i*.071)%1,a=i*2.399;
 o.position.set(origin.x-t*(.4+i*.13),Math.max(.02,origin.y+Math.sin(t*Math.PI)*(.15+i*.02)-t*.20),origin.z+Math.sin(a)*t*.65);
 o.rotation.set(i+t*4,i+t*6,i+t*3);o.scale.setScalar(amount*(.6+i*.03));});
}
