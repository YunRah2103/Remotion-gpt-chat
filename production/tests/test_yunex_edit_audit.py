"""YUNEX editor inspector smoke: real synthetic MP4, actual FFmpeg filters."""
import importlib.util
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'toolkits' / 'yunex_edit_audit.py'
spec = importlib.util.spec_from_file_location('yunex_edit_audit', SOURCE)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'requires FFmpeg')
class PreflightTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.path = Path(cls.temp.name)
        cls.video = cls.path/'sample.mp4'
        cls.music = cls.path/'music.wav'
        subprocess.run([
            'ffmpeg', '-y', '-v', 'error',
            '-f', 'lavfi', '-i', 'color=c=black:s=160x288:r=15:d=0.6',
            '-f', 'lavfi', '-i', 'color=c=red:s=160x288:r=15:d=1.2',
            '-f', 'lavfi', '-i', 'sine=frequency=420:duration=1.8',
            '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]',
            '-map', '[v]', '-map', '2:a', '-c:v', 'mpeg4', '-c:a', 'aac',
            '-shortest', str(cls.video)], check=True)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i',
                        'sine=frequency=420:duration=1.8', str(cls.music)], check=True)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_metadata(self):
        info = audit.probe(self.video)
        self.assertEqual(info['video']['width'], 160)
        self.assertEqual(info['audio']['codec'], 'aac')

    def test_black_detection(self):
        events = audit.video_events(self.video)
        self.assertGreater(len(events['black']), 0)
        self.assertAlmostEqual(events['black'][0]['duration'], .6, delta=.11)

    def test_final_master_warning_and_full_decode(self):
        result = audit.analyze(self.video, self.music, 'final', True)
        self.assertEqual(result['verdict'], 'REVIEW_REQUIRED')
        self.assertTrue(result['fullVideoDecodePassed'])
        self.assertIsInstance(result['musicAccentShortlist']['cues'], list)
        self.assertIn('black', audit.markdown(result).lower())

    def test_reject_audio_only(self):
        with self.assertRaises(ValueError):
            audit.probe(self.music)


if __name__ == '__main__':
    unittest.main()
