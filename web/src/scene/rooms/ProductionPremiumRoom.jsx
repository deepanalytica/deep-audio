import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import {
  AmpControlStrip,
  HardwareButton,
  HardwareDisplay,
  HardwareFader,
  HardwareKnob,
  HardwareLED,
  HardwareToggle,
  PianoKeybed,
  RackFaceplate,
  SpeakerDriverDetail,
  VUMeter
} from '../hardware/StudioHardware.jsx';

const WALNUT='#5b321d';
const WALNUT_DARK='#2a1710';
const GRAPHITE='#151718';
const METAL='#3b3f40';
const BRASS='#c79b5a';
const IVORY='#e7e1d5';
const PURPLE='#9d72c8';
const CYAN='#66b8c7';

function WoodMaterial({dark=false,roughness=.38}){
  return <meshPhysicalMaterial
    color={dark?WALNUT_DARK:WALNUT}
    roughness={roughness}
    metalness={.03}
    clearcoat={.12}
    clearcoatRoughness={.52}
  />;
}

function MetalMaterial({color=GRAPHITE,roughness=.3,metalness=.72}){
  return <meshPhysicalMaterial color={color} roughness={roughness} metalness={metalness} clearcoat={.06}/>;
}

function Floor(){
  const boards=useMemo(()=>Array.from({length:18},(_,i)=>i),[]);
  return <group name="production_floor">
    <mesh position={[0,-.08,-3.25]} receiveShadow>
      <boxGeometry args={[11.8,.16,8.3]}/>
      <meshStandardMaterial color="#090b0c" roughness={.82}/>
    </mesh>
    {boards.map((i)=>{
      const x=-5.5+i*.65;
      const tone=i%3===0?'#5c3421':i%3===1?'#472719':'#382017';
      return <mesh key={i} position={[x,.008,-3.18]} receiveShadow>
        <boxGeometry args={[.61,.035,7.75]}/>
        <meshPhysicalMaterial color={tone} roughness={.48} metalness={0} clearcoat={.05}/>
      </mesh>;
    })}
    <mesh position={[0,.032,-1.55]} receiveShadow>
      <boxGeometry args={[6.9,.04,3.1]}/>
      <meshStandardMaterial color="#101213" roughness={.88}/>
    </mesh>
  </group>;
}

function BackWall(){
  const slats=useMemo(()=>Array.from({length:19},(_,i)=>i),[]);
  const panels=useMemo(()=>[-4.1,-2.05,0,2.05,4.1],[]);
  return <group name="production_architecture">
    <mesh position={[0,2.25,-7.05]} receiveShadow>
      <boxGeometry args={[11.8,4.7,.18]}/>
      <meshStandardMaterial color="#0c0e10" roughness={.84}/>
    </mesh>
    <mesh position={[-5.82,2.1,-3.35]} rotation={[0,Math.PI/2,0]} receiveShadow>
      <boxGeometry args={[7.6,4.35,.18]}/>
      <meshStandardMaterial color="#0a0c0e" roughness={.88}/>
    </mesh>
    <mesh position={[5.82,2.1,-3.35]} rotation={[0,Math.PI/2,0]} receiveShadow>
      <boxGeometry args={[7.6,4.35,.18]}/>
      <meshStandardMaterial color="#0a0c0e" roughness={.88}/>
    </mesh>

    <group position={[0,2.15,-6.86]}>
      <mesh receiveShadow>
        <boxGeometry args={[8.65,3.25,.14]}/>
        <meshStandardMaterial color="#171719" roughness={.95}/>
      </mesh>
      {slats.map((i)=><mesh key={i} position={[-4.05+i*.45,0,.11]} castShadow>
        <boxGeometry args={[.105,3.05,.11]}/>
        <meshPhysicalMaterial color={i%2?WALNUT:'#6b3b24'} roughness={.42} clearcoat={.05}/>
      </mesh>)}
      {panels.map((x,i)=><RoundedBox key={x} args={[1.42,1.12,.11]} radius={.04} smoothness={3} position={[x,0,.22]}>
        <meshStandardMaterial color={i===2?'#232426':'#1b1d20'} roughness={.98}/>
      </RoundedBox>)}
    </group>

    <mesh position={[0,3.83,-3.1]}>
      <boxGeometry args={[8.4,.08,2.0]}/>
      <meshPhysicalMaterial color="#17191a" roughness={.68} metalness={.18}/>
    </mesh>
    {[[-3.0,3.75,-3.0],[0,3.75,-3.0],[3.0,3.75,-3.0]].map((p,i)=>
      <mesh key={i} position={p} rotation={[Math.PI/2,0,0]}>
        <planeGeometry args={[2.15,.62]}/>
        <meshBasicMaterial color={i===1?'#8c6ca8':'#b88d55'} transparent opacity={.12} toneMapped={false}/>
      </mesh>
    )}
  </group>;
}

