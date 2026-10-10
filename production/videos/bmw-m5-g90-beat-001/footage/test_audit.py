#!/usr/bin/env python3
"""Tests use FFmpeg patterns as QA fixtures only; they are NEVER car footage."""
import copy
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from audit import audit, file_sha, moving, probe

ROOT = Path(__file__).resolve().parent
PLAN = json.loads((ROOT/'shot-plan.json').read_text())


class FootageAuditTest(unittest.TestCase):
    def test_frame_plan_is_exact(self):
        result = audit(PLAN, [], 'plan')
        self.assertEqual(result['slots'], 39)
        self.assertEqual(result['frames'], 600)
        self.assertEqual(result['assignedSlots'], 0)
        self.assertFalse(result['footageReady'])

    def test_reject_frame_gap(self):
        x = copy.deepcopy(PLAN)
        x['slots'][8]['frameStart'] += 1
        with self.assertRaisesRegex(ValueError, 'Frame gap/overlap'):
            audit(x, [], 'plan')

    def test_reject_wrong_model(self):
        x = copy.deepcopy(PLAN)
        x['vehicle'] = 'BMW M5 F90'
        with self.assertRaisesRegex(ValueError, 'Wrong model'):
            audit(x, [], 'plan')

    def test_reject_duplicate_shot_description(self):
        x = copy.deepcopy(PLAN)
        x['slots'][8]['desiredShot'] = x['slots'][4]['desiredShot']
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            audit(x, [], 'plan')

    def test_ready_fails_closed_without_approved_media(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError, 'No approved sources'):
                audit(PLAN, [], 'ready', temp, temp)

    def test_real_ffprobe_and_decoded_frame_motion_gate(self):
        with tempfile.TemporaryDirectory() as temp:
            move = Path(temp)/'moving-fixture.mp4'
            still = Path(temp)/'static-fixture.mp4'
            subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i',
                            'testsrc2=size=1280x720:rate=30','-t','1','-an',
                            '-c:v','libx264','-preset','ultrafast',str(move)],
                           check=True, timeout=35)
            subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i',
                            'color=c=black:size=1280x720:rate=30','-t','1','-an',
                            '-c:v','libx264','-preset','ultrafast',str(still)],
                           check=True, timeout=35)
            info = probe(move)
            self.assertEqual(info['width'], 1280)
            self.assertEqual(info['fps'], 30)
            self.assertEqual(len(file_sha(move)), 64)
            self.assertTrue(moving(move, 0, 0.9)['moving'])
            self.assertFalse(moving(still, 0, 0.9)['moving'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
