import React from 'react';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {interiorLayout} from '../../../../src/yunex/world-kit/interiors.ts';
import type {VehicleDynamicsFrame} from '../shared/contract.ts';

/** 
 * A restrained pair of driver hands mounted at the EXISTING factory steering wheel.
 * Parent must be inside the vehicle-local group. Never adds a second steering wheel.
 * Use only for interior/cutaway shots where the factory controls remain visible.
 */
export const SteadyHands3D: React.FC<{dynamics:VehicleDynamicsFrame; steeringSide?:'left'|'right'}> =
({dynamics,steeringSide='right'}) => {
  const spec = vehicleSpec('grand-tourer');
  const l = interiorLayout(spec);
  const dashX = l.frontBase - .28;
  const steerX = Math.min(dashX-.25,l.frontSeat+.37);
  const steerY = l.floor+.64*l.k;
  const driverZ = (steeringSide === 'left' ? 1 : -1)*spec.width*.235;
  const wheelTurn = -dynamics.driverSteerRad * 10; // matches world-kit animateVehicle cabinSteering
  if (dynamics.stage === 'pre-failure') return null;
  return <group position={[steerX,steerY,driverZ]} rotation={[wheelTurn,0,0]}>
    {([-1,1] as const).map(sign => <group key={sign}>
      <mesh position={[-.115,-.045,sign*.16]} rotation={[0,0,-Math.PI/2]}>
        <capsuleGeometry args={[.029,.20,5,10]}/>
        <meshStandardMaterial color="#283C44" roughness={.82}/>
      </mesh>
      <mesh position={[-.012,0,sign*.162]} rotation={[0,0,Math.PI/2]}>
        <capsuleGeometry args={[.046,.042,5,12]}/>
        <meshStandardMaterial color="#BE9C80" roughness={.90}/>
      </mesh>
      <mesh position={[.011,.013,sign*.145]} rotation={[0,0,Math.PI/2]}>
        <capsuleGeometry args={[.019,.045,4,8]}/>
        <meshStandardMaterial color="#D2AF91" roughness={.94}/>
      </mesh>
    </group>)}
  </group>;
};
