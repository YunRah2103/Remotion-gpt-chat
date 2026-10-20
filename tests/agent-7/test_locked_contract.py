"""Agent 7 static CI contract; binary V4 source is only in the user's delivery."""
import ast
import pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
P = ROOT / 'production/yunex/tyre_blowout_ep003/audio/mix_ep003_v4.py'
tree = ast.parse(P.read_text())
values = {}
for n in tree.body:
    if isinstance(n, ast.Assign):
        for x in n.targets:
            if isinstance(x, ast.Name) and x.id in ('SR', 'FRAMES', 'N', 'LOCKED_SHA', 'CUES'):
                values[x.id] = ast.literal_eval(n.value)
assert values['SR'] == 48000
assert values['FRAMES'] == 800
assert values['N'] == 1280000
assert values['LOCKED_SHA'] == '5059a0f66fc2c91316e1b5cf190ad4554feaafd2fb4e13980cb05a8069e762dd'
assert len(values['CUES']) == 16
assert values['CUES'][9][1] == 16.015
source = P.read_text()
assert "'-c:v','copy'" in source
assert 'sha(src)!=LOCKED_SHA' in source
assert "'-map','0:v:0','-map','1:a:0'" in source
print('Agent 7 source safety & cue contract PASS')
