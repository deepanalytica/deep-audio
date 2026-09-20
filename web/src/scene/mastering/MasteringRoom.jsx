import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import AssetModel from '../../assets/AssetModel.jsx';
import { getAsset } from '../../assets/assetRegistry.js';
import { useStudioStore } from '../../store.js';

const WALNUT = '#392519';
const WALNUT_EDGE = '#6b4930';
const METAL = '#171a1c';
const PANEL = '#222528';
const BRASS = '#b78b4f';
const WARM = '#e5b66a';
const COOL = '#6f9daf';

export const MASTERING_CAMERAS = Object.freeze({
  camera_entry: { position: [0, 1.64, 2.55], target: [0, 1.16, -3.8] },
  camera_operator: { position: [0, 2.1, 2.25], target: [0, 1.18, -4.2] },
  camera_console: { position: [0, 2.28, 1.08], target: [0, 0.98, -1.65] },
  camera_left_monitor: { position: [-1.18, 1.58, -2.3], target: [-2.23, 1.45, -5.35] },
  camera_right_monitor: { position: [1.18, 1.58, -2.3], target: [2.23, 1.45, -5.35] },
  camera_rack_left: { position: [-1.55, 1.55, -2.65], target: [-3.25, 1.2, -4.35] },
  camera_rack_right: { position: [1.55, 1.55, -2.65], target: [3.25, 1.2, -4.35] },
  camera_overview: { position: [0, 2.65, 2.15], target: [0, 1.0, -3.65] }
});

function Screw({ position }) {
  return <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
    <cylinderGeometry args={[0.018, 0.018, 0.012, 12]}/>
    <meshStandardMaterial color="#85827a" metalness={0.86} roughness={0.24}/>
  </mesh>;
}

function Led({ position, color = WARM, size = 0.018 }) {
  return <mesh position={position}>
    <sphereGeometry args={[size, 12, 8]}/>
    <meshBasicMaterial color={color} toneMapped={false}/>
  </mesh>;
}

function Knob({ position, color = '#adb1b0', size = 0.045 }) {
  return <group position={position}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[size, size * 1.03, size * 0.58, 24]}/>
      <meshPhysicalMaterial color={color} metalness={0.68} roughness={0.28}/>
    </mesh>
    <mesh position={[0, size * 0.08, size * 0.31]}>
      <boxGeometry args={[0.008, size * 0.62, 0.006]}/>
      <meshBasicMaterial color="#f2deaf"/>
    </mesh>
  </group>;
}

function InteractiveAsset({ meta, children, ...props }) {
  const group = useRef();
  const select = useStudioStore((state) => state.select);
  const selected = useStudioStore((state) => state.selected?.id === meta.id);
  const [hovered, setHovered] = useState(false);

  useEffect(() => () => {
    if (hovered) document.body.style.cursor = 'default';
  }, [hovered]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = hovered || selected ? 1.012 : 1;
    const value = THREE.MathUtils.damp(group.current.scale.x, target, 10, delta);
    group.current.scale.setScalar(value);
  });

  return <group
    ref={group}
    {...props}
    name={`${meta.id}_interaction`}
    userData={{ interactionId: meta.id }}
    onClick={(event) => { event.stopPropagation(); select(meta); }}
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
    {children}
    {(hovered || selected) && <pointLight position={[0, 1.1, 0.35]} color={WARM} intensity={0.7} distance={2.4}/>} 
  </group>;
}

function InvisibleHitbox({ size, position = [0, 0, 0] }) {
  return <mesh position={position}>
    <boxGeometry args={size}/>
    <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/>
  </mesh>;
}

