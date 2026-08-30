# Noble Woman — Local Blender Renderer
# Blender 4.x
# Run with:
#   blender --background --python noble_woman_renderer.py
# Or open Blender > Scripting > Open this file > Run Script.
#
# Produces: noble_woman_render.png
#
# This is a fully procedural stylized 3D character scene. It does not require
# external character assets. For a more realistic production character,
# replace the generated body with a scanned/rigged mesh while keeping the
# clothing, lighting and camera setup.

import bpy, math
from mathutils import Vector

# ----------------------------
# Scene
# ----------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 768
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = "//noble_woman_render.png"
scene.render.film_transparent = False

# Color management
scene.view_settings.look = 'AgX - Medium High Contrast'

# ----------------------------
# Materials
# ----------------------------
def mat(name, color, metallic=0.0, roughness=0.45):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*color, 1)
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Roughness"].default_value = roughness
    return m

skin = mat("Warm olive skin", (0.48, 0.25, 0.15), 0, 0.42)
ivory = mat("Ivory silk", (0.72, 0.67, 0.56), 0, 0.30)
robe = mat("Champagne robe", (0.50, 0.46, 0.38), 0, 0.38)
gold = mat("Antique gold", (0.72, 0.47, 0.12), 0.78, 0.20)
hair = mat("Dark brown hair", (0.025, 0.012, 0.008), 0, 0.30)
shoe = mat("Gold satin shoes", (0.48, 0.34, 0.17), 0.25, 0.25)
dark = mat("Backdrop", (0.025, 0.020, 0.018), 0, 0.65)

# ----------------------------
# Helpers
# ----------------------------
def uv_sphere(name, loc, scale, material, segments=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, location=loc
    )
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def cyl(name, loc, radius, depth, material, vertices=48, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth,
        location=loc, rotation=rotation or (0,0,0)
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o

def curve_tube(name, points, radius, material, bevel=0.06):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 4
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(points)-1)
    for p, co in zip(sp.bezier_points, points):
        p.co = co
        p.handle_left_type = p.handle_right_type = "AUTO"
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material)
    return ob

# ----------------------------
# Body (stylized high-fashion proportions)
# ----------------------------
# Feet / legs
for x in (-0.18, 0.18):
    cyl("Lower leg", (x,0,1.00), 0.105, 1.55, skin)
    uv_sphere("Foot", (x, -0.07, 0.25), (0.17,0.30,0.09), skin)

# torso
uv_sphere("Torso", (0,0,2.15), (0.43,0.25,0.72), skin)
uv_sphere("Hips", (0,0,1.55), (0.42,0.27,0.32), skin)

# neck + head
cyl("Neck", (0,0,2.95), 0.13, 0.30, skin)
uv_sphere("Head", (0,0,3.45), (0.29,0.25,0.38), skin)

# face shaping
uv_sphere("Nose", (0,-0.245,3.48), (0.045,0.065,0.10), skin)
uv_sphere("Left cheek", (-0.13,-0.22,3.37), (0.10,0.055,0.11), skin)
uv_sphere("Right cheek", (0.13,-0.22,3.37), (0.10,0.055,0.11), skin)

# eyes
eye = mat("Eye", (0.025,0.018,0.012), 0, 0.18)
for x in (-0.105, 0.105):
    uv_sphere("Eye", (x,-0.255,3.54), (0.038,0.020,0.025), eye)

# arms
for x, side in [(-0.55,-1),(0.55,1)]:
    curve_tube(
        "Arm",
        [(x*0.75,0,2.55),(x,0,2.18),(x*1.12,-0.02,1.72)],
        0.105, skin
    )
    uv_sphere("Hand", (x*1.12,-0.02,1.62), (0.10,0.08,0.17), skin)

# hair mass + bun
uv_sphere("Hair", (0,0.05,3.64), (0.34,0.29,0.40), hair)
uv_sphere("Hair bun", (0.04,0.12,3.88), (0.22,0.20,0.23), hair)

