/**
 * EP005 proportion die, v2. Physically changes the model's arched-body
 * vertex positions, replaces the shallow stock glass/roof shell with a
 * continuous elevated curved greenhouse, and adds nonplanar bonnet and
 * rear-haunch skins. This is NOT a camera/scale/trim workaround.
 * The V3 wheels, steering, animated body shell, cabin, driver, V8 and
 * actual A2 exhaust Object3D nodes are NOT rebuilt or reparented.
 */
import * as T from 'three';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {bodyTop,bodyHalfWidth} from '../../../../src/yunex/world-kit/vehicle-body.ts';

type V3=[number,number,number];
export const EP005_ENVELOPE={
 length:4.70,width:2.01,designRoofHeight:1.235,
 windowBelt:0.79,frontRoofX:0.27,rearRoofX:-1.02,
 screenBaseX:0.92,screenBaseY:0.79,rearGlassBaseX:-1.62,
 rearArchX:-1.39,frontArchX:1.39,wheelRadius:.36
} as const;
const sq=(x:number)=>x*x;
const gauss=(x:number,c:number,r:number)=>Math.exp(-sq((x-c)/r));
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const ease=(v:number)=>{const x=clamp(v,0,1);return x*x*(3-2*x);};
function mat(hex:string,metalness:number,roughness:number,glass=false){
 const m=new T.MeshPhysicalMaterial({
  color:hex,metalness,roughness,
  clearcoat:glass?.18:1,clearcoatRoughness:glass?.09:.11,
  transparent:glass,opacity:glass?.70:1,depthWrite:!glass,
  side:T.DoubleSide,envMapIntensity:1.45,
 });
 m.userData.baseline={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,
  emissive:m.emissive.getHex(),intensity:m.emissiveIntensity};
 m.userData.shaderTransparent=m.transparent;
 return m;
}
function grid(name:string,nx:number,nz:number,
 point:(u:number,v:number)=>V3,material:T.Material):T.Mesh{
 const positions:number[]=[],indices:number[]=[];
 for(let ix=0;ix<=nx;ix++)for(let iz=0;iz<=nz;iz++)positions.push(...point(ix/nx,iz/nz));
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
  const k=i*(nz+1)+j;indices.push(k,k+nz+1,k+1,k+1,k+nz+1,k+nz+2);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);
 geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
 const mesh=new T.Mesh(geo,material);mesh.name=name;mesh.castShadow=!material.transparent;mesh.receiveShadow=true;
 return mesh;
}
function rail(shell:T.Object3D,name:string,samples:V3[],material:T.Material,r=.008){
 const points=samples.map(p=>new T.Vector3(...p));
 const curve=new T.CatmullRomCurve3(points,false,'centripetal');
 const mesh=new T.Mesh(new T.TubeGeometry(curve,Math.max(24,samples.length*6),r,10,false),material);
 mesh.name=name;mesh.castShadow=true;shell.add(mesh);return mesh;
}
function curvePoints(n:number,fn:(u:number)=>V3){return Array.from({length:n+1},(_,i)=>fn(i/n));}

