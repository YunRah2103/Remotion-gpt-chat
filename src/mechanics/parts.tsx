/**
 * Reusable ORIGINAL illustrative 3D car-mechanism components for educational films.
 * Geometry is schematic, not manufacturer CAD. Local +Z points toward the viewer.
 * Materials and proportions may be adjusted for a specific lesson.
 */
import React, {useMemo} from 'react';
import * as THREE from 'three';

type PartProps = {scale?: number};

export const BrakeDisc: React.FC<PartProps> = ({scale = 1}) => (
  <group scale={scale}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.68, 0.68, 0.075, 72]}/>
      <meshStandardMaterial color="#86929b" metalness={0.86} roughness={0.34}/>
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.056]}>
      <cylinderGeometry args={[0.19, 0.19, 0.12, 48]}/>
      <meshStandardMaterial color="#39434b" metalness={0.7} roughness={0.42}/>
    </mesh>
    {Array.from({length: 12}, (_, i) => {
      const a = (i * Math.PI * 2) / 12;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.51, Math.sin(a) * 0.51, 0.044]}>
          <sphereGeometry args={[0.033, 10, 8]}/>
          <meshStandardMaterial color="#4c5d68" metalness={0.65} roughness={0.45}/>
        </mesh>
      );
    })}
  </group>
);

export const BrakeCaliper: React.FC<PartProps> = ({scale = 1}) => (
  <group scale={scale} position={[0.52, 0.14, 0]}>
    <mesh>
      <boxGeometry args={[0.32, 0.41, 0.27]}/>
      <meshStandardMaterial color="#c76531" metalness={0.62} roughness={0.32}/>
    </mesh>
    {[-0.16, 0.16].map((z) => (
      <mesh key={z} position={[-0.13, 0, z]}>
        <boxGeometry args={[0.09, 0.3, 0.044]}/>
        <meshStandardMaterial color="#2b3035" roughness={0.78}/>
      </mesh>
    ))}
  </group>
);

export const WheelSpeedSensor: React.FC<PartProps> = ({scale = 1}) => (
  <group scale={scale} position={[0.45, -0.37, 0.12]}>
    <mesh rotation={[0, 0, Math.PI / 4]}>
      <cylinderGeometry args={[0.065, 0.065, 0.31, 20]}/>
      <meshStandardMaterial color="#1a2025" roughness={0.59}/>
    </mesh>
    <mesh position={[0.11, -0.1, 0]}>
      <boxGeometry args={[0.12, 0.065, 0.1]}/>
      <meshStandardMaterial color="#d1ab38" metalness={0.5} roughness={0.41}/>
    </mesh>
  </group>
);

export const WheelAssembly: React.FC<PartProps> = ({scale = 1}) => (
  <group scale={scale}>
    <mesh>
      <torusGeometry args={[0.87, 0.22, 16, 72]}/>
      <meshStandardMaterial color="#171b1e" metalness={0.02} roughness={0.96}/>
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.14]}>
      <cylinderGeometry args={[0.61, 0.61, 0.09, 60]}/>
      <meshStandardMaterial color="#333d48" metalness={0.87} roughness={0.34}/>
    </mesh>
    <BrakeDisc scale={0.82}/>
    <BrakeCaliper/>
    <WheelSpeedSensor/>
  </group>
);

export const CoilSpring: React.FC<PartProps & {turns?: number}> = ({scale = 1, turns = 6}) => {
  const geometry = useMemo(() => {
    const samples = 170;
    const points = Array.from({length: samples + 1}, (_, i) => {
      const u = i / samples;
      const a = u * Math.PI * 2 * turns;
      return new THREE.Vector3(Math.cos(a) * 0.4, (u - 0.5) * 1.9, Math.sin(a) * 0.4);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 250, 0.065, 9, false);
  }, [turns]);
  return (
    <mesh scale={scale} geometry={geometry}>
      <meshStandardMaterial color="#626d79" metalness={0.74} roughness={0.39}/>
    </mesh>
  );
};

export const MechanicalGear: React.FC<PartProps & {teeth?: number}> = ({scale = 1, teeth = 16}) => (
  <group scale={scale}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.46, 0.46, 0.18, Math.max(teeth * 2, 24)]}/>
      <meshStandardMaterial color="#657887" metalness={0.84} roughness={0.31}/>
    </mesh>
    {Array.from({length: teeth}, (_, i) => {
      const a = 2 * Math.PI * i / teeth;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.51, Math.sin(a) * 0.51, 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[0.16, 0.14, 0.2]}/>
          <meshStandardMaterial color="#657887" metalness={0.84} roughness={0.31}/>
        </mesh>
      );
    })}
  </group>
);

export const HydraulicValve: React.FC<PartProps> = ({scale = 1}) => (
  <group scale={scale}>
    <mesh>
      <cylinderGeometry args={[0.19, 0.19, 0.83, 28]}/>
      <meshStandardMaterial color="#6b7883" metalness={0.78} roughness={0.34}/>
    </mesh>
    <mesh position={[0, 0.51, 0]}>
      <cylinderGeometry args={[0.13, 0.13, 0.24, 24]}/>
      <meshStandardMaterial color="#bd823f" metalness={0.62} roughness={0.37}/>
    </mesh>
    <mesh position={[0, -0.46, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.12, 0.12, 0.56, 24]}/>
      <meshStandardMaterial color="#39454c" metalness={0.56} roughness={0.4}/>
    </mesh>
  </group>
);
