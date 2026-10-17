/** Candidate map observed from A2 source, NOT approved final mechanical integration.
 * World metre positions assume A2 and A3 share the same untransformed group.
 * Requires visual review of inlet-to-rotor and rotor-to-outlet throat paths.
 */
import candidate from '../../../../production/yunex/turbo_3d_001/agents/airflow/a2-candidate-routes.json';
import type {PortMap,FlowRoutes,FlowPortName,Vec3} from './TurboFlow';
const p=candidate.ports;
export const A2_CANDIDATE_SOURCE_SHA=candidate.sourceCommit;
export const A2_CANDIDATE_PORTS:PortMap={
 EXHAUST_IN:p.EXHAUST_IN as unknown as Vec3, EXHAUST_OUT:p.EXHAUST_OUT as unknown as Vec3,
 CLEAN_AIR_IN:p.CLEAN_AIR_IN as unknown as Vec3, COMPRESSED_AIR_OUT:p.COMPRESSED_AIR_OUT as unknown as Vec3,
 INTERCOOLER_IN:p.INTERCOOLER_IN as unknown as Vec3, INTERCOOLER_OUT:p.INTERCOOLER_OUT as unknown as Vec3,
 ENGINE_INTAKE:p.ENGINE_INTAKE as unknown as Vec3, FUEL_IN:p.FUEL_IN as unknown as Vec3,
 ENGINE_EXHAUST:p.ENGINE_EXHAUST as unknown as Vec3,
 TURBINE_WHEEL_FLOW:p.TURBINE_WHEEL_FLOW as unknown as Vec3,
 COMPRESSOR_WHEEL_FLOW:p.COMPRESSOR_WHEEL_FLOW as unknown as Vec3,
 CYLINDER:p.CYLINDER as unknown as Vec3,
};
export const A2_CANDIDATE_ROUTES:FlowRoutes=candidate.routes as unknown as FlowRoutes;
export const candidateMatchesExpectedPorts=(actual:Record<FlowPortName,Vec3>,tolerance=.001)=>{
 const names=Object.keys(candidate.ports).filter(x=>x in actual) as FlowPortName[];
 return names.length===8&&names.every(name=>
  actual[name].every((v,i)=>Math.abs(v-A2_CANDIDATE_PORTS[name][i])<=tolerance)
 );
};
