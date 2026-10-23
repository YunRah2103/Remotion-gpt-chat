import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
import '../world-kit/node-filereader.mjs';
import { PARTS } from '../../src/yunex/parts-kit/catalog.ts';
import { createPart } from '../../src/yunex/parts-kit/models.ts';
import { animatePart, partMount } from '../../src/yunex/parts-kit/motion.ts';
import { disposeObject } from '../../src/yunex/world-kit/geometry.ts';
const dir = 'out/parts-kit/glb';
await mkdir(dir, { recursive: true });
const exporter = new GLTFExporter(), loader = new GLTFLoader(), catalog = [];
for (const spec of PARTS) {
    const original = createPart({ variant: spec.id });
    animatePart(original, {});
    const binary = await exporter.parseAsync(original, { binary: true, onlyVisible: false }), bytes = Buffer.from(binary);
    await writeFile(`${dir}/${spec.id}.glb`, bytes);
    const loaded = (await loader.parseAsync(binary, '')).scene;
    let originals = 0, loads = 0;
    original.traverse(o => { if (o.userData.motion)
        originals++; });
    loaded.traverse(o => { if (o.userData.motion)
        loads++; });
    assert.equal(loads, originals, `${spec.id}: animation nodes`);
    for (const name of ['mount', ...spec.mounts])
        assert.deepEqual(partMount(loaded, name), partMount(original, name));
    for (const scene of [original, loaded])
        animatePart(scene, { shaftAngle: 1.1, compression: .5, steer: .2, deployment: .3, explode: .5, heat: .3 });
    const a = new Box3().setFromObject(original, true), b = new Box3().setFromObject(loaded, true);
    assert.ok(a.min.distanceTo(b.min) < .00001 && a.max.distanceTo(b.max) < .00001, `${spec.id}: loaded animation bounds differ`);
    assert.ok(b.getSize(new Vector3()).toArray().every(Number.isFinite));
    catalog.push({ ...spec, file: `${spec.id}.glb`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), motionNodes: loads });
    disposeObject(original);
    disposeObject(loaded);
    console.log('EXPORT + ROUNDTRIP', spec.id, bytes.length);
}
await writeFile(`${dir}/catalog.json`, JSON.stringify({ units: 'metres', forward: '+X', variants: catalog.length, accuracy: 'Original generic illustrative baseline; not manufacturer CAD', models: catalog }, null, 2));
