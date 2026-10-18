import * as T from 'three';
import { partSpec } from './catalog.ts';
import type { PartOptions, PartFamily } from './catalog.ts';
import { palette, mount } from './helpers.ts';
import type { Palette } from './helpers.ts';
import { engine, turbo, gearbox, drivetrain } from './powertrain.ts';
import { brake, suspension, wheel, chassis, steering } from './chassis.ts';
import { cooling, intake, exhaust, electrical, fuel } from './systems.ts';
import { aero } from './aero.ts';
const builders: Record<PartFamily, (g: T.Group, id: string, m: Palette) => void> = { engine, turbo, gearbox, drivetrain, brake, suspension, wheel, chassis, steering, cooling, intake, exhaust, electrical, fuel, aero };
export function createPart(options: PartOptions): T.Group {
    const spec = partSpec(options.variant);
    if (options.cutaway !== undefined && typeof options.cutaway !== 'boolean')
        throw new Error('cutaway must be boolean');
    for (const key of ['color', 'accent'] as const)
        if (options[key] !== undefined && !/^#[0-9a-f]{6}$/i.test(options[key]!))
            throw new Error(`${key} color must be a six-digit hex value`);
    const g = new T.Group();
    g.name = `YUNEX-part-${spec.id}`;
    g.userData = { variant: spec.id, family: spec.family, units: 'metres', forward: '+X', original: true, accuracy: 'generic illustrative baseline' };
    builders[spec.family](g, spec.id, palette(options.color, options.accent));
    mount(g, 'mount');
    let i = 0;
    g.traverse(o => { if (!o.name)
        o.name = `detail-${i++}`; if (o.userData.motion || o.userData.explode)
        o.userData.rest = { position: o.position.toArray(), rotation: o.rotation.toArray().slice(0, 3), scale: o.scale.toArray() }; if (options.cutaway && o.userData.cover)
        o.visible = false; });
    return g;
}
