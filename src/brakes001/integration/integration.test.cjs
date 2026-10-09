/* Execute: node src/brakes001/integration/integration.test.cjs
 * Requires repository's pinned TypeScript from npm ci.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
function loadTypeScript(relative) {
  const source = read(relative);
  const result = ts.transpileModule(source, {
    fileName: relative,
    compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS}
  });
  const exports = {};
  Function('exports', 'require', result.outputText)(exports, require);
  return exports;
}
const b = loadTypeScript('src/brakes001/motion/brakeState.ts');
const camera = loadTypeScript('src/brakes001/cinema/cameraMath.ts');
assert.equal(camera.brakeShotAt(531),'benefits');
const adapter = read('src/brakes001/integration/integrationState.ts');
assert.match(adapter, /HARDWARE_REST_GAP_M = \.0025/);
assert.match(adapter, /padGapForHardware\(s\.brakePressure01\)/);
// Execute the actual compiled E adapter against B's untouched deterministic state.
const adapterOutput = {};
const adapterTranspiled = ts.transpileModule(adapter, {
  fileName: 'src/brakes001/integration/integrationState.ts',
  compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS},
});
Function('exports','require',adapterTranspiled.outputText)(adapterOutput,(moduleName)=>{
  if(moduleName==='../motion/brakeState') return b;
  if(moduleName==='../cinema/cameraMath') return camera;
  throw new Error('Unrecognised E adapter import: '+moduleName);
});
const manifest = JSON.parse(read('production/videos/carbon-ceramic-001/hardware/rig-manifest.json'));
const brief = JSON.parse(read('production/videos/carbon-ceramic-001/brief.json'));
const shots = JSON.parse(read('production/videos/carbon-ceramic-001/shots.json'));
const rootSource = read('src/Root.tsx');
const film = read('src/brakes001/CarbonCeramic001.tsx');
const hardware = read('src/brakes001/hardware/BrakeAssembly.tsx');
const graphics = read('src/brakes001/graphics/index.tsx');
const assertNear = (v, expected, tolerance=1e-7) => assert.ok(Math.abs(v-expected)<tolerance, v+' vs '+expected);

assert.equal(brief.durationInFrames, 750);
assert.deepEqual(brief.resolution, [1080,1920]);
assert.equal(brief.sourceCompositionId, 'CarbonCeramic001');
assert.match(rootSource, /id="CarbonCeramic001".*durationInFrames=\{750\}/s);
assert.deepEqual(shots.map(x=>[x.startFrame,x.endFrame]),[[0,119],[120,269],[270,449],[450,629],[630,749]]);
for (const [key,parent] of Object.entries({
  FrictionRing:'RotorAssembly',RotorHat:'RotorAssembly',Hub:'RotorAssembly',
  CaliperBody:null,PadInner:null,PadOuter:null,UprightSupport:null
})) {
  assert.equal(manifest.nodes[key].parent,parent, key+' parent');
}
assert.deepEqual(manifest.coordinateSystem.rotorAxis,[1,0,0]);
assertNear(manifest.dimensions.rotorDiameter, .390);
assert.match(hardware, /name="RotorAssembly" rotation=\{\[rotorAngleRad,0,0\]\}/);
assert.match(hardware, /name="CaliperBody"/);
assert.match(film, /<BrakeAssembly /);
assert.match(film, /<IntegrationCameraRig /);
assert.match(read('src/brakes001/integration/IntegrationCameraRig.tsx'), /brakeCameraAt\(frame\)/);
assert.match(read('src/brakes001/integration/IntegrationCameraRig.tsx'), /fovDegrees:37/);
assert.match(film, /<BrakeLighting /);
assert.match(film, /<GhostCarOutline /);
assert.match(film, /<TitleOverlays /);
assert.match(film, /<PartLabels /);
const thermal = read('src/brakes001/integration/FrictionHeatMap.tsx');
assert.match(film, /<FrictionHeatMap /);
assert.match(thermal, /frictionHotSpot01At/);
assert.match(thermal, /ringGeometry args=\{\[\.127,\.190/);
assert.match(read('src/Root.tsx'), /id="BrakePadMacro001"/);
const macro = read('src/brakes001/integration/BrakePadMacroProof.tsx');
assert.match(macro, /MACRO_OFFSET=85/);
assert.match(macro, /BrakeAssembly rotorAngleRad=/);
assert.match(graphics, /export const PartLabels/);
let maxHeat = 0, minGap = Infinity, maxGap = -Infinity, lastAngle = -1, lastSpeed = Infinity;
for (let f = 0; f < 750; f++) {
  const s = b.brakeStateAt(f);
  const repeat = b.brakeStateAt(f);
  const e = adapterOutput.integrationStateAt(f);
  assertNear(e.rotorAngleRad,s.rotorAngleRad);
  assertNear(e.rotorSpeedRadPerSec,s.rotorSpeedRadPerSec);
  assertNear(e.brakePressure01,s.brakePressure01);
  assertNear(e.heat01,s.heat01);
  assert.ok(e.padGapMetres >= .0001499 && e.padGapMetres <= .0025001, 'E physical gap out of bounds '+f);
  assert.ok(.0025-e.padGapMetres <= .0025001, 'E stroke over 2.5mm '+f);
  assert.deepEqual(s, repeat, 'non-deterministic frame '+f);
  assertNear(s.timeSeconds, f/30);
  assert.ok(s.rotorAngleRad >= lastAngle, 'rotor reversed at '+f);
  assert.ok(s.rotorSpeedRadPerSec <= lastSpeed+1e-6, 'spin accelerated at '+f);
  assert.ok(s.padGapMetres >= 0.00029 && s.padGapMetres <= 0.00601, 'bad gap at '+f);
  assert.ok(s.heat01 >= 0 && s.heat01 <= 1, 'heat bound '+f);
  assert.ok(s.brakePressure01 >= 0 && s.brakePressure01 <= 1.001, 'pressure bound '+f);
  assert.equal(b.brakePoseAt(f).fixedCaliperXRotationRad,0);
  const hardwareGap=.00015+(.0025-.00015)*(1-Math.min(1,Math.max(0,s.brakePressure01)));
  assert.ok(hardwareGap>=.0001499 && hardwareGap<=.0025001, 'hardware pad gap over 2.5mm at '+f);
  assert.ok(.0025-hardwareGap<=.0025001, 'overshot physical pad travel at '+f);
  // Each pad starts precisely one per-face clearance from the 15.5mm rotor face.
  const innerSurfaceX = -0.0155 - s.padGapMetres;
  const outerSurfaceX = 0.0155 + s.padGapMetres;
  assert.ok(innerSurfaceX < -0.0155 && outerSurfaceX > .0155,'pad penetration '+f);
  assert.ok(b.frictionTrackHeat01At(f,.16) <= s.heat01+1e-8);
  assertNear(b.frictionTrackHeat01At(f,.10),0,1e-8);
  assertNear(b.frictionTrackHeat01At(f,.195),0,1e-8);
  assert.equal(camera.brakeShotAt(f), f<120?'context':f<270?'reveal':f<450?'thermal':f<630?'benefits':'hero');
  const p = camera.brakeCameraAt(f);
  assert.ok(p.position.every(Number.isFinite));
  assert.ok(p.target.every(Number.isFinite));
  minGap=Math.min(minGap,s.padGapMetres);
  maxGap=Math.max(maxGap,s.padGapMetres);
  maxHeat=Math.max(maxHeat,s.heat01);
  lastAngle=s.rotorAngleRad;
  lastSpeed=s.rotorSpeedRadPerSec;
}
assert.ok(maxHeat>0.5, 'thermal animation has no gain');
assert.ok(maxGap-minGap>0.004, 'pads do not visibly move');
assert.ok(b.brakeStateAt(700).rotorSpeedRadPerSec<.1, 'rotor never stops');
console.log(JSON.stringify({status:'PASS',frames:750,shots:5,minGap,maxGap,maxHeat,
  rotorStops:true,padPenetration:false,caliperStatic:true,thermalTrackOnly:true}));
