#!/usr/bin/env python3
"""Generador de voz en español con Kokoro (CPU)."""
from __future__ import annotations
import argparse
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline

VOICES = ("em_alex", "em_santa", "ef_dora")

def chunks(text: str, limit: int = 500) -> list[str]:
    text = re.sub(r"[ \t]+", " ", text.strip())
    if not text:
        raise ValueError("Texto vacío")
    sentences = re.split(r"(?<=[.!?…])\s+|\n+", text)
    out, part = [], ""
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        pieces = [sentence[i:i+limit] for i in range(0,len(sentence),limit)]
        for piece in pieces:
            if part and len(part)+len(piece)+1 > limit:
                out.append(part)
                part = piece
            else:
                part = (part+" "+piece).strip()
    if part:
        out.append(part)
    return out

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--input",type=Path,required=True)
    ap.add_argument("--output-dir",type=Path,required=True)
    ap.add_argument("--voice",choices=VOICES,default="em_alex")
    ap.add_argument("--speed",type=float,default=0.94)
    args=ap.parse_args()
    if not 0.7 <= args.speed <= 1.2:
        ap.error("Velocidad fuera de rango")
    text=args.input.read_text(encoding="utf-8").strip()
    job=re.sub(r"[^\w.-]+","_",args.input.stem)
    args.output_dir.mkdir(parents=True,exist_ok=True)
    pipeline=KPipeline(lang_code="e",repo_id="hexgrad/Kokoro-82M")
    sr=24000
    parts=[]
    for i,block in enumerate(chunks(text),1):
        print("Bloque",i,"caracteres",len(block),flush=True)
        for item in pipeline(block,voice=args.voice,speed=args.speed,split_pattern=r"\n+"):
            samples=item.audio
            if samples is None:
                continue
            if hasattr(samples,"cpu"):
                samples=samples.cpu().numpy()
            samples=np.asarray(samples,dtype=np.float32).flatten()
            if samples.size:
                parts.append(samples)
                parts.append(np.zeros(int(sr*0.15),dtype=np.float32))
    if not parts:
        raise RuntimeError("No se generó audio")
    audio=np.concatenate(parts)
    wav=args.output_dir/(job+"_"+args.voice+".wav")
    mp3=args.output_dir/(job+"_"+args.voice+".mp3")
    sf.write(wav,audio,sr,subtype="PCM_16")
    subprocess.run(["ffmpeg","-y","-hide_banner","-loglevel","error","-i",str(wav),"-codec:a","libmp3lame","-b:a","192k",str(mp3)],check=True)
    meta={"job":job,"voice":args.voice,"duration_sec":round(len(audio)/sr,2),"chars":len(text),"files":[wav.name,mp3.name]}
    (args.output_dir/"manifest.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(meta,ensure_ascii=False),flush=True)


def batch_main(raw: str, args) -> None:
    """Generate one independently-timed voice track per scene or short."""
    payload=json.loads(raw)
    scenes=payload.get("scenes", [])
    if not isinstance(scenes,list) or not scenes:
        raise ValueError("No hay escenas")
    if len(scenes)>60:
        raise ValueError("Demasiadas escenas")
    from collections import Counter
    names=[str(scene["id"]) for scene in scenes]
    if len(set(names))!=len(names):
        raise ValueError("Identificadores repetidos")
    for name in names:
        if not re.fullmatch(r"(?:scene|short)_[0-9]{2}",name):
            raise ValueError(f"Identificador inválido: {name}")
    args.output_dir.mkdir(parents=True,exist_ok=True)
    pipeline=KPipeline(lang_code="e",repo_id="hexgrad/Kokoro-82M")
    sr=24000
    manifest={"engine":"Kokoro 82M","voice":args.voice,"speed":args.speed,"sample_rate":sr,"scenes":[]}
    for i,entry in enumerate(scenes,1):
        text=entry["text"].strip()
        if not text or len(text)>1200:
            raise ValueError("Texto vacío o excesivo")
        audios=[]
        for block in chunks(text,450):
            for item in pipeline(block,voice=args.voice,speed=args.speed,split_pattern=r"\\n+"):
                a=item.audio
                if a is None:
                    continue
                if hasattr(a,"cpu"):
                    a=a.cpu().numpy()
                a=np.asarray(a,dtype=np.float32).flatten()
                if a.size:
                    audios.append(a)
                    audios.append(np.zeros(int(sr*0.11),dtype=np.float32))
        if not audios:
            raise RuntimeError(f"No hubo audio para {entry['id']}")
        audio=np.concatenate(audios)
        wav=args.output_dir/(entry["id"]+".wav")
        mp3=args.output_dir/(entry["id"]+".mp3")
        sf.write(wav,audio,sr,subtype="PCM_16")
        subprocess.run(["ffmpeg","-nostdin","-y","-hide_banner","-loglevel","error","-i",str(wav),"-codec:a","libmp3lame","-b:a","192k",str(mp3)],check=True)
        wav.unlink()
        metadata={"id":entry["id"],"duration_sec":round(len(audio)/sr,3),"characters":len(text),"text":text,"file":mp3.name}
        manifest["scenes"].append(metadata)
        print(f"COMPLETE {i}/{len(scenes)} {entry['id']} {metadata['duration_sec']}s",flush=True)
    (args.output_dir/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    print("FINISH",len(scenes),flush=True)

if __name__=="__main__":
    import sys
    inp=sys.argv.index("--input") if "--input" in sys.argv else -1
    if inp>=0 and inp+1<len(sys.argv):
        raw=Path(sys.argv[inp+1]).read_text(encoding="utf-8")
        try:
            payload=json.loads(raw)
        except json.JSONDecodeError:
            payload=None
        if isinstance(payload,dict) and isinstance(payload.get("scenes"),list):
            ap=argparse.ArgumentParser()
            ap.add_argument("--input",type=Path,required=True)
            ap.add_argument("--output-dir",type=Path,required=True)
            ap.add_argument("--voice",choices=VOICES,default="em_alex")
            ap.add_argument("--speed",type=float,default=0.94)
            args=ap.parse_args()
            batch_main(raw,args)
            sys.exit(0)
    main()
