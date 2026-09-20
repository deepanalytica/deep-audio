import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { useStudioStore } from '../store.js';

function proceduralTexture(kind='wood'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const c=canvas.getContext('2d');
  if(kind==='wood'){
    c.fillStyle='#3b2618';c.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=7){
      const v=42+Math.random()*26;c.strokeStyle=`rgba(${v+30},${v+8},${v-8},.28)`;
      c.lineWidth=1+Math.random()*2;c.beginPath();
      c.moveTo(0,y+Math.sin(y*.08)*3);
      for(let x=0;x<=512;x+=24)c.lineTo(x,y+Math.sin(x*.035+y*.02)*5);
      c.stroke();
    }
  }else if(kind==='fabric'){
    c.fillStyle='#252729';c.fillRect(0,0,512,512);
    c.strokeStyle='rgba(255,255,255,.035)';c.lineWidth=1;
    for(let i=0;i<512;i+=5){c.beginPath();c.moveTo(i,0);c.lineTo(i,512);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(512,i);c.stroke()}
  }else{
    c.fillStyle='#191a1b';c.fillRect(0,0,512,512);
    for(let i=0;i<7000;i++){const g=28+Math.random()*18;c.fillStyle=`rgb(${g},${g},${g})`;c.fillRect(Math.random()*512,Math.random()*512,1,1)}
  }
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

function useMaterialTextures(){
  return useMemo(()=>{
    const wood=proceduralTexture('wood');wood.repeat.set(3,2);
    const fabric=proceduralTexture('fabric');fabric.repeat.set(6,6);
    const dark=proceduralTexture('dark');dark.repeat.set(5,5);
    return {wood,fabric,dark};
  },[]);
}

function Hotspot({meta,children,...props}){
  const select=useStudioStore((s)=>s.select);
  const [hovered,setHovered]=useState(false);
  return <group
    {...props}
    onClick={(e)=>{e.stopPropagation();select(meta)}}
    onPointerOver={(e)=>{e.stopPropagation();setHovered(true);document.body.style.cursor='pointer'}}
    onPointerOut={()=>{setHovered(false);document.body.style.cursor='default'}}
    scale={hovered?1.025:1}
  >{children}</group>;
}

export function RoomShell({accent='#d9a45f',variant='practice'}){
  const {wood,fabric,dark}=useMaterialTextures();
  const floorColor=variant==='mix'||variant==='master'?'#151718':'#191512';
  return <group>
    <mesh receiveShadow rotation-x={-Math.PI/2} position={[0,0,-1]}>
      <planeGeometry args={[16,18]}/>
      <meshStandardMaterial map={wood} color={floorColor} roughness={.72} metalness={.02}/>
    </mesh>
    <mesh receiveShadow position={[0,3,-9]}><boxGeometry args={[16,6,.18]}/><meshStandardMaterial color="#171819" map={dark} roughness={.9}/></mesh>
    <mesh receiveShadow position={[-7.8,3,-1]}><boxGeometry args={[.18,6,16]}/><meshStandardMaterial color="#101112" roughness={.94}/></mesh>
    <mesh receiveShadow position={[7.8,3,-1]}><boxGeometry args={[.18,6,16]}/><meshStandardMaterial color="#101112" roughness={.94}/></mesh>
    {[-5.2,-2.6,0,2.6,5.2].map((x,i)=><group key={x} position={[x,3,-8.86]}>
      <RoundedBox args={[1.55,2.15,.12]} radius={.04} smoothness={3}>
        <meshStandardMaterial map={fabric} color={i%2?'#303133':'#252629'} roughness={1}/>
      </RoundedBox>
      {Array.from({length:7}).map((_,j)=><mesh key={j} position={[0,-.72+j*.24,.07]}>
        <boxGeometry args={[1.25,.065,.05]}/><meshStandardMaterial color="#45474a" roughness={.9}/>
      </mesh>)}
    </group>)}
    {[-5.5,5.5].map(x=><mesh key={x} position={[x,3.15,-8.7]} rotation={[0,0,x<0?.16:-.16]}>
      <boxGeometry args={[1.1,3.6,.12]}/><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.06} roughness={.82}/>
    </mesh>)}
    <mesh position={[0,.035,-2.4]} rotation-x={-Math.PI/2} receiveShadow>
      <planeGeometry args={[8,5.8]}/><meshStandardMaterial map={fabric} color="#171310" roughness={1}/>
    </mesh>
  </group>;
}

