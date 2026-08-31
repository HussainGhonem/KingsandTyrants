/* debug.js – Developer Debug Console & State Inspector for Dynasty & State */

let debugConsoleEnabled = false;

function toggleDebugMode(enabled) {
    debugConsoleEnabled = enabled;
    const panel = document.getElementById('debug-panel-container');
    if (!panel) return;

    if (enabled) {
        panel.style.display = 'block';
        renderDebugPanel();
    } else {
        panel.style.display = 'none';
    }
}

function renderDebugPanel() {
    const panel = document.getElementById('debug-panel-container');
    if (!panel || !debugConsoleEnabled) return;

    const currentYear = game.date instanceof Date ? game.date.getFullYear() : 2034;
    const activeChars = game.characters ? game.characters.filter(c => c.status === 'Active').length : 0;
    const fervor = game.revolution?.fervor || 0;
    const intelCases = game.intelligenceSystem?.rumors?.length || 0;
    const coupRisk = game.politics?.coupRisk || 0;

    panel.innerHTML = `
        <div style="font-weight:bold; color:var(--warning); margin-bottom:8px;">🛠️ DEVELOPER DEBUG CONSOLE</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; font-size:0.75rem; margin-bottom:10px;">
            <div>Year: <strong>${currentYear}</strong></div>
            <div>Active Characters: <strong>${activeChars}</strong></div>
            <div>Rev. Fervor: <strong>${fervor}%</strong></div>
            <div>Intel Rumors: <strong>${intelCases}</strong></div>
            <div>Coup Risk: <strong>${coupRisk}%</strong></div>
            <div>Used Events: <strong>${game.usedEvents?.size || 0}</strong></div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <button class="action-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="debugAddFervor(10)">+10 Fervor</button>
            <button class="action-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="debugAddFervor(50)">+50 Fervor</button>
            <button class="action-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="debugTriggerRevolution()">Trigger Revolution</button>
            <button class="action-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="debugSpawnIntelRumor()">Spawn Intel Rumor</button>
            <button class="action-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="debugTriggerRandomEvent()">Trigger Event</button>
            <button class="action-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="debugAdvanceYears(1)">Advance 1 Year</button>
            <button class="action-btn" style="font-size:0.7rem; padding:4px 8px; border-color:var(--danger);" onclick="debugKillCurrentRuler()">Kill Current Ruler</button>
        </div>
    `;
}

function debugAddFervor(amount) {
    if (!game.revolution) return;
    game.revolution.fervor = Math.min(100, (game.revolution.fervor || 0) + amount);
    if (typeof log === 'function') log(`[DEBUG] Added +${amount} Revolutionary Fervor.`);
    if (typeof updateUI === 'function') updateUI();
    renderDebugPanel();
}

function debugTriggerRevolution() {
    if (!game.revolution) return;
    game.revolution.fervor = 100;
    if (typeof triggerRevolution100Crisis === 'function') triggerRevolution100Crisis();
    if (typeof updateUI === 'function') updateUI();
    renderDebugPanel();
}

function debugSpawnIntelRumor() {
    if (typeof simulateIntelligenceCases === 'function') simulateIntelligenceCases();
    if (typeof updateUI === 'function') updateUI();
    renderDebugPanel();
}

function debugTriggerRandomEvent() {
    if (typeof triggerRandomEvent === 'function') triggerRandomEvent();
    renderDebugPanel();
}

function debugAdvanceYears(years = 1) {
    for (let i = 0; i < years * 12; i++) {
        if (typeof simulateMonth === 'function') simulateMonth();
    }
    if (typeof updateUI === 'function') updateUI();
    renderDebugPanel();
}

function debugKillCurrentRuler() {
    const ruler = typeof getRulerCharacter === 'function' ? getRulerCharacter() : null;
    if (ruler) {
        ruler.health = 0;
        if (typeof processMortalityAndConsequences === 'function') processMortalityAndConsequences();
        if (typeof updateUI === 'function') updateUI();
        renderDebugPanel();
    }
}

function runGenerationalSimulation(years = 100) {
    const startYear = game.date instanceof Date ? game.date.getFullYear() : 2026;
    const initialBorn = game.characters ? game.characters.length : 0;
    let rulersCount = 1;
    let totalEventsTriggered = 0;

    let previousRulerId = game.realm?.rulerId || game.dynasty?.headId;

    for (let m = 1; m <= years * 12; m++) {
        if (typeof simulateMonth === 'function') simulateMonth();

        // Auto-resolve any event modal to prevent hanging
        if (game.activeEvent && Array.isArray(game.activeEvent.choices) && game.activeEvent.choices.length > 0) {
            totalEventsTriggered++;
            if (typeof resolveEventChoice === 'function') {
                resolveEventChoice(0);
            } else {
                game.activeEvent = null;
            }
        }

        // Track ruler changes
        const currentRulerId = game.realm?.rulerId || game.dynasty?.headId;
        if (currentRulerId !== previousRulerId) {
            rulersCount++;
            previousRulerId = currentRulerId;
        }

        // Validate state
        if (typeof game.validateGameState === 'function') {
            const val = game.validateGameState();
            if (!val.valid) {
                console.error(`[STRESS TEST ERROR at month ${m}]: State invalid:`, val.issues);
                return { success: false, month: m, issues: val.issues };
            }
        }
    }

    const endYear = game.date instanceof Date ? game.date.getFullYear() : startYear + years;
    const totalChars = game.characters ? game.characters.length : 0;
    const deadChars = game.characters ? game.characters.filter(c => c.status === 'Deceased').length : 0;
    const activeChars = game.characters ? game.characters.filter(c => c.status === 'Active').length : 0;
    const cadetBranches = game.dynasty?.branches ? game.dynasty.branches.length : 0;

    const report = {
        success: true,
        yearsSimulated: years,
        startYear,
        endYear,
        rulersCount,
        charactersBorn: totalChars - initialBorn,
        charactersDied: deadChars,
        activeCharacters: activeChars,
        dynastyBranches: cadetBranches,
        eventsTriggered: totalEventsTriggered
    };

    console.log("=== 100-YEAR GENERATIONAL STRESS TEST REPORT ===");
    console.log(report);
    return report;
}

if (typeof global !== 'undefined') global.runGenerationalSimulation = runGenerationalSimulation;
if (typeof window !== 'undefined') window.runGenerationalSimulation = runGenerationalSimulation;