# ----------------------------
# Dress
# ----------------------------
# Main fitted gown as stacked tapered cones
bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=0.28, radius2=0.39, depth=1.45, location=(0,-0.01,2.18))
gown = bpy.context.object
gown.name = "Ivory column gown"
gown.data.materials.append(ivory)
bpy.ops.object.shade_smooth()

# neckline / high collar
cyl("High collar", (0,-0.005,2.91), 0.145, 0.16, ivory)

# robe panels: long open flowing shapes
def robe_panel(x, side):
    bpy.ops.mesh.primitive_cone_add(
        vertices=64, radius1=0.22, radius2=0.28, depth=2.55,
        location=(x,0.08,1.52)
    )
    p = bpy.context.object
    p.name = "Flowing robe"
    p.scale.x = 0.65
    p.scale.y = 0.28
    p.data.materials.append(robe)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    return p

robe_panel(-0.42,-1)
robe_panel(0.42,1)

# decorative gold borders
for x in (-0.43, 0.43):
    curve_tube(
        "Gold robe trim",
        [(x,-0.19,2.78),(x,-0.19,2.10),(x*1.05,-0.19,0.28)],
        0.018, gold
    )

# waist chain
curve_tube("Waist gold chain",
           [(-0.34,-0.28,2.46),(0,-0.30,2.40),(0.34,-0.28,2.46)],
           0.018, gold)

# necklace
curve_tube("Long necklace",
           [(-0.12,-0.28,2.82),(0,-0.31,2.42),(0.12,-0.28,2.82)],
           0.012, gold)

# pendant
uv_sphere("Pendant", (0,-0.325,2.39), (0.045,0.018,0.07), gold)

# earrings
for x in (-0.29,0.29):
    uv_sphere("Earring", (x,-0.22,3.40), (0.035,0.018,0.07), gold)

# shoes / heels
for x in (-0.18,0.18):
    uv_sphere("Shoe", (x,-0.12,0.18), (0.17,0.30,0.075), shoe)
    cyl("Heel", (x,0.04,0.08), 0.035, 0.20, shoe)

# ----------------------------
# Ground + backdrop
# ----------------------------
bpy.ops.mesh.primitive_plane_add(size=20, location=(0,0,0))
floor = bpy.context.object
floor.name = "Studio floor"
floor.data.materials.append(dark)

# curved-ish backdrop wall
bpy.ops.mesh.primitive_plane_add(size=20, location=(0,2.8,5), rotation=(math.radians(90),0,0))
back = bpy.context.object
back.name = "Backdrop"
back.data.materials.append(dark)

# ----------------------------
# Lighting
# ----------------------------
def area(name, loc, energy, size, rotation=(0,0,0)):
    bpy.ops.object.light_add(type="AREA", location=loc, rotation=rotation)
    l = bpy.context.object
    l.name = name
    l.data.energy = energy
    l.data.shape = "DISK"
    l.data.size = size
    return l

area("Key softbox", (-3.5,-4.0,5.2), 850, 3.0, (math.radians(25),0,math.radians(-35)))
area("Fill", (3.0,-2.5,3.4), 420, 2.5, (math.radians(70),0,math.radians(125)))
area("Rim", (0.5,2.0,5.5), 1000, 2.0, (math.radians(-25),0,math.radians(180)))

# ----------------------------
# Camera
# ----------------------------
bpy.ops.object.camera_add(location=(0,-7.2,2.25))
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 58

def point_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z','Y').to_euler()

point_at(cam, (0,0,2.05))

# Slightly cinematic depth of field
cam.data.dof.use_dof = True
cam.data.dof.focus_object = bpy.data.objects.get("Head")
cam.data.dof.aperture_fstop = 5.6

# ----------------------------
# Render
# ----------------------------
bpy.ops.wm.save_as_mainfile(filepath="//noble_woman_scene.blend")
bpy.ops.render.render(write_still=True)
print("DONE: noble_woman_render.png and noble_woman_scene.blend")
