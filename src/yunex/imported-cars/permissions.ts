/** Pure rights gate; model availability never implies publication clearance. */
export function requirePrivateReview(asset:{id:string;privateReviewOnly:boolean},privateReview=false){
  if(asset.privateReviewOnly&&!privateReview)
    throw Error('PRIVATE REVIEW ONLY: '+asset.id+' has unverified source or publication rights. Set privateReview={true} solely for a non-public inspection, after acquiring the asset.');
  return asset;
}
