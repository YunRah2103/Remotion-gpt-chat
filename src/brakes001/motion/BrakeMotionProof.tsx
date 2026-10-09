/** Optional native Remotion/Three.js stand-in; NOT Agent A's finished GLB. */
import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {brakeStateAt,brakePoseAt,frictionTrackHeat01At} from './brakeState';

export const BrakeMotionProof: React.FC = () => {
  const frame=useCurrentFrame(), s=brakeStateAt(frame), p=brakePoseAt(frame);
  const h=frictionTrackHeat01At(frame,0.16);
  const ringColor=`rgb(${Math.round(54+176*h)},${Math.round(68+36*h)},${Math.round(75-40*h)})`;
  const padX=0.017+s.padGapMetres+0.007;
  return (
    <AbsoluteFill style={{backgroundColor:'#091017',color:'#e9f0f3',fontFamily:'Arial,sans-serif'}}>
      <ThreeCanvas width={540} height={960} camera={{fov:31,near:0.01,far:20,position:[1.22,0.29,0.78]}}
        style={{width:'100%',height:'100%'}}>
        <ambientLight intensity={1.2}/>
        <directionalLight position={[0.75,1.2,1]} intensity={2.1}/>
        <directionalLight position={[-0.8,-0.4,-0.6]} intensity={1.2} color="#71a5ca"/>
        <group rotation={[0,-0.1,0]}>
          {/* Children of RotorAssembly inherit its ONE X rotation. */}
          <group name="RotorAssembly" rotation={[p.rotorXRotationRad,0,0]}>
            <mesh rotation={[0,0,Math.PI/2]}>
              <cylinderGeometry args={[0.195,0.195,0.034,96]}/>
              <meshStandardMaterial color="#2c3841" metalness={0.55} roughness={0.53}/>
            </mesh>
            {[-0.0174,0.0174].map(x=>(
              <mesh key={x} position={[x,0,0]} rotation={[0,Math.PI/2,0]}>
                <ringGeometry args={[0.132,0.190,96]}/>
                <meshStandardMaterial color={ringColor} metalness={0.32} roughness={0.69}
                  emissive={ringColor} emissiveIntensity={h*0.10} side={2}/>
              </mesh>
            ))}
            {Array.from({length:20},(_,i)=>{
              const a=i*Math.PI/10;
              return <mesh key={i} position={[0.0178,0.158*Math.cos(a),0.158*Math.sin(a)]}
                rotation={[0,Math.PI/2,0]}>
                <circleGeometry args={[0.0042,10]}/>
                <meshBasicMaterial color="#101a22" side={2}/>
              </mesh>;
            })}
            <mesh name="RotorHat" rotation={[0,0,Math.PI/2]}>
              <cylinderGeometry args={[0.061,0.061,0.053,48]}/>
              <meshStandardMaterial color="#68757d" metalness={0.82} roughness={0.39}/>
            </mesh>
            <mesh name="Hub" rotation={[0,0,Math.PI/2]}>
              <cylinderGeometry args={[0.026,0.026,0.069,30]}/>
              <meshStandardMaterial color="#19252d" metalness={0.67} roughness={0.4}/>
            </mesh>
          </group>
          {/* Fixed caliper and two X-axis pad slides; no rotor-caliper parent link. */}
          <group name="CaliperBody" position={[0,0.015,0.149]}>
            {[-0.064,0.064].map(x=>(
              <mesh key={x} position={[x,0,0]}>
                <boxGeometry args={[0.016,0.105,0.102]}/>
                <meshStandardMaterial color="#a4b0b4" metalness={0.68} roughness={0.4}/>
              </mesh>
            ))}
            <mesh position={[0,0.039,0]}>
              <boxGeometry args={[0.145,0.024,0.1]}/>
              <meshStandardMaterial color="#71818a" metalness={0.75} roughness={0.46}/>
            </mesh>
          </group>
          <mesh name="PadInner" position={[-padX,0.015,0.149]}>
            <boxGeometry args={[0.014,0.074,0.092]}/>
            <meshStandardMaterial color="#aba6a0" roughness={0.83}/>
          </mesh>
          <mesh name="PadOuter" position={[padX,0.015,0.149]}>
            <boxGeometry args={[0.014,0.074,0.092]}/>
            <meshStandardMaterial color="#aba6a0" roughness={0.83}/>
          </mesh>
        </group>
      </ThreeCanvas>
      <div style={{position:'absolute',top:'7%',left:'9%',fontSize:24,fontWeight:700,letterSpacing:3}}>
        AGENT B · MOTION PROOF
      </div>
      <div style={{position:'absolute',top:'12%',left:'9%',fontSize:14,color:'#a0b8c7'}}>
        Placeholder brake geometry · rotor axis X
      </div>
      <div style={{position:'absolute',bottom:'9%',left:'9%',fontSize:19,lineHeight:1.75}}>
        <div>ROTOR {s.rotorSpeedRadPerSec.toFixed(1)} rad/s</div>
        <div>CLAMP {(s.brakePressure01*100).toFixed(0)}%</div>
        <div>PAD GAP {(s.padGapMetres*1000).toFixed(2)} mm / face</div>
        <div>HEAT {(s.heat01*100).toFixed(0)}% · illustrative, NOT °C</div>
      </div>
      <div style={{position:'absolute',bottom:'5%',left:'9%',fontSize:12,color:'#839bab'}}>
        Frame {frame}/749 · {s.timeSeconds.toFixed(2)}s · NOT manufacturer CAD
      </div>
    </AbsoluteFill>
  );
};
