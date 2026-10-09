import json
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from visual_regression import check

class ImageRegressionTests(unittest.TestCase):
    def test_nested_matching_frames_and_real_image_difference(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            a=root/"old"/"stills";b=root/"new"/"stills"
            a.mkdir(parents=True);b.mkdir(parents=True)
            Image.new("RGB",(30,30),(50,60,70)).save(a/"frame-30.png")
            Image.new("RGB",(30,30),(80,60,70)).save(b/"frame-30.png")
            result=check(root/"old",root/"new",root/"diff")
            self.assertEqual(result["tested"],1)
            self.assertGreater(result["results"][0]["meanAbsolutePixelChange"],0)
            self.assertTrue((root/"diff"/"compare-stills__frame-30.png").exists())
            self.assertTrue((root/"diff"/"diff-stills__frame-30.png").exists())
            self.assertTrue((root/"diff"/"visual-report.json").exists())

    def test_tight_threshold_rejects_change(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);a=p/"a";b=p/"b";a.mkdir();b.mkdir()
            Image.new("RGB",(4,4),"black").save(a/"f.png")
            Image.new("RGB",(4,4),"white").save(b/"f.png")
            with self.assertRaises(ValueError):check(a,b,p/"out",max_mean=4)
