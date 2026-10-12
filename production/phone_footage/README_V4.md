# YUNEX Galaxy S25 Footage Bridge V4 — Up to 10 Minutes

Branch: experiments/s25-footage-worker-v4-10min-20261012

V4 is a separate experimental worker. Existing V1/V2/V3 and main are preserved.

## What changed

The **duration ceiling is 600 seconds (10 minutes)**; normal projects should still request short clips. Clips can begin at offsets up to 6 hours into the source. V4 supports landscape or portrait, up to genuine 1080p (not 4K or HDR).

- Output size defaults dynamically to 45 MiB for short clips and up to 510 MiB for 600-second clips; hard maximum 512 MiB per job.
- Working storage budget scales with requested output size up to 2,300 MiB. The worker requires that workspace budget plus 450 MiB free before starting, with at least 700 MiB for the smallest jobs. Download processes stop if phone free space drops under 400 MiB.
- Timeout scales with length (up to 50 minutes for downloading and 50 minutes for transcoding). Full FFmpeg decode and resolution/codec/duration checks are required.
- Large GitHub release MP4 uploads use file streaming instead of loading hundreds of megabytes into RAM.
- On normal completion, temporary media is deleted. On later startups, V4 clears only its own abandoned temporary folders older than 24h; personal videos are never intentionally removed.
- Agent handoff uses the existing owner-only issue queue, exact rights-reviewed registry, downloadable MP4 release asset, SHA256 and JSON manifest.
- Download permission is restricted to properly reviewed source entries. YouTube accessibility alone does not grant content reuse rights. Public GitHub releases are visible to everyone.

## Install once using existing phone token

Only after V4 CI succeeds, open Termux with no other footage worker running and paste:

~~~bash
curl -fLsS https://raw.githubusercontent.com/YunRah2103/Remotion-gpt-chat/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/install_v4_termux.sh -o ~/yunex-install-v4.sh && bash ~/yunex-install-v4.sh
~~~

The installer downloads the V4 Python worker, source registry and agent helper into a separate folder. It checks dependencies and prints a doctor report, but does **not** automatically download a video.

Later commands:

~~~bash
~/yunex-v4 --doctor
~/yunex-v4 --once
~/yunex-v4 --loop
~/yunex-v4 --clean
~~~

The --once command processes at most one queued authorized V4 issue. The --loop command checks every 60 seconds **while Termux is running**. The --clean command removes only stale V4 temporary folders. Android may suspend Termux in the background. V4 does not automatically start after restart; existing V3 optional Boot helper is still V3-specific.

## Agents: how to request footage

First verify that the particular source video has enough running time and its copyright licence permits redistribution through public GitHub Releases. Only owners can approve a source in the reviewed sources_v3.json catalog on the V4 branch. Rights and reuse evidence must accompany any source approval.

The agent helper generates the exact issue body:

~~~bash
python production/phone_footage/agent_jobs_v4.py list
python production/phone_footage/agent_jobs_v4.py prepare --url 'https://www.youtube.com/watch?v=DqiKOr1aS9w' --start 0 --duration 15 --height 1080
~~~

For an approved, sufficiently long video, change the duration to 600 and start to the desired offset. The job title must start with [YUNEX PHONE JOB] and the body with YUNEX_PHONE_JOB_V4. The worker only accepts owner-created GitHub issues and approved source records.

After successful phone processing, the issue receives YUNEX_PHONE_DONE_V4 with full metadata. The release provides an MP4 plus JSON manifest, including native dimensions, duration, source rights, hash and direct download URL. Agent result parser:

~~~bash
python production/phone_footage/agent_jobs_v4.py result --issue ISSUE_NUMBER
~~~

A queued issue alone is not usable footage. Failed jobs are marked YUNEX_PHONE_FAILED_V4.

## Honest limits and testing

- **10 minutes is a maximum, not the default.** Requests for 601 seconds or more are refused.
- The output cap can reject complex high-bitrate 10-minute sources. Storage availability, source format and upload speed also matter.
- The job may use gigabytes of temporary phone storage, even though successful runs clean it afterward. Mobile data and GitHub storage consumption still occur.
- CI validates 600-second job acceptance, >600-second rejection, adaptive storage, streaming upload, real short synthetic FFmpeg encode/decode and agent issue compatibility.
- No real full ten-minute YouTube download has yet been claimed. Validate with a permitted longer source on the Galaxy S25 when necessary. The phone worker only runs when started by the user or configured as a background process.

GitHub Actions: .github/workflows/s25-phone-worker-v4-tests.yml
