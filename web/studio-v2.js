import * as THREE from './vendor/three.module.js';

const app = document.querySelector('#app');
const canvas = document.querySelector('#studio');
const roomHeading = document.querySelector('#roomHeading');
const roomEyebrow = document.querySelector('#roomEyebrow');
const roomCopy = document.querySelector('#roomCopy');
const contextPanel = document.querySelector('#contextPanel');
const contextType = document.querySelector('#contextType');
const contextTitle = document.querySelector('#contextTitle');
const contextDescription = document.querySelector('#contextDescription');
const contextContent = document.querySelector('#contextContent');
const drawer = document.querySelector('#drawer');
const drawerEyebrow = document.querySelector('#drawerEyebrow');
const drawerTitle = document.querySelector('#drawerTitle');
const drawerContent = document.querySelector('#drawerContent');
const studioMap = document.querySelector('#studioMap');
const audioState = document.querySelector('#audioState');
const bpmInput = document.querySelector('#bpm');
const metroButton = document.querySelector('#metro');
const playButton = document.querySelector('#play');
const stopButton = document.querySelector('#stop');
const recButton = document.querySelector('#rec');
const clock = document.querySelector('#clock');
const transportState = document.querySelector('#transportState');
const masterMeter = document.querySelector('#masterMeter');
const toast = document.querySelector('#toast');

const hotspotLabel = document.createElement('div');
hotspotLabel.className = 'hotspot-label';
document.body.appendChild(hotspotLabel);

const ROOMS = {
  practice: {
    eyebrow:'SALA 01 · ENSAYO',
    heading:'Entra. Escucha. Toca.',
    copy:'Muévete por la sala, acércate a los instrumentos y construye una sesión desde el espacio.',
    color:0xd7a25f, fog:0x15110d, camera:[0,1.65,7.6], look:[0,1.25,-1.4]
  },
  record: {
    eyebrow:'SALA 02 · GRABACIÓN',
    heading:'La interpretación primero.',
    copy:'Micrófonos, amplificadores, batería y cabina viven donde esperas encontrarlos. Grabar se siente físico.',
    color:0xd0524d, fog:0x160b0b, camera:[0.2,1.62,7.2], look:[0,1.35,-1.6]
  },
  production: {
    eyebrow:'SALA 03 · PRODUCCIÓN',
    heading:'Construye un mundo sonoro.',
    copy:'Sintetizadores, pianos, máquinas y armonía se exploran como instrumentos reales, no como una lista de plugins.',
    color:0x8b65e8, fog:0x100d18, camera:[0,1.72,7.5], look:[0,1.2,-1.4]
  },
  mix: {
    eyebrow:'SALA 04 · MEZCLA',
    heading:'Siéntate frente a la música.',
    copy:'Consola, monitores, buses y referencias se convierten en una control room espacial y enfocada.',
    color:0x3c9dc3, fog:0x081319, camera:[0,1.62,7.9], look:[0,1.25,-1.8]
  },
  master: {
    eyebrow:'SALA 05 · MASTER',
    heading:'Decide con perspectiva.',
    copy:'Una suite más silenciosa y precisa para balance, dinámica, loudness, referencia y entrega final.',
    color:0xc9974e, fog:0x151109, camera:[0,1.66,8.2], look:[0,1.2,-1.9]
  }
};

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, .08, 70);
const roomGroup = new THREE.Group();
scene.add(roomGroup);

let currentRoom = 'practice';
let clickable = [];
let hovered = null;
let playerMeshes = {};
let yaw = 0;
let pitch = -0.05;
let dragging = false;
let pointerMoved = false;
let lastPointer = {x:0,y:0};
const keys = new Set();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const ambient = new THREE.HemisphereLight(0xd9c6ae,0x15191c,1.25);
scene.add(ambient);
const keyLight = new THREE.SpotLight(0xffffff,95,30,Math.PI/5,.45,1.2);
keyLight.position.set(0,6,4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024,1024);
scene.add(keyLight);
const accentLight = new THREE.PointLight(ROOMS.practice.color,35,12,2);
accentLight.position.set(-3,2.5,1);
scene.add(accentLight);
const fillLight = new THREE.PointLight(0x7b91a5,20,12,2);
fillLight.position.set(3,2,2);
scene.add(fillLight);

