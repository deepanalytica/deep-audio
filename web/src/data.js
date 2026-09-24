export const ROOMS = {
  practice: {
    number:'01', label:'Ensayo', action:'Toca',
    eyebrow:'SALA 01 · ENSAYO',
    title:'Entra. Escucha. Toca.',
    copy:'Un espacio vivo para tocar antes de configurar. La banda, los amplificadores y el room responden a tus decisiones.',
    accent:'#1888ff', bg:'#070b10',
    camera:{position:[0,2.38,3.86], target:[0,1.24,-2.72]}
  },
  record: {
    number:'02', label:'Grabación', action:'Captura',
    eyebrow:'SALA 02 · GRABACIÓN',
    title:'Captura la interpretación.',
    copy:'Tracking room, cabina, amplificadores y cadena de señal. La tecnología desaparece detrás de la toma.',
    accent:'#1888ff', bg:'#080b11',
    camera:{position:[0,2.38,4.05], target:[0,1.24,-2.72]}
  },
  production: {
    number:'03', label:'Producción', action:'Construye',
    eyebrow:'SALA 03 · PRODUCCIÓN',
    title:'Construye un mundo sonoro.',
    copy:'Pianos, sintetizadores, ritmo, armonía y arreglos viven dentro de una sala diseñada para explorar.',
    accent:'#9b78c7', bg:'#08090d',
    camera:{position:[0,2.28,3.86], target:[0,1.18,-2.72]}
  },
  mix: {
    number:'04', label:'Mezcla', action:'Equilibra',
    eyebrow:'SALA 04 · MEZCLA',
    title:'Siéntate frente a la música.',
    copy:'Control room espacial con consola, monitores, buses, referencias y decisiones auditables.',
    accent:'#1888ff', bg:'#061019',
    camera:{position:[0,2.38,4.08], target:[0,1.24,-2.72]}
  },
  master: {
    number:'05', label:'Master', action:'Termina',
    eyebrow:'SALA 05 · MASTER',
    title:'Decide con perspectiva.',
    copy:'Una suite silenciosa y precisa para balance, dinámica, loudness, referencia y entrega final.',
    accent:'#1888ff', bg:'#070b11',
    camera:{position:[0,2.1,2.25], target:[0,1.18,-4.2]}
  }
};

export const PERSPECTIVES = {
  practice:[
    {id:'overview',label:'Sala',hint:'Vista completa',camera:{position:[0,2.38,3.86],target:[0,1.24,-2.72]}},
    {id:'perform',label:'Interpretación',hint:'Frente a la banda',camera:{position:[0,1.72,1.05],target:[0,1.05,-3.35]}},
    {id:'equipment',label:'Equipo',hint:'Amplis y teclas',camera:{position:[-1.7,1.78,.25],target:[2.6,1.05,-4.65]}}
  ],
  record:[
    {id:'overview',label:'Sala',hint:'Tracking completo',camera:{position:[0,2.38,4.05],target:[0,1.24,-2.72]}},
    {id:'perform',label:'Captura',hint:'Punto de toma',camera:{position:[.15,1.72,.7],target:[2.2,1.35,-2.45]}},
    {id:'equipment',label:'Cadena',hint:'Previos y rack',camera:{position:[1.2,1.72,-.2],target:[3.65,1.2,-4.65]}}
  ],
  production:[
    {id:'overview',label:'Sala',hint:'Lienzo completo',camera:{position:[0,2.28,3.86],target:[0,1.18,-2.72]}},
    {id:'perform',label:'Teclado',hint:'Centro creativo',camera:{position:[0,1.68,1.15],target:[0,1,-1.35]}},
    {id:'equipment',label:'Sintetizadores',hint:'Racks laterales',camera:{position:[-1.6,1.72,.15],target:[-3.1,1.3,-3.55]}}
  ],
  mix:[
    {id:'overview',label:'Sala',hint:'Control room',camera:{position:[0,2.38,4.08],target:[0,1.24,-2.72]}},
    {id:'perform',label:'Consola',hint:'Posición de mezcla',camera:{position:[0,1.72,1.15],target:[0,.98,-1.45]}},
    {id:'equipment',label:'Racks',hint:'Dinámica y espacio',camera:{position:[-1.8,1.78,.2],target:[-3.45,1.15,-3.75]}}
  ],
  master:[
    {id:'overview',label:'Sala',hint:'Suite completa',camera:{position:[0,2.1,2.25],target:[0,1.18,-4.2]}},
    {id:'perform',label:'Escucha',hint:'Sweet spot',camera:{position:[0,1.62,.75],target:[0,1.22,-4.65]}},
    {id:'equipment',label:'Cadena',hint:'Control final',camera:{position:[1.65,1.72,.15],target:[0,1.2,-4.2]}}
  ]
};

export const MUSICIANS = [
  {id:'drummer', initials:'DR', name:'Baterista', subtitle:'Pocket · dinámica · fills', style:'Neo Soul / Rock / Pop'},
  {id:'bassist', initials:'BS', name:'Bajista', subtitle:'Fundamento · ghost notes · feel', style:'Finger / Pick / Synth'},
  {id:'guitarist', initials:'GT', name:'Guitarrista', subtitle:'Ritmo · texturas · hooks', style:'Clean / Crunch / Ambient'},
  {id:'keys', initials:'KY', name:'Tecladista', subtitle:'Voicings · piano · eléctricos', style:'Grand / Rhodes / Organ'},
  {id:'synth', initials:'SY', name:'Synth Player', subtitle:'Pads · secuencias · movimiento', style:'Analog / FM / Motion'}
];

export const SOUNDS = [
  {role:'drummer', group:'DRUMS', name:'Neo Soul Dry', desc:'Seco, cercano y articulado'},
  {role:'drummer', group:'DRUMS', name:'Arena Rock', desc:'Grande, abierto y agresivo'},
  {role:'bassist', group:'BASS', name:'Round Finger', desc:'Redondo, orgánico y profundo'},
  {role:'bassist', group:'BASS', name:'Modern Pick', desc:'Ataque definido y presente'},
  {role:'keys', group:'KEYS', name:'Warm Rhodes', desc:'Tibio, suave y ancho'},
  {role:'keys', group:'PIANO', name:'Studio Grand', desc:'Natural y presente'},
  {role:'synth', group:'SYNTH', name:'Poly Analog', desc:'Polifónico vintage'},
  {role:'synth', group:'SYNTH', name:'FM Glass', desc:'Brillante y cristalino'},
  {role:'guitarist', group:'GUITAR', name:'Clean Chorus', desc:'Limpio, espacial y musical'},
  {role:'guitarist', group:'GUITAR', name:'British Crunch', desc:'Medios, ataque y carácter'}
];

export const PROGRESSIONS = {
  'I–V–vi–IV':[0,7,9,5],
  'ii–V–I–vi':[2,7,0,9],
  'I–vi–IV–V':[0,9,5,7],
  'i–VII–VI–VII':[0,10,8,10],
  'I–IV–ii–V':[0,5,2,7],
  'vi–IV–I–V':[9,5,0,7]
};

export const KEYS = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

export const ROOM_SOUNDS = [
  {name:'Studio Dry', desc:'Controlado y directo', decay:.55, wet:.05},
  {name:'Studio Live', desc:'Reflexiones naturales', decay:1.25, wet:.16},
  {name:'Club Room', desc:'Cercano y energético', decay:1.8, wet:.24},
  {name:'Large Hall', desc:'Profundo y expansivo', decay:3.4, wet:.34},
  {name:'Arena', desc:'Sensación de directo masivo', decay:5.2, wet:.42}
];
