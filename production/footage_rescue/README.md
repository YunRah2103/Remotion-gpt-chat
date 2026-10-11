# Footage Rescue — alternate video acquisition engines

This optional component is isolated from current YUNEX films, the older yt-dlp importer, and the Remotion engine. It accepts **one authorised single-video URL** and produces a source ZIP on success or diagnostic ZIP on failure.

## What it adds

| Site | First engine | Alternative engines |
| --- | --- | --- |
| YouTube / Shorts | yt-dlp with Deno and yt-dlp-ejs | pytubefix; optional Cobalt |
| Instagram Reels | yt-dlp | gallery-dl; optional Cobalt |
| TikTok | yt-dlp | gallery-dl; optional Cobalt |
| Dailymotion | yt-dlp | optional Cobalt |

**Reality:** GitHub-hosted runners share cloud datacentre IP ranges. Alternative extractors are useful for extractor-specific failures but may all encounter the same source access restrictions. No downloader here bypasses sign-in controls, DRM, or private content. gallery-dl supports Instagram and TikTok URLs, but access can still require cookies; this tool deliberately does not pass account sessions or credentials.

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
python -m pip install -r production/footage/requirements.txt gallery-dl pytubefix
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
