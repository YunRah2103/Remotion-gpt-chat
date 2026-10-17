/**
 * Agent 2 static mechanical interface. Right-handed metres; +Y up, turbo shaft +X.
 * PORTS are mechanical attachment centres, not gas-flow visual effects.
 */
export const TURBO_PORTS = {
  EXHAUST_IN: [-1.10, 0.78, 0.43],
  EXHAUST_OUT: [-2.22, 0, 0],
  CLEAN_AIR_IN: [2.22, 0, 0],
  COMPRESSED_AIR_OUT: [1.12, 0.82, 0.43],
  INTERCOOLER_IN: [3.08, 0.12, -1.45],
  INTERCOOLER_OUT: [3.08, -1.13, -1.45],
  ENGINE_INTAKE: [0.77, -1.26, -3.15],
  FUEL_IN: [-0.63, -0.80, -3.15],
} as const satisfies Record<string, readonly [number,number,number]>;
export type TurboPort = keyof typeof TURBO_PORTS;
export const TURBO_PIVOTS = {
  TURBINE_ROTOR: [-1.13,0,0],
  COMPRESSOR_ROTOR: [1.13,0,0],
  SHAFT: [0,0,0],
} as const satisfies Record<string, readonly [number,number,number]>;
export const TURBO_PALETTE = {
 graphite:'#4B606D',steel:'#C5D0D1',dark:'#172632',
 exhaust:'#FF8A36',compressor:'#53CFFF',cooled:'#8CEBE3',environment:'#08121D',
} as const;
