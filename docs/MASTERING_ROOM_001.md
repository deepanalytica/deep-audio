# MASTERING_ROOM_001

## Purpose

Mastering Room 001 is the visual and interaction benchmark for the immersive studio. It is a focused listening room, not a generic DAW skin: restrained, warm and technically authoritative, with the studio remaining visible while controls are used.

Visual thesis: dark walnut, dark anodized metal, acoustic fabric and restrained brass under low-key practical lighting. Cool fill separates equipment from the background without introducing cyberpunk colour or excessive bloom.

## Current implementation

The web scene implements a complete original procedural fallback at real-world scale:

- width: 8 m;
- depth: 10 m;
- height: 3.4 m;
- foreground: listening chair, operator position and console edge;
- midground: mastering console and interaction plane;
- background: main monitors, meter bridge, racks, acoustic wall and diffusion.

The room is modular. Semantic scene groups include `room_shell`, `wood_floor`, `front_acoustic_wall`, `rear_diffusion`, `left_acoustic_treatment`, `right_acoustic_treatment`, `bass_traps`, `ceiling_cloud`, `studio_door`, `lighting_practicals`, `mastering_desk`, `operator_position`, `meter_bridge` and `reference_display`.

The hero console is an original Deep Music Producer design with five mechanically separated control sections, recessed panels, knobs, switches, LEDs, fasteners, a reference section, material changes and a dedicated meter bridge. It intentionally avoids copying identifiable commercial hardware.

## Interaction

Selecting the console, either monitor or either rack:

1. moves the camera with the existing damped `CameraControls` transition;
2. adds a restrained warm focus light; procedural fallbacks also use a small scale response;
3. opens a contextual HUD while the room stays visible;
4. exposes an actionable preset or reference choice;
5. returns smoothly to the operator view when closed.

The console offers Natural, Streaming, Dynamic, Power and Custom starting points. Tone, Dynamic EQ, Compression, Saturation, Stereo, Limiter, Reference and Metering form the conceptual chain. Advanced controls stay behind progressive disclosure.

The visible loudness, peak, crest, correlation and range values are explicitly labelled `DEMO · NO LIVE ANALYSER`. They are interaction fixtures only; no code claims that Web Audio or JUCE currently supplies those measurements.

## Camera references

The runtime defines `camera_entry`, `camera_operator`, `camera_console`, `camera_left_monitor`, `camera_right_monitor`, `camera_rack_left`, `camera_rack_right` and `camera_overview`. These are the reference poses for the eventual Blender cameras. The primary seated composition is `camera_operator`.

## Blender and GLB status

The canonical source is `assets/blender/mastering/mastering_room_001.blend`; the production export is `web/public/models/mastering/room/mastering_room_001.glb`. Both were created with Blender 5.2.1 LTS from the checked-in reproducible build script.

Measured scene data:

- 471 objects;
- 454 mesh objects;
- 99,184 triangles;
- 17 shared materials;
- 0 unapplied mesh rotations or scales;
- 8 named cameras;
- room envelope: 8 × 10 × 3.4 metres.

The GLB is enabled in `AssetRegistry`. Original console, monitor, rack and furniture geometry is embedded in the room export for this first vertical slice. React-owned invisible interaction volumes preserve click and focus behaviour. If the GLB declaration or load fails, `AssetModel` restores the procedural room instead of breaking the studio.

No external 3D assets or unknown licences are used. The generated preview is stored beside the `.blend` as visual review evidence.
