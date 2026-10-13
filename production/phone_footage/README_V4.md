# YUNEX Galaxy S25 Footage Bridge V4 — Up to 10 Minutes, Optional Native 4K

Branch: experiments/s25-footage-worker-v4-10min-20261012

V4 is a separate experimental worker. Existing V1/V2/V3 and main are preserved.

**NEW AI AGENT — READ FIRST:** [YUNEX V4 Quick-Start](https://github.com/YunRah2103/Remotion-gpt-chat/blob/main/docs/YUNEX_V4_NEW_AGENT_START_HERE.md) → [Full S25 V4 workflow](https://github.com/YunRah2103/Remotion-gpt-chat/blob/main/docs/YUNEX_S25_V4_AGENT_GUIDE.md). **Do not rebuild or reinstall the phone worker, request access tokens, or ask the owner to attach media already present in GitHub drafts.** The licence-registration gate has been removed: the owner can queue a canonical YouTube watch URL **without** cataloging rights first. For unverified sources, the resulting MP4 is stored in an **owner-only GitHub draft Release**, never a public download. [Previous S25 YouTube PASS #55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55) used a permitted snowy-car test, **not** RS6 footage. Unregistered-source downloading is **phone-proven** by [AutoTopNL job #56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56): a 60-second H.264/AAC recording stored in a draft Release. Optional **audio-only mode** is tested offline with real FFmpeg AAC encoding/decoding; a phone-side audio-only job is still pending.

## What changed

The **duration ceiling is 600 seconds (10 minutes)**; normal projects should still request short clips. Clips can begin at offsets up to 6 hours into the source. V4 supports landscape and portrait with **720p, 1080p (default), or optional native 2160p / 4K**. For landscape, 4K must really contain at least **3840×2160** source pixels; for portrait, at least **2160×3840**. No fake upscaling. 4K is not yet certified on the actual S25; existing 1080p downloads are phone-proven.

- **720p/1080p/audio** retain the original output limit of 512 MiB and normal default size budgets. **Explicit 4K video** gets a separate cap of **1,536 MiB (1.5 GiB)** and an adaptive budget up to that cap; long/high-bitrate 4K can still exceed it and fail safely. Agents should request brief 4K excerpts first.
- **720p/1080p** working storage stays capped at 2,300 MiB with the original free-space reserve. **4K** may require up to **8 GiB** temporary workspace and the whole calculated workspace **plus 1,500 MiB** free before starting; a job is rejected if the phone lacks space. Download/transcode processes stop if free storage falls below 400 MiB.
- Timeout scales with length (up to 50 minutes for downloading and 50 minutes for remuxing/transcoding). Full FFmpeg decode and source/output resolution/codec/duration checks are required.
- **4K video uses native codec stream-copy to MP4** (H.264, HEVC, VP9 or AV1), not slow 4K software H.264 encoding. This avoids battery-intensive upscaling/re-encoding and preserves original source detail. The MP4 may contain VP9/AV1/HEVC instead of H.264; agents should use FFprobe and transcode on a desktop/cloud editor only if required. 1080p/720p retains the existing H.264 export and precise cut path. 4K stream-copy can have keyframe-based cut boundaries; inspect the actual beginning/end frames and duration.
- Large media uploads stream from disk instead of loading hundreds of megabytes into RAM, with longer timeouts for slow mobile connections.
- **Audio-only jobs** (`--media audio`) fetch only the needed soundtrack and export verified 48-kHz stereo AAC `.m4a` files. These avoid downloading/encoding 1080p video just to get engine sound; `--media video` remains the default.
- On normal completion, temporary media is deleted. On later startups, V4 clears only its own abandoned temporary folders older than 24h; personal videos are never intentionally removed.
- Agent handoff uses the existing owner-only GitHub issue queue, SHA256, JSON result manifest and verified MP4 Release assets. An agent can request **any valid canonical YouTube watch URL without adding source licence details**.
- The existing source catalog supplies **optional** verified CC licence metadata. A listed licensed source retains public-prerelease delivery with proper attribution. An **unlisted source gets an owner-only GitHub draft** with `rights_status: unverified`, no invented licence and no public MP4 URL. Downloading for private review is separate from permission to republish.

## Install or upgrade the existing V4 installation

**This section is for phone maintenance, not for new footage agents.** The owner has V4 installed and successfully used it on #55 and #56. Only when the owner specifically wants the latest V4 upgrades, first stop the existing loop with **Ctrl+C**, run the safe installer once, then start `~/yunex-v4 --loop` when actual jobs are queued. Never imply the GitHub commit automatically updated a running Termux process.

With no other footage worker running, paste:

~~~bash
curl -fLsS https://raw.githubusercontent.com/YunRah2103/Remotion-gpt-chat/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/install_v4_termux.sh -o ~/yunex-install-v4.sh && bash ~/yunex-install-v4.sh
~~~

The installer checks that no V4 worker is running, validates both staged video and audio job parsing before replacement, and preserves the previous worker as a rollback copy. It updates the V4 Python worker, optional licence catalogue and agent helper without touching existing tokens or V1/V2/V3. It **does not** automatically download a video or restart the loop.

Later commands:

~~~bash
~/yunex-v4 --doctor
~/yunex-v4 --once
~/yunex-v4 --loop
~/yunex-v4 --clean
~~~

The `--once` command processes at most one queued authorized V4 issue. The `--loop` command checks every **120 seconds by default**, configurable via `~/yunex-v4 --loop --interval 60` (60–900 seconds). Completed jobs are cached so old comments are not re-read every poll; catalogue refresh is limited to 30-minute intervals and idle messages appear no more than every ten minutes. The `--clean` command removes only stale V4 temporary folders. Android may suspend Termux in the background. V4 does not automatically start after restart; the optional V3 Boot helper is V3-specific.

## Agents: queue without licence registration

**The worker no longer requires licence/attribution details or a preapproved source entry just to accept a job.** Use an owner-created GitHub issue with exact marker `YUNEX_PHONE_JOB_V4`. The URL must be canonical HTTPS YouTube watch format, e.g. `https://www.youtube.com/watch?v=a38sqC7k2iw`. Convert share/playlist/timestamp links to this exact URL form. Do not use arbitrary hosts, `youtu.be`, non-YouTube MP4s, or custom query parameters.

Run the helper **from the V4 branch**; it only prints a valid issue body and does not submit the issue:

~~~bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=a38sqC7k2iw' \
  --start 20 --duration 12 --height 1080 --orientation landscape
~~~

**Native 4K (only when the original YouTube video genuinely has 4K frames):**

~~~bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=Exq6pB3IGyU' \
  --start 8 --duration 12 --height 2160 --orientation landscape
~~~

The URL here is only a job-format example: **do not claim this specific recording is 4K** or queue it without first verifying that the source offers true UHD. For portrait sources use `--orientation portrait --height 2160`; V4 checks that the original source is natively at least 2160 pixels wide and 3840 pixels high. Default requests remain `--height 1080`.

**For engine/audio sources, request audio-only:**

~~~bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=Exq6pB3IGyU' \
  --start 8 --duration 13 --media audio
~~~

Create an **open, owner-authored** issue titled `[YUNEX PHONE JOB] RS6 excerpt`, with the exact printed two-line body. Valid job bounds: 2–600 seconds, offset up to 21600 seconds, 720/1080/**2160p** when video is requested, landscape or portrait. Explicit 4K has larger disk/data demands and is validated against source pixels rather than upscaled. `--media video` is the default. Already-catalogued sources retain their verified attribution and catalogue-specific height caps.

**Delivery classification:**

- **Listed with verified licensing:** phone writes a public prerelease, downloadable MP4 URL and JSON manifest with credit. Never misstate rights.
- **Unlisted/unknown rights (normal new RS6 case):** phone writes an **owner-only DRAFT Release**. The completed issue comment includes `YUNEX_PHONE_DONE_V4`, `release_visibility: draft`, `rights_status: unverified`, `release_id`, `asset_filename`, `asset_id`, `asset_api_url` and verified SHA256. Public `mp4_url` / `audio_url` remain **null by design**, not a download failure. An audio-only job stores `yunex-v4-ISSUE_NUMBER.m4a`, not `.mp4`.

Agents can retrieve draft assets **within authenticated GitHub Actions**, as demonstrated on [real AutoTopNL audio verification run #38441894486](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38441894486). **Important:** `contents: read` returned HTTP 403 for draft assets in this repository, while `contents: write` succeeded using the built-in token. Use the narrower `contents: write` workflow scope only where draft access is required; do not expose the token.

~~~yaml
permissions:
  contents: write
~~~

~~~bash
gh release download "yunex-phone-v4-ISSUE_NUMBER" \
  --repo YunRah2103/Remotion-gpt-chat \
  --pattern "yunex-v4-ISSUE_NUMBER.*" --dir .
~~~

Set `GH_TOKEN: ${{ github.token }}` in that step, replace `ISSUE_NUMBER`, and use the exact `asset_filename` from the issue result (either `.mp4` or `.m4a`). Agents must not publish the draft for convenience. Verify file SHA256 against the issue result and use the binary within the authorised editing workflow. GitHub connector text fetch alone does not supply the media bytes.

The result helper can inspect a completed issue:

~~~bash
python production/phone_footage/agent_jobs_v4.py result --issue ISSUE_NUMBER
~~~

Then FFprobe, full-decode, hash-check, and **visually inspect video** or **listen to audio** before handing the editor a real asset. A queue issue, cloud anti-bot error or green workflow is not an acquired MP4. Permission to publicly post an edit containing a source is a separate rights decision; **do not publish rights-unverified draft footage**.

## Honest limits and testing

- **10 minutes is a maximum, not the default.** Requests for 601 seconds or more are refused. Although 4K is permitted within this duration, high-bitrate sources will hit the 1.5 GiB output cap or disk constraints; short native 4K clips are strongly preferred.
- The output cap can reject complex high-bitrate 10-minute sources. Storage availability, source format and upload speed also matter.
- The job may use gigabytes of temporary phone storage, even though successful runs clean it afterward. Mobile data and GitHub storage consumption still occur.
- CI validates unregistered-source acceptance, strict YouTube URL validation, draft/private publication, 600-second maximum, adaptive storage, streaming upload, audio-only synthetic AAC encode/decode, video synthetic FFmpeg encode/decode, cached jobs and agent helper compatibility.
- Phone-proven jobs #55/#56 are **1080p**. Synthetic 3840×2160 FFmpeg remux/full-decode tests and negative 1080p-upscale tests pass in GitHub CI. **No real S25 native 4K or full 10-minute YouTube job has yet been verified**; start with a short, available 4K source. The phone worker only runs when started by the user or configured as a background process.

GitHub Actions: .github/workflows/s25-phone-worker-v4-tests.yml
