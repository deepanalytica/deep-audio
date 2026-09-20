import React, { Suspense, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import StudioScene from './scene/StudioScene.jsx';
import Hud from './ui/Hud.jsx';
import BootSequence from './ui/BootSequence.jsx';
import RoomTransition from './ui/RoomTransition.jsx';
import { useStudioStore } from './store.js';

export default function App(){
  const closeSelected=useStudioStore((s)=>s.closeSelected);
  const [ready,setReady]=useState(false);
  const finishBoot=useCallback(()=>setReady(true),[]);

  return <main className={'app-shell '+(ready?'app-ready':'app-loading')}>
    <Canvas
      shadows="percentage"
      dpr={[1,2]}
      camera={{position:[0,1.62,7.7],fov:46,near:.05,far:70}}
      gl={{antialias:true,powerPreference:'high-performance',alpha:false,stencil:false,depth:true}}
      onPointerMissed={closeSelected}
    >
      <Suspense fallback={null}><StudioScene/></Suspense>
    </Canvas>
    {ready&&<Hud/>}
    {ready&&<RoomTransition/>}
    {!ready&&<BootSequence onReady={finishBoot}/>}
  </main>;
}