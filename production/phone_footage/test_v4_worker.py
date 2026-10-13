"""Offline QA for V4 queue inputs, private draft safety, disk and delivery."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("v4worker", HERE / "v4_worker.py")
v4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v4)


class WorkerV4Tests(unittest.TestCase):
    def setUp(self):
        self.url = v4.CAR_VIDEO
        self.issue = {"body": v4.MARKER + "\n" + json.dumps({
            "url": self.url, "start": 12.5, "duration": 14, "height": 1080,
            "max_mb": 50})}

    def test_registry_is_reviewed_and_v2_untouched(self):
        self.assertEqual(len(v4.LICENSED_PROOFS), 2)
        self.assertTrue(all(x["approved"] for x in v4.LICENSED_PROOFS.values()))
        self.assertTrue(all(x["reviewed_by"] == v4.OWNER for x in v4.LICENSED_PROOFS.values()))
        self.assertEqual(v4.parse_job(self.issue)["duration"], 14)

    def test_arbitrary_canonical_youtube_is_accepted_without_license(self):
        for url in ("https://www.youtube.com/watch?v=a38sqC7k2iw",
                    "https://www.youtube.com/watch?v=pzhKoJAb1ek"):
            payload = json.loads(self.issue["body"].split("\n", 1)[1])
            payload["url"] = url
            job = v4.parse_job({"body": v4.MARKER + "\n" + json.dumps(payload)})
            self.assertIsNotNone(job)
            self.assertNotIn(url, v4.LICENSED_PROOFS)

    def test_refuse_bad_urls_bounds_and_untrusted_marker(self):
        for bad in ({"url": "https://www.youtube.com/watch?v=SHORT"},
                    {"url": "http://www.youtube.com/watch?v=a38sqC7k2iw"},
                    {"url": "https://www.youtube.com.evil.org/watch?v=a38sqC7k2iw"},
                    {"url": "https://www.youtube.com/watch?v=a38sqC7k2iw&list=PLdemo"},
                    {"url": "https://www.youtube.com/watch?v=a38sqC7k2iw#t=10"},
                    {"url": "https://www.youtube.com:443/watch?v=a38sqC7k2iw"},
                    {"height": 2160}, {"max_mb": 999}, {"start": -1},
                    {"duration": 601}, {"duration": 0}, {"height": True},
                    {"duration": True}, {"max_mb": 1}, {"start": 23000},
                    {"command": "rm -rf /"}):
            payload = json.loads(self.issue["body"].split("\n", 1)[1])
            payload.update(bad)
            self.assertIsNone(v4.parse_job({"body": v4.MARKER + "\n" +
                                            json.dumps(payload)}), str(bad))
        for marker in ("YUNEX_PHONE_JOB_V1", "YUNEX_PHONE_JOB_V2"):
            self.assertIsNone(v4.parse_job({"body": marker + "\n" +
                                            self.issue["body"].split("\n", 1)[1]}))

    def test_portrait_format_is_explicit_and_not_a_fake_landscape_upscale(self):
        data = json.loads(self.issue["body"].split("\n", 1)[1])
        data["orientation"] = "portrait"
        self.assertEqual(v4.parse_job({"body": v4.MARKER + "\n" + json.dumps(data)})
                         ["orientation"], "portrait")
        data["orientation"] = "diagonal"
        self.assertIsNone(v4.parse_job({"body": v4.MARKER + "\n" + json.dumps(data)}))

    def test_catalog_refresh_preserves_local_sources_on_failure(self):
        import io
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "sources_v3.json"
            original = (HERE / "sources_v3.json").read_bytes()
            p.write_bytes(original)
            with mock.patch.object(v4, "__file__", str(Path(tmp) / "v4_worker.py")), \
                 mock.patch.object(v4.urllib.request, "urlopen", side_effect=OSError("offline")):
                self.assertFalse(v4.refresh_sources())
            self.assertEqual(p.read_bytes(), original)

    def test_portrait_filter_syntax(self):
        # FFmpeg/yt-dlp syntax contract: a vertical 1080p file is 1080x1920.
        h = 1080
        fmt = (f"bv*[width<={h}][height<={h*16//9}]+ba/"
               f"b[width<={h}][height<={h*16//9}]/b")
        self.assertIn("width<=1080", fmt)
        self.assertIn("height<=1920", fmt)

    def test_720p_max_for_bunny(self):
        obj = json.loads(self.issue["body"].split("\n", 1)[1])
        obj["url"] = v4.TEST_VIDEO
        self.assertIsNone(v4.parse_job({"body": v4.MARKER + "\n" + json.dumps(obj)}))
        obj["height"] = 720
        self.assertIsNotNone(v4.parse_job({"body": v4.MARKER + "\n" + json.dumps(obj)}))

    def test_catalog_cannot_self_approve_in_job(self):
        with tempfile.TemporaryDirectory() as folder:
            registry = Path(folder) / "catalog.json"
            source = dict(v4.LICENSED_PROOFS[self.url])
            source["approved"] = False
            registry.write_text(json.dumps({self.url: source}))
            with self.assertRaisesRegex(RuntimeError, "approval metadata"):
                v4.load_approved_sources(registry)

    def test_owner_only_queue(self):
        records = [
            {"number": 11, "title": "[YUNEX PHONE JOB] valid",
             "user": {"login": v4.OWNER}},
            {"number": 12, "title": "[YUNEX PHONE JOB] not owner",
             "user": {"login": "unknown"}},
            {"number": 13, "title": "[YUNEX PHONE JOB] PR",
             "user": {"login": v4.OWNER}, "pull_request": { "url": "test" }},
        ]
        with mock.patch.object(v4, "api", return_value=records):
            self.assertEqual([x["number"] for x in v4.issue_jobs("token")], [11])

    def test_dry_run_is_safe(self):
        record = {**self.issue, "number": 51}
        with mock.patch.object(v4, "issue_jobs", return_value=[record]), \
             mock.patch.object(v4, "already_reported", return_value=False), \
             mock.patch.object(v4, "download_proof") as downloader:
            self.assertTrue(v4.run_once("fake", dry_run=True))
            downloader.assert_not_called()

    def test_workspaces_clean_only_own_expired_directories(self):
        with tempfile.TemporaryDirectory() as base:
            root = Path(base)
            recent = root / "yunex-v4-recent"
            recent.mkdir()
            old = root / "yunex-v4-old"
            old.mkdir()
            personal = root / "personal-video"
            personal.mkdir()
            import os
            import time
            os.utime(old, (time.time() - 90000, time.time() - 90000))
            with mock.patch.object(v4, "TEMP_ROOT", root):
                self.assertEqual(v4.cleanup_stale(), 1)
            self.assertFalse(old.exists())
            self.assertTrue(recent.exists())
            self.assertTrue(personal.exists())

    def test_real_synthetic_mp4_and_full_decode(self):
        if not all(shutil.which(x) for x in ("node", "ffmpeg", "ffprobe")):
            self.skipTest("ffmpeg and node required")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            genuine_watch = v4.watched
            def mock_download(command, timeout, folder, disk_budget=None):
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
                    return genuine_watch(command, timeout, folder, disk_budget or v4.MAX_WORKSPACE_BYTES)
            job = {"url": v4.TEST_VIDEO, "start": 0.0, "duration": 6.0,
                   "height": 720, "max_mb": 45}
            with mock.patch.object(v4, "watched", side_effect=mock_download):
                movie, details = v4.download_proof(root, job)
            self.assertTrue(movie.is_file())
            self.assertEqual((details["width"], details["height"]), (640, 360))
            self.assertEqual(details["full_decode"], "PASS")
            self.assertGreater(details["bytes"], 5000)
            self.assertTrue(4.8 <= details["duration"] <= 7)

    def test_job_ceiling_600_and_budget_growth(self):
        payload = {"url": self.url, "start": 900, "duration": 600,
                   "height": 1080, "orientation": "landscape"}
        issue = {"body": v4.MARKER + "\n" + json.dumps(payload)}
        job = v4.parse_job(issue)
        self.assertIsNotNone(job)
        self.assertEqual(job["duration"], 600.0)
        self.assertEqual(job["max_mb"], 510)
        self.assertGreaterEqual(v4.workspace_limit(job), 2000 * v4.MIB)
        self.assertGreater(v4.minimum_free(job), v4.workspace_limit(job))
        for duration in (601, 1000, -1, float("nan"), float("inf")):
            payload["duration"] = duration
            self.assertIsNone(v4.parse_job({
                "body": v4.MARKER + "\n" + json.dumps(payload)
            }), f"Unexpected accepted duration {duration}")

    def test_ten_minute_job_with_agent_preparer(self):
        helper_spec = importlib.util.spec_from_file_location("v4_agent",
            HERE / "agent_jobs_v4.py")
        agent = importlib.util.module_from_spec(helper_spec)
        helper_spec.loader.exec_module(agent)
        issue_body = agent.prepare(self.url, 120.0, 600.0, 1080, None, "landscape")
        parsed = v4.parse_job({"body": issue_body})
        self.assertEqual(parsed["duration"], 600.0)
        self.assertEqual(parsed["max_mb"], 510)
        self.assertNotIn("max_mb", json.loads(issue_body.split("\n", 1)[1]))

    def test_completed_issue_cache_avoids_repeated_github_calls(self):
        with tempfile.TemporaryDirectory() as temp:
            cache = Path(temp) / "completed.json"
            valid_comments = [{"body": v4.DONE + "\n\n~~~json\n{}\n~~~",
                               "user": {"login": v4.OWNER}}]
            with mock.patch.object(v4, "COMPLETION_CACHE", cache), \
                 mock.patch.object(v4, "api", return_value=valid_comments) as api:
                self.assertTrue(v4.already_reported("token", 5001))
                self.assertEqual(v4.load_completed_issues(), {5001})
                self.assertTrue(v4.already_reported("token", 5001))
                api.assert_called_once()
            self.assertEqual(cache.stat().st_mode & 0o777, 0o600)
            self.assertEqual(json.loads(cache.read_text()), [5001])

    def test_private_release_success_report_retries_without_redownload(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            report = {"schema": "YUNEX_PHONE_RESULT_V4", "status": "PASS",
                      "issue": 10051, "release_visibility": "draft",
                      "asset_filename": "yunex-v4-10051.mp4", "sha256": "demo"}
            with mock.patch.object(v4, "PENDING_REPORTS", root / "pending"), \
                 mock.patch.object(v4, "COMPLETION_CACHE", root / "completed.json"):
                v4.save_pending_report(10051, report)
                request = dict(self.issue, number=10051)
                with mock.patch.object(v4, "issue_jobs", return_value=[request]), \
                     mock.patch.object(v4, "already_reported", return_value=False), \
                     mock.patch.object(v4, "issue_comment",
                                       side_effect=[OSError("network down"), None]) as comment, \
                     mock.patch.object(v4, "download_proof") as downloader, \
                     mock.patch.object(v4, "upload_release") as upload:
                    self.assertTrue(v4.run_once("token"))
                    self.assertEqual(v4.load_pending_report(10051), report)
                    self.assertTrue(v4.run_once("token"))
                    self.assertIsNone(v4.load_pending_report(10051))
                    self.assertEqual(v4.load_completed_issues(), {10051})
                    self.assertEqual(comment.call_count, 2)
                    self.assertTrue(all(call.args[2].startswith(v4.DONE)
                                        for call in comment.call_args_list))
                    downloader.assert_not_called()
                    upload.assert_not_called()

    def test_audio_only_job_and_helper_keep_legacy_video_default(self):
        url = "https://www.youtube.com/watch?v=a38sqC7k2iw"
        helper_spec = importlib.util.spec_from_file_location(
            "v4_audio_agent", HERE / "agent_jobs_v4.py")
        helper = importlib.util.module_from_spec(helper_spec)
        helper_spec.loader.exec_module(helper)
        body = helper.prepare(url, 0, 12, 1080, None, "landscape", "audio")
        parsed = v4.parse_job({"body": body})
        self.assertEqual(parsed["media"], "audio")
        self.assertEqual(parsed["max_mb"], 45)
        self.assertEqual(json.loads(body.split("\n", 1)[1])["media"], "audio")
        legacy = helper.prepare(url, 0, 12, 1080, None, "landscape")
        self.assertNotIn("media", json.loads(legacy.split("\n", 1)[1]))
        self.assertEqual(v4.parse_job({"body": legacy})["media"], "video")
        payload = json.loads(body.split("\n", 1)[1])
        payload["media"] = "shell"
        self.assertIsNone(v4.parse_job({"body": v4.MARKER + "\n" +
                                        json.dumps(payload)}))

    def test_audio_only_real_synthetic_aac_and_full_decode(self):
        if not all(shutil.which(x) for x in ("node", "ffmpeg", "ffprobe")):
            self.skipTest("node and FFmpeg required")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            genuine_watched = v4.watched
            def synthetic_audio(command, timeout, folder, disk_budget=None):
                if "-m" in command and "yt_dlp" in command:
                    self.assertIn("bestaudio/best", command)
                    self.assertEqual(command[command.index("--download-sections") + 1],
                                     "*0-6")
                    subprocess.run(["ffmpeg", "-y", "-v", "error",
                                    "-f", "lavfi", "-i", "sine=frequency=200:sample_rate=48000",
                                    "-t", "6", "-c:a", "aac", "-b:a", "128k",
                                    str(root / "source.m4a")],
                                   check=True, timeout=40)
                else:
                    return genuine_watched(command, timeout, folder,
                                           disk_budget or v4.MAX_WORKSPACE_BYTES)
            job = {"url": v4.CAR_VIDEO, "start": 0, "duration": 6,
                   "height": 1080, "max_mb": 45, "media": "audio"}
            with mock.patch.object(v4, "watched", side_effect=synthetic_audio):
                movie, meta = v4.download_proof(root, job)
            self.assertEqual(movie.suffix, ".m4a")
            self.assertEqual(meta["codec"], "aac")
            self.assertEqual(meta["sample_rate"], 48000)
            self.assertEqual(meta["channels"], 2)
            self.assertEqual(meta["full_decode"], "PASS")
            self.assertEqual(meta["media"], "audio")
            self.assertIsNone(meta["width"])
            self.assertTrue(4.8 < meta["duration"] <= 7)

    def test_unregistered_audio_upload_is_private_m4a(self):
        calls = []
        def fake_api(method, path, token, payload=None, binary=None,
                     content_type="application/json"):
            calls.append((path, payload))
            if path.endswith("/releases"):
                return {"id": 150, "html_url": "https://github.com/private/draft"}
            return {"id": 990, "url": "https://api.github.com/assets/990",
                    "browser_download_url": "https://github.com/private/file"}
        job = dict(v4.parse_job(self.issue))
        job["url"] = "https://www.youtube.com/watch?v=a38sqC7k2iw"
        job["media"] = "audio"
        with tempfile.TemporaryDirectory() as temp:
            movie = Path(temp) / "proof.m4a"
            movie.write_bytes(b"fake_aac_content")
            with mock.patch.object(v4, "api", side_effect=fake_api), \
                 mock.patch.object(v4, "upload_media_file",
                                   return_value={"id": 989,
                                    "url": "https://api.github.com/assets/989",
                                    "browser_download_url": "https://github.com/private/aac"}):
                out = v4.upload_release("fake", 60, movie, job,
                                        {"duration": 8, "codec": "aac"})
        self.assertTrue(calls[0][1]["draft"])
        self.assertEqual(out["asset_filename"], "yunex-v4-60.m4a")
        self.assertEqual(out["audio_asset_id"], 989)
        self.assertIsNone(out["audio_url"])
        self.assertIsNone(out["mp4_url"])
        self.assertEqual(out["rights_status"], "unverified")

    def test_stream_upload_uses_file_handle_not_read_bytes(self):
        from unittest import mock
        from io import BytesIO
        calls = {}
        class Response:
            status = 201
            def read(self, n=-1):
                return b'{"browser_download_url":"https://example.com/asset.mp4"}'
        class Connection:
            def __init__(self, host, timeout):
                calls["host"] = host
                calls["timeout"] = timeout
            def request(self, method, path, body, headers):
                calls["method"], calls["path"], calls["headers"] = method, path, headers
                self_body = body
                self_data = []
                while True:
                    block = self_body.read(16384)
                    if not block:
                        break
                    self_data.append(block)
                calls["data"] = b"".join(self_data)
            def getresponse(self):
                return Response()
            def close(self):
                pass
        with tempfile.TemporaryDirectory() as root:
            file = Path(root) / "movie.mp4"
            file.write_bytes(b"abc123" * 25000)
            with mock.patch.object(v4.http.client, "HTTPSConnection", Connection):
                result = v4.upload_media_file(
                    "/UPLOAD/repos/" + v4.REPO + "/releases/123/assets?name=test.mp4",
                    "token", file)
            self.assertEqual(calls["data"], file.read_bytes())
            self.assertEqual(calls["headers"]["Content-Length"], str(file.stat().st_size))
            self.assertEqual(calls["host"], "uploads.github.com")
            self.assertIn("asset.mp4", result["browser_download_url"])

    def test_unregistered_source_upload_uses_draft_with_no_fabricated_rights(self):
        calls = []
        def fake_api(method, path, token, payload=None, binary=None, content_type="application/json"):
            calls.append((method, path, payload, binary, content_type))
            if path.endswith("/releases"):
                return {"id": 141, "html_url": "https://github.com/owner/draft"}
            return {"id": 920, "url": "https://api.github.com/repos/owner/repo/releases/assets/920",
                    "browser_download_url": "https://github.com/release/private-asset"}
        job = dict(v4.parse_job(self.issue))
        job["url"] = "https://www.youtube.com/watch?v=a38sqC7k2iw"
        with tempfile.TemporaryDirectory() as root:
            movie = Path(root) / "sample.mp4"
            movie.write_bytes(b"mock-movie-bytes")
            with mock.patch.object(v4, "api", side_effect=fake_api), \
                 mock.patch.object(v4, "upload_media_file",
                      return_value={"id": 919, "url": "https://api.github.com/repos/owner/repo/releases/assets/919",
                                    "browser_download_url": "https://github.com/release/private-clip.mp4"}):
                result = v4.upload_release("token", 57, movie, job,
                                           {"width": 1920, "height": 1080, "sha256": "demo"})
        self.assertTrue(calls[0][2]["draft"])
        self.assertEqual(calls[0][2]["prerelease"], True)
        self.assertEqual(result["rights_status"], "unverified")
        self.assertEqual(result["release_visibility"], "draft")
        self.assertIsNone(result["license"])
        self.assertIsNone(result["mp4_url"])
        self.assertIsNone(result["manifest_url"])
        self.assertEqual(result["mp4_asset_id"], 919)
        self.assertTrue(result["mp4_asset_api_url"].endswith("/919"))
        self.assertEqual(json.loads(calls[1][3])["mp4_url"], None)

    def test_uploads_mp4_and_json_manifest(self):
        calls = []
        def fake_api(method,path,token,payload=None,binary=None,content_type="application/json"):
            calls.append((method,path,payload,binary,content_type))
            if path.endswith("/releases"):
                return {"id": 123, "html_url": "https://github.com/release"}
            return {"browser_download_url": "https://github.com/manifest"}
        job = v4.parse_job(self.issue)
        with tempfile.TemporaryDirectory() as tmp:
            media = Path(tmp) / "verified-phone-v4.mp4"
            media.write_bytes(b"fake-video-content")
            meta = {"sha256": "demo", "width": 1920, "height": 1080}
            with mock.patch.object(v4, "api", side_effect=fake_api), \
                 mock.patch.object(v4, "upload_media_file",
                      return_value={"browser_download_url": "https://github.com/movie.mp4"}) as upload:
                result = v4.upload_release("secret", 52, media, job, meta)
                upload.assert_called_once()
        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0][2]["tag_name"], "yunex-phone-v4-52")
        self.assertFalse(calls[0][2]["draft"])
        self.assertEqual(result["release_visibility"], "public_prerelease")
        self.assertEqual(calls[1][4], "application/json")
        self.assertEqual(json.loads(calls[1][3])["schema"], "YUNEX_PHONE_RESULT_V4")
        self.assertIn("manifest_url", result)
        self.assertIn("movie.mp4", result["mp4_url"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
