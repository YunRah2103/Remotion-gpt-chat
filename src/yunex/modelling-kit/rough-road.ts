import * as T from 'three';
import {scenicOffset} from '../world-kit/world-catalog.ts';
import {roadHeight} from './dynamics.ts';
/** Shared world-space surface field. The controller samples the same mesh's height function. */
export function rallySurfaceHeight(x:number,z:number,roughness:number){return roadHeight(x,z-scenicOffset(x,'rally'),roughness);}
export function roughRallyRoad(world:T.Group,roughness:number){
 const road=world.getObjectByName('road') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
 if(!road)throw Error('Rally road mesh missing');
 const positions:number[]=[],indices:number[]=[],uv:number[]=[],nx=1200,nz=40;
 for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const x=-120+i*.2,z=scenicOffset(x,'rally')-5+j*.25;positions.push(x,rallySurfaceHeight(x,z,roughness),z);uv.push(x/3,j*.25/3);}
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j;indices.push(a,a+1,a+nz+1,a+1,a+nz+2,a+nz+1);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();road.geometry.dispose();road.geometry=geometry;
 const speckles=world.getObjectByName('gravel-speckles') as T.InstancedMesh|undefined;
 if(speckles){const m=new T.Matrix4();for(let i=0;i<speckles.count;i++){speckles.getMatrixAt(i,m);const p=new T.Vector3().setFromMatrixPosition(m);p.y=.008+rallySurfaceHeight(p.x,p.z,roughness);m.setPosition(p);speckles.setMatrixAt(i,m);}speckles.instanceMatrix.needsUpdate=true;}
 world.userData.roadRoughness=roughness;
}
