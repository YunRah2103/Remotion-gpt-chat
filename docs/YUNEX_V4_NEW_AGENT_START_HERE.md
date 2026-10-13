# YUNEX S25 V4 — START HERE (new AI agents)

**Your goal:** acquire the requested real video or engine audio, recover its actual GitHub asset, inspect it, and hand a **usable verified file** to the editor. **Do not stop after obtaining a URL or an issue number.**

**Canonical repo:** `YunRah2103/Remotion-gpt-chat` (not the old `yunus-video-lab`). **Worker source and CLI:** branch `experiments/s25-footage-worker-v4-10min-20261012`, directory `production/phone_footage/`. **Full protocol:** [YUNEX_S25_V4_AGENT_GUIDE.md](YUNEX_S25_V4_AGENT_GUIDE.md).

> **Already working:** S25 V4 is installed; YouTube phone downloads **#55** (approved car video) and **#56** (unregistered AutoTopNL RS6, draft) both passed. New `--media audio` is **CI-tested, not yet tested on the S25**. The user does not need to re-upload #56 or disclose their phone token. Do not assume the loop is currently running.

## Fastest path: use the reusable import action (no manual asset handling)

**For an already-completed phone job, use one GitHub Actions step.** The shared action [`.github/actions/yunex-v4-import/action.yml`](../.github/actions/yunex-v4-import/action.yml) reads the **owner-authored `YUNEX_PHONE_DONE_V4` issue comment**, downloads the real media from its GitHub draft/public Release, verifies **size, SHA256, FFprobe and full FFmpeg decode**, and gives the current editing job the verified absolute file path. It also handles missing FFmpeg on a standard Ubuntu runner.

