import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStudioStore } from '../store.js';
import { ROOMS } from '../data.js';

const EXPOSURE = {
  practice: 1.10,
  record: 1.03,
  production: 1.07,
  mix: 0.98,
  master: 0.94
};

const PRACTICALS = {
  practice: { warm: '#ffbf78', cool: '#6f9cb8', strength: 1.25 },
  record: { warm: '#ffad72', cool: '#7790a8', strength: 1.1 },
  production: { warm: '#cfa1ff', cool: '#6cc6d2', strength: 1.0 },
  mix: { warm: '#e6a968', cool: '#78a8c3', strength: 0.9 },
  master: { warm: '#d6a15f', cool: '#7893a3', strength: 0.82 }
};

function CoveStrip({ position, length = 2.8, color, rotation = [0, 0, 0], opacity = 0.34 }) {
  return <group position={position} rotation={rotation}>
    <mesh>
      <boxGeometry args={[length, 0.018, 0.028]}/>
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false}/>
    </mesh>
    <pointLight color={color} intensity={0.32} distance={2.2} decay={2}/>
  </group>;
}

function PracticalLayer({ room }) {
  const cfg = PRACTICALS[room];
  const accent = ROOMS[room].accent;

  return <group name="cinematic_practicals" userData={{ layer: 'cinematography-v4' }}>
    <CoveStrip position={[-2.25, 3.04, -5.95]} length={2.15} color={cfg.warm} opacity={0.22}/>
    <CoveStrip position={[2.25, 3.04, -5.95]} length={2.15} color={cfg.warm} opacity={0.22}/>
    <CoveStrip position={[0, 2.88, -6.58]} length={1.5} color={accent} opacity={0.12}/>
    <pointLight position={[-3.55, 1.28, -4.65]} color={cfg.cool} intensity={cfg.strength * 0.38} distance={3.8} decay={2}/>
    <pointLight position={[3.55, 1.18, -4.45]} color={cfg.warm} intensity={cfg.strength * 0.34} distance={3.8} decay={2}/>
    <pointLight position={[0, 0.58, -1.6]} color={cfg.warm} intensity={cfg.strength * 0.22} distance={2.8} decay={2}/>
  </group>;
}

export default function StudioCinematography() {
  const room = useStudioStore((state) => state.room);
  const selected = useStudioStore((state) => state.selected);
  const { gl, scene } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = selected ? EXPOSURE[room] * 0.96 : EXPOSURE[room];
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.autoUpdate = true;

    scene.environmentIntensity = room === 'master' ? 0.72 : room === 'mix' ? 0.78 : 0.9;
  }, [gl, room, scene, selected]);

  return <PracticalLayer room={room}/>;
}
