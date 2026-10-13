# RS6 A2 C8 UHD — genuine hero segment selection (13 Oct 2026)

## Source and technical evidence
Audi Daytona Grey genuine C8 RS 6 Avant on-location original, **3840x2160/25fps**: https://www.audi.com/en/videos/video/audi-rs-6-until-2025-daytona-grey-footage-on-location-4874

- S25 **V4 tested** exact YouTube Niterun https://www.youtube.com/watch?v=a38sqC7k2iw and Maku https://www.youtube.com/watch?v=pzhKoJAb1ek in [runner 38371788334](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38371788334) with the unmodified V4 `agent_jobs_v4.py prepare`, each refused (absent from approved catalog), then independent cloud yt-dlp reached YouTube anti-bot. **Neither produced MP4.** Test artifact [11799411049](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38371788334/artifacts/11799411049).
- Vimeo filmmaker original attempts [runner 38371401145](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38371401145) inspected 3 original RS6 films, all video config 403; no MP4 obtained. [Artifact 11799291343](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38371401145/artifacts/11799291343).
- **Successful fallback:** new independent 24/24 original-4K source frame decodes at varied film points (parallel byte-range seek, not 789MB full copy) [runner 38372141728](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38372141728), contact JPEG [artifact 11799821441](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38372141728/artifacts/11799821441), elapsed 51.9 seconds. Former whole-file download exceeded 551-second budget and was abandoned, not retried.
- Five 2.4-second **genuine moving-frame** tests (5 frames each; wide and 9:16 center-crop sequences) [runner 38372578987](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38372578987), [artifact 11799333089](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38372578987/artifacts/11799333089).

## Visual review — examined consecutive frames, not just motion scores

| ID | Source seconds (proposed usable) | Car/camera proof | Creative quality | Portrait crop | Verdict |
| --- | --- | --- | --- | --- | --- |
| **A2-D01-SWEEP** | **96.0–97.0** | RS6 enters tight mountainside bend, driving towards camera; background and car position change across five frames | Low dramatic moving three-quarter/front. Daylight, neutral/dark grade possible. | Must track center to the **right**, because fixed center 9:16 clips RS6 severely; early 95.0–95.5 are empty road. | **SELECT FOR TIMED 1s ACTION CANDIDATE** |
| **A2-D02-APPROACH** | **206.0–207.1** | Authentic RS6 approaches front-on and lunges past lens in a short, sharp driving burst. Late 207.5+ is empty road. | **Best energetic drive-by** of five checked; natural speed and blur. Daytime. | Must use manually tracked horizontal crop; fixed center 9:16 cuts body and may lose car on exit. | **SELECT 1.0–1.2s ACTION CANDIDATE** |
| A2-D03-HEADON | 295.0–297.0 | Starts with frontal movement but cuts at 295.5 to mostly motionless front-car beauty shot. | Nearly static after splice. | Center crop front may work for short 0.2s accent. | **REJECT as sustained hero driving** |
| A2-D04-3QFRONT | 386.0–388.0 | Three-quarter front side profile barely moves for first ~1.5s, scene transition near 388. | Clean styling but stationary/weak motion. | Severe off-center clipping. | **REJECT hero action** |
| A2-D05-REAR3Q | 412.0–414.0 | Rear three-quarter RS6 nearly motionless across five frames. | Decent static product beauty; no compelling motion. | Center crop loses rear/body. | **REJECT hero action** |

**Key editor truth:** 24-frame broad survey + 5-timepoint temporal proof yielded **TWO meaningful 1–1.2s action candidates**, not 5 perfect 3-second hero clips. Previous generic motion score falsely elevated landscape and scene transitions; retain these film-specific decisions. 4K does *not* automatically mean premium portrait composition; proper vehicle-follow crop path is essential. No night or rain in the official source.

**Permissions and delivery state:** Audi source has not been cleared for public YUNEX redistribution; footage is technically accessible and decoded transiently in GitHub Actions, **no publicly distributed source-video ZIP**. Continue gathering a separate dark-night hero source through #49/#51, but do not wait for those to perform timing/proof work. Manager F should assess these source timecodes, not mark them editor-released.
