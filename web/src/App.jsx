import React, { Suspense, lazy, useCallback, useState } from 'react';
import Hud from './ui/Hud.jsx';
import BootSequence from './ui/BootSequence.jsx';
import RoomTransition from './ui/RoomTransition.jsx';

const StudioCanvas = lazy(() => import('./scene/StudioCanvas.jsx'));

function SceneLoading() {
  return <div className="scene-loading" role="status" aria-live="polite">
    <span className="loading-wave" aria-hidden="true">
      {[12, 24, 38, 28, 16, 32, 20].map((height, index) => <i key={index} style={{ height }}/>) }
    </span>
    <div><b>Preparando el estudio</b><small>Cargando la sala inmersiva</small></div>
  </div>;
}

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[StudioScene] No se pudo iniciar la experiencia 3D.', error);
    this.props.onError?.();
  }

  render() {
    if (this.state.failed) return <div className="scene-error" role="alert">
      <b>La sala 3D no pudo iniciarse.</b>
      <p>Los controles de audio siguen disponibles. Puedes intentar cargar la sala otra vez.</p>
      <button type="button" onClick={() => this.setState({ failed: false })}>Reintentar sala</button>
    </div>;
    return this.props.children;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const finishBoot = useCallback(() => setReady(true), []);

  return <main className={`app-shell ${ready ? 'app-ready' : 'app-loading'}`}>
    <a className="skip-link" href="#transport">Ir al transporte</a>
    <section className="scene-viewport" aria-label="Sala de estudio inmersiva">
      <SceneErrorBoundary onError={finishBoot}>
        <Suspense fallback={<SceneLoading/>}><StudioCanvas/></Suspense>
      </SceneErrorBoundary>
    </section>
    {ready && <Hud/>}
    {ready && <RoomTransition/>}
    {!ready && <BootSequence onReady={finishBoot}/>}
  </main>;
}
