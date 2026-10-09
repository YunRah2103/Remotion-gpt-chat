#!/usr/bin/env python3
"""Constrained, reproducible public-media ingestion for the Automotive Engineering series.

Downloads ONLY direct HTTPS image/video objects from explicitly allowed public media hosts.
No login, cookies, site scraping, DRM bypass, private-network URLs or arbitrary redirects.
"""
import argparse
import hashlib
import ipaddress
import json
import re
import shutil
import socket
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

HOSTS = frozenset({
    "upload.wikimedia.org", "images.unsplash.com", "images.pexels.com",
    "videos.pexels.com", "cdn.pixabay.com", "videos.pixabay.com",
    "raw.githubusercontent.com", "media.githubusercontent.com",
    "user-images.githubusercontent.com", "github.com",
    "objects.githubusercontent.com", "release-assets.githubusercontent.com",
})
KINDS = {"image", "video"}
LICENSES = {"CC0", "CC BY 4.0", "CC BY-SA 4.0", "CC BY 3.0", "CC BY-SA 3.0",
            "Unsplash License", "Pexels License", "Pixabay Content License", "Public Domain",
            "Self-owned", "Permission Granted"}
MAX_ITEMS = 6
MAX_BYTES = {"image": 20 * 1024**2, "video": 80 * 1024**2}
MAX_TOTAL = 120 * 1024**2
MAX_SECONDS = 120
Image.MAX_IMAGE_PIXELS = 24_000_000


def ident(value):
    if not isinstance(value, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,55}", value):
        raise ValueError("IDs must be lowercase letters, digits or hyphens, max 56 characters")
    return value


def safe_url(value):
    if not isinstance(value, str) or len(value) > 1800:
        raise ValueError("Invalid URL length")
    u = urllib.parse.urlsplit(value)
    if u.scheme != "https" or not u.netloc or u.path in ("", "/") or u.fragment:
        raise ValueError("Only direct HTTPS media URLs with a path and no fragment are supported")
    if u.username or u.password or u.port not in (None, 443):
        raise ValueError("Credentials and non-standard ports are not allowed")
    host = (u.hostname or "").lower()
    if host not in HOSTS:
        raise ValueError("Host not allowed: " + host)
    return value