function material(color, rough=.65, metal=.05, emissive=0x000000){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive,emissiveIntensity:.12});
}
function addMesh(geo,mat,pos=[0,0,0],rot=[0,0,0],shadow=true,parent=roomGroup){
  const m=new THREE.Mesh(geo,mat);
  m.position.set(...pos); m.rotation.set(...rot);
  if(shadow){m.castShadow=true;m.receiveShadow=true}
  parent.add(m); return m;
}
function tag(mesh, meta){
  mesh.traverse(o=>{
    if(o.isMesh){o.userData.hotspot=meta;clickable.push(o)}
  });
  return mesh;
}
function box(size,pos,color,rot=[0,0,0],rough=.7,metal=.04,parent=roomGroup){
  return addMesh(new THREE.BoxGeometry(...size),material(color,rough,metal),pos,rot,true,parent);
}
function cyl(r1,r2,h,pos,color,rot=[0,0,0],segments=32,parent=roomGroup){
  return addMesh(new THREE.CylinderGeometry(r1,r2,h,segments),material(color,.55,.12),pos,rot,true,parent);
}
function clearRoom(){
  clickable=[]; playerMeshes={};
  while(roomGroup.children.length){
    const o=roomGroup.children.pop();
    o.traverse(n=>{
      if(n.geometry)n.geometry.dispose();
      if(n.material){
        if(Array.isArray(n.material))n.material.forEach(x=>x.dispose());
        else n.material.dispose();
      }
    });
  }
}
function createShell(accent){
  box([15,.18,18],[0,-.1,-1.5],0x161719);
  box([15,6,.18],[0,2.9,-9],0x17191b);
  box([.18,6,18],[-7.45,2.9,-1.5],0x111315);
  box([.18,6,18],[7.45,2.9,-1.5],0x111315);
  for(let x=-5.5;x<=5.5;x+=2.2) box([1.2,1.9,.12],[x,3,-8.86],0x25282b);
  for(let z=-7;z<=4;z+=2.4) box([.08,.03,12],[0,.02,z],0x2a2c2d,[0,0,0],.9,.0);
  const rug=box([7.6,.035,5.8],[0,.03,-2.4],0x17130f);
  rug.material.color.offsetHSL(0,0,.03);
  const halo = new THREE.PointLight(accent,30,12,2);
  halo.position.set(0,3.8,-4.8);roomGroup.add(halo);
}
function createSpeaker(x,z=-5.6,scale=1){
  const g=new THREE.Group();
  box([1.05*scale,1.75*scale,.72*scale],[0,0,0],0x111315,[0,0,0],.45,.05,g);
  const woofer=cyl(.34*scale,.34*scale,.05*scale,[0,-.23,.385*scale],0x20272b,[Math.PI/2,0,0],32,g);
  const tweeter=cyl(.14*scale,.14*scale,.045*scale,[0,.48,.39*scale],0x323b40,[Math.PI/2,0,0],24,g);
  g.position.set(x,1.0*scale,z);roomGroup.add(g);return g;
}
function createAmp(x,z,label='Vintage Amp',color=0x33261e){
  const g=new THREE.Group();
  box([1.6,1.6,.75],[0,0,0],color,[0,0,0],.75,.05,g);
  const grill=box([1.42,1.05,.04],[0,-.12,.39],0x151515,[0,0,0],.9,.0,g);
  for(let i=0;i<5;i++) cyl(.035,.035,.03,[-.5+i*.25,.57,.4],0xc6a166,[Math.PI/2,0,0],12,g);
  g.position.set(x,.85,z);roomGroup.add(g);
  return tag(g,{type:'AMPLIFICADOR',title:label,description:'Amplificador virtual con carácter, cabina y room. Selecciona un punto de partida y afina sólo si lo necesitas.',actions:['Clean 65','Warm Tube','British Crunch','Modern Tight']});
}
function createGuitar(x,z,label='Guitarra'){
  const g=new THREE.Group();
  const body=cyl(.34,.29,.16,[0,.7,0],0x8b482b,[Math.PI/2,0,0],24,g);
  body.scale.y=.78;
  box([.11,1.35,.08],[0,1.48,0],0x6f4b2e,[0,0,0],.6,.0,g);
  box([.18,.35,.08],[0,2.25,0],0x6b452c,[0,0,0],.6,.0,g);
  g.position.set(x,0,z);g.rotation.z=x<0?.08:-.08;roomGroup.add(g);
  return tag(g,{type:'INSTRUMENTO',title:label,description:'Instrumento virtual / entrada real. Desde aquí puedes elegir sonido, músico de sesión o cadena de amplificación.',actions:['Natural','Vintage','Wide Clean','Session Ready']});
}
function createMic(x,z,label='Vocal Booth Mic'){
  const g=new THREE.Group();
  cyl(.028,.028,1.75,[0,.9,0],0x464c50,[0,0,0],12,g);
  cyl(.09,.09,.22,[0,1.84,0],0xb6a78e,[0,0,0],24,g);
  cyl(.33,.33,.025,[0,.02,0],0x2a2c2f,[0,0,0],24,g);
  g.position.set(x,0,z);roomGroup.add(g);
  return tag(g,{type:'MICRÓFONO',title:label,description:'Punto de captura para voz e instrumentos acústicos. Cambia patrón, distancia y espacio sin romper el flujo.',actions:['Vocal Intimate','Airy Pop','Broadcast Warm','Acoustic Detail']});
}
function createDrums(x=0,z=-3){
  const g=new THREE.Group();
  cyl(.62,.62,.72,[0,.62,0],0xd8d1c1,[Math.PI/2,0,0],32,g);
  cyl(.34,.34,.42,[-.58,.86,.16],0xc5bba8,[0,0,Math.PI/2],28,g);
  cyl(.31,.31,.38,[.5,.9,.1],0xc5bba8,[0,0,Math.PI/2],28,g);
  cyl(.4,.4,.36,[.82,.62,-.02],0xc5bba8,[0,0,Math.PI/2],28,g);
  cyl(.38,.38,.22,[-.92,.65,.05],0xd9d3c6,[0,0,Math.PI/2],28,g);
  const cym=(px,py,pz,r)=>cyl(r,r*.93,.035,[px,py,pz],0xbe9651,[0,0,0],32,g);
  cym(-1.05,1.65,.0,.52);cym(.95,1.73,-.1,.58);cym(0,1.78,-.35,.46);
  g.position.set(x,0,z);roomGroup.add(g);
  return tag(g,{type:'BATERÍA',title:'Studio Session Kit',description:'Kit acústico multicapa del concepto Deep Drums. En esta preview se sintetiza en tiempo real; la versión nativa usará nuestras librerías multisample.',actions:['Neo Soul Dry','Arena Rock','Vintage 70s','Modern Pop']});
}
function createKeyboard(x,z,label='Grand / Keys'){
  const g=new THREE.Group();
  box([2.9,.28,.9],[0,.9,0],0x161719,[0,0,0],.38,.08,g);
  for(let i=0;i<20;i++){
    const key=box([.12,.055,.62],[-1.18+i*.125,1.06,.02],i%7===1||i%7===4?0x252629:0xe5e2da,[0,0,0],.55,.0,g);
    key.castShadow=false;
  }
  box([.12,1.05,.12],[-1.1,.38,0],0x232528,[0,0,.08],.7,.0,g);
  box([.12,1.05,.12],[1.1,.38,0],0x232528,[0,0,-.08],.7,.0,g);
  g.position.set(x,0,z);roomGroup.add(g);
  return tag(g,{type:'TECLAS',title:label,description:'Pianos, eléctricos y sintetizadores organizados por intención musical. Convoca un tecladista o toca tú.',actions:['Studio Grand','Warm Rhodes','Glass Keys','Analog Pad']});
}
function createSynthRack(x,z){
  const g=new THREE.Group();
  box([2.4,2.25,.58],[0,1.14,0],0x15151a,[0,0,0],.42,.18,g);
  for(let row=0;row<4;row++){
    box([2.12,.37,.06],[0,.46+row*.48,.32],0x24202c,[0,0,0],.38,.25,g);
    for(let i=0;i<8;i++) cyl(.035,.035,.025,[-.78+i*.22,.46+row*.48,.37],row%2?0x8b65e8:0x6fd3cf,[Math.PI/2,0,0],10,g);
  }
  g.position.set(x,0,z);roomGroup.add(g);
  return tag(g,{type:'SYNTH RACK',title:'Deep Synth Library',description:'Arquitectura de sintetizadores clásicos y modernos con presets musicales y macros simples.',actions:['Poly Analog','Mono Lead','FM Glass','Ambient Motion']});
}
function createConsole(z=-3.3,master=false){
  const g=new THREE.Group();
  box([6.5,.65,2.05],[0,.8,0],master?0x33291c:0x1d2326,[.12,0,0],.42,.26,g);
  for(let i=0;i<14;i++){
    const x=-2.65+i*.41;
    box([.22,.02,1.2],[x,1.03,-.05],0x101214,[.12,0,0],.4,.05,g);
    cyl(.045,.045,.03,[x,1.16,-.35],i%3===0?0xc9974e:0x5d9fc3,[Math.PI/2,0,0],12,g);
    box([.09,.04,.22],[x,1.16,.35],0xd9d7d0,[.12,0,0],.4,.0,g);
  }
  box([2.3,.12,.9],[0,1.2,-1.0],0x0b0d0f,[0,0,0],.3,.1,g);
  g.position.set(0,0,z);roomGroup.add(g);
  return tag(g,{type:master?'MASTERING CONSOLE':'MEZCLA',title:master?'Mastering Desk':'Control Room Console',description:master?'Cadena final, medición, referencias y exportación con decisiones reversibles.':'Faders, buses, inserts y referencias viven aquí. La consola es una herramienta espacial, no un muro de parámetros.',actions:master?['Natural','Streaming','Dynamic','Power']:['Balance','Drum Bus','Vocal Focus','Reference A/B']});
}
function createDrumMachine(x,z){
  const g=new THREE.Group();
  box([1.9,.22,1.05],[0,.72,0],0x28232b,[-.25,0,0],.4,.12,g);
  for(let y=0;y<2;y++)for(let i=0;i<8;i++) box([.14,.035,.14],[-.64+i*.18,.84-y*.18,.27],(i+y)%3===0?0xd46655:0x8b65e8,[-.25,0,0],.5,.0,g);
  g.position.set(x,0,z);roomGroup.add(g);
  return tag(g,{type:'DRUM MACHINE',title:'Deep Rhythm Lab',description:'Secuencias, grooves, fills y variación humana para construir rápidamente una base.',actions:['Pocket Funk','Alt Pop','Broken Beat','Minimal Pulse']});
}
function createRack(x,z,label='Analog Rack'){
  const g=new THREE.Group();
  box([1.55,2.65,.7],[0,1.34,0],0x111315,[0,0,0],.5,.15,g);
  for(let r=0;r<5;r++){
    box([1.34,.4,.06],[0,.42+r*.48,.38],r%2?0x3a3027:0x20262a,[0,0,0],.45,.25,g);
    for(let i=0;i<4;i++) cyl(.055,.055,.03,[-.43+i*.28,.42+r*.48,.42],0xc49b5b,[Math.PI/2,0,0],12,g);
  }
  g.position.set(x,0,z);roomGroup.add(g);
  return tag(g,{type:'OUTBOARD',title:label,description:'Procesamiento analógico virtual con control simple al frente y detalle técnico disponible cuando lo necesitas.',actions:['Tone','Glue','Depth','Bypass']});
}
function createHuman(role,pos,color){
  const g=new THREE.Group();
  const skin=material(0xa77c64,.82,.0);
  const cloth=material(color,.78,.02);
  addMesh(new THREE.SphereGeometry(.18,18,12),skin,[0,1.75,0],[0,0,0],true,g);
  cyl(.24,.31,.72,[0,1.22,0],color,[0,0,0],18,g);
  cyl(.07,.08,.72,[-.18,.72,0],color,[0,0,.08],14,g);
  cyl(.07,.08,.72,[.18,.72,0],color,[0,0,-.08],14,g);
  g.position.set(...pos);g.visible=activePlayers.has(role);roomGroup.add(g);
  playerMeshes[role]=g;return g;
}
function buildRoom(name){
  clearRoom();
  const r=ROOMS[name];
  scene.background=new THREE.Color(r.fog);
  scene.fog=new THREE.FogExp2(r.fog,.045);
  accentLight.color.setHex(r.color);
  createShell(r.color);

  if(name==='practice'){
    createDrums(0,-3.2);createAmp(-4.7,-4.2,'Bass Stack',0x33281e);createAmp(4.7,-4.2,'Guitar Combo',0x2b2521);
    createGuitar(-5.5,-6.8,'Session Bass');createGuitar(5.4,-6.7,'Electric Guitar');createKeyboard(3.7,-7.4,'Practice Keys');
    createSpeaker(-2.8,-7.4,.78);createSpeaker(2.8,-7.4,.78);
    createHuman('drummer',[0,0,-3.8],0x3b4650);createHuman('bassist',[-3.8,0,-2.8],0x433b32);createHuman('guitarist',[3.8,0,-2.8],0x40373a);createHuman('keys',[3.7,0,-7.0],0x2e3843);
  }else if(name==='record'){
    createDrums(-2,-4.1);createMic(2.2,-2.8);createAmp(-5,-5.7,'Bass Recording Stack',0x2e2720);createAmp(4.8,-5.5,'Guitar Tracking Amp',0x35211f);
    const glass=box([3.4,2.9,.06],[2.3,1.55,-4.6],0x61727a);glass.material.transparent=true;glass.material.opacity=.22;
    createRack(5.6,-7,'Mic Pre / Comp');createGuitar(5.3,-7.4,'Tracking Guitar');
    createHuman('drummer',[-2,0,-4.7],0x3c4147);createHuman('bassist',[-4,0,-2.8],0x383d35);createHuman('guitarist',[4,0,-3.1],0x4b3634);createHuman('keys',[3.8,0,-7],0x353a48);
  }else if(name==='production'){
    createKeyboard(0,-3.1,'Studio Grand / Keys');createSynthRack(-4.6,-5.2);createSynthRack(4.6,-5.2);createDrumMachine(-3.5,-2.0);createRack(5.4,-7,'Texture / FX Rack');
    createSpeaker(-2.8,-7.4,.75);createSpeaker(2.8,-7.4,.75);
    createHuman('drummer',[-3.5,0,-2.5],0x4b3b4e);createHuman('bassist',[-5,0,-3],0x3c3643);createHuman('guitarist',[4.7,0,-3],0x463748);createHuman('keys',[0,0,-3.9],0x38364a);
  }else if(name==='mix'){
    createConsole(-2.7,false);createSpeaker(-3.55,-6.15,1.1);createSpeaker(3.55,-6.15,1.1);createRack(-5.6,-5.8,'Dynamics Rack');createRack(5.6,-5.8,'FX / Spatial Rack');
    const screen=box([2.4,1.25,.08],[0,2.35,-6.8],0x0b1115);screen.material.emissive.setHex(0x143748);screen.material.emissiveIntensity=.45;
  }else{
    createConsole(-2.8,true);createSpeaker(-3.6,-6.2,1.2);createSpeaker(3.6,-6.2,1.2);createRack(-5.55,-5.9,'Master EQ / Dynamics');createRack(5.55,-5.9,'Limiter / Metering');
    const panel=box([2.8,1.4,.08],[0,2.4,-6.9],0x17120d);panel.material.emissive.setHex(0x4b3218);panel.material.emissiveIntensity=.28;
  }

  resetCamera(name);
  updatePlayerVisuals();
}
function resetCamera(name){
  const r=ROOMS[name];
  camera.position.set(...r.camera);
  const dir=new THREE.Vector3(...r.look).sub(camera.position).normalize();
  yaw=Math.atan2(-dir.x,-dir.z);pitch=Math.asin(dir.y);
  applyCameraRotation();
}
function applyCameraRotation(){
  camera.rotation.order='YXZ';
  camera.rotation.y=yaw;
  camera.rotation.x=pitch;
}
function updatePlayerVisuals(){
  Object.entries(playerMeshes).forEach(([role,m])=>m.visible=activePlayers.has(role));
}

