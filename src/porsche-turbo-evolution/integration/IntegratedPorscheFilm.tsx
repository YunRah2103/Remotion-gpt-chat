import React, {useMemo} from 'react';
import {
  PorscheTurboEvolutionFilm,
  type ChapterEffect,
  type PorscheTurboEditProps,
} from '../edit/PorscheTurboEvolutionFilm';
import {BEATS} from '../edit/timeline';
import {CHAPTER_PRESETS, validatePolishBeats} from '../polish/presets';

/**
 * Master A/B/C integration:
 *  - Agent A: authentic source clips supplied privately
 *  - Agent B: clean registered 30-beat production film with strict media guards
 *  - Agent C: verified chapter map and optional subtle transition suggestions
 *  - Agent D: 510-frame composition, audio mux, release QA
 *
 * Source-dependent looks are DISABLED by default until C signs off real scenes.
 * The production footage branch has NOT delivered footage. A diagnostic is not
 * a finished Porsche MP4 and intentionally displays a warning.
 */
export type IntegratedPorscheProps = PorscheTurboEditProps & {
  enableReviewedPolish?: boolean;
};

const CHAPTERS: Readonly<Record<number, ChapterEffect['generation']>> = {
  67: '964',
  136: '993',
  205: '996',
  274: '997',
  343: '991',
  429: '992',
};

const approvedEffects = (): ChapterEffect[] =>
  Object.entries(CHAPTER_PRESETS).flatMap(([frameKey, preset]) => {
    const frame = Number(frameKey);
    const generation = CHAPTERS[frame];
    if (!generation || preset.style === 'cut') return [];
    // Convert C's gentle optical intent to B's tested per-shot FX.
    // Even this mapping remains disabled before footage-dependent QA.
    const style: ChapterEffect['style'] = preset.style === 'match-shift'
      ? preset.direction === 1 ? 'whip-right' : 'whip-left'
      : preset.style === 'soft-luma' ? 'flash' : 'punch';
    return [{
      generation,
      style,
      strength: Math.min(.22, preset.strength * .35),
    }];
  });

export const IntegratedPorscheFilm: React.FC<IntegratedPorscheProps> = ({
  mode,
  shots = [],
  enableReviewedPolish = false,
  chapterEffects,
}) => {
  // Validate the handoff boundaries shared by the real B+C implementations.
  useMemo(() => validatePolishBeats(BEATS), []);
  // Never claim C has approved any real Porsche footage here.
  const effects = enableReviewedPolish
    ? chapterEffects ?? approvedEffects()
    : [];
  return <PorscheTurboEvolutionFilm mode={mode} shots={shots} chapterEffects={effects} />;
};