def public_dns(host):
    # An additional defense in depth: allowed hostnames must resolve to public IPs.
    ips = {answer[4][0] for answer in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
    if not ips or any(not ipaddress.ip_address(ip).is_global for ip in ips):
        raise ValueError("Non-public DNS address rejected for " + host)


class CheckedRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        newurl = urllib.parse.urljoin(req.full_url, newurl)
        safe_url(newurl)
        public_dns(urllib.parse.urlsplit(newurl).hostname)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def validated_request(data):
    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        raise ValueError("Request must have schemaVersion 1")
    request_id = ident(data.get("request_id"))
    project = ident(data.get("project"))
    purpose = data.get("purpose")
    if not isinstance(purpose, str) or not 8 <= len(purpose.strip()) <= 250:
        raise ValueError("A clear research purpose is required")
    if data.get("rights_confirmed") is not True:
        raise ValueError("rights_confirmed must be explicitly true")
    items = data.get("items")
    if not isinstance(items, list) or not 1 <= len(items) <= MAX_ITEMS:
        raise ValueError("Supply 1–6 media items")
    used = set()
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("Each media item must be an object")
        name = ident(item.get("id"))
        if name in used:
            raise ValueError("Duplicate media item ID")
        used.add(name)
        if item.get("type") not in KINDS:
            raise ValueError("type must be image or video")
        safe_url(item.get("url"))
        if item.get("license") not in LICENSES:
            raise ValueError("Provide a supported license/permission declaration")
        if item["license"] not in {"CC0", "Public Domain", "Self-owned"}:
            credit = item.get("attribution")
            if not isinstance(credit, str) or not 2 <= len(credit.strip()) <= 240:
                raise ValueError("Provide attribution/permission source for this license")
    return {"schemaVersion": 1, "request_id": request_id, "project": project,
            "purpose": purpose.strip(), "rights_confirmed": True, "items": items}


def download(url, destination, limit):
    safe_url(url)
    public_dns(urllib.parse.urlsplit(url).hostname)
    opener = urllib.request.build_opener(CheckedRedirect())
    request = urllib.request.Request(url, headers={"User-Agent": "AutomotiveEngineeringMediaBridge/1.0"})
    size = 0
    with opener.open(request, timeout=25) as response, Path(destination).open("wb") as output:
        # Blocks accidentally saving HTML login, anti-bot and error pages as media.
        mime = response.headers.get_content_type()
        if mime in {"text/html", "text/plain", "application/json", "application/xml", "text/xml"}:
            raise ValueError("Not a direct media download; received " + mime)
        length = response.headers.get("Content-Length")
        if length and int(length) > limit:
            raise ValueError("Remote item exceeds size limit")
        while True:
            chunk = response.read(min(256 * 1024, limit - size + 1))
            if not chunk:
                break
            size += len(chunk)
            if size > limit:
                raise ValueError("Media item exceeds download limit")
            output.write(chunk)
    if not size:
        raise ValueError("Empty downloaded file")
    return size


def run_cmd(command, timeout=90):
    return subprocess.run(command, check=True, timeout=timeout, capture_output=True, text=True)


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_image(source, name, root):
    with Image.open(source) as original:
        if original.format not in {"PNG", "JPEG", "WEBP"}:
            raise ValueError("Only actual PNG, JPEG and WebP images are supported")
        original.verify()
    with Image.open(source) as original:
        width, height = original.size
        if width * height > Image.MAX_IMAGE_PIXELS:
            raise ValueError("Image has too many pixels")
        im = ImageOps.exif_transpose(original).convert("RGB")
        im.thumbnail((720, 720))
        thumb = root / "thumbnails" / (name + ".jpg")
        thumb.parent.mkdir(parents=True, exist_ok=True)
        im.save(thumb, "JPEG", quality=85)
    return {"width": width, "height": height, "preview": str(thumb.relative_to(root))}, [thumb]


def inspect_video(source, name, root):
    probe = json.loads(run_cmd(["ffprobe", "-v", "error", "-show_streams",
                                "-show_format", "-of", "json", str(source)]).stdout)
    tracks = [s for s in probe.get("streams", []) if s.get("codec_type") == "video"]
    if len(tracks) != 1:
        raise ValueError("Video must have exactly one video stream")
    track = tracks[0]
    width, height = int(track["width"]), int(track["height"])
    duration = float(probe.get("format", {}).get("duration") or track.get("duration") or 0)
    if width < 16 or height < 16 or width * height > 3840 * 2160:
        raise ValueError("Unsupported video dimensions")
    if not 0 < duration <= MAX_SECONDS:
        raise ValueError("Video must be 0–120 seconds")
    if track.get("codec_name") not in {"h264", "hevc", "vp8", "vp9", "av1", "mpeg4"}:
        raise ValueError("Unsupported video codec")
    parts = track.get("avg_frame_rate", "0/1").split("/")
    fps = float(parts[0]) / max(1, float(parts[1]))
    if fps <= 0 or fps > 120:
        raise ValueError("Invalid frame rate")
    frames = root / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    previews = []
    for i, fraction in enumerate((0.1, 0.3, 0.5, 0.7, 0.9)):
        dest = frames / (name + "-%02d.jpg" % i)
        run_cmd(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                 "-ss", "%.3f" % (duration * fraction),
                 "-protocol_whitelist", "file", "-i", str(source),
                 "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "4",
                 str(dest)], timeout=100)
        if not dest.is_file() or not dest.stat().st_size:
            raise ValueError("Frame extraction failed")
        previews.append(dest)
    thumb = root / "thumbnails" / (name + ".jpg")
    thumb.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(previews[0], thumb)
    return {"width": width, "height": height, "seconds": round(duration, 3),
            "fps": round(fps, 3), "codec": track.get("codec_name"),
            "preview": str(thumb.relative_to(root)),
            "frames": [str(p.relative_to(root)) for p in previews]}, previews


def make_contact(images, root):
    if not images:
        raise ValueError("No previews generated")
    cols, tile_w, tile_h, gap = 4, 240, 200, 14
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGB", (gap + cols * (tile_w + gap),
                              gap + rows * (tile_h + 35 + gap)), "#19212a")
    pen = ImageDraw.Draw(sheet)
    for i, path in enumerate(images):
        with Image.open(path) as original:
            im = ImageOps.contain(original.convert("RGB"), (tile_w, tile_h))
        x = gap + (i % cols) * (tile_w + gap) + (tile_w - im.width) // 2
        y = gap + (i // cols) * (tile_h + 35 + gap)
        sheet.paste(im, (x, y))
        pen.text((x, y + tile_h + 7), path.stem[:35], fill="#f1f5f9")
    sheet.save(root / "contact-sheet.jpg", "JPEG", quality=86)


def process_item(item, root, local_source=None):
    kind, item_id = item["type"], ident(item["id"])
    temp = root / "source" / (item_id + ".download")
    temp.parent.mkdir(parents=True, exist_ok=True)
    if local_source:
        if Path(local_source).stat().st_size > MAX_BYTES[kind]:
            raise ValueError("Fixture exceeds size limit")
        shutil.copyfile(local_source, temp)
    else:
        download(item["url"], temp, MAX_BYTES[kind])
    if kind == "image":
        props, samples = inspect_image(temp, item_id, root)
        with Image.open(temp) as im:
            extension = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}[im.format]
    else:
        props, samples = inspect_video(temp, item_id, root)
        # Even when the original extension is unexpected, the media is validated by FFprobe.
        extension = ".mp4" if item["url"].lower().split("?")[0].endswith(".mp4") else ".video"
    final = temp.with_name(item_id + extension)
    temp.rename(final)
    record = {"id": item_id, "type": kind, "source_url": item["url"],
              "license": item["license"], "attribution": item.get("attribution", ""),
              "file": str(final.relative_to(root)), "bytes": final.stat().st_size,
              "sha256": sha256(final), **props}
    return record, samples


