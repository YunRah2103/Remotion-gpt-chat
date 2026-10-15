"""YUNEX editorial toolkit smoke tests, actual FFmpeg media and contact sheets."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

TARGET=Path(__file__).resolve().parents[1]/'toolkits'/'yunex_edit_lab.py'
spec=importlib.util.spec_from_file_location('yunex_edit_lab',TARGET)
lab=importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)

@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg missing')
class TestYunexEditLab(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        cls.base=Path(cls.tmp.name)
        cls.source=cls.base/'cinematic-test.mp4'
        subprocess.run(['ffmpeg','-y','-v','error',
                        '-f','lavfi','-i','color=c=red:s=320x180:r=30:d=1',
                        '-f','lavfi','-i','color=c=blue:s=320x180:r=30:d=1',
                        '-f','lavfi','-i','color=c=green:s=320x180:r=30:d=1',
                        '-f','lavfi','-i','sine=frequency=440:duration=3',
                        '-filter_complex','[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]',
                        '-map','[v]','-map','3:a','-c:v','mpeg4','-q:v','3',
                        '-c:a','aac','-shortest',str(cls.source)],check=True,timeout=45)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_scout_contact_and_cut_timing(self):
        out=self.base/'scout'
        result=lab.scout(self.source,out,.15,20,.3)
        self.assertGreaterEqual(result['sampledScenes'],3)
        self.assertTrue((out/'contact-sheet.jpg').stat().st_size>2000)
        self.assertTrue((out/'shots.json').exists())
        self.assertEqual(result['sourceSha256'],lab.digest(self.source))
        self.assertAlmostEqual(result['shots'][1]['start'],1.,delta=.12)

    def test_ramp_export_duration_and_original_immutable(self):
        original_hash=lab.digest(self.source)
        output=self.base/'ramp.mp4'
        plan={'segments':[{'start':0,'end':1.,'speed':1.},
                          {'start':1.,'end':2.,'speed':2.},
                          {'start':2.,'end':3.,'speed':.5}]}
        report=lab.speed_ramp(self.source,plan,output,30,20)
        self.assertTrue(output.exists())
        self.assertAlmostEqual(report['actualDuration'],3.5,delta=.22)
        self.assertIsNone(lab.media_info(output)['audio'])
        self.assertEqual(original_hash,lab.digest(self.source))

    def test_validate_bounds(self):
        with self.assertRaises(ValueError):
            lab.validate_ramp({'segments':[{'start':0,'end':1.,'speed':1.},
                                             {'start':.5,'end':2.,'speed':1.}]},3.)
        with self.assertRaises(ValueError):
            lab.validate_ramp({'segments':[{'start':0,'end':1.,'speed':.01}]},3.)

    def test_lufs_meter(self):
        report=lab.loudness(self.source)
        self.assertIn('input_i',report['measurement'])
        self.assertIn('input_tp',report['measurement'])
        self.assertEqual(report['schema'],'yunex.audio-meter.v1')

    def test_hdr_rejection(self):
        # Only the output function is responsible for rejecting HDR transfers;
        # use a monkey-patch of the probe result, not a bogus HDR encode.
        old=lab.media_info
        try:
            def mocked(path):
                d=old(path)
                d['video']['color_transfer']='smpte2084'
                return d
            lab.media_info=mocked
            with self.assertRaisesRegex(ValueError,'HDR'):
                lab.speed_ramp(self.source,{'segments':[{'start':0,'end':1,'speed':1}]},
                               self.base/'should-not-exist.mp4',30,17)
        finally:
            lab.media_info=old


if __name__=='__main__':
    unittest.main()
