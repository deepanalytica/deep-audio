# Immersive Rooms 001

## Purpose

The first complete visual set extends the quality language established by `MASTERING_ROOM_001` across the entire studio. The rooms share material discipline, semantic interaction and camera behaviour, but each one communicates a different musical intention.

## Visual system

| Room | Visual thesis | Hero objects | GLB budget |
| --- | --- | --- | ---: |
| Practice | Warm maple, durable acoustic treatment and contained live energy | Session drums, bass stack, guitar combo, guitars and keys | 57,084 triangles / 11 materials |
| Recording | Honey oak, framed studio glass and a focused capture path | Vocal booth, original microphone, live kit, tracking amp and recording front end | 41,752 triangles / 12 materials |
| Production | Smoked ash, graphite hardware and restrained indigo/teal instrument light | Performance keyboard, twin modular systems, rhythm pads and texture rack | 69,372 triangles / 11 materials |
| Mix | Walnut, graphite console surfaces and cool metering against warm practical light | Deep-format console, main monitors, dynamics/spatial racks and meter bridge | 77,500 triangles / 12 materials |
| Mastering | Dark walnut, anodized metal and restrained brass in a silent reference suite | Reference console, monitors, racks, meter bridge and listening chair | 99,184 triangles / 17 materials |

All geometry is original Deep Music Producer work. No third-party models or texture licences are involved.

## Interaction thesis

The studio remains the interface in every room:

1. hero objects expose invisible semantic hit volumes owned by React;
2. hover and selection add a local light and restrained floor marker;
3. selection moves the existing camera rig to a room-specific focus pose;
4. the compact contextual HUD exposes musical starting points;
5. closing the HUD returns to the room camera without replacing the scene.

Session players remain React overlays so changing a visual GLB never changes musician state or Web Audio behaviour. The GLBs carry appearance and semantic names; they do not contain product logic.

## Sources and exports

- Practice: `assets/blender/practice/practice_room_001.blend` → `web/public/models/practice/room/practice_room_001.glb`
- Recording: `assets/blender/recording/recording_room_001.blend` → `web/public/models/recording/room/recording_room_001.glb`
- Production: `assets/blender/production/production_room_001.blend` → `web/public/models/production/room/production_room_001.glb`
- Mix: `assets/blender/mix/mix_room_001.blend` → `web/public/models/mix/room/mix_room_001.glb`
- Mastering: `assets/blender/mastering/mastering_room_001.blend` → `web/public/models/mastering/room/mastering_room_001.glb`

`assets/blender/rooms/build_studio_rooms.py` reproduces the four derived rooms. `validate_studio_rooms.py` reimports every GLB, checks required semantic hero nodes and reports measured geometry.

## Boundaries

The visual rooms do not claim measured acoustics. IR selection, HRTF, distance, early reflections, convolution and professional DSP remain in the acoustic/native layers described by the architecture documents. Visible metering remains representational unless a live engine supplies validated data.