function Desk(){
  const channels=useMemo(()=>Array.from({length:10},(_,i)=>i),[]);
  return <group name="producer_desk" position={[0,0,-1.42]}>
    <RoundedBox args={[5.65,.16,1.55]} radius={.09} smoothness={4} position={[0,.94,0]} castShadow receiveShadow>
      <WoodMaterial roughness={.34}/>
    </RoundedBox>
    <RoundedBox args={[4.9,.12,.62]} radius={.05} smoothness={3} position={[0,1.12,-.58]} castShadow>
      <MetalMaterial color="#17191a" roughness={.25} metalness={.5}/>
    </RoundedBox>
    <mesh position={[-2.35,.45,.15]} castShadow><boxGeometry args={[.18,.96,.72]}/><MetalMaterial/></mesh>
    <mesh position={[2.35,.45,.15]} castShadow><boxGeometry args={[.18,.96,.72]}/><MetalMaterial/></mesh>
    <mesh position={[0,.26,.42]} castShadow><boxGeometry args={[4.6,.12,.28]}/><MetalMaterial color="#252829"/></mesh>

    <PianoKeybed position={[0,1.08,.12]} rotation={[-.02,0,0]} octaves={5} width={3.65}/>

    <group position={[0,1.23,-.46]} rotation={[-.05,0,0]}>
      <HardwareDisplay position={[0,.02,-.1]} width={1.05} height={.23} title="DEEP PRODUCER" value="POLY 01" unit="SESSION" accent={PURPLE} mode="curve"/>
      {channels.map((i)=>{
        const x=-1.78+i*.395;
        return <group key={i} position={[x,0,.27]}>
          <HardwareKnob position={[0,.05,-.08]} size={.027} color={i%3===0?PURPLE:'#929693'} accent={i%3===0?'#efd8ff':BRASS}/>
          <HardwareFader position={[0,.035,.16]} length={.24} value={.22+(i%5)*.15} accent={i%3===0?PURPLE:BRASS}/>
          <HardwareLED position={[0,.055,.34]} color={i%4===0?'#d86b5a':'#66c992'} size={.006}/>
        </group>;
      })}
    </group>

    <group position={[-2.0,1.2,-.34]}>
      <HardwareButton position={[0,0,0]} size={.065} active accent={PURPLE}/>
      <HardwareButton position={[.1,0,0]} size={.065} accent={PURPLE}/>
      <HardwareToggle position={[.22,.015,0]} on accent={PURPLE}/>
    </group>
    <group position={[1.78,1.19,-.35]}>
      <HardwareKnob position={[0,.02,0]} size={.05} color={BRASS} accent="#f1dab0"/>
      <HardwareKnob position={[.19,.02,0]} size={.036} color="#aeb0aa" accent={BRASS}/>
      <HardwareKnob position={[.35,.02,0]} size={.036} color="#aeb0aa" accent={CYAN}/>
    </group>
  </group>;
}

function Monitor({side='left'}){
  const left=side==='left';
  const x=left?-2.55:2.55;
  return <group position={[x,1.46,-4.78]} rotation={[0,left?-.12:.12,0]} name={'production_monitor_'+side}>
    <mesh position={[0,-.58,0]} castShadow><boxGeometry args={[.15,1.15,.18]}/><MetalMaterial color="#26292a"/></mesh>
    <mesh position={[0,-1.06,.02]} castShadow><boxGeometry args={[.72,.1,.72]}/><MetalMaterial color="#202223"/></mesh>
    <RoundedBox args={[1.05,1.62,.68]} radius={.1} smoothness={4} castShadow receiveShadow>
      <meshPhysicalMaterial color="#191b1c" roughness={.3} metalness={.22} clearcoat={.08}/>
    </RoundedBox>
    <SpeakerDriverDetail position={[0,-.30,.355]} radius={.31} accent="#6f7a7e"/>
    <SpeakerDriverDetail position={[0,.42,.355]} radius={.13} accent="#b7b0a0"/>
    <HardwareLED position={[0,.68,.39]} color="#68ce94" size={.009}/>
  </group>;
}

