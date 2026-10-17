import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * A1 V6: original, sculpted coupe body. Metres / +Y up / +Z front.
 * The tyres, wheel pivots, axle positions, engine access and public interface
 * are deliberately left in VehicleWorld/DetailKit. This is bodywork ONLY.
 */
type Point = [number, number, number];
type Section = readonly [number, number, number, number]; // z, half-width, sill, deck
const TEAL = '#0D817F';
const keyed: readonly Section[] = [
  [-2.30,.66,.44,.66],[-2.12,.80,.40,.73],[-1.82,.91,.39,.84],
  [-1.47,.97,.39,.91],[-1.10,.92,.39,.85],[-.62,.90,.37,.77],
  [.20,.91,.36,.77],[.89,.94,.36,.80],[1.40,.99,.35,.83],
  [1.72,.95,.34,.79],[2.04,.82,.34,.71],[2.30,.64,.35,.61],
];
const hermite=(a:number,b:number,m0:number,m1:number,t:number,dt:number)=>{
  const t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*a+(t3-2*t2+t)*dt*m0+(-2*t3+3*t2)*b+(t3-t2)*dt*m1;
};
const at=(z:number):{w:number;low:number;high:number}=>{
  const i=Math.max(0,Math.min(keyed.length-2,keyed.findIndex((k,n)=>n<keyed.length-1&&z>=k[0]&&z<=keyed[n+1][0])));
  const a=keyed[i],b=keyed[i+1],dt=b[0]-a[0],t=THREE.MathUtils.clamp((z-a[0])/dt,0,1);
  const interp=(k:1|2|3)=>{
    const pa=keyed[Math.max(0,i-1)],pb=keyed[Math.min(keyed.length-1,i+2)];
    const d0=(b[k]-pa[k])/(b[0]-pa[0]),d1=(pb[k]-a[k])/(pb[0]-a[0]);
    return hermite(a[k],b[k],d0,d1,t,dt);
  };
  return {w:interp(1),low:interp(2),high:interp(3)};
};
const make=(verts:number[],indices:number[]):THREE.BufferGeometry=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
};
const pushQuad=(vs:number[],is:number[],a:Point,b:Point,c:Point,d:Point)=>{
  const j=vs.length/3;
  vs.push(...a,...b,...c,...d);
  is.push(j,j+1,j+2,j,j+2,j+3);
};
const axle=[-1.48,1.47];
const archRadius=.417;
const archBottom=(z:number,low:number)=>{
  let result=low;
  for(const axleZ of axle){
    const dz=z-axleZ;
    if(Math.abs(dz)<archRadius){
      result=Math.max(result,.355+Math.sqrt(archRadius*archRadius-dz*dz));
    }
  }
  return result;
};
function buildSkin(){
 const vs:number[]=[],is:number[]=[],sv:number[]=[],si:number[]=[];
 const steps=184, z0=-2.30,z1=2.30;
 const xs=[-1.01,-.96,-.84,-.59,-.42,-.23,0,.23,.42,.59,.84,.96,1.01];
 const ys=[-.105,.012,.054,-.018,-.039,-.047,-.056,-.047,-.039,-.018,.054,.012,-.105];
 const rows:Point[][]=[];
 for(let i=0;i<=steps;i++){
   const z=z0+(z1-z0)*i/steps,{w,high}=at(z);
   const rear=(z<-.95),lift=rear?-.018:0;
   // Match the variable-width headlamp openings to the physical swept lens.
   const lt=THREE.MathUtils.clamp((z-1.76)/.37,0,1);
   rows.push(xs.map((f,j)=>{
     const abs=Math.abs(f);
     let projected=f;
     if(z>=1.76&&z<=2.13){
       if(Math.abs(abs-.42)<.0001)projected=Math.sign(f)*((.405+.033*lt)/w);
       if(Math.abs(abs-.84)<.0001)projected=Math.sign(f)*((.805-.130*lt)/w);
     }
     return [w*projected, high+ys[j]+lift,z];
   }));
 }
 for(let i=0;i<steps;i++){
  for(let j=0;j<xs.length-1;j++){
   // Preserve engine access: surface under the hinged engine cover must not
   // occlude the physical plenum and cylinder banks when the deck opens.
   const mid=(z0+(z1-z0)*(i+.5)/steps);
   const center=(Math.abs(xs[j]+xs[j+1])<1.20);
   if(mid>-1.94&&mid<-.995&&center) continue;
   // The headlamp outer lenses span these two panels on either side:
   // omit opaque bonnet faces so they are genuine openings, not decals.
   const stripCenter=(xs[j]+xs[j+1])/2;
   if(mid>1.76&&mid<2.13&&Math.abs(stripCenter)>.43&&Math.abs(stripCenter)<.84) continue;
   pushQuad(vs,is,rows[i][j],rows[i+1][j],rows[i+1][j+1],rows[i][j+1]);
  }
 }
 for(const side of [-1,1]){
  for(let i=0;i<steps;i++){
   const za=z0+(z1-z0)*i/steps,zb=z0+(z1-z0)*(i+1)/steps;
   const mid=(za+zb)/2;
   // Actual open rear-quarter scoop: no opaque teal panel over SideDuct.
   if(mid>-1.49&&mid<-.79) continue;
   const p=[za,zb].map(z=>{
     const {w,low,high}=at(z);
     return {w,low,high,top:high-.105,foot:archBottom(z,low)};
   });
   if(p[0].foot>=p[0].top||p[1].foot>=p[1].top) continue;
   const v=(idx:number,t:number):Point=>{
     const {w,top,foot}=p[idx];
     return [side*w*(1.01-.095*t),top+(foot-top)*t,idx===0?za:zb];
   };
   pushQuad(sv,si,v(0,0),v(1,0),v(1,.55),v(0,.55));
   pushQuad(sv,si,v(0,.55),v(1,.55),v(1,1),v(0,1));
  }
 }
 return {hood:make(vs,is),flanks:make(sv,si)};
}
const Tube:React.FC<{points:Point[];radius:number;colour:string;name?:string}>=({points,radius,colour,name})=>{
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);
 const geometry=useMemo(()=>new THREE.TubeGeometry(curve,Math.max(20,points.length*3),radius,6,false),[curve,radius,points.length]);
 return <mesh name={name} geometry={geometry} castShadow><meshStandardMaterial color={colour} metalness={.7} roughness={.31}/></mesh>;
};
export const SculptedShell:React.FC=()=>{
 const geo=useMemo(buildSkin,[]);
 return <group name="V6_SCULPTED_BODY_SHELL">
  <mesh geometry={geo.hood} castShadow receiveShadow>
   <meshPhysicalMaterial name="BODY_TEAL_ENAMEL" color={TEAL} metalness={.67} roughness={.24} clearcoat={.87} clearcoatRoughness={.15} side={THREE.DoubleSide}/>
  </mesh>
  <mesh geometry={geo.flanks} castShadow receiveShadow>
   <meshPhysicalMaterial name="SCULPTED_SIDE_BODYWORK" color={TEAL} metalness={.66} roughness={.26} clearcoat={.84} side={THREE.DoubleSide}/>
  </mesh>
  {[-1,1].map(side=><group key={side}>
   {axle.map(zc=>{
     const arc:Point[]=Array.from({length:25},(_,i)=>{
       const a=Math.PI*i/24,z=zc+archRadius*Math.cos(a),y=.355+archRadius*Math.sin(a);
       return [side*at(z).w*1.018,y,z];
     });
     const archShade=arc.map(p=>[p[0]-side*.026,p[1]-.013,p[2]] as Point);
     return <group key={zc} name={zc>0?'SCULPTED_FRONT_FENDER_ARCH':'SCULPTED_REAR_FENDER_ARCH'}>
       <Tube points={archShade} radius={.039} colour="#091D24" name="SHADOWED_PHYSICAL_WHEEL_WELL"/>
       <Tube points={arc} radius={.020} colour="#1E6F70" name="FENDER_LIP_LAID_OVER_WHEEL"/>
     </group>;
   })}
   <Tube points={[[side*.84,.475,-.77],[side*.86,.44,-.28],[side*.90,.45,.35],[side*.88,.44,.93]]}
    radius={.026} colour="#123C45" name="RECESSED_ROCKER_CONTOUR"/>
   <Tube points={[[side*.73,.81,1.06],[side*.80,.83,1.30],[side*.79,.84,1.61],[side*.65,.73,2.08]]}
    radius={.012} colour="#3D9E9D" name="FRONT_HAUNCH_CHARACTER_LINE"/>
  </group>)}
 </group>;
};
const makeCanopy=()=>{
 const data:readonly Section[]=[
  [-1.37,.67,.79,.81],[-1.04,.63,.79,1.02],[-.65,.54,.79,1.205],
  [.10,.53,.79,1.215],[.42,.55,.79,1.135],[1.12,.70,.79,.80],
 ];
 const v:number[]=[],ix:number[]=[];
 const n=75, row=7;
 for(let i=0;i<=n;i++){
  const z=-1.37+(2.49*i/n);
  let k=0;while(k<data.length-2&&z>data[k+1][0])k++;
  const a=data[k],b=data[k+1],t=THREE.MathUtils.smoothstep((z-a[0])/(b[0]-a[0]),0,1);
  const w=THREE.MathUtils.lerp(a[1],b[1],t);
  const lo=.79,high=THREE.MathUtils.lerp(a[3],b[3],t);
  for(const f of [-1,-.88,-.55,0,.55,.88,1]){
   const crown=(1-Math.abs(f))*.015;
   v.push(f*w,lo+(high-lo)*(1-Math.pow(Math.abs(f),5)) + crown,z);
  }
 }
 for(let i=0;i<n;i++)for(let j=0;j<row-1;j++){
  const o=i*row+j;ix.push(o,o+row,o+row+1,o,o+row+1,o+1);
 }
 return make(v,ix);
};
export const SculptedCanopy:React.FC=()=>{
 const glass=useMemo(makeCanopy,[]);
 return <group name="RAKED_SCULPTED_GLASSHOUSE">
  <mesh geometry={glass} castShadow>
   <meshPhysicalMaterial name="DARK_TINTED_GLASS" color="#112A38" roughness={.105} metalness={.38}
    transparent opacity={.96} clearcoat={1} side={THREE.DoubleSide}/>
  </mesh>
  {[-1,1].map(side=><group key={side}>
   <Tube points={[[side*.70,.808,1.12],[side*.625,.968,.83],[side*.56,1.135,.42],[side*.53,1.215,.11]]}
    radius={.015} colour="#537F89" name="RAKED_A_PILLAR"/>
   <Tube points={[[side*.63,.82,-1.33],[side*.57,1.0,-1.04],[side*.54,1.20,-.65],[side*.53,1.215,.10]]}
    radius={.014} colour="#265461" name="C_PILLAR_GLASS_TRIM"/>
   <Tube points={[[side*.70,.802,1.09],[side*.69,.801,.64],[side*.65,.797,-.16],[side*.66,.797,-1.30]]}
    radius={.017} colour="#6A9A9A" name="SIDE_WINDOW_LOWER_CHROME"/>
  </group>)}
  {/* A gently crowned roof insert instead of the old flat rectangular slab. */}
  <mesh position={[0,1.225,-.24]} scale={[.485,.019,.364]} castShadow>
   <sphereGeometry args={[1,32,12]}/>
   <meshPhysicalMaterial name="COUPE_ROOF_INSERT" color="#164952" metalness={.68} roughness={.21} clearcoat={.8}/>
  </mesh>
 </group>;
};
const noseShape=()=>{
 const s=new THREE.Shape();
 s.moveTo(-.68,.355);s.lineTo(.68,.355);
 s.quadraticCurveTo(.77,.42,.72,.54);s.lineTo(.66,.635);
 s.quadraticCurveTo(.56,.66,.44,.624);s.quadraticCurveTo(0,.585,-.44,.624);
 s.quadraticCurveTo(-.56,.66,-.66,.635);s.lineTo(-.72,.54);
 s.quadraticCurveTo(-.77,.42,-.68,.355);s.closePath();
 for(const side of [-1,1]){
  const cx=side*.42;
  const p=new THREE.Path();
  p.moveTo(cx-.182,.455);p.lineTo(cx+.182,.455);p.lineTo(cx+.159,.602);p.lineTo(cx-.132,.610);p.closePath();
  s.holes.push(p);
 }
 return new THREE.ExtrudeGeometry(s,{depth:.05,bevelEnabled:true,bevelSegments:2,
  bevelSize:.008,bevelThickness:.012,steps:1,curveSegments:8});
};
export const SculptedNose:React.FC=()=>{
 const fascia=useMemo(noseShape,[]);
 return <group name="CURVED_PERFORATED_FRONT_FASCIA">
  <mesh geometry={fascia} position={[0,0,2.266]} castShadow>
   <meshPhysicalMaterial name="ACTUAL_PERFORATED_BUMPER_FASCIA" color={TEAL}
    metalness={.64} roughness={.25} clearcoat={.84} side={THREE.DoubleSide}/>
  </mesh>
  <mesh position={[0,.429,2.331]}><boxGeometry args={[.37,.082,.022]}/>
   <meshStandardMaterial name="FRONT_CENTRE_BREATHING_SLOT" color="#05141B" roughness={.8}/>
  </mesh>
  <mesh position={[0,.486,2.339]}><boxGeometry args={[.49,.024,.032]}/>
   <meshStandardMaterial name="SCULPTED_NOSE_CENTRE_BRIDGE" color="#216A6C" metalness={.63} roughness={.3}/>
  </mesh>
  {[-1,1].map(s=><mesh key={s} position={[s*.70,.410,2.290]} rotation={[0,s*.24,0]}>
    <boxGeometry args={[.27,.033,.13]}/>
    <meshPhysicalMaterial name="AERO_BUMPER_CORNER" color="#0B6567" metalness={.67} roughness={.27} clearcoat={.8}/>
  </mesh>)}
 </group>;
};
