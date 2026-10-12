# YUNEX S25 autonomous footage worker

**Status:** The V1 phone-download approach is proven by [job #39](https://github.com/YunRah2103/Remotion-gpt-chat/issues/39) and [car job #40](https://github.com/YunRah2103/Remotion-gpt-chat/issues/40). Both released six-second 1280×720 MP4 assets. This V2 branch adds controlled 1080p job support and stronger validation; actual 1080p phone download remains UNPROVEN. See [README_V2.md](README_V2.md).
This experimental branch does not change main.

## The goal

1. GPT-6 creates a GitHub issue containing an authorised video job.
2. Your Samsung Galaxy S25 automatically checks the queue using Termux and downloads that source over your phone connection with yt-dlp.
3. The phone checks the video using FFprobe and FFmpeg, uploads the licensed proof clip to a GitHub prerelease and comments on the issue with the playable link and SHA-256.
4. After one-time setup you never manually download individual clips, as long as Termux remains running and network/background restrictions permit it.

For safety and a clear first test, the worker accepts only the six-second Blender Foundation Big Buck Bunny sample licensed CC BY 3.0. It does not acquire arbitrary footage.

## One-time setup — Android, no PC

Install official [Termux from GitHub](https://github.com/termux/termux-app/releases) or [F-Droid](https://f-droid.org/packages/com.termux/) on the Galaxy S25.

Create a [GitHub fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) for only the YunRah2103/Remotion-gpt-chat repository. Assign **Issues: Read and write** and **Contents: Read and write**. Do not paste your token into ChatGPT.

In Termux:

~~~bash
pkg install -y curl
curl -fsSL https://raw.githubusercontent.com/YunRah2103/Remotion-gpt-chat/experiments/s25-autonomous-footage-worker-20261012/production/phone_footage/setup_termux.sh -o setup-yunex.sh
bash setup-yunex.sh
~~~

The script installs Python, Node.js, FFmpeg and yt-dlp/EJS. It will prompt you for the token and save it locally in Termux private storage, with mode 0600. No account token is uploaded to GitHub.

Check the queued job once:

~~~bash
python ~/yunex-phone-worker.py --once
~~~

Or, once it works, enable autonomous job checking every 60 seconds:

~~~bash
python ~/yunex-phone-worker.py --loop
~~~

Keep Termux running. Samsung Android battery optimisation may suspend the worker if the app is in the background. Later you can install [Termux:Boot](https://github.com/termux/termux-boot) to restart after boot, but don't rely on background operation until it is tested on this specific phone.

## Agent-created GitHub issue protocol

Issue title:

[YUNEX PHONE JOB] Big Buck Bunny 6-second autonomous phone proof

Issue body (the first line and JSON must match):

~~~text
YUNEX_PHONE_JOB_V1
{"url":"https://www.youtube.com/watch?v=YE7VzlLtp-4","seconds":6,"license":"CC-BY-3.0"}
~~~

The worker verifies the issue author, title, exact authorised video and duration. It ignores arbitrary links, unrecognised jobs, already-completed jobs and PRs. A successful job creates a public GitHub prerelease binary asset with the validated MP4 and posts a comment beginning with YUNEX_PHONE_DONE_V1. Failures receive YUNEX_PHONE_FAILED_V1.

## Verification

The CI test suite:

- Validates authorised issue selection, rejects unknown links and different authors.
- Verifies that --dry-run cannot download or upload footage.
- Creates a real synthetic 640x360 six-second clip using FFmpeg, remuxes/re-encodes it and validates native dimensions, duration and full decoder playback.
- Mocks the GitHub release asset upload and checks the binary sent is identical.

**Passing cloud CI proves the worker's logic, not that YouTube works through the S25.** Only the actual phone-run issue with a playable GitHub release asset counts as the mobile-network proof.

- [GitHub Actions offline smoke test](https://github.com/YunRah2103/Remotion-gpt-chat/actions/workflows/s25-phone-worker-tests.yml)
- [yt-dlp Termux installation](https://github.com/yt-dlp/yt-dlp/wiki/Installation)
- [yt-dlp YouTube EJS runtimes](https://github.com/yt-dlp/yt-dlp/wiki/EJS)
- [GitHub release asset API](https://docs.github.com/en/rest/releases/assets)

## Limitations

The result is a deliberately low-resolution SDR H.264/AAC six-second test, not a finished YUNEX edit or native HDR. The proof uploads only licensed short test media to a **public** GitHub repository; any future production version would need authorisation/rights checks and an appropriate nonpublic media destination. This system cannot be remotely installed or launched by an agent using only the GitHub connector. If the mobile network is also challenged by YouTube, the issue will report failure rather than claim success.
