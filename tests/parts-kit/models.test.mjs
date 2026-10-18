import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { PARTS, partSpec } from '../../src/yunex/parts-kit/catalog.ts';
import { createPart } from '../../src/yunex/parts-kit/models.ts';
import { disposeObject } from '../../src/yunex/world-kit/geometry.ts';
test('55 original part variants cover 15 mechanical families', () => { assert.equal(PARTS.length, 55); assert.equal(new Set(PARTS.map(p => p.id)).size, 55); assert.equal(new Set(PARTS.map(p => p.family)).size, 15); });
test('every assembly has finite metre geometry, named mounts and bounded complexity', () => { for (const s of PARTS) {
    const g = createPart({ variant: s.id });
    g.updateMatrixWorld(true);
    assert.equal(g.userData.variant, s.id);
    assert.ok(g.getObjectByName('mount:mount'), s.id);
    for (const n of s.mounts)
        assert.ok(g.getObjectByName(`mount:${n}`), `${s.id}/${n}`);
    let meshes = 0, vertices = 0;
    g.traverse(o => { if (!o.isMesh)
        return; meshes++; assert.ok(o.name, `${s.id}: unnamed mesh`); const a = o.geometry.attributes.position; vertices += a.count; for (const n of a.array)
        assert.ok(Number.isFinite(n), s.id); });
    const size = new T.Box3().setFromObject(g, true).getSize(new T.Vector3());
    assert.ok(meshes >= 2 && meshes < 700, `${s.id} mesh count ${meshes}`);
    assert.ok(vertices < 160000, `${s.id} vertex budget ${vertices}`);
    assert.ok(Math.max(...size.toArray()) < 4.5 && Math.min(...size.toArray()) > .01, `${s.id} bounds ${size.toArray()}`);
    disposeObject(g);
} });
test('variants change geometry rather than only paint', () => { const signatures = new Map(); for (const s of PARTS) {
    const g = createPart({ variant: s.id, color: '#75838c' });
    let vertices = 0, meshes = 0;
    g.traverse(o => { if (o.isMesh) {
        vertices += o.geometry.attributes.position.count;
        meshes++;
    } });
    const b = new T.Box3().setFromObject(g, true).getSize(new T.Vector3()).toArray().map(v => v.toFixed(3));
    const sig = JSON.stringify([meshes, vertices, b]);
    const used = signatures.get(s.family) ?? new Set();
    assert.ok(!used.has(sig), `${s.family}/${s.id}: duplicate geometry`);
    used.add(sig);
    signatures.set(s.family, used);
    disposeObject(g);
} });
test('invalid catalogue and appearance options fail explicitly', () => { assert.throws(() => partSpec('unknown'), /Unknown/); assert.throws(() => createPart({ variant: 'unknown' }), /Unknown/); assert.throws(() => createPart({ variant: 'inline-4', color: 'not-a-colour' }), /color/); });
test('wheel sidewalls cover the width of their rim lips', () => { for (const variant of ['wheel-road', 'wheel-sport', 'wheel-offroad']) {
    const g = createPart({ variant });
    g.updateMatrixWorld(true);
    const tyre = new T.Box3().setFromObject(g.getObjectByName('tyre'), true);
    g.traverse(o => { if (o.name === 'rim-lip') {
        const b = new T.Box3().setFromObject(o, true);
        assert.ok(b.min.z >= tyre.min.z - .015 && b.max.z <= tyre.max.z + .015, variant);
    } });
    disposeObject(g);
} });
test('automatic transmission exposes a planetary stage while DCT has a second input sleeve', () => { const a = createPart({ variant: 'gearbox-auto', cutaway: true }), b = createPart({ variant: 'gearbox-dct', cutaway: true }); assert.ok(a.getObjectByName('planetary-carrier')); assert.ok(a.getObjectByName('annulus')); assert.ok(b.getObjectByName('secondary-input')); disposeObject(a); disposeObject(b); });
test('turbo volute outer radial surface normals face outwards', () => { const g = createPart({ variant: 'turbo-small' }), scroll = g.getObjectByName('compressor-housing').getObjectByName('scroll-housing'); assert.ok(scroll.geometry.attributes.normal.getX(0) > .5); disposeObject(g); });
