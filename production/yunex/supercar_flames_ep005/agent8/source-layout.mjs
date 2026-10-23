import path from 'node:path';

/**
 * GitHub Actions archives can contain nested files such as native/front-pursuit.mp4.
 * media.path is an exact file path; artifactExtractDir is where the entire ZIP is unpacked.
 * Keep all extract targets under the editor's isolated staging root.
 */
export function resolveArtifactDestination(repoRoot, media) {
  const prefix = 'out/ep005-agent8-sources/';
  const target = media?.path;
  const extractDir = media?.artifactExtractDir ?? (typeof target === 'string' ? path.dirname(target) : null);
  function safe(p) {
    return typeof p === 'string' && p.startsWith(prefix) &&
      !path.isAbsolute(p) && !p.includes('\\') && !p.includes('\\0') &&
      !p.split('/').some(x => x === '..' || x === '.' || x === '');
  }
  if (!safe(target) || !safe(extractDir)) {
    throw new Error('Media and archive extraction must stay in '+prefix);
  }
  const absolute = path.resolve(repoRoot, target);
  const extraction = path.resolve(repoRoot, extractDir);
  if (!absolute.startsWith(extraction + path.sep)) {
    throw new Error('Media path is not nested under its archive extraction root: '+target);
  }
  return {absolute, extraction};
}
