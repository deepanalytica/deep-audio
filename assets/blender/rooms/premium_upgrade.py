"""Premium detail pass for Deep Music Producer studio rooms.

This module is called from build_studio_rooms.py after the base room geometry
exists. It deliberately upgrades the authored Blender source rather than
relying on runtime decoration.
"""

from __future__ import annotations

import math
import bpy


def _micro_surface(mat, scale=90.0, strength=0.09, distance=0.02, wave=False):
    if not mat or not mat.use_nodes:
        return
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    if any(node.name == "DMP_PREMIUM_BUMP" for node in nodes):
        return
    principled = next((n for n in nodes if n.bl_idname == "ShaderNodeBsdfPrincipled"), None)
    if not principled:
        return
    texture = nodes.new("ShaderNodeTexWave" if wave else "ShaderNodeTexNoise")
    texture.name = "DMP_PREMIUM_TEXTURE"
    if wave:
        texture.wave_type = "BANDS"
        texture.bands_direction = "X"
        texture.inputs["Scale"].default_value = scale / 16.0
        texture.inputs["Distortion"].default_value = 5.0
        texture.inputs["Detail"].default_value = 4.0
        source = texture.outputs["Color"]
    else:
        texture.inputs["Scale"].default_value = scale
        texture.inputs["Detail"].default_value = 3.5
        texture.inputs["Roughness"].default_value = 0.72
        source = texture.outputs["Fac"]
    bump = nodes.new("ShaderNodeBump")
    bump.name = "DMP_PREMIUM_BUMP"
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    links.new(source, bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])


