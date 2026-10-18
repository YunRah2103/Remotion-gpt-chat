import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import '../../scripts/world-kit/node-filereader.mjs';
import { createPart } from '../../src/yunex/parts-kit/models.ts';
import { animatePart, partMount } from '../../src/yunex/parts-kit/motion.ts';
import { disposeObject } from '../../src/yunex/world-kit/geometry.ts';
test('GLB names may be sanitised but mounting and moving connections remain usable', async () => { for (const variant of ['inline-4', 'strut', 'steering-rack']) {
    const a = createPart({ variant }), binary = await new GLTFExporter().parseAsync(a, { binary: true, onlyVisible: false }), b = (await new GLTFLoader().parseAsync(binary, '')).scene;
    for (const g of [a, b])
        animatePart(g, { shaftAngle: .7, compression: .8, steer: .4 });
    for (const name of variant === 'strut' ? ['mount', 'hub'] : variant === 'steering-rack' ? ['mount', 'left'] : ['mount', 'output'])
        assert.deepEqual(partMount(b, name), partMount(a, name));
    disposeObject(a);
    disposeObject(b);
} });
