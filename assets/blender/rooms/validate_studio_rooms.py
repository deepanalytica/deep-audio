"""Reimport every non-mastering room GLB and validate semantic geometry."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[3]
ROOMS = {
    "practice": ("practice_room_001", ["wood_floor", "drum_kick", "bass_stack", "guitar_combo", "practice_keys"]),
    "recording": ("recording_room_001", ["wood_floor", "vocal_booth_glass", "vocal_mic_body", "recording_front_end", "drum_kick"]),
    "production": ("production_room_001", ["wood_floor", "production_desk", "studio_keyboard", "synth_rack_left", "synth_rack_right"]),
    "mix": ("mix_room_001", ["wood_floor", "mix_console", "mix_monitor_left", "mix_monitor_right", "mix_meter_bridge"]),
}

for category, (asset_id, required) in ROOMS.items():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(datablocks):
            datablocks.remove(block)
    path = ROOT / "web" / "public" / "models" / category / "room" / f"{asset_id}.glb"
    bpy.ops.import_scene.gltf(filepath=str(path))
    missing = [name for name in required if bpy.data.objects.get(name) is None]
    if missing:
        raise RuntimeError(f"{asset_id}: missing semantic nodes: {missing}")
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    triangles = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    floor = bpy.data.objects["wood_floor"]
    print(
        f"DMP_ROOM_VALIDATE id={asset_id} meshes={len(meshes)} triangles={triangles} "
        f"materials={len(bpy.data.materials)} floor_dimensions={tuple(round(v, 3) for v in floor.dimensions)}"
    )

print("DMP_ALL_STUDIO_ROOMS_VALID")
