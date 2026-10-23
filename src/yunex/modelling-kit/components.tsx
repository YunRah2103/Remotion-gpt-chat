import React,{useMemo,useEffect} from 'react';
import {createCinematicVehicle,animateCinematicVehicle} from './rig.ts';
import type {CinematicOptions,CinematicState} from './rig.ts';
import {disposeObject} from '../world-kit/geometry.ts';
/** Options build the mesh; state updates it without remounting or accumulating motion. */
export const CinematicVehicle:React.FC<{options:CinematicOptions;state:CinematicState}>=({options,state})=>{
 const key=JSON.stringify(options);
 const model=useMemo(()=>createCinematicVehicle(options),[key]);
 useEffect(()=>()=>disposeObject(model),[model]);animateCinematicVehicle(model,state);
 return <primitive object={model}/>;
};
