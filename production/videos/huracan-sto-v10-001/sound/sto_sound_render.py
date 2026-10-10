#!/usr/bin/env python3
"""Huracán STO 001: fail-closed soundtrack mix, video mux and evidence QA.

This tool does NOT verify a vehicle's identity from its waveform. A human must
verify that engine media actually captures a Lamborghini Huracán STO.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

FPS = 30
FRAMES = 316
DURATION = FRAMES / FPS
MUSIC_SHA = '87a663860585e1714fd6fbb6a8006d19d655bda863db66cdaa75ba1830a2d678'


def run(cmd, *, allow_fail=False):
    p = subprocess.run([str(c) for c in cmd], text=True, capture_output=True)
    if p.returncode and not allow_fail:
        raise RuntimeError(f"Command failed ({p.returncode}): {' '.join(map(str,cmd))}\n{p.stderr[-4000:]}")
    return p


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def probe(path, *, count=False):
    cmd = ['ffprobe','-v','error']
    if count:
        cmd.append('-count_frames')
    cmd += ['-show_entries','format=duration:stream=codec_type,codec_name,width,height,pix_fmt,avg_frame_rate,nb_read_frames,sample_rate,channels', '-of','json',path]
    return json.loads(run(cmd).stdout)


def stream(info, kind):
    return next((s for s in info['streams'] if s['codec_type'] == kind), None)


def require(pred, msg):
    if not pred:
        raise RuntimeError('BLOCKED: ' + msg)


def validate_sources(args, spec):
    for path in (args.music, args.engine, args.picture):
        require(Path(path).is_file() and Path(path).stat().st_size > 0, f'missing media: {path}')
    music_sha = sha(args.music)
    require(music_sha == MUSIC_SHA, f'music SHA mismatch: expected {MUSIC_SHA}, got {music_sha}')
    m = probe(args.music)
    require(stream(m,'audio') and float(m['format']['duration']) >= DURATION - .001, 'music missing or too short')
    video = probe(args.picture, count=True)
    v = stream(video, 'video')
    require(v is not None, 'picture contains no video')
    require((v['width'],v['height']) == (1080,1920), 'picture must be 1080x1920, not upscaled by this tool')
    require(v['avg_frame_rate'] in ('30/1','30000/1000'), 'picture must be 30 fps')
    require(int(v.get('nb_read_frames') or 0) == FRAMES, f'picture must contain exactly {FRAMES} decoded frames')
    e = probe(args.engine)
    require(stream(e, 'audio'), 'engine input contains no decodable audio stream')
    engine_sha = sha(args.engine)
    require(spec.get('sha256') == engine_sha, 'engine SHA does not match recording manifest')
    if not args.test_fixture:
        require(spec.get('vehicle') == 'Lamborghini Huracan STO', 'engine vehicle identity not declared as STO')
        for key in ('source_url','recording_notes','identity_evidence','rights_statement','verified_by'):
            require(isinstance(spec.get(key), str) and len(spec[key].strip()) > 8, f'missing engine provenance: {key}')
        require(spec.get('audio_confirmed_no_music_overlay') is True, 'engine recording must be checked free of music overlay')
        require(spec.get('approved_for_private_review') is True, 'engine recording approval missing')
    events = spec.get('events')
    require(isinstance(events,list) and len(events) >= 2, 'minimum two independently placed engine accents required')
    engine_length = float(e['format']['duration'])
    for i, ev in enumerate(events):
        start, offset, length = (float(ev[k]) for k in ('at','source_in','duration'))
        gain = float(ev.get('gain',.3))
        require(start >= 0 and offset >= 0 and length >= .08 and start + length <= DURATION + 1e-4,
                f'engine event {i} off final timeline')
        require(offset + length <= engine_length + .02, f'engine event {i} off source media')
        require(0 < gain <= .85, f'engine event {i} unsafe gain')
    return video, music_sha, engine_sha


def render(args, spec, video, music_sha, engine_sha):
    out = Path(args.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    require(not (args.test_fixture and 'fixture' not in out.name.lower()), 'test fixture output dir must contain "fixture"')
    music_out, engine_out, mix_out = [out / x for x in ('music-48k.wav','engine-48k.wav','final-mix-48k.wav')]
    # Piecewise soundtrack ducking ONLY around real engine impacts; retain original alignment.
    music_filter = (f'aresample=48000,atrim=0:{DURATION:.8f},asetpts=PTS-STARTPTS,'
                    "aformat=sample_fmts=fltp:channel_layouts=stereo,"
                    "volume='if(between(t,0,0.70)+between(t,2.57,3.03),0.74,0.90)':eval=frame")
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',args.music,'-map','0:a:0',
         '-af',music_filter,'-ar','48000','-ac','2','-c:a','pcm_s24le',music_out])
    chains=[]
    pads=[]
    for i, ev in enumerate(spec['events']):
        offset=float(ev['source_in']); duration=float(ev['duration'])
        fade=min(.06,duration/4)
        gain=float(ev.get('gain',.3))
        ms=round(float(ev['at'])*1000)
        chain=(f'[0:a:0]atrim=start={offset:.5f}:duration={duration:.5f},asetpts=PTS-STARTPTS,'
               f'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,'
               f'highpass=f=55,lowpass=f=13500,volume={gain:.3f},'
               f'afade=t=in:st=0:d={fade:.4f},'
               f'afade=t=out:st={duration-fade:.5f}:d={fade:.4f},'
               f'adelay={ms}:all=1[e{i}]')
        chains.append(chain);pads.append(f'[e{i}]')
    chains.append(''.join(pads) + f'amix=inputs={len(pads)}:duration=longest:normalize=0,'
                  f'apad,atrim=0:{DURATION:.8f},asetpts=PTS-STARTPTS,alimiter=limit=0.96[engine]')
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',args.engine,
         '-filter_complex',';'.join(chains),'-map','[engine]',
         '-ar','48000','-ac','2','-c:a','pcm_s24le',engine_out])
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',music_out,'-i',engine_out,
         '-filter_complex','[0:a][1:a]amix=inputs=2:duration=first:normalize=0,'
                           'alimiter=limit=0.94:level=0:attack=5:release=75[mix]',
         '-map','[mix]','-ar','48000','-ac','2','-c:a','pcm_s24le',mix_out])
    picture_v=stream(video,'video')
    copy_safe=(picture_v['codec_name']=='h264' and picture_v.get('pix_fmt')=='yuv420p')
    movie=out/('HURACAN_STO_FIXTURE_ONLY.mp4' if args.test_fixture else 'HURACAN_STO_V10_PRIVATE_REVIEW.mp4')
    encode=['-c:v','copy'] if copy_safe else ['-c:v','libx264','-crf','17','-preset','slow','-pix_fmt','yuv420p']
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',args.picture,'-i',mix_out,
         '-map','0:v:0','-map','1:a:0',*encode,'-frames:v',str(FRAMES),
         '-c:a','aac','-b:a','320k','-ar','48000','-ac','2',
         '-movflags','+faststart',movie])
    qa=probe(movie,count=True)
    v=stream(qa,'video'); a=stream(qa,'audio')
    require(v and a and int(v.get('nb_read_frames') or 0)==FRAMES, 'final decoded frame count differs')
    require(v['codec_name']=='h264' and v['pix_fmt']=='yuv420p' and (v['width'],v['height'])==(1080,1920), 'final video codec/geometry incorrect')
    require(a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2, 'final audio codec incorrect')
    require(abs(float(qa['format']['duration'])-DURATION)<.1, 'final duration mismatch')
    decoded = run(['ffmpeg','-hide_banner','-nostats','-i',movie,
                   '-vf','blackdetect=d=0.10:pix_th=0.10','-af','silencedetect=noise=-48dB:d=0.3',
                   '-f','null','-'],allow_fail=True)
    require(decoded.returncode == 0, 'full output decode failed')
    black = re.findall(r'black_start:([0-9.]+) black_end:([0-9.]+)',decoded.stderr)
    silent = re.findall(r'silence_start: ([0-9.]+)',decoded.stderr)
    sheet = out/'native-contact-sheet.jpg'
    selected=[0,15,35,55,80,98,115,136,158,182,205,230,255,280,302,315]
    vf=f"select='{'+'.join(f'eq(n\,{n})' for n in selected)}',scale=270:480,tile=4x4"
    run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',movie,'-vf',vf,'-vsync','vfr','-frames:v','1','-q:v','2',sheet])
    report={'mode':'TEST FIXTURE — NOT RELEASE' if args.test_fixture else 'REAL SOURCE — INDEPENDENT REVIEW REQUIRED',
            'gate_c':'BLOCKED_FIXTURE' if args.test_fixture else 'TECHNICAL_QA_PASS_VISUAL_AND_AUDIO_REVIEW_PENDING',
            'frames':FRAMES,'fps':FPS,'music_sha256':music_sha,'engine_sha256':engine_sha,
            'mp4_sha256':sha(movie),'duration':qa['format']['duration'],'video_copy':copy_safe,
            'blackdetect_intervals':black,'silencedetect_starts':silent,
            'source_provenance':{k:v for k,v in spec.items() if k!='events'},'events':spec['events'],
            'mp4':str(movie),'contact_sheet':str(sheet)}
    (out/'qa-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    return report


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--music',required=True,type=Path)
    p.add_argument('--engine',required=True,type=Path)
    p.add_argument('--engine-manifest',required=True,type=Path)
    p.add_argument('--picture',required=True,type=Path,help='Agent B verified 316-frame 1080x1920/30fps edit')
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--test-fixture',action='store_true',help='Never count fixture output as gate C or public release')
    args=p.parse_args()
    spec=json.loads(args.engine_manifest.read_text())
    video,music_sha,engine_sha=validate_sources(args,spec)
    render(args,spec,video,music_sha,engine_sha)

if __name__=='__main__':
    main()
