import React, { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useStudioStore } from '../store.js';

export default function BootSequence({ onReady }) {
  const { active, progress, total, loaded } = useProgress();
  const criticalAssetReady = useStudioStore((state) => state.startup.criticalAssetReady);
  const firstFrameReady = useStudioStore((state) => state.startup.firstFrameReady);
  const [fontsReady, setFontsReady] = useState(!document.fonts);
  const [leaving, setLeaving] = useState(false);
  const startedAt = useRef(performance.now());
  const releaseStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!document.fonts?.ready) {
      setFontsReady(true);
      return undefined;
    }

    document.fonts.ready
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setFontsReady(true);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (
      releaseStarted.current ||
      !criticalAssetReady ||
      !firstFrameReady ||
      !fontsReady ||
      active
    ) return undefined;

    releaseStarted.current = true;
    const minimumVisible = 900;
    const elapsed = performance.now() - startedAt.current;
    const wait = Math.max(0, minimumVisible - elapsed) + 120;

    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => onReady?.(), 440);
    }, wait);

    return () => window.clearTimeout(timer);
  }, [active, criticalAssetReady, firstFrameReady, fontsReady, onReady]);

  const reportedProgress = total > 0
    ? Math.max(1, Math.min(100, progress))
    : criticalAssetReady
      ? 92
      : 8;

  const copy = !criticalAssetReady
    ? 'Cargando sala'
    : !firstFrameReady
      ? 'Preparando imagen'
      : !fontsReady
        ? 'Preparando interfaz'
        : 'Entrando al estudio';

  return <div className={'boot-sequence '+(leaving?'leaving':'')} role="status" aria-live="polite">
    <div className="boot-ambient"/>
    <div className="boot-center">
      <span className="boot-mark">{[10,22,34,22,10].map((h,i)=><i key={i} style={{height:h}}/>)}</span>
      <div className="boot-wordmark"><b>DEEP MUSIC</b><small>PRODUCER</small></div>
      <div className="boot-copy">{copy}</div>
      <div className="boot-progress"><i style={{width:reportedProgress+'%'}}/></div>
      <div className="boot-meta">
        <span>{total>0?loaded+'/'+total:'VISUAL TWIN'}</span>
        <span>{Math.round(reportedProgress)}%</span>
      </div>
    </div>
  </div>;
}
