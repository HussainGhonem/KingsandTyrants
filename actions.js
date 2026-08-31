// actions.js – User-Triggered Action Handlers & Systems Controllers

function setSpeed(s) {
    game.speed = s;
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    
    const btnPause = document.getElementById('btn-pause');
    const btnPlay = document.getElementById('btn-play');
    const btnFast = document.getElementById('btn-fast');

    if (s === 0 && btnPause) btnPause.classList.add('active');
    if (s === 1 && btnPlay) btnPlay.classList.add('active');
    if (s === 2 && btnFast) btnFast.classList.add('active');

    clearInterval(game.timer);
    if (game.speed > 0) {
        game.timer = setInterval(simulateMonth, game.speed === 1 ? 2400 : 800);
    }
}

function switchMainView(v) {
    document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById(`view-${v}`);
    if (targetView) {
        targetView.style.display = 'flex';
    }

    const navBtn = document.querySelector(`.nav-btn[onclick*="'${v}'"]`) || document.querySelector(`.nav-btn[onclick*='"${v}"']`);
    if (navBtn) {
        navBtn.classList.add('active');
    } else {
        const btns = document.querySelectorAll('.nav-btn');
        for (const btn of btns) {
            if (btn.textContent.trim().toLowerCase().includes(v)) {
                btn.classList.add('active');
                break;
            }
        }
    }

    if (v === 'map') selectProvince(game.selectedProvinceId);
    updateUI();
}

function switchTab(t) {
    game.currentTab = t;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('.tab-btn');
    for (const btn of btns) {
        if (btn.textContent.trim().toLowerCase().includes(t)) {
            btn.classList.add('active');
            break;
        }
    }
    renderCourt();
}

function adjustTax(dir) {
    game.realm.taxRate = Math.max(0.5, Math.min(2.0, game.realm.taxRate + (dir * 0.1)));
    log(dir > 0 ? "Increased national corporate levies." : "Decreased corporate tax burdens.");
    updateUI();
}

function adjustMilitaryBudget(cost) {
    if (game.realm.treasury >= cost) {
        game.realm.treasury -= cost;
        game.military.readiness += 10;
        log("Authorized discretionary defense procurement budget.");
        updateUI();
    } else {
        log("Insufficient treasury reserves for defense procurement.");
    }
}

function issueSovereignBonds(amount) {
    const debtCeiling = Math.max(10, (game.realm.gdp || 0) * 0.9);
    const debt = game.budget.sovereignDebt || 0;
    const inflation = game.realm.inflation || 0;
    if (debt >= debtCeiling) {
        log(`BOND ISSUE BLOCKED: Debt is already at the sovereign ceiling of $${debtCeiling.toFixed(1)}B.`);
        return;
    }
    if (inflation >= 20) {
        log("BOND ISSUE BLOCKED: Inflation is too high to borrow responsibly. Reduce inflation first.");
        return;
    }
    const approvedAmount = Math.min(amount, debtCeiling - debt);
    game.budget.sovereignDebt += approvedAmount;
    game.budget.issuedBonds += approvedAmount;
    game.realm.treasury += approvedAmount;
    log(`ISSUED $${approvedAmount.toFixed(1)}B IN SOVEREIGN DEBT BONDS. Debt ceiling: $${debtCeiling.toFixed(1)}B.`);
    updateUI();
}

function amendConstitution(article, value) {
    game.constitution[article] = value;
    if (article === 'headOfState') {
        game.politics.authoritarianism = Math.min(100, (game.politics.authoritarianism || 0) + 8);
        game.realm.stability = Math.min(100, (game.realm.stability || 0) + 3);
        game.politics.parliamentSupport = Math.max(0, (game.politics.parliamentSupport || 0) - 4);
    } else if (article === 'judiciaryIndependence') {
        game.realm.legitimacy = Math.min(100, (game.realm.legitimacy || 0) + 8);
        game.politics.authoritarianism = Math.max(0, (game.politics.authoritarianism || 0) - 8);
        game.politics.opposition = Math.max(0, (game.politics.opposition || 0) - 3);
        game.constitution.judicialOversight = true;
    }
    game.adjustLegitimacy(5);
    log(`AMENDED CONSTITUTION: ${article} updated to "${value}".`);
    updateUI();
}

function toggleEmergencyPowers() {
    game.constitution.emergencyActive = !game.constitution.emergencyActive;
    if (game.constitution.emergencyActive) {
        game.realm.stability += 15;
        game.realm.approval -= 10;
        game.politics.authoritarianism = Math.min(100, (game.politics.authoritarianism || 0) + 12);
        game.politics.opposition = Math.min(100, (game.politics.opposition || 0) + 8);
        game.constitution.emergencyMonths = 0;
        log("DECLARED NATIONAL EMERGENCY EXECUTIVE DECREE.");
    } else {
        game.realm.approval += 10;
        game.realm.stability = Math.max(0, game.realm.stability - 5);
        game.politics.authoritarianism = Math.max(0, (game.politics.authoritarianism || 0) - 8);
        game.constitution.emergencyMonths = 0;
        log("REVOKED EMERGENCY POWERS. Standard constitutional order restored.");
    }
    if (typeof saveGame === 'function') saveGame();
    updateUI();
}

function hostLifestyleEvent(type) {
    if (type === 'gala') {
        if (game.realm.treasury >= 0.1) {
            game.realm.treasury -= 0.1;
            game.realm.prestige += 15;
            game.realm.stress = Math.max(0, game.realm.stress - 10);
            log("Hosted Royal Gala at Citadel Palace.");
        }
    } else if (type === 'retreat') {
        if (game.realm.treasury >= 0.05) {
            game.realm.treasury -= 0.05;
            game.realm.stress = Math.max(0, game.realm.stress - 20);
            log("Retreated to Country Estate for private rest.");
        }
    } else if (type === 'inspection') {
        if (game.realm.treasury >= 0.05) {
            game.realm.treasury -= 0.05;
            game.military.readiness += 5;
            log("Conducted sovereign military parade & inspection.");
        }
    }
    updateUI();
}

function negotiateTreaty(powerId) {
    const p = game.diplomacy.powers.find(x => x.id === powerId);
    if (!p) return;
    if (game.realm.treasury >= 0.1) {
        game.realm.treasury -= 0.1;
        p.relations = Math.min(100, p.relations + 15);
        p.borderTension = Math.max(0, p.borderTension - 5);
        log(`Dispatched diplomatic mission to ${p.name}. Bilateral relations improved.`);
        updateUI();
    }
}

function signEconomicAgreement(powerId) {
    const p = game.diplomacy.powers.find(x => x.id === powerId);
    if (!p) return;
    if (game.realm.treasury < 0.4) {
        log(`Insufficient treasury reserves to negotiate an economic agreement with ${p.name}.`);
        return;
    }

    game.realm.treasury -= 0.4;
    p.economicAgreement = true;
    p.trade = +(p.trade + 1.5).toFixed(1);
    p.relations = Math.min(100, p.relations + 12);
    p.borderTension = Math.max(0, p.borderTension - 8);
    log(`Economic framework signed with ${p.name}. Trade and investment flows expand.`);
    updateUI();
}

function imposeBoycott(powerId) {
    const p = game.diplomacy.powers.find(x => x.id === powerId);
    if (!p) return;

    p.boycotted = !p.boycotted;
    if (p.boycotted) {
        p.relations = Math.max(-100, p.relations - 18);
        p.trade = Math.max(0, +(p.trade - 1.2).toFixed(1));
        p.embargo = true;
        log(`Economic boycott imposed against ${p.name}. Trade channels have been restricted.`);
    } else {
        p.relations = Math.min(100, p.relations + 8);
        p.embargo = false;
        log(`Boycott on ${p.name} has been lifted. Commercial channels reopen.`);
    }
    updateUI();
}

function imposeSanctions(powerId) {
    const p = game.diplomacy.powers.find(x => x.id === powerId);
    if (!p) return;

    p.embargo = !p.embargo;
    p.sanctions = p.embargo ? 3 : 0;
    p.relations = p.embargo ? Math.max(-100, p.relations - 12) : Math.min(100, p.relations + 10);
    p.borderTension = Math.min(100, p.borderTension + (p.embargo ? 10 : -6));
    log(p.embargo ? `Sanctions and trade restrictions imposed on ${p.name}.` : `Sanctions on ${p.name} have been withdrawn.`);
    updateUI();
}

