import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import AssetModel from '../../assets/AssetModel.jsx';
import { getAsset } from '../../assets/assetRegistry.js';
import { useStudioStore } from '../../store.js';
import { ROOM_DESIGNS } from './roomDesigns.js';

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
  const compact = useThree((state) => state.size.width < 820);
  return <>
    <ambientLight intensity={.28}/>
    <hemisphereLight args={['#dceaff', '#080a0d', .72]}/>
    <spotLight position={[0, 4.2, 1.2]} intensity={72} angle={.62} penumbra={.86} decay={1.7} distance={15} color="#f5c48e" castShadow shadow-mapSize={[compact ? 512 : 1024, compact ? 512 : 1024]}/>
    <pointLight position={[-3.5, 2.1, -2.8]} intensity={9} distance={7} decay={2} color={design.accent}/>
    <pointLight position={[3.3, 1.8, -3.4]} intensity={7} distance={6.5} decay={2} color={design.warm}/>
    <Environment resolution={compact ? 64 : 128}>
      <Lightformer intensity={2.8} color="#f0d4af" position={[0, 4.2, -1.4]} scale={[5.5, 1.1, 1]} rotation-x={Math.PI / 2}/>
      <Lightformer intensity={1.5} color={design.accent} position={[-4.2, 1.8, -2.2]} scale={[2.1, 3, 1]} rotation-y={Math.PI / 2}/>
      <Lightformer intensity={1.15} color={design.warm} position={[4.2, 1.7, -2.6]} scale={[2.1, 2.8, 1]} rotation-y={-Math.PI / 2}/>
    </Environment>
  </>;
}

export default function ImmersiveRoom({ room, fallback }) {
  const design = ROOM_DESIGNS[room];
  const asset = getAsset(design.assetId);

  return <group name={`${design.assetId}_scene`} userData={{ designSystem: 'blender-premium-v7', glbAvailable: asset.available }}>
    <AssetModel assetId={design.assetId} fallback={fallback}/>
    <DesignedLighting design={design}/>
    {design.hitboxes.map((hotspot) => <RoomHitbox key={hotspot.id} hotspot={hotspot} accent={design.accent}/>)}
  </group>;
}
