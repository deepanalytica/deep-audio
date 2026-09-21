import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls, ContactShadows, RoundedBox } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useStudioStore } from '../store.js';
import { ROOMS } from '../data.js';
import {
  RoomShell, StudioMonitor, Rack, Amplifier, Guitar, DrumKit, Keyboard,
  SynthRack, ConsoleDesk, Microphone, SessionPlayer, AcousticPanel
} from './objects.jsx';
import MasteringRoom001 from './mastering/MasteringRoom.jsx';
import ImmersiveRoom from './rooms/ImmersiveRoom.jsx';
import StudioCinematography from '../visual/StudioCinematography.jsx';

function useReducedMotion(){
  const [reduced,setReduced]=React.useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);
    media.addEventListener?.('change',update);
    return()=>media.removeEventListener?.('change',update);
  },[]);
  return reduced;
}

function CameraRig(){
  const controls=useRef();
  const room=useStudioStore((s)=>s.room);
  const selected=useStudioStore((s)=>s.selected);
  const keys=useRef(new Set());
  const reducedMotion=useReducedMotion();

  useEffect(()=>{
    const down=(e)=>{
      if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
      keys.current.add(e.key.toLowerCase());
    };
    const up=(e)=>keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)};
  },[]);

  useEffect(()=>{
    const cfg=selected?.focus||ROOMS[room].camera;
    controls.current?.setLookAt(...cfg.position,...cfg.target,!reducedMotion);
  },[room,selected,reducedMotion]);

  useFrame((_,dt)=>{
    const c=controls.current;if(!c)return;
    const speed=dt*2.0;
    if(keys.current.has('w'))c.forward(speed,false);
    if(keys.current.has('s'))c.forward(-speed,false);
    if(keys.current.has('a'))c.truck(-speed,0,false);
    if(keys.current.has('d'))c.truck(speed,0,false);
  });

  return <CameraControls
    ref={controls}
    makeDefault
    smoothTime={reducedMotion?.01:.32}
    draggingSmoothTime={reducedMotion?.01:.16}
    dollySpeed={.45}
    truckSpeed={.8}
    minDistance={2.2}
    maxDistance={10.5}
    minPolarAngle={Math.PI*.31}
    maxPolarAngle={Math.PI*.66}
  />;
}

function GlassBooth(){
  return <group position={[2.45,1.55,-4.9]}>
    <mesh><boxGeometry args={[3.5,3.1,.06]}/><meshPhysicalMaterial color="#7da1ae" transmission={.68} thickness={.06} transparent opacity={.3} roughness={.12} metalness={.08}/></mesh>
    <mesh position={[-1.75,0,0]}><boxGeometry args={[.08,3.2,.12]}/><meshStandardMaterial color="#4d5154" metalness={.6}/></mesh>
    <mesh position={[1.75,0,0]}><boxGeometry args={[.08,3.2,.12]}/><meshStandardMaterial color="#4d5154" metalness={.6}/></mesh>
    <mesh position={[0,1.55,0]}><boxGeometry args={[3.55,.08,.12]}/><meshStandardMaterial color="#4d5154" metalness={.6}/></mesh>
  </group>;
}

function MeterScreen({position=[0,2.3,-6.8],accent='#3b9bc1',master=false}){
  const bars=useMemo(()=>Array.from({length:42},(_,i)=>.12+Math.abs(Math.sin(i*.41))*.72),[]);
  return <group position={position}>
    <RoundedBox args={[2.9,1.38,.09]} radius={.07} smoothness={4}><meshPhysicalMaterial color="#090c0e" roughness={.22} metalness={.45}/></RoundedBox>
    <mesh position={[0,0,.055]}><planeGeometry args={[2.68,1.15]}/><meshBasicMaterial color={master?'#23180d':'#07161d'}/></mesh>
    {bars.map((h,i)=><mesh key={i} position={[-1.18+i*.058,-.36+h*.32,.07]}>
      <boxGeometry args={[.026,h*.62,.008]}/><meshBasicMaterial color={i>34?'#e3a852':accent} transparent opacity={.82}/></mesh>
    )}
  </group>;
}

function PracticeRoom({accent}){
  return <group>
    <DrumKit position={[0,0,-3.7]} accent={accent}/>
    <Amplifier position={[-4.75,.85,-4.4]} label="Bass Stack"/>
    <Amplifier position={[4.75,.85,-4.4]} label="Guitar Combo" color="#302522"/>
    <Guitar position={[-5.6,0,-6.8]} label="Session Bass" bass color="#6f3d26"/>
    <Guitar position={[5.45,0,-6.8]} label="Electric Guitar" color="#a55b2f"/>
    <Keyboard position={[3.65,0,-7.3]} label="Practice Keys"/>
    <StudioMonitor position={[-2.8,1,-7.45]} scale={.78}/>
    <StudioMonitor position={[2.8,1,-7.45]} scale={.78}/>
  </group>;
}

function RecordRoom({accent}){
  return <group>
    <DrumKit position={[-2.1,0,-4.2]} accent={accent}/>
    <Microphone position={[2.35,0,-2.8]}/>
    <GlassBooth/>
    <Amplifier position={[-5.25,.85,-5.6]} label="Bass Recording Stack"/>
    <Amplifier position={[5.1,.85,-5.4]} label="Guitar Tracking Amp" color="#382220"/>
    <Rack position={[5.65,0,-7.1]} label="Mic Pre / Comp" accent={accent}/>
    <Guitar position={[5.2,0,-7.45]} label="Tracking Guitar" color="#8e3d2e"/>
  </group>;
}

