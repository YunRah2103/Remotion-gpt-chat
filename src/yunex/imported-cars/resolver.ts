/**
 * The 12 individually attributed YUNEX imports and the 96 unverified mirror
 * candidates are intentionally separate rights classes. This resolver makes
 * discovery and scene loading consistent without silently upgrading rights.
 */
import verifiedCatalogue from '../../../production/assets/imported-cars/catalog.json';
import externalCatalogue from '../../../production/asset-library/external-car-catalogue.json';
import {requirePrivateReview} from './permissions.ts';

export type ImportedAssetDetails = {
  id:string;
  name:string;
  kind:string;
  source:'attributed'|'external-candidate';
  readiness:'attribution-required'|'review-only'|'unverified';
  privateReviewOnly:boolean;
  creator:string;
  licence:string;
  attribution:string;
  staticPath:string;
  gitBlobSha1:string;
  sizeBytes:number;
};

const attributed:ImportedAssetDetails[]=verifiedCatalogue.vehicles.map(item=>({
  id:item.id,name:item.name,kind:item.kind,source:'attributed',
  readiness:item.readiness as 'attribution-required'|'review-only',
  privateReviewOnly:item.readiness!=='attribution-required',
  creator:item.creator,licence:item.license,attribution:item.attribution,
  staticPath:'yunex/imported-cars/'+item.fileName,
  gitBlobSha1:item.source.gitBlobSha1,sizeBytes:item.source.sizeBytes,
}));
const candidates:ImportedAssetDetails[]=externalCatalogue.assets.map(item=>({
  id:'external:'+item.id,name:item.name,kind:item.category,
  source:'external-candidate',readiness:'unverified',privateReviewOnly:true,
  creator:'Not independently verified',licence:'Unverified',
  attribution:'Creator, licence and original binary provenance require independent verification. PRIVATE REVIEW ONLY; do not publicly publish or commercially distribute.',
  staticPath:'yunex-external-cars/'+item.id+'.glb',
  gitBlobSha1:item.gitBlobSha,sizeBytes:item.sizeBytes,
}));
export const ALL_IMPORTED_ASSETS:ReadonlyArray<ImportedAssetDetails> =
  Object.freeze([...attributed,...candidates]);
const byId=new Map(ALL_IMPORTED_ASSETS.map(asset=>[asset.id,asset]));
if(byId.size!==ALL_IMPORTED_ASSETS.length)throw Error('Duplicate YUNEX imported asset IDs');

/** Safe metadata lookup never confers publication rights. */
export function importedAssetInfo(id:string):ImportedAssetDetails{
  const item=byId.get(id);
  if(!item)throw Error('Unknown YUNEX imported asset: '+id+'; inspect ALL_IMPORTED_ASSETS or kit car catalogues');
  return item;
}

/**
 * Required at the actual render boundary. Private-only models must be opted
 * into intentionally, not selected by an agent's generic car search.
 */
export function resolveImportedAsset(id:string,options:{privateReview?:boolean}={}):ImportedAssetDetails{
  const item=importedAssetInfo(id);
  return requirePrivateReview(item,options.privateReview);
}
