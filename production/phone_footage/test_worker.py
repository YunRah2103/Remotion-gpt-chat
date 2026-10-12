"""Offline CI tests: queue validation and real FFmpeg encoding with synthetic clip."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest import mock

PATH=Path(__file__).parent/"worker.py"
spec=importlib.util.spec_from_file_location("yunex_phone_worker",PATH)
worker=importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class PhoneWorkerTests(unittest.TestCase):
    def test_authorised_job_only(self):
        ok={"number":12,"body":worker.MARKER+"\n"+json.dumps({
            "url":worker.TEST_VIDEO,"seconds":6,"license":"CC-BY-3.0"})}
        self.assertEqual(worker.parse_job(ok)["seconds"],6)
        for changed in ({"url":"https://www.youtube.com/watch?v=UNAUTHORISED"},
                        {"seconds":120}, {"license":"unknown"}):
            sample=json.loads(ok["body"].split("\n",1)[1])
            sample.update(changed)
            self.assertIsNone(worker.parse_job({"body":worker.MARKER+"\n"+json.dumps(sample)}))
        self.assertIsNone(worker.parse_job({"body":"not a job"}))

    def test_car_clip_authorised_at_720p_or_lower(self):
        job={"url":worker.CAR_VIDEO,"seconds":6,"license":"CC-BY-3.0"}
        issue={"body":worker.MARKER+"\n"+json.dumps(job)}
        self.assertEqual(worker.parse_job(issue),job)
        with mock.patch.object(worker,"checked",side_effect=RuntimeError("stop before download")):
            with tempfile.TemporaryDirectory() as temp:
                with self.assertRaisesRegex(RuntimeError, "stop before download"):
                    worker.download_proof(Path(temp),job)
        self.assertTrue(worker.CAR_VIDEO.startswith("https://www.youtube.com/watch?v="))

    def test_1080p_jobs_require_registry_approval(self):
        car={"url":worker.CAR_VIDEO,"seconds":6,"license":"CC-BY-3.0","height":1080}
        bunny={**car,"url":worker.TEST_VIDEO}
        mk=lambda j: {"body":worker.MARKER_V2+"\n"+json.dumps(j)}
        self.assertEqual(worker.parse_job(mk(car)),car)
        self.assertIsNone(worker.parse_job({
            "body":worker.MARKER+"\n"+json.dumps(car)}))
        self.assertIsNone(worker.parse_job(mk(bunny)))
        for bad in (0, 360, 720.5, 2160, True):
            self.assertIsNone(worker.parse_job(mk({**car,"height":bad})))

    def test_registry_rejects_unreviewed_sources(self):
        with tempfile.TemporaryDirectory() as tmp:
            registry=Path(tmp)/"registry.json"
            registry.write_text(json.dumps({
                "https://malicious.example/watch?v=test":{
                    "license":"CC-BY-3.0","title":"test","author":"test",
                    "source":"https://malicious.example/watch?v=test",
                    "license_reference":"https://example.com/license","max_height":1080}}))
            with self.assertRaisesRegex(RuntimeError,"noncanonical"):
                worker.load_approved_sources(registry)

    def test_idempotence_uses_existing_release(self):
        fake_release={"assets":[{"browser_download_url":"https://example.com/old.mp4"}]}
        with mock.patch.object(worker,"api",return_value=fake_release):
            self.assertEqual(worker.previous_release_asset("secret",41),
                             "https://example.com/old.mp4")

    def test_owner_only_and_safe_queue(self):
        fake=[
          {"number":8,"title":"[YUNEX PHONE JOB] accepted","user":{"login":"YunRah2103"}},
          {"number":9,"title":"[YUNEX PHONE JOB] stranger","user":{"login":"stranger"}},
          {"number":10,"title":"Wrong prefix","user":{"login":"YunRah2103"}},
          {"number":11,"title":"[YUNEX PHONE JOB] pull request",
           "user":{"login":"YunRah2103"},"pull_request":{}}]
        with mock.patch.object(worker,"api",return_value=fake):
            self.assertEqual([x["number"] for x in worker.issue_jobs("test")],[8])

    def test_once_dry_run_does_not_download(self):
        job={"number":99,"title":"[YUNEX PHONE JOB] sample",
             "user":{"login":worker.OWNER},
             "body":worker.MARKER+"\n"+json.dumps({
                 "url":worker.TEST_VIDEO,"seconds":6,"license":"CC-BY-3.0"})}
        with mock.patch.object(worker,"issue_jobs",return_value=[job]), \
             mock.patch.object(worker,"already_reported",return_value=False), \
             mock.patch.object(worker,"previous_release_asset",return_value=None), \
             mock.patch.object(worker,"download_proof") as download:
            self.assertTrue(worker.run_once("dummy",True))
            download.assert_not_called()

    def test_real_mp4_validation_with_mocked_fetch(self):
        if not shutil.which("ffmpeg") or not shutil.which("ffprobe") or not shutil.which("node"):
            self.skipTest("CI must provide ffmpeg and node")
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)
            real_checked=worker.checked
            def fake_yt_dlp(command,timeout):
                if "-m" in command and "yt_dlp" in command:
                    subprocess.run([
                        "ffmpeg","-v","error","-y",
                        "-f","lavfi","-i","testsrc2=size=640x360:rate=24",
                        "-f","lavfi","-i","sine=frequency=440:sample_rate=44100",
                        "-t","6","-c:v","mpeg4","-q:v","5","-c:a","aac",
                        str(folder/"download.mp4")],check=True,timeout=30)
                    return ""
                return real_checked(command,timeout)
            with mock.patch.object(worker,"checked",side_effect=fake_yt_dlp):
                result,meta=worker.download_proof(folder)
            self.assertTrue(result.is_file())
            self.assertEqual((meta["width"],meta["height"]),(640,360))
            self.assertGreater(meta["bytes"],10000)
            self.assertEqual(meta["full_decode"],"PASS")
            self.assertTrue(4<=meta["duration"]<=7)

    def test_release_payload_and_binary(self):
        calls=[]
        def fake_api(method,path,token,payload=None,binary=None,content_type="application/json"):
            calls.append((method,path,payload,binary))
            if path.endswith("/releases"):
                return {"id":8642,"html_url":"https://github.com/test/releases"}
            return {"browser_download_url":"https://github.com/test/blob.mp4"}
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"verified-phone-proof.mp4"
            p.write_bytes(b"dummy-video-bytes")
            with mock.patch.object(worker,"api",side_effect=fake_api):
                asset,release=worker.upload_release("secret",32,p)
        self.assertEqual(calls[0][2]["tag_name"],"yunex-phone-proof-32")
        self.assertEqual(calls[1][3],b"dummy-video-bytes")
        self.assertIn("blob.mp4",asset)


if __name__=="__main__":
    unittest.main(verbosity=2)
