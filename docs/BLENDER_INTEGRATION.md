# Blender Integration

## Connection status

Project status on 2026-09-20: `BLENDER_MCP_OK=true` (confirmed by the project owner).

The current Codex tool surface did not expose a callable Blender MCP method, so this iteration does not claim that it issued a live MCP command. The scene was authored, saved, exported and rendered with the installed Blender 5.2.1 LTS background runner. This produced inspectable `.blend`, `.glb` and preview artifacts without installing software or substituting another 3D format.

Workspace: `C:\Users\Ale\Desktop\Deep Music Producer v2`

Current authoring capabilities verified in this iteration: Python scene construction, collection/object naming, material authoring, camera/light creation, `.blend` save, glTF 2.0/GLB export, still rendering and geometry statistics.

## Required connection check

Run these checks through Blender MCP before authoring or exporting:

1. Read the Blender version.
2. List the current scene objects.
3. Resolve `Camera`, `Cube` and `Light` by exact object name.
4. Read the Cube dimensions without changing the scene.
5. Confirm the active `.blend` path is inside this repository.

The five checks remain the reconnection smoke test for any future session even though project-level MCP status is confirmed.

## Canonical source and export

- Source: `assets/blender/mastering/mastering_room_001.blend`
- Units: meters.
- Runtime axes: glTF Y-up, forward `-Z`.
- Export root: `web/public/models/mastering/`.
- Manifest: `web/public/models/manifest.json`.

The Blender scene must preserve modular collections or objects for the room shell, acoustic treatment, lighting, desk, operator position and hero equipment. Apply transforms, recalculate normals, validate UVs, remove hidden geometry, export only runtime-required objects and run the GLB through the glTF validator.

## Product boundary

Blender produces the visual twin: room geometry, materials, lighting reference, pivots and semantic node names. It does not define measured acoustics. The acoustic twin remains a separate system of documented impulse responses, HRTF, distance, early reflections, convolution and spatial placement. A visually convincing room must never be presented as acoustically measured unless measurement data exists.

React Three Fiber owns selection, camera focus, UI, presets, audio state and hotspots. The GLB is visual data, not product logic.
