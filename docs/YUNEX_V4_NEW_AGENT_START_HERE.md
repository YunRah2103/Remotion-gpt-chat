# YUNEX V4 — START HERE (new footage, audio and video agents)

**Read this before starting.** Repo: `YunRah2103/Remotion-gpt-chat` (**never** the old `yunus-video-lab`). Phone V4 implementation lives on branch `experiments/s25-footage-worker-v4-10min-20261012` under `production/phone_footage/`, **not main**.

**The S25 worker already works.** Phone downloads [#55](https://github.com/YunRah2103/Remotion-gpt-chat/issues/55) (approved car video) and [#56](https://github.com/YunRah2103/Remotion-gpt-chat/issues/56) (unregistered AutoTopNL RS6 video, **private draft**) passed. A [GitHub Actions import of real private #56 media also PASSED](https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38470166071). **Do not ask the user to attach it, reinstall Termux, share credentials or re-download existing footage.**

## Your first decision

| Assigned job | Start here | Deliver |
| --- | --- | --- |
| **Video editor / audio specialist** needs an existing phone asset | Find its `YUNEX_PHONE_DONE_V4` issue and use the reusable **GitHub Actions importer** below | Actual imported MP4/M4A **and the finished verified edit** |
| **Footage researcher** needs new driving shots | Search existing project assets and legitimate direct creator MP4s first; use V4 for needed YouTube clips | Real verified file, exact footage timecodes and quality assessment |
| **Phone job submitter** has a new YouTube URL | Generate the issue body using the **V4 branch** `agent_jobs_v4.py prepare` | An owner-authored open job; then the actual phone PASS asset |
| **QA/integration agent** checks delivery | Use the importer, inspect actual media and validate the required edit | SHA256 + FFprobe + full decode + visual/audio judgment + final artifact |
| **Worker maintainer** | Only when expressly assigned, consult V4 branch code/tests/safe installer | Tested code; **no claim** that a running phone updated itself |

**The worker acquires source media; it does not finish video editing.** An agent assigned to create an edit must render and inspect a new playable MP4, preserving already approved picture/music/loop unless the user says otherwise.

## A. Need an already downloaded source? One-step import

In **your own editing workflow**, use [the reusable V4 import action](../.github/actions/yunex-v4-import/action.yml). It reads the owner-authored issue completion, retrieves the **real private/public Release asset**, verifies **size, SHA256, FFprobe and full FFmpeg decode**, and gives you `asset_path` on the runner.

```yaml
permissions:
  contents: write # tested requirement for draft-release access in this repo
  issues: read
jobs:
  edit:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - id: phone
        uses: YunRah2103/Remotion-gpt-chat/.github/actions/yunex-v4-import@main
        with:
          issue_number: '56' # replace with the completed issue for THIS job
          token: ${{ github.token }}
      - name: Work with verified footage
        env:
          SOURCE_FILE: ${{ steps.phone.outputs.asset_path }}
        run: |
          test -s "$SOURCE_FILE"
          # Continue your real edit/mix here, in the same Actions job.
```

Outputs: `asset_path`, `media`, `sha256`, `rights_status`, `release_visibility`. For rights-unverified source media, **keep the source and draft private**; an import PASS does not authorise publication. Do not rewrite this importer or tell the user their existing source is inaccessible merely because your local workspace cannot reach `api.github.com`.

## B. Need a new YouTube download? Queue properly

1. Pick the **exact requested vehicle/action**, source and excerpt timecodes. Check that existing files/jobs do not already contain the needed footage. For accessible original creator MP4s, prefer the existing direct acquisition workflow.
2. Normalise the URL to `https://www.youtube.com/watch?v=VIDEO_ID` (11-character ID; no `youtu.be`, extra parameters or playlists).
3. On a checkout of **`experiments/s25-footage-worker-v4-10min-20261012`**, generate a job body (this **only prints text**):

   ```bash
   python production/phone_footage/agent_jobs_v4.py prepare \
     --url 'https://www.youtube.com/watch?v=Exq6pB3IGyU' \
     --start 8 --duration 13 --height 1080 --orientation landscape
   ```

   Engine/V8 audio only: add `--media audio` (produces AAC M4A instead of video; this feature is CI-tested but its live-phone operation must still be confirmed). For **source-verified genuine native UHD only**, optionally specify `--height 2160`; that is also CI-tested but **not yet phone-proven**. 1080p is the dependable default.
4. Create an **open issue** in this repo with title `[YUNEX PHONE JOB] <meaningful shot>`, body **exactly the generated two-line output**, starting `YUNEX_PHONE_JOB_V4`, **authored by `YunRah2103`**. Non-owner accounts cannot queue valid phone jobs; do not impersonate the owner. If your GitHub connection cannot author the required issue, provide the prepared body and report the specific permission blocker.
5. **No licence registration form is required to queue for private review.** Unverified-source footage is uploaded only to an owner-only **draft Release**; downloading does **not** grant redistribution or editing-publication rights.
6. Phone process `~/yunex-v4 --loop` handles eligible jobs **only while actually running**. A GitHub issue cannot turn Termux on remotely. Ask the owner to start the loop only when a valid job is queued and you have established it is stopped; never request another install/token.
7. Read `YUNEX_PHONE_DONE_V4` (success, manifest, SHA256, Release), or `YUNEX_PHONE_FAILED_V4` (real phone error). An idle message or queued GitHub issue **is not failure or success**. Then use the importer in section A.

**Limits:** 2–600 s, max start offset 21,600 s; 720/1080p video (default 1080p), optional *native* 2160p with larger resource costs, or `--media audio`. Only request 4K when native source pixels genuinely qualify; codecs may need editing-side conversion. See the [full guide](YUNEX_S25_V4_AGENT_GUIDE.md) for exact technical rules.

## C. Troubleshooting — don't send normal GitHub work back to the user

| Symptom | Response |
| --- | --- |
| `mp4_url: null` on a PASS draft | **Expected**: there is no public link. Use the shared importer with `contents: write` and `github.token`. |
| `release not found` or HTTP 403 | Check draft permissions, issue number, action output and authenticated GitHub Actions; do **not** publish the draft to fix access. |
| GitHub Actions YouTube says “not a bot” | That's a **cloud download failure**, not evidence the phone failed. |
| No pending V4 jobs | Normal idle state. Confirm issue title, author, marker, source format and whether Termux is running. |
| Audio-only / 4K request rejected | Confirm **the phone has the latest installed V4 code**, not merely that its GitHub branch passed CI. Do not silently replace with an inferior file. |
| You can fetch a source but not the approved picture master | Search GitHub Releases, workflow artifacts and the user’s Library before asking for another upload. |
| An agent claims “done” after creating a job/workflow | **Not done** until genuine media is downloaded, quality checked, and the assigned edit (if any) has a playable output. |

## Final handoff (one compact report)

```text
YUNEX V4 HANDOFF
Role / task: ...
Source + exact timecodes: ...
Phone issue / direct source: ...
Job result: queued | PASS | FAILED
Verified media: <exact MP4/M4A and authenticated asset/workflow location>
Quality: <codec/resolution/duration, and what was actually seen/heard>
Evidence: <SHA256, FFprobe/full decode, exact workflow run>
Rights: <verified permission or private/unverified>
Final edit: <playable MP4 artifact, or a specific unresolved blocker>
```

If the task was editing, **a verified source is only an input**, not the final deliverable. Avoid repeated status-only replies.

For more: [full V4 agent protocol](YUNEX_S25_V4_AGENT_GUIDE.md) · [task-triggered V4 agent skill](../.github/skills/yunex-v4-footage/SKILL.md) · [proven one-step importer](../.github/actions/yunex-v4-import/action.yml). **Do not modify the worker unless the user specifically requests worker maintenance.**
