import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import StudioScene from './scene/StudioScene.jsx';
import Hud from './ui/Hud.jsx';
import { useStudioStore } from './store.js';

export default function App(){
  const closeSelected=useStudioStore((s)=>s.closeSelected);
  return <main className="app-shell">
    <Canvas
      shadows
      dpr={[1,1.75]}
      camera={{position:[0,1.62,7.7],fov:50,near:.05,far:60}}
      gl={{antialias:true,powerPreference:'high-performance',alpha:false}}
      onPointerMissed={closeSelected}
    >
      <Suspense fallback={null}><StudioScene/></Suspense>
    </Canvas>
    <Hud/>
  </main>;
}
