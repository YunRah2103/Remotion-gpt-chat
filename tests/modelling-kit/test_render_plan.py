import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('render_plan',pathlib.Path(__file__).parents[2]/'scripts/modelling-kit/render-plan.py')
plan=importlib.util.module_from_spec(spec);spec.loader.exec_module(plan)
class RenderPlan(unittest.TestCase):
 def test_ranges_cover_arbitrary_duration_without_gaps_or_duplicates(self):
  for total in [1,89,90,91,181,540]:
   pieces=plan.ranges(total)
   self.assertEqual([i for a,b in pieces for i in range(a,b+1)],list(range(total)))
 def test_all_twenty_legacy_clips_and_four_complete_episodes_remain(self):
  jobs=plan.matrix()['include'];self.assertEqual(len(jobs),44)
  self.assertEqual({j['composition'] for j in jobs if not j['range']},set(plan.LEGACY))
  for name in plan.STUDIO:self.assertEqual([j['range'] for j in jobs if j['composition']==name],[f'{a}-{b}' for a,b in plan.ranges(540)])
 def test_bad_counts_are_rejected(self):
  for args in [(0,90),(540,0),(-1,3),(3.5,2)]:
   with self.assertRaises(ValueError):plan.ranges(*args)
