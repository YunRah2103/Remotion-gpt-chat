# A–C: FOOTAGE DELIVERY CONTRACT

Repository: YunRah2103/Remotion-gpt-chat
Issue: https://github.com/YunRah2103/Remotion-gpt-chat/issues/44
Shared contract branch: automotive-edits/rs6-no-mercy-001/production-contract
Project path: production/videos/rs6-no-mercy-001
Car: C8-generation Audi RS 6 Avant (including standard/performance trims if footage is authentic and visually coherent; NOT prior C7, speculative successor, RS3/RS4, or GT unless manager marks a distinct exception).
Output target: 1080×1920 portrait, H.264 yuv420p, 30fps, AAC stereo, ~13–16 seconds.

Source priority: rights-cleared maker/creator original direct MP4 or approved CDN; accessible TikTok/Instagram as appropriate; YouTube using **S25 V4** after rights/catalog checks. Do not assume YouTube on GitHub runners must work. Do not let aggressive aesthetic excuse low fidelity.

Each agent must:
1. Locate genuine moving **C8 Audi RS6 Avant** (standard or performance C8; document trim/color/year). Prefer strong existing cinematography, not static showroom video or aftermarket renders masquerading as road cars.
2. Actually download clips — no links-only conclusion, no fabricated samples. Preserve source for verifiable reference. Respect rights and source restrictions; public GitHub releases must carry only permitted source bytes.
3. Use FFprobe to prove original dimensions/fps/codec plus active picture (avoid 1920×1080 file whose content is a skinny cinema bar). No claiming upscaled HD. Inspect three moving frames at useful timestamps, not just first/last.
4. Select 4–7 distinct **high-quality motion** moments of ~1–5s, supply diverse camera categories and deliberate portrait crop windows. Mark real car actually driving versus camera moving around parked RS6.
5. Deliver one actual downloadable GitHub Actions **footage ZIP** or rights-cleared per-shot MP4 GitHub Release with clips, contact sheets, `manifest.json` (source_url, source title, uploader/rights, year/trim/car color, timecodes, shot category, dims/fps/codec, duration, SHA256, valid portrait crop, possible editorial risks), and rejected footage explanations.
6. Link GitHub run, artifact ID/name, branch commit, playable-media proof and best three shots on issue #44. Manager F must be able to download and view the **real bytes**. If blocked, state honest reason. 
7. Coordinate shot overlap via issue #44. No duplicate official Audi launch clip counted three times from TikTok and YouTube uploads of same shot.
8. **Phone worker**: read V4 docs on `experiments/s25-footage-worker-v4-10min-20261012`. Supported job <=600s, <=1080p, <=512MiB. Normal clips 6–40s. Adding a source to the reviewed catalogue requires credible redistribution permission; issue is a job queue, not a licence. No DRM or login bypass. Ask for a phone-side run only when valid job is queued and identify the issue; don't claim a download before a `YUNEX_PHONE_DONE_V4` report plus release exists.
9. Footage first; agent A/B/C MUST NOT assemble full film, take audio-agent job or override manager.