function SynthTower({side='left'}){
  const left=side==='left';
  const x=left?-3.75:3.75;
  const inward=left?.18:-.18;
  const accent=left?PURPLE:CYAN;
  return <group position={[x,.05,-3.83]} rotation={[0,inward,0]} name={'production_synth_tower_'+side}>
    <RoundedBox args={[1.55,2.78,.74]} radius={.08} smoothness={4} position={[0,1.35,0]} castShadow receiveShadow>
      <meshPhysicalMaterial color="#131516" roughness={.35} metalness={.42}/>
    </RoundedBox>
    {[-.88,-.44,0,.44,.88].map((y,i)=>
      <RackFaceplate key={i} position={[0,1.34+y,.39]} width={1.34} height={.33} accent={i%2?accent:BRASS} variant={i+(left?0:2)}/>
    )}
    <mesh position={[0,.16,.04]}><boxGeometry args={[1.26,.12,.68]}/><MetalMaterial color="#232627"/></mesh>
  </group>;
}

function SatelliteSynth({side='left'}){
  const left=side==='left';
  const x=left?-2.45:2.45;
  const rot=left?.17:-.17;
  const accent=left?PURPLE:CYAN;
  return <group position={[x,.94,-3.05]} rotation={[0,rot,0]}>
    <RoundedBox args={[1.7,.13,.62]} radius={.045} smoothness={3} castShadow>
      <meshPhysicalMaterial color="#1d1f21" roughness={.28} metalness={.38}/>
    </RoundedBox>
    <PianoKeybed position={[0,.11,.02]} octaves={2} width={1.28}/>
    <HardwareDisplay position={[0,.15,-.19]} width={.42} height={.12} title={left?'VOICE A':'VOICE B'} value={left?'WARM':'MOTION'} unit="PATCH" accent={accent} mode="curve"/>
  </group>;
}

function PadStation(){
  const pads=useMemo(()=>Array.from({length:16},(_,i)=>i),[]);
  return <group position={[-1.88,1.12,-.5]} rotation={[-.08,.06,0]} name="pad_controller">
    <RoundedBox args={[1.0,.12,.72]} radius={.05} smoothness={3} castShadow>
      <MetalMaterial color="#17191a" roughness={.32} metalness={.44}/>
    </RoundedBox>
    {pads.map((i)=>{
      const row=Math.floor(i/4),col=i%4;
      return <RoundedBox key={i} args={[.15,.035,.15]} radius={.02} smoothness={2}
        position={[-.29+col*.19,.08,-.27+row*.18]}>
        <meshPhysicalMaterial color={i===5?PURPLE:'#303335'} emissive={i===5?PURPLE:'#000000'} emissiveIntensity={i===5?.25:0} roughness={.5}/>
      </RoundedBox>;
    })}
    <HardwareKnob position={[.39,.08,-.22]} size={.035} color={BRASS} accent={IVORY}/>
    <HardwareKnob position={[.39,.08,.02]} size={.035} color="#9aa09d" accent={CYAN}/>
  </group>;
}

function GrooveStation(){
  return <group position={[1.92,1.12,-.5]} rotation={[-.08,-.06,0]}>
    <RoundedBox args={[1.02,.12,.7]} radius={.05} smoothness={3}>
      <MetalMaterial color="#1a1d1e" roughness={.3} metalness={.42}/>
    </RoundedBox>
    <HardwareDisplay position={[0,.08,-.17]} width={.52} height={.16} title="SEQUENCER" value="120" unit="BPM" accent={CYAN}/>
    {[-.34,-.17,0,.17,.34].map((x,i)=><HardwareButton key={i} position={[x,.075,.2]} size={.075} active={i===2} accent={CYAN}/>)}
    <HardwareKnob position={[-.38,.08,-.17]} size={.035} color="#9da19e" accent={CYAN}/>
    <HardwareKnob position={[.38,.08,-.17]} size={.035} color={BRASS} accent="#f0d7a9"/>
  </group>;
}

