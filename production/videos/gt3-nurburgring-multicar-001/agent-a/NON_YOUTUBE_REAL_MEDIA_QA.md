# Agent A — independently inspected non-YouTube media QA (2026-10-11)

**Gate: BLOCKED — 0 of 24 required Nürburgring racing shots; 0 of 6 verified native-HD Nürburgring GT3 marques.**

## Real executable evidence

- Dailymotion native format proof workflow: [38139703090](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139703090), [artifact 11702950026](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139703090/artifacts/11702950026). Ten actual Dailymotion video pages (including race content for Porsche, Mercedes-AMG, Lamborghini, McLaren, BMW/Audi candidates) exposed **512×288 or 512×296** as the sole yt-dlp rendition (hls-380). These are NOT 1080p, so 0 accepted.
- Dailymotion extract + official TikTok/Instagram discovery workflow: [38139433085](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139433085), [artifact 11701169676](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139433085/artifacts/11701169676). 20 Dailymotion trim attempts failed selection of native >=1080p. TikTok race organization profiles exposed no post metadata; Instagram profiles redirected to login. 0 accepted media.
- Porsche Newsroom **genuine 4K source**: https://newstv.porsche.com/porschevideos/newstv.porsche.com_322821_en.mp4. FFprobe verified **3840×2160 native, 25fps, H.264**, direct curl success. Exact original SHA256: `54de24933a3cfe88b06bdaa68a08e818305668cc976fb98965b2e2a1aee9b16b`. Source proof run [38139892820](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139892820), real [artifact 11703015006](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38139892820/artifacts/11703015006) with 8.163-second H.264 3840×2160 stream-copy MKV and frame.
- **Native human visual review actually performed**: inspected multi-frame 8-second contact sheet showing 2026 white/grey Porsche 911 GT3 R 992 under red cinematic lighting and black studio, closeups of body/rear LEDs/blurred silhouette. This is a **studio reveal film**, NOT a multi-car Nürburgring track racing shot; mark **REJECTED FOR MONTAGE**, eligible only as optional brand intro with explicit director approval. Do not count as a qualifying on-track race shot or 6-marque coverage.

## Delivery semantics

The Porsche proof artifact is **actual 4K video bytes**, not a fake link. It is **not** `GT3-MULTICAR-FOOTAGE-30PLUS` and should not be handed to B as a complete footage pack. Candidate leads and diagnostic ZIPs are separate from accepted moving race footage. Correct source exclusions protect user's quality contract.

## Next acquisition source families

- Actual native >=1080p GT3 Nürburgring broadcast/team media clips in official race/press original media CDN; direct MP4/stream URLs with decoded quality proof.
- Individually enumerated TikTok or Instagram POST video links, since profile/list pages require login or give no metadata on GitHub runners; check real accessible 1080p and watermarks.
- Avoid repeated YouTube requests and these Dailymotion hls-380 sources.

**DO NOT MARK A PASS without 24 genuinely distinct original GT3 Nürburgring race shots across at least six manufacturers.**
