import json
import shutil
import socket
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "media-bridge"))
from bridge import (CheckedRedirect, demo, ident, safe_url, validated_request,
                    inspect_image, public_dns, download)


def request_data():
    return {
        "schemaVersion": 1,
        "request_id": "abs-rotor-001",
        "project": "abs-001",
        "purpose": "Find publicly licensed ABS disc brake reference photographs",
        "rights_confirmed": True,
        "items": [
            {"id": "rotor", "url": "https://upload.wikimedia.org/wikipedia/commons/photo.png",
             "type": "image", "license": "CC BY 4.0", "attribution": "Artist / Commons"}
        ],
    }


class MediaBridgeTests(unittest.TestCase):
    def test_ids(self):
        self.assertEqual(ident("abs-001"), "abs-001")
        for bad in ("../escape", "BadName", "a/b", "x" * 58, "", None):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                ident(bad)

    def test_url_allowlist_and_scheme(self):
        self.assertEqual(safe_url("https://upload.wikimedia.org/wikipedia/commons/test.png"),
                         "https://upload.wikimedia.org/wikipedia/commons/test.png")
        rejected = [
            "http://upload.wikimedia.org/file.png",
            "https://127.0.0.1/secrets",
            "https://169.254.169.254/latest/meta-data/",
            "https://upload.wikimedia.org.evil.example/image.png",
            "https://user:pass@upload.wikimedia.org/file.png",
            "https://upload.wikimedia.org:8443/file.png",
            "https://evil.example/a.jpg",
            "file:///etc/passwd",
            "https://upload.wikimedia.org/image.png#fragment",
            "https://upload.wikimedia.org/",
        ]
        for url in rejected:
            with self.subTest(url=url), self.assertRaises(ValueError):
                safe_url(url)

    def test_request_rules(self):
        self.assertEqual(validated_request(request_data())["request_id"], "abs-rotor-001")
        bad = request_data()
        bad["rights_confirmed"] = False
        with self.assertRaisesRegex(ValueError, "rights_confirmed"):
            validated_request(bad)
        bad = request_data()
        bad["items"][0]["attribution"] = ""
        with self.assertRaises(ValueError):
            validated_request(bad)
        bad = request_data()
        bad["items"][0]["url"] = "https://evil.example/photo.jpg"
        with self.assertRaises(ValueError):
            validated_request(bad)
        bad = request_data()
        bad["items"] = bad["items"] * 7
        with self.assertRaises(ValueError):
            validated_request(bad)

    def test_dns_private_blocked(self):
        with patch("bridge.socket.getaddrinfo", return_value=[(socket.AF_INET, 0, 0, "",
                                                               ("10.0.0.4", 443))]):
            with self.assertRaisesRegex(ValueError, "Non-public"):
                public_dns("upload.wikimedia.org")
        with patch("bridge.socket.getaddrinfo", return_value=[(socket.AF_INET, 0, 0, "",
                                                               ("1.1.1.1", 443))]):
            public_dns("upload.wikimedia.org")

    def test_redirect_to_untrusted_domain_rejected(self):
        handler = CheckedRedirect()
        from urllib.request import Request
        req = Request("https://github.com/owner/file")
        with self.assertRaises(ValueError):
            handler.redirect_request(req, None, 302, "Moved",
                                     {}, "http://169.254.169.254/")

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"),
                         "FFmpeg is installed by the dedicated Media Bridge workflow")
    def test_offline_image_and_video_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "proof"
            demo(output)
            manifest = json.loads((output / "manifest.json").read_text())
            self.assertEqual(len(manifest["items"]), 2)
            self.assertEqual(manifest["items"][0]["width"], 360)
            self.assertEqual(manifest["items"][1]["codec"], "h264")
            self.assertEqual(len(manifest["items"][1]["frames"]), 5)
            self.assertTrue((output / "contact-sheet.jpg").stat().st_size > 1000)
            self.assertEqual(len((output / "SHA256SUMS.txt").read_text().splitlines()),
                             len([p for p in output.rglob("*") if p.is_file()]) - 1)
            self.assertIn("Source:", (output / "INDEX.md").read_text())


if __name__ == "__main__":
    unittest.main()
