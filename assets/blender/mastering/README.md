# Mastering Room Blender source

The canonical source is `mastering_room_001.blend` in this directory. It is generated reproducibly by `build_mastering_room.py` with Blender 5.2.1 LTS.

The build creates the named collections, modular architecture, original hero equipment, PBR materials, practical lighting and eight cameras, then saves the `.blend`, exports the production GLB and renders the preview. The web runtime loads the GLB and retains the original procedural fallback documented in `docs/MASTERING_ROOM_001.md`.
