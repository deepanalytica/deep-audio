import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CameraControls, ContactShadows, Environment, Lightformer, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useStudioStore } from '../store.js';
import { ROOMS } from '../data.js';
import {
  RoomShell, StudioMonitor, Rack, Amplifier, Guitar, DrumKit, Keyboard,
  SynthRack, ConsoleDesk, Microphone, SessionPlayer, AcousticPanel
} from './objects.jsx';

function CameraRig(){
  const controls=useRef();
  const room=useStudioStore((s)=>s.room);
  const keys=useRef(new Set());

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
    const cfg=ROOMS[room].camera;
    controls.current?.setLookAt(...cfg.position,...cfg.target,true);
  },[room]);

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
    smoothTime={.32}
    draggingSmoothTime={.16}
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

function PracticeRoom({accent,players}){
  return <group>
    <DrumKit position={[0,0,-3.7]} accent={accent}/>
    <Amplifier position={[-4.75,.85,-4.4]} label="Bass Stack"/>
    <Amplifier position={[4.75,.85,-4.4]} label="Guitar Combo" color="#302522"/>
    <Guitar position={[-5.6,0,-6.8]} label="Session Bass" bass color="#6f3d26"/>
    <Guitar position={[5.45,0,-6.8]} label="Electric Guitar" color="#a55b2f"/>
    <Keyboard position={[3.65,0,-7.3]} label="Practice Keys"/>
    <StudioMonitor position={[-2.8,1,-7.45]} scale={.78}/>
    <StudioMonitor position={[2.8,1,-7.45]} scale={.78}/>
    <SessionPlayer role="drummer" active={players.includes('drummer')} position={[0,0,-4.25]} accent={accent}/>
    <SessionPlayer role="bassist" active={players.includes('bassist')} position={[-3.4,0,-2.8]} accent="#b98758"/>
    <SessionPlayer role="guitarist" active={players.includes('guitarist')} position={[3.5,0,-2.8]} accent="#a96a55"/>
    <SessionPlayer role="keys" active={players.includes('keys')} position={[3.7,0,-6.95]} accent="#6d82a1"/>
  </group>;
}

function RecordRoom({accent,players}){
  return <group>
    <DrumKit position={[-2.1,0,-4.2]} accent={accent}/>
    <Microphone position={[2.35,0,-2.8]}/>
    <GlassBooth/>
    <Amplifier position={[-5.25,.85,-5.6]} label="Bass Recording Stack"/>
    <Amplifier position={[5.1,.85,-5.4]} label="Guitar Tracking Amp" color="#382220"/>
    <Rack position={[5.65,0,-7.1]} label="Mic Pre / Comp" accent={accent}/>
    <Guitar position={[5.2,0,-7.45]} label="Tracking Guitar" color="#8e3d2e"/>
    <SessionPlayer role="drummer" active={players.includes('drummer')} position={[-2.1,0,-4.75]} accent={accent}/>
    <SessionPlayer role="bassist" active={players.includes('bassist')} position={[-4,0,-2.8]} accent="#a76b55"/>
    <SessionPlayer role="guitarist" active={players.includes('guitarist')} position={[4.0,0,-3]} accent="#a76b55"/>
  </group>;
}

