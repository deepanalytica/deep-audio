import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, useGLTF } from '@react-three/drei';
import StudioScene from './StudioScene.jsx';
import { useStudioStore } from '../store.js';
import { getAsset, resolveAssetUrl } from '../assets/assetRegistry.js';

export default function StudioCanvas(){
  const closeSelected=useStudioStore((state)=>state.closeSelected);
  const criticalAssetReady=useStudioStore((state)=>state.startup.criticalAssetReady);

  useEffect(()=>{
    if(!criticalAssetReady)return undefined;
    const ids=['recording_room_001','production_room_001','mix_room_001','mastering_room_001'];
    const timers=[];
    let cancelled=false;
    const preloadNext=(index)=>{
      if(cancelled||index>=ids.length)return;
      const run=()=>{
        if(cancelled)return;
        const asset=getAsset(ids[index]);
        if(asset.available)useGLTF.preload(resolveAssetUrl(asset));
        timers.push(window.setTimeout(()=>preloadNext(index+1),240));
      };
      if('requestIdleCallback' in window)window.requestIdleCallback(run,{timeout:1000});
      else timers.push(window.setTimeout(run,400));
    };
    preloadNext(0);
    return()=>{
      cancelled=true;
      timers.forEach(window.clearTimeout);
    };
  },[criticalAssetReady]);

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
