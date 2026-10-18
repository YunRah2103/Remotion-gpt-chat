import React, { useMemo, useEffect } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as T from 'three';
import { PARTS, partSpec } from './catalog.ts';
import type { PartVariant } from './catalog.ts';
import { createPart } from './models.ts';
import { animatePart } from './motion.ts';
import { partCamera } from './cameras.ts';
import { WorldLighting, CameraAim } from '../world-kit/components';
import { disposeObject } from '../world-kit/geometry.ts';
export type PartPreviewProps = {
    variant: PartVariant;
    cutaway: boolean;
    explode: number;
    animate: boolean;
};
export const PartPreview: React.FC<PartPreviewProps> = ({ variant = 'turbo-small', cutaway = false, explode = 0, animate = true }) => {
    const frame = useCurrentFrame(), { width, height, fps } = useVideoConfig(), t = frame / fps, spec = partSpec(variant), model = useMemo(() => createPart({ variant, cutaway }), [variant, cutaway]);
    useEffect(() => () => disposeObject(model), [model]);
    animatePart(model, { shaftAngle: animate ? t * 2.1 : 0, compression: animate ? (1 - Math.cos(t * Math.PI)) * 0.5 : 0, steer: animate ? Math.sin(t) * .45 : 0, deployment: animate ? (1 - Math.cos(t)) * 0.5 : 0, explode, heat: spec.family === 'brake' && animate ? .10 * (1 - Math.cos(t)) : 0 });
    const view = partCamera(model, height > width), c = new T.Vector3(...view.target), p = new T.Vector3(...view.position).sub(c).applyAxisAngle(new T.Vector3(0, 1, 0), animate ? Math.sin(t * .45) * .15 : 0).add(c).toArray() as [
        number,
        number,
        number
    ];
    return <AbsoluteFill style={{ background: '#c4cecc' }}><ThreeCanvas width={width} height={height} shadows camera={{ near: .002, far: 100, fov: view.fov }}>
  <WorldLighting studio/><CameraAim position={p} target={view.target} fov={view.fov}/><primitive object={model}/>
 </ThreeCanvas><div style={{ position: 'absolute', left: '4%', top: '5%', fontFamily: 'Arial', color: '#ecf4ee', background: '#15232bee', padding: '12px 18px', fontSize: width * .017 }}>{spec.label.toUpperCase()}<div style={{ fontSize: width * .010, opacity: .65, marginTop: 5 }}>YUNEX / GENERIC BASELINE {cutaway ? ' / CUTAWAY' : ''}</div></div></AbsoluteFill>;
};
export const FAMILY_HEROES = ['inline-4', 'turbo-twin-scroll', 'brake-vented', 'double-wishbone', 'rear-wing', 'gearbox-dct', 'differential-lsd', 'radiator', 'throttle-body', 'exhaust-header', 'ev-drive', 'injector-rail', 'wheel-sport', 'subframe', 'steering-rack'] as const;
export const PartsFamilyReel: React.FC = () => { const f = useCurrentFrame(), { fps } = useVideoConfig(), i = Math.min(FAMILY_HEROES.length - 1, Math.floor(f / (fps * 2))); return <Sequence key={i} from={i * fps * 2} durationInFrames={fps * 2} premountFor={fps}><PartPreview variant={FAMILY_HEROES[i]} cutaway={['engine', 'gearbox', 'drivetrain', 'electrical'].includes(partSpec(FAMILY_HEROES[i]).family)} explode={.2} animate/></Sequence>; };
export const PartsCatalogue: React.FC = () => { const f = useCurrentFrame(), { fps } = useVideoConfig(), i = Math.min(PARTS.length - 1, Math.floor(f / fps)); return <Sequence key={i} from={i * fps} durationInFrames={fps} premountFor={fps}><PartPreview variant={PARTS[i].id} cutaway={false} explode={0} animate/></Sequence>; };