def _delete_prefix(prefixes):
    for obj in list(bpy.data.objects):
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def apply_premium_upgrade(room_key, cfg, mats, api):
    box = api["box"]
    cylinder = api["cylinder"]
    sphere = api["sphere"]
    torus = api["torus"]
    cable = api["cable"]
    speaker = api["speaker"]
    rack = api["rack"]
    add_light = api["add_light"]
    add_camera = api["add_camera"]

    # Material fidelity in Blender previews / source.
    _micro_surface(mats["walnut"], 36, 0.15, 0.035, wave=True)
    _micro_surface(mats["oak"], 42, 0.13, 0.03, wave=True)
    _micro_surface(mats["fabric"], 120, 0.2, 0.018)
    _micro_surface(mats["fabric_warm"], 110, 0.18, 0.018)
    _micro_surface(mats["metal"], 150, 0.055, 0.012)
    _micro_surface(mats["brushed"], 190, 0.045, 0.009)
    _micro_surface(mats["rubber"], 130, 0.08, 0.012)

    def screw(name, xyz, mat=None, radius=0.014):
        cylinder(name, xyz, radius, 0.014, mat or mats["brushed"], "props",
                 rotation=(math.pi / 2, 0, 0), vertices=14, bevel=0.002)

    def knob(name, xyz, radius=0.045, mat=None, accent=None):
        body_mat = mat or mats["brushed"]
        accent_mat = accent or mats["warm"]
        cylinder(name, xyz, radius, radius * 0.62, body_mat, "props",
                 rotation=(math.pi / 2, 0, 0), vertices=28, bevel=0.006)
        # pointer
        box(f"{name}_pointer", (xyz[0], xyz[1] - radius * 0.34, xyz[2] + radius * 0.42),
            (0.008, 0.009, radius * 0.62), accent_mat, "props", 0.002)
        # restrained tick arc
        for i in range(9):
            angle = math.radians(-115 + i * 28.75)
            tx = xyz[0] + math.sin(angle) * radius * 1.42
            tz = xyz[2] + math.cos(angle) * radius * 1.42
            box(f"{name}_tick_{i:02d}", (tx, xyz[1] - radius * 0.36, tz),
                (0.006, 0.008, radius * 0.18), mats["white"], "props", 0.001,
                rotation=(0, -angle, 0))

    def fader(name, xyz, travel=0.34, value=0.5, accent=None):
        accent_mat = accent or mats["warm"]
        box(f"{name}_slot", xyz, (0.052, travel, 0.018), mats["rubber"], "props", 0.007)
        cap_y = xyz[1] - travel * 0.36 + travel * 0.72 * value
        box(f"{name}_cap", (xyz[0], cap_y, xyz[2] + 0.034),
            (0.13, 0.09, 0.055), mats["white"], "props", 0.018)
        box(f"{name}_cap_marker", (xyz[0], cap_y - 0.004, xyz[2] + 0.064),
            (0.085, 0.008, 0.008), accent_mat, "props", 0.001)
        for i in range(7):
            ty = xyz[1] - travel * 0.36 + i * (travel * 0.72 / 6)
            box(f"{name}_scale_{i:02d}", (xyz[0] - 0.055, ty, xyz[2] + 0.01),
                (0.025, 0.004, 0.006), mats["brushed"], "props", 0.001)

    def display(name, xyz, width=0.72, height=0.24, accent="accent"):
        box(f"{name}_bezel", xyz, (width, 0.055, height), mats["metal"], "hero", 0.026)
        box(f"{name}_glass", (xyz[0], xyz[1] - 0.032, xyz[2]),
            (width * 0.9, 0.018, height * 0.76), mats["screen"], "hero", 0.018)
        # usable visual content: meter bars + reference line
        for i in range(16):
            h = 0.035 + abs(math.sin((i + 1) * 0.51)) * height * 0.45
            x = xyz[0] - width * 0.38 + i * (width * 0.76 / 15)
            mat = mats["warm"] if i > 12 else mats[accent]
            box(f"{name}_bar_{i:02d}", (x, xyz[1] - 0.045, xyz[2] - height * 0.26 + h / 2),
                (width * 0.018, 0.01, h), mat, "props", 0.002)
        box(f"{name}_reference", (xyz[0], xyz[1] - 0.046, xyz[2] + height * 0.23),
            (width * 0.72, 0.008, 0.008), mats["warm"], "props", 0.001)

    def rack_handles(prefix, x, y, z, width=1.1, height=2.0):
        for side in (-1, 1):
            sx = x + side * (width * 0.47)
            box(f"{prefix}_handle_{'L' if side < 0 else 'R'}",
                (sx, y - 0.40, z), (0.055, 0.07, height * 0.7),
                mats["brushed"], "props", 0.018)
        for yy in (-height * 0.42, height * 0.42):
            screw(f"{prefix}_mount_{str(yy).replace('.', '_')}_L", (x - width * 0.45, y - 0.43, z + yy))
            screw(f"{prefix}_mount_{str(yy).replace('.', '_')}_R", (x + width * 0.45, y - 0.43, z + yy))

    def premium_keyboard(prefix, xyz, width=3.25, white_keys=36):
        # Replace primitive keybed for the hero keyboard only.
        _delete_prefix((prefix,))
        x, y, z = xyz
        box(prefix, xyz, (width, 0.72, 0.2), mats["metal"], "hero", 0.055)
        spacing = (width - 0.24) / white_keys
        for i in range(white_keys):
            kx = x - (width - 0.24) / 2 + spacing * (i + 0.5)
            box(f"{prefix}_white_{i+1:02d}", (kx, y - 0.19, z + 0.125),
                (spacing * 0.92, 0.40, 0.05), mats["white"], "props", 0.006)
        # Correct 2-3 black-key grouping repeated by octave.
        black_offsets = (0.66, 1.72, 3.67, 4.68, 5.69)
        octave_w = spacing * 7
        octaves = max(1, int(white_keys / 7))
        index = 0
        for octave in range(octaves):
            base = x - (width - 0.24) / 2 + octave * octave_w
            for offset in black_offsets:
                kx = base + offset * spacing
                index += 1
                box(f"{prefix}_black_{index:02d}", (kx, y - 0.105, z + 0.175),
                    (spacing * 0.58, 0.255, 0.075), mats["rubber"], "props", 0.005)
        # control strip
        display(f"{prefix}_display", (x, y + 0.23, z + 0.17), width=0.64, height=0.16)
        for i, dx in enumerate((-0.72, -0.52, 0.52, 0.72)):
            knob(f"{prefix}_control_{i+1:02d}", (x + dx, y + 0.18, z + 0.18),
                 radius=0.032, accent=mats["accent"] if i % 2 else mats["warm"])
        for i, dx in enumerate((-1.22, -1.08)):
            box(f"{prefix}_wheel_{i+1:02d}", (x + dx, y + 0.12, z + 0.16),
                (0.08, 0.23, 0.07), mats["rubber"], "props", 0.025)

    def premium_drum_details(origin):
        ox, oy, oz = origin
        # hi-hat with two cymbals and pedal
        cylinder("hihat_stand", (ox - 0.88, oy - 0.14, oz + 0.69), 0.018, 1.38,
                 mats["brushed"], "props", vertices=16, bevel=0.004)
        for dz in (1.32, 1.37):
            cylinder(f"hihat_cymbal_{int(dz*100)}", (ox - 0.88, oy - 0.14, oz + dz),
                     0.29, 0.014, mats["warm"], "hero", vertices=48, bevel=0.003)
        box("hihat_pedal", (ox - 0.88, oy - 0.32, oz + 0.06),
            (0.15, 0.34, 0.045), mats["brushed"], "props", 0.014, rotation=(-0.16, 0, 0))
        # kick pedal and throne
        box("kick_pedal", (ox, oy - 0.52, oz + 0.10),
            (0.18, 0.36, 0.05), mats["brushed"], "props", 0.014, rotation=(-0.12, 0, 0))
        cylinder("drum_throne_post", (ox, oy + 0.88, oz + 0.36), 0.035, 0.68,
                 mats["brushed"], "furniture", vertices=18, bevel=0.006)
        cylinder("drum_throne_seat", (ox, oy + 0.88, oz + 0.73), 0.31, 0.12,
                 mats["fabric"], "furniture", vertices=40, bevel=0.025)
        # rims/lugs to make the kit read as manufactured hardware
        for drum, dx, dy, dz, radius in (
            ("snare", -0.58, -0.1, 0.72, 0.29),
            ("rack_tom_left", -0.28, 0.13, 1.05, 0.25),
            ("rack_tom_right", 0.28, 0.13, 1.07, 0.27),
            ("floor_tom", 0.65, 0.1, 0.68, 0.34),
        ):
            torus(f"drum_{drum}_rim", (ox + dx, oy + dy, oz + dz + 0.17),
                  radius * 0.94, 0.012, mats["brushed"], "props")
            for i in range(8):
                angle = i * math.tau / 8
                lx = ox + dx + math.cos(angle) * radius * 0.86
                ly = oy + dy + math.sin(angle) * radius * 0.86
                cylinder(f"drum_{drum}_lug_{i:02d}", (lx, ly, oz + dz),
                         0.012, 0.18, mats["brushed"], "props", vertices=12, bevel=0.002)

    def amplifier_details(prefix, x, y, z, width):
        # grill reveals speaker circles instead of a featureless slab
        for sx in (-width * 0.22, width * 0.22):
            cylinder(f"{prefix}_speaker_{'L' if sx < 0 else 'R'}",
                     (x + sx, y - 0.36, z - 0.18), width * 0.17, 0.018,
                     mats["rubber"], "props", rotation=(math.pi / 2, 0, 0),
                     vertices=44, bevel=0.004)
        box(f"{prefix}_handle", (x, y, z + 0.79), (width * 0.38, 0.18, 0.06),
            mats["rubber"], "props", 0.022)
        for i in range(7):
            kx = x - width * 0.34 + i * width * 0.112
            knob(f"{prefix}_premium_knob_{i+1:02d}", (kx, y - 0.405, z + 0.53),
                 0.036, mats["rubber"], mats["white"])
        sphere(f"{prefix}_status", (x + width * 0.40, y - 0.41, z + 0.54),
               0.016, mats["warm"], "props")

    def guitar_details(prefix, x, y, z, bass=False):
        # pickups, bridge, controls and strings establish instrument credibility
        box(f"{prefix}_bridge", (x, y - 0.075, z + 0.64),
            (0.26, 0.025, 0.055), mats["brushed"], "props", 0.006)
        pickup_z = (0.72, 0.86) if not bass else (0.74, 0.9)
        for i, pz in enumerate(pickup_z):
            box(f"{prefix}_pickup_{i+1:02d}", (x, y - 0.08, z + pz),
                (0.22, 0.025, 0.075), mats["rubber"], "props", 0.008)
        for i in range(2 if bass else 3):
            knob(f"{prefix}_control_{i+1:02d}",
                 (x + 0.16 + i * 0.07, y - 0.09, z + 0.56 + i * 0.05),
                 0.025, mats["brushed"], mats["warm"])
        strings = 4 if bass else 6
        for i in range(strings):
            sx = x - 0.018 * (strings - 1) / 2 + i * 0.018
            box(f"{prefix}_string_{i+1:02d}", (sx, y - 0.102, z + 1.25),
                (0.003, 0.004, 1.32 if bass else 1.18), mats["brushed"], "props", 0.001)
        for i in range(10):
            box(f"{prefix}_fret_{i+1:02d}", (x, y - 0.096, z + 1.12 + i * 0.07),
                (0.09, 0.004, 0.004), mats["brushed"], "props", 0.001)

    def hero_console_detail(prefix, x, y, z, width=5.5, channels=10):
        for i in range(channels):
            cx = x - width * 0.43 + i * (width * 0.86 / max(1, channels - 1))
            for k in range(3):
                knob(f"{prefix}_premium_ch{i+1:02d}_knob{k+1:02d}",
                     (cx, y - 0.37 + k * 0.15, z + 0.55 + k * 0.012),
                     0.026 if k != 1 else 0.031,
                     mats["brushed"] if k != 1 else mats["warm"], mats["white"])
            fader(f"{prefix}_premium_ch{i+1:02d}_fader",
                  (cx, y + 0.11, z + 0.49), 0.28, 0.18 + (i % 5) * 0.16,
                  mats["accent"] if i % 3 == 0 else mats["warm"])
            sphere(f"{prefix}_premium_ch{i+1:02d}_led",
                   (cx, y - 0.62, z + 0.57), 0.009,
                   mats["accent"] if i < channels - 2 else mats["red"], "props")
        display(f"{prefix}_bus_display", (x, y - 0.57, z + 0.82),
                width=min(1.65, width * 0.3), height=0.28, accent="accent")

    # Global architectural refinement: side reflection panels + low cove.
    for side in (-1, 1):
        sx = side * (cfg["width"] / 2 - 0.22)
        for i, yy in enumerate((-0.4, 1.25, 2.9, 4.55)):
            box(f"premium_side_panel_{'L' if side < 0 else 'R'}_{i+1:02d}",
                (sx, yy, 1.55), (0.12, 1.05, 1.55),
                mats["fabric_warm"] if i % 2 else mats["fabric"],
                "architecture", 0.055, rotation=(0, 0, side * 0.04))
        box(f"premium_cove_{'L' if side < 0 else 'R'}",
            (sx - side * 0.08, 1.2, 2.95), (0.025, 6.4, 0.035),
            mats["warm"], "lighting", 0.006)

    if room_key == "practice":
        premium_drum_details((0, 2.9, 0))
        amplifier_details("bass_stack", -3.25, 4.35, 0.82, 1.4)
        amplifier_details("guitar_combo", 3.3, 4.25, 0.78, 1.3)
        guitar_details("session_bass", -3.45, 0.95, 0, True)
        guitar_details("electric_guitar", 3.5, 0.9, 0, False)
        premium_keyboard("practice_keys", (2.35, 5.25, 1.05), 2.45, 29)
        # rehearsal mic stands and pedalboard
        for i, x in enumerate((-1.55, 1.58)):
            cylinder(f"practice_vocal_stand_{i+1}", (x, 1.15, 0.75), 0.022, 1.48,
                     mats["brushed"], "props", vertices=16, bevel=0.004)
            sphere(f"practice_vocal_mic_{i+1}", (x, 1.15, 1.55), 0.07,
                   mats["brushed"], "hero", scale=(0.72, 0.72, 1.1))
        box("practice_pedalboard", (2.8, 1.0, 0.08), (0.85, 0.46, 0.08),
            mats["metal"], "props", 0.035)
        for i in range(5):
            box(f"practice_pedal_{i+1:02d}", (2.52 + (i % 3) * 0.25, 0.88 + (i // 3) * 0.22, 0.15),
                (0.17, 0.16, 0.07), mats["accent"] if i == 1 else mats["brushed"], "props", 0.025)
        add_light("practice_band_key", "AREA", (0, 1.2, 3.15), (1.0, 0.56, 0.28, 1), 420, 3.2, (0, 2.7, 0.9))
        add_light("practice_drum_rim", "SPOT", (-2.8, 3.6, 2.8), (0.24, 0.65, 0.55, 1), 260, target=(0, 2.9, 1.0))
        add_camera("camera_instrument_detail", (2.8, -0.3, 1.55), (2.8, 1.4, 0.65), 58)

    elif room_key == "recording":
        premium_drum_details((-1.65, 3.2, 0))
        amplifier_details("tracking_amp", -3.65, 4.85, 0.78, 1.25)
        rack_handles("recording_front_end", 3.72, 4.75, 1.12, 1.28, 2.15)
        # Front end meter detail
        display("recording_front_end_display", (3.72, 4.34, 1.62), 0.72, 0.22, "warm")
        # overhead mic pair and room mic
        for i, (x, y, z) in enumerate(((-2.35, 3.0, 2.45), (-0.9, 3.0, 2.55), (0.15, 1.05, 1.9))):
            cylinder(f"recording_mic_stand_{i+1}", (x, y, z * 0.47), 0.018, z * 0.94,
                     mats["brushed"], "props", vertices=16, bevel=0.004)
            cylinder(f"recording_mic_body_{i+1}", (x, y, z), 0.055, 0.2,
                     mats["metal"], "hero", rotation=(0.15, 0, 0), vertices=32, bevel=0.012)
            sphere(f"recording_mic_capsule_{i+1}", (x, y, z + 0.13), 0.07,
                   mats["brushed"], "hero", scale=(0.82, 0.82, 1.1))
        # booth practical and patchbay
        add_light("vocal_booth_key", "AREA", (2.75, 2.45, 2.85), (1.0, 0.66, 0.38, 1), 230, 1.5, (2.5, 2.1, 1.55))
        box("recording_patchbay", (3.72, 4.32, 0.52), (0.96, 0.055, 0.18),
            mats["brushed"], "hero", 0.015)
        for i in range(16):
            cylinder(f"recording_patch_{i+1:02d}", (3.33 + i * 0.052, 4.285, 0.52),
                     0.012, 0.02, mats["rubber"], "props", rotation=(math.pi / 2,0,0), vertices=12, bevel=0.002)
        add_camera("camera_vocal_close", (1.05, -0.2, 1.72), (2.5, 2.1, 1.62), 58)

    elif room_key == "production":
        premium_keyboard("studio_keyboard", (0, 1.18, 1.02), 3.65, 36)
        for side, x in (("left", -3.22), ("right", 3.22)):
            rack_handles(f"synth_rack_{side}", x, 3.65, 1.32, 1.55, 2.55)
            display(f"synth_{side}_display", (x, 3.215, 2.24), 0.76, 0.21,
                    "accent" if side == "left" else "warm")
            for i in range(4):
                fader(f"synth_{side}_macro_{i+1}", (x - 0.36 + i * 0.24, 3.19, 0.57),
                      0.18, 0.2 + i * 0.18, mats["accent"] if side == "left" else mats["warm"])
        # groovebox and desktop control surface
        box("production_groovebox", (1.9, 0.92, 1.17), (1.08, 0.65, 0.13),
            mats["metal"], "hero", 0.045, rotation=(-0.07, 0, -0.04))
        display("production_groovebox_display", (1.9, 0.60, 1.29), 0.48, 0.14, "warm")
        for r in range(2):
            for col in range(4):
                box(f"production_step_{r}_{col}", (1.62 + col * 0.18, 0.76 + r * 0.16, 1.31),
                    (0.11, 0.10, 0.035), mats["accent"] if (r+col)%3==0 else mats["rubber"], "props", 0.014)
        # nearfield monitor stands + secondary screen
        for side, x in (("left",-1.72),("right",1.72)):
            box(f"production_monitor_stand_{side}", (x, 2.08, 0.72), (0.12,0.38,1.25),
                mats["metal"], "furniture", 0.025)
            box(f"production_monitor_base_{side}", (x,2.08,0.1), (0.62,0.52,0.08),
                mats["rubber"], "furniture", 0.025)
        display("production_session_display", (0, 5.42, 2.2), 1.8, 0.65, "accent")
        add_light("production_desk_key", "AREA", (0, 0.1, 3.0), (1.0, 0.72, 0.48, 1), 520, 3.7, (0, 1.2, 1.05))
        add_light("production_synth_rim_left", "SPOT", (-3.8, 2.8, 2.8), (0.42,0.32,0.92,1), 240, target=(-3.22,3.65,1.35))
        add_light("production_synth_rim_right", "SPOT", (3.8, 2.8, 2.8), (0.34,0.72,0.78,1), 220, target=(3.22,3.65,1.35))
        add_camera("camera_keyboard_macro", (0, -0.15, 1.55), (0, 1.18, 1.08), 62)

    elif room_key == "mix":
        hero_console_detail("mix_console", 0, 1.15, 1.0, 6.25, 14)
        rack_handles("mix_dynamics_rack", -3.65, 3.85, 1.12, 1.3, 2.15)
        rack_handles("mix_spatial_fx_rack", 3.65, 3.85, 1.12, 1.3, 2.15)
        # nearfield pair inside the mains
        speaker("mix_nearfield_left", (-1.15, 4.35, 1.42), mats, 0.62, 0.04)
        speaker("mix_nearfield_right", (1.15, 4.35, 1.42), mats, 0.62, -0.04)
        display("mix_center_display", (0, 5.49, 2.19), 1.9, 0.46, "accent")
        # meter bridge hardware fasteners
        for i in range(8):
            x = -1.48 + i * 0.42
            screw(f"mix_meter_bridge_screw_{i+1:02d}", (x, 5.56, 2.64))
        add_light("mix_console_key", "AREA", (0, 0.0, 3.0), (1.0,0.72,0.47,1), 500, 4.0, (0,1.2,1.0))
        add_light("mix_monitor_rim_left", "SPOT", (-3.0,3.55,2.9), (0.32,0.62,0.75,1), 250, target=(-2.45,5.15,1.48))
        add_light("mix_monitor_rim_right", "SPOT", (3.0,3.55,2.9), (0.95,0.55,0.25,1), 230, target=(2.45,5.15,1.48))
        add_camera("camera_console_macro", (0,-0.45,1.82), (0,1.15,1.1), 60)

    # Shared low-level practicals for depth.
    for i, x in enumerate((-cfg["width"] * 0.32, 0, cfg["width"] * 0.32)):
        add_light(f"premium_floor_practical_{i+1:02d}", "POINT",
                  (x, 4.8, 0.24), cfg["warm"], 38, 1.0, (x,4.8,1.2))
