import importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('visual_plan',Path(__file__).parents[1]/'tools/visual_plan.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class ScriptSelection(unittest.TestCase):
 def test_only_npm_scripts_do_not_change_rendered_compositions(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=Path(tmp)/'base';candidate=Path(tmp)/'candidate'
   for root in [base,candidate]:
    (root/'src').mkdir(parents=True);(root/'src/Root.tsx').write_text('<Composition id="GpuDriveFilm" durationInFrames={100}/>\n<Composition id="MissingFootageFilm" durationInFrames={200}/>')
    (root/'package.json').write_text(json.dumps({'dependencies':{'remotion':'4.0.533'},'scripts':{'check':'tsc'}}))
   package=json.loads((candidate/'package.json').read_text());package['scripts']['kit:render']='node studio.mjs';(candidate/'package.json').write_text(json.dumps(package))
   self.assertEqual([v['composition'] for v in module.plan(base,candidate,['package.json'])['targets']],['GpuDriveFilm'])
   package['dependencies']['remotion']='5.0.0';(candidate/'package.json').write_text(json.dumps(package))
   self.assertEqual(len(module.plan(base,candidate,['package.json'])['targets']),2)
   self.assertEqual(len(module.plan(base,candidate,['package-lock.json'])['targets']),2)

   for malformed in ['[]','null','{invalid']:
    (candidate/'package.json').write_text(malformed)
    self.assertEqual(len(module.plan(base,candidate,['package.json'])['targets']),2)
