"""Offline QA for V3 queue rights, bounds, disk safety and delivery manifest."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("v3worker", HERE / "v3_worker.py")
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)


class WorkerV3Tests(unittest.TestCase):
    def setUp(self):
        self.url = v3.CAR_VIDEO
        self.issue = {"body": v3.MARKER + "\n" + json.dumps({
            "url": self.url, "start": 12.5, "duration": 14, "height": 1080,
            "max_mb": 50})}

    def test_registry_is_reviewed_and_v2_untouched(self):
        self.assertEqual(len(v3.LICENSED_PROOFS), 2)
        self.assertTrue(all(x["approved"] for x in v3.LICENSED_PROOFS.values()))
        self.assertTrue(all(x["reviewed_by"] == v3.OWNER for x in v3.LICENSED_PROOFS.values()))
        self.assertEqual(v3.parse_job(self.issue)["duration"], 14)

    def test_refuse_unreviewed_source_and_untrusted_marker(self):
        for bad in ({"url": "https://www.youtube.com/watch?v=UNAPPROVED"},
                    {"height": 2160}, {"max_mb": 999}, {"start": -1},
                    {"duration": 400}, {"duration": 0}, {"height": True},
                    {"duration": True}, {"max_mb": 1}, {"start": 3800},
                    {"command": "rm -rf /"}):
            payload = json.loads(self.issue["body"].split("\n", 1)[1])
            payload.update(bad)
            self.assertIsNone(v3.parse_job({"body": v3.MARKER + "\n" +
                                            json.dumps(payload)}), str(bad))
        for marker in ("YUNEX_PHONE_JOB_V1", "YUNEX_PHONE_JOB_V2"):
            self.assertIsNone(v3.parse_job({"body": marker + "\n" +
                                            self.issue["body"].split("\n", 1)[1]}))

    def test_720p_max_for_bunny(self):
        obj = json.loads(self.issue["body"].split("\n", 1)[1])
        obj["url"] = v3.TEST_VIDEO
        self.assertIsNone(v3.parse_job({"body": v3.MARKER + "\n" + json.dumps(obj)}))
        obj["height"] = 720
        self.assertIsNotNone(v3.parse_job({"body": v3.MARKER + "\n" + json.dumps(obj)}))

    def test_catalog_cannot_self_approve_in_job(self):
        with tempfile.TemporaryDirectory() as folder:
            registry = Path(folder) / "catalog.json"
            source = dict(v3.LICENSED_PROOFS[self.url])
            source["approved"] = False
            registry.write_text(json.dumps({self.url: source}))
            with self.assertRaisesRegex(RuntimeError, "approval metadata"):
                v3.load_approved_sources(registry)

    def test_owner_only_queue(self):
        records = [
            {"number": 11, "title": "[YUNEX PHONE JOB] valid",
             "user": {"login": v3.OWNER}},
            {"number": 12, "title": "[YUNEX PHONE JOB] not owner",
             "user": {"login": "unknown"}},
            {"number": 13, "title": "[YUNEX PHONE JOB] PR",
             "user": {"login": v3.OWNER}, "pull_request": { "url": "test" }},
        ]
        with mock.patch.object(v3, "api", return_value=records):
            self.assertEqual([x["number"] for x in v3.issue_jobs("token")], [11])

    def test_dry_run_is_safe(self):
        record = {**self.issue, "number": 51}
        with mock.patch.object(v3, "issue_jobs", return_value=[record]), \
             mock.patch.object(v3, "already_reported", return_value=False), \
             mock.patch.object(v3, "download_proof") as downloader:
            self.assertTrue(v3.run_once("fake", dry_run=True))
            downloader.assert_not_called()

    def test_workspaces_clean_only_own_expired_directories(self):
        with tempfile.TemporaryDirectory() as base:
            root = Path(base)
            recent = root / "yunex-v3-recent"
            recent.mkdir()
            old = root / "yunex-v3-old"
            old.mkdir()
            personal = root / "personal-video"
            personal.mkdir()
            import os
            import time
            os.utime(old, (time.time() - 90000, time.time() - 90000))
            with mock.patch.object(v3, "TEMP_ROOT", root):
                self.assertEqual(v3.cleanup_stale(), 1)
            self.assertFalse(old.exists())
            self.assertTrue(recent.exists())
            self.assertTrue(personal.exists())

    def test_real_synthetic_mp4_and_full_decode(self):
        if not all(shutil.which(x) for x in ("node", "ffmpeg", "ffprobe")):
            self.skipTest("ffmpeg and node required")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            genuine_watch = v3.watched
            def mock_download(command, timeout, folder):
                if "-m" in command and "yt_dlp" in command:
                    self.assertIn("--download-sections", command)
                    self.assertEqual(command[command.index("--download-sections")+1],
                                     "*0-6")
                    subprocess.run(["ffmpeg", "-y", "-v", "error",
                                    "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=24",
                                    "-f", "lavfi", "-i", "sine=frequency=350:sample_rate=44100",
                                    "-t", "6", "-c:v", "mpeg4", "-q:v", "8",
                                    "-c:a", "aac", str(root / "source.mp4")],
                                   check=True, timeout=55)
                else:
                    return genuine_watch(command, timeout, folder)
            job = {"url": v3.TEST_VIDEO, "start": 0.0, "duration": 6.0,
                   "height": 720, "max_mb": 45}
            with mock.patch.object(v3, "watched", side_effect=mock_download):
                movie, details = v3.download_proof(root, job)
            self.assertTrue(movie.is_file())
            self.assertEqual((details["width"], details["height"]), (640, 360))
            self.assertEqual(details["full_decode"], "PASS")
            self.assertGreater(details["bytes"], 5000)
            self.assertTrue(4.8 <= details["duration"] <= 7)

    def test_uploads_mp4_and_json_manifest(self):
        calls = []
        def fake_api(method, path, token, payload=None, binary=None,
                     content_type="application/json"):
            calls.append((method, path, payload, binary, content_type))
            if path.endswith("/releases"):
                return {"id": 123, "html_url": "https://github.com/release"}
            return {"browser_download_url": "https://github.com/asset"}
        job = v3.parse_job(self.issue)
        with tempfile.TemporaryDirectory() as tmp:
            media = Path(tmp) / "verified-phone-v3.mp4"
            media.write_bytes(b"fake-video-content")
            meta = {"sha256": "demo", "width": 1920, "height": 1080}
            with mock.patch.object(v3, "api", side_effect=fake_api):
                result = v3.upload_release("secret", 52, media, job, meta)
        self.assertEqual(len(calls), 3)
        self.assertEqual(calls[0][2]["tag_name"], "yunex-phone-v3-52")
        self.assertEqual(calls[1][3], b"fake-video-content")
        self.assertEqual(calls[2][4], "application/json")
        self.assertEqual(json.loads(calls[2][3])["schema"], "YUNEX_PHONE_RESULT_V3")
        self.assertIn("manifest_url", result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