function RoomArchitecture() {
  const planks = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);
  return <group name="room_shell">
    <mesh name="wood_floor" receiveShadow position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 10]}/>
      <meshStandardMaterial color="#241913" roughness={0.66} metalness={0.02}/>
    </mesh>
    {planks.map((index) => <mesh key={index} position={[-3.84 + index * 0.334, 0.012, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.009, 9.92]}/>
      <meshBasicMaterial color={index % 4 === 0 ? '#8a5a36' : '#51341f'} transparent opacity={0.62}/>
    </mesh>)}

    <mesh name="front_acoustic_wall" receiveShadow position={[0, 1.7, -7.02]}>
      <boxGeometry args={[8, 3.4, 0.16]}/>
      <meshStandardMaterial color="#111315" roughness={0.96}/>
    </mesh>
    <mesh name="left_acoustic_treatment" receiveShadow position={[-4.02, 1.7, -2]}>
      <boxGeometry args={[0.16, 3.4, 10]}/>
      <meshStandardMaterial color="#101214" roughness={0.94}/>
    </mesh>
    <mesh name="right_acoustic_treatment" receiveShadow position={[4.02, 1.7, -2]}>
      <boxGeometry args={[0.16, 3.4, 10]}/>
      <meshStandardMaterial color="#101214" roughness={0.94}/>
    </mesh>
    <mesh name="ceiling" receiveShadow position={[0, 3.43, -2]}>
      <boxGeometry args={[8.1, 0.12, 10.1]}/>
      <meshStandardMaterial color="#0d0f10" roughness={0.9}/>
    </mesh>

    <group name="front_acoustic_wall_panels" position={[0, 1.76, -6.88]}>
      {[-2.85, -1.7, 1.7, 2.85].map((x, index) => <RoundedBox key={x} position={[x, 0, 0]} args={[0.92, 2.45, 0.1]} radius={0.035} smoothness={3}>
        <meshStandardMaterial color={index % 2 ? '#28292a' : '#212325'} roughness={0.98}/>
      </RoundedBox>)}
      <group name="rear_diffusion" position={[0, 0.02, 0.06]}>
        {Array.from({ length: 9 }, (_, index) => {
          const height = 1.2 + (index % 3) * 0.32;
          return <mesh key={index} position={[-0.72 + index * 0.18, -0.34 + height * 0.14, 0.02]} castShadow>
            <boxGeometry args={[0.105, height, 0.09 + (index % 4) * 0.035]}/>
            <meshStandardMaterial color={index % 2 ? WALNUT_EDGE : WALNUT} roughness={0.58}/>
          </mesh>;
        })}
      </group>
    </group>

    {[-3.55, 3.55].map((x) => <group key={x} name="bass_traps" position={[x, 1.62, -6.72]} rotation={[0, x < 0 ? -0.45 : 0.45, 0]}>
      <RoundedBox args={[0.62, 3.0, 0.44]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#242321" roughness={0.98}/>
      </RoundedBox>
      {Array.from({ length: 12 }, (_, index) => <mesh key={index} position={[0, -1.28 + index * 0.23, 0.235]}>
        <boxGeometry args={[0.43, 0.035, 0.015]}/>
        <meshStandardMaterial color="#6b5138" roughness={0.7}/>
      </mesh>)}
    </group>)}

    <group name="ceiling_cloud" position={[0, 3.25, -2.8]}>
      {[-1.35, -0.45, 0.45, 1.35].map((x) => <RoundedBox key={x} position={[x, 0, 0]} args={[0.72, 0.11, 3.25]} radius={0.045} smoothness={3}>
        <meshStandardMaterial color="#292b2c" roughness={0.92}/>
      </RoundedBox>)}
      {[-1.72, 1.72].map((x) => <mesh key={x} position={[x, 0.03, 0]}>
        <boxGeometry args={[0.035, 0.06, 3.1]}/>
        <meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.32}/>
      </mesh>)}
    </group>

    <group name="studio_door" position={[3.91, 1.18, 1.75]} rotation={[0, -Math.PI / 2, 0]}>
      <RoundedBox args={[1.15, 2.34, 0.12]} radius={0.045} smoothness={3}>
        <meshStandardMaterial color="#2c2018" roughness={0.62}/>
      </RoundedBox>
      <mesh position={[-0.39, 0, 0.08]}><sphereGeometry args={[0.055, 18, 12]}/><meshStandardMaterial color={BRASS} metalness={0.78} roughness={0.2}/></mesh>
    </group>

    <group name="rear_diffusion" position={[0, 1.66, 2.86]} rotation={[0, Math.PI, 0]}>
      {Array.from({ length: 17 }, (_, index) => <mesh key={index} position={[-3.28 + index * 0.41, ((index % 4) - 1.5) * 0.11, 0]} castShadow>
        <boxGeometry args={[0.28, 2.55, 0.12 + (index % 5) * 0.055]}/>
        <meshStandardMaterial color={index % 2 ? '#4b3222' : '#60412a'} roughness={0.6}/>
      </mesh>)}
    </group>
  </group>;
}

