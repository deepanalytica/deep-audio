import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import StudioScene from './scene/StudioScene.jsx';
import Hud from './ui/Hud.jsx';
import BootSequence from './ui/BootSequence.jsx';
import RoomTransition from './ui/RoomTransition.jsx';
import { useStudioStore } from './store.js';
import { getAsset, resolveAssetUrl } from './assets/assetRegistry.js';

export default function App(){
  const closeSelected=useStudioStore((s)=>s.closeSelected);
  const [ready,setReady]=useState(false);
  const finishBoot=useCallback(()=>setReady(true),[]);

  useEffect(()=>{
    if(!ready)return undefined;
    const ids=['recording_room_001','mix_room_001','mastering_room_001'];
    let cancelled=false;
    const preloadNext=(index)=>{
      if(cancelled||index>=ids.length)return;
      const run=()=>{
        if(cancelled)return;
        const asset=getAsset(ids[index]);
        if(asset.available)useGLTF.preload(resolveAssetUrl(asset));
        window.setTimeout(()=>preloadNext(index+1),220);
      };
      if('requestIdleCallback' in window)window.requestIdleCallback(run,{timeout:900});
      else window.setTimeout(run,350);
    };
    preloadNext(0);
    return()=>{cancelled=true};
  },[ready]);

  return <main className={'app-shell '+(ready?'app-ready':'app-loading')}>
    <Canvas
      shadows="percentage"
      dpr={[1,1.5]}
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