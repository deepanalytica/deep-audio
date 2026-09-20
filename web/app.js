import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const rooms={
 practice:{kicker:'SALA 01 · ENSAYO',title:'Toca antes de configurar.',description:'Entra, conecta el instrumento y empieza. La ingeniería aparece sólo cuando la necesitas.',session:'Ensayo rápido',art:'./assets/practice.svg',items:[['BACKING','Canción','Importa y toca encima'],['LOOP A/B','Pasaje','Repite sólo lo difícil'],['ROOM','Live Room','Cambia la sensación del espacio']],engineer:['Todo listo para tocar.','No veo clipping. Puedes empezar y ajustar después.']},
 record:{kicker:'SALA 02 · GRABACIÓN',title:'Captura la interpretación.',description:'Instrumentos, amplificadores y tomas viven en una sala diseñada alrededor del momento de grabar.',session:'Tracking room',art:'./assets/record.svg',items:[['INPUT 1','Bajo','Studio Bass'],['AMP','Vintage Stack','Respuesta cálida'],['TAKES','Take 01','Grabación seca + monitor FX']],engineer:['Nivel de entrada saludable.','Tienes margen suficiente para una toma dinámica.']},
 production:{kicker:'SALA 03 · PRODUCCIÓN',title:'Construye el mundo sonoro.',description:'Explora instrumentos y máquinas como objetos del estudio, no como una lista interminable de plugins.',session:'Production room',art:'./assets/production.svg',items:[['DRUMS','Studio Kit','Acoustic / tight'],['SYNTH','Poly Classic','Warm analog'],['GUITAR','Clean 65','Amp + cab']],engineer:['El arreglo tiene espacio.','Prueba un elemento por función antes de sumar otra capa.']},
 mix:{kicker:'SALA 04 · MEZCLA',title:'Escucha relaciones, no parámetros.',description:'Consola, buses y análisis se organizan para decidir qué necesita cada elemento dentro del conjunto.',session:'Control room',art:'./assets/mix.svg',items:[['BUS A','Rhythm','−3.2 dB'],['BASS','Low end','Mono anchor'],['REFERENCE','A/B','Gain matched']],engineer:['Bajo y kick están estables.','La recomendación siempre se puede escuchar, comparar y revertir.']},
 master:{kicker:'SALA 05 · MASTER',title:'Termina con perspectiva.',description:'Un espacio final dedicado a balance, dinámica, loudness y exportación sin perder de vista la música.',session:'Mastering room',art:'./assets/master.svg',items:[['LOUDNESS','−11.8 LUFS','Integrated'],['TRUE PEAK','−1.1 dBTP','Safe headroom'],['REFERENCE','A/B','Loudness matched']],engineer:['La mezcla conserva dinámica.','Compara al mismo volumen antes de decidir si necesitas más loudness.']}
};

const app=document.querySelector('#app'), art=document.querySelector('#room-art');
const title=document.querySelector('#title'), kicker=document.querySelector('#kicker'), desc=document.querySelector('#description');
const session=document.querySelector('#session-title'), grid=document.querySelector('#object-grid');
const engTitle=document.querySelector('#engineer-title'), engCopy=document.querySelector('#engineer-copy');
const soundName=document.querySelector('#sound-name'), meter=document.querySelector('#meter'), db=document.querySelector('#db');
const bpm=document.querySelector('#bpm'), bpmOut=document.querySelector('#bpm-out'), bpmBottom=document.querySelector('#bpm-bottom');
const clock=document.querySelector('#clock'), state=document.querySelector('#state'), play=document.querySelector('#play'), stop=document.querySelector('#stop'), rec=document.querySelector('#rec');
let current='practice',playing=false,recording=false,start=0,elapsed=0;

function setRoom(name){
 current=name; const r=rooms[name];
 app.className='room-'+name; app.dataset.room=name;
 art.style.backgroundImage=`url("${r.art}")`;
 kicker.textContent=r.kicker;title.textContent=r.title;desc.textContent=r.description;session.textContent=r.session;
 engTitle.textContent=r.engineer[0];engCopy.textContent=r.engineer[1];
 grid.innerHTML=r.items.map(x=>`<button class="object"><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]}</span></button>`).join('');
 document.querySelectorAll('.room').forEach(b=>b.classList.toggle('active',b.dataset.room===name));
}
document.querySelectorAll('.room').forEach(b=>b.onclick=()=>setRoom(b.dataset.room));
document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>{document.querySelectorAll('.preset').forEach(x=>x.classList.remove('active'));b.classList.add('active');soundName.textContent=b.dataset.sound});
document.querySelectorAll('.toggle').forEach(b=>b.onclick=()=>b.classList.toggle('on'));
bpm.oninput=()=>{bpmOut.value=bpm.value+' BPM';bpmBottom.textContent=bpm.value+' BPM'};

function fmt(ms){const m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000),x=Math.floor(ms%1000);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
function tick(t){const v=18+Math.abs(Math.sin(t*.004))*55+Math.random()*12;meter.style.height=Math.min(93,v)+'%';db.textContent='−'+(7+Math.random()*19).toFixed(1)+' dB';if(playing||recording){const ms=elapsed+(performance.now()-start);clock.textContent=fmt(ms)}requestAnimationFrame(t)}
play.onclick=()=>{playing=!playing;if(playing){start=performance.now();state.textContent='PLAY';play.textContent='❚❚'}else{elapsed+=performance.now()-start;state.textContent='PAUSA';play.textContent='▶'}};
stop.onclick=()=>{playing=false;recording=false;elapsed=0;clock.textContent='00:00.000';state.textContent='LISTO';play.textContent='▶';rec.classList.remove('recording')};
rec.onclick=()=>{recording=!recording;if(recording){start=performance.now();elapsed=0;state.textContent='GRABANDO';rec.classList.add('recording')}else{elapsed+=performance.now()-start;state.textContent='TAKE GUARDADO';rec.classList.remove('recording')}};
const wf=document.querySelector('#waveform');wf.innerHTML=Array.from({length:80},(_,i)=>`<i style="height:${7+(Math.sin(i*.63)+1)*9+Math.random()*9}px"></i>`).join('');

const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#three'),alpha:true,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,100);camera.position.z=7;
const group=new THREE.Group();scene.add(group);
const geo=new THREE.BufferGeometry(),count=180,positions=new Float32Array(count*3);
for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*15;positions[i*3+1]=(Math.random()-.5)*9;positions[i*3+2]=(Math.random()-.5)*6}
geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
const points=new THREE.Points(geo,new THREE.PointsMaterial({color:0xd6b178,size:.018,transparent:true,opacity:.5}));group.add(points);
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();
function render(t){group.rotation.y=t*.000015;group.rotation.x=Math.sin(t*.0001)*.035;renderer.render(scene,camera);requestAnimationFrame(render)}requestAnimationFrame(render);requestAnimationFrame(tick);setRoom('practice');