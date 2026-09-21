import React, { useEffect, useRef, useState } from 'react';
import { useStudioStore } from '../store.js';

export default function BootSequence({ onReady }) {
  const criticalAssetReady = useStudioStore((state) => state.startup.criticalAssetReady);
  const firstFrameReady = useStudioStore((state) => state.startup.firstFrameReady);
  const [fontsReady, setFontsReady] = useState(() => typeof document === 'undefined' || !document.fonts);
  const [leaving, setLeaving] = useState(false);
  const [displayedProgress, setDisplayedProgress] = useState(8);
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

  const targetProgress = !criticalAssetReady ? 28 : !firstFrameReady ? 78 : !fontsReady ? 92 : 100;
  useEffect(() => {
    const timer = window.setInterval(() => {
      setDisplayedProgress((current) => {
        if (current >= targetProgress) return current;
        return Math.min(targetProgress, current + Math.max(1, (targetProgress - current) * .16));
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [targetProgress]);

  useEffect(() => {
    if (releaseStarted.current || !criticalAssetReady || !firstFrameReady || !fontsReady) return undefined;
    releaseStarted.current = true;
    const minimumVisible = 900;
    const elapsed = performance.now() - startedAt.current;
    const timer = window.setTimeout(() => setLeaving(true), Math.max(0, minimumVisible - elapsed) + 120);
    return () => window.clearTimeout(timer);
  }, [criticalAssetReady, firstFrameReady, fontsReady]);

  useEffect(() => {
    if (!leaving) return undefined;
    const timer = window.setTimeout(() => onReady?.(), 440);
    return () => window.clearTimeout(timer);
  }, [leaving, onReady]);

  const copy = !criticalAssetReady
    ? 'Cargando sala'
    : !firstFrameReady
      ? 'Preparando imagen'
      : !fontsReady
        ? 'Preparando interfaz'
        : 'Entrando al estudio';

  return <div className={`boot-sequence ${leaving ? 'leaving' : ''}`} role="status" aria-live="polite">
    <div className="boot-ambient" aria-hidden="true"/>
    <div className="boot-center">
      <span className="boot-mark" aria-hidden="true">{[10,22,34,22,10].map((height,index)=><i key={index} style={{height}}/>)}</span>
      <div className="boot-wordmark"><b>DEEP MUSIC</b><small>PRODUCER</small></div>
      <div className="boot-copy">{copy}</div>
      <div className="boot-progress" aria-hidden="true"><i style={{transform:`scaleX(${displayedProgress/100})`}}/></div>
      <div className="boot-meta"><span>VISUAL TWIN V7</span><span>{Math.round(displayedProgress)}%</span></div>
    </div>
  </div>;
}