export function AcousticPanel({position=[0,0,0],rotation=[0,0,0],color='#343638'}){
  const {fabric}=useMaterialTextures();
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[1.1,1.85,.12]} radius={.045} smoothness={3}><meshStandardMaterial map={fabric} color={color} roughness={1}/></RoundedBox>
  </group>
}

export function StudioMonitor({position=[0,0,0],scale=1,label='Reference Monitor'}){
  return <Hotspot position={position} scale={scale} meta={{type:'MONITOR',title:label,description:'Monitor de referencia. Cambia perspectiva, nivel y referencia A/B desde este punto.',actions:['Reference A','Reference B','Mono Check','Low Level']}}>
    <RoundedBox args={[1.05,1.72,.7]} radius={.075} smoothness={5} castShadow receiveShadow>
      <meshPhysicalMaterial color="#111315" roughness={.38} metalness={.08} clearcoat={.25}/>
    </RoundedBox>
    <mesh position={[0,-.23,.37]} rotation-x={Math.PI/2}><cylinderGeometry args={[.34,.34,.055,48]}/><meshPhysicalMaterial color="#20282d" roughness={.36} metalness={.12}/></mesh>
    <mesh position={[0,.47,.375]} rotation-x={Math.PI/2}><cylinderGeometry args={[.14,.14,.05,32]}/><meshPhysicalMaterial color="#6d777c" roughness={.28} metalness={.28}/></mesh>
    <mesh position={[0,-.23,.405]} rotation-x={Math.PI/2}><torusGeometry args={[.28,.025,12,48]}/><meshStandardMaterial color="#060708"/></mesh>
    <pointLight position={[0,.78,.5]} intensity={.25} color="#74efaa" distance={1.2}/>
    <mesh position={[0,.78,.41]}><sphereGeometry args={[.025,12,12]}/><meshBasicMaterial color="#74efaa"/></mesh>
  </Hotspot>;
}

function Knob({position,color='#c99a54',size=.055}){
  return <mesh position={position} rotation-x={Math.PI/2} castShadow>
    <cylinderGeometry args={[size,size,size*.55,18]}/><meshPhysicalMaterial color={color} roughness={.3} metalness={.5}/>
  </mesh>
}

export function Rack({position=[0,0,0],label='Analog Rack',accent='#c99a54'}){
  return <Hotspot position={position} meta={{type:'OUTBOARD',title:label,description:'Rack de procesamiento con EQ, dinámica, saturación y espacio. Todo puede escucharse A/B y revertirse.',actions:['Tone','Glue','Depth','Bypass']}}>
    <RoundedBox args={[1.55,2.65,.7]} radius={.06} smoothness={4} castShadow receiveShadow><meshPhysicalMaterial color="#111315" roughness={.42} metalness={.28}/></RoundedBox>
    {Array.from({length:5}).map((_,r)=><group key={r} position={[0,.42+r*.48-1.33,.37]}>
      <RoundedBox args={[1.34,.39,.055]} radius={.025} smoothness={3}><meshPhysicalMaterial color={r%2?'#392f27':'#20262a'} roughness={.36} metalness={.42}/></RoundedBox>
      {[-.42,-.14,.14,.42].map((x,i)=><Knob key={i} position={[x,0,.045]} color={i%2?accent:'#9ca5aa'}/>)}
      {[.56,.67].map((x,i)=><mesh key={i} position={[x-.08,0,.05]}><sphereGeometry args={[.018,10,10]}/><meshBasicMaterial color={i?'#ef715f':'#6ee39b'}/></mesh>)}
    </group>)}
  </Hotspot>;
}

