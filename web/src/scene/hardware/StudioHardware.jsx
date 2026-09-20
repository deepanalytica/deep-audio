import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

function displayTexture({ title='DMP', value='-14.0', unit='LUFS', accent='#d9a45f', mode='meter' } = {}){
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=220;
  const c=canvas.getContext('2d');
  const g=c.createLinearGradient(0,0,0,220);
  g.addColorStop(0,'#071012');g.addColorStop(1,'#020607');
  c.fillStyle=g;c.fillRect(0,0,512,220);
  c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=1;
  for(let x=0;x<512;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x,220);c.stroke()}
  for(let y=0;y<220;y+=28){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke()}
  c.fillStyle=accent;c.font='600 28px system-ui';c.fillText(title,24,42);
  c.fillStyle='#eef1ec';c.font='700 62px ui-monospace, SFMono-Regular, Menlo, monospace';c.fillText(value,24,112);
  c.fillStyle='rgba(230,231,225,.55)';c.font='600 18px system-ui';c.fillText(unit,30,143);
  if(mode==='meter'){
    for(let i=0;i<28;i++){
      const h=18+Math.abs(Math.sin(i*.48))*42;
      c.fillStyle=i>23?'#d79a58':i>18?'#b6ad69':'#6faaa0';
      c.fillRect(252+i*8,178-h,5,h);
    }
  }else{
    c.strokeStyle=accent;c.lineWidth=3;c.beginPath();
    for(let x=0;x<235;x++){
      const y=175-Math.sin(x*.08)*18-Math.sin(x*.027)*10;
      if(x===0)c.moveTo(254+x,y);else c.lineTo(254+x,y);
    }
    c.stroke();
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
}

export function HardwareScrew({position=[0,0,0],rotation=[Math.PI/2,0,0],size=.016}){
  return <group position={position} rotation={rotation}>
    <mesh castShadow><cylinderGeometry args={[size,size,size*.52,16]}/><meshPhysicalMaterial color="#8c8981" metalness={.88} roughness={.24}/></mesh>
    <mesh position={[0,size*.28,0]}><boxGeometry args={[size*1.15,size*.12,size*.11]}/><meshStandardMaterial color="#323331" metalness={.7} roughness={.32}/></mesh>
  </group>;
}