function declareWarOnPower(powerId) {
    const p = game.diplomacy.powers.find(x => x.id === powerId);
    if (!p) return;

    p.war = true;
    p.boycotted = true;
    p.embargo = true;
    p.sanctions = 5;
    p.relations = Math.max(-100, p.relations - 25);
    p.borderTension = Math.min(100, p.borderTension + 20);
    game.realm.treasury = Math.max(0, +(game.realm.treasury - 1.5).toFixed(2));
    game.realm.stability = Math.max(0, game.realm.stability - 10);
    game.military.readiness = Math.max(0, game.military.readiness - 8);
    log(`Declared a state of war against ${p.name}. Military mobilization and economic strangulation are now underway.`);
    updateUI();
}

function offerCeasefire(powerId) {
    const p = game.diplomacy.powers.find(x => x.id === powerId);
    if (!p) return;

    p.war = false;
    p.embargo = false;
    p.boycotted = false;
    p.sanctions = 0;
    p.relations = Math.min(100, p.relations + 10);
    p.borderTension = Math.max(0, p.borderTension - 15);
    log(`Ceasefire agreed with ${p.name}. The front is cooling down.`);
    updateUI();
}

function startProject(id) {
    const p = game.projects.find(x => x.id === id);
    if (!p) return;
    if (game.realm.treasury >= p.cost) {
        game.realm.treasury -= p.cost;
        p.active = true;
        log(`Authorized state mega-project: ${p.name}.`);
        game.monthActions.push({
            headline: `SOVEREIGN DECREE: ${p.name.toUpperCase()} AUTHORIZED`,
            lead: `Treasury reserves released $${p.cost}B to construct ${p.name}.`
        });
        updateUI();
    } else {
        log(`Insufficient funds to initiate ${p.name}.`);
    }
}

function startBlackProject(id) {
    const bp = game.blackProjects.find(x => x.id === id);
    if (!bp) return;
    if (game.realm.treasury >= bp.cost) {
        game.realm.treasury -= bp.cost;
        bp.active = true;
        log(`CLASSIFIED DECREE: Authorized ${bp.name}.`);
        updateUI();
    } else {
        log(`Insufficient treasury reserves for classified R&D project ${bp.name}.`);
    }
}

function investigateRumor(rumorId) {
    const rIndex = game.intelligenceSystem.rumors.findIndex(r => r.id === rumorId);
    if (rIndex === -1) return;

    if (game.realm.treasury < 0.2) {
        log("Insufficient intelligence budget to conduct rumor investigation.");
        return;
    }

    game.realm.treasury -= 0.2;
    const rumor = game.intelligenceSystem.rumors[rIndex];
    rumor.confidence = Math.min(100, rumor.confidence + 20);
    rumor.verified = true;

    const sourceChar = game.characters.find(c => c.id === rumor.sourceId);
    if (sourceChar && sourceChar.secret) {
        game.intelligenceSystem.discoveredSecrets.add(sourceChar.id);
        log(`RUMOR INVESTIGATION CONCLUDED: Verified rumor! Dossier unlocked for ${sourceChar.name}: "${sourceChar.secret}"`);
    } else {
        log(`RUMOR INVESTIGATION CONCLUDED: Rumor verified with ${rumor.confidence}% confidence rating.`);
    }

    updateUI();
}

function mollifyFaction(id) {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const f = game.factions.find(x => x.id === numericId);
    if (!f) return;

    const cooldown = game.factionCooldowns?.[f.id]?.concession;
    if (cooldown && (game.totalMonthsPassed - cooldown) < game.config.concessionCooldownMonths) {
        log(`Fiscal concession to ${f.name} is on cooldown.`);
        return;
    }

    if (game.realm.treasury >= 0.3) {
        game.realm.treasury -= 0.3;
        f.loyalty = Math.min(100, f.loyalty + 15);
        if (!game.factionCooldowns[f.id]) game.factionCooldowns[f.id] = {};
        game.factionCooldowns[f.id].concession = game.totalMonthsPassed;
        log(`Granted fiscal concessions to ${f.name}.`);
        updateUI();
    } else {
        log(`Insufficient funds for concessions to ${f.name}.`);
    }
}

function toggleSurveillance(factionId) {
    const numericId = typeof factionId === 'string' ? parseInt(factionId, 10) : factionId;
    const faction = game.factions.find(x => x.id === numericId);
    if (!faction) return;

    const setupCost = game.config?.surveillanceSetupCost ?? 0.5;

    if (!faction.underSurveillance) {
        if (game.realm.treasury < setupCost) {
            log("Insufficient funds to initiate surveillance.");
            return;
        }
        game.realm.treasury -= setupCost;
        faction.underSurveillance = true;
        log(`Initiated active intelligence surveillance on ${faction.name}.`);
    } else {
        faction.underSurveillance = false;
        log(`Terminated surveillance operations on ${faction.name}.`);
    }

    updateUI();
}

// Character Modal & Court Actions
function getCharacterModelPalette(character) {
    const palettes = [
        { coat: '#3b82f6', hair: '#1f2937', skin: '#f2c9a0', accent: '#fbbf24' },
        { coat: '#10b981', hair: '#5b3a29', skin: '#d9a06c', accent: '#f8fafc' },
        { coat: '#ef4444', hair: '#0f172a', skin: '#e7b383', accent: '#f59e0b' },
        { coat: '#8b5cf6', hair: '#0b1120', skin: '#d4a373', accent: '#38bdf8' },
        { coat: '#f97316', hair: '#1e293b', skin: '#f1c27d', accent: '#f8fafc' },
        { coat: '#14b8a6', hair: '#1f2937', skin: '#db9c6b', accent: '#fbbf24' }
    ];

    const index = ((Number(character.id) || Number(character.name?.length) || 0) + (character.name?.length || 0)) % palettes.length;
    return palettes[index];
}