/** Treat stock body as an editable coachwork die; respect the existing wheel apertures. */
export function sculptEp005BodyVertices(shell:T.Object3D){
 const body=shell.getObjectByName('arched-body');
 if(!(body instanceof T.Mesh))throw new Error('EP005 missing sculptable arched-body');
 const src=body.geometry.clone(),attr=src.getAttribute('position');
 let moved=0;
 for(let i=0;i<attr.count;i++){
  const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);
  const absz=Math.abs(z),side=Math.sign(z),flank=ease((absz-.28)/.60);
  const rear=gauss(x,-1.36,.61),front=gauss(x,1.34,.60);
  const door=gauss(x,.0,.77),shoulder=gauss(y,.765,.155),waist=gauss(y,.48,.19);
  // Pronounced horizontal shoulder, grown rear fender and concave mid-door.
  const dz=side*flank*(.081*rear*shoulder+.037*front*shoulder-.070*door*waist);
  const dy=.042*rear*shoulder+.027*front*shoulder+.024*door*shoulder
   -.025*ease((x-1.78)/.54)*ease((y-.52)/.30);
  if(Math.abs(dz)+Math.abs(dy)>1e-6)moved++;
  attr.setXYZ(i,x,y+dy,z+dz);
 }
 attr.needsUpdate=true;src.computeVertexNormals();
 src.computeBoundingBox();src.computeBoundingSphere();
 // V3 deformation animates from registered rest arrays on every frame: refresh
 // them to this authored body so the first seek/drive frame cannot undo sculpting.
 const prior=body.geometry;body.geometry=src;prior.dispose();
 body.userData.restVertices=Array.from((src.getAttribute('position') as T.BufferAttribute).array);
 body.userData.restNormals=Array.from((src.getAttribute('normal') as T.BufferAttribute).array);
 delete body.userData.lastBodyDamage;
 body.userData.ep005ResculptedBodyVertices=moved;
 body.userData.ep005ProportionDie='distinct bonnet/waist/rear quarter and locked wheel apertures';
 if(moved<100)throw new Error('Body vertex die changed too few vertices');
}
/** Keep the original fitted cabin *interior*, but replace flat external glazing and roof. */
function removeFlatGreenhouse(shell:T.Object3D){
 const stock=new Set(['windshield','windshield-seal','side-glass','window-frame',
  'window-seal','rear-glass','rear-window-frame','roof','cabin-pillar']);
 let hidden=0;
 shell.traverse(o=>{
  if(!stock.has(o.name))return;
  // Only the stock exterior surface; never hide a same-named cabin object.
  for(let p:T.Object3D|null=o;p&&p!==shell;p=p.parent)if(p.name==='interior')return;
  o.visible=false;hidden++;
 });
 if(hidden<7)throw new Error('Expected original V3 cabin exterior for replacement');
 return hidden;
}
function canopy(shell:T.Object3D){
 const paint=mat('#91a6ae',.53,.16),glass=mat('#254454',.10,.082,true),
 chrome=mat('#64747a',.78,.22),seal=mat('#0e171b',.06,.78);
 const roofPoint=(u:number,v:number):V3=>{
  const x=EP005_ENVELOPE.rearRoofX+(EP005_ENVELOPE.frontRoofX-EP005_ENVELOPE.rearRoofX)*u;
  const width=.655-.013*u+.025*Math.sin(Math.PI*u);
  const y=1.125+.071*Math.sin(Math.PI*u)+.038*Math.sin(Math.PI*v)*Math.sin(Math.PI*u);
  return [x,y,(2*v-1)*width];
 };
 const roof=grid('ep005-formed-roof-canopy',36,24,roofPoint,paint);shell.add(roof);
 const windshield=(u:number,v:number):V3=>{
  // u bottom -> top; v left -> right. Real 3D bulge, not planar quadrilateral.
  const t=ease(u),x=.920+(.275-.920)*t+.024*Math.sin(Math.PI*t);
  const y=.793+.333*t+.012*Math.sin(Math.PI*v)*Math.sin(Math.PI*t);
  const width=.900+(.642-.900)*t;
  return [x,y,(2*v-1)*width];
 };
 shell.add(grid('ep005-curved-windscreen',22,26,windshield,glass));
 const rearScreen=(u:number,v:number):V3=>{
  const t=ease(u),x=-1.615+(.005-1.020+1.615)*t;
  const y=.805+.323*t+.012*Math.sin(Math.PI*v)*Math.sin(Math.PI*t);
  const width=.845+(.655-.845)*t;
  return [x,y,(2*v-1)*width];
 };
 shell.add(grid('ep005-curved-rear-glazing',20,24,rearScreen,glass));
 for(const sign of [-1,1]){
  const sideGlass=(u:number,v:number):V3=>{
   const lowerX=-1.60+2.51*u,topX=-1.018+1.287*u;
   const x=lowerX+(topX-lowerX)*ease(v);
   const roof=.1*Math.sin(Math.PI*u)+1.118;
   const y=.79+(roof-.79)*ease(v)+.008*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
   const z=sign*(.894+(.651-.894)*ease(v)+.009*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));
   return [x,y,z];
  };
  shell.add(grid('ep005-curved-side-glass-'+sign,28,18,sideGlass,glass));
  rail(shell,'ep005-roof-drip-rail-'+sign,curvePoints(22,u=>{
   const p=roofPoint(u,sign>0?1:0);return [p[0],p[1]+.002,p[2]+sign*.009];
  }),paint,.012);
  rail(shell,'ep005-A-pillar-'+sign,curvePoints(14,u=>windshield(u,sign>0?1:0)),paint,.026);
  rail(shell,'ep005-C-pillar-'+sign,curvePoints(14,u=>rearScreen(u,sign>0?1:0)),paint,.025);
  rail(shell,'ep005-window-belt-'+sign,curvePoints(25,u=>{
   const p=sideGlass(u,0);return [p[0],p[1]+.004,p[2]+sign*.010];
  }),seal,.009);
  rail(shell,'ep005-window-upper-seal-'+sign,curvePoints(25,u=>{
   const p=sideGlass(u,1);return [p[0],p[1]+.003,p[2]+sign*.006];
  }),chrome,.005);
 }
 rail(shell,'ep005-windscreen-header',curvePoints(20,v=>windshield(1,v)),paint,.021);
 rail(shell,'ep005-windscreen-lower-edge',curvePoints(20,v=>windshield(0,v)),seal,.009);
 rail(shell,'ep005-rear-window-header',curvePoints(20,v=>rearScreen(1,v)),paint,.018);
 shell.userData.ep005RaisedCabinHeight=EP005_ENVELOPE.designRoofHeight;
}
/** Long sculpted bonnet vs high wheel brows. Does not add an opaque slab over wheel wells. */
function bonnet(shell:T.Object3D){
 const s=vehicleSpec('supercar'),m=mat('#81979e',.56,.17);
 shell.add(grid('ep005-compound-formed-bonnet',34,20,(u,v)=>{
  const x=.86+1.47*u;
  const breadth=.70+.12*Math.sin(Math.PI*u);
  const z=(2*v-1)*breadth;
  const dome=.063*Math.sin(Math.PI*u)*(1-sq(2*v-1));
  const fender=.025*Math.exp(-sq((Math.abs(z)-.68)/.24));
  const y=bodyTop(s,x)+.026+dome+fender-.022*ease((x-1.88)/.46);
  return [x,y,z];
 },m));
}
/** Rear shoulder arch: independent curved skin with a real wheel aperture. */
function rearQuarter(shell:T.Object3D){
 const s=vehicleSpec('supercar'),m=mat('#91a6ae',.55,.17);
 for(const sign of [-1,1]){
  const nx=32,ny=16,positions:number[]=[],indices:number[]=[];
  for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){
   const u=i/nx,v=j/ny,x=-2.24+1.66*u;
   const y=.59+.296*v+.033*Math.sin(Math.PI*u)*v;
   const contour=bodyHalfWidth(s,x,y);
   const haunch=.102*gauss(x,-1.38,.53)*Math.sin(Math.PI*(.17+.83*v));
   positions.push(x,y,sign*(contour+.014+haunch));
  }
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
   const ix=i*(ny+1)+j,x=-2.24+1.66*(i+.5)/nx;
   const y=.59+.296*(j+.5)/ny;
   // Genuine open wheel cutout, no second solid skin over rolling tyre.
   const archTop=s.radius+Math.sqrt(Math.max(0,sq(s.radius*1.12)-sq(x+1.39)));
   if(Math.abs(x+1.39)<s.radius*1.12&&y<archTop+.04)continue;
   indices.push(ix,ix+ny+1,ix+1,ix+1,ix+ny+1,ix+ny+2);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,m);mesh.name='ep005-sculpted-rear-haunch-'+sign;
  mesh.material.side=T.DoubleSide;mesh.castShadow=true;mesh.receiveShadow=true;shell.add(mesh);
 }
}
export function resculptEp005Supercar(hero:T.Group){
 const shell=hero.getObjectByName('body-shell');
 if(!shell)throw new Error('EP005 requires original moving V3 body-shell');
 const hidden=removeFlatGreenhouse(shell);
 sculptEp005BodyVertices(shell);
 canopy(shell);bonnet(shell);rearQuarter(shell);
 hero.userData.ep005ProportionsVersion=2;
 hero.userData.ep005StockGreenhouseReplaced=hidden;
 hero.updateMatrixWorld(true);
 return hero;
}
