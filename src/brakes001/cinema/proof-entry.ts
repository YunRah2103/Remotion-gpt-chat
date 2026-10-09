import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {CinemaProof} from './CinemaProof';
const ProofRoot=()=>React.createElement(Composition,{
 id:'Brakes001CinemaProof',component:CinemaProof,
 durationInFrames:750,fps:30,width:1080,height:1920
});
registerRoot(ProofRoot);