export function Amplifier({position=[0,0,0],label='Vintage Stack',color='#34271e'}){
  return <Hotspot position={position} meta={{type:'AMPLIFICADOR',title:label,description:'Amplificador, cabina y micrófono virtual. Elige carácter primero; abre controles avanzados sólo si los necesitas.',actions:['Clean 65','Warm Tube','British Crunch','Modern Tight']}}>
    <RoundedBox args={[1.65,1.7,.78]} radius={.08} smoothness={5} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.72}/></RoundedBox>
    <RoundedBox args={[1.43,1.05,.055]} radius={.03} smoothness={3} position={[0,-.16,.405]}><meshStandardMaterial color="#171616" roughness={.96}/></RoundedBox>
    <mesh position={[0,-.14,.44]} rotation-x={Math.PI/2}><torusGeometry args={[.42,.025,10,48]}/><meshStandardMaterial color="#373432"/></mesh>
    <RoundedBox args={[1.42,.3,.055]} radius={.02} smoothness={2} position={[0,.57,.405]}><meshPhysicalMaterial color="#c19b62" roughness={.45} metalness={.28}/></RoundedBox>
    {[-.5,-.3,-.1,.1,.3,.5].map((x,i)=><Knob key={i} position={[x,.58,.45]} color={i===0?'#efe1c4':'#2a211b'} size={.035}/>)}
  </Hotspot>;
}

export function Guitar({position=[0,0,0],rotation=[0,0,0],label='Electric Guitar',bass=false,color='#9a4f2c'}){
  return <Hotspot position={position} rotation={rotation} meta={{type:'INSTRUMENTO',title:label,description:'Instrumento de sesión. Tócalo tú o convoca un músico virtual para seguir la armonía y el arreglo.',actions:['Natural','Vintage','Wide Clean','Session Ready']}}>
    <group rotation={[0,0,bass?.035:-.035]}>
      <mesh position={[0,.68,0]} castShadow><sphereGeometry args={[.34,32,24]}/><meshPhysicalMaterial color={color} roughness={.42} clearcoat={.35}/></mesh>
      <mesh position={[bass?-.16:.15,.82,.02]} scale={[.8,.72,.65]} castShadow><sphereGeometry args={[.32,28,20]}/><meshPhysicalMaterial color={color} roughness={.42} clearcoat={.35}/></mesh>
      <RoundedBox args={[.11,1.48,.075]} radius={.025} smoothness={3} position={[0,1.5,0]}><meshStandardMaterial color="#674229" roughness={.62}/></RoundedBox>
      <RoundedBox args={[.2,.42,.08]} radius={.03} smoothness={3} position={[0,2.42,0]}><meshStandardMaterial color="#68432a" roughness={.62}/></RoundedBox>
      {[.09,.03,-.03,-.09].map((x,i)=><mesh key={i} position={[x*.35,1.55,.043]}><boxGeometry args={[.008,1.8,.006]}/><meshStandardMaterial color="#c9b38a" metalness={.6} roughness={.3}/></mesh>)}
      <mesh position={[0,.72,.32]}><boxGeometry args={[.22,.1,.04]}/><meshStandardMaterial color="#d6c4a1" metalness={.45}/></mesh>
    </group>
  </Hotspot>;
}