function hashString(value) {
    let hash = 0;
    const text = String(value || '');
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function getCharacterRoleClass(character) {
    const roleText = (character.role || '').toLowerCase();
    if (roleText.includes('soldier') || roleText.includes('general') || roleText.includes('military')) return 'role-soldier';
    if (roleText.includes('minister') || roleText.includes('chief') || roleText.includes('foreign') || roleText.includes('intel')) return 'role-official';
    if (roleText.includes('duke') || roleText.includes('prince') || roleText.includes('queen') || roleText.includes('royal') || roleText.includes('consort')) return 'role-noble';
    if (roleText.includes('peasant') || roleText.includes('citizen') || roleText.includes('worker')) return 'role-citizen';
    return 'role-generic';
}

function getCharacterAgeClass(character) {
    const age = Number(character.age || 0);
    if (age >= 60) return 'age-elder';
    if (age <= 25) return 'age-young';
    return 'age-adult';
}

function getCharacterPortraitVariant(character) {
    const gender = (character.gender || 'Unknown').toLowerCase();
    const isFemale = gender === 'female';
    const age = Number(character.age || 0);
    const roleClass = getCharacterRoleClass(character);
    const seed = hashString(`${character.id || character.name || 'unnamed'}-${character.houseId || character.role || ''}`);
    const noble = roleClass === 'role-noble' || roleClass === 'role-official';
    const hairSet = isFemale ? ['long', 'wave', 'braided', 'crown'] : ['short', 'sideburns', 'mop', 'imperial'];
    const beardSet = ['none', 'classic', 'pointed', 'full', 'short'];
    const faceSet = ['oval', 'round', 'narrow', 'strong'];
    const hairStyle = hairSet[seed % hairSet.length];
    const beardStyle = !isFemale && age >= 28 && (seed % 3 !== 0) ? beardSet[(seed + age) % beardSet.length] : 'none';
    const faceShape = faceSet[seed % faceSet.length];
    const hairTone = age >= 55 ? '#d9d7d2' : (isFemale ? '#3b2a22' : '#171f2d');
    const nobleStyle = noble && (seed % 2 === 0) ? 'royal' : 'court';

    return {
        hairStyle,
        beardStyle,
        faceShape,
        hairTone,
        nobleStyle,
        isFemale,
        age,
        coat: getCharacterModelPalette(character).coat,
        accent: getCharacterModelPalette(character).accent,
        skin: getCharacterModelPalette(character).skin,
        collarColor: roleClass === 'role-noble' ? '#f9d976' : (roleClass === 'role-official' ? '#dbeafe' : '#cbd5e1'),
        cloakFill: noble ? '#c5a05c' : '#17212f'
    };
}

function getHairMarkup(variant) {
    const hairTone = variant.hairTone;
    if (variant.isFemale) {
        const femaleStyles = {
            long: `
                <path d="M83 97 Q110 66 137 97 L133 133 Q121 147 110 147 Q99 147 87 133 Z" fill="${hairTone}" opacity="0.98"/>
                <path d="M88 114 Q110 106 132 114" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-linecap="round"/>
            `,
            wave: `
                <path d="M82 96 Q104 60 122 72 Q137 80 138 100 L133 130 Q121 145 110 146 Q99 145 87 130 Z" fill="${hairTone}" opacity="0.98"/>
                <path d="M95 92 Q110 78 125 92" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-linecap="round"/>
            `,
            braided: `
                <path d="M84 95 Q110 62 136 95 L130 130 Q118 147 110 147 Q102 147 90 130 Z" fill="${hairTone}" opacity="0.98"/>
                <path d="M97 95 L110 72 L123 95" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M92 128 Q110 108 128 128" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-linecap="round"/>
            `,
            crown: `
                <path d="M84 96 Q99 68 110 67 Q121 68 136 96 L131 132 Q121 146 110 147 Q99 146 89 132 Z" fill="${hairTone}" opacity="0.98"/>
                <path d="M90 82 L99 68 L110 76 L121 68 L130 82" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2" stroke-linecap="round"/>
            `
        };
        return femaleStyles[variant.hairStyle] || femaleStyles.long;
    }

    const maleStyles = {
        short: `
            <path d="M81 94 Q110 69 139 94 L132 127 Q120 141 110 141 Q100 141 88 127 Z" fill="${hairTone}" opacity="0.96"/>
            <path d="M90 98 Q110 83 130 98" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2" stroke-linecap="round"/>
        `,
        sideburns: `
            <path d="M83 96 Q99 76 110 76 Q121 76 137 96 L132 128 Q119 139 110 139 Q101 139 88 128 Z" fill="${hairTone}" opacity="0.96"/>
            <path d="M88 88 L79 110 M132 88 L141 110" fill="none" stroke="${hairTone}" stroke-width="5" stroke-linecap="round"/>
        `,
        mop: `
            <path d="M80 94 Q106 58 110 58 Q114 58 140 94 L133 132 Q121 145 110 146 Q99 145 87 132 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M92 92 Q110 74 128 92" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-linecap="round"/>
        `,
        imperial: `
            <path d="M83 96 Q110 54 137 96 L134 130 Q122 146 110 146 Q98 146 86 130 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M92 86 L100 70 L110 78 L120 70 L128 86" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2" stroke-linecap="round"/>
        `
    };
    return maleStyles[variant.hairStyle] || maleStyles.short;
}

function getBeardMarkup(variant) {
    if (variant.isFemale || variant.beardStyle === 'none') return '';

    const beardStyles = {
        classic: `
            <path d="M94 122 Q110 132 126 122 L126 144 Q117 151 110 152 Q103 151 94 144 Z" fill="${variant.hairTone}" opacity="0.96"/>
            <path d="M99 124 Q110 130 121 124" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" stroke-linecap="round"/>
        `,
        pointed: `
            <path d="M92 121 L106 136 L110 151 L114 136 L128 121 L121 148 L110 158 L99 148 Z" fill="${variant.hairTone}" opacity="0.96"/>
        `,
        full: `
            <path d="M90 120 Q110 142 130 120 L130 153 Q118 164 110 164 Q102 164 90 153 Z" fill="${variant.hairTone}" opacity="0.97"/>
            <path d="M100 130 Q110 137 120 130" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.8" stroke-linecap="round"/>
        `,
        short: `
            <path d="M93 122 Q110 130 127 122 Q127 137 110 142 Q93 137 93 122 Z" fill="${variant.hairTone}" opacity="0.96"/>
        `
    };

    return beardStyles[variant.beardStyle] || beardStyles.classic;
}

function renderCharacterModel(character) {
    const palette = getCharacterModelPalette(character);
    const variant = getCharacterPortraitVariant(character);
    const genderClass = variant.isFemale ? 'gender-female' : 'gender-male';
    const roleClass = getCharacterRoleClass(character);
    const ageClass = getCharacterAgeClass(character);
    const collarColor = variant.collarColor;
    const skinTone = palette.skin;
    const hairTone = variant.hairTone;

    const ageLines = variant.age >= 55 ? `
        <path d="M99 120 Q103 123 107 120" fill="none" stroke="rgba(80,50,30,0.52)" stroke-width="1.15" stroke-linecap="round"/>
        <path d="M113 120 Q117 123 121 120" fill="none" stroke="rgba(80,50,30,0.52)" stroke-width="1.15" stroke-linecap="round"/>
        <path d="M103 126 Q110 130 117 126" fill="none" stroke="rgba(80,50,30,0.38)" stroke-width="1.1" stroke-linecap="round"/>
    ` : '';

    const nobleCrown = roleClass === 'role-noble' ? `
        <path d="M88 70 L96 54 L110 63 L124 54 L132 70" fill="none" stroke="#f8d76d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="110" cy="52" r="4" fill="#f8d76d"/>
    ` : '';

    const royalCape = variant.nobleStyle === 'royal' ? `
        <path d="M58 170 L84 134 L110 128 L136 134 L162 170 L159 205 L110 220 L61 205 Z" fill="${variant.accent}" opacity="0.8"/>
        <path d="M75 172 L90 146 L110 142 L130 146 L145 172" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    ` : `
        <path d="M60 168 L84 136 L110 131 L136 136 L160 166 L152 204 L110 214 L68 204 Z" fill="${variant.cloakFill}" opacity="0.82"/>
    `;

    const headOuter = variant.isFemale
        ? 'M83 88 Q110 58 137 88 L136 145 Q121 160 110 160 Q99 160 84 145 Z'
        : 'M80 90 Q110 58 140 90 L136 146 Q120 160 110 160 Q100 160 84 146 Z';

    const foreheadPlane = `
        <path d="M90 86 Q110 68 130 86 L129 103 Q110 93 91 103 Z" fill="rgba(255,255,255,0.08)"/>
    `;

    const browRidge = `
        <path d="M92 92 Q100 84 108 92" fill="none" stroke="rgba(65,42,28,0.48)" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M112 92 Q120 84 128 92" fill="none" stroke="rgba(65,42,28,0.48)" stroke-width="3.2" stroke-linecap="round"/>
    `;

    const eyeSocket = `
        <path d="M96 101 Q101 97 106 101 Q101 105 96 101 Z" fill="rgba(110,72,52,0.32)"/>
        <path d="M114 101 Q119 97 124 101 Q119 105 114 101 Z" fill="rgba(110,72,52,0.32)"/>
        <ellipse cx="101" cy="101" rx="2.7" ry="2.2" fill="rgba(255,255,255,0.18)"/>
        <ellipse cx="119" cy="101" rx="2.7" ry="2.2" fill="rgba(255,255,255,0.18)"/>
    `;

    const noseBridge = `
        <path d="M110 94 Q106 101 110 112 Q114 101 110 94" fill="none" stroke="rgba(82,55,41,0.35)" stroke-width="2.3" stroke-linecap="round"/>
    `;

    const cheekPlane = `
        <path d="M91 109 Q99 118 101 126" fill="none" stroke="rgba(196,138,104,0.29)" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M129 109 Q121 118 119 126" fill="none" stroke="rgba(196,138,104,0.29)" stroke-width="3.4" stroke-linecap="round"/>
    `;

    const mouth = `
        <path d="M100 125 Q110 130 120 125" fill="none" stroke="rgba(140,78,67,0.62)" stroke-width="2.2" stroke-linecap="round"/>
    `;

    const jawline = `
        <path d="M95 112 Q88 121 90 136 Q95 149 110 149 Q125 149 130 136 Q132 121 125 112" fill="none" stroke="rgba(61,41,31,0.18)" stroke-width="3.2" stroke-linecap="round"/>
    `;

    const chinHighlight = `
        <path d="M104 132 Q110 139 116 132" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.6" stroke-linecap="round"/>
    `;

    const faceMain = `
        <path d="${headOuter}" fill="${skinTone}" opacity="0.98"/>
        <path d="M88 92 Q110 74 132 92 L130 143 Q117 154 110 154 Q103 154 90 143 Z" fill="url(#faceShade)" opacity="0.96"/>
        ${foreheadPlane}
        ${browRidge}
        ${eyeSocket}
        ${noseBridge}
        ${cheekPlane}
        ${jawline}
        ${chinHighlight}
    `;

    const femaleHair = {
        long: `
            <path d="M82 83 Q110 52 138 83 L138 146 Q121 163 110 163 Q99 163 82 146 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M85 114 Q110 98 135 114" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M88 126 Q110 116 132 126" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-linecap="round"/>
        `,
        wave: `
            <path d="M82 85 Q104 58 124 71 Q139 81 139 93 L136 145 Q120 163 110 163 Q99 163 84 145 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M92 86 Q110 72 128 89" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2.4" stroke-linecap="round"/>
        `,
        braided: `
            <path d="M82 85 Q110 52 138 85 L134 145 Q120 163 110 163 Q100 163 86 145 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M98 88 L110 69 L122 88" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M92 126 Q110 109 128 126" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2.2" stroke-linecap="round"/>
        `,
        crown: `
            <path d="M84 86 Q99 63 110 62 Q121 63 136 86 L133 145 Q119 163 110 163 Q101 163 87 145 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M90 78 L99 63 L110 72 L121 63 L130 78" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2.2" stroke-linecap="round"/>
        `
    };

    const maleHair = {
        short: `
            <path d="M82 86 Q110 68 138 86 L135 145 Q121 160 110 160 Q99 160 85 145 Z" fill="${hairTone}" opacity="0.97"/>
            <path d="M90 90 Q110 82 130 90" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2.4" stroke-linecap="round"/>
        `,
        sideburns: `
            <path d="M82 86 Q101 68 110 68 Q120 68 138 86 L134 145 Q120 160 110 160 Q100 160 86 145 Z" fill="${hairTone}" opacity="0.97"/>
            <path d="M88 90 L80 110 M132 90 L140 110" fill="none" stroke="${hairTone}" stroke-width="5" stroke-linecap="round"/>
        `,
        mop: `
            <path d="M80 84 Q106 52 110 52 Q114 52 140 84 L134 145 Q120 161 110 161 Q100 161 86 145 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M91 90 Q110 78 129 90" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2.4" stroke-linecap="round"/>
        `,
        imperial: `
            <path d="M83 86 Q110 48 137 86 L134 145 Q121 161 110 161 Q99 161 86 145 Z" fill="${hairTone}" opacity="0.98"/>
            <path d="M92 78 L100 63 L110 72 L120 63 L128 78" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2.2" stroke-linecap="round"/>
        `
    };

    const hairMarkup = variant.isFemale
        ? (femaleHair[variant.hairStyle] || femaleHair.long)
        : (maleHair[variant.hairStyle] || maleHair.short);

    const beardStyles = {
        classic: `<path d="M96 121 Q110 136 124 121 L125 148 Q116 156 110 156 Q104 156 95 148 Z" fill="${hairTone}" opacity="0.97"/>`,
        pointed: `<path d="M94 121 L108 137 L110 154 L112 137 L126 121 L120 150 L110 159 L100 150 Z" fill="${hairTone}" opacity="0.97"/>`,
        full: `<path d="M92 120 Q110 145 128 120 L130 156 Q118 166 110 166 Q102 166 90 156 Z" fill="${hairTone}" opacity="0.97"/>`,
        short: `<path d="M94 121 Q110 130 126 121 Q126 139 110 144 Q94 139 94 121 Z" fill="${hairTone}" opacity="0.96"/>`
    };

    const beardMarkup = (!variant.isFemale && variant.beardStyle !== 'none') ? (beardStyles[variant.beardStyle] || beardStyles.classic) : '';

    const clothMarkup = `
        <path d="M76 150 Q92 141 110 144 Q128 141 144 150 L137 200 Q110 212 83 200 Z" fill="${palette.coat}" opacity="0.9"/>
        <path d="M83 154 L98 164 L110 177 L122 164 L137 154" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M90 176 Q110 186 130 176" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M70 158 L52 182 L58 206 L84 210 L94 184 Z" fill="rgba(15,23,42,0.18)"/>
        <path d="M150 158 L168 182 L162 206 L136 210 L126 184 Z" fill="rgba(15,23,42,0.18)"/>
        <path d="M95 155 L110 163 L125 155" fill="none" stroke="${collarColor}" stroke-width="3" stroke-linecap="round"/>
        <path d="M72 154 L110 166 L148 154" fill="none" stroke="url(#cloakGloss)" stroke-width="6" stroke-linecap="round" opacity="0.42"/>
    `;

    const neckMarkup = `
        <path d="M103 146 L110 159 L117 146 L117 171 Q110 178 103 171 Z" fill="${skinTone}" opacity="0.96"/>
    `;

    const shoulders = `
        <path d="M72 160 L50 185 L60 206 L89 200 L96 168 Z" fill="rgba(15,23,42,0.15)"/>
        <path d="M148 160 L170 185 L160 206 L131 200 L124 168 Z" fill="rgba(15,23,42,0.15)"/>
    `;

    const shadowBelow = `
        <path d="M88 150 Q110 156 132 150" fill="none" stroke="rgba(70,45,32,0.18)" stroke-width="8" stroke-linecap="round"/>
    `;

    return `
        <div class="character-figure ${genderClass} ${roleClass} ${ageClass}" style="--coat-color:${palette.coat}; --hair-color:${variant.hairTone}; --skin-color:${palette.skin}; --accent-color:${palette.accent};">
            <canvas class="portrait-canvas" width="440" height="760" role="img" aria-label="${(character.name || 'Character').replace(/"/g, '&quot;')}" data-character-id="${character.id}"></canvas>
        </div>
    `;
}

function drawCharacterPortrait(canvas, character) {
    if (!canvas || !character) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth || 220;
    const cssH = canvas.clientHeight || 380;
    const w = Math.max(220, Math.floor(cssW * dpr));
    const h = Math.max(380, Math.floor(cssH * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.scale(w / 220, h / 380);

    const variant = getCharacterPortraitVariant(character);
    const skin = variant.skin;
    const hair = variant.hairTone;
    const accent = variant.accent;
    const isFemale = variant.isFemale;

    ctx.fillStyle = '#120f0e';
    ctx.fillRect(0, 0, 220, 380);

    const bg = ctx.createRadialGradient(110, 100, 10, 110, 120, 160);
    bg.addColorStop(0, 'rgba(78, 70, 64, 0.92)');
    bg.addColorStop(0.45, 'rgba(31, 28, 27, 0.98)');
    bg.addColorStop(1, 'rgba(6, 6, 7, 1)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 220, 380);

    const glow = ctx.createRadialGradient(110, 80, 8, 110, 100, 100);
    glow.addColorStop(0, 'rgba(255, 244, 222, 0.16)');
    glow.addColorStop(1, 'rgba(255, 244, 222, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(110, 100, 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let x = 58; x <= 162; x += 10) ctx.fillRect(x, 18, 1, 340);

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    ctx.ellipse(110, 360, 82, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Full body clothing with extended robe/dress
    if (isFemale) {
        const robe = ctx.createLinearGradient(40, 76, 180, 350);
        robe.addColorStop(0, '#e0d2c1');
        robe.addColorStop(0.35, '#c8b7a5');
        robe.addColorStop(0.7, '#a89584');
        robe.addColorStop(1, '#8b7a68');
        ctx.fillStyle = robe;
        ctx.beginPath();
        ctx.moveTo(44, 96);
        ctx.quadraticCurveTo(60, 78, 70, 84);
        ctx.quadraticCurveTo(64, 132, 66, 200);
        ctx.quadraticCurveTo(68, 280, 62, 350);
        ctx.lineTo(38, 350);
        ctx.quadraticCurveTo(32, 280, 34, 200);
        ctx.quadraticCurveTo(38, 120, 38, 112);
        ctx.quadraticCurveTo(39, 102, 44, 96);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(176, 96);
        ctx.quadraticCurveTo(160, 78, 150, 84);
        ctx.quadraticCurveTo(156, 132, 154, 200);
        ctx.quadraticCurveTo(152, 280, 158, 350);
        ctx.lineTo(182, 350);
        ctx.quadraticCurveTo(188, 280, 186, 200);
        ctx.quadraticCurveTo(182, 120, 182, 112);
        ctx.quadraticCurveTo(181, 102, 176, 96);
        ctx.closePath();
        ctx.fill();

        const dress = ctx.createLinearGradient(84, 98, 136, 350);
        dress.addColorStop(0, '#f7f1e8');
        dress.addColorStop(0.4, '#e3d9cc');
        dress.addColorStop(0.8, '#cabfad');
        dress.addColorStop(1, '#a89584');
        ctx.fillStyle = dress;
        ctx.beginPath();
        ctx.moveTo(84, 108);
        ctx.quadraticCurveTo(110, 100, 136, 108);
        ctx.lineTo(142, 350);
        ctx.quadraticCurveTo(110, 365, 78, 350);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(194, 165, 96, 0.95)';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(83, 104);
        ctx.lineTo(83, 349);
        ctx.moveTo(137, 104);
        ctx.lineTo(137, 349);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(194, 165, 96, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(85, 349);
        ctx.lineTo(94, 343);
        ctx.lineTo(103, 349);
        ctx.moveTo(117, 349);
        ctx.lineTo(126, 343);
        ctx.lineTo(135, 349);
        ctx.stroke();

        const sleeves = ctx.createLinearGradient(48, 110, 170, 340);
        sleeves.addColorStop(0, 'rgba(214, 205, 193, 0.92)');
        sleeves.addColorStop(0.5, 'rgba(190, 179, 166, 0.88)');
        sleeves.addColorStop(1, 'rgba(158, 146, 132, 0.8)');
        ctx.fillStyle = sleeves;
        ctx.beginPath();
        ctx.moveTo(48, 104);
        ctx.quadraticCurveTo(30, 128, 32, 200);
        ctx.quadraticCurveTo(32, 280, 36, 340);
        ctx.quadraticCurveTo(50, 320, 58, 240);
        ctx.quadraticCurveTo(58, 160, 58, 124);
        ctx.quadraticCurveTo(58, 104, 48, 104);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(172, 104);
        ctx.quadraticCurveTo(190, 128, 188, 200);
        ctx.quadraticCurveTo(188, 280, 184, 340);
        ctx.quadraticCurveTo(170, 320, 162, 240);
        ctx.quadraticCurveTo(162, 160, 162, 124);
        ctx.quadraticCurveTo(162, 104, 172, 104);
        ctx.closePath();
        ctx.fill();

        // Shoes/feet for female
        ctx.fillStyle = '#3d2a1f';
        ctx.beginPath();
        ctx.ellipse(92, 356, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(128, 356, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(227, 190, 171, 0.3)';
        ctx.beginPath();
        ctx.ellipse(92, 355, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(128, 355, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const jewelry = ctx.createLinearGradient(103, 54, 117, 122);
        jewelry.addColorStop(0, 'rgba(219, 194, 130, 0.95)');
        jewelry.addColorStop(1, 'rgba(139, 105, 43, 0.92)');
        ctx.strokeStyle = jewelry;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(110, 122);
        ctx.lineTo(110, 136);
        ctx.stroke();

        ctx.fillStyle = 'rgba(219, 194, 130, 0.92)';
        ctx.beginPath();
        ctx.arc(110, 138, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(111, 138, 1.0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const coat = ctx.createLinearGradient(42, 82, 178, 340);
        coat.addColorStop(0, '#182b33');
        coat.addColorStop(0.35, '#1b4c49');
        coat.addColorStop(0.7, '#0f3a38');
        coat.addColorStop(1, '#0b1118');
        ctx.fillStyle = coat;
        ctx.beginPath();
        ctx.moveTo(48, 102);
        ctx.quadraticCurveTo(66, 84, 72, 90);
        ctx.quadraticCurveTo(68, 140, 70, 210);
        ctx.quadraticCurveTo(72, 280, 64, 340);
        ctx.lineTo(44, 340);
        ctx.quadraticCurveTo(36, 280, 38, 210);
        ctx.quadraticCurveTo(42, 140, 42, 116);
        ctx.quadraticCurveTo(44, 106, 48, 102);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(172, 102);
        ctx.quadraticCurveTo(154, 84, 148, 90);
        ctx.quadraticCurveTo(152, 140, 150, 210);
        ctx.quadraticCurveTo(148, 280, 156, 340);
        ctx.lineTo(176, 340);
        ctx.quadraticCurveTo(184, 280, 182, 210);
        ctx.quadraticCurveTo(178, 140, 178, 116);
        ctx.quadraticCurveTo(176, 106, 172, 102);
        ctx.closePath();
        ctx.fill();

        // Male pants/legs
        const pants = ctx.createLinearGradient(75, 200, 145, 340);
        pants.addColorStop(0, '#1a2c2e');
        pants.addColorStop(0.5, '#0f1f22');
        pants.addColorStop(1, '#050a0c');
        ctx.fillStyle = pants;
        ctx.beginPath();
        ctx.moveTo(80, 200);
        ctx.lineTo(72, 340);
        ctx.lineTo(88, 340);
        ctx.lineTo(96, 200);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(140, 200);
        ctx.lineTo(148, 340);
        ctx.lineTo(164, 340);
        ctx.lineTo(132, 200);
        ctx.closePath();
        ctx.fill();

        // Shoes/feet for male
        ctx.fillStyle = '#1a1410';
        ctx.beginPath();
        ctx.ellipse(80, 346, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(156, 346, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    const neck = ctx.createLinearGradient(102, 128, 118, 164);
    neck.addColorStop(0, skin);
    neck.addColorStop(1, '#8f634c');
    ctx.fillStyle = neck;
    ctx.fillRect(103, 132, 14, 26);
    ctx.fillRect(101, 154, 18, 8);

    const face = ctx.createLinearGradient(90, 44, 130, 136);
    face.addColorStop(0, '#fff4ea');
    face.addColorStop(0.42, skin);
    face.addColorStop(0.78, '#c78f71');
    face.addColorStop(1, '#9b6754');
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.moveTo(94, 62);
    ctx.quadraticCurveTo(110, 46, 126, 62);
    ctx.quadraticCurveTo(131, 86, 128, 108);
    ctx.quadraticCurveTo(124, 131, 110, 140);
    ctx.quadraticCurveTo(96, 131, 92, 108);
    ctx.quadraticCurveTo(89, 86, 94, 62);
    ctx.closePath();
    ctx.fill();

    const hairGrad = ctx.createLinearGradient(84, 24, 136, 108);
    hairGrad.addColorStop(0, '#a39cac');
    hairGrad.addColorStop(0.4, hair);
    hairGrad.addColorStop(1, '#2a232d');
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    if (isFemale) {
        ctx.moveTo(84, 58);
        ctx.quadraticCurveTo(88, 24, 110, 20);
        ctx.quadraticCurveTo(132, 24, 136, 58);
        ctx.quadraticCurveTo(140, 88, 132, 104);
        ctx.quadraticCurveTo(123, 116, 110, 118);
        ctx.quadraticCurveTo(97, 116, 88, 104);
        ctx.quadraticCurveTo(80, 88, 84, 58);
    } else {
        ctx.moveTo(84, 56);
        ctx.quadraticCurveTo(92, 32, 110, 28);
        ctx.quadraticCurveTo(128, 32, 136, 56);
        ctx.quadraticCurveTo(140, 80, 132, 96);
        ctx.quadraticCurveTo(124, 108, 110, 112);
        ctx.quadraticCurveTo(96, 108, 88, 96);
        ctx.quadraticCurveTo(80, 80, 84, 56);
    }
    ctx.closePath();
    ctx.fill();

    if (isFemale) {
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.beginPath();
        ctx.moveTo(95, 35);
        ctx.lineTo(102, 26);
        ctx.lineTo(110, 32);
        ctx.lineTo(118, 26);
        ctx.lineTo(125, 35);
        ctx.lineTo(110, 41);
        ctx.closePath();
        ctx.fill();
    }

    if (variant.nobleStyle === 'royal' || variant.nobleStyle === 'court') {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(96, 48);
        ctx.lineTo(102, 40);
        ctx.lineTo(110, 45);
        ctx.lineTo(118, 40);
        ctx.lineTo(124, 48);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = '#25293a';
    ctx.beginPath();
    ctx.ellipse(100, 86, 5.3, 3.4, -0.05, 0, Math.PI * 2);
    ctx.ellipse(120, 86, 5.3, 3.4, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5f1ea';
    ctx.beginPath();
    ctx.arc(100, 86, 1, 0, Math.PI * 2);
    ctx.arc(120, 86, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(73, 46, 42, 0.72)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(110, 88);
    ctx.quadraticCurveTo(108, 94, 110, 99);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(155, 91, 88, 0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(102, 112);
    ctx.quadraticCurveTo(110, 117, 118, 112);
    ctx.stroke();

    if (isFemale) {
        ctx.strokeStyle = 'rgba(169, 137, 103, 0.58)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(93, 80);
        ctx.quadraticCurveTo(98, 76, 103, 79);
        ctx.moveTo(127, 80);
        ctx.quadraticCurveTo(122, 76, 117, 79);
        ctx.stroke();
    }

    if (!isFemale && variant.beardStyle !== 'none') {
        ctx.fillStyle = 'rgba(49, 38, 40, 0.88)';
        ctx.beginPath();
        if (variant.beardStyle === 'full') {
            ctx.moveTo(94, 112);
            ctx.quadraticCurveTo(110, 128, 126, 112);
            ctx.lineTo(123, 130);
            ctx.quadraticCurveTo(110, 140, 97, 130);
        } else if (variant.beardStyle === 'pointed') {
            ctx.moveTo(95, 112);
            ctx.quadraticCurveTo(110, 126, 125, 112);
            ctx.lineTo(119, 128);
            ctx.lineTo(110, 140);
            ctx.lineTo(101, 128);
        } else if (variant.beardStyle === 'short') {
            ctx.moveTo(95, 114);
            ctx.quadraticCurveTo(110, 123, 125, 114);
            ctx.lineTo(123, 126);
            ctx.quadraticCurveTo(110, 132, 97, 126);
        } else {
            ctx.moveTo(95, 114);
            ctx.quadraticCurveTo(110, 122, 125, 114);
            ctx.lineTo(123, 126);
            ctx.quadraticCurveTo(110, 132, 97, 126);
        }
        ctx.closePath();
        ctx.fill();
    }

    // subtle dress shadow and hand cue for the reference-like stance
    if (isFemale) {
        ctx.fillStyle = 'rgba(88, 78, 68, 0.22)';
        ctx.beginPath();
        ctx.moveTo(118, 142);
        ctx.quadraticCurveTo(126, 154, 126, 200);
        ctx.quadraticCurveTo(124, 280, 118, 340);
        ctx.quadraticCurveTo(112, 350, 108, 352);
        ctx.quadraticCurveTo(104, 350, 102, 340);
        ctx.quadraticCurveTo(106, 280, 108, 200);
        ctx.quadraticCurveTo(112, 154, 118, 142);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(94, 68, 62, 0.92)';
        ctx.beginPath();
        ctx.ellipse(136, 200, 4.4, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(227, 190, 171, 0.96)';
        ctx.beginPath();
        ctx.ellipse(136, 200, 3.1, 10, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function openCharModal(id) {
    const c = game.characters.find(x => x.id === id);
    if (!c) return;

    const modalName = document.getElementById('modal-char-name');
    const modalOpinion = document.getElementById('modal-char-opinion');
    const modalDetails = document.getElementById('modal-char-details');
    const modalClaim = document.getElementById('modal-claim-box');
    const modalMemory = document.getElementById('modal-memory-box');
    const modelScene = document.getElementById('char-model-scene');
    const actionsEl = document.getElementById('modal-actions');

    if (modelScene) {
        // Try portrait system first (Blender render with canvas fallback)
        if (typeof portraitSystem !== 'undefined' && portraitSystem) {
            portraitSystem.getPortraitHTML(c).then(html => {
                modelScene.innerHTML = html;
                
                // If canvas render is being used, draw it
                const portraitCanvas = modelScene.querySelector('.portrait-canvas');
                if (portraitCanvas && typeof drawCharacterPortrait === 'function') {
                    requestAnimationFrame(() => drawCharacterPortrait(portraitCanvas, c));
                }
            }).catch(() => {
                // Fallback if promise fails
                modelScene.innerHTML = renderCharacterModel(c);
                const portraitCanvas = modelScene.querySelector('.portrait-canvas');
                if (portraitCanvas) {
                    requestAnimationFrame(() => drawCharacterPortrait(portraitCanvas, c));
                }
            });
        } else {
            // Fallback if portraitSystem not available
            modelScene.innerHTML = renderCharacterModel(c);
            const portraitCanvas = modelScene.querySelector('.portrait-canvas');
            if (portraitCanvas) {
                requestAnimationFrame(() => drawCharacterPortrait(portraitCanvas, c));
            }
        }
    }

    const spouse = game.getSpouse(c);
    const spouseText = spouse ? `Spouse: ${spouse.name} (${spouse.role})` : (c.married ? 'Spouse: Unconfirmed' : 'Spouse: None');
    const parentIds = Array.isArray(c.parents) && c.parents.length
        ? c.parents
        : [c.parentId, c.motherId].filter(Boolean);
    const parentNames = parentIds
        .map(id => game.characters.find(parent => parent.id === id)?.name)
        .filter(Boolean);
    const parentsText = parentNames.length ? `Parents: ${parentNames.join(' and ')}` : null;
    const profileExtras = [
        parentsText,
        c.background ? `Background: ${c.background}` : null,
        c.education ? `Education: ${c.education}` : null,
        c.goal ? `Goal: ${c.goal}` : null,
        c.fear ? `Fear: ${c.fear}` : null,
        c.demeanor ? `Demeanor: ${c.demeanor}` : null
    ].filter(Boolean).join(' • ');

    if (modalName) modalName.innerText = c.name;
    if (modalOpinion) modalOpinion.innerText = `Gender: ${c.gender || 'Unknown'} • Opinion: ${c.opinion}/100`;
    if (modalDetails) modalDetails.innerText = `${c.role} • Gender: ${c.gender || 'Unknown'} • Status: ${c.status} • ${spouseText} • Traits: ${c.traits ? c.traits.join(', ') : 'None'}${profileExtras ? ` • ${profileExtras}` : ''}`;

    const isDossierUnlocked = game.intelligenceSystem.discoveredSecrets.has(c.id);

    if (modalClaim) {
        modalClaim.innerHTML = `
            <strong>Dynastic Profile:</strong> Personal Ambition: ${c.ambition}% | Military Favor: ${c.militarySupport}%<br>
            ${isDossierUnlocked ? `<span style="color:var(--danger)"><strong>Intelligence Dossier:</strong> ${c.secret}</span>` : 'No suspicious dossier unlocked. Deploy wiretap or investigate rumors.'}
        `;
    }

    if (modalMemory) {
        if (!c.memory || c.memory.length === 0) {
            modalMemory.innerHTML = `<span style="color:var(--text-muted)">No past memory interactions recorded.</span>`;
        } else {
            modalMemory.innerHTML = c.memory.map(m => `
                <div><strong style="color:${m.delta >= 0 ? 'var(--success)' : 'var(--danger)'}">[${m.year}] ${m.delta >= 0 ? '+' : ''}${m.delta} Op.</strong> — ${m.reason}</div>
            `).join('');
        }
    }

    if (actionsEl) {
        let relHtml = '<div style="margin-top:8px; border-top:1px solid var(--panel-border); padding-top:6px;">';
        relHtml += '<h4 style="color:var(--text-muted); font-size:0.7rem; margin-bottom:4px;">Relationships Web</h4>';
        game.characters.forEach(other => {
            if (other.id === c.id || other.status === "Deceased") return;
            const rel = game.getRelation(c.id, other.id);
            const color = rel.value >= 40 ? 'var(--success)' : (rel.value <= -40 ? 'var(--danger)' : 'var(--accent-gold)');
            relHtml += `<div style="display:flex; justify-content:space-between; font-size:0.7rem; padding:2px 0;">`;
            relHtml += `<span>${other.name}</span>`;
            relHtml += `<span style="color:${color};">${rel.value} (${rel.type}) ${rel.alliance ? '🤝' : ''}</span>`;
            relHtml += `</div>`;
        });
        relHtml += '</div>';

        const headId = typeof getHeadId === 'function' ? getHeadId() : (game.dynasty?.headId || game.realm?.rulerId);
        const activeRuler = typeof getRulerCharacter === 'function' ? getRulerCharacter() : game.characters.find(ch => ch.isPlayer);
        const isSelf = c.isPlayer || c.id === headId || c.id === activeRuler?.id || c.id === game.realm?.rulerId;
        const isAllied = game.getRelation(headId, c.id).alliance;

        let actionBtns = '';
        if (c.status === "Deceased") {
            actionBtns = `<div style="grid-column:1/-1; text-align:center; padding:8px; color:var(--text-muted);">✝️ Deceased Historical Character</div>`;
        } else if (isSelf) {
            actionBtns = `<div style="grid-column:1/-1; text-align:center; padding:8px; color:var(--accent-gold); font-weight:bold;">👑 Reigning Sovereign (Active Player)</div>`;
        } else if (c.status === "Imprisoned") {
            actionBtns = `
                <button class="action-btn" onclick="charAction(${c.id}, 'pardon')">🕊️ Royal Pardon</button>
                <button class="action-btn" onclick="charAction(${c.id}, 'execute')">☠️ Execute Treason</button>
            `;
        } else {
            actionBtns = `
                <button class="action-btn" onclick="charAction(${c.id}, 'dinner')">🍷 Host Dinner (-$0.1B)</button>
                <button class="action-btn" onclick="charAction(${c.id}, 'bribe')">💰 Bribe (-$0.3B)</button>
                <button class="action-btn" onclick="charAction(${c.id}, 'arrest')">🚨 Order Arrest</button>
                <button class="action-btn" onclick="charAction(${c.id}, 'wiretap')">👁️ Electronic Wiretap</button>
                <button class="action-btn" onclick="charAction(${c.id}, 'marriage')">💍 Dynastic Alliance</button>
                <button class="action-btn" onclick="charAction(${c.id}, 'plot')">🗡️ Covert Strike (-150P)</button>
                <button class="action-btn" onclick="charAction(${c.id}, 'title')">📜 Confer Title</button>
                ${isAllied ? 
                    `<button class="action-btn" onclick="breakAllianceWith(${c.id})">💔 Break Alliance</button>` :
                    `<button class="action-btn" onclick="formAllianceWith(${c.id})">🤝 Form Alliance</button>`
                }
            `;
        }

        actionsEl.innerHTML = relHtml + '<div class="action-grid" style="margin-top:8px;">' + actionBtns + '</div>';
    }
    
    const modal = document.getElementById('char-modal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('char-modal');
    if (modal) modal.style.display = 'none';
}

function charAction(id, type) {
    const c = game.characters.find(x => x.id === id);
    if (!c) return;
    closeModal();

    if (!c.memory) c.memory = [];

    if (type === 'dinner') {
        if (game.realm.treasury >= 0.1) {
            game.realm.treasury -= 0.1;
            c.opinion = Math.min(100, c.opinion + 15);
            c.memory.push({ year: game.date.getFullYear(), delta: 15, reason: "Hosted Citadel dinner" });
            game.improveRelation(game.dynasty.headId, c.id, 10);
            log(`Hosted private dinner at Citadel for ${c.name}.`);
        }
    } else if (type === 'arrest') {
        c.status = "Imprisoned";
        c.opinion -= 60;
        c.memory.push({ year: game.date.getFullYear(), delta: -60, reason: "Placed under royal arrest" });
        game.realm.prestige += 15;
        log(`Decreed formal arrest and detainment of ${c.name}.`);
    } else if (type === 'pardon') {
        c.status = "Active";
        c.opinion += 30;
        c.memory.push({ year: game.date.getFullYear(), delta: 30, reason: "Granted royal pardon" });
        log(`Granted royal pardon to ${c.name}.`);
    } else if (type === 'execute') {
        log(`Executed ${c.name} following tribunal sentencing.`);
        game.characters = game.characters.filter(x => x.id !== c.id);
    } else if (type === 'bribe') {
        if (game.realm.treasury >= 0.3) {
            game.realm.treasury -= 0.3;
            c.opinion = Math.min(100, c.opinion + 25);
            c.memory.push({ year: game.date.getFullYear(), delta: 25, reason: "Discretionary funds transfer" });
            log(`Authorized discretionary transfers to ${c.name}.`);
        }
    } else if (type === 'wiretap') {
        game.intelligenceSystem.activeWiretaps.add(c.id);
        c.memory.push({ year: game.date.getFullYear(), delta: -10, reason: "Electronic surveillance installed" });
        log(`Installed electronic surveillance over ${c.name}'s quarters.`);
    } else if (type === 'marriage') {
        if (!c.married) {
            const player = game.characters.find(ch => ch.isPlayer && ch.status === "Active");
            if (player) {
                game.setSpouse(c, player);
            } else {
                c.married = true;
            }
            game.realm.prestige += 80;
            c.memory.push({ year: game.date.getFullYear(), delta: 25, reason: "Arranged dynastic marriage" });
            log(`Celebrated high-profile diplomatic marriage for ${c.name}.`);
        }
    } else if (type === 'plot') {
        if (game.realm.prestige >= 150) {
            game.realm.prestige -= 150;
            game.realm.activePlot = { targetId: c.id, targetName: c.name, progress: 20 };
            log(`Authorized covert operation targeting ${c.name}.`);
        }
    } else if (type === 'title') {
        c.opinion = Math.min(100, c.opinion + 20);
        c.memory.push({ year: game.date.getFullYear(), delta: 20, reason: "Conferred sovereign title" });
        game.realm.prestige += 20;
        log(`Conferred sovereign honors upon ${c.name}.`);
    }

    updateUI();
}

function formAllianceWith(id) {
    const fromId = game.dynasty.headId;
    const rel = game.getRelation(fromId, id);
    if (!rel.alliance && rel.value >= 20) {
        game.formAlliance(fromId, id);
        log(`Formed political alliance with ${game.characters.find(c=>c.id===id).name}.`);
        updateUI();
        openCharModal(id);
    } else {
        log("Relationship too low to form alliance (needs 20+).");
    }
}

function breakAllianceWith(id) {
    const fromId = game.dynasty.headId;
    const rel = game.getRelation(fromId, id);
    if (rel.alliance) {
        game.breakAlliance(fromId, id);
        log(`Broke alliance with ${game.characters.find(c=>c.id===id).name}.`);
        updateUI();
        openCharModal(id);
    }
}

function log(msg) {
    const dateStr = game.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const logBox = document.getElementById('log');
    if (logBox) {
        logBox.innerHTML = `<div><strong style="color:var(--accent-blue)">[${dateStr}]</strong> ${msg}</div>` + logBox.innerHTML;
    }
}

// Save & Load
function saveGame() {
    const validDate = (game.date instanceof Date && !isNaN(game.date.getTime())) ? game.date : new Date();
    const saveData = {
        saveVersion: 2,
        ...game,
        date: validDate.toISOString(),
        activeEvent: null,
        usedEvents: Array.from(game.usedEvents || []),
        activeWiretaps: Array.from(game.intelligenceSystem?.activeWiretaps || []),
        discoveredSecrets: Array.from(game.intelligenceSystem?.discoveredSecrets || []),
        logHistory: document.getElementById('log') ? document.getElementById('log').innerHTML : ""
    };
    localStorage.setItem('vancuria_save', JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem('vancuria_save');
    if (!saved) return false;

    try {
        const loaded = JSON.parse(saved);
        if (loaded.saveVersion !== 2) {
            localStorage.removeItem('vancuria_save');
            return false;
        }
        Object.assign(game, loaded);

        game.date = loaded.date ? new Date(loaded.date) : new Date();
        if (isNaN(game.date.getTime())) game.date = new Date();

        game.activeEvent = null;
        game.usedEvents = new Set(loaded.usedEvents || []);

        // Sanitize any non-finite numeric state restored from localStorage
        if (!game.realm || !isFinite(game.realm.treasury)) game.realm.treasury = 10.45;
        if (!isFinite(game.realm.gdp) || game.realm.gdp <= 0) game.realm.gdp = 82.4;
        if (!game.budget || !isFinite(game.budget.sovereignDebt)) game.budget.sovereignDebt = 5.0;
        if (!isFinite(game.realm.taxRate)) game.realm.taxRate = 1.0;
        if (game.corporations) {
            game.corporations.forEach(c => {
                if (!isFinite(c.valuation) || c.valuation <= 0) c.valuation = 15.0;
                c.valuation = Math.min(300.0, c.valuation);
            });
        }

        if (game.intelligenceSystem) {
            game.intelligenceSystem.activeWiretaps = new Set(loaded.activeWiretaps || []);
            game.intelligenceSystem.discoveredSecrets = new Set(loaded.discoveredSecrets || []);
        }

        if (typeof game.bindStateMetrics === 'function') {
            game.bindStateMetrics();
        }

        const logBox = document.getElementById('log');
        if (logBox && loaded.logHistory) {
            logBox.innerHTML = loaded.logHistory;
        }

        return true;
    } catch (e) {
        console.error("Failed to restore saved game:", e);
        return false;
    }
}

function confirmResetGame() {
    showNewGameModal();
}

function startNewGameConfigured(config = {}) {
    const rulerName = config.rulerName || "Grand Duke Victor Vance";
    const dynastyName = config.dynastyName || "House Vance";
    const realmName = config.realmName || "Vancuria";
    const capitalName = config.capitalName || "Capital Citadel";
    const government = config.government || "Constitutional Monarchy";
    const difficulty = config.difficulty || "Normal";
    const scenario = config.scenario || "crisis";

    game.date = new Date(2026, 0, 1);
    game.totalMonthsPassed = 0;
    game.usedEvents = new Set();
    
    game.realm.name = realmName;
    game.realm.capital = capitalName;
    game.realm.government = government;
    game.realm.difficulty = difficulty;

    if (game.dynasty) {
        game.dynasty.name = dynastyName;
    }

    const ruler = typeof getRulerCharacter === 'function' ? getRulerCharacter() : null;
    if (ruler) {
        ruler.name = rulerName;
    }

    // Apply scenario modifier
    const scenarioMap = {
        stable: { approval: 70, fervor: 10, treasury: 5.0, coupRisk: 5 },
        crisis: { approval: 48, fervor: 35, treasury: 5.0, coupRisk: 15 },
        revolution: { approval: 32, fervor: 75, treasury: 5.0, coupRisk: 30 },
        military: { approval: 45, fervor: 25, treasury: 5.0, coupRisk: 40 }
    };
    const mod = scenarioMap[scenario] || scenarioMap.crisis;
    game.realm.approval = mod.approval;
    game.realm.treasury = mod.treasury;
    if (game.revolution) game.revolution.fervor = mod.fervor;
    if (game.politics) game.politics.coupRisk = mod.coupRisk;

    // Reset intelligence
    game.intelligenceSystem = {
        agency: "Directorate of National Security",
        domestic: 72, foreign: 48, cyber: 81, counterIntel: 64,
        activeWiretaps: new Set(),
        discoveredSecrets: new Set(),
        rumors: [], cases: []
    };

    if (typeof updateUI === 'function') updateUI();
    if (typeof log === 'function') log(`👑 A new reign begins! ${rulerName} of ${dynastyName} rules ${realmName}.`);
}

function confirmStartNewGame() {
    const rulerName = document.getElementById('ng-ruler-name')?.value || "Grand Duke Victor Vance";
    const dynastyName = document.getElementById('ng-dynasty-name')?.value || "House Vance";
    const realmName = document.getElementById('ng-realm-name')?.value || "Vancuria";
    const capitalName = document.getElementById('ng-capital-name')?.value || "Capital Citadel";
    const government = document.getElementById('ng-government')?.value || "Constitutional Monarchy";
    const difficulty = document.getElementById('ng-difficulty')?.value || "Normal";
    const scenario = document.getElementById('ng-scenario')?.value || "crisis";

    startNewGameConfigured({
        rulerName,
        dynastyName,
        realmName,
        capitalName,
        government,
        difficulty,
        scenario
    });

    closeNewGameModal();
    hideTitleScreen();
}

function acceptMarriageProposal(proposalId) {
    const idx = game.marriageProposals.findIndex(p => p.id === proposalId);
    if (idx === -1) return;
    const p = game.marriageProposals[idx];
    const vanceChar = game.characters.find(c => c.id === p.vanceCharId);

    if (vanceChar) {
        const partner = game.generateCharacter({
            name: p.candidateName,
            gender: vanceChar.gender === "Male" ? "Female" : "Male",
            houseId: p.houseId,
            type: "family",
            role: "Spouse & Consort",
            age: Math.max(18, Math.min(45, vanceChar.age + (Math.random() * 8 - 4))),
            traits: ["Diplomatic", "Calm"],
            status: "Active"
        });
        game.setSpouse(vanceChar, partner);
        game.realm.prestige += 50;
        game.realm.treasury += p.wealthGain;
        const targetHouse = game.houses.find(h => h.id === p.houseId);
        if (targetHouse) targetHouse.loyaltyToCrown = Math.min(100, targetHouse.loyaltyToCrown + p.loyaltyGain);

        log(`MARRIAGE CELEBRATED: ${vanceChar.name} married ${p.candidateName} of ${p.houseName} (+$${p.wealthGain}B Treasury, +${p.loyaltyGain}% Loyalty).`);
        game.generationalTimeline.unshift({
            year: game.date.getFullYear(),
            text: `${vanceChar.name} married ${p.candidateName} of ${p.houseName}.`
        });
    }

    game.marriageProposals.splice(idx, 1);
    updateUI();
}

function rejectMarriageProposal(proposalId) {
    game.marriageProposals = game.marriageProposals.filter(p => p.id !== proposalId);
    log("Declined marriage proposal offer.");
    updateUI();
}

function adjustBudgetSector(sector, delta) {
    const exp = game.budget.expenditure;
    if (exp[sector] !== undefined) {
        exp[sector] = Math.max(0.1, +(exp[sector] + delta).toFixed(2));
        log(`FISCAL DECREE: Adjusted ${sector.toUpperCase()} expenditure by ${delta >= 0 ? '+' : ''}$${delta}B/mo (New Allocation: $${exp[sector]}B/mo).`);
        updateUI();
    }
}

function repaySovereignBonds(amount) {
    if (game.budget.sovereignDebt <= 0) {
        log("Sovereign debt is already zero.");
        return;
    }
    const repayAmt = Math.min(game.budget.sovereignDebt, amount);
    if (game.realm.treasury < repayAmt) {
        log(`Insufficient treasury reserves ($${game.realm.treasury.toFixed(2)}B) to repay $${repayAmt}B in sovereign bonds.`);
        return;
    }

    game.realm.treasury -= repayAmt;
    game.budget.sovereignDebt -= repayAmt;
    game.adjustLegitimacy(5);
    log(`SOVEREIGN BOND REPAYMENT: Paid off $${repayAmt.toFixed(1)}B in debt. Remaining Debt: $${game.budget.sovereignDebt.toFixed(1)}B.`);
    updateUI();
}

function investInCorporation(corpId) {
    const corp = game.corporations.find(c => c.id === corpId);
    if (!corp) return;

    if (corp.stateOwned) {
        log(`${corp.name} is already state-owned; private investment is unavailable.`);
        return;
    }

    if (game.realm.treasury < 0.5) {
        log(`Insufficient funds to invest in ${corp.name}. Requires $0.5B.`);
        return;
    }

    game.realm.treasury -= 0.5;
    corp.valuation = +(corp.valuation + 1.8).toFixed(1);
    corp.investmentCount = (corp.investmentCount || 0) + 1;
    corp.productivity = Math.min(150, (corp.productivity || 100) + 3);
    game.realm.gdp = +(game.realm.gdp * 1.006).toFixed(2);
    game.economyPolicies ||= {};
    game.economyPolicies.lastInvestment = corp.id;
    const ceo = game.characters.find(c => c.id === corp.ceoId);
    if (ceo) ceo.opinion = Math.min(100, ceo.opinion + 15);

    log(`STATE INVESTMENT: Injected $0.5B capital into ${corp.name}. Valuation rose to $${corp.valuation}B.`);
    if (typeof saveGame === 'function') saveGame();
    updateUI();
}

function nationalizeCorporation(corpId) {
    const corp = game.corporations.find(c => c.id === corpId);
    if (!corp) return;
    if (corp.stateOwned) {
        log(`${corp.name} is already nationalized.`);
        return;
    }

    triggerEventModal({
        title: `NATIONALIZE ${corp.name.toUpperCase()}?`,
        desc: `Are you sure you want to seize corporate assets of ${corp.name}? You will gain $${(corp.valuation * 0.4).toFixed(1)}B in immediate treasury revenue, BUT Oligarch loyalty will drop to 0% and military coup risk will spike!`,
        choices: [
            {
                text: `⚡ Confirm Seizure (+$${(corp.valuation * 0.4).toFixed(1)}B Treasury)`,
                act: () => {
                    const bounty = +(corp.valuation * 0.4).toFixed(1);
                    game.realm.treasury += bounty;
                    corp.valuation = +(corp.valuation * 0.5).toFixed(1);
                    corp.stateOwned = true;
                    corp.stateRevenueRate = 0.012;
                    game.economyPolicies ||= {};
                    game.economyPolicies.nationalizedCorporations ||= [];
                    if (!game.economyPolicies.nationalizedCorporations.includes(corp.id)) {
                        game.economyPolicies.nationalizedCorporations.push(corp.id);
                    }
                    game.realm.gdp = Math.max(20, +(game.realm.gdp * 0.985).toFixed(2));
                    game.realm.stability = Math.max(0, game.realm.stability - 4);
                    const oligarchFaction = game.factions.find(f => f.id === 1);
                    if (oligarchFaction) oligarchFaction.loyalty = 0;
                    game.military.coupRisk += 25;
                    log(`SOVEREIGN DECREE: Nationalized ${corp.name}! Seized $${bounty}B into treasury reserves.`);
                    updateUI();
                }
            },
            {
                text: "Cancel Nationalization Order",
                act: () => {}
            }
        ]
    });
}
