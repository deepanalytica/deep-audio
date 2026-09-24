import { create } from 'zustand';

export const useStudioStore = create((set,get) => ({
  room:'practice',
  perspective:'overview',
  selected:null,
  drawer:null,
  mapOpen:false,
  audioReady:false,
  playing:false,
  recording:false,
  inputMonitor:false,
  metronome:false,
  bpm:120,
  volume:72,
  key:'C',
  progression:'I–V–vi–IV',
  roomSound:'Studio Live',
  track:null,
  lastRecording:null,
  notice:null,
  masteringProfile:'Natural',
  masteringControls:{tone:0,dynamicEq:28,compression:18,saturation:8,stereo:100,ceiling:-1},
  equipmentSettings:{},
  activePlayers:[],
  roomTransition:{active:false,target:null,id:0},
  startup:{
    criticalAssetReady:false,
    criticalAssetId:null,
    criticalAssetSource:null,
    firstFrameReady:false
  },
  presets:{
    drummer:'Neo Soul Dry',
    bassist:'Round Finger',
    guitarist:'Clean Chorus',
    keys:'Warm Rhodes',
    synth:'Poly Analog'
  },
  setRoom:(room)=>{
    if(room===get().room||get().roomTransition.target===room)return;
    const id=(get().roomTransition.id||0)+1;
    set({roomTransition:{active:true,target:room,id},selected:null,mapOpen:false,drawer:null});
    window.setTimeout(()=>{
      if(get().roomTransition.id!==id)return;
      set({room,perspective:'overview',selected:null,mapOpen:false});
    },80);
    window.setTimeout(()=>{
      if(get().roomTransition.id!==id)return;
      set({roomTransition:{active:false,target:null,id}});
    },360);
  },
  setPerspective:(perspective)=>set({perspective,selected:null}),
  select:(selected)=>set({selected,drawer:null,mapOpen:false}),
  closeSelected:()=>set({selected:null}),
  openDrawer:(drawer)=>set({drawer,selected:null,mapOpen:false}),
  closeDrawer:()=>set({drawer:null}),
  setMapOpen:(mapOpen)=>set({mapOpen}),
  setAudioReady:(audioReady)=>set({audioReady}),
  markCriticalAssetReady:(criticalAssetId,criticalAssetSource='glb')=>set((s)=>({
    startup:{
      ...s.startup,
      criticalAssetReady:true,
      criticalAssetId,
      criticalAssetSource
    }
  })),
  markFirstFrameReady:()=>set((s)=>({
    startup:{...s.startup,firstFrameReady:true}
  })),
  setPlaying:(playing)=>set({playing}),
  setRecording:(recording)=>set({recording}),
  setInputMonitor:(inputMonitor)=>set({inputMonitor}),
  setMetronome:(metronome)=>set({metronome}),
  setBpm:(bpm)=>set({bpm}),
  setVolume:(volume)=>set({volume}),
  setKey:(key)=>set({key}),
  setProgression:(progression)=>set({progression}),
  setRoomSound:(roomSound)=>set({roomSound}),
  setTrack:(track)=>set({track}),
  setLastRecording:(lastRecording)=>set({lastRecording}),
  notify:(message,tone='info')=>set({notice:{message,tone,id:Date.now()}}),
  clearNotice:()=>set({notice:null}),
  setMasteringProfile:(masteringProfile)=>set({masteringProfile}),
  setMasteringControls:(masteringControls)=>set({masteringControls}),
  setMasteringControl:(control,value)=>set((s)=>({
    masteringControls:{...s.masteringControls,[control]:value}
  })),
  setEquipmentSetting:(equipment,setting)=>set((s)=>({equipmentSettings:{...s.equipmentSettings,[equipment]:setting}})),
  setActivePlayers:(activePlayers)=>set({activePlayers}),
  togglePlayer:(id)=>set((s)=>({
    activePlayers:s.activePlayers.includes(id)
      ? s.activePlayers.filter((x)=>x!==id)
      : [...s.activePlayers,id]
  })),
  setPreset:(role,name)=>set((s)=>({presets:{...s.presets,[role]:name}}))
}));
