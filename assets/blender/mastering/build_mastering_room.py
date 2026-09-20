import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[3]
BLEND_PATH = ROOT / "assets" / "blender" / "mastering" / "mastering_room_001.blend"
GLB_PATH = ROOT / "web" / "public" / "models" / "mastering" / "room" / "mastering_room_001.glb"
PREVIEW_PATH = ROOT / "assets" / "blender" / "mastering" / "mastering_room_001_preview.png"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mastering_premium_upgrade import apply_mastering_premium_upgrade


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def ensure_collection(name):
    collection = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if collection.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj, collection):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    collection.objects.link(obj)


def principled_material(name, color, roughness=0.5, metallic=0.0, emission=None, emission_strength=1.0, transmission=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (*color, 1.0)
    node = next(node for node in material.node_tree.nodes if node.bl_idname == "ShaderNodeBsdfPrincipled")
    node.inputs["Base Color"].default_value = (*color, 1.0)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    if "Transmission Weight" in node.inputs:
        node.inputs["Transmission Weight"].default_value = transmission
    if emission is not None:
        emission_input = node.inputs.get("Emission Color") or node.inputs.get("Emission")
        if emission_input:
            emission_input.default_value = (*emission, 1.0)
        if "Emission Strength" in node.inputs:
            node.inputs["Emission Strength"].default_value = emission_strength
    return material


def add_micro_bump(material, scale=32.0, strength=0.12, distance=0.05):
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = next(node for node in nodes if node.bl_idname == "ShaderNodeBsdfPrincipled")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 3.0
    noise.inputs["Roughness"].default_value = 0.7
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])


def add_wood_nodes(material):
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = next(node for node in nodes if node.bl_idname == "ShaderNodeBsdfPrincipled")
    texcoord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 5.5
    wave.inputs["Distortion"].default_value = 7.0
    wave.inputs["Detail"].default_value = 4.0
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.035, 0.014, 0.006, 1)
    ramp.color_ramp.elements[1].color = (0.23, 0.095, 0.033, 1)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.16
    bump.inputs["Distance"].default_value = 0.045
    links.new(texcoord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], wave.inputs["Vector"])
    links.new(wave.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], principled.inputs["Base Color"])
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])


def assign_material(obj, material):
    obj.data.materials.append(material)


