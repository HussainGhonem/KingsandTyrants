# Batch Character Renderer for Kings & Tyrants
# Generates Blender renders for multiple characters with customizable styles
# Run with: blender --background --python batch_character_renderer.py

import bpy, math, os, json
from mathutils import Vector
from pathlib import Path

# ----------------------------
# Configuration
# ----------------------------
PROJECT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = PROJECT_DIR / "portraits"
OUTPUT_DIR.mkdir(exist_ok=True)

# Character templates (modify to match your game characters)
CHARACTERS = [
    {
        "id": "victor_vance",
        "name": "Victor Vance",
        "type": "male",
        "skin": (0.48, 0.25, 0.15),
        "hair": (0.025, 0.012, 0.008),
        "outfit": "formal_coat",
        "accent": (0.72, 0.47, 0.12),
    },
    {
        "id": "duchess_elena",
        "name": "Duchess Elena",
        "type": "female",
        "skin": (0.52, 0.35, 0.22),
        "hair": (0.15, 0.08, 0.04),
        "outfit": "ivory_gown",
        "accent": (0.72, 0.47, 0.12),
    },
    {
        "id": "lord_kravitz",
        "name": "Lord Kravitz",
        "type": "male",
        "skin": (0.42, 0.20, 0.10),
        "hair": (0.10, 0.08, 0.06),
        "outfit": "military_formal",
        "accent": (0.60, 0.50, 0.30),
    },
]

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

