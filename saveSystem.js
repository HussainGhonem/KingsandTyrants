/* saveSystem.js - Complete Serialization, Save/Load & Autosave Engine for Dynasty & State */

const SAVE_VERSION = 1;
const AUTOSAVE_STORAGE_KEY = 'dynasty_state_autosave';
const RECENT_SAVES_STORAGE_KEY = 'dynasty_state_recent_saves';

/**
 * Serializes the game state into a JSON-friendly object, handling Sets, Dates, and nested objects.
 */
function serializeGameState(stateToSerialize = game) {
    if (!stateToSerialize) return null;

    const copy = JSON.parse(JSON.stringify(stateToSerialize, (key, value) => {
        if (value instanceof Set) {
            return { __type: 'Set', values: Array.from(value) };
        }
        if (value instanceof Map) {
            return { __type: 'Map', entries: Array.from(value.entries()) };
        }
        if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
        }
        return value;
    }));

    // Ensure date object is explicitly saved as ISO string
    if (stateToSerialize.date) {
        copy.dateStr = stateToSerialize.date instanceof Date 
            ? stateToSerialize.date.toISOString() 
            : new Date(stateToSerialize.date).toISOString();
    }

    // Capture intelligence sets explicitly
    if (stateToSerialize.intelligenceSystem) {
        copy.intelligenceSystem.activeWiretaps = Array.from(stateToSerialize.intelligenceSystem.activeWiretaps || []);
        copy.intelligenceSystem.discoveredSecrets = Array.from(stateToSerialize.intelligenceSystem.discoveredSecrets || []);
    }

    // Capture used events set
    if (stateToSerialize.usedEvents) {
        copy.usedEvents = Array.from(stateToSerialize.usedEvents || []);
    }

    return copy;
}

/**
 * Deserializes a saved state structure back into active JavaScript objects (Sets, Dates, etc.).
 */
function deserializeGameState(serializedState) {
    if (!serializedState) return null;

    // Deep revive special types if serialized with __type
    function revive(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        if (obj.__type === 'Set') {
            return new Set(obj.values || []);
        }
        if (obj.__type === 'Map') {
            return new Map(obj.entries || []);
        }
        if (obj.__type === 'Date') {
            return new Date(obj.value);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => revive(item));
        }

        const revivedObj = {};
        for (const [k, v] of Object.entries(obj)) {
            revivedObj[k] = revive(v);
        }
        return revivedObj;
    }

    const restored = revive(serializedState);

    // Restore date instance
    if (restored.dateStr) {
        restored.date = new Date(restored.dateStr);
    } else if (typeof restored.date === 'string') {
        restored.date = new Date(restored.date);
    }

    // Restore Sets for intelligence system
    if (restored.intelligenceSystem) {
        restored.intelligenceSystem.activeWiretaps = new Set(restored.intelligenceSystem.activeWiretaps || []);
        restored.intelligenceSystem.discoveredSecrets = new Set(restored.intelligenceSystem.discoveredSecrets || []);
        if (!restored.intelligenceSystem.cases) restored.intelligenceSystem.cases = [];
        if (!restored.intelligenceSystem.rumors) restored.intelligenceSystem.rumors = [];
    }

    // Restore usedEvents set
    if (restored.usedEvents) {
        restored.usedEvents = new Set(restored.usedEvents || []);
    } else {
        restored.usedEvents = new Set();
    }

    return restored;
}

/**
 * Validates a loaded save object to ensure all required root and game structures are intact.
 */
function validateSave(saveData) {
    if (!saveData || typeof saveData !== 'object') {
        throw new Error("Invalid save file format.");
    }

    if (!saveData.saveVersion || saveData.saveVersion > SAVE_VERSION) {
        throw new Error(`Incompatible save version: ${saveData.saveVersion || 'unknown'}.`);
    }

    const g = saveData.game;
    if (!g || !g.realm || !g.characters || !g.dynasty || !g.factions) {
        throw new Error("Save file missing essential realm or dynastic data.");
    }

    return true;
}

