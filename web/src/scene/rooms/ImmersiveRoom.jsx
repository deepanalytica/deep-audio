import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import AssetModel from '../../assets/AssetModel.jsx';
import { getAsset } from '../../assets/assetRegistry.js';
import { useStudioStore } from '../../store.js';
import { RoomJewelryLayer } from '../hardware/JewelryLayers.jsx';

const ROOM_DESIGNS = Object.freeze({
  practice: {
    assetId: 'practice_room_001',
    accent: '#1688ff',
    warm: '#e49456',
    hitboxes: [
      { id: 'drum_kit', type: 'RHYTHM STATION', title: 'Deep Session Drums', description: 'Kit, groove, dinámica y relación con la sala.', actions: ['Pocket', 'Open', 'Half-time', 'Roomy'], position: [0, .88, -2.9], size: [2.45, 1.9, 2.0], focus: { position: [0, 1.85, .55], target: [0, .9, -2.9] } },
      { id: 'bass_stack', type: 'BASS AMPLIFIER', title: 'Deep Bass Stack', description: 'Carácter, gabinete y presencia para el bajista de sesión.', actions: ['Round', 'Modern', 'Driven', 'Direct'], position: [-3.25, .82, -4.35], size: [1.5, 1.7, .78], focus: { position: [-1.5, 1.55, -1.5], target: [-3.25, .85, -4.35] } },
      { id: 'guitar_combo', type: 'GUITAR AMPLIFIER', title: 'Deep Guitar Combo', description: 'Respuesta limpia, crunch y texturas ambientales.', actions: ['Clean', 'Crunch', 'Ambient', 'Bypass'], position: [3.3, .8, -4.25], size: [1.5, 1.7, .78], focus: { position: [1.5, 1.55, -1.5], target: [3.3, .85, -4.25] } },
      { id: 'practice_keys', type: 'KEYS', title: 'Practice Keys', description: 'Piano, eléctricos y órgano preparados para tocar.', actions: ['Grand', 'Rhodes', 'Organ', 'Layer'], position: [2.35, 1.05, -5.25], size: [2.5, .75, .85], focus: { position: [.9, 1.65, -2.2], target: [2.35, 1.0, -5.25] } }
    ]
  },
  record: {
    assetId: 'recording_room_001',
    accent: '#1688ff',
    warm: '#e9a05b',
    hitboxes: [
      { id: 'vocal_mic', type: 'CAPTURE CHAIN', title: 'Deep Vocal Capture', description: 'Micrófono, previo y dinámica de entrada sin perder la sala.', actions: ['Intimate', 'Open', 'Air', 'Dark'], position: [2.5, 1.55, -2.1], size: [.9, 2.0, .9], focus: { position: [1.15, 1.7, .35], target: [2.5, 1.55, -2.1] } },
      { id: 'vocal_booth', type: 'ISOLATION SPACE', title: 'Vocal Booth', description: 'Perspectiva, absorción y distancia de captura.', actions: ['Dry', 'Natural', 'Wide', 'Talkback'], position: [2.55, 1.55, -2.55], size: [3.0, 3.15, 3.2], focus: { position: [-.2, 1.9, .5], target: [2.5, 1.45, -2.55] } },
      { id: 'recording_front_end', type: 'RECORDING RACK', title: 'Deep Recording Front End', description: 'Previos, filtros y control de entrada para una toma segura.', actions: ['Vocal', 'Drums', 'Guitar', 'Line'], position: [3.72, 1.12, -4.75], size: [1.4, 2.3, .82], focus: { position: [1.55, 1.65, -1.9], target: [3.72, 1.12, -4.75] } },
      { id: 'recording_drums', type: 'LIVE KIT', title: 'Tracking Drums', description: 'Kit y perspectiva de room para capturar una interpretación completa.', actions: ['Tight', 'Live', 'Parallel', 'Room'], position: [-1.65, .9, -3.2], size: [2.5, 1.9, 2.1], focus: { position: [-.3, 1.8, .35], target: [-1.65, .9, -3.2] } }
    ]
  },
  production: {
    assetId: 'production_room_001',
    accent: '#1688ff',
    warm: '#bd70dc',
    hitboxes: [
      { id: 'studio_keyboard', type: 'PERFORMANCE KEYS', title: 'Deep Studio Keyboard', description: 'Piano, síntesis y capas desde la posición central.', actions: ['Grand', 'Electric', 'Analog', 'Layer'], position: [0, 1.05, -1.18], size: [3.7, .55, .9], focus: { position: [0, 2.0, 1.25], target: [0, 1.0, -1.18] } },
      { id: 'synth_rack_left', type: 'MODULAR SYNTH', title: 'Modular Voice A', description: 'Osciladores, filtros, modulación y patching táctil.', actions: ['Warm Pad', 'Sequence', 'Bass', 'Init'], position: [-3.22, 1.32, -3.65], size: [1.7, 2.7, .9], focus: { position: [-1.25, 1.8, -.9], target: [-3.22, 1.3, -3.65] } },
      { id: 'synth_rack_right', type: 'MODULAR SYNTH', title: 'Modular Voice B', description: 'Texturas, movimiento y capas complementarias.', actions: ['Motion', 'Texture', 'Lead', 'Init'], position: [3.22, 1.32, -3.65], size: [1.7, 2.7, .9], focus: { position: [1.25, 1.8, -.9], target: [3.22, 1.3, -3.65] } },
      { id: 'pad_controller', type: 'BEAT CONTROLLER', title: 'Deep Rhythm Pads', description: 'Disparo de patrones, percusión y variaciones de groove.', actions: ['Drums', 'Percussion', 'Chops', 'Scene'], position: [-1.85, 1.18, -1], size: [1.2, .45, .8], focus: { position: [-.8, 1.8, .8], target: [-1.85, 1.15, -1] } }
    ]
  },
  mix: {
    assetId: 'mix_room_001',
    accent: '#1688ff',
    warm: '#d69a55',
    hitboxes: [
      { id: 'mix_console', type: 'MIX CONSOLE', title: 'Deep Spatial Console', description: 'Balance, panorama, profundidad, buses y automatización.', actions: ['Balance', 'Depth', 'Glue', 'Automation'], position: [0, 1.05, -1.15], size: [6.45, 1.35, 1.8], focus: { position: [0, 2.25, 1.0], target: [0, 1.05, -1.75] } },
      { id: 'mix_monitor_left', type: 'REFERENCE MONITOR', title: 'Mix Monitor · Left', description: 'Referencia principal, mono y escucha a bajo nivel.', actions: ['Reference A', 'Reference B', 'Mono', 'Low Level'], position: [-2.45, 1.48, -5.15], size: [1.15, 1.55, .82], focus: { position: [-1.0, 1.75, -2.2], target: [-2.45, 1.48, -5.15] } },
      { id: 'mix_monitor_right', type: 'REFERENCE MONITOR', title: 'Mix Monitor · Right', description: 'Referencia principal, mono y escucha a bajo nivel.', actions: ['Reference A', 'Reference B', 'Mono', 'Low Level'], position: [2.45, 1.48, -5.15], size: [1.15, 1.55, .82], focus: { position: [1.0, 1.75, -2.2], target: [2.45, 1.48, -5.15] } },
      { id: 'mix_dynamics_rack', type: 'MIX OUTBOARD', title: 'Dynamics Rack', description: 'Compresión, control de transitorios y color de bus.', actions: ['Transparent', 'Punch', 'Glue', 'Bypass'], position: [-3.65, 1.12, -3.85], size: [1.45, 2.3, .88], focus: { position: [-1.5, 1.65, -1.3], target: [-3.65, 1.12, -3.85] } },
      { id: 'mix_spatial_fx_rack', type: 'SPATIAL FX', title: 'Depth & Space Rack', description: 'Ambientes, delays y perspectiva estéreo.', actions: ['Studio', 'Plate', 'Chamber', 'Echo'], position: [3.65, 1.12, -3.85], size: [1.45, 2.3, .88], focus: { position: [1.5, 1.65, -1.3], target: [3.65, 1.12, -3.85] } }
    ]
  }
});

