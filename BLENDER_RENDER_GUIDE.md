# Blender Character Rendering Integration Guide

## Overview
The `noble_woman_renderer.py` script generates production-quality 3D character portraits using Blender's EEVEE renderer. This provides high-fidelity full-body character renders for your game.

## Requirements
- Blender 4.x+ (download from [blender.org](https://www.blender.org/download/))
- Python 3.10+ (Blender includes its own Python)

## Quick Start

### Method 1: Command Line (Headless Rendering)
```bash
cd "C:\Users\hussa\OneDrive\Desktop\KingsandTyrants game"
blender --background --python noble_woman_renderer.py
```

This will:
- Generate `noble_woman_render.png` (768×1024)
- Create `noble_woman_scene.blend` (editable scene file)

### Method 2: Blender GUI
1. Open Blender
2. Go to **Scripting** workspace
3. Open `noble_woman_renderer.py`
4. Click **Run Script**
5. Check the console output for completion message

## Output
- **noble_woman_render.png**: Final portrait (transparent background optional)
- **noble_woman_scene.blend**: Full 3D scene for customization

## Customization

### Modify Colors
Edit the material definitions:
```python
skin = mat("Warm olive skin", (0.48, 0.25, 0.15), 0, 0.42)
#                               R     G     B     metallic roughness
```

### Adjust Outfit
Modify the dress section:
```python
# Change robe color
robe = mat("Champagne robe", (0.50, 0.46, 0.38), 0, 0.38)

# Adjust skirt length (depth parameter)
bpy.ops.mesh.primitive_cone_add(
    vertices=64, radius1=0.28, radius2=0.39, depth=1.45, location=(0,-0.01,2.18)
)
```

### Change Output Resolution
```python
scene.render.resolution_x = 768   # Width
scene.render.resolution_y = 1024  # Height
```

### Modify Lighting
```python
# Key light position and intensity
area("Key softbox", (-3.5,-4.0,5.2), 850, 3.0, ...)
#                   X    Y    Z       energy  size
```

## Integration with Game UI

### Display Rendered Image in Character Modal
Once you have a rendered PNG, update your character modal in `ui.js`:

```javascript
if (modelScene) {
    // Option 1: Use Blender render if available
    const blenderImage = `portraits/${c.id}_render.png`;
    const img = document.createElement('img');
    img.src = blenderImage;
    img.style.width = '100%';
    img.style.height = 'auto';
    img.onerror = () => {
        // Fallback to canvas render if image not found
        modelScene.innerHTML = renderCharacterModel(c);
        const portraitCanvas = modelScene.querySelector('.portrait-canvas');
        if (portraitCanvas) {
            requestAnimationFrame(() => drawCharacterPortrait(portraitCanvas, c));
        }
    };
    modelScene.appendChild(img);
}
```

### Create a Batch Rendering Script
Generate renders for multiple characters by extending the Python script:

```python
# For each character, adjust parameters and render
characters = [
    {"id": "victor", "skinTone": (0.48, 0.25, 0.15)},
    {"id": "elena", "skinTone": (0.52, 0.35, 0.22)},
]

for char in characters:
    # Modify materials based on char data
    scene.render.filepath = f"//{char['id']}_render.png"
    bpy.ops.render.render(write_still=True)
```

## Performance Tips

1. **Use headless rendering** for batch jobs (faster, no UI overhead)
2. **Reduce resolution** during development, increase for final renders
3. **Cache renders** in a `portraits/` folder and reference them
4. **Combine canvas + Blender**: Use canvas for quick previews, Blender for hero shots

## Troubleshooting

### "ModuleNotFoundError: No module named 'bpy'"
- Make sure you're using Blender's Python, not system Python
- Use the full Blender command: `blender --background --python script.py`

### Poor render quality
- Increase `scene.render.resolution_percentage` (currently 100%)
- Adjust EEVEE settings in the Blender scene
- Enable ray tracing in the render engine settings

### Script hangs on render
- Check system RAM (high-res renders need memory)
- Reduce resolution and try again
- Open `noble_woman_scene.blend` in Blender to diagnose

## Next Steps

1. **Render the base noble woman** character
2. **Customize outfit/colors** for different character types
3. **Create character variants** by adjusting face parameters
4. **Integrate into game UI** using the image display method above
5. **Set up batch rendering** for all NPCs in campaign

## File Structure
```
KingsandTyrants game/
├── noble_woman_renderer.py          # Generator script
├── noble_woman_scene.blend          # Output scene (after first render)
├── noble_woman_render.png           # Output image
├── portraits/                         # Store all character renders here
│   ├── victor_render.png
│   ├── elena_render.png
│   └── ...
└── BLENDER_RENDER_GUIDE.md          # This file
```
