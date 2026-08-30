# Blender Character Rendering - Quick Start

## What's New

Your game now has a **Hybrid Portrait System** that seamlessly blends:
- **Canvas portraits** (real-time, always available)
- **Blender 3D renders** (professional quality, pre-generated)

The system automatically tries to load high-quality Blender renders first, then falls back to canvas if they're not available.

---

## Step 1: Install Blender (if needed)

Download Blender 4.x from [blender.org](https://blender.org/download/)

Verify installation:
```bash
blender --version
```

---

## Step 2: Generate Character Renders

### Option A: Single Character (noble_woman_renderer.py)
```bash
cd "C:\Users\hussa\OneDrive\Desktop\KingsandTyrants game"
blender --background --python noble_woman_renderer.py
```

Output:
- `noble_woman_render.png` (768×1024px)
- `noble_woman_scene.blend` (editable Blender file)

### Option B: Batch Render Multiple Characters
```bash
blender --background --python batch_character_renderer.py
```

Output:
- `portraits/victor_vance_render.png`
- `portraits/duchess_elena_render.png`
- `portraits/lord_kravitz_render.png`
- (Add more characters to `CHARACTERS` list in the script)

---

## Step 3: Set Up Game Integration

### In your `index.html`, add before closing `</body>`:

```html
<!-- Portrait System -->
<script src="portraitSystem.js"></script>
<script>
    // Initialize on game start
    document.addEventListener('DOMContentLoaded', () => {
        initPortraitSystem({
            portraitCachePath: './portraits/',
            useBlenderRenders: true
        });
    });
</script>
```

### Update character modal opening in `actions.js`:

Replace your existing `openCharModal` function call with:

```javascript
// Change this:
// openCharModal(${c.id})

// To this:
// openCharModalWithPortrait(${c.id})
```

Or update the existing openCharModal function to use portraitSystem:

```javascript
function openCharModal(id) {
    const c = game.characters.find(x => x.id === id);
    if (!c) return;

    const modelScene = document.getElementById('char-model-scene');
    if (modelScene && portraitSystem) {
        portraitSystem.getPortraitHTML(c).then(html => {
            modelScene.innerHTML = html;
            
            // Draw canvas if it's the fallback
            const canvas = modelScene.querySelector('.portrait-canvas');
            if (canvas && typeof drawCharacterPortrait === 'function') {
                requestAnimationFrame(() => drawCharacterPortrait(canvas, c));
            }
        });
    }

    // ... rest of modal population ...
}
```

---

## Step 4: Customize Characters

### Edit `batch_character_renderer.py` to add/modify characters:

```python
CHARACTERS = [
    {
        "id": "your_character_id",        # Must match game character ID
        "name": "Character Name",          # Display name
        "type": "male" or "female",        # Body type
        "skin": (0.48, 0.25, 0.15),       # RGB 0-1 (skin tone)
        "hair": (0.025, 0.012, 0.008),    # RGB 0-1 (hair color)
        "outfit": "ivory_gown",            # Preset outfit
        "accent": (0.72, 0.47, 0.12),     # RGB 0-1 (jewelry/trim color)
    },
]
```

### Color Reference (RGB values 0-1):
- **Skin tones**: Light (0.65, 0.55, 0.45) → Dark (0.25, 0.12, 0.08)
- **Hair colors**: Blonde (0.80, 0.60, 0.20) → Black (0.03, 0.02, 0.01)
- **Gold accents**: (0.72, 0.47, 0.12)
- **Silver accents**: (0.80, 0.80, 0.75)

---

## Step 5: Test the Integration

1. **Run batch renderer**:
   ```bash
   blender --background --python batch_character_renderer.py
   ```

2. **Check output**:
   - Verify `portraits/` folder has PNG files
   - Example: `portraits/victor_vance_render.png`

3. **Start your game**:
   - Open `index.html` in browser
   - Click on a character in the court list
   - Character modal should show Blender render (or canvas fallback)

---

## Troubleshooting

### "Cannot find module bpy"
- Make sure to use Blender's Python: `blender --background --python script.py`
- Not: `python script.py` or `python3 script.py`

### Renders not appearing in game
1. Check browser console for errors: `F12` → Console
2. Verify file paths:
   - Blender output: `portraits/character_id_render.png`
   - Game expects: `./portraits/character_id_render.png`
3. Check file permissions (make sure portraits folder is readable)

### Low render quality
- Increase resolution in renderer:
  ```python
  scene.render.resolution_x = 1024  # Up from 768
  scene.render.resolution_y = 1365  # Up from 1024
  ```
- Note: Higher resolution = longer render times

### Slow rendering
- Reduce resolution for faster tests
- Render only needed characters
- Use headless mode (faster than GUI): `blender --background`

---

## Advanced: Custom Outfit Builder

To create unique outfits, modify the outfit section in `batch_character_renderer.py`:

```python
# Example: Add ornate jewelry
curve_tube("Crown",
           [(-0.15, -0.10, 3.65), (0, -0.18, 3.75), (0.15, -0.10, 3.65)],
           0.025, gold)

# Example: Add military decorations
uv_sphere("Medal", (0, -0.15, 2.45), (0.08, 0.08, 0.03), gold)
```

---

## File Structure

```
KingsandTyrants game/
├── index.html                          # Main game page
├── actions.js                          # Game logic
├── portraitSystem.js                   # NEW: Hybrid portrait loader
├── noble_woman_renderer.py             # Single character renderer
├── batch_character_renderer.py         # Batch renderer
├── BLENDER_RENDER_GUIDE.md             # Full documentation
├── BLENDER_QUICKSTART.md               # This file
└── portraits/                          # NEW: Output folder for renders
    ├── victor_vance_render.png
    ├── duchess_elena_render.png
    └── ...
```

---

## Performance Tips

1. **Pre-render during development**, use cached images in production
2. **Limit number of characters** - render only NPCs that need high quality
3. **Use canvas portraits for minor NPCs** (soldiers, merchants)
4. **Blender renders for important characters** (family, rivals, nobles)

Example smart loading:
```javascript
// Only preload renders for high-importance characters
const importantChars = game.characters.filter(c => c.importance >= 7);
portraitSystem.preloadCharacterPortraits(importantChars);
```

---

## Next Steps

1. ✅ Install Blender
2. ✅ Generate renders with batch_character_renderer.py
3. ✅ Add portraitSystem.js to your game
4. ✅ Update character modal to use new system
5. ✅ Test in browser
6. ✅ Customize character colors/outfits as needed

---

**Questions?** Check BLENDER_RENDER_GUIDE.md for detailed customization options.