function ConsoleGeometry() {
  const sections = [
    ['master_console_tone_section', -2.22, '#8c714f'],
    ['master_console_eq_section', -1.12, '#7796a2'],
    ['master_console_dynamics_section', 0, '#a7855c'],
    ['master_console_width_section', 1.12, '#6f929a'],
    ['master_console_limiter_section', 2.22, '#c98d54']
  ];
  return <group name="master_console">
    <RoundedBox name="mastering_desk" args={[6.05, 0.25, 1.78]} radius={0.09} smoothness={5} position={[0, 0.82, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color={WALNUT} roughness={0.42} clearcoat={0.18} clearcoatRoughness={0.48}/>
    </RoundedBox>
    <RoundedBox args={[5.72, 0.78, 1.42]} radius={0.07} smoothness={4} position={[0, 1.08, -0.18]} rotation={[-0.12, 0, 0]} castShadow>
      <meshPhysicalMaterial color={METAL} metalness={0.46} roughness={0.32}/>
    </RoundedBox>
    {[-2.65, 2.65].map((x) => <group key={x} position={[x, 0.38, 0]}>
      <mesh castShadow><boxGeometry args={[0.14, 0.76, 1.32]}/><meshPhysicalMaterial color="#202326" metalness={0.72} roughness={0.26}/></mesh>
      <mesh position={[0, -0.38, 0.08]}><boxGeometry args={[0.5, 0.08, 1.45]}/><meshStandardMaterial color="#131516" metalness={0.58} roughness={0.42}/></mesh>
    </group>)}
    {sections.map(([name, x, color]) => <group key={name} name={name} position={[x, 1.18, 0.15]} rotation={[-0.12, 0, 0]}>
      <RoundedBox args={[0.9, 0.08, 1.05]} radius={0.025} smoothness={3}>
        <meshPhysicalMaterial color={PANEL} metalness={0.45} roughness={0.35}/>
      </RoundedBox>
      {[-0.27, 0, 0.27].map((knobX, index) => <Knob key={knobX} position={[knobX, 0.07, -0.27]} color={index === 1 ? color : '#a1a5a4'} size={index === 1 ? 0.052 : 0.042}/>)}
      {[-0.28, -0.09, 0.1, 0.29].map((z, index) => <Led key={z} position={[-0.29 + index * 0.19, 0.07, z]} color={index > 2 ? '#d87852' : color} size={0.012}/>)}
      <mesh position={[0.26, 0.066, 0.28]}><boxGeometry args={[0.12, 0.018, 0.3]}/><meshStandardMaterial color="#d6d0c5" metalness={0.2} roughness={0.3}/></mesh>
      {[[ -0.41, 0.066, -0.47 ], [0.41, 0.066, -0.47], [-0.41, 0.066, 0.47], [0.41, 0.066, 0.47]].map((p) => <Screw key={p.join(':')} position={p}/>)}
    </group>)}

    <group name="master_console_reference_section" position={[0, 1.47, -0.7]}>
      <RoundedBox args={[2.62, 0.18, 0.58]} radius={0.04} smoothness={3}>
        <meshPhysicalMaterial color="#0c0f11" metalness={0.52} roughness={0.28}/>
      </RoundedBox>
      {Array.from({ length: 13 }, (_, index) => <Led key={index} position={[-1.05 + index * 0.175, 0.105, 0.03]} color={index < 8 ? '#7fad83' : index < 11 ? WARM : '#d5664f'} size={0.014}/>)}
      <Knob position={[1.08, 0.12, 0.02]} color={BRASS} size={0.07}/>
    </group>
  </group>;
}

function MonitorGeometry({ side = 'left' }) {
  return <group name={`main_monitor_${side}`}>
    <RoundedBox args={[1.12, 1.78, 0.72]} radius={0.09} smoothness={6} castShadow receiveShadow>
      <meshPhysicalMaterial color="#121517" metalness={0.18} roughness={0.34} clearcoat={0.28}/>
    </RoundedBox>
    <mesh name={`main_monitor_${side}_woofer`} position={[0, -0.28, 0.385]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.36, 0.36, 0.075, 56]}/>
      <meshPhysicalMaterial color="#222a2d" metalness={0.18} roughness={0.34}/>
    </mesh>
    <mesh position={[0, -0.28, 0.43]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.29, 0.034, 14, 56]}/><meshStandardMaterial color="#070809" roughness={0.56}/>
    </mesh>
    <mesh name={`main_monitor_${side}_tweeter`} position={[0, 0.46, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.145, 0.145, 0.065, 40]}/>
      <meshPhysicalMaterial color="#90999b" metalness={0.68} roughness={0.24}/>
    </mesh>
    <mesh position={[0, 0.78, 0.41]}><capsuleGeometry args={[0.027, 0.01, 4, 12]}/><meshBasicMaterial color="#7be0a7" toneMapped={false}/></mesh>
    {[[ -0.48, 0.78, 0.38 ], [0.48, 0.78, 0.38], [-0.48, -0.78, 0.38], [0.48, -0.78, 0.38]].map((p) => <Screw key={p.join(':')} position={p}/>)}
  </group>;
}

