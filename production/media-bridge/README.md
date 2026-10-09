# GitHub Media Bridge — reusable image/video reference ingestion

This tool belongs **only** to \`YunRah2103/Remotion-gpt-chat\`. It does not access or copy YUNEX assets, and does not give ChatGPT extra native media tools.

## What it does

Normal ChatGPT agents with GitHub write access can create **text-only JSON requests**. The GitHub Actions runner then:

1. Fetches direct **public HTTPS image / video files** from preapproved media hosts.
2. Rejects unsupported hosts, private-network addresses, untrusted redirects, missing rights declarations, HTML pages and oversized files.
3. Inspects image dimensions or FFprobe-verified video tracks and duration.
4. Extracts five real JPEG frames per video (10%, 30%, 50%, 70%, 90%).
5. Produces thumbnails, a labeled contact sheet, a source/credit manifest, index and SHA256 checksums.
6. Uploads the original downloads and all previews together as a **14-day GitHub Actions artifact**.

This is reference-data plumbing, **not** an automatic web scraper, YouTube downloader, voice generator or AI vision engine. It does not bypass site authentication, streaming protections or DRM. The connected GitHub text-file reader cannot magically inspect binary images; agents need a tool that can visually open files or an existing image URL. Otherwise share the artifact link with the user and use the manifest/metadata for provenance.

## Route A — start from an ordinary ChatGPT agent

Create a new unique file on the default \`main\` branch (the GitHub connector's \`create_file\` tool can do this):

\`production/media-bridge/requests/abs-rotor-001.json\`

Example request (copy and edit, not a real verified image URL):

\`\`\`json
{
  "schemaVersion": 1,
  "request_id": "abs-rotor-001",
  "project": "abs-001",
  "purpose": "Educational reference for 3D ABS brake rotor and sensor modelling",
  "rights_confirmed": true,
  "items": [
    {
      "id": "brake-image",
      "type": "image",
      "url": "https://upload.wikimedia.org/REPLACE_WITH_REAL_PUBLIC_FILE.png",
      "license": "CC BY 4.0",
      "attribution": "Actual author and license/source URL"
    }
  ]
}
\`\`\`

The request is **data**, never shell code. When the file is committed to \`main\`, the **Production Suite - GitHub Media Bridge** workflow starts on that commit. The agent can then find its workflow run and artifact through the connected GitHub tools. Each saved asset includes provenance.

A later request must use **another unique filename** (for example, \`abs-rotor-002.json\`). To rerun an existing request, use Route B.

Do **not** write \`rights_confirmed: true\` unless the user has the rights or a source license actually permits the intended downloading/reuse. A source URL alone does not prove permission.

## Route B — manual dispatch

In GitHub, open **Actions → Production Suite - GitHub Media Bridge → Run workflow**. On the default branch, enter the path of a committed request JSON. Run and open the artifact once the workflow is successful.

## Results

GitHub Actions run artifact: \`media-bridge-<run_id>\` (14-day retention, subject to repository policies).

Within each request folder:

- \`source/<id>.<extension>\` — original downloaded image/video file.
- \`thumbnails/<id>.jpg\` — small visual preview.
- \`frames/<id>-00.jpg\` through \`-04.jpg\` — sampled real video frames.
- \`contact-sheet.jpg\` — multi-source/shot montage.
- \`manifest.json\` — URLs, declared license, author credit, dimensions, duration, SHA256.
- \`INDEX.md\` — text-only agent-readable summary.
- \`SHA256SUMS.txt\` — cryptographic inventory.

The agent can present **the real GitHub Actions artifact link** to the user. Nothing is automatically committed into Git history or published as a Release.

## Supported sources and safety rules

- Direct HTTPS media URLs, not HTML webpages or search pages.
- Fixed media hosts: \`upload.wikimedia.org\`, \`images.unsplash.com\`, \`images.pexels.com\`, \`videos.pexels.com\`, \`cdn.pixabay.com\`, \`videos.pixabay.com\`, and specific GitHub/GitHubusercontent hosts.
- Source image formats: PNG, JPEG, WebP. Videos: recognised FFprobe video streams with supported codecs.
- Up to **6 assets per request**; maximum **20 MiB/image**, **80 MiB/video**, **120 MiB/request**, **120 seconds/video**, maximum 4K video dimensions.
- Only declared permitted sources: public domain/CC, owned content, site license or explicitly granted permission.
- No arbitrary ports, HTTP, credentials, arbitrary URLs, untrusted redirects, private DNS addresses or networked FFmpeg protocols.
- No aggressive crawling, scraping, DRM circumvention, accounts, secrets or non-public media.
- Sources and their credit/rights remain the responsibility of the person requesting them. The workflow cannot independently verify ownership or license.

Because the repository is public, **do not submit confidential URLs, access tokens or private footage**. GitHub Actions logs, filenames and artifacts may be accessible to people with repository access.

## Commands for contributors

\`\`\`bash
# Validates all security rules and processes a request (network needed).
python production/media-bridge/bridge.py \
  --request production/media-bridge/requests/abs-rotor-001.json \
  --output out/media-bridge

# Genuine offline video + image extraction smoke test (requires FFmpeg and Pillow).
python production/media-bridge/bridge.py --demo --output out/media-bridge/ci-demo

# Security and end-to-end Python tests.
python -m unittest discover -s production/tests -p test_media_bridge.py -v
\`\`\`

## Improving explainers responsibly

Use the images only as properly licensed **reference**. Build original 3D assets in Blender/Three.js; do not silently copy another creator's footage directly into the released explanation. Cite source links and explain where the physical engineering is an approximation.

For actual licensed video incorporation, perform a separate explicit media/license review and controlled editing step. Downloading a file is not equivalent to permission to redistribute it.
