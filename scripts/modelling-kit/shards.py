"""Verify absolute-frame shards and join complete native recipe films without re-encoding."""
import argparse,hashlib,json,pathlib,subprocess
from importlib.util import spec_from_file_location,module_from_spec
spec=spec_from_file_location('render_plan',pathlib.Path(__file__).with_name('render-plan.py'));plan=module_from_spec(spec);spec.loader.exec_module(plan)
def metadata(path):
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
    return next(s for s in info['streams'] if s['codec_type']=='video'),float(info['format']['duration'])
def check(path,count):
    stream,duration=metadata(path)
    assert (stream['width'],stream['height'])==(1080,1920),(path,'native dimensions')
    assert stream['r_frame_rate']=='30/1' and stream['codec_name']=='h264' and stream['pix_fmt']=='yuv420p'
    assert int(stream['nb_frames'])==count and abs(duration-count/30)<.05,(path,'frame count')
    subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
    return {'file':path.name,'frames':count,'fullDecode':True,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
def verify(root,name,frame_range):
    start,end=map(int,frame_range.split('-'))
    assert name in plan.STUDIO and (start,end) in plan.ranges(540)
    path=root/f'{name}-{start}-{end}.mp4';report=check(path,end-start+1)
    (root/f'shard-qa-{name}-{start}-{end}.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
def assemble(root):
    audit=[];storage=root/'chunks';storage.mkdir(exist_ok=True)
    for name in plan.STUDIO:
        pieces=[]
        for start,end in plan.ranges(540):
            path=root/f'{name}-{start}-{end}.mp4'
            if not path.is_file():raise ValueError(f'Missing native shard: {path}')
            report=check(path,end-start+1);report['sourceFrames']=[start,end];audit.append(report);pieces.append(path)
        listing=root/f'concat-{name}.txt'
        lines=[]
        for p in pieces:
            assert "'" not in str(p.resolve())
            lines.append("file '"+str(p.resolve())+"'")
        listing.write_text(chr(10).join(lines)+chr(10))
        subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy',str(root/f'{name}.mp4')],check=True)
        check(root/f'{name}.mp4',540)
        listing.unlink()
        for path in pieces:path.rename(storage/path.name)
    (root/'shard-assembly-qa.json').write_text(json.dumps(audit,indent=2));print('Assembled four native 540-frame films from 24 verified shards')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['verify','assemble']);parser.add_argument('root',type=pathlib.Path);parser.add_argument('--id');parser.add_argument('--range')
    args=parser.parse_args()
    if args.mode=='verify':verify(args.root,args.id,args.range)
    else:assemble(args.root)
