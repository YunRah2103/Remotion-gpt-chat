import React from 'react';
import {Composition} from 'remotion';
import {AirflowPreview} from './AirflowPreview';
export const AirflowPreviewRoot:React.FC=()=> <Composition id="A3AirflowReview" component={AirflowPreview} width={1080} height={1920} fps={30} durationInFrames={330}/>;
