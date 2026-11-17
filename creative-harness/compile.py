#!/usr/bin/env python3
"""Build synchronized evidence-led beats, original music and SFX for Remotion.
The source cover is downloaded from The Economist Group official CDN.
"""
import argparse, json, math, subprocess, sys, urllib.request
from pathlib import Path
import numpy as np
import soundfile as sf
from PIL import Image

ROOT=Path(__file__).parent
PUBLIC=ROOT/"remotion"/"public"
SR=24000
FPS=24

def run(*cmd):
    print("+"," ".join(map(str,cmd)),flush=True)
    subprocess.run(list(map(str,cmd)),check=True)

def read_audio(mp3:Path):
    wav=mp3.with_suffix(".decoded.wav")
    run("ffmpeg","-y","-v","error","-i",mp3,"-ac","1","-ar",str(SR),str(wav))
    audio,_=sf.read(wav,dtype="float32")
    wav.unlink()
    return audio

def cover_asset(evidence):
    url=evidence["original_url"]
    raw=PUBLIC/"official_cover.jpg"
    request=urllib.request.Request(url,headers={"User-Agent":"WeAreLogicEditorial/1.0"})
    with urllib.request.urlopen(request,timeout=45) as resp:
        raw.write_bytes(resp.read())
    if raw.stat().st_size<15000:
        raise RuntimeError("Official source download too small")
    im=Image.open(raw).convert("RGB")
    ar=np.asarray(im)
    mask=(ar[:,:,0].astype(float)*.299+ar[:,:,1].astype(float)*.587+ar[:,:,2].astype(float)*.114)<210
    yy,xx=np.where(mask)
    if len(xx)<1000: raise RuntimeError("Cover source has no expected illustration")
    x0,x1=max(0,int(xx.min())-8),min(im.width,int(xx.max())+9)
    y0,y1=max(0,int(yy.min())-8),min(im.height,int(yy.max())+9)
    clipped=im.crop((x0,y0,x1,y1))
    side=max(clipped.size)
    square=Image.new("RGB",(side,side),"white")
    square.paste(clipped,((side-clipped.width)//2,(side-clipped.height)//2))
    square.resize((1080,1080),Image.Resampling.LANCZOS).save(PUBLIC/"cover.png")
    print("OFFICIAL COVER",im.size,"crop",(x0,y0,x1,y1),flush=True)

def fades(n):
    a=np.ones(n,np.float32)
    f=min(n//4,int(.10*SR))
    if f>0: a[:f]*=np.linspace(0,1,f);a[-f:]*=np.linspace(1,0,f)
    return a

def effects_for_timeline(beats,total_sec):
    """Low intensity sound effects; not on every cut."""
    n=int(total_sec*SR)+1
    arr=np.zeros(n,np.float32)
    rng=np.random.default_rng(2027)
    events=[]
    last_loud=-100.0
    for i,b in enumerate(beats):
        t=b["startSec"]
        if i%3!=0: continue
        effect=b["effect"]
        loud=effect in ("impact","flash","pop")
        if loud and t-last_loud<8: continue
        if loud: last_loud=t
        dur=.15 if loud else .28
        m=int(dur*SR); tau=np.arange(m)/SR
        noise=rng.standard_normal(m).astype(np.float32)
        # Cinematic transient; sound is original deterministic synthesis.
        if effect=="flash":
            signal=np.sin(2*np.pi*(180*tau+1400*tau*tau))*np.exp(-tau*45)
        elif effect=="impact":
            signal=np.sin(2*np.pi*(110*tau-80*tau*tau))*np.exp(-tau*18)+.13*noise*np.exp(-tau*33)
        elif effect=="pop":
            signal=np.sin(2*np.pi*(320*tau-220*tau*tau))*np.exp(-tau*32)
        else:
            smooth=np.convolve(noise,np.ones(29,dtype=np.float32)/29,mode="same")
            signal=smooth*np.sin(np.pi*np.minimum(1,tau/dur))**2
        signal=np.asarray(signal,np.float32)*fades(m)*(.20 if loud else .09)
        start=int(t*SR)
        if start+m<n:
            arr[start:start+m]+=signal
            events.append({"at":round(t,3),"kind":effect})
    return np.clip(arr,-.85,.85),events

def composed_music(seconds):
    """Original sober chill score: warm pads, arpeggio, bass, delicate percussion."""
    n=int(seconds*SR)+1
    x=np.zeros(n,np.float32)
    beat=60/84
    chords=[(220.0,261.63,329.63),(174.61,220.,261.63),(196.,246.94,293.66),(164.81,196.,246.94)]
    t=np.arange(n,dtype=np.float32)/SR
    # Warm pad, 4-bar harmonic evolution; sample-count stable.
    bar_i=np.floor(t/(beat*4)).astype(np.int16)
    for ch_id,ch in enumerate(chords):
        mask=(bar_i%4==ch_id)
        for freq in ch:
            x[mask]+=0.017*np.sin(2*np.pi*freq*t[mask]+.11*np.sin(.2*t[mask]))
            x[mask]+=0.006*np.sin(2*np.pi*(freq/2)*t[mask])
    del mask,t,bar_i
    rng=np.random.default_rng(774)
    for b in range(math.ceil(seconds/beat)):
        start=int(b*beat*SR)
        if start>=n: break
        chord=chords[(b//4)%4]
        dur=int(min(.48,seconds-b*beat)*SR)
        if dur<=0:continue
        tau=np.arange(dur,dtype=np.float32)/SR
        note=chord[b%3]*2
        env=(1-np.exp(-tau*45))*np.exp(-tau*5.5)
        pluck=.075*(np.sin(2*np.pi*note*tau)+.20*np.sin(4*np.pi*note*tau))*env
        x[start:start+dur]+=pluck
        if b%4==0:
            bass=.040*np.sin(2*np.pi*(chord[0]/2)*tau)*np.exp(-tau*2.9)
            x[start:start+dur]+=bass
        # refined texture, low-volume shaker on alternating eighths
        for half in [0,.5]:
            off=start+int(half*beat*SR)
            m=min(int(.04*SR),n-off)
            if m>0:
                tt=np.arange(m,dtype=np.float32)/SR
                grain=rng.standard_normal(m).astype(np.float32)
                x[off:off+m]+=.003*grain*np.exp(-tt*65)
    return np.tanh(x).astype(np.float32)

def build(args):
    spec=json.loads((ROOT/"episodes"/"economist_2027.json").read_text())
    evidence=json.loads((ROOT/"evidence-map.json").read_text())
    PUBLIC.mkdir(parents=True,exist_ok=True)
    cover_asset(evidence)
    manifest=[]; voice=[]; position=3.0
    voice.append(np.zeros(int(3*SR),np.float32))
    for scene in spec["scenes"]:
        path=args.speech_dir/(scene["id"]+"_em_alex.mp3")
        if not path.exists():
            path=args.speech_dir/(scene["id"]+".mp3")
        if not path.exists(): raise FileNotFoundError(path)
        a=read_audio(path)
        sec=len(a)/SR
        beats=max(1,math.ceil(sec/2.7))
        cue_list=[]
        low=scene["text"].lower()
        for quote,spot in scene["cues"]:
            idx=low.find(quote.lower())
            if idx<0: raise ValueError(f"Cue not in narration: {scene['id']}: {quote}")
            if spot not in evidence["spots"]: raise ValueError(f"Unknown spot: {spot}")
            cue_list.append((max(0,round((idx/len(low))*beats)),spot,quote))
        cue_list.sort()
        options=["detail","pov","reveal","full","focus","invert","pop","kinetic","chart"]
        for j in range(beats):
            st=position+j*(sec/beats)
            dur=sec/beats
            ahead=[c for c in cue_list if c[0]<=j]
            chosen=ahead[-1] if ahead else (0,"cover","portada")
            spot=chosen[1]
            if scene["id"] in ("scene_08",) and j%5==2: mode="invert"
            elif j%6==5:mode="kinetic"
            elif j%6==4:mode="detail"
            elif j%6==3:mode="focus"
            elif j%6==2:mode="pov"
            elif j%6==1:mode="reveal"
            else:mode="full"
            effect=["flash","detail","slow","distort","pop","blur","impact","whoosh","reveal"][j%9]
            manifest.append({
                "scene":scene["id"],"title":scene["title"],"label":evidence["spots"][spot]["label"],
                "spot":spot,"pos":[evidence["spots"][spot]["x"],evidence["spots"][spot]["y"]],
                "mode":mode,"effect":effect,"startSec":round(st,4),"durationSec":round(dur,4),
                "kind":"FUENTE VISUAL" if spot!="cover" else "COMPROBACIÓN","n":j
            })
        voice.append(a);voice.append(np.zeros(int(.18*SR),np.float32))
        position+=sec+.18
        print(scene["id"],sec,beats,flush=True)
    total=position+1.5
    narration=np.concatenate(voice)
    need=int(total*SR)
    if narration.size<need:
        narration=np.pad(narration,(0,need-narration.size))
    sfx,events=effects_for_timeline(manifest,total)
    music=composed_music(total)
    # mix with safe headroom. Loudness normalization performed in FFmpeg.
    mix=narration*.88+music*.19+sfx*.32
    sf.write(PUBLIC/"premaster.wav",np.clip(mix,-.95,.95),SR,subtype="PCM_16")
    run("ffmpeg","-y","-v","error","-i",PUBLIC/"premaster.wav","-af","loudnorm=I=-16:TP=-1.5:LRA=11","-c:a","pcm_s16le",PUBLIC/"master.wav")
    timeline={"fps":FPS,"width":1280,"height":720,"durationSec":total,"beats":manifest,"events":events,
              "source":evidence["original_url"],"license_note":"third-party illustration used for commentary/criticism"}
    (ROOT/"remotion"/"timeline.json").write_text(json.dumps(timeline,ensure_ascii=False,indent=2))
    print("BUILT",len(manifest),"cuts",round(total,1),"seconds",flush=True)

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--speech-dir",type=Path,required=True)
    args=ap.parse_args()
    build(args)