# ----------------------------
# Mesh Helpers
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
# Character Renderer
# ----------------------------
def render_character(char_data):
    """Generate a single character render"""
    
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False, confirm=False)
    bpy.ops.outliner.orphans_purge()
    
    scene = bpy.context.scene
    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    # Blender 5.2 exposes the Eevee engine as BLENDER_EEVEE.
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.image_settings.file_format = 'PNG'
    
    # Materials
    skin_color = char_data.get("skin", (0.48, 0.25, 0.15))
    hair_color = char_data.get("hair", (0.025, 0.012, 0.008))
    accent_color = char_data.get("accent", (0.72, 0.47, 0.12))
    
    skin = mat("Skin", skin_color, 0, 0.42)
    hair = mat("Hair", hair_color, 0, 0.30)
    gold = mat("Gold", accent_color, 0.78, 0.20)
    dark = mat("Backdrop", (0.025, 0.020, 0.018), 0, 0.65)
    
    # Choose outfit materials
    if char_data["type"] == "female":
        body_material = mat("Dress", (0.72, 0.67, 0.56), 0, 0.30)
        robe_material = mat("Robe", (0.50, 0.46, 0.38), 0, 0.38)
    else:
        body_material = mat("Coat", (0.18, 0.20, 0.25), 0, 0.35)
        robe_material = mat("Vest", (0.15, 0.10, 0.08), 0, 0.40)
    
    shoe = mat("Shoes", (0.48, 0.34, 0.17), 0.25, 0.25)
    eye = mat("Eye", (0.025, 0.018, 0.012), 0, 0.18)
    
    # ------- BODY -------
    # Legs
    for x in (-0.18, 0.18):
        cyl("Leg", (x, 0, 1.00), 0.105, 1.55, skin)
        uv_sphere("Foot", (x, -0.07, 0.25), (0.17, 0.30, 0.09), skin)
    
    # Torso
    uv_sphere("Torso", (0, 0, 2.15), (0.43, 0.25, 0.72), skin)
    uv_sphere("Hips", (0, 0, 1.55), (0.42, 0.27, 0.32), skin)
    
    # Neck + Head
    cyl("Neck", (0, 0, 2.95), 0.13, 0.30, skin)
    uv_sphere("Head", (0, 0, 3.45), (0.29, 0.25, 0.38), skin)
    
    # Face
    uv_sphere("Nose", (0, -0.245, 3.48), (0.045, 0.065, 0.10), skin)
    uv_sphere("Left cheek", (-0.13, -0.22, 3.37), (0.10, 0.055, 0.11), skin)
    uv_sphere("Right cheek", (0.13, -0.22, 3.37), (0.10, 0.055, 0.11), skin)
    
    # Eyes
    for x in (-0.105, 0.105):
        uv_sphere("Eye", (x, -0.255, 3.54), (0.038, 0.020, 0.025), eye)
    
    # Arms
    for x, side in [(-0.55, -1), (0.55, 1)]:
        curve_tube(
            "Arm",
            [(x*0.75, 0, 2.55), (x, 0, 2.18), (x*1.12, -0.02, 1.72)],
            0.105, skin
        )
        uv_sphere("Hand", (x*1.12, -0.02, 1.62), (0.10, 0.08, 0.17), skin)
    
    # Hair
    uv_sphere("Hair", (0, 0.05, 3.64), (0.34, 0.29, 0.40), hair)
    uv_sphere("Hair bun", (0.04, 0.12, 3.88), (0.22, 0.20, 0.23), hair)
    
    # ------- OUTFIT -------
    if char_data["type"] == "female":
        # Ivory gown
        bpy.ops.mesh.primitive_cone_add(
            vertices=64, radius1=0.28, radius2=0.39, depth=1.45,
            location=(0, -0.01, 2.18)
        )
        gown = bpy.context.object
        gown.name = "Gown"
        gown.data.materials.append(body_material)
        bpy.ops.object.shade_smooth()
        
        # High collar
        cyl("Collar", (0, -0.005, 2.91), 0.145, 0.16, body_material)
        
        # Robe panels
        for x in (-0.42, 0.42):
            bpy.ops.mesh.primitive_cone_add(
                vertices=64, radius1=0.22, radius2=0.28, depth=2.55,
                location=(x, 0.08, 1.52)
            )
            p = bpy.context.object
            p.name = "Robe"
            p.scale.x = 0.65
            p.scale.y = 0.28
            p.data.materials.append(robe_material)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            bpy.ops.object.shade_smooth()
        
        # Gold trim
        for x in (-0.43, 0.43):
            curve_tube(
                "Gold trim",
                [(x, -0.19, 2.78), (x, -0.19, 2.10), (x*1.05, -0.19, 0.28)],
                0.018, gold
            )
        
        # Jewelry
        curve_tube("Chain", [(-0.34, -0.28, 2.46), (0, -0.30, 2.40), (0.34, -0.28, 2.46)], 0.018, gold)
        curve_tube("Necklace", [(-0.12, -0.28, 2.82), (0, -0.31, 2.42), (0.12, -0.28, 2.82)], 0.012, gold)
        uv_sphere("Pendant", (0, -0.325, 2.39), (0.045, 0.018, 0.07), gold)
        
        for x in (-0.29, 0.29):
            uv_sphere("Earring", (x, -0.22, 3.40), (0.035, 0.018, 0.07), gold)
    else:
        # Male coat
        bpy.ops.mesh.primitive_cone_add(
            vertices=64, radius1=0.30, radius2=0.40, depth=1.60,
            location=(0, 0, 2.05)
        )
        coat = bpy.context.object
        coat.name = "Coat"
        coat.data.materials.append(body_material)
        bpy.ops.object.shade_smooth()
        
        # Vest
        cyl("Vest", (0, -0.02, 2.30), 0.25, 0.55, robe_material)
    
    # Shoes (both genders)
    for x in (-0.18, 0.18):
        uv_sphere("Shoe", (x, -0.12, 0.18), (0.17, 0.30, 0.075), shoe)
        cyl("Heel", (x, 0.04, 0.08), 0.035, 0.20, shoe)
    
    # ------- ENVIRONMENT -------
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    floor = bpy.context.object
    floor.name = "Floor"
    floor.data.materials.append(dark)
    
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 2.8, 5), rotation=(math.radians(90), 0, 0))
    back = bpy.context.object
    back.name = "Backdrop"
    back.data.materials.append(dark)
    
    # ------- LIGHTING -------
    def area(name, loc, energy, size, rotation=(0, 0, 0)):
        bpy.ops.object.light_add(type="AREA", location=loc, rotation=rotation)
        l = bpy.context.object
        l.name = name
        l.data.energy = energy
        l.data.shape = "DISK"
        l.data.size = size
        return l
    
    area("Key", (-3.5, -4.0, 5.2), 850, 3.0, (math.radians(25), 0, math.radians(-35)))
    area("Fill", (3.0, -2.5, 3.4), 420, 2.5, (math.radians(70), 0, math.radians(125)))
    area("Rim", (0.5, 2.0, 5.5), 1000, 2.0, (math.radians(-25), 0, math.radians(180)))
    
    # ------- CAMERA -------
    bpy.ops.object.camera_add(location=(0, -7.2, 2.25))
    cam = bpy.context.object
    scene.camera = cam
    cam.data.lens = 58
    
    def point_at(obj, target):
        direction = Vector(target) - obj.location
        obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    
    point_at(cam, (0, 0, 2.05))
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 5.6
    
    # ------- RENDER -------
    output_path = str(OUTPUT_DIR / f"{char_data['id']}_render.png")
    scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)
    print(f"✓ Rendered {char_data['name']} → {output_path}")

# ----------------------------
# Main Batch Render
# ----------------------------
if __name__ == "__main__":
    print(f"Starting batch character render to {OUTPUT_DIR}")
    print(f"Characters: {len(CHARACTERS)}")
    
    for char in CHARACTERS:
        render_character(char)
    
    print(f"\n✓ Batch render complete! All {len(CHARACTERS)} characters rendered to {OUTPUT_DIR}")
