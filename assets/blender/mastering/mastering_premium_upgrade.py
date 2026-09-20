"""Final jewelry-grade upgrade for the mastering benchmark room."""

from __future__ import annotations

import math


def apply_mastering_premium_upgrade(api):
    box=api["box"]; cylinder=api["cylinder"]; torus=api["torus"]; screw=api["screw"]; knob=api["knob"]; led=api["led"]
    add_light=api["add_light"]; add_camera=api["add_camera"]
    walnut=api["walnut"]; walnut_edge=api["walnut_edge"]; dark_metal=api["dark_metal"]; painted_metal=api["painted_metal"]
    brushed=api["brushed"]; brass=api["brass"]; fabric=api["fabric"]; rubber=api["rubber"]; ivory=api["ivory"]
    led_green=api["led_green"]; led_amber=api["led_amber"]; led_red=api["led_red"]; led_blue=api["led_blue"]
    console_collection=api["console_collection"]; monitor_collection=api["monitor_collection"]; rack_collection=api["rack_collection"]
    architecture=api["architecture"]; furniture_collection=api["furniture_collection"]; props_collection=api["props_collection"]
    lighting_collection=api["lighting_collection"]; camera_collection=api["camera_collection"]

    # Control-surface tick marks, fader scales, hardware seams.
    section_centres=(-2.22,-1.12,0.0,1.12,2.22)
    for s,x in enumerate(section_centres):
        for k,dx in enumerate((-0.28,0.0,0.28)):
            radius=0.058 if k==1 else 0.049
            for i in range(9):
                angle=math.radians(-115+i*28.75)
                tx=x+dx+math.sin(angle)*radius*1.42
                tz=1.34+math.cos(angle)*radius*1.42
                box(f"master_tick_{s}_{k}_{i}",(0.007,0.01,0.018),(tx,0.68,tz),ivory,console_collection,bevel=0.001,rotation=(0,-angle,0))
        for i in range(7):
            yy=0.94+i*0.055
            box(f"master_fader_scale_{s}_{i}",(0.025,0.005,0.006),(x+0.19,yy,1.315),brushed,console_collection,bevel=0.001)
        # section divider/groove
        if s<4:
            box(f"master_section_divider_{s}",(0.012,1.02,0.022),(x+0.55,0.96,1.285),brass,console_collection,bevel=0.002)

    # More believable monitor drivers and plinths.
    for side,x in (("left",-2.28),("right",2.28)):
        cylinder(f"main_monitor_{side}_dustcap",0.095,0.035,(x,4.665,1.14),brushed,monitor_collection,vertices=40,rotation=(math.pi/2,0,0),bevel=0.006)
        torus(f"main_monitor_{side}_waveguide",0.18,0.022,(x,4.675,1.85),painted_metal,monitor_collection,rotation=(math.pi/2,0,0))
        box(f"main_monitor_{side}_plinth",(0.82,0.62,0.09),(x,5.22,0.48),rubber,furniture_collection,bevel=0.035)
        box(f"main_monitor_{side}_stand",(0.14,0.35,0.82),(x,5.22,0.89),dark_metal,furniture_collection,bevel=0.025)

    # Rack pull handles, faceplate separators, and additional metering detail.
    for rack_name,x in (("eq_rack",-3.25),("dynamics_rack",3.25)):
        for side in (-1,1):
            box(f"{rack_name}_pull_{side}",(0.05,0.08,1.72),(x+side*0.52,3.53,1.22),brushed,rack_collection,bevel=0.018)
        for i in range(5):
            z=0.36+i*0.43
            box(f"{rack_name}_separator_{i}",(0.96,0.01,0.008),(x,3.535,z+0.17),brass,rack_collection,bevel=0.001)
            screw(f"{rack_name}_fine_screw_L_{i}",(x-0.46,3.535,z),rack_collection,brushed)
            screw(f"{rack_name}_fine_screw_R_{i}",(x+0.46,3.535,z),rack_collection,brushed)

    # Reference monitor meter bridge: center reference scale and side status clusters.
    for i in range(11):
        xx=-1.2+i*0.24
        box(f"meter_scale_tick_{i:02d}",(0.012,0.01,0.055),(xx,5.61,2.48),ivory,console_collection,bevel=0.001)
    for i,x in enumerate((-1.48,-1.37,1.37,1.48)):
        led(f"meter_status_{i+1}",(x,5.59,2.28),led_green if i<2 else led_amber,console_collection,radius=0.012,rotation=(0,0,0))

    # Architectural jewelry: timber side fins and low cove light.
    for side in (-1,1):
        x=side*3.82
        for i,y in enumerate((-0.7,0.25,1.2,2.15,3.1,4.05)):
            box(f"master_side_fin_{side}_{i}",(0.08,0.62,1.75),(x,y,1.62),walnut_edge,architecture,bevel=0.022,rotation=(0,0,side*0.035))
        box(f"master_low_cove_{side}",(0.025,6.6,0.035),(x-side*0.09,1.55,0.22),brass,lighting_collection,bevel=0.006)

    # Desk grommets / tactile details.
    for i,x in enumerate((-1.45,-0.75,0.75,1.45)):
        cylinder(f"mastering_desk_grommet_{i+1}",0.055,0.025,(x,0.7,0.875),rubber,props_collection,vertices=28,bevel=0.006)
    box("mastering_foot_rail",(3.2,0.09,0.09),(0,-0.08,0.34),brushed,furniture_collection,bevel=0.028)

    # Restrained product-light accents.
    add_light("master_console_rim","AREA",(0,1.7,2.35),(0.82,0.56,0.28),240,lighting_collection,target=(0,1.0,1.15),size=2.6)
    add_light("master_left_rack_rim","SPOT",(-3.45,2.65,2.7),(0.28,0.52,0.72),180,lighting_collection,target=(-3.25,4.0,1.2),spot_size=0.5)
    add_light("master_right_rack_rim","SPOT",(3.45,2.65,2.7),(0.92,0.48,0.2),175,lighting_collection,target=(3.25,4.0,1.2),spot_size=0.5)

    add_camera("camera_macro_controls",(0,-0.15,1.7),(0,1.05,1.28),camera_collection,65)
    add_camera("camera_macro_meter",(0,3.6,2.15),(0,5.7,2.05),camera_collection,70)
