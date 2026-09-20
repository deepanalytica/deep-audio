import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import StudioScene from './scene/StudioScene.jsx';
import Hud from './ui/Hud.jsx';
import { useStudioStore } from './store.js';

export default function App(){
  const closeSelected=useStudioStore((s)=>s.closeSelected);
  return <main className="app-shell">
    <Canvas
      shadows="percentage"
      dpr={[1,2]}
      camera={{position:[0,1.62,7.7],fov:46,near:.05,far:70}}
      gl={{antialias:true,powerPreference:'high-performance',alpha:false,stencil:false,depth:true}}
      onPointerMissed={closeSelected}
    >
      <Suspense fallback={null}><StudioScene/></Suspense>
    </Canvas>
    <Hud/>
  </main>;
}