function RackGeometry({ side = 'left' }) {
  const colors = side === 'left' ? ['#8aa0a3', '#b38b59', '#7f9b96', '#a87f58', '#85969b'] : ['#bb8650', '#9b7655', '#c5904f', '#788f99', '#b36a52'];
  return <group name={side === 'left' ? 'eq_rack' : 'limiter_metering_rack'}>
    <RoundedBox args={[1.28, 2.34, 0.73]} radius={0.065} smoothness={5} castShadow receiveShadow>
      <meshPhysicalMaterial color="#111416" metalness={0.4} roughness={0.38}/>
    </RoundedBox>
    {colors.map((color, row) => <group key={row} name={`${side}_rack_unit_${row + 1}`} position={[0, -0.87 + row * 0.44, 0.39]}>
      <RoundedBox args={[1.12, 0.34, 0.055]} radius={0.025} smoothness={3}>
        <meshPhysicalMaterial color={row % 2 ? '#2e2b28' : '#23282a'} metalness={0.48} roughness={0.31}/>
      </RoundedBox>
      {[-0.32, -0.08, 0.16].map((x, index) => <Knob key={x} position={[x, 0, 0.047]} color={index === 1 ? color : '#a1a3a0'} size={0.034}/>)}
      {[0.37, 0.47].map((x, index) => <Led key={x} position={[x, 0.02, 0.05]} color={index ? '#d3644d' : '#76d69b'} size={0.012}/>)}
      <Screw position={[-0.51, 0, 0.05]}/><Screw position={[0.51, 0, 0.05]}/>
    </group>)}
  </group>;
}

function MeterBridge() {
  const bars = useMemo(() => Array.from({ length: 38 }, (_, index) => 0.12 + Math.abs(Math.sin(index * 0.46)) * 0.62), []);
  return <group name="meter_bridge" position={[0, 2.18, -5.9]}>
    <RoundedBox args={[3.2, 1.08, 0.14]} radius={0.065} smoothness={4} castShadow>
      <meshPhysicalMaterial color="#0a0d0e" metalness={0.48} roughness={0.26}/>
    </RoundedBox>
    <mesh name="reference_display" position={[0, 0, 0.078]}>
      <planeGeometry args={[2.92, 0.82]}/><meshBasicMaterial color="#0b1719"/>
    </mesh>
    {bars.map((height, index) => <mesh key={index} position={[-1.27 + index * 0.069, -0.3 + height * 0.42, 0.088]}>
      <boxGeometry args={[0.035, height * 0.66, 0.008]}/>
      <meshBasicMaterial color={index > 31 ? WARM : index % 5 === 0 ? '#88b8bc' : '#527d83'} toneMapped={false}/>
    </mesh>)}
    <mesh position={[0, 0.29, 0.09]}><boxGeometry args={[2.65, 0.01, 0.008]}/><meshBasicMaterial color="#93633c"/></mesh>
  </group>;
}

function ListeningChair() {
  return <group name="listening_chair">
    <RoundedBox args={[0.78, 0.2, 0.75]} radius={0.13} smoothness={6} position={[0, 0.62, 0]} castShadow>
      <meshPhysicalMaterial color="#25282a" roughness={0.76}/>
    </RoundedBox>
    <RoundedBox args={[0.78, 0.86, 0.18]} radius={0.13} smoothness={6} position={[0, 1.1, 0.25]} rotation={[-0.12, 0, 0]} castShadow>
      <meshPhysicalMaterial color="#222527" roughness={0.78}/>
    </RoundedBox>
    <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.06, 0.08, 0.55, 20]}/><meshPhysicalMaterial color="#25292b" metalness={0.7} roughness={0.28}/></mesh>
    {Array.from({ length: 5 }, (_, index) => {
      const angle = index / 5 * Math.PI * 2;
      return <mesh key={index} position={[Math.cos(angle) * 0.32, 0.08, Math.sin(angle) * 0.32]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[0.42, 0.045, 0.055]}/><meshStandardMaterial color="#25292b" metalness={0.62} roughness={0.32}/>
      </mesh>;
    })}
  </group>;
}

