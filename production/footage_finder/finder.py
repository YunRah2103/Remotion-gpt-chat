#!/usr/bin/env python3
"""Search approved stock video APIs, download safe originals, inspect footage and package ZIP.

No media identity, rights or shot-uniqueness claims are made automatically.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from dataclasses import dataclass, asdict
from fractions import Fraction
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageStat

CHUNK = 1024 * 1024
HOSTS = {"player.vimeo.com", "videos.pexels.com", "cdn.pixabay.com"}
HOST_SUFFIXES = (".vimeocdn.com", ".akamaized.net", ".pexels.com", ".pixabay.com")


def allowed_media_url(url: str) -> bool:
    try:
        p = urllib.parse.urlsplit(url)
        host = (p.hostname or "").lower()
        return p.scheme == "https" and p.username is None and p.password is None and p.port in (None, 443) and (
            host in HOSTS or any(host.endswith(s) and host != s[1:] for s in HOST_SUFFIXES))
    except ValueError:
        return False


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not allowed_media_url(newurl):
            raise ValueError("Media redirect not on an approved HTTPS provider CDN")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def get_json(url: str, params: dict, headers: dict | None = None) -> dict:
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params),
                                 headers={**(headers or {}), "User-Agent": "RemotionFootageFinder/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        # URLs can contain the Pixabay secret; never log URL or API body.
        raise RuntimeError(f"Provider HTTP {e.code}") from e
    except (urllib.error.URLError, TimeoutError) as e:
        raise RuntimeError("Provider network unavailable") from e


def crop_9_16(w: int, h: int) -> dict:
    if w <= 0 or h <= 0:
        return {"cropWidth": 0, "cropHeight": 0, "scale": 0, "safe1080x1920": False}
    cw, ch = min(w, h * 9 / 16), min(h, w * 16 / 9)
    scale = min(cw / 1080, ch / 1920)
    return {"cropWidth": int(cw), "cropHeight": int(ch), "scale": round(scale, 3),
            "safe1080x1920": scale >= 1.0}


@dataclass
class Candidate:
    id: str
    provider: str
    page: str
    creator: str
    tags: str
    duration: float
    width: int
    height: int
    fps: float
    file_url: str
    bytes_hint: int = 0
    score: float = 0

    def report(self) -> dict:
        c = asdict(self)
        c.pop("file_url")  # Do not store expiring Vimeo/Pexels token-bearing URLs.
        c["portraitCrop"] = crop_9_16(self.width, self.height)
        c["carIdentityVerified"] = False
        c["licenceAndBrandRightsApproved"] = False
        return c


def parse_pexels(data: dict) -> list[Candidate]:
    output = []
    for video in data.get("videos", []):
        versions = [f for f in video.get("video_files", []) if
                    isinstance(f.get("width"), int) and isinstance(f.get("height"), int) and
                    f.get("file_type") == "video/mp4" and allowed_media_url(f.get("link", ""))]
        if not versions:
            continue
        best = max(versions, key=lambda f: (crop_9_16(f["width"], f["height"])["scale"],
                                            f["width"] * f["height"]))
        output.append(Candidate(f"pexels-{video['id']}", "Pexels", video.get("url", ""),
                                video.get("user", {}).get("name", "unknown"), "",
                                float(video.get("duration") or 0),
                                best["width"], best["height"], float(best.get("fps") or 0),
                                best["link"]))
    return output


def parse_pixabay(data: dict) -> list[Candidate]:
    output = []
    for video in data.get("hits", []):
        versions = [f for f in video.get("videos", {}).values() if
                    isinstance(f, dict) and f.get("width", 0) > 0 and f.get("height", 0) > 0 and
                    allowed_media_url(f.get("url", ""))]
        if not versions:
            continue
        best = max(versions, key=lambda f: (crop_9_16(f["width"], f["height"])["scale"],
                                            f["width"] * f["height"]))
        output.append(Candidate(f"pixabay-{video['id']}", "Pixabay",
                                video.get("pageURL", ""), video.get("user", "unknown"),
                                video.get("tags", ""), float(video.get("duration") or 0),
                                best["width"], best["height"], 0.0, best["url"],
                                int(best.get("size") or 0)))
    return output


def search(query: str, providers: str, pexels_key: str, pixabay_key: str, per_provider: int):
    selected = ["Pexels", "Pixabay"] if providers == "both" else [providers]
    results, warnings = [], []
    if "Pexels" in selected:
        if not pexels_key:
            warnings.append("PEXELS_API_KEY_MISSING")
        else:
            try:
                results.extend(parse_pexels(get_json(
                    "https://api.pexels.com/v1/videos/search",
                    {"query": query, "per_page": min(per_provider, 80), "page": 1},
                    {"Authorization": pexels_key})))
            except (RuntimeError, ValueError, KeyError, TypeError) as e:
                warnings.append("PEXELS_SEARCH_FAILED: " + str(e))
    if "Pixabay" in selected:
        if not pixabay_key:
            warnings.append("PIXABAY_API_KEY_MISSING")
        else:
            try:
                results.extend(parse_pixabay(get_json(
                    "https://pixabay.com/api/videos/",
                    {"key": pixabay_key, "q": query[:100], "video_type": "film",
                     "safesearch": "true", "per_page": max(3, min(per_provider, 80))})))
            except (RuntimeError, ValueError, KeyError, TypeError) as e:
                warnings.append("PIXABAY_SEARCH_FAILED: " + str(e))
    unique = {c.id: c for c in results}
    words = [w for w in re.findall(r"[a-z0-9]+", query.lower()) if len(w) > 2]
    for c in unique.values():
        c.score = round(min(1.7, crop_9_16(c.width, c.height)["scale"]) * 5 +
                        sum(w in c.tags.lower() for w in words) * 0.5 +
                        (0.4 if c.height > c.width else 0) + (0.3 if c.duration > 3 else 0), 3)
    return sorted(unique.values(), key=lambda c: -c.score)[:100], warnings


def download(url: str, path: Path, byte_limit: int):
    if not allowed_media_url(url):
        raise ValueError("DOWNLOAD_URL_NOT_ALLOWED")
    opener = urllib.request.build_opener(SafeRedirect())
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with opener.open(urllib.request.Request(url, headers={"User-Agent": "RemotionFootageFinder/1.0"}), timeout=45) as r:
            if not allowed_media_url(r.geturl()):
                raise ValueError("UNTRUSTED_MEDIA_REDIRECT")
            if int(r.headers.get("Content-Length") or 0) > byte_limit:
                raise ValueError("PROVIDER_FILE_TOO_LARGE")
            count = 0
            with path.open("wb") as dst:
                while True:
                    chunk = r.read(CHUNK)
                    if not chunk:
                        break
                    count += len(chunk)
                    if count > byte_limit:
                        raise ValueError("CLIP_SIZE_LIMIT_EXCEEDED")
                    dst.write(chunk)
        if count < 5000:
            raise ValueError("FILE_EMPTY_OR_INVALID")
        return count
    except Exception:
        path.unlink(missing_ok=True)
        raise


def command(argv, timeout=120):
    return subprocess.run(argv, check=True, capture_output=True, text=True, timeout=timeout).stdout


def file_sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for data in iter(lambda: f.read(CHUNK), b""):
            h.update(data)
    return h.hexdigest()


def inspect(path: Path) -> dict:
    data = json.loads(command(["ffprobe", "-v", "error", "-show_streams", "-show_format",
                               "-of", "json", str(path)]))
    video = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    if not video:
        raise ValueError("NO_VIDEO_STREAM")
    try:
        fps = float(Fraction(video.get("avg_frame_rate", "0/1")))
    except (ValueError, ZeroDivisionError):
        fps = 0
    w, h = int(video.get("width") or 0), int(video.get("height") or 0)
    return {"width": w, "height": h, "fps": round(fps, 3),
            "duration": float(data.get("format", {}).get("duration") or 0),
            "codec": video.get("codec_name"), "bytes": path.stat().st_size,
            "sha256": file_sha(path), "portraitCrop": crop_9_16(w, h)}


def strip_audio(original: Path, output: Path):
    command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(original),
             "-map", "0:v:0", "-c:v", "copy", "-an", str(output)], 180)
    if output.stat().st_size < 5000:
        raise ValueError("REMUX_FAILED")


def dhash(image: Image.Image) -> int:
    img = image.convert("L").resize((9, 8))
    bits = 0
    for y in range(8):
        for x in range(8):
            bits = bits << 1 | int(img.getpixel((x, y)) > img.getpixel((x + 1, y)))
    return bits


def make_proof(path: Path, dest: Path, duration: float, label: str) -> dict:
    dest.mkdir(parents=True, exist_ok=True)
    frames, hashes = [], []
    for i, frac in enumerate((0.17, 0.5, 0.83)):
        p = dest / f"{label}-{i}.jpg"
        command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                 "-ss", str(round(duration * frac, 3)), "-i", str(path),
                 "-frames:v", "1", "-vf", "scale=800:-2", str(p)], 80)
        with Image.open(p) as img:
            frame = img.convert("RGB")
        frames.append(frame)
        hashes.append(dhash(frame))
    canvas = Image.new("RGB", (800, 660), (17, 19, 24))
    draw = ImageDraw.Draw(canvas)
    for i, frame in enumerate(frames):
        frame.thumbnail((250, 200))
        canvas.paste(frame, (15 + i * 263, 30))
        draw.text((15 + i * 263, 12), f"Sample {i+1}", fill="white")
    # Show all three plausible crop positions, not a false AI claim of subject tracking.
    mid = frames[1]
    w, h = mid.size
    cw, ch = min(w, int(h * 9 / 16)), min(h, int(w * 16 / 9))
    for i, side in enumerate((0.0, 0.5, 1.0)):
        x = int((w - cw) * side)
        crop = mid.crop((x, (h-ch)//2, x+cw, (h+ch)//2))
        canvas.paste(crop.resize((162, 288)), (95 + 245 * i, 275))
        draw.text((95+245*i, 575), ("LEFT","CENTER","RIGHT")[i] + " 9:16", fill="white")
    name = f"{label}-contact-sheet.jpg"
    canvas.save(dest/name, quality=88)
    a = frames[0].resize((64, 36)).convert("L")
    b = frames[2].resize((64, 36)).convert("L")
    diff = ImageStat.Stat(ImageChops.difference(a, b)).mean[0]
    return {"contactSheet": "proof/" + name, "frameHashes": [f"{h:016x}" for h in hashes],
            "temporalDifference": round(diff, 2), "possibleStatic": diff < 1.0,
            "cropNeedsHumanSubjectCheck": True}


def detect_scenes(path: Path) -> dict:
    try:
        from scenedetect import detect, AdaptiveDetector
        spans = detect(str(path), AdaptiveDetector(), show_progress=False)
        return {"status": "PASS", "spans": [
            {"in": round(a.get_seconds(), 3), "out": round(b.get_seconds(), 3)}
            for a, b in spans[:40]]}
    except ImportError:
        return {"status": "DEPENDENCY_UNAVAILABLE", "spans": []}
    except Exception as e:
        return {"status": "DETECTION_FAILED", "cause": type(e).__name__, "spans": []}


def output_html(report: dict) -> str:
    rows = []
    for c in report["candidates"]:
        cols = [c["id"], c["provider"], c["status"], c["width"], c["height"],
                c["portraitCrop"]["scale"], c["creator"]]
        link = html.escape(c["page"], quote=True)
        proof = html.escape(c.get("proof", {}).get("contactSheet", ""), quote=True)
        row = "".join("<td>"+html.escape(str(value))+"</td>" for value in cols)
        row += f'<td><a href="{link}">Source</a></td>'
        row += f'<td><a href="{proof}">Proof</a></td>' if proof else "<td>—</td>"
        rows.append("<tr>"+row+"</tr>")
    return ("<!doctype html><html lang='en'><meta charset='utf-8'>"
            "<title>Automotive Footage Finder</title><style>"
            "body{font:15px system-ui;background:#0a0e13;color:#ebeff6;padding:24px}"
            "table{border-collapse:collapse;width:100%}td,th{border:1px solid #404957;padding:8px}"
            "a{color:#8bc3ff}</style><h1>Automotive Footage Finder</h1><p>Status: "
            + html.escape(report["status"]) + " · Query: " + html.escape(report["query"]) + "</p>"
            + "<p>Footage providers: <a href='https://www.pexels.com/'>Pexels</a>, "
              "<a href='https://pixabay.com/'>Pixabay</a>. "
              "Model identity, same-car continuity, camera angles and publishing rights "
              "always require human review.</p>"
              "<table><tr><th>Asset ID</th><th>Provider</th><th>Technical status</th>"
              "<th>W</th><th>H</th><th>Crop scale</th><th>Creator</th>"
              "<th>Source</th><th>Contact sheet</th></tr>"
            + "".join(rows) + "</table></html>")


def package(output: Path, report: dict) -> Path:
    output.mkdir(parents=True, exist_ok=True)
    (output / "manifest.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    (output / "index.html").write_text(output_html(report))
    path = output.parent / "automotive-footage-finder.zip"
    with zipfile.ZipFile(path, "w", zipfile.ZIP_STORED) as archive:
        for file in sorted(output.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(output))
    return path


def execute(args) -> dict:
    query = args.query.strip()[:100]
    if not query:
        raise ValueError("QUERY_REQUIRED")
    root = Path(args.output).resolve()
    root.mkdir(parents=True, exist_ok=True)
    candidates, warnings = search(query, args.providers, os.getenv("PEXELS_API_KEY",""),
                                  os.getenv("PIXABAY_API_KEY",""), args.per_provider)
    report = {
        "query": query, "status": "SEARCH_RESULTS_REQUIRE_SELECTION", "warnings": warnings,
        "candidateCount": len(candidates), "downloadedSourceCount": 0,
        "approvedDistinctHeroVehicleShots": 0, "manualVehicleAndLicenceReviewRequired": True,
        "candidates": [], "targetDistinctShots": args.target_shots,
        "researchLinks": {
            "Pexels": "https://www.pexels.com/search/videos/" + urllib.parse.quote(query, safe="") + "/",
            "Pixabay": "https://pixabay.com/videos/search/" + urllib.parse.quote(query, safe="") + "/",
            "YouTubeResearchOnly": "https://www.youtube.com/results?search_query="
                                   + urllib.parse.quote(query + " cinematic 4k", safe=""),
        }}
    if not candidates:
        missing = [w for w in warnings if w.endswith("API_KEY_MISSING")]
        report["status"] = "CONFIGURATION_REQUIRED" if missing and len(missing) == (
            2 if args.providers == "both" else 1) else "NO_MATCHES_OR_PROVIDER_ERROR"
    selected, stored_bytes, sampled = 0, 0, []
    for c in candidates:
        item = c.report()
        if not args.download:
            item["status"] = "FOUND_NOT_DOWNLOADED"
        elif not args.rights_confirmed:
            item["status"] = "PERMISSION_CONFIRMATION_REQUIRED"
        elif selected >= args.max_clips:
            item["status"] = "NOT_DOWNLOADED_LIMIT_REACHED"
        elif not item["portraitCrop"]["safe1080x1920"]:
            item["status"] = "REJECTED_LOW_VERTICAL_RESOLUTION"
        elif c.bytes_hint and c.bytes_hint > args.max_clip_mb * CHUNK:
            item["status"] = "REJECTED_FILE_SIZE"
        else:
            try:
                temp = root / "sources" / (c.id + "-temp.mp4")
                size = download(c.file_url, temp, args.max_clip_mb * CHUNK)
                if stored_bytes + size > args.max_total_mb * CHUNK:
                    temp.unlink(missing_ok=True)
                    raise ValueError("TOTAL_DOWNLOAD_LIMIT_REACHED")
                actual = inspect(temp)
                item["actual"] = actual
                if not actual["portraitCrop"]["safe1080x1920"]:
                    item["status"] = "REJECTED_ACTUAL_VERTICAL_RESOLUTION"
                    temp.unlink(missing_ok=True)
                elif actual["fps"] < 23 or actual["duration"] < 1.3:
                    item["status"] = "REJECTED_TOO_SHORT_OR_LOW_FPS"
                    temp.unlink(missing_ok=True)
                else:
                    final = root / "sources" / (c.id + ".mp4")
                    strip_audio(temp, final)
                    temp.unlink(missing_ok=True)
                    item["sourceFile"] = "sources/" + final.name
                    item["preparedSha256"] = file_sha(final)
                    item["proof"] = make_proof(final, root / "proof", actual["duration"], c.id)
                    item["scenes"] = detect_scenes(final)
                    signature = int(item["proof"]["frameHashes"][1], 16)
                    duplicates = [id for id, previous in sampled
                                  if (signature ^ previous).bit_count() <= 5]
                    if duplicates:
                        item["status"] = "POSSIBLE_DUPLICATE_REQUIRES_REVIEW"
                        item["possibleDuplicates"] = duplicates
                    elif item["proof"]["possibleStatic"]:
                        item["status"] = "POSSIBLE_STATIC_REQUIRES_REVIEW"
                    else:
                        item["status"] = "TECHNICAL_PASS_MANUAL_IDENTITY_REVIEW"
                    sampled.append((c.id, signature))
                    selected += 1
                    stored_bytes += final.stat().st_size
            except (ValueError, OSError, RuntimeError, urllib.error.URLError,
                    subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
                item["status"] = "DOWNLOAD_OR_INSPECTION_FAILED"
                item["reason"] = str(e) if isinstance(e, ValueError) else type(e).__name__
        report["candidates"].append(item)
    report["downloadedSourceCount"] = selected
    if selected:
        report["status"] = ("SOURCES_DOWNLOADED_REQUIRE_HUMAN_REVIEW"
                            if selected >= args.target_shots else "PARTIAL_SOURCES_MORE_REQUIRED")
    elif candidates and args.download:
        report["status"] = ("PERMISSION_CONFIRMATION_REQUIRED"
                            if not args.rights_confirmed else "NO_USABLE_DOWNLOADS")
    package(root, report)
    return report


def cli():
    p = argparse.ArgumentParser(description="Discover and QA real stock car footage")
    p.add_argument("--query", required=True)
    p.add_argument("--providers", choices=["both", "Pexels", "Pixabay"], default="both")
    p.add_argument("--output", default="out/automotive-footage-finder")
    p.add_argument("--download", action="store_true")
    p.add_argument("--rights-confirmed", action="store_true")
    p.add_argument("--max-clips", type=int, default=6)
    p.add_argument("--per-provider", type=int, default=20)
    p.add_argument("--target-shots", type=int, default=11)
    p.add_argument("--max-clip-mb", type=int, default=120)
    p.add_argument("--max-total-mb", type=int, default=600)
    return p


if __name__ == "__main__":
    try:
        options = cli().parse_args()
        if not (1 <= options.max_clips <= 12 and 3 <= options.per_provider <= 80 and
                1 <= options.target_shots <= 50 and 25 <= options.max_clip_mb <= 500 and
                50 <= options.max_total_mb <= 1500):
            raise ValueError("INVALID_INPUT_LIMITS")
        result = execute(options)
        print(json.dumps({k: result[k] for k in ("query","status","candidateCount",
                                                  "downloadedSourceCount","warnings")}, indent=2))
        sys.exit(2 if result["status"] == "CONFIGURATION_REQUIRED" else 0)
    except Exception as error:
        # Never log API request URLs or tokens in exceptions.
        print("FOOTAGE_FINDER_FAILED: " + (str(error) if isinstance(error, ValueError)
                                          else type(error).__name__), file=sys.stderr)
        sys.exit(2)