export function HardwareLED({position=[0,0,0],color='#67cf94',size=.012,intensity=1.5}){
  return <group position={position}>
    <mesh><sphereGeometry args={[size,16,10]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
    <pointLight color={color} intensity={intensity*.08} distance={.38} decay={2}/>
  </group>;
}

export function HardwareKnob({position=[0,0,0],size=.045,color='#a9ada9',accent='#e3c48e',vertical=false}){
  const rot=vertical?[Math.PI/2,0,0]:[0,0,0];
  const ticks=useMemo(()=>Array.from({length:11},(_,i)=>i),[]);
  return <group position={position} rotation={rot}>
    {ticks.map(i=>{
      const a=(-.78+i*(1.56/10))*Math.PI;
      return <mesh key={i} position={[Math.sin(a)*size*1.42,size*.03,Math.cos(a)*size*1.42]} rotation={[0,-a,0]}>
        <boxGeometry args={[size*.06,size*.035,size*.25]}/><meshStandardMaterial color="#8e8a80" roughness={.58}/></mesh>
    })}
    <mesh castShadow><cylinderGeometry args={[size,size*1.04,size*.72,32]}/><meshPhysicalMaterial color={color} metalness={.6} roughness={.29} clearcoat={.12}/></mesh>
    <mesh position={[0,size*.39,size*.38]}><boxGeometry args={[size*.09,size*.035,size*.66]}/><meshBasicMaterial color={accent}/></mesh>
  </group>;
}

export function HardwareFader({position=[0,0,0],length=.38,value=.55,accent='#d9a45f',verticalSurface=false}){
  const capPos=(value-.5)*length*.7;
  const groupRot=verticalSurface?[Math.PI/2,0,0]:[0,0,0];
  return <group position={position} rotation={groupRot}>
    <RoundedBox args={[.055,.018,length]} radius={.008} smoothness={2}>
      <meshPhysicalMaterial color="#070809" roughness={.72} metalness={.25}/>
    </RoundedBox>
    <mesh position={[0,.014,0]}><boxGeometry args={[.012,.012,length*.84]}/><meshBasicMaterial color="#3a3b3a"/></mesh>
    <RoundedBox args={[.14,.055,.095]} radius={.018} smoothness={3} position={[0,.045,capPos]} castShadow>
      <meshPhysicalMaterial color="#d8d4ca" roughness={.31} metalness={.16}/>
    </RoundedBox>
    <mesh position={[0,.076,capPos]}><boxGeometry args={[.095,.008,.008]}/><meshBasicMaterial color={accent}/></mesh>
  </group>;
}

export function HardwareToggle({position=[0,0,0],on=true,accent='#d9a45f',verticalSurface=false}){
  const groupRot=verticalSurface?[Math.PI/2,0,0]:[0,0,0];
  return <group position={position} rotation={groupRot}>
    <mesh><cylinderGeometry args={[.034,.034,.018,20]}/><meshPhysicalMaterial color="#171918" metalness={.72} roughness={.28}/></mesh>
    <mesh position={[0,.045,on?.026:-.026]} rotation={[on?.32:-.32,0,0]} castShadow>
      <cylinderGeometry args={[.012,.015,.11,14]}/><meshPhysicalMaterial color="#bdb9ae" metalness={.75} roughness={.24}/>
    </mesh>
    {on&&<HardwareLED position={[.055,.02,0]} color={accent} size={.008}/>}
  </group>;
}

export function HardwareButton({position=[0,0,0],active=false,accent='#d9a45f',size=.07}){
  return <group position={position}>
    <RoundedBox args={[size,.028,size]} radius={.012} smoothness={3} castShadow>
      <meshPhysicalMaterial color={active?accent:'#292b2b'} emissive={active?accent:'#000000'} emissiveIntensity={active?.28:0} metalness={.28} roughness={.4}/>
    </RoundedBox>
    <mesh position={[0,.017,0]}><boxGeometry args={[size*.55,.004,size*.07]}/><meshBasicMaterial color={active?'#16120d':'#8e8a82'}/></mesh>
  </group>;
}

export function HardwareDisplay({position=[0,0,0],rotation=[-Math.PI/2,0,0],width=.72,height=.28,title='REFERENCE',value='-14.0',unit='LUFS',accent='#d9a45f',mode='meter'}){
  const tex=useMemo(()=>displayTexture({title,value,unit,accent,mode}),[title,value,unit,accent,mode]);
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[width,.035,height]} radius={.028} smoothness={4} castShadow>
      <meshPhysicalMaterial color="#090b0b" metalness={.32} roughness={.22} clearcoat={.22}/>
    </RoundedBox>
    <mesh position={[0,-.019,0]} rotation={[Math.PI/2,0,0]}>
      <planeGeometry args={[width*.91,height*.8]}/><meshBasicMaterial map={tex} toneMapped={false}/>
    </mesh>
  </group>;
}

export function VUMeter({position=[0,0,0],rotation=[-Math.PI/2,0,0],accent='#d9a45f',needle=.25}){
  const face=useMemo(()=>displayTexture({title:'LEVEL',value:'+1.2',unit:'dB',accent,mode:'curve'}),[accent]);
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[.34,.032,.21]} radius={.026} smoothness={4}>
      <meshPhysicalMaterial color="#19140e" roughness={.28} metalness={.18} clearcoat={.18}/>
    </RoundedBox>
    <mesh position={[0,-.018,0]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[.29,.16]}/><meshBasicMaterial map={face} toneMapped={false}/></mesh>
    <mesh position={[0,-.022,.01]} rotation={[0,needle,0]}><boxGeometry args={[.006,.006,.12]}/><meshBasicMaterial color="#d65f4d" toneMapped={false}/></mesh>
  </group>;
}

export function RackFaceplate({position=[0,0,0],rotation=[0,0,0],width=1.1,height=.34,accent='#d9a45f',variant=0}){
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[width,height,.055]} radius={.025} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial color={variant%2?'#2c2925':'#202426'} metalness={.46} roughness={.3}/>
    </RoundedBox>
    <HardwareKnob position={[-width*.28,0,.045]} size={.034} color="#a9aaa5" accent={accent} vertical/>
    <HardwareKnob position={[-width*.08,0,.045]} size={.038} color={accent} accent="#f1d9ad" vertical/>
    <HardwareToggle position={[width*.12,0,.045]} on={variant%3!==0} accent={accent} verticalSurface/>
    <HardwareLED position={[width*.3,.06,.045]} color="#65c992" size={.01}/>
    <HardwareLED position={[width*.4,.06,.045]} color={variant%2?'#d46f56':'#cba45b'} size={.01}/>
    <HardwareScrew position={[-width*.46,0,.046]} size={.013}/>
    <HardwareScrew position={[width*.46,0,.046]} size={.013}/>
  </group>;
}

