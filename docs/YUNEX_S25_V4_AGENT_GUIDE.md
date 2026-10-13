# YUNEX — S25 V4 Phone Worker: Agent Guide

**New agent? Read [START HERE: 60-second agent quick-start](YUNEX_V4_NEW_AGENT_START_HERE.md) first.** This file is the detailed protocol reference, not an instruction to rebuild the worker or ask the user for files.


**Repository:** [`YunRah2103/Remotion-gpt-chat`](https://github.com/YunRah2103/Remotion-gpt-chat) (never use the obsolete `yunus-video-lab` repository).

**Worker implementation branch:** [`experiments/s25-footage-worker-v4-10min-20261012`](https://github.com/YunRah2103/Remotion-gpt-chat/tree/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage).

**IMPORTANT UPDATE — 13 October 2026:** **YouTube jobs no longer require advance licence registration, a permission record, a rights-reviewed source-catalog entry or licence fields in the issue.** The worker still accepts **only jobs from GitHub account `YunRah2103`**, with strict URL, runtime, native-resolution, disk and file-verification limits. The latest code also supports optional native 2160p/4K (not phone-proven yet). Any source **without verified licence metadata** is automatically saved to an **owner-only DRAFT GitHub Release**, not publicly redistributed. Public publishing of third-party footage still requires appropriate rights.

## Agent decision and responsibilities

1. **Use working directly downloadable MP4s first** where appropriate (including existing original Audi RS6 filmmaker/manufacturer footage). If you need a **YouTube source**, use the S25 V4 worker rather than repeating an already-failed cloud YouTube download.
2. **Find quality moving footage**, confirm the car/model and exact source timecodes. Prepare a canonical HTTPS YouTube watch URL containing only the video ID, e.g. `https://www.youtube.com/watch?v=a38sqC7k2iw`. Normalised, valid video IDs are 11 characters; `youtu.be` links, additional `&t=` parameters, playlists, other hosts and direct MP4 URLs are not V4 job inputs.
3. **No licence entry or approval request is needed just to queue a job.** Do not claim or fabricate permission. The existing [`sources_v3.json`](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/sources_v3.json) is now used only for optional known verified licence metadata and a few source-specific quality limits.
4. **Create the GitHub issue** with the exact result of the V4 branch [`agent_jobs_v4.py`](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/agent_jobs_v4.py) helper:

   ```bash
   python production/phone_footage/agent_jobs_v4.py prepare --url 'https://www.youtube.com/watch?v=a38sqC7k2iw' --start 20 --duration 12 --height 1080 --orientation landscape
   ```

   **For genuine 4K video:** specify `--height 2160` for a real 3840×2160-or-better landscape source (or 2160×3840 portrait). **1080p stays the default**. The new 4K path preserves the source's codec (H.264/HEVC/VP9/AV1) in MP4 instead of upscaling or re-encoding the video on the S25. It has a separate 1.5 GiB output cap and significant temporary disk/battery demands. Use short 4K excerpts and verify the source is truly 4K first. **CI-tested with real synthetic UHD, not yet phone-tested**. Some 4K MP4s are not H.264; downstream agents may need to transcode in GitHub Actions before editing, and stream-copy cut points may be keyframe-limited.

   Example (substitute an actual verified UHD URL, not the 1080p AutoTopNL job #56):

   ```bash
   python production/phone_footage/agent_jobs_v4.py prepare --url 'https://www.youtube.com/watch?v=VIDEO_ID' --start 30 --duration 12 --height 2160 --orientation landscape
   ```

   For **soundtrack-only requests** (genuine exhaust/V8 acceleration, soundtrack references, voiceover), use `--media audio` to get a verified **48 kHz stereo AAC .m4a** instead of wasting battery and mobile data on video. For normal video clips omit `--media` or set `--media video`.

   The CLI **prints a two-line issue body only**. It does not create an issue or download media. Use a GitHub connector authenticated **as `YunRah2103`** to create an **open issue** with title starting `[YUNEX PHONE JOB]` and body exactly as generated:

   ```text
   YUNEX_PHONE_JOB_V4
   {"url":"https://www.youtube.com/watch?v=a38sqC7k2iw","start":20.0,"duration":12.0,"height":1080,"orientation":"landscape"}
   ```

   Agents using a non-owner GitHub account cannot make accepted jobs by copying this payload. Send a ready-to-post issue for the owner instead. **Do not impersonate the issue author or bypass the queue control.**
5. **Phone processing:** The Galaxy S25 **already has V4 installed and has successfully downloaded unregistered RS6 video (#56)**. Do not reflexively request another installation, token, or user upload. The **latest repo revision** supports quiet 120-second polling, an optional `--media audio` mode, caching and safer updates; **those specific improvements apply on the phone only after its owner updates it**. Do not assume that the currently running Termux process is the latest version. If it is running, it handles jobs sequentially; otherwise, the owner may start `~/yunex-v4 --loop` when an actual job is queued. Creating an issue cannot remotely start Termux. Never ask the user to keep the phone awake for an unqueued job.
6. **Wait for a real result** on the job issue:
   - `YUNEX_PHONE_DONE_V4`: verified H.264 MP4 **or** AAC M4A uploaded, manifest/checksum, full FFmpeg decode PASS.
   - `YUNEX_PHONE_FAILED_V4`: actual phone-side error; stop retrying blindly and switch to another source or direct MP4.
   - `No pending approved V4 jobs` is **older V4 idle output**. The optimised worker prints `V4 idle: no pending jobs` at most every ten minutes. Neither means a failed download.

## Private vs public delivery (crucial)

| Source | Destination | Completion metadata | How agents access |
|---|---|---|---|
| Already in the verified CC source catalog | **Public GitHub prerelease** | `release_visibility: public_prerelease`, `mp4_url` or `audio_url`, `license`, `sha256` | Direct public media URL |
| Any other canonical YouTube video | **Owner-only draft Release** | `release_visibility: draft`, `rights_status: unverified`, `release_id`, `asset_filename`, `asset_id`, `asset_api_url`, `sha256`; public media URL is null | Authenticated GitHub Actions with draft access; **not a public link** |

**Confirmed GitHub Actions draft access fix:** `contents: read` caused HTTP **403 Resource not accessible by integration** for [AutoTopNL private draft #56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56). `contents: write` with GitHub Actions' **built-in `github.token`** succeeded in [run #38441894486](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38441894486). This does **not** mean the media must be published. Only grant `contents: write` to workflows that actually need private draft access.

```yaml
permissions:
  contents: write
```

Within that Actions job, set `GH_TOKEN: ${{ github.token }}` and run:

```bash
gh release download yunex-phone-v4-ISSUE_NUMBER --repo YunRah2103/Remotion-gpt-chat --pattern 'yunex-v4-ISSUE_NUMBER.*' --dir .
```

Replace `ISSUE_NUMBER` in the tag and pattern. Prefer the exact `asset_filename` field from the completed issue result: video `.mp4`, or audio-only `.m4a`. Verify the SHA256 and use it within the authorised edit. **Do not ask the user to attach an already-acquired S25 recording.** If a connector cannot return draft binary bytes, use this proven Actions route. Never make the draft public merely for convenience.

You may inspect the owner-authored issue comment, or run:

```bash
python production/phone_footage/agent_jobs_v4.py result --issue ISSUE_NUMBER
```

Then verify **actual playable bytes**, full FFmpeg decode, FFprobe codec, duration and SHA256. For videos, inspect moving frames and dimensions; for audio, listen to the actual target passages. Handoff to the **relevant project tracking issue** (for the original RS6 production, [#44](https://github.com/YunRah2103/Remotion-gpt-chat/issues/44)) with issue number, source/timecodes, authenticated asset location, metadata and visual/audio QA. Do **not** assume every future YUNEX project is RS6 #44. Metadata or a queue issue alone is **not** a delivered MP4 or M4A.

## Limits and evidence

- Owner-authored GitHub issue only; strictly canonical YouTube watch URL. No licence-registration prerequisite for private draft review.
- Start `0–21600s`, clip length `2–600s` (ten-minute maximum). Video heights `720`/`1080`/`2160` requested explicitly; 1080p default. **Native 4K is at least 3840×2160 landscape or 2160×3840 portrait**, with no upscale. Legacy video/audio jobs keep 512 MiB cap; optional 4K video has a **1536 MiB** cap, up to ~8 GiB temporary workspace, additional free-space reserve and potentially heavy battery/data use. Agents must prefer short UHD clips and inspect codecs/frame timing. Pre-reviewed sources can have lower per-URL approved maximum heights. This is not a claim that an arbitrary YouTube URL contains genuine 4K.
- **4K validation:** real synthetic native 3840×2160 MP4 remux/full-decode and rejection of 1080p sources are CI-tested. Actual native 4K acquisition on the S25 is **not yet verified**; existing phone-proven jobs #55 and #56 are 1080p.
- **One phone job at a time**. Phone can stop to save battery; `Ctrl+C` stops the loop, `~/yunex-v4 --loop` starts it after installation. Polling defaults to two minutes, configurable with `--interval 60..900`. A running old-version process **must be stopped before upgrading**; the installer now refuses hot-update and retains a rollback copy.
- [**Actual S25 V4 PASS #55**](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55): approved **non-RS6** snowy-car YouTube clip, **1920×1080**, 8.008 seconds, 9,179,358 bytes, full-decoded H.264 MP4: [playable file](https://github.com/YunRah2103/Remotion-gpt-chat/releases/download/yunex-phone-v4-55/yunex-v4-55.mp4).
- [**Actual S25 V4 PASS #56**](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56): *unregistered* AutoTopNL RS6 recording successfully downloaded on the phone: 60 seconds, 1920×1080, 15,340,800 bytes, full decode PASS and private draft media asset #637770966. It **proved** unregistered RS6 footage acquisition on the phone. The **new audio-only mode** has passed offline encode/decode QA; phone-side audio-only download still needs live validation. This distinction must remain in new-agent status reports.
- **Rights are not assumed:** a successful private technical download is not permission to publicly publish the source or a finished edit using it.

**Read** the [detailed V4 README](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/README_V4.md) and actual worker source for error handling. The guide does not authorize publishing someone else's content.
