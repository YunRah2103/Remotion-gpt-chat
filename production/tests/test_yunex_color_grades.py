"""Run native FFmpeg output tests on the eight original YUNEX colour grades."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/"toolkits"/"yunex_color_grades.py"
spec=importlib.util.spec_from_file_location("yunex_color_grades",TARGET)
looks=importlib.util.module_from_spec(spec)
spec.loader.exec_module(looks)


class LookMathTests(unittest.TestCase):
    def test_all_original_presets_are_in_display_gamut(self):
        self.assertEqual(len(looks.LOOKS),8)
        for name,setting in looks.LOOKS.items():
            for rgb in ((0,0,0),(1,1,1),(.5,.5,.5),(.2,.5,.8),(1,.1,.1)):
                output=looks.grade(rgb,setting)
                self.assertEqual(len(output),3)
                self.assertTrue(all(0<=v<=1 for v in output), name)

    def test_cube_order_and_size(self):
        text=looks.cube_text("emerald-noir",17)
        lines=[l for l in text.splitlines() if l and l[0].isdigit()]
        self.assertEqual(len(lines),17**3)
        self.assertIn("LUT_3D_SIZE 17",text)
        self.assertNotEqual(lines[0],lines[-1])

    def test_distinct_colour_treatments(self):
        base=(.3,.45,.6)
        a=looks.grade(base,looks.LOOKS["monaco-gold"])
        b=looks.grade(base,looks.LOOKS["midnight-cobalt"])
        self.assertGreater(sum(abs(x-y) for x,y in zip(a,b)), .02)

    def test_sdr_policy(self):
        for transfer in ("smpte2084","arib-std-b67"):
            with self.assertRaises(ValueError):
                looks.ensure_sdr({"color_transfer":transfer})
        with self.assertRaises(ValueError):
            looks.ensure_sdr({"color_primaries":"bt2020"})

    def test_strength_bounds(self):
        path=Path("/tmp/lut.cube")
        self.assertEqual(looks.strength_filter(path,0),"null")
        self.assertIn("lut3d",looks.strength_filter(path,1))
        self.assertIn("blend=all_expr",looks.strength_filter(path,.72))


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg required")
class MediaGradeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.path=Path(cls.temp.name)
        cls.source=cls.path/"original-with-audio.mp4"
        # Real small MP4 fixture, two distinctive shots and exact source AAC audio.
        subprocess.run([
            "ffmpeg","-v","error","-y",
            "-f","lavfi","-i","color=c=0x557b85:s=320x180:r=24:d=1",
            "-f","lavfi","-i","color=c=0x993829:s=320x180:r=24:d=1",
            "-f","lavfi","-i","sine=frequency=440:sample_rate=48000:duration=2",
            "-filter_complex","[0:v][1:v]concat=n=2:v=1:a=0[v]",
            "-map","[v]","-map","2:a:0",
            "-c:v","mpeg4","-q:v","2","-c:a","aac","-b:a","128k",
            "-shortest",str(cls.source)],check=True,timeout=60)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_grade_renders_full_mp4_keeps_original_and_audio(self):
        original_hash=looks.checksum(self.source)
        target=self.path/"graded.mp4"
        report=looks.apply(self.source,target,"emerald-noir",.82,21)
        self.assertEqual(report["videoDecode"],"PASS")
        self.assertEqual(report["inputSha256"],original_hash)
        self.assertEqual(looks.checksum(self.source),original_hash)
        before,bv=looks.ffprobe(self.source)
        after,av=looks.ffprobe(target)
        self.assertEqual((bv["width"],bv["height"]),(av["width"],av["height"]))
        self.assertAlmostEqual(float(before["format"]["duration"]),
                               float(after["format"]["duration"]),delta=.15)
        self.assertEqual([x["codec_name"] for x in before["streams"]
                          if x["codec_type"]=="audio"],
                         [x["codec_name"] for x in after["streams"]
                          if x["codec_type"]=="audio"])
        self.assertTrue(target.with_suffix(".grade.json").exists())
        # Decode exact same original AAC packets in two containers and compare PCM.
        def audio_hash(path):
            p=subprocess.run(["ffmpeg","-v","error","-i",str(path),
                              "-map","0:a:0","-f","hash","-hash","SHA256","-"],
                             check=True,capture_output=True,text=True,timeout=60)
            return p.stdout.strip()
        self.assertEqual(audio_hash(self.source),audio_hash(target))

    def test_preview_creates_real_ab_visuals(self):
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("Pillow optional for A/B preview")
        output=self.path/"preview"
        report=looks.preview(self.source,output,.7,.65,"all")
        picture=output/"YUNEX-GRADE-COMPARISON.jpg"
        self.assertEqual(len(report["looks"]),8)
        with Image.open(picture) as im:
            self.assertEqual(im.size,(960,2480))
        self.assertTrue(picture.stat().st_size>25000)

    def test_reject_overwriting_source(self):
        with self.assertRaises(ValueError):
            looks.apply(self.source,self.source,"track-attack")

    def test_grade_variation_changes_video(self):
        output=self.path/"track.mp4"
        report=looks.apply(self.source,output,"track-attack",1,22)
        self.assertNotEqual(report["inputSha256"],report["outputSha256"])


if __name__=="__main__":
    unittest.main()
