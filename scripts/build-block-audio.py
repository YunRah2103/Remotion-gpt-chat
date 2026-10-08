#!/usr/bin/env python3
"""Produce an original timed 44-second voice track and light foley; no reference audio reused."""
import asyncio, os, pathlib, subprocess, sys, wave
BASE=pathlib.Path("out/block-audio")
BASE.mkdir(parents=True,exist_ok=True)
SPEECH=[
 (0,5.8,"If wine spills during a church service, some traditions treat it with special care."),
 (6,11.8,"A church leader may wash the spot and consume the water used to clean it."),
 (12,16.8,"And if a piece of consecrated bread falls, old customs include burning affected material."),
 (17,22.8,"Why is this important? In Catholicism there is a ritual called the Eucharist."),
 (23,28.8,"During it, worshippers receive bread and wine as part of a sacred ceremony."),
 (29,34.8,"Catholics believe these become the body and blood of Jesus Christ."),
 (35,39.8,"The video then contrasts this idea with worship in Islam."),
 (40,44.0,"Where God is greater than anything that can be held."),
]
def run(*args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def length(path):
    out=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)])
    return float(out)
async def synth():
    try:
        import edge_tts
        for i,(start,end,words) in enumerate(SPEECH):
            await edge_tts.Communicate(words,voice='en-US-AndrewNeural',rate='+3%',pitch='-2Hz').save(str(BASE/f'{i}.mp3'))
        return 'Edge neural narration'
    except Exception as e:
        print('Speech service unavailable. Using offline voice:',str(e)[:160])
        for i,(_,__,words) in enumerate(SPEECH):
            run('espeak-ng','-v','en-us+m3','-s','145','-w',str(BASE/f'{i}.wav'),words)
        return 'offline speech fallback'
def stretch(inpath,outpath,target):
    d=length(inpath)
    # atempo scales timeline by the inverse factor (new duration = input/tempo)
    tempo=d/target
    chain=[]
    while tempo<.5:
        chain.append('atempo=0.5')
        tempo/=0.5
    while tempo>2.:
        chain.append('atempo=2.0')
        tempo/=2.
    chain.append(f'atempo={tempo:.6f}')
    run('ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(inpath),
        '-af',','.join(chain)+',aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo',
        '-t',f'{target:.3f}','-c:a','pcm_s16le',str(outpath))
async def main():
    voice=await synth()
    inputs=[]
    filters=[]
    for i,(start,end,_) in enumerate(SPEECH):
        inp=BASE/f'{i}.mp3'
        if not inp.exists():inp=BASE/f'{i}.wav'
        stem=BASE/f'{i}-timed.wav'
        stretch(inp,stem,end-start)
        inputs.extend(['-i',str(stem)])
        filters.append(f'[{i}:a]adelay={int(start*1000)}|{int(start*1000)},volume=1.3[v{i}]')
    run('ffmpeg','-hide_banner','-loglevel','error','-y',*inputs,
        '-filter_complex',';'.join(filters)+';'+''.join(f'[v{i}]' for i in range(len(SPEECH)))+
        f'amix=inputs={len(SPEECH)}:duration=longest:normalize=0,alimiter=limit=0.94[a]',
        '-map','[a]','-t','44','-ar','48000','-ac','2','-c:a','aac','-b:a','192k','out/BLOCK-STORY-44s.m4a')
    print('Produced 44-second independent narration:',voice)
if __name__=='__main__':asyncio.run(main())
