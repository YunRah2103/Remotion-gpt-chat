import sys, os
sys.path.insert(0,'.')
import scene
scene.build()
out='/tmp/claude-0/-home-user-Remotion-gpt-chat/447cd6e3-4400-5cac-ba9a-75ba759026e4/scratchpad/w/fr'
os.makedirs(out,exist_ok=True)
for i in range(int(sys.argv[1]), int(sys.argv[2])):
    p=f'{out}/f{i:04d}.png'
    if os.path.exists(p): continue
    scene.render(i/30, p, 1.0, 6)