For example, an audio or visual editing agent who needs existing RS6 job [#56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56) can **reuse it, not ask the user to attach it**:

```yaml
permissions:
  contents: write # proven requirement for owner-only draft assets
  issues: read
jobs:
  edit:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - id: phone
        uses: YunRah2103/Remotion-gpt-chat/.github/actions/yunex-v4-import@main
        with:
          issue_number: '56' # substitute the completed phone issue number
          token: ${{ github.token }}
      - name: Edit with the verified input
        shell: bash
        env:
          SOURCE_FILE: ${{ steps.phone.outputs.asset_path }}
        run: |
          test -s "$SOURCE_FILE"
          # Use "$SOURCE_FILE" in your actual FFmpeg/Remotion edit.
          # Keep unknown-rights footage inside your authorised private workflow.
```

The action outputs `asset_path`, `media` (`video` or `audio`), `sha256`, `rights_status` and `release_visibility`. This is **an import into the current runner**, not a lasting final edit or publication. Build the actual edit in the same job. Do not upload rights-unverified source footage as a publicly accessible artifact, publish the draft, or assume the user has authorised distribution.

**No need to implement GitHub's draft Release API repeatedly.** For a new job, create the owner-authored queue issue first, wait for `YUNEX_PHONE_DONE_V4`, then call this exact importer with its number. For direct filmmaker MP4 sources, continue using the existing direct-source route.

## A new agent's first 60 seconds

1. **Check what already exists:** search the project's GitHub issues, run artifacts and Releases for the requested shot, sound, or approved edit. For AutoTopNL RS6 **reuse [phone job #56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56)** (60 s, 1080p, draft tag `yunex-phone-v4-56`, asset `yunex-v4-56.mp4`). **Do not redownload it.**
2. **Choose the source route:** use a legitimate, direct original MP4 through GitHub Actions when available (including source 4K). Use S25 V4 for YouTube where the cloud downloader is blocked. **Optional native 4K** is now supported by the *latest* V4 code with explicit `--height 2160`; **1080p remains default**. 4K is CI-tested but not yet tested on the S25, so do not claim a phone 4K success until there is an actual completed UHD job.
3. **For a new YouTube URL:** determine the exact 2–600 s excerpt and canonical URL `https://www.youtube.com/watch?v=VIDEO_ID` (11-character ID; no `&t=`, `youtu.be`, playlists or other domains). **No licence form/registry entry is required for private review**. Rights-unverified footage remains in an owner-only *draft* Release. Do not publish it without verified permission.
4. **Generate the exact issue payload** using `agent_jobs_v4.py prepare` on the V4 branch; **this command only prints** the body. Create an open GitHub issue with title `[YUNEX PHONE JOB] <specific shot>`, exact two-line body starting `YUNEX_PHONE_JOB_V4`, **authenticated as account `YunRah2103`**. A non-owner's issue is ignored.
5. **Do not ask for another installation, token, or upload.** GitHub issue creation alone cannot remotely turn on Termux. If a correctly queued job needs the phone and the loop is actually stopped, the user can run `~/yunex-v4 --loop` once for that session. Default polling is ~120s; Android may suspend background Termux.
6. **Read the job's completion comment**: `YUNEX_PHONE_DONE_V4` is a validated GitHub Release asset, `YUNEX_PHONE_FAILED_V4` is a real failed phone attempt, idle messages are not failures. For draft jobs `mp4_url: null` is **normal**; use authenticated GitHub Actions to retrieve the asset bytes.
7. **Verify actual media** (size, SHA256 from DONE JSON, FFprobe, FFmpeg full decode, and visual inspection/listening). Deliver the real file/artifact location to the project, then finish the user's requested edit. **An agent who only has metadata has not acquired the file.**

## Copyable new-job examples

Run these **on the V4 branch** (never from `main`):

**Video excerpt, 1080p landscape:**

```bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=Exq6pB3IGyU' \
  --start 8 --duration 13 --height 1080 --orientation landscape
```

**Native 4K excerpt (requires a genuinely UHD source; no upscaling):**

```bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=VIDEO_ID' \
  --start 20 --duration 10 --height 2160 --orientation landscape
```

Replace `VIDEO_ID` with a real 11-character YouTube video ID for a verified 3840×2160 source. **Do not request 4K from the known 1080p-only AutoTopNL #56 recording.** Native 4K has a separate 1.5 GiB output cap and greater disk/data needs. V4 preserves original H.264/HEVC/VP9/AV1 streams in MP4; an editor may need to transcode the downloaded video in GitHub Actions if H.264 is required. 4K stream-copy may affect exact keyframe cut positions, so check the first/last frames. The current phone must be upgraded before 2160p requests will be accepted.

**Engine sound only (recommended for V8 audio edits; AAC M4A, not MP4):**

```bash
python production/phone_footage/agent_jobs_v4.py prepare \
  --url 'https://www.youtube.com/watch?v=Exq6pB3IGyU' \
  --start 8 --duration 13 --media audio
```

Examples use an **existing** AutoTopNL source for illustration; before creating a job, check whether [#56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56) already supplies the relevant segment. For new sources replace URL and exact timecodes. The helper emits the issue body; use your GitHub connector to **create** the owner-authored issue. Don't claim a queued job is a completed download.

## How to recover a private draft without asking the user

**The fix is confirmed in [GitHub Actions run #38441894486](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38441894486).** `contents: read` got HTTP 403 for draft #56, but a workflow with **`contents: write`** and its built-in `github.token` successfully downloaded the media. Use this permission **only in workflows needing draft Release access**; no personal token or public release is required.

In the *specific* authenticated Actions job:

```yaml
permissions:
  contents: write
jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Recover private phone footage (example: job 56)
        env:
          GH_TOKEN: ${{ github.token }}
        shell: bash
        run: |
          set -euo pipefail
          mkdir -p work
          gh release download yunex-phone-v4-56 \
            --repo YunRah2103/Remotion-gpt-chat \
            --pattern 'yunex-v4-56.mp4' --dir work
          test "$(stat -c%s work/yunex-v4-56.mp4)" -eq 15340800
          echo '812fd32410f89a2fd67ddfe7ca0a0a28c4ddfdb617def14da0a788efde8e6ef9  work/yunex-v4-56.mp4' | sha256sum -c -
          ffprobe -v error -show_streams -show_format work/yunex-v4-56.mp4
          ffmpeg -v error -xerror -i work/yunex-v4-56.mp4 -f null -
```

For another job, use **its own** `release_id`, `asset_filename`, `sha256` and tag `yunex-phone-v4-ISSUE_NUMBER` from the `DONE` comment (e.g., `.m4a` for audio jobs). Avoid blindly copying the #56 checksum or 15,340,800-byte size. Download within the authorised editing workflow; keep unverified source footage private. **Do not publish a draft just to obtain a public URL.**

## Fast troubleshooting table

| Situation | Meaning / action |
|---|---|
| `No pending approved V4 jobs` / `V4 idle` | Worker is polling but finds no eligible new issue; not a download failure |
| Cloud GitHub Actions YouTube `Sign in to confirm you're not a bot` | Cloud downloader failed; **does not** mean S25 failed; use approved job protocol |
| Phone refuses a queued issue | Confirm owner login, issue open/title, marker, canonical URL, numeric time bounds, and whether the phone uses an updated V4 installation. **2160p requires the latest V4 code on the phone** |
| `release not found` or draft asset HTTP 403 | Check the Release **is a draft**; use `contents: write` with built-in token in Actions, as proven on #56 |
| `mp4_url: null` for a draft | Intentional: retrieve `asset_filename` from private draft; no public link |
| `YUNEX_PHONE_FAILED_V4` | Read the actual error; do not repeat the same failing approach forever |
| Agent has the source but not the approved edit | Search existing GitHub artifacts/Releases and the project's ChatGPT Library; do not ask for an upload before checking |
| New audio-only job | Expects AAC `.m4a`; feature passed CI but still requires a first live-device proof |
| New native 4K job | Set `--height 2160` only on verified UHD footage; no upscaling, 1.5 GiB output cap, potentially more disk/battery. Real 4K FFmpeg test PASS in CI; **phone UHD download not yet proven** |

## Definition of done

Give the project/editor **real video or audio bytes**, original source and excerpt timecodes, **downloadable authenticated asset/workflow artifact**, SHA256/FFprobe/full-decode evidence, visual/audio assessment and any rights limits. If delivering a finished edit, **protect approved footage/music/timing unless specifically asked to change them**, and provide an actual playable final MP4, not merely source code or a promise.

**For full details and update/Termux instructions, read the [canonical V4 guide](YUNEX_S25_V4_AGENT_GUIDE.md).** This quick-start is for **new agents**, not a new worker or a new installation.
