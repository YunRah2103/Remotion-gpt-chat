import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {PorscheTurboEvolutionFilm,PorscheTurboEditComposition} from './PorscheTurboEvolutionFilm';
/** Registered WITHOUT modifying Master-owned src/Root.tsx. Diagnostic only. */
registerRoot(()=><Composition id="PorscheTurboEditDiagnostic"
  component={PorscheTurboEvolutionFilm} {...PorscheTurboEditComposition}
  defaultProps={{mode:'diagnostic' as const,shots:[]}}/>);
