"""Build the four post-benchmark immersive rooms with Blender 5.x.

Each room is original Deep Music Producer geometry, authored at metre scale and
exported as an independent GLB. Run from the repository root with Blender's
background runner; no third-party assets or textures are required.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
WEB_MODELS = ROOT / "web" / "public" / "models"
BLENDER_ASSETS = ROOT / "assets" / "blender"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from premium_upgrade import apply_premium_upgrade

ROOMS = {
    "practice": {
        "id": "practice_room_001",
        "collection": "DMP_PRACTICE_ROOM",
        "title": "Practice Room 001",
        "width": 9.0,
        "depth": 11.0,
        "height": 3.8,
        "accent": (0.17, 0.78, 0.58, 1),
        "warm": (0.95, 0.55, 0.24, 1),
        "camera": (0.0, -3.75, 2.22),
        "target": (0.0, 2.25, 1.15),
    },
    "recording": {
        "id": "recording_room_001",
        "collection": "DMP_RECORDING_ROOM",
        "title": "Recording Room 001",
        "width": 9.5,
        "depth": 11.5,
        "height": 3.9,
        "accent": (0.88, 0.33, 0.24, 1),
        "warm": (0.96, 0.65, 0.34, 1),
        "camera": (0.0, -4.0, 2.2),
        "target": (0.0, 2.35, 1.18),
    },
    "production": {
        "id": "production_room_001",
        "collection": "DMP_PRODUCTION_ROOM",
        "title": "Production Room 001",
        "width": 9.0,
        "depth": 11.0,
        "height": 3.65,
        "accent": (0.34, 0.39, 0.92, 1),
        "warm": (0.72, 0.42, 0.92, 1),
        "camera": (0.0, -3.65, 2.3),
        "target": (0.0, 2.4, 1.22),
    },
    "mix": {
        "id": "mix_room_001",
        "collection": "DMP_MIX_ROOM",
        "title": "Mix Room 001",
        "width": 9.0,
        "depth": 11.5,
        "height": 3.6,
        "accent": (0.20, 0.64, 0.84, 1),
        "warm": (0.88, 0.58, 0.28, 1),
        "camera": (0.0, -3.55, 2.25),
        "target": (0.0, 2.65, 1.2),
    },
}

collections: dict[str, bpy.types.Collection] = {}
materials: dict[str, bpy.types.Material] = {}


def reset_scene(cfg):
    global collections, materials
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            datablocks.remove(block)
    for child in list(bpy.context.scene.collection.children):
        bpy.context.scene.collection.children.unlink(child)

    collections = {}
    materials = {}
    root = bpy.data.collections.new(cfg["collection"])
    bpy.context.scene.collection.children.link(root)
    collections["root"] = root
    for key, suffix in (
        ("architecture", "ARCHITECTURE"),
        ("hero", "HERO_ASSETS"),
        ("furniture", "FURNITURE"),
        ("props", "PROPS"),
        ("lighting", "LIGHTING"),
        ("cameras", "CAMERAS"),
    ):
        child = bpy.data.collections.new(f"DMP_{suffix}")
        root.children.link(child)
        collections[key] = child


def material(name, color, roughness=0.5, metallic=0.0, emission=None, strength=0.0, transmission=0.0):
    if name in materials:
        return materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if emission and "Emission Color" in shader.inputs:
        shader.inputs["Emission Color"].default_value = emission
        shader.inputs["Emission Strength"].default_value = strength
    if transmission and "Transmission Weight" in shader.inputs:
        shader.inputs["Transmission Weight"].default_value = transmission
        shader.inputs["IOR"].default_value = 1.46
    materials[name] = mat
    return mat


def assign_collection(obj, key):
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    collections[key].objects.link(obj)


def finish_object(obj, name, mat, collection="hero", bevel=0.025):
    obj.name = name
    assign_collection(obj, collection)
    if mat:
        obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        mod = obj.modifiers.new("edge_bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    obj.select_set(False)
    return obj


def box(name, location, dimensions, mat, collection="hero", bevel=0.025, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.dimensions = dimensions
    return finish_object(obj, name, mat, collection, bevel)


def cylinder(name, location, radius, depth, mat, collection="hero", rotation=(0, 0, 0), vertices=32, bevel=0.012):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    return finish_object(bpy.context.object, name, mat, collection, bevel)


def sphere(name, location, radius, mat, collection="hero", scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=radius, location=location)
    obj = bpy.context.object
    obj.scale = scale
    return finish_object(obj, name, mat, collection, 0.0)


def torus(name, location, major, minor, mat, collection="hero", rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=40, minor_segments=10, location=location, rotation=rotation)
    return finish_object(bpy.context.object, name, mat, collection, 0.0)


def cable(name, points, mat, radius=0.012):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, value in zip(spline.bezier_points, points):
        point.co = value
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    collections["props"].objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def palette(cfg):
    return {
        "walnut": material("walnut_oiled", (0.18, 0.075, 0.032, 1), 0.42, 0.02),
        "oak": material("oak_warm", (0.42, 0.22, 0.085, 1), 0.56, 0.01),
        "ash": material("ash_smoked", (0.16, 0.13, 0.12, 1), 0.62, 0.01),
        "metal": material("metal_anodized", (0.028, 0.034, 0.039, 1), 0.28, 0.72),
        "brushed": material("metal_brushed", (0.25, 0.27, 0.27, 1), 0.3, 0.78),
        "fabric": material("acoustic_fabric", (0.035, 0.041, 0.044, 1), 0.96, 0.0),
        "fabric_warm": material("acoustic_fabric_warm", (0.17, 0.095, 0.065, 1), 0.92, 0.0),
        "rubber": material("rubber", (0.012, 0.014, 0.015, 1), 0.86, 0.0),
        "white": material("ceramic_warm", (0.64, 0.58, 0.49, 1), 0.48, 0.02),
        "accent": material("led_accent", cfg["accent"], 0.22, 0.05, cfg["accent"], 8.0),
        "warm": material("led_warm", cfg["warm"], 0.22, 0.04, cfg["warm"], 7.0),
        "red": material("led_red", (0.92, 0.12, 0.055, 1), 0.24, 0.02, (0.92, 0.12, 0.055, 1), 7.0),
        "screen": material("screen_dark", (0.008, 0.025, 0.03, 1), 0.18, 0.18),
        "glass": material("studio_glass", (0.12, 0.2, 0.22, 1), 0.08, 0.0, transmission=0.88),
    }


def build_shell(cfg, mats, floor_material="oak"):
    w, d, h = cfg["width"], cfg["depth"], cfg["height"]
    centre_y = 1.0
    front_y = centre_y + d / 2
    rear_y = centre_y - d / 2
    box("wood_floor", (0, centre_y, -0.06), (w, d, 0.12), mats[floor_material], "architecture", 0.012)
    box("front_acoustic_wall", (0, front_y, h / 2), (w, 0.18, h), mats["fabric"], "architecture", 0.018)
    box("left_acoustic_treatment", (-w / 2, centre_y, h / 2), (0.16, d, h), mats["fabric"], "architecture", 0.018)
    box("right_acoustic_treatment", (w / 2, centre_y, h / 2), (0.16, d, h), mats["fabric"], "architecture", 0.018)
    box("ceiling", (0, centre_y, h + 0.05), (w + 0.12, d + 0.12, 0.1), mats["fabric"], "architecture", 0.018)

    for i, x in enumerate((-3.45, -2.3, -1.15, 1.15, 2.3, 3.45)):
        if abs(x) > w / 2 - 0.3:
            continue
        box(f"front_panel_{i+1:02d}", (x, front_y - 0.13, 1.86), (0.82, 0.12, 2.65), mats["fabric_warm"] if i % 2 else mats["fabric"], "architecture", 0.04)

    for side in (-1, 1):
        x = side * (w / 2 - 0.32)
        box(f"bass_trap_{'left' if side < 0 else 'right'}", (x, front_y - 0.34, 1.78), (0.62, 0.56, 3.3), mats["ash"], "architecture", 0.08, rotation=(0, 0, side * 0.08))

    for i, x in enumerate((-1.5, -0.5, 0.5, 1.5)):
        box(f"ceiling_cloud_{i+1:02d}", (x, 1.7, h - 0.22), (0.72, 3.8, 0.12), mats["fabric_warm"] if i in (0, 3) else mats["fabric"], "architecture", 0.045)

    for i in range(19):
        x = -w / 2 + 0.45 + i * ((w - 0.9) / 18)
        height = 2.45 + (i % 4) * 0.16
        depth = 0.1 + (i % 5) * 0.055
        box(f"rear_diffuser_{i+1:02d}", (x, rear_y + 0.12, 1.52), ((w - 0.9) / 23, depth, height), mats["walnut"] if i % 2 else mats["oak"], "architecture", 0.018)

    box("studio_door", (w / 2 - 0.1, rear_y + 1.35, 1.22), (0.13, 1.25, 2.42), mats["walnut"], "architecture", 0.045)
    sphere("studio_door_handle", (w / 2 - 0.19, rear_y + 0.95, 1.2), 0.055, mats["brushed"], "props", scale=(0.65, 1, 1))
    return front_y, rear_y


def speaker(name, location, mats, scale=1.0, rotation_z=0.0):
    x, y, z = location
    box(name, location, (0.86 * scale, 0.64 * scale, 1.32 * scale), mats["metal"], "hero", 0.085, rotation=(0, 0, rotation_z))
    cylinder(f"{name}_woofer", (x, y - 0.335 * scale, z - 0.22 * scale), 0.27 * scale, 0.07 * scale, mats["rubber"], rotation=(math.pi / 2, 0, 0), vertices=48)
    torus(f"{name}_woofer_trim", (x, y - 0.374 * scale, z - 0.22 * scale), 0.245 * scale, 0.026 * scale, mats["brushed"], rotation=(math.pi / 2, 0, 0))
    cylinder(f"{name}_tweeter", (x, y - 0.338 * scale, z + 0.35 * scale), 0.11 * scale, 0.055 * scale, mats["brushed"], rotation=(math.pi / 2, 0, 0), vertices=40)
    sphere(f"{name}_status_led", (x + 0.3 * scale, y - 0.37 * scale, z + 0.52 * scale), 0.018 * scale, mats["accent"], "props")


def amplifier(name, location, mats, accent="warm", width=1.25):
    x, y, z = location
    box(name, location, (width, 0.62, 1.45), mats["metal"], "hero", 0.08)
    box(f"{name}_grille", (x, y - 0.33, z - 0.18), (width - 0.12, 0.035, 0.88), mats["fabric"], "hero", 0.025)
    box(f"{name}_control_panel", (x, y - 0.34, z + 0.53), (width - 0.15, 0.045, 0.22), mats["brushed"], "hero", 0.02)
    for i in range(7):
        cylinder(f"{name}_knob_{i+1:02d}", (x - width * 0.35 + i * width * 0.115, y - 0.385, z + 0.53), 0.038, 0.035, mats["white"], "props", rotation=(math.pi / 2, 0, 0), vertices=20)
    sphere(f"{name}_power_led", (x + width * 0.39, y - 0.39, z + 0.55), 0.018, mats[accent], "props")


def rack(name, location, mats, accent="accent", rows=6, width=1.2):
    x, y, z = location
    box(name, location, (width, 0.72, 2.15), mats["metal"], "hero", 0.065)
    for row in range(rows):
        rz = z - 0.82 + row * (1.64 / max(1, rows - 1))
        face = mats["ash"] if row % 2 else mats["brushed"]
        box(f"{name}_unit_{row+1:02d}", (x, y - 0.385, rz), (width - 0.14, 0.055, 0.23), face, "hero", 0.018)
        for i in range(3):
            cylinder(f"{name}_r{row+1:02d}_knob_{i+1:02d}", (x - 0.28 + i * 0.22, y - 0.425, rz), 0.031, 0.028, mats["white"], "props", rotation=(math.pi / 2, 0, 0), vertices=18)
        sphere(f"{name}_r{row+1:02d}_led", (x + 0.38, y - 0.43, rz), 0.012, mats[accent if row % 3 else "warm"], "props")


def keyboard(name, location, mats, width=2.5):
    x, y, z = location
    box(name, location, (width, 0.72, 0.18), mats["metal"], "hero", 0.055)
    key_count = 25
    spacing = (width - 0.18) / key_count
    for i in range(key_count):
        box(f"{name}_white_key_{i+1:02d}", (x - width / 2 + 0.1 + spacing * (i + 0.5), y - 0.19, z + 0.115), (spacing * 0.88, 0.38, 0.045), mats["white"], "props", 0.008)
    for i in (1, 3, 6, 8, 10, 13, 15, 18, 20, 22):
        box(f"{name}_black_key_{i:02d}", (x - width / 2 + 0.1 + spacing * (i + 0.95), y - 0.1, z + 0.16), (spacing * 0.56, 0.25, 0.07), mats["rubber"], "props", 0.006)


def guitar(name, location, mats, color_mat, bass=False):
    x, y, z = location
    sphere(f"{name}_body_lower", (x, y, z + 0.62), 0.3, color_mat, scale=(0.76, 0.24, 1.0))
    sphere(f"{name}_body_upper", (x, y, z + 0.93), 0.24, color_mat, scale=(0.72, 0.23, 0.82))
    box(f"{name}_neck", (x, y, z + 1.48), (0.085, 0.07, 0.95 if bass else 0.78), mats["walnut"], "hero", 0.018)
    box(f"{name}_headstock", (x, y, z + (2.03 if bass else 1.94)), (0.18, 0.09, 0.3), mats["oak"], "hero", 0.025, rotation=(0, 0, -0.08))
    for i in range(4 if bass else 6):
        sphere(f"{name}_tuner_{i+1:02d}", (x + (-0.11 if i % 2 else 0.11), y, z + 1.92 + (i // 2) * 0.09), 0.025, mats["brushed"], "props")
    box(f"{name}_stand", (x, y + 0.12, z + 0.12), (0.55, 0.5, 0.06), mats["rubber"], "furniture", 0.02)


def drum_kit(origin, mats):
    ox, oy, oz = origin
    cylinder("drum_kick", (ox, oy, oz + 0.53), 0.48, 0.58, mats["ash"], rotation=(math.pi / 2, 0, 0), vertices=48, bevel=0.03)
    cylinder("drum_kick_head", (ox, oy - 0.31, oz + 0.53), 0.42, 0.035, mats["fabric"], rotation=(math.pi / 2, 0, 0), vertices=48)
    for name, dx, dy, dz, radius in (
        ("snare", -0.58, -0.1, 0.72, 0.29),
        ("rack_tom_left", -0.28, 0.13, 1.05, 0.25),
        ("rack_tom_right", 0.28, 0.13, 1.07, 0.27),
        ("floor_tom", 0.65, 0.1, 0.68, 0.34),
    ):
        cylinder(f"drum_{name}", (ox + dx, oy + dy, oz + dz), radius, 0.32, mats["oak"], vertices=40, bevel=0.025)
        cylinder(f"drum_{name}_head", (ox + dx, oy + dy, oz + dz + 0.17), radius * 0.92, 0.025, mats["white"], vertices=40, bevel=0.006)
    for i, (dx, dy, dz, radius) in enumerate(((-0.92, 0.05, 1.35, 0.38), (0.92, 0.0, 1.48, 0.43), (0.55, 0.4, 1.68, 0.34))):
        cylinder(f"cymbal_stand_{i+1:02d}", (ox + dx, oy + dy, oz + dz / 2), 0.022, dz, mats["brushed"], "props", vertices=16, bevel=0.006)
        cylinder(f"cymbal_{i+1:02d}", (ox + dx, oy + dy, oz + dz), radius, 0.018, mats["warm"], "hero", vertices=48, bevel=0.004)


def console(name, location, mats, width=5.5, modules=8):
    x, y, z = location
    box(name, (x, y, z), (width, 1.55, 0.34), mats["walnut"], "hero", 0.09, rotation=(-0.09, 0, 0))
    box(f"{name}_frame", (x, y + 0.12, z + 0.2), (width - 0.16, 1.25, 0.32), mats["metal"], "hero", 0.055, rotation=(-0.09, 0, 0))
    module_w = (width - 0.38) / modules
    for row in range(modules):
        mx = x - width / 2 + 0.26 + module_w * (row + 0.5)
        box(f"{name}_channel_{row+1:02d}", (mx, y - 0.04, z + 0.39), (module_w * 0.84, 0.98, 0.075), mats["ash"] if row % 2 else mats["brushed"], "hero", 0.018, rotation=(-0.09, 0, 0))
        for knob_index in range(3):
            cylinder(f"{name}_ch{row+1:02d}_knob_{knob_index+1:02d}", (mx, y + 0.21 + knob_index * 0.2, z + 0.48 + knob_index * 0.018), 0.033, 0.032, mats["white"], "props", rotation=(math.pi / 2 - 0.09, 0, 0), vertices=18)
        box(f"{name}_ch{row+1:02d}_fader", (mx, y - 0.26, z + 0.5), (0.07, 0.28, 0.04), mats["white"], "props", 0.012, rotation=(-0.09, 0, 0))
        sphere(f"{name}_ch{row+1:02d}_led", (mx, y + 0.48, z + 0.51), 0.011, mats["accent" if row < modules - 2 else "warm"], "props")
    for lx in (-width / 2 + 0.18, width / 2 - 0.18):
        box(f"{name}_leg_{'left' if lx < 0 else 'right'}", (x + lx, y, z - 0.68), (0.13, 1.22, 1.25), mats["metal"], "furniture", 0.025)


def build_practice(cfg, mats):
    build_shell(cfg, mats, "oak")
    box("practice_rug", (0, 2.15, 0.02), (5.8, 4.9, 0.045), mats["fabric_warm"], "furniture", 0.08)
    drum_kit((0, 2.9, 0), mats)
    amplifier("bass_stack", (-3.25, 4.35, 0.82), mats, "accent", 1.4)
    amplifier("guitar_combo", (3.3, 4.25, 0.78), mats, "warm", 1.3)
    guitar("session_bass", (-3.45, 0.95, 0), mats, mats["walnut"], bass=True)
    guitar("electric_guitar", (3.5, 0.9, 0), mats, mats["oak"])
    keyboard("practice_keys", (2.35, 5.25, 1.05), mats, 2.35)
    box("practice_keys_stand", (2.35, 5.25, 0.55), (1.6, 0.48, 0.9), mats["metal"], "furniture", 0.025)
    for x in (-1.3, 1.3):
        speaker(f"practice_monitor_{'left' if x < 0 else 'right'}", (x, 5.82, 1.4), mats, 0.62)
    cable("practice_cable_left", [(-3.45, 0.98, 0.08), (-2.5, 1.3, 0.05), (-3.15, 3.8, 0.06)], mats["rubber"])
    cable("practice_cable_right", [(3.5, 0.92, 0.08), (2.6, 1.35, 0.05), (3.15, 3.7, 0.06)], mats["rubber"])


def build_recording(cfg, mats):
    build_shell(cfg, mats, "ash")
    box("live_room_rug", (-1.35, 2.7, 0.02), (4.8, 4.6, 0.045), mats["fabric_warm"], "furniture", 0.08)
    drum_kit((-1.65, 3.2, 0), mats)
    amplifier("tracking_amp", (-3.65, 4.85, 0.78), mats, "red", 1.25)
    rack("recording_front_end", (3.72, 4.75, 1.12), mats, "warm", 6, 1.28)

    # Glass vocal booth on the right, with framed transparent panels.
    box("vocal_booth_floor", (2.62, 2.45, 0.05), (3.0, 3.25, 0.1), mats["oak"], "architecture", 0.018)
    box("vocal_booth_back", (3.92, 3.6, 1.55), (0.12, 2.9, 3.05), mats["fabric"], "architecture", 0.025)
    box("vocal_booth_glass", (1.25, 2.45, 1.62), (0.075, 3.25, 3.05), mats["glass"], "architecture", 0.012)
    for y in (0.88, 2.45, 4.02):
        box(f"vocal_booth_frame_{str(y).replace('.', '_')}", (1.2, y, 1.62), (0.12, 0.1, 3.15), mats["metal"], "architecture", 0.012)
    box("vocal_booth_header", (1.2, 2.45, 3.1), (0.12, 3.2, 0.12), mats["metal"], "architecture", 0.012)

    # Original large-diaphragm microphone and stand.
    cylinder("vocal_mic_stand", (2.5, 2.1, 0.72), 0.035, 1.42, mats["brushed"], "hero", vertices=24, bevel=0.008)
    cylinder("vocal_mic_body", (2.5, 2.1, 1.58), 0.12, 0.38, mats["metal"], "hero", vertices=40, bevel=0.025)
    sphere("vocal_mic_capsule", (2.5, 2.1, 1.83), 0.14, mats["brushed"], "hero", scale=(0.86, 0.72, 1.18))
    torus("vocal_mic_shockmount", (2.5, 2.1, 1.48), 0.2, 0.025, mats["rubber"], "props", rotation=(math.pi / 2, 0, 0))
    box("vocal_pop_filter_arm", (2.5, 1.83, 1.72), (0.035, 0.45, 0.035), mats["metal"], "props", 0.008, rotation=(0.25, 0, 0))
    cylinder("vocal_pop_filter", (2.5, 1.61, 1.82), 0.17, 0.025, mats["fabric"], "props", rotation=(math.pi / 2, 0, 0), vertices=40, bevel=0.006)
    cable("vocal_mic_cable", [(2.5, 2.1, 1.42), (2.45, 2.25, 0.15), (3.55, 4.35, 0.08)], mats["rubber"], 0.014)


def build_production(cfg, mats):
    build_shell(cfg, mats, "ash")
    box("production_rug", (0, 1.8, 0.02), (6.4, 4.6, 0.045), mats["fabric"], "furniture", 0.08)
    box("production_desk", (0, 1.4, 0.84), (5.7, 1.48, 0.24), mats["walnut"], "furniture", 0.075)
    for x in (-2.55, 2.55):
        box(f"production_desk_leg_{'left' if x < 0 else 'right'}", (x, 1.4, 0.43), (0.16, 1.12, 0.82), mats["metal"], "furniture", 0.025)
    keyboard("studio_keyboard", (0, 1.18, 1.02), mats, 3.5)
    speaker("production_monitor_left", (-1.72, 2.08, 1.73), mats, 0.72, 0.05)
    speaker("production_monitor_right", (1.72, 2.08, 1.73), mats, 0.72, -0.05)

    # Twin modular synth towers with patch fields and semantic modules.
    for side, x in (("left", -3.22), ("right", 3.22)):
        box(f"synth_rack_{side}", (x, 3.65, 1.32), (1.55, 0.76, 2.55), mats["metal"], "hero", 0.07, rotation=(0, 0, -0.025 if side == "left" else 0.025))
        for row in range(6):
            rz = 0.42 + row * 0.36
            box(f"synth_{side}_module_{row+1:02d}", (x, 3.245, rz), (1.38, 0.055, 0.29), mats["ash"] if row % 2 else mats["brushed"], "hero", 0.016)
            for col in range(5):
                px = x - 0.48 + col * 0.24
                cylinder(f"synth_{side}_r{row+1:02d}_knob_{col+1:02d}", (px, 3.205, rz), 0.03, 0.027, mats["white"], "props", rotation=(math.pi / 2, 0, 0), vertices=16)
            sphere(f"synth_{side}_r{row+1:02d}_led", (x + 0.58, 3.198, rz), 0.012, mats["accent" if row % 2 else "warm"], "props")
        cable(f"synth_patch_{side}_a", [(x - 0.42, 3.17, 1.82), (x - 0.1, 3.03, 1.46), (x + 0.34, 3.17, 1.1)], mats["accent"], 0.01)
        cable(f"synth_patch_{side}_b", [(x + 0.48, 3.17, 2.0), (x + 0.1, 2.98, 1.64), (x - 0.34, 3.17, 0.92)], mats["warm"], 0.01)

    rack("texture_fx_rack", (3.55, 5.35, 1.1), mats, "accent", 5, 1.15)
    box("pad_controller", (-1.85, 1.0, 1.18), (1.05, 0.68, 0.12), mats["metal"], "hero", 0.04, rotation=(-0.08, 0, 0.04))
    for row in range(4):
        for col in range(4):
            box(f"pad_{row+1}_{col+1}", (-2.18 + col * 0.22, 0.82 + row * 0.12, 1.27 + row * 0.01), (0.16, 0.09, 0.035), mats["accent"] if (row + col) % 3 == 0 else mats["rubber"], "props", 0.012)


def build_mix(cfg, mats):
    build_shell(cfg, mats, "walnut")
    box("mix_room_rug", (0, 1.3, 0.02), (6.4, 4.4, 0.045), mats["fabric"], "furniture", 0.08)
    console("mix_console", (0, 1.15, 1.0), mats, 6.25, 12)
    speaker("mix_monitor_left", (-2.45, 5.15, 1.48), mats, 1.08, 0.08)
    speaker("mix_monitor_right", (2.45, 5.15, 1.48), mats, 1.08, -0.08)
    rack("mix_dynamics_rack", (-3.65, 3.85, 1.12), mats, "accent", 6, 1.3)
    rack("mix_spatial_fx_rack", (3.65, 3.85, 1.12), mats, "warm", 6, 1.3)
    box("mix_meter_bridge", (0, 5.72, 2.18), (3.55, 0.18, 1.08), mats["metal"], "hero", 0.065)
    box("mix_reference_display", (0, 5.61, 2.18), (3.2, 0.035, 0.78), mats["screen"], "hero", 0.035)
    for i in range(40):
        height = 0.1 + abs(math.sin(i * 0.43)) * 0.52
        box(f"mix_meter_bar_{i+1:02d}", (-1.38 + i * 0.071, 5.58, 1.92 + height / 2), (0.036, 0.018, height), mats["warm"] if i > 33 else mats["accent"], "props", 0.004)
    box("mix_listening_chair_seat", (0, -2.25, 0.64), (0.82, 0.78, 0.2), mats["fabric_warm"], "furniture", 0.11)
    box("mix_listening_chair_back", (0, -2.03, 1.14), (0.8, 0.18, 0.86), mats["fabric_warm"], "furniture", 0.12, rotation=(-0.1, 0, 0))
    cylinder("mix_listening_chair_post", (0, -2.25, 0.32), 0.065, 0.56, mats["metal"], "furniture", vertices=24, bevel=0.012)


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera(name, position, target, lens=38):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36
    data.clip_start = 0.05
    data.clip_end = 80
    obj = bpy.data.objects.new(name, data)
    collections["cameras"].objects.link(obj)
    obj.location = position
    look_at(obj, target)
    return obj


def add_light(name, light_type, location, color, energy, size=2.0, target=(0, 2.5, 1.0)):
    data = bpy.data.lights.new(name, light_type)
    data.color = color[:3]
    data.energy = energy
    if light_type == "AREA":
        data.shape = "DISK"
        data.size = size
    if light_type == "SPOT":
        data.spot_size = math.radians(58)
        data.spot_blend = 0.72
    obj = bpy.data.objects.new(name, data)
    collections["lighting"].objects.link(obj)
    obj.location = location
    if light_type in ("AREA", "SPOT"):
        look_at(obj, target)
    return obj


def lighting_and_cameras(cfg, mats):
    add_light("warm_ceiling_practical", "AREA", (0, 0.2, cfg["height"] - 0.28), (1.0, 0.58, 0.3, 1), 720, 4.5, (0, 2.1, 0.4))
    add_light("controlled_cool_fill", "AREA", (-3.7, 1.5, 2.4), (0.28, 0.48, 0.68, 1), 430, 3.2, (0, 2.6, 1.0))
    add_light("hero_warm_key", "AREA", (3.4, 1.0, 2.7), (1.0, 0.62, 0.34, 1), 360, 2.8, (0, 2.7, 1.0))
    add_light("front_wall_wash", "SPOT", (0, 4.5, 3.1), (0.65, 0.78, 1.0, 1), 520, target=(0, 6.0, 1.5))
    for i, x in enumerate((-2.7, 0, 2.7)):
        cylinder(f"ceiling_practical_fixture_{i+1:02d}", (x, 0.2, cfg["height"] - 0.13), 0.13, 0.09, mats["metal"], "lighting", vertices=28, bevel=0.012)
        cylinder(f"ceiling_practical_lens_{i+1:02d}", (x, 0.2, cfg["height"] - 0.2), 0.095, 0.018, mats["warm"], "lighting", vertices=28, bevel=0.004)

    camera = add_camera("camera_operator", cfg["camera"], cfg["target"], 41)
    bpy.context.scene.camera = camera
    add_camera("camera_entry", (0, cfg["camera"][1] - 0.55, 1.75), (0, 2.5, 1.1), 34)
    add_camera("camera_hero", (0, -0.4, 2.15), (0, 2.9, 1.0), 48)
    add_camera("camera_left", (-2.2, -0.8, 1.8), (-2.6, 3.8, 1.25), 46)
    add_camera("camera_right", (2.2, -0.8, 1.8), (2.6, 3.8, 1.25), 46)
    add_camera("camera_overview", (0, -3.2, 3.15), (0, 2.3, 0.85), 34)


def apply_modifiers_and_validate():
    for obj in list(bpy.data.objects):
        if obj.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        for mod in list(obj.modifiers):
            try:
                bpy.ops.object.modifier_apply(modifier=mod.name)
            except RuntimeError:
                pass
        obj.select_set(False)

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    triangles = 0
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    unapplied = [obj.name for obj in meshes if any(abs(value - 1) > 1e-4 for value in obj.scale)]
    return len(meshes), triangles, len(bpy.data.materials), unapplied


def configure_scene(cfg):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.world.color = (0.006, 0.008, 0.01)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.filepath = str(BLENDER_ASSETS / cfg["id"].replace("_room_001", "") / f"{cfg['id']}_preview.png")


def export_room(key, cfg):
    source_dir = BLENDER_ASSETS / ("recording" if key == "recording" else key)
    target_dir = WEB_MODELS / key / "room"
    source_dir.mkdir(parents=True, exist_ok=True)
    target_dir.mkdir(parents=True, exist_ok=True)
    blend_path = source_dir / f"{cfg['id']}.blend"
    glb_path = target_dir / f"{cfg['id']}.glb"
    preview_path = source_dir / f"{cfg['id']}_preview.png"

    bpy.context.scene.render.filepath = str(preview_path)
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
    )
    return blend_path, glb_path, preview_path


def build_room(key, cfg):
    reset_scene(cfg)
    mats = palette(cfg)
    builders = {
        "practice": build_practice,
        "recording": build_recording,
        "production": build_production,
        "mix": build_mix,
    }
    builders[key](cfg, mats)
    apply_premium_upgrade(key, cfg, mats, {
        "box": box,
        "cylinder": cylinder,
        "sphere": sphere,
        "torus": torus,
        "cable": cable,
        "speaker": speaker,
        "rack": rack,
        "add_light": add_light,
        "add_camera": add_camera,
    })
    lighting_and_cameras(cfg, mats)
    configure_scene(cfg)
    meshes, triangles, material_count, unapplied = apply_modifiers_and_validate()
    blend_path, glb_path, preview_path = export_room(key, cfg)
    print(
        f"DMP_ROOM_BUILT id={cfg['id']} meshes={meshes} triangles={triangles} "
        f"materials={material_count} unapplied={len(unapplied)} "
        f"blend={blend_path} glb={glb_path} preview={preview_path}"
    )


for room_key, room_config in ROOMS.items():
    build_room(room_key, room_config)

print("DMP_ALL_STUDIO_ROOMS_COMPLETE")
