# V5 and independent ground-contact PR #275

PR #275 is untouched and unmerged. A read-only virtual merge against its current head `97efb32a4ef0ed03e71b287c279cd93abf2dc37e` found one textual conflict in the single-line `EpisodeRecipe` declaration in `recipe.ts`: V5 adds a vehicle body detail, while #275 adds a world grounding field. StudioEpisode and index exports merge automatically.

Resolve that declaration by retaining **both** `vehicle.bodyDetail?:'legacy'|'coachbuilt'|'studio'|'fleet'` and `world.grounding?:'enhanced'`, with #275's grounding validation and V5's accepted body-detail list. Do not replace the complete file with either branch's version and lose the other feature. If #275 changes after this recorded head, repeat the virtual merge before integrating.

An isolated extraction of the combined tree with that additive type resolution passed `npm run check` and all four `ground-contact.test.mjs` tests. This check changed neither PR branch. No projection, contact-patch or world-grounding implementation is introduced by the V5 PR itself. Normal merge order can still require this one-line textual resolution; it is not a functional grounding override.