function SideRack({side='left'}){
  const x=side==='left'?-5.03:5.03;
  const accent=side==='left'?PURPLE:CYAN;
  return <group position={[x,.98,-4.95]}>
    <RoundedBox args={[1.05,1.95,.72]} radius={.07} smoothness={3}>
      <meshPhysicalMaterial color="#101213" roughness={.42} metalness={.45}/>
    </RoundedBox>
    {[-.56,-.18,.2,.58].map((y,i)=><RackFaceplate key={i} position={[0,y,.39]} width={.88} height={.28} accent={i===1?BRASS:accent} variant={i+1}/>)}
  </group>;
}

function Lamp({side='left'}){
  const x=side==='left'?-5.15:5.15;
  return <group position={[x,0,-1.55]}>
    <mesh position={[0,.72,0]} castShadow><cylinderGeometry args={[.028,.035,1.42,16]}/><MetalMaterial color="#313334"/></mesh>
    <mesh position={[0,1.48,0]} rotation={[0,0,side==='left'?.12:-.12]}>
      <coneGeometry args={[.34,.46,32,1,true]}/>
      <meshPhysicalMaterial color="#c5a66e" roughness={.42} metalness={.18} side={THREE.DoubleSide}/>
    </mesh>
    <pointLight position={[0,1.36,.1]} intensity={7} distance={3.2} decay={2} color="#ffc887"/>
  </group>;
}

function Cable({points,color='#18191a'}){
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map((p)=>new THREE.Vector3(...p))),[points]);
  return <mesh castShadow>
    <tubeGeometry args={[curve,42,.012,7,false]}/>
    <meshStandardMaterial color={color} roughness={.8}/>
  </mesh>;
}

function Cabling(){
  return <group name="production_cabling">
    <Cable points={[[-3.55,.14,-3.75],[-3.1,.08,-3.15],[-2.1,.06,-2.45],[-1.2,.08,-1.7]]}/>
    <Cable points={[[3.55,.14,-3.75],[3.15,.08,-3.2],[2.25,.06,-2.55],[1.15,.08,-1.7]]}/>
    <Cable points={[[-2.5,.08,-4.5],[-1.8,.06,-4.2],[-.7,.05,-3.95],[0,.06,-3.7]]} color="#24201c"/>
  </group>;
}

function MasterBus(){
  return <group position={[0,1.56,-5.55]} name="production_master_bus">
    <RoundedBox args={[2.55,.72,.22]} radius={.06} smoothness={4} castShadow>
      <MetalMaterial color="#121415" roughness={.24} metalness={.52}/>
    </RoundedBox>
    <HardwareDisplay position={[0,.02,.13]} rotation={[0,0,0]} width={1.18} height={.28} title="SESSION BUS" value="-18.4" unit="LUFS-S" accent={BRASS}/>
    <VUMeter position={[-.82,.02,.13]} rotation={[0,0,0]} accent={BRASS} needle={-.12}/>
    <VUMeter position={[.82,.02,.13]} rotation={[0,0,0]} accent={BRASS} needle={.14}/>
  </group>;
}

export default function ProductionPremiumRoom(){
  return <group name="DMP_PRODUCTION_PREMIUM_V6" userData={{designSystem:'production-premium-v6'}}>
    <Floor/>
    <BackWall/>
    <Desk/>
    <Monitor side="left"/>
    <Monitor side="right"/>
    <SynthTower side="left"/>
    <SynthTower side="right"/>
    <SatelliteSynth side="left"/>
    <SatelliteSynth side="right"/>
    <PadStation/>
    <GrooveStation/>
    <SideRack side="left"/>
    <SideRack side="right"/>
    <Lamp side="left"/>
    <Lamp side="right"/>
    <MasterBus/>
    <Cabling/>
    <spotLight position={[0,4.1,.25]} intensity={58} distance={11} angle={.55} penumbra={.9} color="#f2c28d" castShadow/>
    <pointLight position={[-3.7,2.25,-3.5]} intensity={6} distance={5} decay={2} color={PURPLE}/>
    <pointLight position={[3.7,2.15,-3.6]} intensity={5.5} distance={5} decay={2} color={CYAN}/>
    <pointLight position={[0,1.0,-5.5]} intensity={3.2} distance={4.2} decay={2} color={BRASS}/>
  </group>;
}