function ProductionRoom({accent}){
  return <group>
    <Keyboard position={[0,0,-3.2]} label="Studio Grand / Keys"/>
    <SynthRack position={[-4.7,0,-5.25]} accent={accent}/>
    <SynthRack position={[4.7,0,-5.25]} accent="#62c9c0"/>
    <Amplifier position={[-4.8,.85,-2.25]} label="Production Guitar Amp" color="#282128"/>
    <Rack position={[5.55,0,-7]} label="Texture / FX Rack" accent={accent}/>
    <StudioMonitor position={[-2.8,1,-7.45]} scale={.78}/>
    <StudioMonitor position={[2.8,1,-7.45]} scale={.78}/>
  </group>;
}

function MixRoom({accent}){
  return <group>
    <ConsoleDesk position={[0,0,-2.85]} accent={accent}/>
    <StudioMonitor position={[-3.6,1.05,-6.1]} scale={1.08} label="Left Main"/>
    <StudioMonitor position={[3.6,1.05,-6.1]} scale={1.08} label="Right Main"/>
    <Rack position={[-5.65,0,-5.8]} label="Dynamics Rack" accent={accent}/>
    <Rack position={[5.65,0,-5.8]} label="FX / Spatial Rack" accent="#73c8df"/>
    <MeterScreen accent={accent}/>
    <AcousticPanel position={[-6.6,3,-4.4]} rotation={[0,Math.PI/2,0]}/>
    <AcousticPanel position={[6.6,3,-4.4]} rotation={[0,-Math.PI/2,0]}/>
  </group>;
}

function RoomPlayers({room,players,accent}){
  if(room==='practice')return <>
    <SessionPlayer role="drummer" active={players.includes('drummer')} position={[0,0,-3.45]} accent={accent}/>
    <SessionPlayer role="bassist" active={players.includes('bassist')} position={[-3.4,0,-1.35]} accent="#b98758"/>
    <SessionPlayer role="guitarist" active={players.includes('guitarist')} position={[3.45,0,-1.35]} accent="#a96a55"/>
    <SessionPlayer role="keys" active={players.includes('keys')} position={[2.35,0,-5.2]} accent="#6d82a1"/>
  </>;
  if(room==='record')return <>
    <SessionPlayer role="drummer" active={players.includes('drummer')} position={[-1.65,0,-3.65]} accent={accent}/>
    <SessionPlayer role="bassist" active={players.includes('bassist')} position={[-3.65,0,-1.4]} accent="#a76b55"/>
    <SessionPlayer role="guitarist" active={players.includes('guitarist')} position={[.15,0,-1.6]} accent="#a76b55"/>
  </>;
  if(room==='production')return <>
    <SessionPlayer role="keys" active={players.includes('keys')} position={[0,0,-1.75]} accent="#7764b5"/>
    <SessionPlayer role="synth" active={players.includes('synth')} position={[-3.15,0,-2.7]} accent={accent}/>
    <SessionPlayer role="guitarist" active={players.includes('guitarist')} position={[3.15,0,-2.5]} accent="#9a668d"/>
  </>;
  return null;
}

export default function StudioScene(){
  const room=useStudioStore((s)=>s.room);
  const criticalAssetReady=useStudioStore((s)=>s.startup.criticalAssetReady);
  const markFirstFrameReady=useStudioStore((s)=>s.markFirstFrameReady);
  const startupFrameCommitted=useRef(false);
  const players=useStudioStore((s)=>s.activePlayers);
  const compact=useThree((state)=>state.size.width<820);
  const reducedMotion=useReducedMotion();
  const cfg=ROOMS[room];
  useFrame(()=>{
    if(criticalAssetReady&&!startupFrameCommitted.current){
      startupFrameCommitted.current=true;
      markFirstFrameReady();
    }
  });

  const fallbacks={
    practice:<><RoomShell accent={cfg.accent} variant={room}/><PracticeRoom accent={cfg.accent}/></>,
    record:<><RoomShell accent={cfg.accent} variant={room}/><RecordRoom accent={cfg.accent}/></>,
    production:<><RoomShell accent={cfg.accent} variant={room}/><ProductionRoom accent={cfg.accent}/></>,
    mix:<><RoomShell accent={cfg.accent} variant={room}/><MixRoom accent={cfg.accent}/></>
  };

  return <>
    <color attach="background" args={[cfg.bg]}/>
    <fog attach="fog" args={[cfg.bg,11,30]}/>
    <StudioCinematography/>
    <CameraRig/>
    {room!=='master'&&<ImmersiveRoom room={room} fallback={fallbacks[room]}/>}
    {room!=='master'&&<RoomPlayers room={room} players={players} accent={cfg.accent}/>}
    {room==='master'&&<MasteringRoom001/>}
    <ContactShadows
      position={[0,.028,-2.5]}
      opacity={room==='master'?.34:.4}
      scale={room==='master'?11:18}
      blur={3.4}
      far={9}
      resolution={compact?256:512}
      color="#000000"
    />
    <EffectComposer multisampling={compact?0:2}>
      <Bloom
        intensity={room==='production'?.2:.14}
        luminanceThreshold={1.12}
        luminanceSmoothing={.42}
      />
      {!reducedMotion&&<Noise opacity={.006}/>}
      <Vignette eskil={false} offset={.19} darkness={.48}/>
    </EffectComposer>
  </>;
}
