import React, { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';

export default function BootSequence({ onReady }) {
  const { active, progress, total, loaded } = useProgress();
  const [leaving, setLeaving] = useState(false);
  const sawLoad = useRef(false);
  const startedAt = useRef(performance.now());

  useEffect(() => {
    if (active || total > 0) sawLoad.current = true;

    const minimumVisible = 900;
    const elapsed = performance.now() - startedAt.current;
    const remaining = Math.max(0, minimumVisible - elapsed);

    if (!active && progress >= 100 && (sawLoad.current || total === loaded)) {
      const timer = window.setTimeout(async () => {
        try {
          if (document.fonts?.ready) await document.fonts.ready;
        } catch {}
        setLeaving(true);
        window.setTimeout(() => onReady?.(), 420);
      }, remaining + 160);
      return () => window.clearTimeout(timer);
    }
  }, [active, progress, total, loaded, onReady]);

  useEffect(() => {
    const fallback = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => onReady?.(), 420);
    }, 5200);
    return () => window.clearTimeout(fallback);
  }, [onReady]);

  return <div className={'boot-sequence '+(leaving?'leaving':'')} role="status" aria-live="polite">
    <div className="boot-ambient"/>
    <div className="boot-center">
      <span className="boot-mark">{[10,22,34,22,10].map((h,i)=><i key={i} style={{height:h}}/>)}</span>
      <div className="boot-wordmark"><b>DEEP MUSIC</b><small>PRODUCER</small></div>
      <div className="boot-copy">Preparando el estudio</div>
      <div className="boot-progress"><i style={{width:Math.max(8,Math.min(100,progress||8))+'%'}}/></div>
      <div className="boot-meta">
        <span>{total>0?loaded+'/'+total:'VISUAL TWIN'}</span>
        <span>{Math.round(progress||0)}%</span>
      </div>
    </div>
  </div>;
}
