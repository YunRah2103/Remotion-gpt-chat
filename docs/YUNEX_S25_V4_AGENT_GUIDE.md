# YUNEX — S25 V4 Phone Worker: Agent Guide

**Repository:** [`YunRah2103/Remotion-gpt-chat`](https://github.com/YunRah2103/Remotion-gpt-chat) (never use the obsolete `yunus-video-lab` repository).

**Worker implementation branch:** [`experiments/s25-footage-worker-v4-10min-20261012`](https://github.com/YunRah2103/Remotion-gpt-chat/tree/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage).

**IMPORTANT UPDATE — 13 October 2026:** **YouTube jobs no longer require advance licence registration, a permission record, a rights-reviewed source-catalog entry or licence fields in the issue.** The worker still accepts **only jobs from GitHub account `YunRah2103`**, with strict URL, runtime, 1080p, disk and file-verification limits. Any source **without verified licence metadata** is automatically saved to an **owner-only DRAFT GitHub Release**, not publicly redistributed. Public publishing of third-party footage still requires appropriate rights.

## Agent decision and responsibilities

1. **Use working directly downloadable MP4s first** where appropriate (including existing original Audi RS6 filmmaker/manufacturer footage). If you need a **YouTube source**, use the S25 V4 worker rather than repeating an already-failed cloud YouTube download.
2. **Find quality moving footage**, confirm the car/model and exact source timecodes. Prepare a canonical HTTPS YouTube watch URL containing only the video ID, e.g. `https://www.youtube.com/watch?v=a38sqC7k2iw`. Normalised, valid video IDs are 11 characters; `youtu.be` links, additional `&t=` parameters, playlists, other hosts and direct MP4 URLs are not V4 job inputs.
3. **No licence entry or approval request is needed just to queue a job.** Do not claim or fabricate permission. The existing [`sources_v3.json`](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/sources_v3.json) is now used only for optional known verified licence metadata and a few source-specific quality limits.
4. **Create the GitHub issue** with the exact result of the V4 branch [`agent_jobs_v4.py`](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/agent_jobs_v4.py) helper:

   ```bash
   python production/phone_footage/agent_jobs_v4.py prepare --url 'https://www.youtube.com/watch?v=a38sqC7k2iw' --start 20 --duration 12 --height 1080 --orientation landscape
   ```

   The CLI **prints a two-line issue body only**. It does not create an issue or download media. Use a GitHub connector authenticated **as `YunRah2103`** to create an **open issue** with title starting `[YUNEX PHONE JOB]` and body exactly as generated:

   ```text
   YUNEX_PHONE_JOB_V4
   {"url":"https://www.youtube.com/watch?v=a38sqC7k2iw","start":20.0,"duration":12.0,"height":1080,"orientation":"landscape"}
   ```

   Agents using a non-owner GitHub account cannot make accepted jobs by copying this payload. Send a ready-to-post issue for the owner instead. **Do not impersonate the issue author or bypass the queue control.**
5. **Phone processing:** The Galaxy S25 already has V4 installed, but to activate this new no-registration behaviour the owner must **update the worker once** with the V4 installer **after stopping the old loop**. The old Python process cannot hot-reload code. If `~/yunex-v4 --loop` is active after updating, it polls approximately every 60 seconds. Creating an issue does not remotely start Termux. Agents must not ask for the phone's GitHub token or duplicate per-job installations.
6. **Wait for a real result** on the job issue:
   - `YUNEX_PHONE_DONE_V4`: verified H.264 MP4 uploaded, manifest/checksum, full FFmpeg decode PASS.
   - `YUNEX_PHONE_FAILED_V4`: actual phone-side error; stop retrying blindly and switch to another source or direct MP4.
   - `No pending approved V4 jobs` on the screen is the **legacy loop's idle text**, not a failed download. The newer worker prints `No pending approved V4 jobs` too, but accepts unlisted URLs once updated.

## Private vs public delivery (crucial)

| Source | Destination | Completion metadata | How agents access |
|---|---|---|---|
| Already in the verified CC source catalog | **Public GitHub prerelease** | `release_visibility: public_prerelease`, `mp4_url`, `license`, `sha256` | MP4 URL directly |
| Any other canonical YouTube video | **Owner-only draft Release** | `release_visibility: draft`, `rights_status: unverified`, `release_id`, `mp4_asset_id`, `mp4_asset_api_url`, `sha256`, `mp4_url: null` | Authenticated GitHub repository access; **not a public link** |

To retrieve an unverified draft MP4, the agent's GitHub Actions step can use an appropriately permissioned `GH_TOKEN`:

```bash
gh release download yunex-phone-v4-ISSUE_NUMBER --repo YunRah2103/Remotion-gpt-chat --pattern 'yunex-v4-ISSUE_NUMBER.mp4' --dir .
```

Replace `ISSUE_NUMBER` in both positions. Do not quote or expose access tokens in issues or logs. If your connector cannot access a draft's binary, use an authorized GitHub Actions step. **Never make the draft public merely for easier downloading.**

You may inspect the owner-authored issue comment, or run:

```bash
python production/phone_footage/agent_jobs_v4.py result --issue ISSUE_NUMBER
```

Then verify **actual playable bytes**, source framing, full FFmpeg decode, FFprobe dimensions, duration and SHA256. Handoff to production [RS6 issue #44](https://github.com/YunRah2103/Remotion-gpt-chat/issues/44) with job number, exact source/timecodes, acquired asset location, result metadata and visual QA verdict. A metadata report or an issue by itself is **not** the MP4.

## Limits and evidence

- Owner-authored GitHub issue only; strictly canonical YouTube watch URL. No licence-registration prerequisite for private draft review.
- Start `0–21600s`, clip length `2–600s` (ten-minute maximum), `720` or `1080` vertical resolution limit for landscape (width limit for portrait); no native 4K; 512 MiB output cap and phone free-space safeguards.
- **One phone job at a time**. Phone can stop to save battery; `Ctrl+C` stops the loop, `~/yunex-v4 --loop` starts it after installation.
- [**Actual S25 V4 PASS #55**](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55): approved **non-RS6** snowy-car YouTube clip, **1920×1080**, 8.008 seconds, 9,179,358 bytes, full-decoded H.264 MP4: [playable file](https://github.com/YunRah2103/Remotion-gpt-chat/releases/download/yunex-phone-v4-55/yunex-v4-55.mp4).
- The two *specific* RS6 YouTube URLs previously failed **old registry validation**, not phone download. The revised unregistered source workflow **still requires a real device-side test** before anyone can claim RS6 YouTube acquisition worked.
- **Rights are not assumed:** a successful private technical download is not permission to publicly publish the source or a finished edit using it.

**Read** the [detailed V4 README](https://github.com/YunRah2103/Remotion-gpt-chat/blob/experiments/s25-footage-worker-v4-10min-20261012/production/phone_footage/README_V4.md) and actual worker source for error handling. The guide does not authorize publishing someone else's content.
