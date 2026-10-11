# Huracán STO — dummy-account YouTube cookies for GitHub Actions

The existing workflow (.github/workflows/sto-official-youtube-probe.yml) now
accepts an optional GitHub Actions secret named YOUTUBE_COOKIES_B64. No cookie
data has been supplied or stored in the repository.

## Android-only setup (no PC, no Base64)

1. Install **Firefox for Android** and use a separate Firefox profile or browser
   dedicated to the dummy YouTube account.
2. Open youtube.com in Firefox and sign into the dummy account.
3. Install **Get cookies.txt LOCALLY** from the official Firefox Android add-ons
   page: https://addons.mozilla.org/en-US/android/addon/get-cookies-txt-locally/
   (alternative: https://addons.mozilla.org/en-US/android/addon/cookies-txt/).
   Grant the add-on cookie/site permissions when prompted.
4. While viewing YouTube in Firefox, open the extension, choose the **Netscape**
   cookies.txt format and export only youtube.com cookies where supported.
5. Open the downloaded cookies.txt with a phone text editor and copy its entire
   text, starting at the `# Netscape HTTP Cookie File` header. Do **not** paste
   it in an AI chat, issue, source file or Git commit.
6. In your mobile browser open
   https://github.com/YunRah2103/Remotion-gpt-chat/settings/secrets/actions
   and choose **New repository secret** (enable browser Desktop site if settings
   controls are hidden):
   **Name:** `YOUTUBE_COOKIES_TXT`
   **Value:** paste the entire text from the export, including header/newlines.
   Save secret.
7. Ask the assistant to rerun the A-footage YouTube workflow and verify actual
   Full HD MP4 downloads. YouTube can still reject datacentre IP addresses.

**Mobile uses YOUTUBE_COOKIES_TXT directly. No encoding or PowerShell needed.**
The older YOUTUBE_COOKIES_B64 secret remains supported on desktop; if both are
configured, YOUTUBE_COOKIES_TXT takes precedence.

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
