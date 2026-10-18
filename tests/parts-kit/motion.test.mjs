import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { PARTS } from '../../src/yunex/parts-kit/catalog.ts';
import { createPart } from '../../src/yunex/parts-kit/models.ts';
import { animatePart, partMount } from '../../src/yunex/parts-kit/motion.ts';
import { partCamera } from '../../src/yunex/parts-kit/cameras.ts';
import { disposeObject } from '../../src/yunex/world-kit/geometry.ts';
const snapshot = g => { const a = []; g.traverse(o => a.push([...o.position.toArray(), ...o.quaternion.toArray(), ...o.scale.toArray()])); return JSON.stringify(a); };
test('all part animation is repeatable, reversible and returns exactly to rest', () => { for (const s of PARTS) {
    const g = createPart({ variant: s.id });
    animatePart(g, {});
    const rest = snapshot(g);
    animatePart(g, { shaftAngle: 2.7, compression: .8, steer: .3, deployment: .7, explode: .8, heat: .5 });
    const posed = snapshot(g);
    animatePart(g, { shaftAngle: -5, compression: .2, steer: -.3 });
    animatePart(g, { shaftAngle: 2.7, compression: .8, steer: .3, deployment: .7, explode: .8, heat: .5 });
    assert.equal(snapshot(g), posed, s.id);
    animatePart(g, {});
    assert.equal(snapshot(g), rest, s.id);
    disposeObject(g);
} });
test('pistons move and turbo wheels share a real common shaft axis', () => { const e = createPart({ variant: 'inline-4', cutaway: true }), t = createPart({ variant: 'turbo-small', cutaway: true }); const p = e.getObjectByName('piston-0'); animatePart(e, { shaftAngle: 0 }); const y = p.position.y; animatePart(e, { shaftAngle: Math.PI }); assert.ok(Math.abs(y - p.position.y) > .06); const r = t.getObjectByName('rotating-shaft'); animatePart(t, { shaftAngle: 1.2 }); assert.equal(r.rotation.z, 1.2); assert.equal(r.position.x, 0); assert.equal(r.position.y, 0); disposeObject(e); disposeObject(t); });
test('compression and deployment clamp while primary mounting datum stays fixed', () => { const g = createPart({ variant: 'strut' }); animatePart(g, { compression: 1, explode: 1 }); const one = snapshot(g), mount = partMount(g, 'mount'); animatePart(g, { compression: 99, explode: 1 }); assert.equal(snapshot(g), one); assert.deepEqual(mount.position, [0, 0, 0]); animatePart(g, { compression: -99 }); const zero = snapshot(g); animatePart(g, {}); assert.equal(snapshot(g), zero); disposeObject(g); });
test('nonfinite or nonnumeric state is rejected before any transforms mutate', () => { const g = createPart({ variant: 'v8' }), before = snapshot(g); for (const key of ['shaftAngle', 'compression', 'steer', 'deployment', 'explode', 'heat'])
    for (const value of [NaN, Infinity, '1']) {
        assert.throws(() => animatePart(g, { [key]: value }), /finite/);
        assert.equal(snapshot(g), before);
    } assert.throws(() => partMount(g, 'missing'), /Unknown/); disposeObject(g); });
test('world-space mounts follow placement and camera fits every exploded portrait assembly', () => { for (const s of PARTS) {
    const g = createPart({ variant: s.id });
    g.position.set(2, 3, 4);
    g.rotation.y = .6;
    animatePart(g, { explode: 1 });
    assert.deepEqual(partMount(g, 'mount').position, [2, 3, 4]);
    for (const portrait of [false, true]) {
        const v = partCamera(g, portrait), camera = new T.PerspectiveCamera(v.fov, portrait ? 9 / 16 : 16 / 9, .001, 100);
        camera.position.set(...v.position);
        camera.lookAt(new T.Vector3(...v.target));
        camera.updateMatrixWorld(true);
        const b = new T.Box3().setFromObject(g, true);
        for (const x of [b.min.x, b.max.x])
            for (const y of [b.min.y, b.max.y])
                for (const z of [b.min.z, b.max.z]) {
                    const p = new T.Vector3(x, y, z).project(camera);
                    assert.ok(Math.abs(p.x) < .98 && Math.abs(p.y) < .98, `${s.id}: framing`);
                }
    }
    disposeObject(g);
} });
test('suspension and steering connection points follow their moving attachment', () => { const a = createPart({ variant: 'double-wishbone' }), b = createPart({ variant: 'steering-rack' }); const hub0 = partMount(a, 'hub').position, left0 = partMount(b, 'left').position; animatePart(a, { compression: 1 }); animatePart(b, { steer: .5 }); assert.ok(Math.abs(partMount(a, 'hub').position[1] - hub0[1] - .12) < 1e-8); assert.ok(Math.abs(partMount(b, 'left').position[2] - left0[2] - .0275) < 1e-8); disposeObject(a); disposeObject(b); });
test('fractional shaft ratios remain continuous across an input revolution', () => { for (const [variant, name] of [['gearbox-auto', 'planetary-carrier'], ['gearbox-manual', 'countershaft'], ['alternator', 'alternator-pulley']]) {
    const g = createPart({ variant }), n = g.getObjectByName(name);
    animatePart(g, { shaftAngle: Math.PI * 2 - .000001 });
    const q = n.quaternion.clone();
    animatePart(g, { shaftAngle: Math.PI * 2 + .000001 });
    assert.ok(q.angleTo(n.quaternion) < .00002, variant);
    disposeObject(g);
} });
test('leaf spring eye attachment stays fixed while its centre compresses', () => { const g = createPart({ variant: 'leaf-spring' }), leaf = g.getObjectByName('leaf-stack'); const endpoint = () => { g.updateMatrixWorld(true); const a = leaf.geometry.attributes.position, p = new T.Vector3(); for (let i = 0; i < 8; i++)
    p.add(new T.Vector3().fromBufferAttribute(a, i).applyMatrix4(leaf.matrixWorld)); return p.multiplyScalar(1 / 8); }; animatePart(g, {}); const p = endpoint(); animatePart(g, { compression: 1 }); assert.ok(endpoint().distanceTo(p) < .00001); animatePart(g, {}); assert.ok(endpoint().distanceTo(p) < .00001); disposeObject(g); });
test('multi-link outer rod ends stay attached through compression', () => { const g = createPart({ variant: 'multi-link' }); let count = 0; g.traverse(o => { if (o.userData.motion?.kind === 'link')
    count++; }); assert.ok(count >= 3); for (const compression of [0, .5, 1]) {
    animatePart(g, { compression });
    const hub = g.getObjectByName('hub-carrier');
    g.traverse(o => { const m = o.userData.motion; if (m?.kind !== 'link' || !o.name.includes('link'))
        return; const actual = new T.Vector3(0, m.originalLength / 2, 0).applyMatrix4(o.matrixWorld), end = new T.Vector3(...m.end); end.y += .12 * compression; end.z += hub.position.z - .36; assert.ok(actual.distanceTo(end) < .00001, o.name); assert.ok(Math.abs(actual.x) < .04); });
} disposeObject(g); });
test('optional undefined state behaves as omitted and malformed cutaway is rejected', () => { const g = createPart({ variant: 'inline-4' }); assert.doesNotThrow(() => animatePart(g, { shaftAngle: undefined, explode: undefined })); assert.throws(() => createPart({ variant: 'inline-4', cutaway: 'false' }), /cutaway/); disposeObject(g); });
