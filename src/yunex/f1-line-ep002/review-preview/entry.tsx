import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {F1IntegrationReview} from './Review.tsx';
const Root=()=> <Composition id="F1EP002IntegratedReview"
 component={F1IntegrationReview} width={540} height={960} fps={30} durationInFrames={180}/>;
registerRoot(Root);