export function PianoKeybed({position=[0,0,0],rotation=[0,0,0],octaves=4,width=2.75}){
  const whiteCount=octaves*7;
  const keyW=width/whiteCount;
  const blackPattern=[0,1,0,1,0,0,1,0,1,0,1,0];
  const blackPositions=[];
  for(let o=0;o<octaves;o++){
    const base=o*7;
    [0,1,3,4,5].forEach(step=>blackPositions.push(base+step+.68));
  }
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[width+.12,.08,.72]} radius={.035} smoothness={3} position={[0,-.045,0]}>
      <meshPhysicalMaterial color="#121313" metalness={.16} roughness={.34}/>
    </RoundedBox>
    {Array.from({length:whiteCount},(_,i)=><RoundedBox key={'w'+i} args={[keyW*.93,.055,.62]} radius={.008} smoothness={2} position={[-width/2+keyW/2+i*keyW,0,.035]} castShadow>
      <meshPhysicalMaterial color="#ece8de" roughness={.31} clearcoat={.08}/>
    </RoundedBox>)}
    {blackPositions.map((p,i)=><RoundedBox key={'b'+i} args={[keyW*.58,.068,.39]} radius={.007} smoothness={2} position={[-width/2+p*keyW,.038,-.08]} castShadow>
      <meshPhysicalMaterial color="#171818" roughness={.24} clearcoat={.16}/>
    </RoundedBox>)}
  </group>;
}

export function AmpControlStrip({position=[0,0,0],rotation=[0,0,0],width=1.18,accent='#d9a45f'}){
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[width,.16,.055]} radius={.02} smoothness={3}>
      <meshPhysicalMaterial color="#b5905e" metalness={.32} roughness={.39}/>
    </RoundedBox>
    {[-.42,-.25,-.08,.09,.26,.43].map((x,i)=><HardwareKnob key={i} position={[x,0,.045]} size={.026} color={i===0?'#e9e1d3':'#2b241e'} accent={accent} vertical/>)}
    <HardwareLED position={[width*.42,.045,.047]} color="#69cf93" size={.009}/>
  </group>;
}

export function MicrophoneGrille({position=[0,0,0],scale=1}){
  const rings=useMemo(()=>Array.from({length:8},(_,i)=>i),[]);
  return <group position={position} scale={scale}>
    <mesh castShadow><capsuleGeometry args={[.095,.18,10,24]}/><meshPhysicalMaterial color="#9d9384" metalness={.75} roughness={.34}/></mesh>
    {rings.map(i=><mesh key={i} position={[0,-.13+i*.038,0]} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[.092,.006,8,28]}/><meshStandardMaterial color="#c1b6a3" metalness={.7} roughness={.34}/></mesh>)}
    {[-.055,0,.055].map((x,i)=><mesh key={i} position={[x,0,.093]}>
      <boxGeometry args={[.007,.31,.007]}/><meshStandardMaterial color="#7b746a" metalness={.72} roughness={.34}/></mesh>)}
  </group>;
}

export function DrumHardwareDetail({position=[0,0,0],accent='#c79a54'}){
  return <group position={position}>
    <mesh position={[0,.035,.18]} rotation={[0,0,.04]}><boxGeometry args={[.3,.045,.13]}/><meshPhysicalMaterial color="#242626" metalness={.65} roughness={.32}/></mesh>
    <mesh position={[0,.14,.12]} rotation={[.4,0,0]}><cylinderGeometry args={[.018,.018,.28,12]}/><meshPhysicalMaterial color="#8e9290" metalness={.82} roughness={.22}/></mesh>
    <mesh position={[0,.26,.02]}><sphereGeometry args={[.035,14,10]}/><meshPhysicalMaterial color="#d4c7ad" roughness={.45}/></mesh>
    <HardwareLED position={[.22,.08,.12]} color={accent} size={.007} intensity=.5/>
  </group>;
}

export function SpeakerDriverDetail({position=[0,0,0],radius=.34,accent='#6f8f9f'}){
  return <group position={position}>
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius,radius*.08,16,56]}/><meshPhysicalMaterial color="#050606" roughness={.56}/></mesh>
    <mesh rotation={[Math.PI/2,0,0]} position={[0,0,.01]}><cylinderGeometry args={[radius*.72,radius*.72,.03,56]}/><meshPhysicalMaterial color="#293035" roughness={.34} metalness={.18}/></mesh>
    <mesh rotation={[Math.PI/2,0,0]} position={[0,0,.035]}><sphereGeometry args={[radius*.24,28,16]}/><meshPhysicalMaterial color={accent} roughness={.28} metalness={.28}/></mesh>
  </group>;
}