/**
 * Migrates old save file formats to current version structure.
 */
function migrateSave(saveData) {
    if (!saveData.saveVersion) saveData.saveVersion = 1;

    // Standardize expected default arrays / objects if missing
    const g = saveData.game;
    if (!g.history) g.history = { timeline: [], legacyPoints: 0, events: [] };
    if (!g.history.events) g.history.events = [];
    if (!g.intelligenceSystem) {
        g.intelligenceSystem = {
            activeWiretaps: [],
            discoveredSecrets: [],
            rumors: [],
            cases: []
        };
    }

    return saveData;
}

/**
 * Packages full game state into a save container with metadata.
 */
function createSaveContainer() {
    const ruler = typeof getRulerCharacter === 'function' ? getRulerCharacter() : (game.dynasty?.head || game.characters?.[0]);
    return {
        saveVersion: SAVE_VERSION,
        gameName: "Dynasty & State",
        timestamp: new Date().toISOString(),
        metadata: {
            realmName: game.realm?.name || "Vancuria",
            rulerName: ruler?.name || "Sovereign",
            dynastyName: game.dynasty?.name || "House Vance",
            dateStr: game.date instanceof Date ? game.date.toDateString() : String(game.date),
            year: game.date instanceof Date ? game.date.getFullYear() : 2034,
            prestige: game.dynasty?.prestige || 1000,
            approval: Math.round(game.realm?.approval || 50)
        },
        game: serializeGameState(game)
    };
}

/**
 * Exports current game state to an external .json file.
 */
