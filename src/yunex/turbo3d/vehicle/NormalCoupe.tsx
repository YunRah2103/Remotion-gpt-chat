import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * YUNEX A1 V8: ordinary modern road coupe, intentionally NOT a supercar.
 * One bonnet, recognisable windshield, passenger roof, doors and rear boot.
 * Coordinates and interface: +Z FRONT, +Y UP, metres, stock wheelbase 2.95m.
 * Camera, editor, engine, environment and animation systems are unchanged.
 */
type P = [number,number,number];
const PAINT='#147977';
const DARK='#101F2A';
const PI=Math.PI;
const axles=[-1.48,1.47] as const;

const bodyKeys: ReadonlyArray<readonly [number,number,number]>=[
  [-2.30,.76,.70],[-2.15,.87,.79],[-1.83,.97,.85],
  [-1.49,1.015,.89],[-1.13,.965,.86],[-.47,.925,.84],
  [.45,.935,.85],[1.12,.986,.89],[1.47,1.018,.90],
  [1.90,.92,.86],[2.18,.83,.80],[2.30,.77,.73]
]; // z, half width, top-of-wing y
const interp=(z:number)=>{
 let i=0;
 while(i<bodyKeys.length-2&&z>bodyKeys[i+1][0])i++;
 const a=bodyKeys[i],b=bodyKeys[i+1];
 const t=THREE.MathUtils.clamp((z-a[0])/(b[0]-a[0]),0,1);
 const s=t*t*(3-2*t);
 return {w:THREE.MathUtils.lerp(a[1],b[1],s),top:THREE.MathUtils.lerp(a[2],b[2],s)};
};
const archLow=(z:number)=>{
 let low=.27;
 for(const axle of axles){
  const d=z-axle,r=.406;
  if(Math.abs(d)<r)low=Math.max(low,.355+Math.sqrt(r*r-d*d));
 }
 return low;
};
const meshGeom=(verts:number[],idx:number[])=>{
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(idx);g.computeVertexNormals();
 return g;
};
const makeShell=(engineOpening:boolean)=>{
 const steps=176;
 const crown=[-1,-.90,-.66,-.33,0,.33,.66,.90,1];
 const topVerts:number[]=[],topIdx:number[]=[];
 const flankVerts:number[]=[],flankIdx:number[]=[];
 for(let i=0;i<=steps;i++){
  const z=-2.30+4.60*i/steps,{w,top}=interp(z);
  for(const f of crown){
   // Continuous, gently crowned metal bonnet/boot, not a flat wedge.
   topVerts.push(f*w, top+.052*(1-f*f),z);
  }
  for(const side of [-1,1]){
   const floor=Math.min(top-.028,archLow(z));
   for(const t of [0,.31,.68,1]){
    const y=THREE.MathUtils.lerp(top,floor,t);
    const x=side*w*(1-.024*t+.018*Math.sin(PI*t));
    flankVerts.push(x,y,z);
   }
  }
 }
 for(let i=0;i<steps;i++){
  const z=-2.30+4.60*(i+.5)/steps;
  for(let j=0;j<crown.length-1;j++){
   // Engine lid stays a real opening only for the original reveal variant.
   if(engineOpening&&z>-1.94&&z<-.995&&
      Math.abs((crown[j]+crown[j+1])/2)<.70)continue;
   const a=i*crown.length+j,b=a+crown.length;
   topIdx.push(a,b,a+1,b,b+1,a+1);
  }
  for(let side=0;side<2;side++)for(let j=0;j<3;j++){
   const a=i*8+side*4+j,b=a+8;
   flankIdx.push(a,a+1,b,a+1,b+1,b);
  }
 }
 return {top:meshGeom(topVerts,topIdx),flanks:meshGeom(flankVerts,flankIdx)};
};
const simpleSurface=(vertices:P[],tri:number[])=>{
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));
 g.setIndex(tri);g.computeVertexNormals();return g;
};
const Panel:React.FC<{vertices:P[];name:string;glass?:boolean}>=({vertices,name,glass=false})=>{
 const geo=useMemo(()=>simpleSurface(vertices,[0,1,2,0,2,3]),[vertices]);
 return <mesh name={name} geometry={geo} castShadow={!glass}>
  {glass?
   <meshPhysicalMaterial name="ROAD_COUPE_TINTED_GLASS" color="#294857"
     metalness={.28} roughness={.12} clearcoat={1} transparent opacity={.94}
     side={THREE.DoubleSide}/>:
   <meshPhysicalMaterial name="BODY_TEAL_ENAMEL" color={PAINT}
     metalness={.56} roughness={.28} clearcoat={.8} side={THREE.DoubleSide}/>}
 </mesh>;
};
const Trim:React.FC<{points:P[];name:string;color?:string;radius?:number}>=
({points,name,color='#254952',radius=.012})=>{
 const path=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);
 const geometry=useMemo(()=>new THREE.TubeGeometry(path,24,radius,7,false),[path,radius]);
 return <mesh name={name} geometry={geometry}><meshStandardMaterial
  color={color} metalness={.62} roughness={.32}/></mesh>;
};