export function DrumKit({position=[0,0,0],accent='#c99a54'}){
  const drum=(p,r,h)=> <mesh position={p} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[r,r,h,36]}/><meshPhysicalMaterial color="#d7d0c0" roughness={.45} metalness={.08}/></mesh>;
  const cym=(p,r,tilt=0)=> <mesh position={p} rotation={[tilt,0,0]} castShadow><cylinderGeometry args={[r,r*.93,.035,48]}/><meshPhysicalMaterial color="#bb914c" roughness={.3} metalness={.7}/></mesh>;
  return <Hotspot position={position} meta={{type:'BATERÍA',title:'Deep Drums · Studio Kit',description:'Kit virtual multicapa preparado para estilos, grooves, fills, intensidad y room. La preview usa síntesis; el producto final usará librerías propias multisample.',actions:['Neo Soul Dry','Arena Rock','Vintage 70s','Modern Pop']}}>
    {drum([0,.62,0],.62,.72)}
    {drum([-.58,.9,.15],.34,.42)}
    {drum([.52,.91,.1],.31,.38)}
    {drum([.86,.65,-.02],.4,.36)}
    {drum([-.94,.67,.04],.38,.22)}
    {cym([-1.12,1.66,0],.52,.08)}{cym([1.0,1.73,-.1],.58,-.07)}{cym([0,1.81,-.34],.46,.03)}
    {[-1.12,0,1].map((x,i)=><mesh key={i} position={[x,.82,-.02]}><cylinderGeometry args={[.018,.018,1.45,10]}/><meshStandardMaterial color="#8c9091" metalness={.8} roughness={.25}/></mesh>)}
    <pointLight position={[0,2.05,0]} intensity={2.5} color={accent} distance={4}/>
  </Hotspot>;
}

export function Keyboard({position=[0,0,0],label='Studio Grand / Keys'}){
  return <Hotspot position={position} meta={{type:'TECLAS',title:label,description:'Pianos, eléctricos y sintetizadores organizados por intención musical. Toca tú o convoca un tecladista.',actions:['Studio Grand','Warm Rhodes','Glass Keys','Analog Pad']}}>
    <RoundedBox args={[3,.31,.95]} radius={.07} smoothness={4} position={[0,.9,0]} castShadow><meshPhysicalMaterial color="#151719" roughness={.35} metalness={.2}/></RoundedBox>
    {Array.from({length:24}).map((_,i)=>{
      const black=[1,3,6,8,10].includes(i%12);
      return <RoundedBox key={i} args={[.105,.055,black?.4:.67]} radius={.008} smoothness={2} position={[-1.28+i*.112,1.09,black?-.11:.02]}>
        <meshPhysicalMaterial color={black?'#171719':'#e5e1d7'} roughness={.38}/>
      </RoundedBox>
    })}
    <mesh position={[-1.1,.38,0]} rotation-z={.07}><boxGeometry args={[.12,1.05,.12]}/><meshStandardMaterial color="#242628"/></mesh>
    <mesh position={[1.1,.38,0]} rotation-z={-.07}><boxGeometry args={[.12,1.05,.12]}/><meshStandardMaterial color="#242628"/></mesh>
  </Hotspot>;
}

export function SynthRack({position=[0,0,0],accent='#8b65e8'}){
  return <Hotspot position={position} meta={{type:'SYNTH RACK',title:'Deep Synth Library',description:'Sintetizadores clásicos y modernos organizados por carácter, función y macros musicales.',actions:['Poly Analog','Mono Lead','FM Glass','Ambient Motion']}}>
    <RoundedBox args={[2.45,2.35,.62]} radius={.07} smoothness={4} position={[0,1.18,0]} castShadow><meshPhysicalMaterial color="#141419" roughness={.35} metalness={.22}/></RoundedBox>
    {Array.from({length:4}).map((_,row)=><group key={row} position={[0,.48+row*.49,.33]}>
      <RoundedBox args={[2.15,.38,.055]} radius={.025} smoothness={3}><meshPhysicalMaterial color={row%2?'#25202c':'#202227'} roughness={.4} metalness={.25}/></RoundedBox>
      {Array.from({length:8}).map((_,i)=><Knob key={i} position={[-.78+i*.22,0,.045]} color={i%3===0?accent:'#87929a'} size={.032}/>)}
    </group>)}
  </Hotspot>;
}