function CableRuns() {
  const curves = useMemo(() => [
    new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3, 0.03, -5.1), new THREE.Vector3(-1.8, 0.03, -4.4), new THREE.Vector3(-1.4, 0.03, -2.4)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(2.3, 0.035, -5.1), new THREE.Vector3(1.8, 0.035, -4.4), new THREE.Vector3(1.4, 0.035, -2.4)])
  ], []);
  return <group name="cables">
    {curves.map((curve, index) => <mesh key={index}>
      <tubeGeometry args={[curve, 36, 0.011, 8, false]}/>
      <meshStandardMaterial color={index ? '#202326' : '#292a29'} roughness={0.78}/>
    </mesh>)}
  </group>;
}

function MasteringLighting() {
  return <group name="lighting_practicals">
    <ambientLight intensity={0.16}/>
    <hemisphereLight args={['#d8c2a5', '#080b0d', 0.5]}/>
    <spotLight position={[0, 3.1, 0.4]} target-position={[0, 0.7, -2.1]} intensity={52} angle={0.58} penumbra={0.86} decay={1.8} distance={11} color="#f2d2a2" castShadow shadow-mapSize={[1024, 1024]}/>
    <rectAreaLight position={[0, 2.35, -1.5]} rotation={[-Math.PI / 2.4, 0, 0]} intensity={3.2} width={4.8} height={1.4} color="#d9bea0"/>
    <spotLight position={[-2.85, 2.85, -3.8]} intensity={16} angle={0.46} penumbra={0.9} decay={2} distance={7} color="#7e9aa8"/>
    <spotLight position={[2.85, 2.85, -3.8]} intensity={14} angle={0.46} penumbra={0.9} decay={2} distance={7} color="#d39d5d"/>
    {[-2.85, 0, 2.85].map((x) => <group key={x} position={[x, 3.24, -2.8]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.13, 0.08, 28]}/><meshStandardMaterial color="#303335" metalness={0.65} roughness={0.28}/></mesh>
      <pointLight position={[0, -0.1, 0]} intensity={2.4} distance={2.5} color="#efc28a"/>
    </group>)}
    <pointLight position={[0, 1.18, -1.2]} intensity={1.8} distance={2.5} color={WARM}/>
    <pointLight position={[-2.6, 1.5, -5.3]} intensity={1.15} distance={2} color={COOL}/>
    <pointLight position={[2.6, 1.5, -5.3]} intensity={1.0} distance={2} color={WARM}/>
    <Environment resolution={192}>
      <Lightformer intensity={3.4} color="#f0d2aa" position={[0, 3.2, -1.4]} scale={[5, 1.1, 1]} rotation-x={Math.PI / 2}/>
      <Lightformer intensity={1.8} color="#7997a8" position={[-3.7, 1.8, -2.2]} scale={[2.2, 2.8, 1]} rotation-y={Math.PI / 2}/>
      <Lightformer intensity={1.4} color="#d39a5d" position={[3.7, 1.6, -2.5]} scale={[2, 2.5, 1]} rotation-y={-Math.PI / 2}/>
      <Lightformer intensity={0.9} color="#b8a58e" position={[0, 1.5, 2.6]} scale={[4, 1.2, 1]}/>
    </Environment>
  </group>;
}

