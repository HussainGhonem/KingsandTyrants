import bpy
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "assets" / "blender" / "female-character-cc0" / "female-character-cc0.blend"
OUT = ROOT / "portraits"

VARIANTS = {
    "victor_vance": {"hair": (0.02, 0.01, 0.006, 1), "kjol": (0.08, 0.12, 0.18, 1), "tröja": (0.12, 0.16, 0.24, 1)},
    "duchess_elena": {"hair": (0.06, 0.02, 0.01, 1), "kjol": (0.38, 0.22, 0.12, 1), "tröja": (0.55, 0.40, 0.24, 1)},
    "lord_kravitz": {"hair": (0.01, 0.01, 0.01, 1), "kjol": (0.20, 0.03, 0.04, 1), "tröja": (0.28, 0.05, 0.06, 1)},
}

def set_material_color(name, color):
    material = bpy.data.materials.get(name)
    if not material:
        return
    material.diffuse_color = color
    if material.use_nodes:
        shader = material.node_tree.nodes.get("Principled BSDF")
        if shader:
            shader.inputs["Base Color"].default_value = color

def render_variant(character_id, colors):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_percentage = 50
    scene.render.filepath = str(OUT / f"{character_id}_render.png")
    for material_name, color in colors.items():
        set_material_color(material_name, color)
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {character_id} -> {scene.render.filepath}")

OUT.mkdir(exist_ok=True)
for character_id, colors in VARIANTS.items():
    render_variant(character_id, colors)