def finish(data, output, fixtures=None):
    root = Path(output)
    root.mkdir(parents=True, exist_ok=True)
    records, previews, total = [], [], 0
    for item in data["items"]:
        fixture = fixtures.get(item["id"]) if fixtures else None
        record, samples = process_item(item, root, fixture)
        total += record["bytes"]
        if total > MAX_TOTAL:
            raise ValueError("Total download exceeds 120 MB")
        records.append(record)
        previews.extend(samples)
    make_contact(previews, root)
    manifest = {"schemaVersion": 1, "request_id": data["request_id"],
                "project": data["project"], "purpose": data["purpose"],
                "rights_statement": "User has declared rights/permission; not independently verified.",
                "items": records, "totalSourceBytes": total}
    (root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    text = ["# GitHub Media Bridge — " + data["request_id"], "",
            "Media sources and previews are provided for research. License declarations are user-provided.",
            "Downloaded binaries are in source/; preview stills are in thumbnails/ and frames/.",
            "Contact sheet: contact-sheet.jpg", ""]
    for row in records:
        text.extend(["## " + row["id"], "Source: " + row["source_url"],
                     "License: " + row["license"], "Attribution: " + row["attribution"],
                     "Preview: " + row["preview"], "SHA256: " + row["sha256"], ""])
    (root / "INDEX.md").write_text("\n".join(text) + "\n")
    hashes = []
    for path in sorted(root.rglob("*")):
        if path.is_file() and path.name != "SHA256SUMS.txt":
            hashes.append(sha256(path) + "  " + str(path.relative_to(root)))
    (root / "SHA256SUMS.txt").write_text("\n".join(hashes) + "\n")
    print(json.dumps({"status": "PASS", "request": data["request_id"],
                      "items": len(records), "source_bytes": total,
                      "output": str(root), "contact_sheet": str(root / "contact-sheet.jpg")}))
    return manifest


def demo(output):
    # Genuine offline image and video media processing smoke test.
    with tempfile.TemporaryDirectory() as scratch:
        folder = Path(scratch)
        image = folder / "fixture.png"
        Image.new("RGB", (360, 240), "#337f96").save(image)
        video = folder / "fixture.mp4"
        run_cmd(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                 "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=12",
                 "-t", "1", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(video)])
        data = {"schemaVersion": 1, "request_id": "ci-demo", "project": "ci-demo",
                "purpose": "Offline end-to-end media processing test",
                "rights_confirmed": True, "items": [
                    {"id": "image", "type": "image", "url": "https://upload.wikimedia.org/demo.png",
                     "license": "Self-owned"},
                    {"id": "video", "type": "video", "url": "https://videos.pexels.com/demo.mp4",
                     "license": "Self-owned"}]}
        validated_request(data)
        manifest = finish(data, output, {"image": image, "video": video})
        assert len(manifest["items"]) == 2
        assert (Path(output) / "contact-sheet.jpg").is_file()
        assert len(list((Path(output) / "frames").glob("*.jpg"))) == 5


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--request", help="Path to versioned rights-declared request JSON")
    group.add_argument("--demo", action="store_true", help="No-network processing demonstration")
    parser.add_argument("--output", default="out/media-bridge")
    options = parser.parse_args()
    if options.demo:
        demo(options.output)
    else:
        path = Path(options.request)
        if not re.fullmatch(r"production/media-bridge/requests/[a-z0-9-]+\.json",
                            path.as_posix()):
            raise ValueError("Requests must reside in production/media-bridge/requests/<slug>.json")
        data = validated_request(json.loads(path.read_text()))
        if path.stem != data["request_id"]:
            raise ValueError("Request filename must equal request_id")
        finish(data, str(Path(options.output) / data["request_id"]))


if __name__ == "__main__":
    main()
