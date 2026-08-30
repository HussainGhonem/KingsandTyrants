// main.js – Initialization

// Initialize Portrait System (Canvas + Blender hybrid)
if (typeof initPortraitSystem === 'function') {
    initPortraitSystem({
        portraitCachePath: './portraits/',
        useBlenderRenders: true
    });
}

// Attempt to load saved progress; populate defaults if no save exists
const hasSave = loadGame();

if (!hasSave) {
    const logBox = document.getElementById('log');
    if (logBox) {
        initialHistory.forEach(entry => { logBox.innerHTML += `<div>${entry}</div>`; });
    }
}

// Update UI display and date header
updateUI();
document.getElementById('date-display').innerText = game.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Select default province after DOM is ready
setTimeout(() => selectProvince(game.selectedProvinceId), 100);

// Start with speed 0 (Paused)
setSpeed(0);