# YUNEX Galaxy S25 Footage Bridge V4 — Up to 10 Minutes

Branch: experiments/s25-footage-worker-v4-10min-20261012

V4 is a separate experimental worker. Existing V1/V2/V3 and main are preserved.

**Agent guide:** [Canonical S25 V4 workflow on main](https://github.com/YunRah2103/Remotion-gpt-chat/blob/main/docs/YUNEX_S25_V4_AGENT_GUIDE.md). The licence-registration gate has been removed: the owner can queue a canonical YouTube watch URL **without** cataloging rights first. For unverified sources, the resulting MP4 is stored in an **owner-only GitHub draft Release**, never a public download. [Previous S25 YouTube PASS #55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55) used a permitted snowy-car test, **not** RS6 footage. The revised unregistered-source behaviour still requires a live S25 test.

## What changed

The **duration ceiling is 600 seconds (10 minutes)**; normal projects should still request short clips. Clips can begin at offsets up to 6 hours into the source. V4 supports landscape or portrait, up to genuine 1080p (not 4K or HDR).

- Output size defaults dynamically to 45 MiB for short clips and up to 510 MiB for 600-second clips; hard maximum 512 MiB per job.
- Working storage budget scales with requested output size up to 2,300 MiB. The worker requires that workspace budget plus 450 MiB free before starting, with at least 700 MiB for the smallest jobs. Download processes stop if phone free space drops under 400 MiB.
- Timeout scales with length (up to 50 minutes for downloading and 50 minutes for transcoding). Full FFmpeg decode and resolution/codec/duration checks are required.
- Large GitHub release MP4 uploads use file streaming instead of loading hundreds of megabytes into RAM.
- On normal completion, temporary media is deleted. On later startups, V4 clears only its own abandoned temporary folders older than 24h; personal videos are never intentionally removed.
- Agent handoff uses the existing owner-only GitHub issue queue, SHA256, JSON result manifest and verified MP4 Release assets. An agent can request **any valid canonical YouTube watch URL without adding source licence details**.
- The existing source catalog supplies **optional** verified CC licence metadata. A listed licensed source retains public-prerelease delivery with proper attribution. An **unlisted source gets an owner-only GitHub draft** with `rights_status: unverified`, no invented licence and no public MP4 URL. Downloading for private review is separate from permission to republish.

## Install or upgrade the existing V4 installation

**The already-running phone process cannot update its own Python code.** After this no-licence-registration change passes CI, stop the old V4 loop with **Ctrl+C**. Then use the same safe installer command once to update V4. It retains the existing private token and V1/V2 setup. Start the loop again with `~/yunex-v4 --loop` if you want to accept jobs.

With no other footage worker running, paste:

~~~bash
curl -fLsS https://raw.githubusercontent.com/YunRah2103/Remotion-gpt-chat/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/install_v4_termux.sh -o ~/yunex-install-v4.sh && bash ~/yunex-install-v4.sh
~~~

The installer updates the V4 Python worker, optional known-licence catalog and agent helper in their separate folder. It checks dependencies and prints a doctor report, but does **not** automatically download a video or restart the loop.

Later commands:

~~~bash
~/yunex-v4 --doctor
~/yunex-v4 --once
~/yunex-v4 --loop
~/yunex-v4 --clean
~~~

The --once command processes at most one queued authorized V4 issue. The --loop command checks every 60 seconds **while Termux is running**. The --clean command removes only stale V4 temporary folders. Android may suspend Termux in the background. V4 does not automatically start after restart; existing V3 optional Boot helper is still V3-specific.

## Agents: queue without licence registration

**The worker no longer requires licence/attribution details or a preapproved source entry just to accept a job.** Use an owner-created GitHub issue with exact marker `YUNEX_PHONE_JOB_V4`. The URL must be canonical HTTPS YouTube watch format, e.g. `https://www.youtube.com/watch?v=a38sqC7k2iw`. Convert share/playlist/timestamp links to this exact URL form. Do not use arbitrary hosts, `youtu.be`, non-YouTube MP4s, or custom query parameters.

Run the helper **from the V4 branch**; it only prints a valid issue body and does not submit the issue:

~~~bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=a38sqC7k2iw' \
  --start 20 --duration 12 --height 1080 --orientation landscape
~~~

Create an **open, owner-authored** issue titled `[YUNEX PHONE JOB] RS6 excerpt`, with the exact printed two-line body. Valid job bounds: 2–600 seconds, offset up to 21600 seconds, 720/1080p, landscape or portrait. For already-listed test sources, `sources_v3.json` still provides known attribution and any catalogue-specific height limit.

**Delivery classification:**

- **Listed with verified licensing:** phone writes a public prerelease, downloadable MP4 URL and JSON manifest with credit. Never misstate rights.
- **Unlisted/unknown rights (normal new RS6 case):** phone writes an **owner-only DRAFT Release**. The completed issue comment includes `YUNEX_PHONE_DONE_V4`, `release_visibility: draft`, `rights_status: unverified`, `release_id`, `mp4_asset_id`, `mp4_asset_api_url` and the verified SHA256. Public `mp4_url` is **null by design**, not a download failure.

Agents authorized for the repository may retrieve draft-release MP4 assets **using authenticated GitHub access**, for example in a GitHub Actions job with an appropriately permissioned `GH_TOKEN`:

~~~bash
gh release download "yunex-phone-v4-ISSUE_NUMBER" \
  --repo YunRah2103/Remotion-gpt-chat \
  --pattern "yunex-v4-ISSUE_NUMBER.mp4" --dir .
~~~

Replace `ISSUE_NUMBER` with the completed job number and supply a token with repository read permissions. If your environment cannot fetch draft assets, report that access limitation; do not treat an inaccessible public link as missing video and do not publish the draft to work around it.

The result helper can inspect a completed issue:

~~~bash
python production/phone_footage/agent_jobs_v4.py result --issue ISSUE_NUMBER
~~~

Then FFprobe, full-decode, hash-check, and **visually inspect** moving source frames before handing the editor a real asset. A queue issue, cloud anti-bot error or green workflow is not an acquired MP4. Permission to publicly post an edit containing a source is a separate rights decision; **do not publish rights-unverified draft footage**.

## Honest limits and testing

- **10 minutes is a maximum, not the default.** Requests for 601 seconds or more are refused.
- The output cap can reject complex high-bitrate 10-minute sources. Storage availability, source format and upload speed also matter.
- The job may use gigabytes of temporary phone storage, even though successful runs clean it afterward. Mobile data and GitHub storage consumption still occur.
- CI validates unregistered-source acceptance, strict YouTube URL validation, draft/private publication, 600-second maximum, adaptive storage, streaming upload, actual synthetic FFmpeg encode/decode and agent issue compatibility.
- No real full ten-minute YouTube download has yet been claimed. Validate with a permitted longer source on the Galaxy S25 when necessary. The phone worker only runs when started by the user or configured as a background process.

GitHub Actions: .github/workflows/s25-phone-worker-v4-tests.yml