function exportSaveFile() {
    try {
        const container = createSaveContainer();
        const jsonStr = JSON.stringify(container, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const realmSanitized = (game.realm?.name || "Realm").replace(/[^a-zA-Z0-9_-]/g, '_');
        const year = game.date instanceof Date ? game.date.getFullYear() : '2034';
        const dateFormatted = game.date instanceof Date ? `${game.date.getFullYear()}-${game.date.getMonth()+1}-${game.date.getDate()}` : year;

        const a = document.createElement('a');
        a.href = url;
        a.download = `Dynasty_State_${realmSanitized}_${dateFormatted}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        saveGameToAutosave();
        if (typeof log === 'function') log(`📜 Exported save file: Dynasty_State_${realmSanitized}_${dateFormatted}.json`);
        closePauseMenu();
    } catch (err) {
        alert(`Failed to export save file: ${err.message}`);
    }
}

/**
 * Saves current game state to browser localStorage as an autosave.
 */
function saveGameToAutosave() {
    try {
        const container = createSaveContainer();
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(container));
        
        // Update recent saves metadata list
        const recents = getRecentSavesList();
        const entry = {
            id: Date.now(),
            timestamp: container.timestamp,
            metadata: container.metadata
        };
        const updatedRecents = [entry, ...recents.filter(r => r.metadata.realmName !== entry.metadata.realmName || r.metadata.year !== entry.metadata.year)].slice(0, 5);
        localStorage.setItem(RECENT_SAVES_STORAGE_KEY, JSON.stringify(updatedRecents));

        if (typeof log === 'function') log(`💾 Game autosaved successfully.`);
        checkContinuePreview();
        closePauseMenu();
    } catch (err) {
        console.error("Autosave failed:", err);
    }
}

/**
 * Returns recent saves metadata stored in localStorage.
 */
function getRecentSavesList() {
    try {
        const raw = localStorage.getItem(RECENT_SAVES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Reads save file input from browser input event.
 */
function handleSaveFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            loadSaveContainer(parsed);
            closeLoadGameModal();
        } catch (err) {
            const errDiv = document.getElementById('load-error-message');
            if (errDiv) {
                errDiv.innerText = `SAVE FILE INVALID: ${err.message}`;
                errDiv.style.display = 'block';
            }
        }
    };
    reader.readAsText(file);
}

/**
 * Restores state from a validated save container.
 */
function loadSaveContainer(saveData) {
    const migrated = migrateSave(saveData);
    validateSave(migrated);

    const restoredGame = deserializeGameState(migrated.game);
    // Preserve methods on game instance while copying state properties
    Object.assign(window.game, restoredGame);

    if (typeof updateUI === 'function') updateUI();
    if (typeof hideTitleScreen === 'function') hideTitleScreen();
    if (typeof log === 'function') log(`📂 Loaded campaign: ${migrated.metadata?.realmName || 'Sovereign Realm'}`);
}

/**
 * Loads autosave from localStorage if available.
 */
function continueSavedGame() {
    try {
        const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
        if (!raw) {
            alert("No saved game found.");
            return;
        }
        const parsed = JSON.parse(raw);
        loadSaveContainer(parsed);
    } catch (err) {
        alert(`Failed to load autosave: ${err.message}`);
    }
}

/**
 * Checks for autosave and updates Continue button and preview card on Title Screen.
 */
function checkContinuePreview() {
    const preview = document.getElementById('continue-preview-card');
    const continueBtn = document.getElementById('btn-continue-game');

    try {
        const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
        if (!raw) {
            if (continueBtn) continueBtn.style.opacity = '0.5';
            if (preview) {
                preview.style.display = 'block';
                preview.innerHTML = `<em>NO SAVED GAME FOUND</em>`;
            }
            return;
        }

        const parsed = JSON.parse(raw);
        const meta = parsed.metadata || {};
        if (continueBtn) continueBtn.style.opacity = '1';

        if (preview) {
            preview.style.display = 'block';
            preview.innerHTML = `
                <div style="font-weight:bold; color:var(--accent-gold); margin-bottom:4px;">CONTINUE CAMPAIGN</div>
                <div><strong>${meta.dynastyName || 'House Vance'}</strong> • ${meta.rulerName || 'Sovereign'}</div>
                <div>${meta.dateStr || ''} | ${meta.realmName || 'Vancuria'}</div>
                <div>Prestige: <span style="color:var(--accent-gold)">${meta.prestige || 1000}</span> | Approval: <span style="color:var(--success)">${meta.approval || 50}%</span></div>
            `;
        }
    } catch (e) {
        if (continueBtn) continueBtn.style.opacity = '0.5';
        if (preview) {
            preview.style.display = 'block';
            preview.innerHTML = `<em>NO SAVED GAME FOUND</em>`;
        }
    }
}

/**
 * Renders list of recent save metadata in Load Game modal.
 */
function renderRecentSavesList() {
    const container = document.getElementById('recent-saves-list');
    if (!container) return;

    const recents = getRecentSavesList();
    if (recents.length === 0) {
        container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted);">No recent autosaves registered in browser storage.</div>`;
        return;
    }

    container.innerHTML = `
        <div style="font-size:0.75rem; color:var(--accent-gold); font-weight:bold; margin-bottom:6px;">RECENT BROWSER AUTOSAVES</div>
        ${recents.map(r => `
            <div style="background:#070a12; border:1px solid var(--panel-border); padding:8px; border-radius:4px; margin-bottom:6px; font-size:0.8rem;">
                <div style="font-weight:bold; color:var(--text-main);">${r.metadata.realmName} — ${r.metadata.year}</div>
                <div style="color:var(--text-muted);">${r.metadata.dynastyName} • ${r.metadata.rulerName}</div>
                <div style="color:var(--accent-gold);">Prestige: ${r.metadata.prestige} | Approval: ${r.metadata.approval}%</div>
            </div>
        `).join('')}
    `;
}

/**
 * Prompts user on Return To Title and saves state if requested.
 */
function saveAndReturnToTitle() {
    saveGameToAutosave();
    closeReturnTitleModal();
    showTitleScreen();
}

function returnToTitleWithoutSaving() {
    closeReturnTitleModal();
    showTitleScreen();
}
