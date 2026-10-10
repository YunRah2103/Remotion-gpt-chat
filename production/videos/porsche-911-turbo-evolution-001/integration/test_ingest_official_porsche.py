#!/usr/bin/env python3
"""Synthetic FFmpeg video test; does NOT authenticate Porsche identity or reuse rights."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import subprocess
import unittest

from ingest_bridge import digest
from ingest_official_porsche import official_inventory, SOURCE_PAGE

class OfficialPorscheBridgeTest(unittest.TestCase):
    def generate(self, root):
        mid="286306"
        original=root/f"porsche-newsroom-{mid}-original.mp4"
        subprocess.run(["ffmpeg","-hide_banner","-v","error","-y","-f","lavfi",
            "-i","testsrc2=size=1280x720:rate=25:duration=1",
            "-c:v","libx264","-preset","ultrafast","-crf","25",str(original)],
            check=True,timeout=50)
        report={
            "schemaVersion":1,"status":"MEDIA_ACQUIRED_PENDING_MANUAL_SCENE_REVIEW",
            "mediaId":mid,"sourcePageUrl":SOURCE_PAGE,
            "sourceUrl":"https://newstv.porsche.com/porschevideos/newstv.porsche.com_286306_en.mp4",
            "rightsStatus":"UNVERIFIED_PRIVATE_REVIEW","noTranscode":True,
            "uniqueShotCountVerified":0,"fullDecode":"PASS",
            "originalSha256":digest(original),"originalBytes":original.stat().st_size,
            "probe":{"width":1280,"height":720,"fps":25.0,"durationSeconds":1.0,"videoCodec":"h264"}
        }
        report_file=root/"source-qa.json"
        report_file.write_text(json.dumps(report),encoding="utf-8")
        return report,report_file,original

    def test_accept_valid_original_and_verify_not_30_shots(self):
        with TemporaryDirectory() as d:
            root=Path(d)
            r,p,o=self.generate(root)
            inventory=official_inventory(root)
            self.assertEqual(inventory['importedSources'],1)
            self.assertEqual(inventory['verifiedUniquePorscheShots'],0)
            self.assertEqual(inventory['sources'][0]['sourceFileSha256'],digest(o))
            self.assertEqual(inventory['sources'][0]['mediaId'],"286306")

    def test_reject_tampered_original_or_provenance(self):
        with TemporaryDirectory() as d:
            root=Path(d)
            r,p,o=self.generate(root)
            with o.open("ab") as handle:
                handle.write(b"tamper")
            with self.assertRaisesRegex(ValueError,"checksum mismatch"):
                official_inventory(root)
        with TemporaryDirectory() as d:
            root=Path(d)
            r,p,o=self.generate(root)
            r["sourceUrl"]="https://not-porsche.example.com/video.mp4"
            p.write_text(json.dumps(r))
            with self.assertRaisesRegex(ValueError,"source"):
                official_inventory(root)

    def test_reject_false_pass_and_absent_original(self):
        with TemporaryDirectory() as d:
            root=Path(d)
            r,p,o=self.generate(root)
            o.unlink()
            with self.assertRaisesRegex(ValueError,"missing"):
                official_inventory(root)
        with TemporaryDirectory() as d:
            root=Path(d)
            r,p,o=self.generate(root)
            r["fullDecode"]="NOT_CHECKED"
            p.write_text(json.dumps(r))
            with self.assertRaisesRegex(ValueError,"full decode"):
                official_inventory(root)

if __name__=="__main__":
    unittest.main()
