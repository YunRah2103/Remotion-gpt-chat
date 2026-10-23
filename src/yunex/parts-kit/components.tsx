import React, { useMemo, useEffect } from 'react';
import { createPart } from './models.ts';
import type { PartOptions } from './catalog.ts';
import { animatePart } from './motion.ts';
import type { PartState } from './motion.ts';
import { disposeObject } from '../world-kit/geometry.ts';
export const AutomotivePart: React.FC<PartOptions & {
    state?: PartState;
    position?: [
        number,
        number,
        number
    ];
    rotation?: [
        number,
        number,
        number
    ];
    scale?: number;
}> = ({ variant, color, accent, cutaway = false, state = {}, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
    const model = useMemo(() => createPart({ variant, color, accent, cutaway }), [variant, color, accent, cutaway]);
    useEffect(() => () => disposeObject(model), [model]);
    animatePart(model, state);
    return <group position={position} rotation={rotation} scale={scale}><primitive object={model}/></group>;
};
