# Footage Rescue — alternate video acquisition engines

This optional component is isolated from current YUNEX films, the older yt-dlp importer, and the Remotion engine. It accepts **one authorised single-video URL** and produces a source ZIP on success or diagnostic ZIP on failure.

## What it adds

| Site | First engine | Alternative engines |
| --- | --- | --- |
| YouTube / Shorts | yt-dlp with Deno and yt-dlp-ejs | pytubefix; optional Cobalt |
| Instagram Reels | yt-dlp | yt-dlp Chrome impersonation; gallery-dl; optional Cobalt |
| TikTok | yt-dlp | yt-dlp Chrome impersonation; gallery-dl; optional Cobalt |
| Dailymotion | yt-dlp | optional Cobalt |

**Reality:** GitHub-hosted runners share cloud datacentre IP ranges. Alternative extractors are useful for extractor-specific failures but may all encounter the same source access restrictions. No downloader here bypasses sign-in controls, DRM, or private content. gallery-dl supports Instagram and TikTok URLs, but access can still require cookies; this tool deliberately does not pass account sessions or credentials.

## Verified live platform results (11 October 2026)

Evidence: [social extraction matrix](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38157969479) and [YouTube matrix](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38157590842). These tests used small example videos, checked real bytes using FFprobe and decoded two seconds; no third-party footage was redistributed.

- **Instagram**: verified real 5,819,622-byte Reel, 716x1274 and 80.04 seconds; both yt-dlp and yt-dlp Chrome impersonation succeeded. gallery-dl timed out on the tested Reel. A second Instagram Reel returned an empty-media/login-access response for both yt-dlp methods.
- **TikTok**: verified real 3,904,071-byte video, 576x1024 and 25.93 seconds; yt-dlp, Chrome impersonation and gallery-dl succeeded. A second, different TikTok post also passed yt-dlp and Chrome impersonation (724,390 bytes, 576x1024, 8 seconds).
- **YouTube**: 11 extractor/clients failed with bot verification, including stable/nightly yt-dlp, several player clients, Pytubefix and You-Get. [Windows and macOS GitHub runners](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38158355197) also received bot verification on the same authorised test video. Direct open MP4 succeeded (5,635,415 bytes, 720x480), proving GitHub can download video files, but **not** that YouTube itself works.
- **Piped/Invidious**: six public API instances failed (HTTP 403, 502, 526 or similar); no real YouTube media was obtained.
- Those particular social examples are **below native 1080x1920**. Another source may have higher native resolution, but no downloader can restore pixels the source doesn't provide.

Agents should use **yt-dlp -> yt-dlp Chrome -> gallery-dl (where supported)** and move to a different source if the selected post blocks/has inadequate native resolution. Successful extraction of one test post does not guarantee every post works.

### Optional Cobalt

Cobalt can act as a further engine **only with your own or an explicitly authorised HTTPS instance**. No public cobalt.tools API is used. In repository **Settings → Secrets and variables → Actions** configure:

- **Variable**: COBALT_API_URL (full HTTPS origin of your controlled instance)
- **Secret**: COBALT_API_KEY (only when the instance requires Api-Key authentication)

Its address must resolve publicly; the tool accepts only same-host tunnel results and rejects internal-network destinations and redirects. Configuring Cobalt does not guarantee YouTube success.

## Running in GitHub

1. Merge the proposed changes into **main** when ready. GitHub Actions cannot display a new manual workflow on the Actions page until the workflow has landed on the default branch.
2. Choose **Actions → Footage Rescue - multi-engine source acquisition → Run workflow**.
3. Enter one YouTube, TikTok, Instagram, or Dailymotion video URL, select **auto**, and select the minimum real pixel height. Confirm you have permission to acquire and use it.
4. Download the **footage-rescue-RUN_ID** artifact (available for three days). It holds **footage-rescue.zip**. When successful that ZIP contains original video bytes, three sampled JPEG video frames and **manifest.json** with genuine FFprobe/FFmpeg checks; on failure it contains the diagnostic manifest explaining each attempt. The Actions run will fail if no usable source was retrieved.

Local usage:

```bash
python -m pip install -r production/footage/requirements.txt gallery-dl pytubefix curl-cffi
# Also install Deno 2.x and FFmpeg + FFprobe.
python production/footage_rescue/acquire.py \
  --url "https://www.youtube.com/watch?v=VIDEO_ID" \
  --engine auto --min-height 1080 --rights-confirmed
```

Testing, without external service traffic:

```bash
python -m unittest discover -s production/tests -p test_footage_rescue.py -v
```

## Quality and agent protocol

- Download only real sources, never fabricated or upscaled originals. FFprobe checks dimensions, frame rate and duration; FFmpeg attempts a full decode. The result includes an SHA-256 fingerprint.
- **1920×1080 landscape is not enough for a native sharp 1080×1920 vertical crop.** Review the manifest field `nativeVertical1080CropPossible`. A 4K landscape source has more usable pixels for 9:16.
- A technical PASS is **not** proof of the car model, cinematography, genuinely distinct angles, absence of watermarks or licensing rights. The acquiring agent must inspect source video and previews.
- When one URL is blocked, do not retry the same source repeatedly from GitHub runners. Move to a different authorised source or ask the filmmaker for the original file.
- Existing Pexels/Pixabay Automotive Footage Finder and official manufacturer MP4 sources remain good non-social options.
- The official YouTube Data API supports **search/metadata**, not arbitrary original file downloads. The ChatGPT vidIQ plugin can help discover footage candidates, but cannot remove GitHub IP blocks.

References: [yt-dlp EJS](https://github.com/yt-dlp/yt-dlp/wiki/EJS), [gallery-dl supported sites](https://github.com/mikf/gallery-dl/blob/master/docs/supportedsites.md), [pytubefix](https://github.com/JuanBindez/pytubefix), [Cobalt API](https://github.com/imputnet/cobalt/blob/main/docs/api.md).

Do not commit browser cookies, social-media account passwords or secrets to this public repository.
