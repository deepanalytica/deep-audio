import { create } from 'zustand';

export const useStudioStore = create((set) => ({
  room:'practice',
  selected:null,
  drawer:null,
  mapOpen:false,
  audioReady:false,
  playing:false,
  recording:false,
  metronome:false,
  bpm:120,
  key:'C',
  progression:'I–V–vi–IV',
  roomSound:'Studio Live',
  masteringProfile:'Natural',
  masteringControls:{tone:0,dynamicEq:28,compression:18,saturation:8,stereo:100,ceiling:-1},
  activePlayers:[],
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
  setRoom:(room)=>set({room,selected:null,mapOpen:false}),
  select:(selected)=>set({selected}),
  closeSelected:()=>set({selected:null}),
  openDrawer:(drawer)=>set({drawer}),
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
  setMetronome:(metronome)=>set({metronome}),
  setBpm:(bpm)=>set({bpm}),
  setKey:(key)=>set({key}),
  setProgression:(progression)=>set({progression}),
  setRoomSound:(roomSound)=>set({roomSound}),
  setMasteringProfile:(masteringProfile)=>set({masteringProfile}),
  setMasteringControl:(control,value)=>set((s)=>({
    masteringControls:{...s.masteringControls,[control]:value}
  })),
  togglePlayer:(id)=>set((s)=>({
    activePlayers:s.activePlayers.includes(id)
      ? s.activePlayers.filter((x)=>x!==id)
      : [...s.activePlayers,id]
  })),
  setPreset:(role,name)=>set((s)=>({presets:{...s.presets,[role]:name}}))
}));