function RoomHitbox({ hotspot, accent }) {
  const group = useRef();
  const select = useStudioStore((state) => state.select);
  const selected = useStudioStore((state) => state.selected?.id === hotspot.id);
  const [hovered, setHovered] = useState(false);

  useEffect(() => () => {
    if (hovered) document.body.style.cursor = 'default';
  }, [hovered]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = hovered || selected ? 1.015 : 1;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, target, 12, delta));
  });

  return <group
    ref={group}
    position={hotspot.position}
    name={`${hotspot.id}_interaction`}
    userData={{ interactionId: hotspot.id }}
    onClick={(event) => { event.stopPropagation(); select(hotspot); }}
    onPointerOver={(event) => {
      event.stopPropagation();
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }}
    onPointerOut={() => {
      setHovered(false);
      document.body.style.cursor = 'default';
    }}
  >
    <mesh>
      <boxGeometry args={hotspot.size}/>
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/>
    </mesh>
    {(hovered || selected) && <>
      <pointLight position={[0, .6, .4]} color={accent} intensity={1.15} distance={2.8}/>
      <mesh position={[0, -hotspot.size[1] / 2 + .018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[.19, .235, 40]}/>
        <meshBasicMaterial color={accent} transparent opacity={.42} toneMapped={false}/>
      </mesh>
    </>}
  </group>;
}

function DesignedLighting({ design }) {
  return <>
    <ambientLight intensity={.28}/>
    <hemisphereLight args={['#dceaff', '#080a0d', .72]}/>
    <spotLight position={[0, 4.2, 1.2]} intensity={72} angle={.62} penumbra={.86} decay={1.7} distance={15} color="#f5c48e" castShadow shadow-mapSize={[1024, 1024]}/>
    <pointLight position={[-3.5, 2.1, -2.8]} intensity={9} distance={7} decay={2} color={design.accent}/>
    <pointLight position={[3.3, 1.8, -3.4]} intensity={7} distance={6.5} decay={2} color={design.warm}/>
    <Environment resolution={160}>
      <Lightformer intensity={2.8} color="#f0d4af" position={[0, 4.2, -1.4]} scale={[5.5, 1.1, 1]} rotation-x={Math.PI / 2}/>
      <Lightformer intensity={1.5} color={design.accent} position={[-4.2, 1.8, -2.2]} scale={[2.1, 3.0, 1]} rotation-y={Math.PI / 2}/>
      <Lightformer intensity={1.15} color={design.warm} position={[4.2, 1.7, -2.6]} scale={[2.1, 2.8, 1]} rotation-y={-Math.PI / 2}/>
    </Environment>
  </>;
}

export default function ImmersiveRoom({ room, fallback }) {
  const design = ROOM_DESIGNS[room];
  const asset = getAsset(design.assetId);

  return <group name={`${design.assetId}_scene`} userData={{ designSystem: 'immersive-room-001', glbAvailable: asset.available }}>
    <AssetModel assetId={design.assetId} fallback={fallback}/>
    <DesignedLighting design={design}/>
    <RoomJewelryLayer room={room}/>
    {design.hitboxes.map((hotspot) => <RoomHitbox key={hotspot.id} hotspot={hotspot} accent={design.accent}/>)}
  </group>;
}
