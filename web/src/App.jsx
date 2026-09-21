import React, { Suspense, lazy } from 'react';
import Hud from './ui/Hud.jsx';

const StudioCanvas=lazy(()=>import('./scene/StudioCanvas.jsx'));

function SceneLoading(){
  return <div className="scene-loading" role="status" aria-live="polite">
    <span className="loading-wave" aria-hidden="true">{[12,24,38,28,16,32,20].map((height,index)=><i key={index} style={{height}}/>)}</span>
    <div><b>Preparando el estudio</b><small>Cargando la sala inmersiva</small></div>
  </div>;
}

class SceneErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={failed:false}}
  static getDerivedStateFromError(){return {failed:true}}
  componentDidCatch(error){console.error('[StudioScene] No se pudo iniciar la experiencia 3D.',error)}
  render(){
    if(this.state.failed)return <div className="scene-error" role="alert">
      <b>La sala 3D no pudo iniciarse.</b>
      <p>Los controles de audio siguen disponibles. Puedes intentar cargar la sala otra vez.</p>
      <button type="button" onClick={()=>this.setState({failed:false})}>Reintentar sala</button>
    </div>;
    return this.props.children;
  }
}

export default function App(){
  return <main className="app-shell">
    <a className="skip-link" href="#transport">Ir al transporte</a>
    <section className="scene-viewport" aria-label="Sala de estudio inmersiva">
      <SceneErrorBoundary>
        <Suspense fallback={<SceneLoading/>}><StudioCanvas/></Suspense>
      </SceneErrorBoundary>
    </section>
    <Hud/>
  </main>;
}