let ctx=null,mixBus=null,convolver=null,wetGain=null,masterGain=null,compressor=null;
let audioReady=false,isPlaying=false,isRecording=false,metronome=false,schedulerId=null,nextStepTime=0,step=0;
let transportStartedAt=0,transportElapsed=0;
const activePlayers=new Set();
let currentProgression='I–V–vi–IV';
let currentKey='C';
let roomSound='Studio Live';
let soundPreset={drummer:'Neo Soul Dry',bassist:'Round Finger',keys:'Warm Rhodes',guitarist:'Clean Chorus',synth:'Poly Analog'};

const progressions={
  'I–V–vi–IV':[0,7,9,5],
  'ii–V–I–vi':[2,7,0,9],
  'I–vi–IV–V':[0,9,5,7],
  'i–VII–VI–VII':[0,10,8,10],
  'I–IV–ii–V':[0,5,2,7],
  'vi–IV–I–V':[9,5,0,7]
};
const keyOffsets={C:0,'C#':1,D:2,Eb:3,E:4,F:5,'F#':6,G:7,Ab:8,A:9,Bb:10,B:11};

function ensureAudio(){
  if(!ctx){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    mixBus=ctx.createGain();convolver=ctx.createConvolver();wetGain=ctx.createGain();masterGain=ctx.createGain();compressor=ctx.createDynamicsCompressor();
    masterGain.gain.value=.72;wetGain.gain.value=.18;
    mixBus.connect(masterGain);mixBus.connect(convolver);convolver.connect(wetGain);wetGain.connect(masterGain);masterGain.connect(compressor);compressor.connect(ctx.destination);
    setRoomImpulse(roomSound);
  }
  if(ctx.state==='suspended')ctx.resume();
  audioReady=true;audioState.textContent='ON';showToast('Audio activado · usa audífonos para la experiencia espacial');
}
function setRoomImpulse(name){
  roomSound=name;
  if(!ctx||!convolver)return;
  const profiles={
    'Studio Dry':[.55,4.5,.06],
    'Studio Live':[1.25,3.0,.16],
    'Club Room':[1.8,2.2,.24],
    'Large Hall':[3.4,2.5,.34],
    'Arena':[5.2,2.0,.42]
  };
  const [seconds,decay,wet]=profiles[name]||profiles['Studio Live'];
  const rate=ctx.sampleRate,length=Math.floor(rate*seconds);
  const impulse=ctx.createBuffer(2,length,rate);
  for(let c=0;c<2;c++){
    const d=impulse.getChannelData(c);
    for(let i=0;i<length;i++){
      const t=i/length;
      d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*(i<rate*.012?1.3:1);
    }
  }
  convolver.buffer=impulse;wetGain.gain.setTargetAtTime(wet,ctx.currentTime,.03);
}
function freq(midi){return 440*Math.pow(2,(midi-69)/12)}
function voiceOsc(type,midi,time,dur,gain=.08,cutoff=2400){
  const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
  o.type=type;o.frequency.setValueAtTime(freq(midi),time);f.type='lowpass';f.frequency.value=cutoff;f.Q.value=.5;
  g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(gain,time+.012);g.gain.exponentialRampToValueAtTime(.0001,time+dur);
  o.connect(f);f.connect(g);g.connect(mixBus);o.start(time);o.stop(time+dur+.03);
}
function kick(time){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(150,time);o.frequency.exponentialRampToValueAtTime(48,time+.12);
  g.gain.setValueAtTime(.55,time);g.gain.exponentialRampToValueAtTime(.0001,time+.3);o.connect(g);g.connect(mixBus);o.start(time);o.stop(time+.32);
}
function noiseHit(time,dur=.18,gain=.18,highpass=1300){
  const len=Math.floor(ctx.sampleRate*dur),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=buf;f.type='highpass';f.frequency.value=highpass;
  g.gain.setValueAtTime(gain,time);g.gain.exponentialRampToValueAtTime(.0001,time+dur);s.connect(f);f.connect(g);g.connect(mixBus);s.start(time);
}
function drumStep(s,time){
  if([0,8].includes(s))kick(time);
  if([4,12].includes(s))noiseHit(time,.16,.2,950);
  if(s%2===0)noiseHit(time,.045,.045,5200);
  if(soundPreset.drummer==='Arena Rock'&&[0,6,8,14].includes(s))kick(time);
}
function currentChord(stepIndex){
  const p=progressions[currentProgression]||progressions['I–V–vi–IV'];
  const degree=p[Math.floor(stepIndex/4)%p.length],root=48+(keyOffsets[currentKey]||0)+degree;
  const minor=[2,4,9,11].includes(degree%12);
  return [root,root+(minor?3:4),root+7];
}
function bassStep(s,time){
  if(s%2!==0)return;
  const chord=currentChord(s),oct=s%4===0?0:12;
  voiceOsc('sawtooth',chord[0]-12+oct,time,.18,.07,soundPreset.bassist==='Round Finger'?520:900);
}
function keysStep(s,time){
  if(s%4!==0)return;
  const chord=currentChord(s);
  chord.forEach((n,i)=>voiceOsc(soundPreset.keys==='Warm Rhodes'?'triangle':'sine',n+12,time,.55,.035,1800+i*350));
}
function synthStep(s,time){
  if(s%2!==0)return;
  const chord=currentChord(s),note=chord[(s/2)%3|0]+24;
  voiceOsc('square',note,time,.12,.025,soundPreset.synth==='Poly Analog'?1400:2600);
}
function guitarStep(s,time){
  if(![0,3,6,8,11,14].includes(s))return;
  const chord=currentChord(s),note=chord[s%3]+12;
  const len=Math.floor(ctx.sampleRate*.12),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=freq(note);f.Q.value=14;
  g.gain.value=.08;src.connect(f);f.connect(g);g.connect(mixBus);src.start(time);
}
function clickTrack(time,strong){
  voiceOsc('sine',strong?1500:1100,time,.035,.035,5000);
}
function scheduleStep(s,time){
  if(activePlayers.has('drummer'))drumStep(s,time);
  if(activePlayers.has('bassist'))bassStep(s,time);
  if(activePlayers.has('keys'))keysStep(s,time);
  if(activePlayers.has('guitarist'))guitarStep(s,time);
  if(activePlayers.has('synth'))synthStep(s,time);
  if(metronome&&s%4===0)clickTrack(time,s===0);
}
function scheduler(){
  if(!ctx||!isPlaying)return;
  const bpm=Math.max(40,Math.min(240,Number(bpmInput.value)||120));
  const secondsPerStep=60/bpm/4;
  while(nextStepTime<ctx.currentTime+.12){
    scheduleStep(step,nextStepTime);
    nextStepTime+=secondsPerStep;step=(step+1)%16;
  }
}
function startTransport(){
  ensureAudio();
  if(isPlaying)return;
  isPlaying=true;nextStepTime=ctx.currentTime+.05;step=0;schedulerId=setInterval(scheduler,25);
  transportStartedAt=performance.now();transportState.textContent='PLAY';playButton.textContent='❚❚';
}
function pauseTransport(){
  if(!isPlaying)return;
  isPlaying=false;clearInterval(schedulerId);schedulerId=null;transportElapsed+=performance.now()-transportStartedAt;transportState.textContent='PAUSA';playButton.textContent='▶';
}
function stopTransport(){
  isPlaying=false;clearInterval(schedulerId);schedulerId=null;step=0;transportElapsed=0;clock.textContent='00:00.000';transportState.textContent='LISTO';playButton.textContent='▶';isRecording=false;recButton.classList.remove('active');
}
function togglePlayer(role){
  ensureAudio();
  activePlayers.has(role)?activePlayers.delete(role):activePlayers.add(role);
  updatePlayerVisuals();
  renderDrawer('musicians');
  if(activePlayers.size&&!isPlaying)startTransport();
}
function formatTime(ms){
  const m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000),x=Math.floor(ms%1000);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(x).padStart(3,'0')}`;
}
function showToast(message){
  toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),2200);
}

function setRoom(name){
  currentRoom=name;
  app.className='room-'+name;
  const r=ROOMS[name];
  roomEyebrow.textContent=r.eyebrow;roomHeading.textContent=r.heading;roomCopy.textContent=r.copy;
  document.querySelectorAll('.room-nav').forEach(b=>b.classList.toggle('active',b.dataset.room===name));
  buildRoom(name);closeContext();studioMap.classList.remove('open');
  showToast(r.eyebrow.replace(' · ',' — '));
}
function openContext(meta){
  contextType.textContent=meta.type;contextTitle.textContent=meta.title;contextDescription.textContent=meta.description;
  contextContent.innerHTML=(meta.actions||[]).map((a,i)=>`<div class="control-block"><small>PRESET ${String(i+1).padStart(2,'0')}</small><b>${a}</b><p>Escucha este carácter y conserva el control para modificarlo después.</p><button class="action-button" data-context-action="${a}">Cargar preset</button></div>`).join('');
  contextPanel.classList.add('open');
  contextContent.querySelectorAll('[data-context-action]').forEach(b=>b.onclick=()=>{ensureAudio();showToast(`${meta.title} · ${b.dataset.contextAction}`)});
}
function closeContext(){contextPanel.classList.remove('open')}
function renderDrawer(kind){
  drawer.classList.add('open');
  if(kind==='musicians'){
    drawerEyebrow.textContent='SESSION PLAYERS';drawerTitle.textContent='Convoca músicos de sesión';
    const people=[
      ['drummer','DR','Baterista','Pocket, dinámica y fills','Neo Soul · Rock · Pop'],
      ['bassist','BS','Bajista','Fundamento, ghost notes y feel','Finger · Pick · Synth'],
      ['guitarist','GT','Guitarrista','Ritmo, texturas y hooks','Clean · Crunch · Ambient'],
      ['keys','KY','Tecladista','Voicings, piano y eléctricos','Grand · Rhodes · Organ'],
      ['synth','SY','Synth Player','Movimiento, pads y secuencias','Analog · FM · Motion']
    ];
    drawerContent.innerHTML=`<div class="musician-grid">${people.map(p=>`<button class="musician-card ${activePlayers.has(p[0])?'active':''}" data-player="${p[0]}"><i class="status-dot"></i><span class="card-avatar">${p[1]}</span><small>${p[4]}</small><b>${p[2]}</b><p>${p[3]}</p></button>`).join('')}</div>`;
    drawerContent.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>togglePlayer(b.dataset.player));
  }else if(kind==='sounds'){
    drawerEyebrow.textContent='DEEP LIBRARY';drawerTitle.textContent='Instrumentos y sonidos';
    const sounds=[
      ['drummer','Neo Soul Dry','DRUMS','Seco, cercano, articulado'],['drummer','Arena Rock','DRUMS','Grande, abierto, agresivo'],
      ['bassist','Round Finger','BASS','Redondo y orgánico'],['bassist','Modern Pick','BASS','Ataque definido'],
      ['keys','Warm Rhodes','KEYS','Tibio, suave, ancho'],['keys','Studio Grand','PIANO','Natural y presente'],
      ['synth','Poly Analog','SYNTH','Polifónico vintage'],['synth','FM Glass','SYNTH','Brillante y cristalino'],
      ['guitarist','Clean Chorus','GUITAR','Limpio espacial'],['guitarist','British Crunch','GUITAR','Medios y carácter']
    ];
    drawerContent.innerHTML=`<div class="sound-grid">${sounds.map(s=>`<button class="sound-card ${soundPreset[s[0]]===s[1]?'active':''}" data-sound-role="${s[0]}" data-sound="${s[1]}"><small>${s[2]}</small><b>${s[1]}</b><p>${s[3]}</p></button>`).join('')}</div>`;
    drawerContent.querySelectorAll('[data-sound]').forEach(b=>b.onclick=()=>{soundPreset[b.dataset.soundRole]=b.dataset.sound;ensureAudio();renderDrawer('sounds');showToast(`${b.dataset.soundRole} · ${b.dataset.sound}`)});
  }else if(kind==='harmony'){
    drawerEyebrow.textContent='HARMONY LAB';drawerTitle.textContent='Acordes, progresiones y movimiento';
    drawerContent.innerHTML=`<div class="drawer-toolbar"><select id="keySelect">${Object.keys(keyOffsets).map(k=>`<option ${k===currentKey?'selected':''}>${k}</option>`).join('')}</select><span>La banda sigue esta armonía en tiempo real</span></div><div class="harmony-grid">${Object.keys(progressions).map((p,i)=>`<button class="progression-card ${p===currentProgression?'active':''}" data-progression="${p}"><small>PROGRESIÓN ${String(i+1).padStart(2,'0')}</small><b>${p}</b><p>${['Pop / Anthem','Jazz / Soul','Classic / Ballad','Minor / Cinematic','Turnaround','Emotional Pop'][i]}</p></button>`).join('')}</div>`;
    drawerContent.querySelector('#keySelect').onchange=e=>{currentKey=e.target.value;showToast(`Tonalidad · ${currentKey}`)};
    drawerContent.querySelectorAll('[data-progression]').forEach(b=>b.onclick=()=>{currentProgression=b.dataset.progression;ensureAudio();renderDrawer('harmony');showToast(`Harmony · ${currentKey} · ${currentProgression}`)});
  }else{
    drawerEyebrow.textContent='ACOUSTIC TWIN';drawerTitle.textContent='Cambia la sala que estás escuchando';
    const rs=[['Studio Dry','Controlado y directo'],['Studio Live','Reflexiones naturales'],['Club Room','Cercano y energético'],['Large Hall','Profundo y expansivo'],['Arena','Sensación de directo masivo']];
    drawerContent.innerHTML=`<div class="room-grid">${rs.map((r,i)=>`<button class="room-card ${r[0]===roomSound?'active':''}" data-room-sound="${r[0]}"><small>ROOM ${String(i+1).padStart(2,'0')}</small><b>${r[0]}</b><p>${r[1]}</p></button>`).join('')}</div>`;
    drawerContent.querySelectorAll('[data-room-sound]').forEach(b=>b.onclick=()=>{ensureAudio();setRoomImpulse(b.dataset.roomSound);renderDrawer('roomsound');showToast(`Room · ${roomSound}`)});
  }
}

document.querySelectorAll('.room-nav').forEach(b=>b.onclick=()=>setRoom(b.dataset.room));
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>renderDrawer(b.dataset.panel));
document.querySelector('#closeDrawer').onclick=()=>drawer.classList.remove('open');
document.querySelector('#closeContext').onclick=closeContext;
document.querySelector('#studioMapButton').onclick=()=>studioMap.classList.add('open');
document.querySelector('#closeMap').onclick=()=>studioMap.classList.remove('open');
document.querySelectorAll('[data-map-room]').forEach(b=>b.onclick=()=>setRoom(b.dataset.mapRoom));
document.querySelector('#audioButton').onclick=ensureAudio;
document.querySelector('#addTrack').onclick=()=>{renderDrawer('sounds');showToast('Selecciona un instrumento para la nueva pista')};
playButton.onclick=()=>isPlaying?pauseTransport():startTransport();
stopButton.onclick=stopTransport;
recButton.onclick=()=>{ensureAudio();isRecording=!isRecording;recButton.classList.toggle('active',isRecording);transportState.textContent=isRecording?'GRABANDO':'LISTO';if(isRecording&&!isPlaying)startTransport();showToast(isRecording?'Preview REC activa · el ejecutable graba WAV 24-bit':'Toma preview finalizada')};
metroButton.onclick=()=>{metronome=!metronome;metroButton.classList.toggle('active',metronome)};
bpmInput.onchange=()=>{bpmInput.value=Math.max(40,Math.min(240,Number(bpmInput.value)||120))};

canvas.addEventListener('pointerdown',e=>{dragging=true;pointerMoved=false;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointerup',e=>{dragging=false;canvas.releasePointerCapture(e.pointerId);if(!pointerMoved)pickObject(e)});
canvas.addEventListener('pointermove',e=>{
  if(dragging){
    const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;
    if(Math.abs(dx)+Math.abs(dy)>2)pointerMoved=true;
    yaw-=dx*.0032;pitch-=dy*.0025;pitch=Math.max(-.55,Math.min(.38,pitch));applyCameraRotation();lastPointer={x:e.clientX,y:e.clientY};
  }else hoverObject(e);
});
canvas.addEventListener('wheel',e=>{
  camera.position.z=Math.max(2.8,Math.min(9.5,camera.position.z+e.deltaY*.004));
},{passive:true});
window.addEventListener('keydown',e=>{if(!['INPUT','SELECT'].includes(document.activeElement.tagName))keys.add(e.key.toLowerCase())});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

function rayFromEvent(e){
  const r=canvas.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(mouse,camera);
  return raycaster.intersectObjects(clickable,false)[0];
}
function pickObject(e){
  const hit=rayFromEvent(e);if(hit?.object?.userData?.hotspot)openContext(hit.object.userData.hotspot);else closeContext();
}
function hoverObject(e){
  const hit=rayFromEvent(e),obj=hit?.object||null;
  if(hovered&&hovered.material?.emissive)hovered.material.emissiveIntensity=.12;
  hovered=obj;
  if(obj?.userData?.hotspot){
    if(obj.material?.emissive)obj.material.emissiveIntensity=.5;
    const m=obj.userData.hotspot;hotspotLabel.innerHTML=`<small>${m.type}</small>${m.title}`;hotspotLabel.style.left=e.clientX+'px';hotspotLabel.style.top=(e.clientY-10)+'px';hotspotLabel.classList.add('visible');canvas.style.cursor='pointer';
  }else{hotspotLabel.classList.remove('visible');canvas.style.cursor=dragging?'grabbing':'grab'}
}

function updateMovement(dt){
  const speed=dt*2.35;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  if(keys.has('w'))camera.position.addScaledVector(forward,speed);
  if(keys.has('s'))camera.position.addScaledVector(forward,-speed);
  if(keys.has('a'))camera.position.addScaledVector(right,-speed);
  if(keys.has('d'))camera.position.addScaledVector(right,speed);
  camera.position.x=Math.max(-5.8,Math.min(5.8,camera.position.x));
  camera.position.z=Math.max(-3.2,Math.min(9.3,camera.position.z));
  camera.position.y=1.62;
}
function resize(){
  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();

let last=performance.now();
function animate(now){
  const dt=Math.min(.035,(now-last)/1000);last=now;updateMovement(dt);
  renderer.render(scene,camera);
  const ms=transportElapsed+(isPlaying?performance.now()-transportStartedAt:0);
  if(isPlaying||transportElapsed)clock.textContent=formatTime(ms);
  const energy=isPlaying?18+Math.sin(now*.013)*9+activePlayers.size*11+Math.random()*13:8+Math.random()*5;
  masterMeter.style.height=Math.min(96,energy)+'%';
  requestAnimationFrame(animate);
}
buildRoom('practice');requestAnimationFrame(animate);
setTimeout(()=>document.querySelector('#movementHint').style.opacity='.35',5500);
