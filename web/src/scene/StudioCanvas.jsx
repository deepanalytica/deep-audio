import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import StudioScene from './StudioScene.jsx';
import { useStudioStore } from '../store.js';

export default function StudioCanvas(){
  const closeSelected=useStudioStore((state)=>state.closeSelected);
  return <Canvas
    className="studio-canvas"
    aria-hidden="true"
    shadows="percentage"
    dpr={[1,1.5]}
    performance={{min:.55}}
    camera={{position:[0,1.62,7.7],fov:50,near:.05,far:60}}
    gl={{antialias:false,powerPreference:'high-performance',alpha:false}}
    onPointerMissed={closeSelected}
  >
    <AdaptiveDpr pixelated/>
    <Suspense fallback={null}><StudioScene/></Suspense>
  </Canvas>;
}