export function ConsoleDesk({position=[0,0,0],master=false,accent='#3b9bc1'}){
  const channels=14;
  return <Hotspot position={position} meta={{type:master?'MASTERING CONSOLE':'MEZCLA',title:master?'Mastering Desk':'Control Room Console',description:master?'Cadena final, medición, referencias y exportación con decisiones reversibles.':'Faders, buses, inserts y referencias. La consola se abre sólo cuando la precisión importa.',actions:master?['Natural','Streaming','Dynamic','Power']:['Balance','Drum Bus','Vocal Focus','Reference A/B']}}>
    <mesh position={[0,.82,0]} rotation-x={-.12} castShadow receiveShadow>
      <boxGeometry args={[6.7,.68,2.15]}/><meshPhysicalMaterial color={master?'#33291c':'#1c2428'} roughness={.38} metalness={.28} clearcoat={.12}/>
    </mesh>
    {Array.from({length:channels}).map((_,i)=>{
      const x=-2.75+i*.42;
      return <group key={i} position={[x,1.05,.02]} rotation-x={-.12}>
        <RoundedBox args={[.26,.035,1.25]} radius={.02} smoothness={2}><meshStandardMaterial color="#0f1214"/></RoundedBox>
        <Knob position={[0,.05,-.38]} color={i%4===0?accent:'#8ca1ab'} size={.038}/>
        <mesh position={[0,.06,.36]}><boxGeometry args={[.09,.045,.26]}/><meshPhysicalMaterial color="#dedbd3" roughness={.35}/></mesh>
        <mesh position={[0,.065,.02]}><boxGeometry args={[.08,.012,.32]}/><meshBasicMaterial color={accent}/></mesh>
      </group>
    })}
    <RoundedBox args={[2.45,.12,.92]} radius={.04} smoothness={3} position={[0,1.36,-1.02]}><meshPhysicalMaterial color="#080a0b" roughness={.25} metalness={.4}/></RoundedBox>
  </Hotspot>;
}

export function Microphone({position=[0,0,0]}){
  return <Hotspot position={position} meta={{type:'MICRÓFONO',title:'Vocal / Instrument Capture',description:'Punto de captura virtual para voz e instrumentos acústicos con cadena simple y control de distancia.',actions:['Vocal Intimate','Airy Pop','Broadcast Warm','Acoustic Detail']}}>
    <mesh position={[0,.88,0]}><cylinderGeometry args={[.026,.026,1.75,14]}/><meshPhysicalMaterial color="#535b60" metalness={.72} roughness={.28}/></mesh>
    <mesh position={[0,1.86,0]}><capsuleGeometry args={[.095,.18,8,16]}/><meshPhysicalMaterial color="#b9aa92" metalness={.62} roughness={.34}/></mesh>
    <mesh position={[0,.03,0]}><cylinderGeometry args={[.34,.34,.035,32]}/><meshPhysicalMaterial color="#292b2e" metalness={.55} roughness={.4}/></mesh>
  </Hotspot>;
}

export function SessionPlayer({position=[0,0,0],role='drummer',active=false,accent='#d9a45f'}){
  if(!active)return null;
  return <group position={position}>
    <mesh position={[0,1.74,0]} castShadow><sphereGeometry args={[.18,24,18]}/><meshPhysicalMaterial color="#a87861" roughness={.78}/></mesh>
    <mesh position={[0,1.2,0]} castShadow><capsuleGeometry args={[.27,.48,8,16]}/><meshPhysicalMaterial color={accent} roughness={.74}/></mesh>
    <mesh position={[-.17,.63,0]} rotation-z={.05}><capsuleGeometry args={[.075,.55,6,12]}/><meshStandardMaterial color="#252729"/></mesh>
    <mesh position={[.17,.63,0]} rotation-z={-.05}><capsuleGeometry args={[.075,.55,6,12]}/><meshStandardMaterial color="#252729"/></mesh>
    <pointLight position={[0,2.1,.2]} intensity={.65} distance={2.3} color={accent}/>
  </group>;
}