function ProductionRoom({accent,players}){
  return <group>
    <Keyboard position={[0,0,-3.2]} label="Studio Grand / Keys"/>
    <SynthRack position={[-4.7,0,-5.25]} accent={accent}/>
    <SynthRack position={[4.7,0,-5.25]} accent="#62c9c0"/>
    <Amplifier position={[-4.8,.85,-2.25]} label="Production Guitar Amp" color="#282128"/>
    <Rack position={[5.55,0,-7]} label="Texture / FX Rack" accent={accent}/>
    <StudioMonitor position={[-2.8,1,-7.45]} scale={.78}/>
    <StudioMonitor position={[2.8,1,-7.45]} scale={.78}/>
    <SessionPlayer role="keys" active={players.includes('keys')} position={[0,0,-4]} accent="#7764b5"/>
    <SessionPlayer role="synth" active={players.includes('synth')} position={[-4.25,0,-3.2]} accent={accent}/>
    <SessionPlayer role="guitarist" active={players.includes('guitarist')} position={[4.25,0,-3.1]} accent="#9a668d"/>
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

function MasterRoom({accent}){
  return <group>
    <ConsoleDesk position={[0,0,-2.9]} master accent={accent}/>
    <StudioMonitor position={[-3.6,1.08,-6.15]} scale={1.18} label="Master Left"/>
    <StudioMonitor position={[3.6,1.08,-6.15]} scale={1.18} label="Master Right"/>
    <Rack position={[-5.7,0,-5.9]} label="Master EQ / Dynamics" accent={accent}/>
    <Rack position={[5.7,0,-5.9]} label="Limiter / Metering" accent="#e1b163"/>
    <MeterScreen accent={accent} master/>
    <AcousticPanel position={[-6.65,3,-4.35]} rotation={[0,Math.PI/2,0]} color="#3a332a"/>
    <AcousticPanel position={[6.65,3,-4.35]} rotation={[0,-Math.PI/2,0]} color="#3a332a"/>
  </group>;
}

function StudioLighting({accent}){
  return <>
    <ambientLight intensity={.14}/>
    <hemisphereLight args={['#d9c6ae','#0b0d0e',.75]}/>
    <spotLight position={[0,6,3]} intensity={75} angle={.48} penumbra={.62} decay={1.4} distance={24} color="#f6dfbd" castShadow shadow-mapSize={[1024,1024]}/>
    <pointLight position={[-4.5,3,-2]} intensity={22} distance={10} decay={2} color={accent}/>
    <pointLight position={[4.4,2.6,-1.5]} intensity={14} distance={10} decay={2} color="#6f8fa5"/>
    <Environment resolution={128}>
      <Lightformer intensity={2.2} color="#fff2dc" position={[0,5,-3]} scale={[6,1,1]} rotation-x={Math.PI/2}/>
      <Lightformer intensity={1.2} color={accent} position={[-5,2,-1]} scale={[2,3,1]} rotation-y={Math.PI/2}/>
      <Lightformer intensity={.8} color="#8aa7b8" position={[5,2,-1]} scale={[2,3,1]} rotation-y={-Math.PI/2}/>
    </Environment>
  </>;
}

export default function StudioScene(){
  const room=useStudioStore((s)=>s.room);
  const players=useStudioStore((s)=>s.activePlayers);
  const cfg=ROOMS[room];

  return <>
    <color attach="background" args={[cfg.bg]}/>
    <fog attach="fog" args={[cfg.bg,9,24]}/>
    <CameraRig/>
    <StudioLighting accent={cfg.accent}/>
    <RoomShell accent={cfg.accent} variant={room}/>
    {room==='practice'&&<PracticeRoom accent={cfg.accent} players={players}/>}
    {room==='record'&&<RecordRoom accent={cfg.accent} players={players}/>}
    {room==='production'&&<ProductionRoom accent={cfg.accent} players={players}/>}
    {room==='mix'&&<MixRoom accent={cfg.accent}/>}
    {room==='master'&&<MasterRoom accent={cfg.accent}/>}
    <ContactShadows position={[0,.035,-2.5]} opacity={.48} scale={16} blur={2.4} far={8} color="#000000"/>
    <Sparkles count={room==='production'?34:14} scale={[13,5,12]} size={.7} speed={.12} opacity={.12} color={cfg.accent}/>
    <EffectComposer multisampling={4}>
      <Bloom intensity={.38} luminanceThreshold={1.05} luminanceSmoothing={.5}/>
      <Noise opacity={.018}/>
      <Vignette eskil={false} offset={.14} darkness={.72}/>
    </EffectComposer>
  </>;
}
