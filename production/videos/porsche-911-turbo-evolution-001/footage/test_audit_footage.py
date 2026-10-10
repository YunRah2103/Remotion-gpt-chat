"""Agent A audit unit checks; synthetic fixtures are NEVER evidence of Porsche footage."""
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from audit_footage import GENS, audit, safe_source, mean_delta, near_duplicate


class AuditChecks(unittest.TestCase):
    def test_generation_slots(self):
        self.assertEqual(len(GENS), 30)
        self.assertEqual([GENS[x] for x in (0,4,8,12,16,20,25)],
                         ['930','964','993','996','997','991','992'])

    def test_forbid_path_escape(self):
        with tempfile.TemporaryDirectory() as t:
            with self.assertRaises(ValueError):
                safe_source(Path(t), '../nope.mp4')
            with self.assertRaises(ValueError):
                safe_source(Path(t), '/etc/passwd')

    def test_frozen_frames(self):
        a = bytes([30] * (64 * 36))
        self.assertEqual(mean_delta(a, a), 0)
        self.assertTrue(near_duplicate(a, a))

    def test_missing_thirty_are_blocked(self):
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            plan = {'schemaVersion': 1,
                    'shots':[{'slot':i,'generation':g} for i,g in enumerate(GENS,1)]}
            beat = {'output':{'frames':510},'cuts':[
                    {'slot':i,'generation':g,'durationFrames':17} for i,g in enumerate(GENS,1)]}
            report = audit(plan,root,root/'proof',beat)
            self.assertEqual(report['status'],'BLOCKED')
            self.assertEqual(report['availableSlots'],0)
            self.assertEqual(len(report['errors']),30)
            self.assertEqual(len(report['shots']),30)
            self.assertTrue((root/'proof'/'audit-report.json').exists())

    def test_actual_synthetic_motion_probe_only(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)
            movie=root/'synthetic-not-porsche.mp4'
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-f','lavfi','-i',
                'testsrc2=size=960x540:rate=30:duration=2','-c:v','libx264',
                '-preset','ultrafast','-crf','16','-pix_fmt','yuv420p','-y',str(movie)],
                check=True,timeout=30)
            plan={'schemaVersion':1,'shots':[
                {'slot':i,'generation':g} for i,g in enumerate(GENS,1)]}
            plan['shots'][0].update({'localPath':movie.name,'sourceInSeconds':.2,
                'sourceOutSeconds':1.05,'sourceLicenseStatus':'test-only','sourceUrl':'test://local',
                'originCreator':'synthetic-test','actualTurboIdentityEvidence':'NOT REAL PORSCHE',
                'angleAndMotion':'generated animation','shotKey':'fixture-1'})
            beat={'output':{'frames':510},'cuts':[
                {'slot':i,'generation':g,'durationFrames':17} for i,g in enumerate(GENS,1)]}
            report=audit(plan,root,root/'proof',beat)
            self.assertEqual(report['availableSlots'],1)
            self.assertEqual(len(report['errors']),29)
            self.assertTrue((root/'proof'/'frames'/'01-in.jpg').is_file())
            self.assertTrue((root/'proof'/'frames'/'01-out.jpg').is_file())
            self.assertGreater(report['shots'][0]['motionDelta'],1.75)
            self.assertFalse(report['shots'][0]['verifiedMovingVideo'])


if __name__=='__main__':
    unittest.main()
