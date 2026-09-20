import React from 'react';
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
  VUMeter,
  DrumHardwareDetail,
  MicrophoneGrille,
  SpeakerDriverDetail
} from '../hardware/StudioHardware.jsx';

function ConsoleSection({x,accent,variant=0}){
  return <group position={[x,1.42,-1.13]} rotation={[-.11,0,0]}>
    <HardwareDisplay position={[0,.045,-.27]} width={.52} height={.18} title={variant===0?'TONE':variant===1?'EQ':variant===2?'DYNAMICS':variant===3?'STEREO':'LIMIT'} value={variant===4?'-0.8':'0.0'} unit={variant===4?'TP':'dB'} accent={accent} mode={variant%2?'curve':'meter'}/>
    <HardwareKnob position={[-.25,.075,.12]} size={.045} color="#aaa9a4" accent={accent}/>
    <HardwareKnob position={[0,.075,.12]} size={.052} color={accent} accent="#f0d6a7"/>
    <HardwareKnob position={[.25,.075,.12]} size={.045} color="#aaa9a4" accent={accent}/>
    <HardwareFader position={[.26,.06,.36]} length={.34} value={.35+variant*.1} accent={accent}/>
    <HardwareToggle position={[-.28,.06,.36]} on={variant!==3} accent={accent}/>
    <HardwareLED position={[-.1,.07,.39]} color="#66cb93" size={.009}/>
    <HardwareLED position={[.04,.07,.39]} color={variant===4?'#d76652':'#c59a56'} size={.009}/>
  </group>;
}

function MasterConsoleJewelry(){
  const accents=['#b48c58','#6f9da5','#b99163','#7e9fa5','#d09a59'];
  return <group name="master_console_jewelry_v5">
    {[-2.22,-1.12,0,1.12,2.22].map((x,i)=><ConsoleSection key={x} x={x} accent={accents[i]} variant={i}/>)}
    <group position={[0,1.63,-1.76]} rotation={[-.1,0,0]}>
      <HardwareDisplay position={[-.62,.02,0]} width={.92} height={.22} title="REFERENCE" value="-14.0" unit="LUFS-I" accent="#d9a45f"/>
      <VUMeter position={[.24,.02,0]} accent="#d9a45f" needle={-.12}/>
      <HardwareKnob position={[.78,.04,.0]} size={.07} color="#b58b4f" accent="#f2d7a6"/>
      {[.98,1.08].map((x,i)=><HardwareButton key={x} position={[x,.045,0]} active={i===0} accent="#d9a45f" size={.06}/>)}
    </group>
  </group>;
}

function MonitorJewelry({side='left'}){
  const x=side==='left'?-2.28:2.28;
  return <group name={'monitor_jewelry_'+side} position={[x,1.42,-5.15]}>
    <SpeakerDriverDetail position={[0,-.28,.43]} radius={.34} accent="#8c9699"/>
    <SpeakerDriverDetail position={[0,.43,.43]} radius={.14} accent="#b5b2a9"/>
    <HardwareLED position={[0,.76,.46]} color="#68ce94" size={.011}/>
  </group>;
}

function RackJewelry({side='left'}){
  const x=side==='left'?-3.25:3.25;
  const accent=side==='left'?'#8aa0a3':'#c28d53';
  return <group name={'rack_jewelry_'+side} position={[x,1.15,-3.55]}>
    {[-.84,-.42,0,.42,.84].map((y,i)=><RackFaceplate key={i} position={[0,y,.39]} width=1.03 height={.32} accent={i===2?'#d0aa6a':accent} variant={i}/>)}
    {side==='right'&&<>
      <VUMeter position={[-.19,.42,.435]} rotation={[0,0,0]} accent="#d9a45f" needle={-.18}/>
      <VUMeter position={[.19,.42,.435]} rotation={[0,0,0]} accent="#d9a45f" needle={.12}/>
    </>}
  </group>;
}

export function MasteringJewelryLayer(){
  return <group name="DMP_MASTERING_JEWELRY_V5" userData={{designSystem:'jewelry-v5'}}>
    <MasterConsoleJewelry/>
    <MonitorJewelry side="left"/>
    <MonitorJewelry side="right"/>
    <RackJewelry side="left"/>
    <RackJewelry side="right"/>
  </group>;
}

