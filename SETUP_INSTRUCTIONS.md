# Blender Installation Guide for Kings & Tyrants

## Good News: Your Game Works WITHOUT Blender!

The hybrid portrait system automatically falls back to **real-time canvas rendering** if Blender is not installed.

- ✅ **Canvas portraits** (what you have now) - Always available, renders in real-time
- 🎨 **Blender 3D renders** (optional) - Higher quality, requires separate install & render step

---

## Option 1: Use Canvas Portraits (No Installation Needed)

Your game currently displays beautiful full-body canvas portraits in characters' modal windows. This is the **default behavior** and requires no setup.

**To verify it's working:**
1. Open `index.html` in your browser
2. Click on a character card in the court list
3. You should see the full-body portrait rendered in the modal

### No additional setup needed! ✓

---

## Option 2: Install Blender for Premium 3D Renders (Advanced)

If you want high-quality 3D character renders, here's how to set up Blender:

### Step 1: Download Blender
1. Visit https://www.blender.org/download/
2. Click **"Download"** (latest 4.1.x version)
3. Choose **Windows 64-bit** (unless you have 32-bit system)

### Step 2: Install Blender
1. Run the downloaded `.msi` installer
2. Follow installation wizard (all defaults are fine)
3. **IMPORTANT:** On the "Install Options" screen, check:
   - ✅ **"Add Blender to system PATH"**
4. Click **Finish**

### Step 3: Verify Installation
Open a new PowerShell/Command Prompt and type:
```bash
blender --version
```

Should show: `Blender 4.1.x` or similar

### Step 4: Generate Character Renders
```bash
cd "C:\Users\hussa\OneDrive\Desktop\KingsandTyrants game"
.\render.bat batch_character_renderer.py
```

This will:
- Create `portraits/` folder with PNG renders
- Generate renders for each character in CHARACTERS list
- Take 30-60 seconds total (depends on your PC)

### Step 5: Game Automatically Uses Renders
Once renders are generated, the game automatically displays them when you open character modals.

---

## Quick Comparison

| Feature | Canvas | Blender |
|---------|--------|---------|
| **Quality** | Good (stylized) | Excellent (3D realistic) |
| **Setup Time** | 0 minutes | 10 minutes |
| **Render Time** | Real-time | 2-5 seconds per character |
| **Customization** | Edit code | Modify script + re-render |
| **Fallback** | N/A | Canvas |

---

## Troubleshooting

### "blender: command not found"
- Blender isn't installed or PATH not updated
- **Solution:** Reinstall Blender, making sure to check "Add to PATH"
- **Workaround:** Use `render.bat` which auto-detects Blender

### Game shows black/blank portraits
- Blender renders not found or misconfigured
- **Solution:** Delete `portraitSystem.js` cache and try again:
  ```javascript
  portraitSystem.clearCache();
  ```
- Game will automatically fall back to canvas

### Render takes forever
- High resolution renders can be slow
- **Solution:** Edit `batch_character_renderer.py`:
  ```python
  scene.render.resolution_x = 512  # Lower from 768
  scene.render.resolution_y = 682  # Lower from 1024
  ```

---

## File Structure After Setup

```
KingsandTyrants game/
├── index.html
├── portraitSystem.js          ← Handles both canvas + Blender
├── actions.js                 ← Uses portraitSystem
├── batch_character_renderer.py
├── render.bat                 ← Use this to render
├── noble_woman_renderer.py
└── portraits/                 ← Generated after rendering
    ├── victor_vance_render.png
    ├── duchess_elena_render.png
    └── ...
```

---

## YOUR NEXT STEPS

### Minimum (Recommended for now):
✅ Just run the game with canvas portraits - they look great!
- No installation needed
- No setup needed
- Already implemented

### Optional (if you want premium quality):
1. Download Blender from https://www.blender.org/download/
2. Install with "Add to PATH" checked
3. Run: `render.bat batch_character_renderer.py`
4. Game will automatically use the renders

---

## Canvas vs Blender Visual Comparison

**Canvas Rendering (Current):**
- Procedural 2D face/body generation
- Fast (instant)
- Stylized, modern look
- Fully customizable via code

**Blender Rendering (Optional):**
- Full 3D models with lighting
- Slower (per-character, one-time)
- Photorealistic quality
- Customizable via Blender parameters

Both look good - choose based on your preference and time available!

---

## Need Help?

- **Canvas not showing:** Check browser console (F12)
- **Blender won't install:** Try version 4.0 instead of 4.1
- **Renders not appearing:** Verify `portraits/` folder has PNG files
- **Game crashes:** Make sure portraitSystem.js loaded (check F12 console)

**Your game is already functional - Blender is just a nice-to-have enhancement!**
