// main.js – Initialization

// Initialize Portrait System (Canvas + Blender hybrid)
if (typeof initPortraitSystem === 'function') {
    initPortraitSystem({
        portraitCachePath: './portraits/',
        useBlenderRenders: true
    });
}

// Initialize UI display and title screen
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
    showTitleScreen();
}