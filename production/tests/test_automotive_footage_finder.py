"""Offline source-provider fixtures + actual FFmpeg binary video QA."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "production" / "footage_finder"))
from finder import (allowed_media_url, crop_9_16, parse_pexels, parse_pixabay, search,
                    inspect, strip_audio, make_proof, detect_scenes, package)

PEXELS = {"videos": [{
    "id": 7, "url": "https://www.pexels.com/video/example-7/", "duration": 10,
    "user": {"name": "Studio"}, "video_files": [
        {"width": 1920, "height": 1080, "file_type": "video/mp4",
         "link": "https://player.vimeo.com/external/example.mp4", "fps": 24},
        {"width": 3840, "height": 2160, "file_type": "video/mp4",
         "link": "https://videos.pexels.com/video-files/7/7-uhd.mp4", "fps": 30},
        {"width": 4096, "height": 2160, "file_type": "application/x-mpegURL",
         "link": "https://videos.pexels.com/hls/example.m3u8"}
    ]
}]}
PIXABAY = {"hits": [{
    "id": 125, "pageURL": "https://pixabay.com/videos/id-125/",
    "tags": "Koenigsegg, hypercar, night", "user": "Maker", "duration": 12,
    "videos": {
        "medium": {"url": "https://cdn.pixabay.com/video/a-medium.mp4",
                   "width": 1920, "height": 1080, "size": 200},
        "large": {"url": "https://cdn.pixabay.com/video/a-large.mp4",
                  "width": 3840, "height": 2160, "size": 333}
    }
}]}


class FootageFinderTests(unittest.TestCase):
    def test_actual_vertical_crop_not_fake_1080(self):
        self.assertFalse(crop_9_16(1920, 1080)["safe1080x1920"])
        self.assertAlmostEqual(crop_9_16(1920, 1080)["scale"], 0.562, places=2)
        self.assertTrue(crop_9_16(3840, 2160)["safe1080x1920"])
        self.assertEqual(crop_9_16(3840, 2160)["cropWidth"], 1215)
        self.assertTrue(crop_9_16(1080, 1920)["safe1080x1920"])
        self.assertFalse(crop_9_16(0, 0)["safe1080x1920"])

    def test_downloads_only_from_approved_media_hosts(self):
        for url in (
            "http://videos.pexels.com/example.mp4",
            "https://cdn.pixabay.com.attacker.net/file.mp4",
            "https://127.0.0.1/admin", "file:///etc/passwd",
            "https://someone:password@videos.pexels.com/secret",
            "https://videos.pexels.com:8080/video.mp4",
        ):
            with self.subTest(url=url):
                self.assertFalse(allowed_media_url(url))
        self.assertTrue(allowed_media_url("https://videos.pexels.com/v.mp4"))
        self.assertTrue(allowed_media_url("https://cdn.pixabay.com/v.mp4"))
        self.assertTrue(allowed_media_url("https://player.vimeo.com/external/v.mp4"))

    def test_provider_normalisation_picks_best_real_crop(self):
        a, b = parse_pexels(PEXELS)[0], parse_pixabay(PIXABAY)[0]
        self.assertEqual((a.width, a.height, a.fps), (3840, 2160, 30))
        self.assertEqual((b.width, b.height), (3840, 2160))
        self.assertNotIn("file_url", a.report())
        self.assertFalse(a.report()["carIdentityVerified"])
        self.assertFalse(b.report()["licenceAndBrandRightsApproved"])

    def test_missing_keys_explicitly_block_search(self):
        hits, warnings = search("Apollo IE", "both", "", "", 20)
        self.assertEqual(hits, [])
        self.assertEqual(warnings, ["PEXELS_API_KEY_MISSING", "PIXABAY_API_KEY_MISSING"])

    @patch("finder.get_json")
    def test_two_provider_mocked_search(self, mocked):
        mocked.side_effect = [PEXELS, PIXABAY]
        hits, warnings = search("Koenigsegg hypercar", "both", "p-secret", "x-secret", 20)
        self.assertEqual(warnings, [])
        self.assertEqual(len(hits), 2)
        self.assertEqual(hits[0].provider, "Pixabay")
        self.assertNotIn("p-secret", repr([x.report() for x in hits]))

    def test_report_zip_does_not_contain_signed_media_urls(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder) / "out"
            clip = parse_pexels(PEXELS)[0].report()
            clip["status"] = "FOUND_NOT_DOWNLOADED"
            report = {"status": "SEARCH_RESULTS_REQUIRE_SELECTION",
                      "query": "Jesko <Attack>", "candidates": [clip]}
            zipfile = package(root, report)
            self.assertTrue(zipfile.is_file())
            self.assertNotIn("videos.pexels.com", (root / "manifest.json").read_text())
            self.assertIn("Jesko &lt;Attack&gt;", (root / "index.html").read_text())

    def test_real_ffmpeg_file_probe_video_only_copy_and_proof(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            original, quiet = root / "synthetic.mp4", root / "quiet.mp4"
            subprocess.run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "lavfi", "-i", "testsrc2=size=320x568:rate=30:duration=2.2",
                "-f", "lavfi", "-i", "sine=frequency=440:duration=2.2",
                "-c:v", "mpeg4", "-q:v", "5", "-c:a", "aac", "-shortest", str(original)
            ], check=True, timeout=90)
            before = inspect(original)
            self.assertEqual((before["width"], before["height"], before["fps"]), (320, 568, 30))
            strip_audio(original, quiet)
            after = inspect(quiet)
            self.assertEqual((before["width"], before["height"], before["codec"]),
                             (after["width"], after["height"], after["codec"]))
            self.assertNotEqual(before["sha256"], after["sha256"])
            proof = make_proof(quiet, root / "proof", after["duration"], "synthetic")
            self.assertTrue((root / proof["contactSheet"]).exists())
            self.assertEqual(len(proof["frameHashes"]), 3)
            self.assertIn(detect_scenes(quiet)["status"], ("PASS","DEPENDENCY_UNAVAILABLE"))


if __name__ == "__main__":
    unittest.main()
