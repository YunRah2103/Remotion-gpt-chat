import * as T from 'three';
/** Corner-angle weighting keeps smooth loft reflections independent of uneven arch row spacing.
 * Apply to the authored shared-vertex surface before aperture clipping preserves its normals.
 */
export function angleWeightedNormals(g:T.BufferGeometry){
 const p=g.getAttribute('position'),index=g.index,sums=new Float64Array(p.count*3),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3(),bc=new T.Vector3(),face=new T.Vector3();
 for(let i=0;i<(index?.count??p.count);i+=3){
  const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);a.fromBufferAttribute(p,ids[0]);b.fromBufferAttribute(p,ids[1]);c.fromBufferAttribute(p,ids[2]);ab.subVectors(b,a);ac.subVectors(c,a);bc.subVectors(c,b);face.crossVectors(ab,ac);const area=face.length();if(area<1e-14)continue;face.divideScalar(area);
  const ab2=ab.lengthSq(),ac2=ac.lengthSq(),bc2=bc.lengthSq(),weights=[Math.atan2(area,(ab2+ac2-bc2)/2),Math.atan2(area,(ab2+bc2-ac2)/2),Math.atan2(area,(ac2+bc2-ab2)/2)];
  for(let k=0;k<3;k++){const j=ids[k]*3,w=weights[k];sums[j]+=face.x*w;sums[j+1]+=face.y*w;sums[j+2]+=face.z*w;}
 }
 const normal=new Float32Array(sums.length);for(let i=0;i<p.count;i++){face.fromArray(sums,i*3).normalize();normal.set(face.toArray(),i*3);}g.setAttribute('normal',new T.BufferAttribute(normal,3));return g;
}
