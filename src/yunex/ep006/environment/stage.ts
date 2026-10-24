import * as T from 'three';
import {EP006_STAGE_LIMITS,EP006_JUMP_LANDMARKS,heightAt,ep006RoadHalfWidth,sampleEp006Ground} from './surface.ts';
export {EP006_STAGE_LIMITS,EP006_JUMP_LANDMARKS,heightAt,sampleEp006Ground} from './surface.ts';

export const EP006_STAGE_LIGHT = {
  sky:'#64869a', horizon:'#aabbb5', fog:'#9db5b3',
  sunColor:'#ffe3b0', sunDirection:[-0.44,0.82,0.34] as [number,number,number],
  sunIntensity:2.55, hemisphereIntensity:1.33,
} as const;
export type Ep006StageOptions={seed?:number;sceneryDensity?:number};

function hash(n:number){const v=Math.sin(n*127.1+74.7)*43758.5453;return v-Math.floor(v);}
function srand(i:number,seed:number){return hash(i*1.6180339+seed*.371);}
function mesh(g:T.Group,name:string,geometry:T.BufferGeometry,material:T.Material){
  const item=new T.Mesh(geometry,material);item.name=name;item.receiveShadow=true;item.castShadow=false;g.add(item);return item;
}
function makeNoiseMap(seed:number){
  // Two physically repeated procedural aggregate maps, no network textures.
  const n=256,c=new Uint8Array(n*n*4),r=new Uint8Array(n*n*4);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const p=(j*n+i)*4,h=srand(i*73+j*113,seed),b=srand(i*7+j*19,seed+31),
      grey=Math.round(102+h*43+b*15),red=Math.round(grey+7),green=Math.round(grey+5);
    c[p]=red;c[p+1]=green;c[p+2]=Math.round(grey*.86);c[p+3]=255;
    const rough=Math.round(207+h*41);r[p]=r[p+1]=r[p+2]=rough;r[p+3]=255;
  }
  const tex=(data:Uint8Array,color:boolean)=>{
    const t=new T.DataTexture(data,n,n,T.RGBAFormat);
    t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;
    t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;
    t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;
  };
  return {colour:tex(c,true),roughness:tex(r,false)};
}
function heightGeometry(
  minX:number,maxX:number,minZ:number,maxZ:number,nx:number,nz:number,
  road:boolean,seed:number
){
  const vertices:number[]=[],uv:number[]=[],colour:number[]=[],indices:number[]=[];
  const sand=new T.Color('#716d5e'),deep=new T.Color('#486149'),moss=new T.Color('#36533d');
  for(let ix=0;ix<=nx;ix++){
    const x=minX+(maxX-minX)*ix/nx;
    for(let iz=0;iz<=nz;iz++){
      const z=road?(-ep006RoadHalfWidth(x)+2*ep006RoadHalfWidth(x)*iz/nz):minZ+(maxZ-minZ)*iz/nz;
      const y=heightAt(x,z)-(road?0:.022);
      vertices.push(x,y,z);
      uv.push(x/(road?1.65:5.1),z/(road?1.65:5.1));
      const edge=Math.abs(z),noise=srand(ix*171+iz*13,seed);
      const shade=(.9+.16*noise);
      const c=road?new T.Color('#a99c84'):
        sand.clone().lerp(deep,Math.min(1,Math.max(0,(edge-5)/12)))
        .lerp(moss,Math.min(.8,.23+.19*Math.sin(x*.033+z*.14)));
      if(road){
        const rut=Math.abs(edge-1.18)<.32;
        if(rut)c.multiplyScalar(.75);
        else if(edge>ep006RoadHalfWidth(x)-.48)c.lerp(new T.Color('#48443a'),.6);
        else if(noise>.91)c.lerp(new T.Color('#9f9a89'),.28);
      }
      c.multiplyScalar(shade);
      colour.push(c.r,c.g,c.b);
    }
  }
  for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
    const a=ix*(nz+1)+iz,b=a+nz+1;
    // X and Z increasing: positive-Y winding (cross Z vector with X).
    indices.push(a,a+1,b,b,a+1,b+1);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setAttribute('normal',new T.Float32BufferAttribute(new Float32Array(vertices.length),3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setAttribute('color',new T.Float32BufferAttribute(colour,3));
  geo.setIndex(indices);
  // Analytical shading normal matches contact sampler rather than a coarser triangle.
  const arr=geo.attributes.normal as T.BufferAttribute;
  for(let i=0;i<vertices.length/3;i++){
    const n=sampleEp006Ground(vertices[i*3],vertices[i*3+2]).normal;
    arr.setXYZ(i,n[0],n[1],n[2]);
  }
  return geo;
}
type Item={x:number;y:number;z:number;sx:number;sy:number;sz:number;ry:number;colour:string};
function instanced(g:T.Group,name:string,geometry:T.BufferGeometry,roughness:number,items:Item[],shadow=true){
  if(!items.length){geometry.dispose();return;}
  const material=new T.MeshStandardMaterial({color:'#ffffff',roughness,metalness:.02});
  const obj=new T.InstancedMesh(geometry,material,items.length);
  obj.name=name;obj.castShadow=shadow;obj.receiveShadow=true;
  const dummy=new T.Object3D();
  items.forEach((item,i)=>{
    dummy.position.set(item.x,item.y,item.z);dummy.scale.set(item.sx,item.sy,item.sz);
    dummy.rotation.set(0,item.ry,0);dummy.updateMatrix();
    obj.setMatrixAt(i,dummy.matrix);obj.setColorAt(i,new T.Color(item.colour));
  });
  obj.instanceMatrix.needsUpdate=true;if(obj.instanceColor)obj.instanceColor.needsUpdate=true;
  obj.computeBoundingSphere();g.add(obj);
}
/** Branch-level silhouette variation prevents identical triangular forest crowns. */
function firBranchGeometry(seed:number){
  const pts:number[]=[],idx:number[]=[],N=17,R=12;
  for(let j=0;j<=R;j++){
    const t=j/R,levelRadius=Math.max(.018,Math.pow(1-t,.82));
    for(let k=0;k<N;k++){
      const a=2*Math.PI*k/N+j*.083;
      const spiky=(j%3===0?1.12:j%3===1?.77:.96)
        *(.90+.13*Math.sin(k*2.79+j*1.43+seed));
      const radius=levelRadius*spiky;
      pts.push(Math.cos(a)*radius,t-.5,Math.sin(a)*radius);
    }
  }
  for(let j=0;j<R;j++)for(let k=0;k<N;k++){
    const a=j*N+k,b=j*N+(k+1)%N,c=(j+1)*N+k,d=(j+1)*N+(k+1)%N;
    idx.push(a,c,b,b,c,d);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));
  g.setIndex(idx);g.computeVertexNormals();return g;
}
function grassTuftGeometry(){
  const p:number[]=[],idx:number[]=[];
  for(let k=0;k<7;k++){
    const a=k*2.399,base=k*3;
    p.push(Math.cos(a)*.23,-.5,Math.sin(a)*.23,
      Math.cos(a+.38)*.20,-.5,Math.sin(a+.38)*.20,
      Math.cos(a)*.34+Math.sin(a)*.16,.5,Math.sin(a)*.34);
    idx.push(base,base+1,base+2,base+2,base+1,base);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setIndex(idx);g.computeVertexNormals();return g;
}
function scenery(g:T.Group,seed:number,density:number){
  const trunks:Item[]=[],pineA:Item[]=[],pineB:Item[]=[],pineC:Item[]=[],deciduous:Item[]=[],stones:Item[]=[],chips:Item[]=[],grass:Item[]=[];
  // Deterministic, varied tree populations: long uneven clusters and empty sight lines.
  let id=0;
  for(let x=-94;x<780;x+=10.6)for(const sign of [-1,1])for(let row=0;row<3;row++){
    const q=srand(id++,seed);
    if(q>density*(row===0?.61:.76))continue;
    const along=x+(srand(id++,seed)-.5)*12.5;
    const z=sign*(15.2+row*11.8+srand(id++,seed)*11.0);
    const y=heightAt(along,z),h=6.3+srand(id++,seed)*9.0;
    const pine=srand(id++,seed)>.24,ry=srand(id++,seed)*6.28;
    trunks.push({x:along,y:y+h*.38,z,sx:.72+srand(id++,seed)*.30,sy:h*.77,sz:.72+srand(id++,seed)*.3,ry,colour:pine?'#493e32':'#645044'});
    if(pine){
      const variants=[pineA,pineB,pineC];
      for(let tier=0;tier<3;tier++){
        const ar=variants[tier],factor=[1,.84,.63][tier],offset=[.35,.55,.74][tier];
        ar.push({x:along,y:y+h*offset,z,sx:h*.245*factor,sy:h*.64*factor,sz:h*.245*factor,
          ry:ry+tier*.34,colour:['#1b382d','#294938','#35513b','#3f6145'][Math.floor(srand(id++,seed)*4)]});
      }
    }else{
      for(let crown=0;crown<9;crown++){
        const phase=crown*2.399+ry,rad=crown===0?0:h*(.09+.04*srand(id++,seed));
        deciduous.push({x:along+Math.sin(phase)*rad,y:y+h*(.63+.075*(crown%3)),
          z:z+Math.cos(phase)*rad,sx:h*(.105+.032*srand(id++,seed)),
          sy:h*.135,sz:h*(.11+.025*srand(id++,seed)),ry:phase,
          colour:['#284c39','#3a5b3d','#4a6b45','#64784e'][Math.floor(srand(id++,seed)*4)]});
      }
    }
  }
  for(let i=0;i<1500*density;i++){
    const x=-95+srand(i*13+1,seed)*875,side=srand(i*13+2,seed)>.5?1:-1;
    const z=side*(4.7+Math.pow(srand(i*13+3,seed),1.6)*27);
    const y=heightAt(x,z),s=.055+srand(i*13+4,seed)*.42;
    (i%4===0?stones:chips).push({x,y:y+s*.22,z,sx:s*(.7+srand(i+12,seed)),sy:s*.48,
      sz:s*(.6+srand(i+27,seed)),ry:srand(i+92,seed)*6.283,
      colour:['#7c7770','#6e6b60','#a19785','#52635d','#928c7e'][i%5]});
  }
  for(let i=0;i<1850*density;i++){
    const x=-96+srand(i*23+2,seed)*879,side=i%2?1:-1;
    const z=side*(6.2+srand(i*23+4,seed)*24),y=heightAt(x,z);
    const s=.21+srand(i*19+5,seed)*.51;
    grass.push({x,y:y+s*.4,z,sx:s*.32,sy:s,sz:s*.32,ry:srand(i+22,seed)*6.283,
      colour:['#496942','#737a4b','#546942','#8f8050','#344e35'][i%5]});
  }
  instanced(g,'ep006-tree-trunks',new T.CylinderGeometry(.26,.42,1,7),.98,trunks);
  instanced(g,'ep006-conifer-lower',firBranchGeometry(seed),.97,pineA);
  instanced(g,'ep006-conifer-middle',firBranchGeometry(seed+17),.97,pineB);
  instanced(g,'ep006-conifer-upper',firBranchGeometry(seed+31),.97,pineC);
  instanced(g,'ep006-broadleaf-crowns',new T.IcosahedronGeometry(1,1),.99,deciduous);
  instanced(g,'ep006-gravel-rocks',new T.DodecahedronGeometry(1,1),.96,stones);
  instanced(g,'ep006-gravel-chips',new T.IcosahedronGeometry(1,0),1,chips,false);
  instanced(g,'ep006-grass-tufts',grassTuftGeometry(),1,grass,false);
}
function skyDome(g:T.Group){
  const geo=new T.SphereGeometry(950,40,22),pos=geo.attributes.position,colors:number[]=[];
  const top=new T.Color(EP006_STAGE_LIGHT.sky),mid=new T.Color(EP006_STAGE_LIGHT.horizon);
  for(let i=0;i<pos.count;i++){
    const s=T.MathUtils.clamp((pos.getY(i)+80)/800,0,1);
    const c=mid.clone().lerp(top,Math.sqrt(s));colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const dome=mesh(g,'ep006-gradient-sky',geo,new T.MeshBasicMaterial({
    vertexColors:true,side:T.BackSide,depthWrite:false,fog:false}));
  dome.position.set(345,0,0);dome.receiveShadow=false;dome.renderOrder=-50;
}
/** Stage factory: caller owns and disposes the returned Group. No car or motion simulator. */
export function createEp006Stage(options:Ep006StageOptions={}):T.Group{
  const {seed=290,sceneryDensity=1}=options;
  if(!Number.isFinite(seed)||!Number.isFinite(sceneryDensity)||sceneryDensity<0||sceneryDensity>1)
    throw Error('Invalid EP006 stage seed/density');
  const world=new T.Group();world.name='ep006-premium-rally-stage';
  world.userData={units:'metres',axes:'+X forward +Y up +Z left',
    landmarks:EP006_JUMP_LANDMARKS,collisionAPI:'heightAt(x,z) / sampleEp006Ground(x,z)'};
  skyDome(world);
  const maps=makeNoiseMap(seed);
  const terrain=heightGeometry(
    EP006_STAGE_LIMITS.minX,EP006_STAGE_LIMITS.maxX,
    EP006_STAGE_LIMITS.minZ,EP006_STAGE_LIMITS.maxZ,380,92,false,seed+1);
  const soilMap=makeNoiseMap(seed+46).colour;
  const terrainMat=new T.MeshStandardMaterial({
    color:'#ffffff',map:soilMap,vertexColors:true,roughness:1,metalness:0,side:T.DoubleSide
  });
  mesh(world,'ep006-eroded-terrain',terrain,terrainMat);
  const road=heightGeometry(
    EP006_STAGE_LIMITS.minX,EP006_STAGE_LIMITS.maxX,-5,5,1350,34,true,seed+2);
  const roadMat=new T.MeshStandardMaterial({
    color:'#ffffff',vertexColors:true,map:maps.colour,roughnessMap:maps.roughness,
    bumpMap:maps.roughness,bumpScale:.028,roughness:.99,metalness:.01,side:T.DoubleSide
  });
  const roadMesh=mesh(world,'ep006-gravel-contact-mesh',road,roadMat);roadMesh.receiveShadow=true;
  scenery(world,seed,sceneryDensity);
  world.userData.gravelMap=maps.colour;
  world.userData.gravelRoughnessMap=maps.roughness;
  return world;
}
