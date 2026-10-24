/** Pure rights gate; preserves exact asset metadata shape for TypeScript. */
export function requirePrivateReview<T extends {id:string;privateReviewOnly:boolean}>(asset:T,privateReview=false):T{
  if(asset.privateReviewOnly&&!privateReview)
    throw Error('PRIVATE REVIEW ONLY: '+asset.id+' has unverified source or publication rights. Set privateReview={true} solely for a non-public inspection, after acquiring the asset.');
  return asset;
}
