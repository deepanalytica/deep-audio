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

if __name__=="__main__":
    main()