def box(name, size, location, material, collection, bevel=0.04, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        modifier = obj.modifiers.new("precision_bevel", "BEVEL")
        modifier.width = min(bevel, min(size) * 0.22)
        modifier.segments = 3
        modifier.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    assign_material(obj, material)
    move_to_collection(obj, collection)
    return obj


def cylinder(name, radius, depth, location, material, collection, vertices=32, rotation=(0.0, 0.0, 0.0), bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if bevel:
        modifier = obj.modifiers.new("edge_bevel", "BEVEL")
        modifier.width = min(bevel, radius * 0.2, depth * 0.2)
        modifier.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    assign_material(obj, material)
    move_to_collection(obj, collection)
    return obj


def uv_sphere(name, radius, location, material, collection, segments=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    assign_material(obj, material)
    move_to_collection(obj, collection)
    return obj


def torus(name, major_radius, minor_radius, location, material, collection, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major_radius, minor_radius=minor_radius, major_segments=40, minor_segments=10, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    assign_material(obj, material)
    move_to_collection(obj, collection)
    return obj


def cable(name, points, material, collection, thickness=0.014):
    curve_data = bpy.data.curves.new(name, "CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 12
    curve_data.bevel_depth = thickness
    curve_data.bevel_resolution = 3
    spline = curve_data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinates in zip(spline.bezier_points, points):
        point.co = coordinates
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve_data)
    collection.objects.link(obj)
    assign_material(obj, material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    return obj


def screw(name, location, collection, material, rotation=(math.pi / 2, 0.0, 0.0)):
    return cylinder(name, 0.018, 0.012, location, material, collection, vertices=12, rotation=rotation, bevel=0.002)


def knob(name, location, collection, body_material, marker_material, radius=0.05, rotation=(math.pi / 2, 0.0, 0.0)):
    body = cylinder(name, radius, radius * 0.62, location, body_material, collection, vertices=28, rotation=rotation, bevel=0.007)
    marker_location = (location[0], location[1] - radius * 0.35, location[2] + radius * 0.42)
    box(f"{name}_marker", (0.008, 0.008, radius * 0.62), marker_location, marker_material, collection, bevel=0.002)
    return body


def led(name, location, color_material, collection, radius=0.017, rotation=(math.pi / 2, 0.0, 0.0)):
    return cylinder(name, radius, 0.012, location, color_material, collection, vertices=16, rotation=rotation, bevel=0.002)


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera(name, location, target, collection, lens=42.0):
    camera_data = bpy.data.cameras.new(name)
    camera_data.lens = lens
    camera_data.sensor_width = 36
    camera_data.dof.use_dof = True
    camera_data.dof.focus_distance = (Vector(target) - Vector(location)).length
    camera_data.dof.aperture_fstop = 4.8
    obj = bpy.data.objects.new(name, camera_data)
    collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)
    return obj


def add_light(name, light_type, location, color, energy, collection, target=None, size=1.0, spot_size=0.7):
    data = bpy.data.lights.new(name, light_type)
    data.color = color
    data.energy = energy
    if light_type == "AREA":
        data.shape = "DISK"
        data.size = size
    if light_type == "SPOT":
        data.spot_size = spot_size
        data.spot_blend = 0.72
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = location
    if target is not None:
        look_at(obj, target)
    return obj


reset_scene()
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1440
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.filepath = str(PREVIEW_PATH)
scene.render.image_settings.color_mode = "RGBA"
scene.render.resolution_percentage = 100
scene.render.engine = "BLENDER_EEVEE"
scene.render.use_file_extension = True
scene.render.image_settings.color_depth = "8"
scene.view_settings.look = "AgX - Medium High Contrast"

world = scene.world or bpy.data.worlds.new("DMP_MASTERING_WORLD")
scene.world = world
world.use_nodes = True
background_node = next(node for node in world.node_tree.nodes if node.bl_idname == "ShaderNodeBackground")
background_node.inputs["Color"].default_value = (0.006, 0.008, 0.01, 1.0)
background_node.inputs["Strength"].default_value = 0.18

root_collection = ensure_collection("DMP_MASTERING_ROOM")
architecture = ensure_collection("DMP_ARCHITECTURE")
console_collection = ensure_collection("DMP_CONSOLE")
monitor_collection = ensure_collection("DMP_MONITORS")
rack_collection = ensure_collection("DMP_RACKS")
furniture_collection = ensure_collection("DMP_FURNITURE")
props_collection = ensure_collection("DMP_PROPS")
lighting_collection = ensure_collection("DMP_LIGHTING")
camera_collection = ensure_collection("DMP_CAMERAS")

for collection in (architecture, console_collection, monitor_collection, rack_collection, furniture_collection, props_collection, lighting_collection, camera_collection):
    if collection.name in scene.collection.children:
        scene.collection.children.unlink(collection)
    root_collection.children.link(collection)

# Materials
walnut = principled_material("MAT_Walnut", (0.17, 0.064, 0.022), roughness=0.38)
add_wood_nodes(walnut)
walnut_edge = principled_material("MAT_Walnut_Trim", (0.32, 0.135, 0.045), roughness=0.34)
add_wood_nodes(walnut_edge)
oak = principled_material("MAT_Oak_Floor", (0.23, 0.11, 0.045), roughness=0.58)
add_wood_nodes(oak)
dark_metal = principled_material("MAT_Dark_Anodized", (0.028, 0.034, 0.038), roughness=0.28, metallic=0.72)
add_micro_bump(dark_metal, scale=110, strength=0.07, distance=0.025)
painted_metal = principled_material("MAT_Painted_Metal", (0.055, 0.064, 0.068), roughness=0.43, metallic=0.32)
brushed = principled_material("MAT_Brushed_Metal", (0.34, 0.36, 0.36), roughness=0.25, metallic=0.9)
add_micro_bump(brushed, scale=175, strength=0.055, distance=0.018)
brass = principled_material("MAT_Subtle_Brass", (0.46, 0.27, 0.09), roughness=0.27, metallic=0.86)
fabric = principled_material("MAT_Acoustic_Fabric", (0.055, 0.061, 0.064), roughness=0.98)
add_micro_bump(fabric, scale=85, strength=0.22, distance=0.025)
fabric_warm = principled_material("MAT_Acoustic_Fabric_Warm", (0.105, 0.085, 0.065), roughness=0.97)
add_micro_bump(fabric_warm, scale=82, strength=0.2, distance=0.025)
rubber = principled_material("MAT_Rubber", (0.012, 0.014, 0.015), roughness=0.88)
glass = principled_material("MAT_Glass", (0.12, 0.2, 0.22), roughness=0.12, transmission=0.45)
screen = principled_material("MAT_Display", (0.004, 0.018, 0.022), roughness=0.2, emission=(0.015, 0.16, 0.18), emission_strength=1.8)
led_green = principled_material("MAT_LED_Green", (0.02, 0.35, 0.12), roughness=0.2, emission=(0.02, 0.8, 0.25), emission_strength=5.5)
led_amber = principled_material("MAT_LED_Amber", (0.55, 0.2, 0.025), roughness=0.2, emission=(1.0, 0.3, 0.035), emission_strength=6.0)
led_red = principled_material("MAT_LED_Red", (0.52, 0.035, 0.02), roughness=0.2, emission=(1.0, 0.03, 0.015), emission_strength=5.5)
led_blue = principled_material("MAT_LED_Blue", (0.02, 0.16, 0.25), roughness=0.2, emission=(0.025, 0.42, 0.8), emission_strength=4.0)
ivory = principled_material("MAT_Control_Ivory", (0.68, 0.64, 0.54), roughness=0.38, metallic=0.12)

# Architecture: 8 m x 10 m x 3.4 m
box("wood_floor", (8.0, 10.0, 0.12), (0.0, 2.0, -0.06), oak, architecture, bevel=0.012)
for index in range(23):
    x = -3.82 + index * 0.347
    box(f"wood_floor_joint_{index:02d}", (0.009, 9.92, 0.006), (x, 2.0, 0.006), walnut_edge, architecture, bevel=0.001)

box("front_acoustic_wall", (8.0, 0.18, 3.4), (0.0, 7.0, 1.7), fabric, architecture, bevel=0.02)
box("left_acoustic_treatment", (0.18, 10.0, 3.4), (-4.0, 2.0, 1.7), fabric, architecture, bevel=0.02)
box("right_acoustic_treatment", (0.18, 10.0, 3.4), (4.0, 2.0, 1.7), fabric, architecture, bevel=0.02)
box("room_shell_ceiling", (8.05, 10.05, 0.12), (0.0, 2.0, 3.46), painted_metal, architecture, bevel=0.02)

for index, x in enumerate((-2.9, -1.75, 1.75, 2.9)):
    panel = box(f"front_acoustic_panel_{index + 1:02d}", (0.9, 0.14, 2.4), (x, 6.86, 1.72), fabric_warm if index % 2 else fabric, architecture, bevel=0.055)
    box(f"front_panel_trim_{index + 1:02d}", (0.98, 0.04, 2.48), (x, 6.775, 1.72), walnut_edge, architecture, bevel=0.028)

for index in range(13):
    x = -1.08 + index * 0.18
    depth = 0.08 + (index % 4) * 0.045
    height = 1.12 + (index % 3) * 0.27
    box(f"front_diffusion_{index + 1:02d}", (0.12, depth, height), (x, 6.72 - depth * 0.5, 1.38), walnut if index % 2 else walnut_edge, architecture, bevel=0.012)

for side, x, angle in (("left", -3.62, -math.radians(35)), ("right", 3.62, math.radians(35))):
    box(f"bass_traps_{side}", (0.68, 0.58, 3.02), (x, 6.65, 1.55), fabric_warm, architecture, bevel=0.1, rotation=(0, 0, angle))
    for index in range(12):
        z = 0.28 + index * 0.23
        box(f"bass_trap_{side}_slat_{index + 1:02d}", (0.46, 0.035, 0.035), (x, 6.33, z), walnut_edge, architecture, bevel=0.007, rotation=(0, 0, angle))

for index, x in enumerate((-1.35, -0.45, 0.45, 1.35)):
    box(f"ceiling_cloud_{index + 1:02d}", (0.74, 3.55, 0.13), (x, 2.25, 3.24), fabric, architecture, bevel=0.055)
for x in (-1.78, 1.78):
    box(f"ceiling_cloud_brass_{'L' if x < 0 else 'R'}", (0.035, 3.45, 0.055), (x, 2.25, 3.19), brass, architecture, bevel=0.008)

box("studio_door", (0.13, 1.16, 2.36), (3.89, -1.2, 1.18), walnut, architecture, bevel=0.055)
cylinder("studio_door_handle", 0.055, 0.12, (3.77, -1.56, 1.17), brass, architecture, vertices=28, rotation=(0, math.pi / 2, 0), bevel=0.01)

for index in range(17):
    x = -3.25 + index * 0.405
    depth = 0.12 + (index % 5) * 0.052
    z = 1.68 + ((index % 4) - 1.5) * 0.065
    box(f"rear_diffusion_{index + 1:02d}", (0.28, depth, 2.48), (x, -2.86 + depth * 0.5, z), walnut if index % 2 else walnut_edge, architecture, bevel=0.018)

# Mastering desk and console hero
box("mastering_desk", (6.2, 1.85, 0.2), (0.0, 0.9, 0.76), walnut, console_collection, bevel=0.09)
box("mastering_desk_front_trim", (6.08, 0.11, 0.16), (0.0, -0.015, 0.75), walnut_edge, console_collection, bevel=0.035)
for x in (-2.72, 2.72):
    box(f"mastering_desk_leg_{'left' if x < 0 else 'right'}", (0.16, 1.32, 0.74), (x, 1.0, 0.37), dark_metal, console_collection, bevel=0.045)
    box(f"mastering_desk_foot_{'left' if x < 0 else 'right'}", (0.62, 1.48, 0.07), (x, 0.95, 0.055), dark_metal, console_collection, bevel=0.025)

box("master_console_chassis", (5.75, 1.35, 0.36), (0.0, 1.03, 1.01), dark_metal, console_collection, bevel=0.075, rotation=(math.radians(4.5), 0, 0))
box("master_console_left_cheek", (0.19, 1.5, 0.55), (-2.89, 1.02, 1.05), walnut_edge, console_collection, bevel=0.07, rotation=(math.radians(4.5), 0, 0))
box("master_console_right_cheek", (0.19, 1.5, 0.55), (2.89, 1.02, 1.05), walnut_edge, console_collection, bevel=0.07, rotation=(math.radians(4.5), 0, 0))

sections = [
    ("master_console_tone_section", -2.22, brass),
    ("master_console_eq_section", -1.12, led_blue),
    ("master_console_dynamics_section", 0.0, led_amber),
    ("master_console_stereo_section", 1.12, led_blue),
    ("master_console_limiter_section", 2.22, led_amber),
]
for section_index, (name, x, accent_material) in enumerate(sections):
    box(name, (0.96, 1.08, 0.075), (x, 0.96, 1.245), painted_metal, console_collection, bevel=0.035, rotation=(math.radians(4.5), 0, 0))
    for knob_index, knob_x in enumerate((-0.28, 0.0, 0.28)):
        knob(f"{name}_knob_{knob_index + 1:02d}", (x + knob_x, 0.72, 1.34), console_collection, brushed if knob_index != 1 else brass, ivory, radius=0.052 if knob_index == 1 else 0.043, rotation=(0, 0, 0))
    for led_index, led_x in enumerate((-0.3, -0.1, 0.1, 0.3)):
        active_mat = accent_material if led_index < 3 else led_red
        led(f"{name}_led_{led_index + 1:02d}", (x + led_x, 1.18, 1.31), active_mat, console_collection, radius=0.014, rotation=(0, 0, 0))
    box(f"{name}_fader_slot", (0.075, 0.42, 0.018), (x + 0.25, 1.15, 1.3), rubber, console_collection, bevel=0.008)
    box(f"{name}_fader_cap", (0.15, 0.11, 0.055), (x + 0.25, 1.02 + section_index * 0.025, 1.34), ivory, console_collection, bevel=0.025)
    for corner_index, (sx, sy) in enumerate(((-0.42, -0.46), (0.42, -0.46), (-0.42, 0.46), (0.42, 0.46))):
        screw(f"{name}_screw_{corner_index + 1:02d}", (x + sx, 0.96 + sy, 1.3), console_collection, brushed, rotation=(0, 0, 0))

box("master_console_reference_section", (2.6, 0.62, 0.18), (0.0, 1.68, 1.46), dark_metal, console_collection, bevel=0.05, rotation=(math.radians(4.5), 0, 0))
for index in range(13):
    x = -1.02 + index * 0.17
    led_material = led_green if index < 8 else led_amber if index < 11 else led_red
    led(f"reference_led_{index + 1:02d}", (x, 1.36, 1.57), led_material, console_collection, radius=0.014, rotation=(0, 0, 0))
knob("master_console_reference_level", (1.08, 1.43, 1.57), console_collection, brass, ivory, radius=0.075, rotation=(0, 0, 0))

# Meter bridge and display
box("meter_bridge", (3.35, 0.18, 1.14), (0.0, 5.78, 2.05), dark_metal, console_collection, bevel=0.07)
box("reference_display", (3.03, 0.075, 0.88), (0.0, 5.675, 2.05), screen, console_collection, bevel=0.035)
for index in range(40):
    height = 0.14 + abs(math.sin(index * 0.47)) * 0.56
    x = -1.31 + index * 0.067
    material = led_amber if index > 33 else led_blue if index % 5 == 0 else led_green
    box(f"meter_bar_{index + 1:02d}", (0.032, 0.022, height), (x, 5.624, 1.73 + height * 0.5), material, console_collection, bevel=0.006)
box("meter_reference_line", (2.7, 0.02, 0.012), (0.0, 5.61, 2.36), led_amber, console_collection, bevel=0.004)

# Main monitors
def build_monitor(side, x):
    prefix = f"main_monitor_{side}"
    box(prefix, (1.12, 0.74, 1.78), (x, 5.22, 1.42), dark_metal, monitor_collection, bevel=0.11)
    box(f"{prefix}_baffle", (0.94, 0.07, 1.55), (x, 4.815, 1.42), painted_metal, monitor_collection, bevel=0.065)
    cylinder(f"{prefix}_woofer", 0.35, 0.075, (x, 4.755, 1.14), rubber, monitor_collection, vertices=56, rotation=(math.pi / 2, 0, 0), bevel=0.012)
    cylinder(f"{prefix}_woofer_cone", 0.255, 0.052, (x, 4.705, 1.14), painted_metal, monitor_collection, vertices=56, rotation=(math.pi / 2, 0, 0), bevel=0.01)
    torus(f"{prefix}_woofer_surround", 0.295, 0.035, (x, 4.665, 1.14), rubber, monitor_collection, rotation=(math.pi / 2, 0, 0))
    cylinder(f"{prefix}_tweeter", 0.145, 0.065, (x, 4.75, 1.85), brushed, monitor_collection, vertices=40, rotation=(math.pi / 2, 0, 0), bevel=0.01)
    led(f"{prefix}_status", (x, 4.665, 2.17), led_green, monitor_collection, radius=0.018, rotation=(math.pi / 2, 0, 0))
    for screw_index, (sx, sz) in enumerate(((-0.43, 0.71), (0.43, 0.71), (-0.43, -0.71), (0.43, -0.71))):
        screw(f"{prefix}_screw_{screw_index + 1:02d}", (x + sx, 4.665, 1.42 + sz), monitor_collection, brushed)
    for vent_index in range(7):
        box(f"{prefix}_vent_{vent_index + 1:02d}", (0.055, 0.045, 0.24), (x - 0.18 + vent_index * 0.06, 4.66, 0.72), rubber, monitor_collection, bevel=0.01)


build_monitor("left", -2.28)
build_monitor("right", 2.28)

# Outboard racks
def build_rack(side, x, labels, accents):
    rack_name = "eq_rack" if side == "left" else "dynamics_rack"
    box(rack_name, (1.25, 0.75, 2.42), (x, 4.0, 1.22), dark_metal, rack_collection, bevel=0.075)
    box(f"{rack_name}_wood_trim_left", (0.09, 0.79, 2.26), (x - 0.54, 4.0, 1.22), walnut_edge, rack_collection, bevel=0.025)
    box(f"{rack_name}_wood_trim_right", (0.09, 0.79, 2.26), (x + 0.54, 4.0, 1.22), walnut_edge, rack_collection, bevel=0.025)
    for row, label in enumerate(labels):
        z = 0.36 + row * 0.43
        unit_name = label
        box(unit_name, (1.02, 0.075, 0.34), (x, 3.59, z), painted_metal if row % 2 == 0 else walnut, rack_collection, bevel=0.028)
        for knob_index, knob_x in enumerate((-0.3, -0.08, 0.14)):
            knob(f"{unit_name}_knob_{knob_index + 1:02d}", (x + knob_x, 3.535, z), rack_collection, accents[row] if knob_index == 1 else brushed, ivory, radius=0.035)
        led(f"{unit_name}_led_green", (x + 0.36, 3.54, z + 0.055), led_green, rack_collection, radius=0.012)
        led(f"{unit_name}_led_status", (x + 0.46, 3.54, z + 0.055), led_amber if row < 4 else led_red, rack_collection, radius=0.012)
        screw(f"{unit_name}_screw_left", (x - 0.48, 3.54, z), rack_collection, brushed)
        screw(f"{unit_name}_screw_right", (x + 0.48, 3.54, z), rack_collection, brushed)
    # ventilation and rubber feet
    for vent_index in range(8):
        box(f"{rack_name}_vent_{vent_index + 1:02d}", (0.055, 0.06, 0.21), (x - 0.24 + vent_index * 0.07, 3.54, 2.23), rubber, rack_collection, bevel=0.009)
    for foot_x in (-0.42, 0.42):
        cylinder(f"{rack_name}_foot_{foot_x}", 0.05, 0.06, (x + foot_x, 4.0, 0.03), rubber, rack_collection, vertices=20)


build_rack("left", -3.25, ["eq_rack_tone_1", "eq_rack_tone_2", "eq_rack_dynamic_eq", "eq_rack_midside", "patchbay"], [brass, led_blue, led_green, brass, brushed])
build_rack("right", 3.25, ["dynamics_rack_compressor", "dynamics_rack_glue", "dynamics_rack_saturation", "limiter_metering_rack", "delivery_monitor"], [led_amber, brass, led_red, led_amber, led_blue])

# VU meters on dynamics rack
for meter_index, x in enumerate((3.1, 3.4)):
    box(f"VU_meter_{meter_index + 1}", (0.23, 0.035, 0.14), (x, 3.525, 1.66), glass, rack_collection, bevel=0.02)
    box(f"VU_meter_{meter_index + 1}_needle", (0.006, 0.012, 0.09), (x + 0.025, 3.5, 1.65), led_red, rack_collection, bevel=0.002, rotation=(0, math.radians(-18), 0))

# Listening chair
box("listening_chair_seat", (0.82, 0.76, 0.19), (0.0, -2.72, 0.63), fabric, furniture_collection, bevel=0.13)
box("listening_chair_back", (0.84, 0.19, 0.9), (0.0, -2.99, 1.13), fabric, furniture_collection, bevel=0.13, rotation=(math.radians(-7), 0, 0))
cylinder("listening_chair_column", 0.07, 0.5, (0.0, -2.72, 0.31), dark_metal, furniture_collection, vertices=24, bevel=0.012)
for index in range(5):
    angle = index / 5 * math.tau
    box(f"listening_chair_spoke_{index + 1:02d}", (0.42, 0.055, 0.05), (math.cos(angle) * 0.2, -2.72 + math.sin(angle) * 0.2, 0.08), dark_metal, furniture_collection, bevel=0.018, rotation=(0, 0, angle))
    cylinder(f"listening_chair_wheel_{index + 1:02d}", 0.045, 0.05, (math.cos(angle) * 0.4, -2.72 + math.sin(angle) * 0.4, 0.055), rubber, furniture_collection, vertices=18, rotation=(0, math.pi / 2, angle))

# Headphones, cables, patch and small props
torus("headphones_headband", 0.23, 0.025, (-1.78, 0.08, 1.2), rubber, props_collection, rotation=(math.pi / 2, 0, 0))
for side, x in (("L", -2.0), ("R", -1.56)):
    cylinder(f"headphones_cup_{side}", 0.105, 0.085, (x, 0.04, 1.13), dark_metal, props_collection, vertices=32, rotation=(math.pi / 2, 0, 0), bevel=0.02)
    torus(f"headphones_pad_{side}", 0.083, 0.022, (x, -0.01, 1.13), rubber, props_collection, rotation=(math.pi / 2, 0, 0))

cable("cable_monitor_left", [(-2.28, 4.75, 0.06), (-1.95, 3.5, 0.035), (-1.4, 1.9, 0.035)], rubber, props_collection)
cable("cable_monitor_right", [(2.28, 4.75, 0.06), (1.95, 3.5, 0.035), (1.4, 1.9, 0.035)], rubber, props_collection)
cable("headphone_cable", [(-1.78, 0.05, 1.08), (-1.95, -0.12, 0.65), (-1.55, -0.3, 0.04)], rubber, props_collection, thickness=0.01)

box("operator_position", (0.34, 0.34, 0.012), (0.0, -1.25, 0.012), brass, props_collection, bevel=0.17)

# Lighting practicals and cinematic sources
for index, x in enumerate((-2.8, 0.0, 2.8)):
    cylinder(f"lighting_practical_{index + 1:02d}", 0.12, 0.075, (x, 2.0, 3.28), dark_metal, lighting_collection, vertices=28, bevel=0.015)
    add_light(f"lighting_practical_point_{index + 1:02d}", "POINT", (x, 2.0, 3.08), (1.0, 0.58, 0.27), 85, lighting_collection)

add_light("console_softbox", "AREA", (0.0, -0.2, 3.05), (1.0, 0.72, 0.46), 680, lighting_collection, target=(0.0, 1.1, 0.9), size=4.2)
add_light("cool_fill_left", "AREA", (-3.15, 1.2, 2.65), (0.24, 0.52, 0.68), 420, lighting_collection, target=(-1.6, 4.2, 1.2), size=2.3)
add_light("warm_fill_right", "AREA", (3.1, 1.4, 2.55), (0.84, 0.43, 0.18), 330, lighting_collection, target=(1.6, 4.0, 1.1), size=2.1)
add_light("monitor_highlight_left", "SPOT", (-2.6, 3.6, 3.0), (0.55, 0.72, 0.82), 260, lighting_collection, target=(-2.28, 5.15, 1.4), spot_size=0.62)
add_light("monitor_highlight_right", "SPOT", (2.6, 3.6, 3.0), (1.0, 0.61, 0.3), 230, lighting_collection, target=(2.28, 5.15, 1.4), spot_size=0.62)
add_light("rear_diffusion_wash", "AREA", (0.0, -2.5, 2.65), (1.0, 0.42, 0.16), 230, lighting_collection, target=(0.0, -2.75, 1.2), size=3.4)

# Camera set (Blender Z-up; glTF exporter converts to Y-up)
cameras = {
    "camera_entry": ((0.0, -2.55, 1.7), (0.0, 3.8, 1.2), 40),
    "camera_operator": ((0.0, -2.25, 2.1), (0.0, 4.2, 1.18), 45),
    "camera_console": ((0.0, -1.08, 2.28), (0.0, 1.65, 0.98), 52),
    "camera_left_monitor": ((-1.18, 2.3, 1.58), (-2.28, 5.25, 1.45), 58),
    "camera_right_monitor": ((1.18, 2.3, 1.58), (2.28, 5.25, 1.45), 58),
    "camera_rack_left": ((-1.55, 2.65, 1.55), (-3.25, 4.0, 1.2), 55),
    "camera_rack_right": ((1.55, 2.65, 1.55), (3.25, 4.0, 1.2), 55),
    "camera_overview": ((0.0, -2.15, 2.82), (0.0, 3.65, 1.0), 38),
}
camera_objects = {}
for name, (location, target, lens) in cameras.items():
    camera_objects[name] = add_camera(name, location, target, camera_collection, lens)
scene.camera = camera_objects["camera_operator"]

apply_mastering_premium_upgrade({
    "box": box,
    "cylinder": cylinder,
    "torus": torus,
    "screw": screw,
    "knob": knob,
    "led": led,
    "add_light": add_light,
    "add_camera": add_camera,
    "walnut": walnut,
    "walnut_edge": walnut_edge,
    "dark_metal": dark_metal,
    "painted_metal": painted_metal,
    "brushed": brushed,
    "brass": brass,
    "fabric": fabric,
    "rubber": rubber,
    "ivory": ivory,
    "led_green": led_green,
    "led_amber": led_amber,
    "led_red": led_red,
    "led_blue": led_blue,
    "console_collection": console_collection,
    "monitor_collection": monitor_collection,
    "rack_collection": rack_collection,
    "architecture": architecture,
    "furniture_collection": furniture_collection,
    "props_collection": props_collection,
    "lighting_collection": lighting_collection,
    "camera_collection": camera_collection,
})

# Apply mesh rotation/scale while preserving useful object origins.
for obj in list(bpy.data.objects):
    if obj.type != "MESH":
        continue
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.select_set(False)

# Output folders and artifacts.
BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
GLB_PATH.parent.mkdir(parents=True, exist_ok=True)
PREVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
bpy.ops.export_scene.gltf(
    filepath=str(GLB_PATH),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_cameras=False,
    export_lights=False,
    export_materials="EXPORT",
    export_texcoords=True,
    export_normals=True,
    export_tangents=False,
    export_animations=False,
)
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

# Measured scene statistics for the manifest and quality gate.
triangle_count = 0
mesh_count = 0
for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    mesh_count += 1
    obj.data.calc_loop_triangles()
    triangle_count += len(obj.data.loop_triangles)

material_count = len([material for material in bpy.data.materials if material.users > 0])
bad_transforms = [obj.name for obj in bpy.context.scene.objects if obj.type == "MESH" and (any(abs(value - 1.0) > 1e-4 for value in obj.scale) or any(abs(value) > 1e-4 for value in obj.rotation_euler))]
print(f"DMP_STATS objects={len(scene.objects)} meshes={mesh_count} triangles={triangle_count} materials={material_count}")
print(f"DMP_DIMENSIONS width=8.0m depth=10.0m height=3.4m")
print(f"DMP_TRANSFORMS unapplied={len(bad_transforms)} names={bad_transforms[:12]}")
print(f"DMP_OUTPUT blend={BLEND_PATH}")
print(f"DMP_OUTPUT glb={GLB_PATH}")
print(f"DMP_OUTPUT preview={PREVIEW_PATH}")
