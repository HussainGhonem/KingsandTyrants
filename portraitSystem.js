// portraitSystem.js - Hybrid Canvas + Blender Rendering
// Provides seamless fallback from pre-rendered Blender images to real-time canvas portraits

class HybridPortraitSystem {
    constructor(options = {}) {
        this.portraitCachePath = options.portraitCachePath || './portraits/';
        this.useBlenderRenders = options.useBlenderRenders !== false;
        this.cache = new Map();
        this.renderAttempts = new Map();
        this.maxRetries = 1; // Don't retry failed loads
    }

    /**
     * Get portrait for character - tries Blender render first, falls back to canvas
     */
    async getPortraitHTML(character) {
        const cacheKey = character.id;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let html = '';

        // Try Blender render if enabled
        if (this.useBlenderRenders) {
            const blenderHTML = await this.tryBlenderRender(character);
            if (blenderHTML) {
                this.cache.set(cacheKey, blenderHTML);
                return blenderHTML;
            }
        }

        // Fallback to canvas render
        html = this.renderCanvasPortrait(character);
        this.cache.set(cacheKey, html);
        return html;
    }

    /**
     * Attempt to load Blender pre-rendered image
     */
    async tryBlenderRender(character) {
        return new Promise((resolve) => {
            const imagePath = `${this.portraitCachePath}${character.id}_render.png`;
            const img = new Image();

            const timeout = setTimeout(() => {
                resolve(null); // Timeout after 2 seconds
            }, 2000);

            img.onload = () => {
                clearTimeout(timeout);
                const html = `
                    <div class="character-figure blender-render" 
                         style="width:100%; height:100%; background:url('${imagePath}') center/contain no-repeat;">
                        <img src="${imagePath}" alt="${character.name}" style="width:100%; height:100%; object-fit:contain;">
                    </div>
                `;
                resolve(html);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(null);
            };

            img.src = imagePath;
        });
    }

    /**
     * Fallback canvas rendering (from existing drawCharacterPortrait)
     */
    renderCanvasPortrait(character) {
        // This generates the HTML that calls drawCharacterPortrait
        return `
            <div class="character-figure canvas-render" style="--coat-color:#182b33; --hair-color:#2a1a0f; --skin-color:#c8965f; --accent-color:#b89968;">
                <canvas class="portrait-canvas" width="440" height="760" role="img" aria-label="${(character.name || 'Character').replace(/"/g, '&quot;')}" data-character-id="${character.id}"></canvas>
            </div>
        `;
    }

    /**
     * Draw canvas portrait (existing implementation)
     */
    drawCanvasPortraitInElement(element, character) {
        const canvas = element.querySelector('.portrait-canvas');
        if (canvas && typeof drawCharacterPortrait === 'function') {
            requestAnimationFrame(() => drawCharacterPortrait(canvas, character));
        }
    }

    /**
     * Preload multiple character renders (useful for campaign start)
     */
    async preloadCharacterPortraits(characters) {
        const promises = characters.map(char => 
            this.getPortraitHTML(char).catch(() => this.renderCanvasPortrait(char))
        );
        await Promise.allSettled(promises);
        console.log(`✓ Portrait cache warmed for ${characters.length} characters`);
    }

    /**
     * Check if Blender renders directory exists and is populated
     */
    async checkBlenderRenderAvailability() {
        return new Promise((resolve) => {
            const testImage = new Image();
            testImage.onload = () => resolve(true);
            testImage.onerror = () => resolve(false);
            testImage.src = `${this.portraitCachePath}check.png?t=${Date.now()}`;
            setTimeout(() => resolve(false), 1000);
        });
    }

    /**
     * Clear cache (useful for reloading renders)
     */
    clearCache() {
        this.cache.clear();
        console.log('✓ Portrait cache cleared');
    }

    /**
     * Enable/disable Blender render mode
     */
    setBlenderMode(enabled) {
        this.useBlenderRenders = enabled;
        this.clearCache();
        console.log(`Portrait mode: ${enabled ? 'Blender Renders' : 'Canvas Only'}`);
    }
}

// Global instance
let portraitSystem = null;

/**
 * Initialize portrait system (call once on game start)
 */
function initPortraitSystem(options = {}) {
    portraitSystem = new HybridPortraitSystem(options);
    console.log('✓ Hybrid Portrait System initialized');
    return portraitSystem;
}

/**
 * Enhanced openCharModal to use hybrid portrait system
 */
async function openCharModalWithPortrait(id) {
    if (typeof openCharModal === 'function') {
        openCharModal(id);
    }
}

/**
 * Batch preload portraits for visible characters
 */
function preloadVisiblePortraits() {
    if (!portraitSystem || !game.characters) return;
    
    const visibleChars = game.characters.filter(c => !game.isCharacterDeceased(c));
    portraitSystem.preloadCharacterPortraits(visibleChars);
}

/**
 * Toggle between render modes (for debugging/options)
 */
function togglePortraitMode() {
    if (!portraitSystem) return;
    portraitSystem.setBlenderMode(!portraitSystem.useBlenderRenders);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HybridPortraitSystem, initPortraitSystem };
}
