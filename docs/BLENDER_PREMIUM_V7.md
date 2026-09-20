# Blender Premium V7

All five Deep Music Producer rooms now use generated Blender source assets as the visual source of truth.

## Build

Blender: 5.2.2 LTS

The CI build regenerates and validates:

| Room | Meshes after GLB import | Triangles | Materials | GLB |
| --- | ---: | ---: | ---: | --- |
| Practice | 546 | 146,516 | 12 | models/practice/room/practice_room_001.glb |
| Recording | 302 | 87,924 | 13 | models/recording/room/recording_room_001.glb |
| Production | 509 | 123,668 | 12 | models/production/room/production_room_001.glb |
| Mix | 932 | 234,860 | 13 | models/mix/room/mix_room_001.glb |
| Mastering | 704 | 148,880 | 17 | models/mastering/room/mastering_room_001.glb |

All validated room sources use real metre scale and the generated GLBs passed the Blender import validation scripts.

## V7 visual standard

### Practice
- complete drum hardware pass: hi-hat, pedals, throne, rims and lugs;
- bass/guitar hardware including pickups, bridges, strings, tuners and controls;
- detailed amplifier surfaces;
- corrected premium keyboard;
- rehearsal microphones and pedalboard;
- stronger acoustic treatment and band lighting.

### Recording
- complete drum hardware;
- vocal mic, shock mount, pop filter and cable;
- overhead and room microphone positions;
- recording front-end hardware, display and patchbay;
- booth architecture and practical light;
- tracking amplifier detail.

### Production
- corrected keyboard proportions and black-key grouping;
- synth towers with patch fields, rack hardware and macro faders;
- groovebox and beat controls;
- monitor stands;
- session display;
- product-light separation for left/right synthesis zones.

### Mix
- dense console control layer with meaningful knob/fader hierarchy;
- fader scales and bus display;
- main + nearfield monitoring;
- rack handles, screws and faceplate hierarchy;
- metering and display hardware;
- symmetric control-room lighting.

### Mastering
- console tick marks and fader scales;
- monitor dust caps, waveguide detail and plinths;
- rack handles, separators and fine fasteners;
- meter bridge reference marks;
- timber architectural fins and cove lighting;
- desk grommets and foot rail;
- macro control and meter cameras.

## Runtime rule

The Blender GLBs are the single high-fidelity room representation. Runtime jewelry overlays are not mounted on top of these rooms.

React Three Fiber owns:
- navigation;
- hit targets;
- camera behavior;
- state;
- audio;
- contextual HUD.

Blender owns:
- physical form;
- proportion;
- hardware detail;
- materials;
- architecture;
- visual hierarchy.

This prevents duplicate geometry, reduces visual conflicts and improves runtime performance.