/** Familiar 3-box passenger cabin: trapezoidal front/rear glass, roof, side windows. */
const Cabin:React.FC=()=>{
 const wind:[[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[
  [-.74,.879,.97],[.74,.879,.97],[.55,1.345,.21],[-.55,1.345,.21]
 ];
 const rear:P[]=[[-.55,1.344,-.70],[.55,1.344,-.70],[.72,.862,-1.34],[-.72,.862,-1.34]];
 const roof:P[]=[[-.57,1.347,.22],[.57,1.347,.22],[.57,1.347,-.71],[-.57,1.347,-.71]];
 return <group name="NORMAL_COUPE_PASSENGER_CABIN">
  <Panel vertices={wind} name="FRONT_WINDSHIELD" glass/>
  <Panel vertices={rear} name="REAR_WINDSHIELD" glass/>
  <Panel vertices={roof} name="PAINTED_FULL_ROOF"/>
  {[-1,1].map(side=>{
   // Front and rear windows are real polygons; no fake huge black bubble.
   const front:P[]=[
    [side*.744,.898,.87],
    [side*.565,1.326,.18],
    [side*.56,1.326,-.29],
    [side*.775,.906,-.30]
   ];
   const back:P[]=[
    [side*.777,.902,-.35],
    [side*.562,1.326,-.34],
    [side*.567,1.326,-.69],
    [side*.731,.877,-1.25]
   ];
   return <group key={side}>
    <Panel vertices={front} name="FRONT_DOOR_WINDOW" glass/>
    <Panel vertices={back} name="REAR_QUARTER_WINDOW" glass/>
    <Trim name="WINDSCREEN_A_PILLAR" color="#164547" radius={.025}
      points={[[side*.75,.884,.97],[side*.59,1.10,.61],[side*.55,1.35,.22]]}/>
    <Trim name="ROOF_SIDE_EDGE" color={PAINT} radius={.025}
      points={[[side*.55,1.35,.22],[side*.565,1.35,-.29],[side*.56,1.35,-.70]]}/>
    <Trim name="REAR_C_PILLAR" color="#164547" radius={.028}
      points={[[side*.56,1.35,-.70],[side*.64,1.14,-.98],[side*.73,.87,-1.34]]}/>
    <Trim name="CENTRE_WINDOW_DIVIDER" color="#16383B" radius={.021}
      points={[[side*.56,1.344,-.31],[side*.776,.902,-.33]]}/>
    <Trim name="WINDOW_SILL" color="#244F53" radius={.015}
      points={[[side*.745,.899,.91],[side*.777,.899,-.32],[side*.73,.883,-1.27]]}/>
   </group>;
  })}
 </group>;
};

/** Stock rolling diameter 710 mm, stock pivots, only five clean alloy spokes. */
export const RoadWheel:React.FC<{side:number;z:number;travelMeters:number}>=
({side,z,travelMeters})=>{
 const spin=-travelMeters/.355;
 return <group name={z>0?'FRONT_WHEEL':'REAR_WHEEL'}
  position={[side*.895,.355,z]}>
  <mesh rotation={[0,0,PI/2]} position={[side*.030,0,0]}>
   <cylinderGeometry args={[.238,.238,.014,40]}/>
   <meshStandardMaterial name="BRAKE_DISC" color="#7A8990" metalness={.8} roughness={.34}/>
  </mesh>
  <group name="WHEEL_PIVOT_X" rotation={[spin,0,0]}>
   <mesh rotation={[0,0,PI/2]} castShadow>
    <cylinderGeometry args={[.353,.353,.174,48]}/>
    <meshStandardMaterial name="RUBBER_SIDEWALL" color="#101318" metalness={.02} roughness={.91}/>
   </mesh>
   <mesh rotation={[0,0,PI/2]} position={[side*.098,0,0]}>
    <cylinderGeometry args={[.247,.247,.025,48]}/>
    <meshStandardMaterial name="RIM_GRAPHITE" color="#27333B" metalness={.8} roughness={.3}/>
   </mesh>
   <mesh rotation={[0,PI/2,0]} position={[side*.116,0,0]}>
    <torusGeometry args={[.248,.016,9,48]}/>
    <meshStandardMaterial name="RIM_OUTER_LIP" color="#B0BEC2" metalness={.91} roughness={.22}/>
   </mesh>
   {Array.from({length:5},(_,i)=><group key={i} rotation={[i*PI*2/5,0,0]}>
    <mesh position={[side*.12,.128,0]} castShadow>
     <boxGeometry args={[.023,.194,.039]}/>
     <meshStandardMaterial name="RIM_MACHINED_SPOKE" color="#8B9EA6" metalness={.86} roughness={.28}/>
    </mesh>
   </group>)}
   <mesh rotation={[0,0,PI/2]} position={[side*.145,0,0]}>
    <cylinderGeometry args={[.063,.063,.034,24]}/>
    <meshStandardMaterial name="WHEEL_CENTRE_CAP" color="#BECAC9" metalness={.91} roughness={.22}/>
   </mesh>
  </group>
 </group>;
};
const LowLamp:React.FC<{side:number;rear?:boolean}>=({side,rear=false})=>
 <group name={rear?'CONVENTIONAL_REAR_TAILLIGHT':'CONVENTIONAL_FRONT_HEADLIGHT'}
  position={[side*.605,rear?.783:.804,rear?-2.303:2.302]}>
  <mesh castShadow><boxGeometry args={[.385,.100,.028]}/>
   <meshStandardMaterial color="#0C1B23" metalness={.47} roughness={.26}/>
  </mesh>
  <mesh position={[0,.006,rear?-.023:.023]}>
   <boxGeometry args={[.342,.055,.014]}/>
   <meshBasicMaterial name={rear?'REAR_LED_CRIMSON':'HEADLAMP_WHITE'}
    color={rear?'#F14752':'#D4F0EF'} toneMapped={false}/>
  </mesh>
 </group>;
const BodyDetails:React.FC=()=> <group name="NORMAL_ROAD_CAR_DETAILING">
  {[-1,1].map(side=><group key={side}>
    <LowLamp side={side}/>
    <LowLamp side={side} rear/>
    {/* A little front grille and conventional fog light, not supercar nostrils. */}
    <mesh position={[side*.67,.474,2.309]}>
     <boxGeometry args={[.235,.079,.028]}/>
     <meshStandardMaterial color="#1B3036" metalness={.3} roughness={.59}/>
    </mesh>
    <mesh position={[side*.84,.944,.73]} scale={[.108,.059,.145]} castShadow>
     <sphereGeometry args={[1,20,12]}/>
     <meshPhysicalMaterial name="SIDE_MIRROR_DARK" color={PAINT}
      metalness={.58} roughness={.27} clearcoat={.79}/>
    </mesh>
    <mesh position={[side*.947,.790,-.27]} castShadow>
     <boxGeometry args={[.020,.025,.16]}/>
     <meshStandardMaterial name="DOOR_HANDLE" color="#B1C5BF" metalness={.83} roughness={.24}/>
    </mesh>
    <Trim name="DOOR_TRAILING_SEAM" color="#175A5B" radius={.006}
     points={[[side*.94,.824,-.88],[side*.945,.61,-.87],[side*.927,.35,-.87]]}/>
    <Trim name="DOOR_FRONT_SEAM" color="#175A5B" radius={.006}
     points={[[side*.94,.835,.78],[side*.963,.57,.76],[side*.981,.37,.76]]}/>
    <Trim name="BODY_SHOULDER_LINE" color="#277F7C" radius={.007}
     points={[[side*.966,.804,-1.03],[side*.937,.805,-.38],[side*.945,.821,.43],[side*.971,.846,1.04]]}/>
    {axles.map(axle=>{
      const pts:P[]=Array.from({length:27},(_,i)=>{
       const a=PI*i/26, z=axle+.406*Math.cos(a);
       return [side*(interp(z).w+.012),.355+.406*Math.sin(a),z];
      });
      return <Trim key={axle} points={pts} name="SIMPLE_ROUNDED_WHEEL_ARCH"
       color="#185656" radius={.016}/>;
    })}
   </group>)}
  <mesh name="STANDARD_FRONT_GRILLE" position={[0,.498,2.316]}>
   <boxGeometry args={[.76,.145,.03]}/>
   <meshStandardMaterial color="#13222B" metalness={.30} roughness={.56}/>
  </mesh>
  <mesh name="FRONT_NUMBER_PLATE" position={[0,.548,2.341]}>
   <boxGeometry args={[.32,.065,.014]}/>
   <meshStandardMaterial color="#889B9B" metalness={.18} roughness={.55}/>
  </mesh>
  <mesh name="REAR_NUMBER_PLATE" position={[0,.567,-2.326]}>
   <boxGeometry args={[.40,.088,.013]}/>
   <meshStandardMaterial color="#A9AE9B" metalness={.08} roughness={.65}/>
  </mesh>
  <mesh name="FRONT_LOW_BUMPER" position={[0,.321,2.298]}>
   <boxGeometry args={[1.48,.062,.085]}/>
   <meshPhysicalMaterial name="BODY_TEAL_FRONT_BUMPER" color={PAINT} metalness={.52} roughness={.32} clearcoat={.71}/>
  </mesh>
  <mesh name="REAR_LOW_BUMPER" position={[0,.320,-2.296]}>
   <boxGeometry args={[1.55,.065,.073]}/>
   <meshPhysicalMaterial name="BODY_TEAL_REAR_BUMPER" color={PAINT} metalness={.52} roughness={.32} clearcoat={.71}/>
  </mesh>
 </group>;

export const RoadCarBody:React.FC<{travelMeters:number;reveal?:boolean}>=
({travelMeters,reveal=false})=>{
 const geometry=useMemo(()=>makeShell(reveal),[reveal]);
 return <group name="ORDINARY_TEAL_ROAD_COUPE">
  <mesh geometry={geometry.top} castShadow receiveShadow>
   <meshPhysicalMaterial name="BODY_TEAL_ENAMEL" color={PAINT} metalness={.60}
    roughness={.28} clearcoat={.86} side={THREE.DoubleSide}/>
  </mesh>
  <mesh geometry={geometry.flanks} castShadow receiveShadow>
   <meshPhysicalMaterial name="SCULPTED_SIDE_BODYWORK" color={PAINT} metalness={.55}
    roughness={.32} clearcoat={.80} side={THREE.DoubleSide}/>
  </mesh>
  <Cabin/>
  <BodyDetails/>
  {[-1,1].flatMap(side=>axles.map(z=>
   <RoadWheel key={side+'_'+z} side={side} z={z} travelMeters={travelMeters}/>
  ))}
 </group>;
};
