"""Tests use generated sample audio only for algorithm validation; NOT for GT3 production."""
import array
import importlib.util
from pathlib import Path
import tempfile
import unittest
import wave

MODULE = Path(__file__).resolve().parents[1] / 'production/videos/gt3-nurburgring-multicar-001/audio/gt3_sound_final.py'
spec = importlib.util.spec_from_file_location('gt3_sound_final', MODULE)
audio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio)

class SoundTests(unittest.TestCase):
    def test_frame_sample_contract(self):
        self.assertEqual(audio.SAMPLES, 505600)
        self.assertEqual(audio.FRAMES,316)
        self.assertEqual(audio.SR,48000)

    def test_wav_duration(self):
        with tempfile.TemporaryDirectory() as tmp:
            filename=Path(tmp)/'test.wav'
            audio.as_wav(array.array('f',[0.0]*(audio.SAMPLES*2)),filename)
            with wave.open(str(filename),'rb') as w:
                self.assertEqual(w.getnframes(),505600)
                self.assertEqual(w.getnchannels(),2)
                self.assertEqual(w.getframerate(),48000)

    def test_shots_reject_single_make(self):
        shots=[{'make':'porsche','start_frame':i*12,'duration_frames':12} for i in range(18)]
        with self.assertRaisesRegex(ValueError,'6 unique'):
            audio.validate_shots({'shots':shots})

    def test_engine_requires_verification(self):
        with self.assertRaisesRegex(ValueError,'verified original'):
            audio.mix_engine_cues(array.array('f',[0.0]*(audio.SAMPLES*2)),[],[{'frame':0,'duration_frames':8,'make':'audi','verified_original_car_audio':False}],Path('.'))

    def test_beat_suggestions_bounded(self):
        samples=array.array('f',[0.0]*(audio.SAMPLES*2))
        for f in [17,49,88,128,217,280]:
            for j in range(f*3200,(f+1)*3200): samples[j]=0.5
        beats=audio.beat_candidates(samples)
        self.assertGreaterEqual(len(beats),5)
        self.assertTrue(all(0<=b['frame']<316 for b in beats))

if __name__=='__main__': unittest.main()
