# YUNEX S25 Footage Bridge V3

Branch: experiments/s25-footage-worker-v3-20261012. Proven V1, V2 and main untouched.

The existing S25 V2 proof issue #41 produced 1920x1080 genuine phone-acquired H.264, 6.01 seconds, full decode PASS. V3 is a separate production worker. GitHub CI confirms V3 offline tests; **the real V3 phone test is still needed**.

## Features

- Reviewed and versioned source registry sources_v3.json (not a hardcoded pair in Python).
- Excerpts from 2 to 40 seconds, start offsets up to 3600 seconds.
- Landscape 720p or genuinely native 1080p; 1080p jobs FAIL rather than upscaling 720p.
- Output cap up to 80 MiB per issue (default 45 MiB).
- Temporary workspace cap 350 MiB. Require 700 MiB free at launch; emergency 220 MiB remaining guard. Process-group termination on timeout/disk limit.
- Automatic normal cleanup, and cleanup of abandoned V3 temporary folders older than 24h on later launches; no deletion of user's own videos.
- Owner-authored issue queue, strict V3 job format, checked rights registry.
- Real binary MP4 **plus JSON manifest** released on GitHub; issue completion comment includes full metadata, attribution, dimensions and SHA-256.
- Registry refresh from the approved experimental branch while worker runs, so changes to properly reviewed sources don't require editing Python or manually downloading a new worker version.
- Optional continuous polling and Termux:Boot helper, with Android battery restrictions still applying.

## One-command phone installation

Open Termux after finishing any existing phone job. Paste:

~~~bash
curl -fLsS https://raw.githubusercontent.com/YunRah2103/Remotion-gpt-chat/experiments/s25-footage-worker-v3-20261012/production/phone_footage/install_v3_termux.sh -o ~/yunex-install-v3.sh && bash ~/yunex-install-v3.sh --once
~~~

Reuses your locally saved GitHub token without printing it. Installs V3 separately at ~/.local/share/yunex-v3, preserving V1 and V2.

Later commands:

~~~bash
~/yunex-v3 --once
~/yunex-v3 --loop
~/yunex-v3 --doctor
~/yunex-v3 --clean
~~~

--once processes at most one queued job and exits. --loop checks every 60 seconds **while Termux remains running**. --clean cleans only stale V3 temporary workspaces.

Optional boot script requires a separately installed, first-launched Termux:Boot and correct Android background settings:

~~~bash
curl -fLsS https://raw.githubusercontent.com/YunRah2103/Remotion-gpt-chat/experiments/s25-footage-worker-v3-20261012/production/phone_footage/enable_v3_boot.sh -o ~/yunex-enable-boot.sh && bash ~/yunex-enable-boot.sh
~~~

This is opt-in. It creates ~/.termux/boot/30-yunex-v3, requests a wake lock at boot and launches the polling worker. Android might still suspend it. Disable next-boot startup with:

~~~bash
rm ~/.termux/boot/30-yunex-v3
~~~

## Agent footage delivery protocol

First independently verify actual source author, license and reuse permission, including permission to publish edited clips through **public GitHub Releases**. YouTube visibility or an Issue description is not a licence. A new source must be added to sources_v3.json with reviewed rights evidence and approved by the repository owner; do not forge approved or reviewed_by metadata. The existing two test sources remain recognised. Use CC0, CC BY 3.0 or CC BY 4.0 only when verifiable for that exact work and comply with attribution.

An agent can generate a valid queue payload by running:

~~~bash
python production/phone_footage/agent_jobs_v3.py list
python production/phone_footage/agent_jobs_v3.py prepare --url 'https://www.youtube.com/watch?v=DqiKOr1aS9w' --start 0 --duration 6 --height 1080 --max-mb 45
~~~

The owner-authored GitHub Issue title must start with [YUNEX PHONE JOB], and its body must exactly follow this format:

~~~text
YUNEX_PHONE_JOB_V3
{"url":"https://www.youtube.com/watch?v=DqiKOr1aS9w","start":0,"duration":6,"height":1080,"max_mb":45}
~~~

After phone processing, locate the user-authored Issue comment beginning YUNEX_PHONE_DONE_V3. It has a machine-readable JSON block containing mp4_url, manifest_url, sha256, source license, requested offset/duration, pixel dimensions and full_decode: PASS. There are two real release assets: yunex-v3-ISSUE.mp4 and yunex-v3-ISSUE.json. Agent helper:

~~~bash
python production/phone_footage/agent_jobs_v3.py result --issue NUMBER
~~~

Only use completed, validated MP4 assets in edits. Treat YUNEX_PHONE_FAILED_V3 as failed footage, not deliverable. Failed issues need a fresh approved job after the problem is resolved.

## Honest limitations

- V3 currently handles authorised **YouTube landscape SDR** up to 1080p, 40 seconds, 80 MiB. It is not a 4K/HDR10 downloader, an unrestricted source downloader, or a full editing/rendering agent.
- Approval entries in the source registry must be evidence-backed; public-release rights can differ from private-use rights.
- The phone must actually run the worker; GitHub jobs alone do not wake Android.
- yt-dlp may be challenged by YouTube; network/format availability is not assured for every source.
- Temporary source fragments can briefly be bigger than final MP4. Hard Android kills may leave stale temp directories until later cleanup.
- CI offline tests do not establish real S25 V3 acquisition. That requires a new confirmed mobile MP4 release.

CI: .github/workflows/s25-phone-worker-v3-tests.yml.
