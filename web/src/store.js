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
  track:null,
  lastRecording:null,
  notice:null,
  masteringProfile:'Natural',
  masteringControls:{tone:0,dynamicEq:28,compression:18,saturation:8,stereo:100,ceiling:-1},
  activePlayers:[],
  presets:{
    drummer:'Neo Soul Dry',
    bassist:'Round Finger',
    guitarist:'Clean Chorus',
    keys:'Warm Rhodes',
    synth:'Poly Analog'
  },
  setRoom:(room)=>set({room,selected:null,drawer:null,mapOpen:false}),
  select:(selected)=>set({selected,drawer:null,mapOpen:false}),
  closeSelected:()=>set({selected:null}),
  openDrawer:(drawer)=>set({drawer,selected:null,mapOpen:false}),
  closeDrawer:()=>set({drawer:null}),
  setMapOpen:(mapOpen)=>set({mapOpen}),
  setAudioReady:(audioReady)=>set({audioReady}),
  setPlaying:(playing)=>set({playing}),
  setRecording:(recording)=>set({recording}),
  setMetronome:(metronome)=>set({metronome}),
  setBpm:(bpm)=>set({bpm}),
  setKey:(key)=>set({key}),
  setProgression:(progression)=>set({progression}),
  setRoomSound:(roomSound)=>set({roomSound}),
  setTrack:(track)=>set({track}),
  setLastRecording:(lastRecording)=>set({lastRecording}),
  notify:(message,tone='info')=>set({notice:{message,tone,id:Date.now()}}),
  clearNotice:()=>set({notice:null}),
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