function ProductionJewelry(){
  return <group name="production_jewelry_v5">
    <PianoKeybed position={[0,1.29,-1.02]} rotation={[-.03,0,0]} octaves={5} width={3.28}/>
    <group position={[-3.22,1.35,-3.16]}>
      {[-.82,-.4,.02,.44,.86].map((y,i)=><RackFaceplate key={i} position={[0,y,.02]} width=1.2 height={.31} accent={i%2?'#9e76d4':'#6bb5b9'} variant={i}/>)}
    </group>
    <group position={[3.22,1.35,-3.16]}>
      {[-.82,-.4,.02,.44,.86].map((y,i)=><RackFaceplate key={i} position={[0,y,.02]} width=1.2 height={.31} accent={i%2?'#bf73c9':'#6ca9cf'} variant={i+1}/>)}
    </group>
    <HardwareDisplay position={[0,1.49,-.82]} rotation={[-Math.PI/2,0,0]} width={.78} height={.2} title="DEEP KEYS" value="WARM" unit="RHODES" accent="#9a72d1" mode="curve"/>
  </group>;
}

function PracticeJewelry(){
  return <group name="practice_jewelry_v5">
    <AmpControlStrip position={[-3.25,1.58,-3.94]} rotation={[0,0,0]} width=1.18 accent="#d7a05a"/>
    <AmpControlStrip position={[3.3,1.56,-3.84]} rotation={[0,0,0]} width=1.18 accent="#d7a05a"/>
    <PianoKeybed position={[2.35,1.28,-5.03]} rotation={[-.02,0,0]} octaves={4} width={2.18}/>
    <DrumHardwareDetail position={[0,.02,-2.2]} accent="#d7a05a"/>
  </group>;
}

function RecordingJewelry(){
  return <group name="recording_jewelry_v5">
    <MicrophoneGrille position={[2.5,1.78,-1.86]} scale={1.08}/>
    <group position={[3.72,1.14,-4.33]}>
      {[-.72,-.3,.12,.54].map((y,i)=><RackFaceplate key={i} position={[0,y,0]} width=1.12 height={.31} accent={i===1?'#cc9b5d':'#829ba2'} variant={i}/>)}
    </group>
    <DrumHardwareDetail position={[-1.65,.02,-2.5]} accent="#c99b56"/>
  </group>;
}

function MixJewelry(){
  const channelXs=Array.from({length:16},(_,i)=>-2.75+i*(5.5/15));
  return <group name="mix_jewelry_v5">
    <group position={[0,1.43,-1.1]} rotation={[-.11,0,0]}>
      {channelXs.map((x,i)=><group key={i} position={[x,0,0]}>
        <HardwareKnob position={[0,.05,-.3]} size={.028} color={i%4===0?'#6b98a5':'#9d9e98'} accent="#c9aa74"/>
        <HardwareFader position={[0,.045,.18]} length={.34} value={(i%7)/8+.08} accent={i%4===0?'#76a8b7':'#c9a46e'}/>
        <HardwareLED position={[0,.05,.4]} color={i%6===0?'#d76a54':'#67c88e'} size={.007}/>
      </group>)}
      <HardwareDisplay position={[0,.08,-.57]} width=1.35 height={.22} title="MIX BUS" value="-18.2" unit="LUFS-S" accent="#6da4b6"/>
    </group>
    <group position={[-3.65,1.12,-3.4]}>{[-.72,-.3,.12,.54].map((y,i)=><RackFaceplate key={i} position={[0,y,0]} width=1.14 height={.31} accent="#759aa5" variant={i}/>)}</group>
    <group position={[3.65,1.12,-3.4]}>{[-.72,-.3,.12,.54].map((y,i)=><RackFaceplate key={i} position={[0,y,0]} width=1.14 height={.31} accent="#c59258" variant={i+2}/>)}</group>
  </group>;
}

export function RoomJewelryLayer({room}){
  if(room==='practice')return <PracticeJewelry/>;
  if(room==='record')return <RecordingJewelry/>;
  if(room==='production')return <ProductionJewelry/>;
  if(room==='mix')return <MixJewelry/>;
  return null;
}
