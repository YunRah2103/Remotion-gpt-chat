#!/usr/bin/env python3
"""Synthetic native FFmpeg test. Not proof of genuine Porsche scene content."""
from pathlib import Path
from tempfile import TemporaryDirectory
import json,subprocess,unittest
from verify_official_excerpts import verify
from ingest_bridge import digest

class ExcerptVerificationTest(unittest.TestCase):
    def fixture(self,folder):
        mid="286726";root=Path(folder)
        movie=root/f"porsche-{mid}-native-excerpt.mp4"
        subprocess.run(["ffmpeg","-v","error","-y","-f","lavfi",
              "-i","testsrc2=size=1280x720:rate=25:duration=4",
              "-c:v","libx264","-preset","ultrafast","-crf","30",str(movie)],
              check=True,timeout=60)
        report={
              "schemaVersion":1,"mediaId":mid,"sourceUrl":
              "https://newstv.porsche.com/porschevideos/newstv.porsche.com_286726_en.mp4",
              "rangeStartSeconds":60,"requestLengthSeconds":4,
              "status":"EXCERPT_DOWNLOADED_PRESERVED_CODEC",
              "originalReencoded":False,"clipDoesNotRepresentEntireSource":True,
              "excerptBytes":movie.stat().st_size,"excerptSha256":digest(movie),
              "width":1280,"height":720,"fps":"25/1","durationSeconds":4,
              "videoCodec":"h264","completeExcerptDecode":"PASS"}
        filename=root/"excerpt-qa.json";filename.write_text(json.dumps(report))
        return movie,filename,report
    def test_original_quality_excerpt_verified_but_no_shots_accepted(self):
        with TemporaryDirectory() as path:
            movie,report_file,report=self.fixture(path)
            response=verify(Path(path))
            self.assertEqual(response["status"],"NATIVE_SOURCE_EXCERPT_VERIFIED_NOT_EDIT_SHOT")
            self.assertEqual(response["verifiedUniqueTurboDrivingShots"],0)
            self.assertFalse(response["isOriginalFullSource"])
            self.assertEqual(response["excerptSha256"],digest(movie))
    def test_tampering_rejected(self):
        with TemporaryDirectory() as path:
            movie,report_file,report=self.fixture(path)
            movie.write_bytes(movie.read_bytes()+b"changed")
            with self.assertRaisesRegex(ValueError,"SHA mismatch"):
                verify(Path(path))
    def test_declaring_excerpt_entire_source_rejected(self):
        with TemporaryDirectory() as path:
            movie,report_file,report=self.fixture(path)
            report["clipDoesNotRepresentEntireSource"]=False
            report_file.write_text(json.dumps(report))
            with self.assertRaisesRegex(ValueError,"must be an excerpt"):
                verify(Path(path))
if __name__=="__main__":unittest.main()
