export const ROOM_DESIGNS = Object.freeze({
  practice: {
    assetId: 'practice_room_001', accent: '#1688ff', warm: '#e49456',
    hitboxes: [
      { id: 'drum_kit', type: 'ESTACIÓN RÍTMICA', title: 'Batería de sesión', description: 'Kit, groove, dinámica y relación con la sala.', actions: ['Pocket', 'Abierto', 'Half-time', 'Room'], position: [0, .88, -2.9], size: [2.45, 1.9, 2], focus: { position: [0, 1.85, .55], target: [0, .9, -2.9] } },
      { id: 'bass_stack', type: 'AMPLIFICADOR DE BAJO', title: 'Deep Bass Stack', description: 'Carácter, gabinete y presencia para el bajista de sesión.', actions: ['Redondo', 'Moderno', 'Drive', 'Directo'], position: [-3.25, .82, -4.35], size: [1.5, 1.7, .78], focus: { position: [-1.5, 1.55, -1.5], target: [-3.25, .85, -4.35] } },
      { id: 'guitar_combo', type: 'AMPLIFICADOR DE GUITARRA', title: 'Deep Guitar Combo', description: 'Respuesta limpia, crunch y texturas ambientales.', actions: ['Limpio', 'Crunch', 'Ambient', 'Bypass'], position: [3.3, .8, -4.25], size: [1.5, 1.7, .78], focus: { position: [1.5, 1.55, -1.5], target: [3.3, .85, -4.25] } },
      { id: 'practice_keys', type: 'TECLAS', title: 'Practice Keys', description: 'Piano, eléctricos y órgano preparados para tocar.', actions: ['Grand', 'Rhodes', 'Órgano', 'Layer'], position: [2.35, 1.05, -5.25], size: [2.5, .75, .85], focus: { position: [.9, 1.65, -2.2], target: [2.35, 1, -5.25] } }
    ]
  },
  record: {
    assetId: 'recording_room_001', accent: '#1688ff', warm: '#e9a05b',
    hitboxes: [
      { id: 'vocal_mic', type: 'CADENA DE CAPTURA', title: 'Captura vocal', description: 'Micrófono, previo y dinámica de entrada sin perder la sala.', actions: ['Íntimo', 'Abierto', 'Aire', 'Oscuro'], position: [2.5, 1.55, -2.1], size: [.9, 2, .9], focus: { position: [1.15, 1.7, .35], target: [2.5, 1.55, -2.1] } },
      { id: 'vocal_booth', type: 'ESPACIO DE AISLACIÓN', title: 'Cabina vocal', description: 'Perspectiva, absorción y distancia de captura.', actions: ['Seco', 'Natural', 'Amplio', 'Talkback'], position: [2.55, 1.55, -2.55], size: [3, 3.15, 3.2], focus: { position: [-.2, 1.9, .5], target: [2.5, 1.45, -2.55] } },
      { id: 'recording_front_end', type: 'RACK DE GRABACIÓN', title: 'Front end de grabación', description: 'Previos, filtros y control de entrada para una toma segura.', actions: ['Voz', 'Batería', 'Guitarra', 'Línea'], position: [3.72, 1.12, -4.75], size: [1.4, 2.3, .82], focus: { position: [1.55, 1.65, -1.9], target: [3.72, 1.12, -4.75] } },
      { id: 'recording_drums', type: 'KIT EN VIVO', title: 'Batería de tracking', description: 'Kit y perspectiva de room para capturar una interpretación completa.', actions: ['Tight', 'Live', 'Paralelo', 'Room'], position: [-1.65, .9, -3.2], size: [2.5, 1.9, 2.1], focus: { position: [-.3, 1.8, .35], target: [-1.65, .9, -3.2] } }
    ]
  },
  production: {
    assetId: 'production_room_001', accent: '#1688ff', warm: '#bd70dc',
    hitboxes: [
      { id: 'studio_keyboard', type: 'TECLAS DE INTERPRETACIÓN', title: 'Teclado de estudio', description: 'Piano, síntesis y capas desde la posición central.', actions: ['Grand', 'Eléctrico', 'Analógico', 'Layer'], position: [0, 1.05, -1.18], size: [3.7, .55, .9], focus: { position: [0, 2, 1.25], target: [0, 1, -1.18] } },
      { id: 'synth_rack_left', type: 'SINTETIZADOR MODULAR', title: 'Voz modular A', description: 'Osciladores, filtros, modulación y patching táctil.', actions: ['Pad cálido', 'Secuencia', 'Bajo', 'Init'], position: [-3.22, 1.32, -3.65], size: [1.7, 2.7, .9], focus: { position: [-1.25, 1.8, -.9], target: [-3.22, 1.3, -3.65] } },
      { id: 'synth_rack_right', type: 'SINTETIZADOR MODULAR', title: 'Voz modular B', description: 'Texturas, movimiento y capas complementarias.', actions: ['Movimiento', 'Textura', 'Lead', 'Init'], position: [3.22, 1.32, -3.65], size: [1.7, 2.7, .9], focus: { position: [1.25, 1.8, -.9], target: [3.22, 1.3, -3.65] } },
      { id: 'pad_controller', type: 'CONTROLADOR RÍTMICO', title: 'Pads de ritmo', description: 'Disparo de patrones, percusión y variaciones de groove.', actions: ['Batería', 'Percusión', 'Chops', 'Escena'], position: [-1.85, 1.18, -1], size: [1.2, .45, .8], focus: { position: [-.8, 1.8, .8], target: [-1.85, 1.15, -1] } }
    ]
  },
  mix: {
    assetId: 'mix_room_001', accent: '#1688ff', warm: '#d69a55',
    hitboxes: [
      { id: 'mix_console', type: 'CONSOLA DE MEZCLA', title: 'Consola espacial', description: 'Balance, panorama, profundidad, buses y automatización.', actions: ['Balance', 'Profundidad', 'Glue', 'Automatización'], position: [0, 1.05, -1.15], size: [6.45, 1.35, 1.8], focus: { position: [0, 2.25, 1], target: [0, 1.05, -1.75] } },
      { id: 'mix_monitor_left', type: 'MONITOR DE REFERENCIA', title: 'Monitor de mezcla · L', description: 'Referencia principal, mono y escucha a bajo nivel.', actions: ['Referencia A', 'Referencia B', 'Mono', 'Bajo nivel'], position: [-2.45, 1.48, -5.15], size: [1.15, 1.55, .82], focus: { position: [-1, 1.75, -2.2], target: [-2.45, 1.48, -5.15] } },
      { id: 'mix_monitor_right', type: 'MONITOR DE REFERENCIA', title: 'Monitor de mezcla · R', description: 'Referencia principal, mono y escucha a bajo nivel.', actions: ['Referencia A', 'Referencia B', 'Mono', 'Bajo nivel'], position: [2.45, 1.48, -5.15], size: [1.15, 1.55, .82], focus: { position: [1, 1.75, -2.2], target: [2.45, 1.48, -5.15] } },
      { id: 'mix_dynamics_rack', type: 'DINÁMICA DE MEZCLA', title: 'Rack de dinámica', description: 'Compresión, control de transitorios y color de bus.', actions: ['Transparente', 'Punch', 'Glue', 'Bypass'], position: [-3.65, 1.12, -3.85], size: [1.45, 2.3, .88], focus: { position: [-1.5, 1.65, -1.3], target: [-3.65, 1.12, -3.85] } },
      { id: 'mix_spatial_fx_rack', type: 'EFECTOS ESPACIALES', title: 'Rack de profundidad', description: 'Ambientes, delays y perspectiva estéreo.', actions: ['Studio', 'Plate', 'Chamber', 'Echo'], position: [3.65, 1.12, -3.85], size: [1.45, 2.3, .88], focus: { position: [1.5, 1.65, -1.3], target: [3.65, 1.12, -3.85] } }
    ]
  },
  master: {
    assetId: 'mastering_room_001', accent: '#1688ff', warm: '#d69a55',
    hitboxes: [
      { id: 'master_chain', panel: 'mastering', type: 'CADENA DE MASTERING', title: 'Control final', description: 'Tono, dinámica, imagen estéreo, loudness y entrega con cambios reversibles.', actions: ['Natural', 'Streaming', 'Dinámico', 'Potente'], focus: { position: [0, 2.1, 2.25], target: [0, 1.18, -4.2] } }
    ]
  }
});
