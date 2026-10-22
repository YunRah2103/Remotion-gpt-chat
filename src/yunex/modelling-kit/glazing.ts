import * as T from 'three';
/** Close a convex automotive pane using its real curved silhouette, removing source fan T-junctions. */
export function glazingVolume(source:T.BufferGeometry,thickness:number){
 if(!Number.isFinite(thickness)||thickness<=0||thickness>.03)throw Error('Glazing thickness must be 0..0.03 metres');
 const positions=source.attributes.position,normals=source.attributes.normal,normal=new T.Vector3();
 if(!positions||positions.count<3)throw Error('Glazing requires a pane surface');
 if(normals)for(let i=0;i<normals.count;i++)normal.add(new T.Vector3().fromBufferAttribute(normals,i));
 if(normal.length()<.01){source.computeBoundingBox();const size=source.boundingBox!.getSize(new T.Vector3());normal.set(size.x<=size.y&&size.x<=size.z?1:0,size.y<size.x&&size.y<=size.z?1:0,size.z<size.x&&size.z<size.y?1:0);}
 normal.normalize();const axis=Math.abs(normal.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0),u=axis.cross(normal).normalize(),v=normal.clone().cross(u);
 type Point={x:number;y:number;p:T.Vector3};const unique=new Map<string,Point>();
 for(let i=0;i<positions.count;i++){const p=new T.Vector3().fromBufferAttribute(positions,i),x=p.dot(u),y=p.dot(v),key=`${x.toFixed(6)}:${y.toFixed(6)}`,old=unique.get(key);if(!old||p.dot(normal)>old.p.dot(normal))unique.set(key,{x,y,p});}
 const sorted=[...unique.values()].sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const half=(points:Point[])=>{const h:Point[]=[];for(const p of points){while(h.length>1&&cross(h.at(-2)!,h.at(-1)!,p)<=1e-9)h.pop();h.push(p);}return h;};
 const lower=half(sorted),upper=half([...sorted].reverse()),contour=[...lower.slice(0,-1),...upper.slice(0,-1)];if(contour.length<3)throw Error('Degenerate glazing outline');
 const center=contour.reduce((a,b)=>a.add(b.p),new T.Vector3()).divideScalar(contour.length),n=contour.length,nr=8,outer:T.Vector3[]=[center];
 for(let ring=1;ring<=nr;ring++)for(const point of contour)outer.push(center.clone().lerp(point.p,ring/nr));
 const count=outer.length,vertices=outer.flatMap(p=>p.toArray()).concat(outer.flatMap(p=>p.clone().addScaledVector(normal,-thickness).toArray())),faces:number[]=[];
 const face=(a:number,b:number,c:number)=>faces.push(a,b,c,c+count,b+count,a+count);
 for(let j=0;j<n;j++)face(0,1+j,1+(j+1)%n);
 for(let ring=1;ring<nr;ring++)for(let j=0;j<n;j++){const a=1+(ring-1)*n+j,b=1+(ring-1)*n+(j+1)%n,c=a+n,d=b+n;face(a,c,b);face(b,c,d);}
 for(let j=0;j<n;j++){const a=1+(nr-1)*n+j,b=1+(nr-1)*n+(j+1)%n;faces.push(b,a,a+count,b,a+count,b+count);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(faces);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
export function refineGlazing(shell:T.Group){
 const names=new Set(['windshield','rear-glass','side-glass','windscreen','side-window']);
 shell.traverse(o=>{if(!(o instanceof T.Mesh)||!names.has(o.name))return;const thickness=o.name==='windshield'||o.name==='windscreen'?.006:.005,original=o.geometry;o.geometry=glazingVolume(original,thickness);original.dispose();o.userData.glassThickness=thickness;o.userData.closedGlazing=true;});
}
