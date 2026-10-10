"""Native FFmpeg regression coverage for zero-loss copy and AAC-preserving grades."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"fx"))
from make_luts import generate
from export_hq import run,make_command,inspect

def launch(*args):
    return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True).stdout.strip()

def packet_md5(path,kind):
    return launch("ffmpeg","-v","error","-i",str(path),"-map",f"0:{kind}:0",
                  "-c","copy","-f","md5","-")

@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"),"FFmpeg not installed")
class FXNativeExportTests(unittest.TestCase):
    def test_aac_bitstream_survives_real_lut_encode(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d)
            src=d/"original.mp4"
            launch("ffmpeg","-hide_banner","-loglevel","error","-y",
                   "-f","lavfi","-i","testsrc2=size=320x568:rate=30:duration=1",
                   "-f","lavfi","-i","sine=frequency=880:sample_rate=48000:duration=1",
                   "-c:v","libx264","-preset","ultrafast","-crf","13","-pix_fmt","yuv420p",
                   "-c:a","aac","-b:a","192k","-shortest",str(src))
            self.assertEqual(inspect(src)[2]["codec_name"],"aac")
            manifest=generate(d/"luts")
            lut=d/"luts"/manifest["presets"][0]["path"]
            remux=d/"remux.mp4"
            graded=d/"graded.mp4"
            result_remux=run(src,remux)
            result_graded=run(src,graded,lut=lut)
            self.assertFalse(result_remux["reencoded"])
            self.assertTrue(result_graded["reencoded"])
            self.assertTrue(result_graded["audioCopied"])
            self.assertEqual(packet_md5(src,"a"),packet_md5(remux,"a"))
            self.assertEqual(packet_md5(src,"a"),packet_md5(graded,"a"))
            self.assertEqual(packet_md5(src,"v"),packet_md5(remux,"v"))
            self.assertNotEqual(packet_md5(src,"v"),packet_md5(graded,"v"))
            self.assertEqual(inspect(graded)[1]["nb_frames"],inspect(src)[1]["nb_frames"])
            for name in (remux,graded):
                launch("ffmpeg","-v","error","-xerror","-i",str(name),"-f","null","-")
    def test_invalid_paths_do_not_overwrite_source(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"clip.mp4"
            p.write_bytes(b"not a video")
            with self.assertRaisesRegex(ValueError,"Cannot overwrite"):
                make_command(p,p)
            with self.assertRaisesRegex(ValueError,"Use .mp4"):
                make_command(p,p.with_suffix(".mov"))

if __name__=="__main__":
    unittest.main()
