// main.js – Initialization

// Initialize Portrait System (Canvas + Blender hybrid)
if (typeof initPortraitSystem === 'function') {
    initPortraitSystem({
        portraitCachePath: './portraits/',
        useBlenderRenders: true
    });
}

// Initialize UI display and title screen
const pendingNewGame = sessionStorage.getItem('pending_new_game');
let startedConfiguredGame = false;
if (pendingNewGame) {
    try {
        startNewGameConfigured(JSON.parse(pendingNewGame));
        sessionStorage.removeItem('pending_new_game');
        startedConfiguredGame = true;
    } catch (error) {
        console.error('Failed to initialize selected scenario:', error);
        sessionStorage.removeItem('pending_new_game');
    }
}

updateUI();

const dateDisplay = document.getElementById('date-display');
if (dateDisplay && game.date instanceof Date) {
    dateDisplay.innerText = game.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Select default province after DOM is ready
setTimeout(() => {
    if (typeof selectProvince === 'function' && game.selectedProvinceId) {
        selectProvince(game.selectedProvinceId);
    }
}, 100);

// Pause time and display Title Screen
setSpeed(0);
if (typeof showTitleScreen === 'function') {
    if (startedConfiguredGame) {
        hideTitleScreen();
    } else {
        showTitleScreen();
    }
}