export default function MasteringRoom() {
  const productionRoomAvailable = getAsset('mastering_room_001').available;
  const consoleMeta = {
    id: 'master_console',
    type: 'MASTERING CONSOLE',
    title: 'Deep Reference Console',
    description: 'Cadena final para tono, dinámica, imagen estéreo, limitación, referencia y entrega. Todos los cambios son reversibles.',
    panel: 'mastering',
    focus: MASTERING_CAMERAS.camera_console
  };
  const monitorMeta = (side) => ({
    id: `main_monitor_${side}`,
    type: 'REFERENCE MONITOR',
    title: side === 'left' ? 'Main Monitor · Left' : 'Main Monitor · Right',
    description: 'Perspectiva de escucha principal. Cambia referencia, mono y nivel sin ocultar la sala.',
    actions: ['Reference A', 'Reference B', 'Mono Check', 'Low Level'],
    focus: side === 'left' ? MASTERING_CAMERAS.camera_left_monitor : MASTERING_CAMERAS.camera_right_monitor
  });
  const rackMeta = (side) => ({
    id: side === 'left' ? 'eq_rack' : 'dynamics_rack',
    type: side === 'left' ? 'MASTERING EQ' : 'DYNAMICS / LIMITER',
    title: side === 'left' ? 'Precision Tone Rack' : 'Dynamics & Delivery Rack',
    description: side === 'left' ? 'Corrección tonal amplia y deliberada, con escucha A/B.' : 'Control de crest factor, true peak y entrega final.',
    actions: side === 'left' ? ['Natural', 'Air', 'Low Focus', 'Bypass'] : ['Dynamic', 'Streaming', 'Power', 'Bypass'],
    focus: side === 'left' ? MASTERING_CAMERAS.camera_rack_left : MASTERING_CAMERAS.camera_rack_right
  });

  return <group name="MASTERING_ROOM_001">
    <AssetModel assetId="mastering_room_001" fallback={<RoomArchitecture/>}/>
    <MasteringLighting/>
    {productionRoomAvailable ? <>
      <InteractiveAsset meta={consoleMeta}><InvisibleHitbox size={[6.25, 1.3, 1.9]} position={[0, 1.02, -1.02]}/></InteractiveAsset>
      <InteractiveAsset meta={monitorMeta('left')}><InvisibleHitbox size={[1.2, 1.9, .82]} position={[-2.28, 1.42, -5.22]}/></InteractiveAsset>
      <InteractiveAsset meta={monitorMeta('right')}><InvisibleHitbox size={[1.2, 1.9, .82]} position={[2.28, 1.42, -5.22]}/></InteractiveAsset>
      <InteractiveAsset meta={rackMeta('left')}><InvisibleHitbox size={[1.35, 2.5, .86]} position={[-3.25, 1.22, -4]}/></InteractiveAsset>
      <InteractiveAsset meta={rackMeta('right')}><InvisibleHitbox size={[1.35, 2.5, .86]} position={[3.25, 1.22, -4]}/></InteractiveAsset>
    </> : <>
      <CableRuns/>
      <InteractiveAsset meta={consoleMeta} position={[0, 0, -1.35]}>
        <AssetModel assetId="mastering_console_001" fallback={<ConsoleGeometry/>}/>
      </InteractiveAsset>
      <InteractiveAsset meta={monitorMeta('left')} position={[-2.18, 1.18, -5.55]} rotation={[0, 0.13, 0]}>
        <AssetModel assetId="mastering_monitor_001" fallback={<MonitorGeometry side="left"/>}/>
      </InteractiveAsset>
      <InteractiveAsset meta={monitorMeta('right')} position={[2.18, 1.18, -5.55]} rotation={[0, -0.13, 0]}>
        <AssetModel assetId="mastering_monitor_001" fallback={<MonitorGeometry side="right"/>}/>
      </InteractiveAsset>
      <InteractiveAsset meta={rackMeta('left')} position={[-3.25, 1.17, -4.15]} rotation={[0, 0.12, 0]}>
        <AssetModel assetId="mastering_rack_eq_001" fallback={<RackGeometry side="left"/>}/>
      </InteractiveAsset>
      <InteractiveAsset meta={rackMeta('right')} position={[3.25, 1.17, -4.15]} rotation={[0, -0.12, 0]}>
        <AssetModel assetId="mastering_rack_dynamics_001" fallback={<RackGeometry side="right"/>}/>
      </InteractiveAsset>
      <MeterBridge/>
      <AssetModel assetId="mastering_chair_001" position={[0, 0, 2.75]} rotation={[0, Math.PI, 0]} fallback={<ListeningChair/>}/>
      <mesh name="operator_position" position={[0, 0.018, 0.48]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.17, 32]}/><meshBasicMaterial color={BRASS} transparent opacity={0.34}/>
      </mesh>
    </>}
  </group>;
}
