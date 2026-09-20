import bpy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
GLB_PATH = ROOT / "web" / "public" / "models" / "mastering" / "room" / "mastering_room_001.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(GLB_PATH))

required = [
    "wood_floor",
    "front_acoustic_wall",
    "master_console_chassis",
    "master_console_eq_section",
    "main_monitor_left",
    "main_monitor_left_woofer",
    "eq_rack",
    "dynamics_rack",
    "meter_bridge",
    "listening_chair_seat",
]

for name in required:
    obj = bpy.data.objects.get(name)
    if obj is None:
        print(f"DMP_VALIDATE missing={name}")
        continue
    dimensions = tuple(round(value, 4) for value in obj.dimensions)
    location = tuple(round(value, 4) for value in obj.location)
    print(f"DMP_VALIDATE name={name} location={location} dimensions={dimensions}")

mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
triangle_count = 0
for obj in mesh_objects:
    obj.data.calc_loop_triangles()
    triangle_count += len(obj.data.loop_triangles)

print(f"DMP_VALIDATE meshes={len(mesh_objects)} triangles={triangle_count} materials={len(bpy.data.materials)}")
