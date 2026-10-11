# Huracán STO — dummy-account YouTube cookies for GitHub Actions

The existing workflow (.github/workflows/sto-official-youtube-probe.yml) now
accepts an optional GitHub Actions secret named YOUTUBE_COOKIES_B64. No cookie
data has been supplied or stored in the repository.

## Setup using your PC and dummy Google account

1. Sign in at youtube.com from a separate browser profile used with the dummy
   Google account.
2. Export **youtube.com** cookies to Netscape/Mozilla cookies.txt format.
   A reputable export method recommended by yt-dlp is the
   **Get cookies.txt LOCALLY** Chrome browser extension (not the old unsafe
   similarly named extension). Export *YouTube only*, not all browser cookies.
3. Save the file as youtube_cookies.txt in your Windows Downloads folder.
   The first line must be # Netscape HTTP Cookie File or # HTTP Cookie File.
4. In Windows PowerShell, run:

       $path = "$env:USERPROFILE\Downloads\youtube_cookies.txt"
       [Convert]::ToBase64String([IO.File]::ReadAllBytes($path)) | Set-Clipboard

   This copies the Base64 value to your Windows clipboard.
5. Open
   https://github.com/YunRah2103/Remotion-gpt-chat/settings/secrets/actions
   Select **New repository secret**.
   Name = YOUTUBE_COOKIES_B64.
   Value = paste the full clipboard string.
   Click Add secret.
6. Start a **new** workflow run of "STO Official YouTube original native
   source test" on the A-footage branch. If the branch-only workflow is not
   listed for manual Run workflow, trigger it via a new push to A-footage
   branch; ask the assistant to handle that part after adding the secret.
7. Check workflow artifact manifest and inspected image contact sheets:
   no false claim of 1080p/4K, no wrong Huracán model, no baked-in watermarks.

## Technical and security behavior

- Secret is decoded into $RUNNER_TEMP/sto-youtube-cookies.txt on the
  ephemeral runner, with 0600 permissions.
- yt-dlp receives --cookies pointing only to this temporary file.
- A workflow cleanup step deletes the cookie file even on failure.
- Cookies are never added to git, ZIP artifacts or public logs.
- Missing secret explicitly skips network attempts and reports
  COOKIE_SECRET_NOT_CONFIGURED.
- Base64 is encoding, NOT encryption; GitHub Actions secret encryption is the
  security mechanism.
- YouTube may still reject the run based on IP, bot checks or PO-token
  requirements. This is an experiment, not a guarantee.
- Never post the cookies or their Base64 value in GitHub issues or ChatGPT.

Documentation:
- https://github.com/yt-dlp/yt-dlp/wiki/FAQ
- https://github.com/yt-dlp/yt-dlp/wiki/Extractors
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
