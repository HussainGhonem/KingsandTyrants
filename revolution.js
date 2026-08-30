// revolution.js — Revolutionary State Machine & Crisis Engine
// Pipeline: Fervor 100% → Activation → Spawn → Cells → Escalation → Regime Change / Suppression

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function rInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── STAGE ORDERING ───────────────────────────────────────────────────────────
const REV_STAGES = ["dormant","agitation","organization","unrest","insurrection","revolution","civil_war","new_regime"];
function advanceRevStage() {
    const r = game.revolution;
    const idx = REV_STAGES.indexOf(r.stage);
    if (idx < REV_STAGES.length - 1) {
        r.stage = REV_STAGES[idx + 1];
        log(`☭ REVOLUTIONARY STAGE ESCALATED → ${r.stage.toUpperCase()}`);
        game.generationalTimeline.unshift({ year: game.date.getFullYear(), text: `Revolution escalated to ${r.stage} stage.` });
    }
}

// ─── SPAWN: REVOLUTIONARY LEADER ──────────────────────────────────────────────
function spawnRevolutionaryLeader(role, ideology) {
    const firstNamesMale   = ["Samir","Andrei","Nikolai","Dani","Tariq","Gabriel","Ivan","Lukas","Omar","Reza"];
    const firstNamesFemale = ["Leila","Sofia","Mira","Yasmin","Irina","Clara","Nadia","Vera","Amara","Elena"];
    const lastNames        = ["Haddad","Mirov","Karimi","Osei","Varga","Theron","Rashidi","Kovač","Dragan","Fasil"];

    const isMale    = Math.random() < 0.55;
    const firstName = isMale ? rChoice(firstNamesMale) : rChoice(firstNamesFemale);
    const lastName  = rChoice(lastNames);
    const fullName  = `${firstName} ${lastName}`;

    const ideologyTraitMap = {
        "Republican":   ["Charismatic","Idealistic"],
        "Socialist":    ["Calculating","Brave"],
        "Nationalist":  ["Ambitious","Hawk"],
        "Democratic":   ["Diplomat","Calm"],
        "Radical":      ["Reckless","Zealot"]
    };

    const char = game.generateCharacter({
        name: fullName,
        gender: isMale ? "Male" : "Female",
        age: rInt(28, 55),
        role: role || "Revolutionary Leader",
        type: "cabinet",
        houseId: null,
        opinion: -94,
        claimStrength: rInt(30, 60),
        militarySupport: rInt(15, 50),
        aristocraticSupport: rInt(5, 25),
        publicSupport: rInt(40, 80),
        traits: (ideologyTraitMap[ideology] || ["Ambitious","Reckless"]).slice(),
        health: rInt(75, 95)
    });

    char.revolutionary     = true;
    char.ideology          = ideology || rChoice(["Republican","Socialist","Nationalist","Democratic","Radical"]);
    char.influence         = rInt(40, 80);
    char.popularity        = rInt(30, 75);
    char.underSurveillance = false;
    char.imprisoned        = false;
    char.exiled            = false;
    char.martyred          = false;

    game.revolution.leaders.push(char.id);
    log(`⚡ REVOLUTIONARY LEADER EMERGES: ${char.name} (${char.ideology}) has stepped from the shadows.`);
    return char;
}

// ─── SPAWN: REVOLUTIONARY ORGANIZATION ────────────────────────────────────────
function spawnRevolutionaryOrganization(ideology) {
    const orgNames = {
        "Republican":   ["Vancurian Republican Movement","Free Vancuria Coalition","Citizens' Republic Committee"],
        "Socialist":    ["Workers' Revolutionary Front","People's Liberation Committee","Proletarian Vanguard"],
        "Nationalist":  ["National Renewal Movement","Fatherland Guard","Sovereign People's Alliance"],
        "Democratic":   ["Democratic Reform Front","People's Assembly Movement","Civic Liberty Coalition"],
        "Radical":      ["Revolutionary Action Council","Red Dawn Collective","People's Armed Committee"]
    };

    const names = orgNames[ideology] || ["Underground Liberation Front"];
    const org = {
        id: `org_${Date.now()}_${rInt(1,999)}`,
        name: rChoice(names),
        ideology: ideology,
        support: rInt(15, 40),
        organization: rInt(10, 30),
        armedCells: 0,
        discovered: false,
        monthsFounded: 0
    };

    game.revolution.organizations.push(org);
    log(`🏴 UNDERGROUND ORGANIZATION FORMED: "${org.name}" — ideology: ${org.ideology}`);
    return org;
}

// ─── SPAWN: PROVINCIAL CELL ───────────────────────────────────────────────────
function spawnRevolutionaryCell() {
    const r = game.revolution;
    const provinces = game.provinces.filter(p => p.unrest > 10);
    if (!provinces.length) return;

    const prov = rChoice(provinces);
    const cell = {
        id: `cell_${Date.now()}_${rInt(1,999)}`,
        province: prov.name,
        provinceId: prov.id,
        strength: rInt(10, 35),
        support: rInt(20, 65),
        secrecy: rInt(50, 92),
        armed: false
    };

    r.cells.push(cell);
    log(`🕳️ UNDERGROUND CELL ESTABLISHED in ${prov.name} — secrecy ${cell.secrecy}%`);
    return cell;
}

// ─── EXPAND CELLS MONTHLY ─────────────────────────────────────────────────────
function expandRevolutionaryCells() {
    const r = game.revolution;
    if (r.organization < 15) return;

    const chancePerOrg = 0.25 + (r.organization / 100) * 0.30;
    if (Math.random() < chancePerOrg && r.cells.length < 12) {
        spawnRevolutionaryCell();
    }

    // Arm existing cells as armed support grows
    r.cells.forEach(cell => {
        if (!cell.armed && r.armedSupport > 30 && Math.random() < 0.18) {
            cell.armed = true;
            r.organizations.forEach(o => o.armedCells = (o.armedCells || 0) + 1);
            log(`⚔️ CELL IN ${cell.province.toUpperCase()} HAS ACQUIRED WEAPONS.`);
        }
        // Gradually grow cell strength
        cell.strength = Math.min(100, cell.strength + rInt(0, 3));
    });
}

// ─── MONTHLY REVOLUTION TICK STATS ───────────────────────────────────────────
function tickRevolutionStats() {
    const r = game.revolution;

    game.sanitizeState();

    // Organization grows from active cells + organizations
    const orgBonus = r.cells.length * 2 + r.organizations.length * 4;
    r.organization = Math.min(100, r.organization + rInt(0, 2) + (orgBonus > 0 ? 1 : 0));

    // Popular support grows from low approval + high fervor
    const popBonus = game.realm.approval < 40 ? 2 : (game.realm.approval < 55 ? 1 : 0);
    r.popularSupport = Math.min(100, r.popularSupport + rInt(0, 2) + popBonus);

    // Armed support grows slowly once org is established
    if (r.organization > 30) {
        r.armedSupport = Math.min(100, r.armedSupport + rInt(0, 1));
    }

    // Revolutionary legitimacy builds from leadership + popular support
    const legitBonus = (r.leaders.length > 0 ? 2 : 0) + (r.popularSupport > 50 ? 1 : 0);
    r.revolutionaryLegitimacy = Math.min(100, r.revolutionaryLegitimacy + rInt(0, 1) + legitBonus);

    // Government response decays slowly (crackdowns lose steam)
    r.governmentResponse = Math.max(0, r.governmentResponse - 1);

    // Province unrest increases in provinces with cells
    r.cells.forEach(cell => {
        const prov = game.provinces.find(p => p.id === cell.provinceId);
        if (prov) prov.unrest = Math.min(100, prov.unrest + rInt(0, 2));
    });

    // Cooldown countdown
    if (r.cooldown > 0) r.cooldown--;
}

// ─── STAGE TRANSITION CHECKS ─────────────────────────────────────────────────
function checkRevolutionStageTransitions() {
    const r = game.revolution;

    const stageUpgrades = {
        "agitation":    () => r.organization >= 20 && r.popularSupport >= 25,
        "organization": () => r.organization >= 40 && r.cells.length >= 2,
        "unrest":       () => r.armedSupport >= 15 || (r.popularSupport >= 60 && r.organization >= 50),
        "insurrection": () => r.armedSupport >= 35 && r.organization >= 60 && r.popularSupport >= 55,
        "revolution":   () => r.armedSupport >= 50 && r.popularSupport >= 70 && r.revolutionaryLegitimacy >= 40
    };

    const check = stageUpgrades[r.stage];
    if (check && check()) advanceRevStage();
}

// ─── REGIME CHANGE CHECK ─────────────────────────────────────────────────────
function checkRegimeChangeConditions() {
    const r = game.revolution;
    if (r.stage !== "revolution" && r.stage !== "civil_war") return;

    const militaryFaction = game.factions.find(f => f.id === 2);
    const militaryLoyalty = militaryFaction ? militaryFaction.loyalty : 80;

    if (r.popularSupport >= 70 && r.armedSupport >= 50 && militaryLoyalty <= 35 && game.realm.legitimacy <= 40) {
        triggerRegimeChange();
    }
}

function triggerRegimeChange() {
    const r = game.revolution;
    r.revolutionSucceeded = true;
    r.active = false;
    r.stage = "new_regime";

    const leaderId = r.leaders[0];
    let leader = leaderId ? game.characters.find(c => c.id === leaderId && c.status === "Active") : null;
    if (!leader) {
        leader = game.characters.find(c => c.status === "Active" && c.type === "family") ||
                 game.characters.find(c => c.status === "Active");
    }
    const leaderName = leader ? leader.name : "the Revolutionary Council";

    log(`🔴 THE OLD ORDER FALLS. ${leaderName} leads the revolutionary government.`);

    game.constitution.headOfState = "Revolutionary Republic";
    game.realm.legitimacy = 35;
    game.realm.stability = 20;
    game.regime.revolutionaryPressure = 0;

    if (leader) {
        const oldPlayer = game.characters.find(c => c.isPlayer && c.id !== leader.id);
        if (oldPlayer) oldPlayer.isPlayer = false;
        leader.isPlayer = true;
        leader.role = "President of the Republic (You)";
        game.dynasty.headId = leader.id;
        if (!game.dynasty.heirId || game.dynasty.heirId === oldPlayer?.id) {
            game.dynasty.heirId = leader.id;
        }
    }

    game.generationalTimeline.unshift({
        year: game.date.getFullYear(),
        text: `THE OLD ORDER FELL. ${leaderName} established the Revolutionary Republic of Vancuria.`
    });

    game.aiDirector.eventQueue.push({
        id: "revolution_won",
        title: "⚑ THE OLD ORDER FALLS — THE REPUBLIC BEGINS",
        desc: `Crowds flood the Citadel Courtyard. Monarchist banners torn from their poles. ${leaderName} addresses the nation from the steps of the former throne room.\n\nThe Revolutionary Republic of Vancuria has been proclaimed. The new government faces a shattered treasury, military factions loyal to the old order, and international isolation.\n\nHistory watches. What kind of republic will you build?`,
        choices: [
            { text: "📜 Proclaim the Democratic Republic (+20 Legitimacy, +15 Approval)", act: () => { game.adjustMetric(game.realm, 'legitimacy', 20, 0, 100); game.adjustMetric(game.realm, 'approval', 15, 0, 100); log("The Democratic Republic of Vancuria proclaimed."); } },
            { text: "⚔️ Declare Revolutionary Emergency State (+30 Stability, -15 Approval)", act: () => { game.adjustMetric(game.realm, 'stability', 30, 0, 100); game.adjustMetric(game.realm, 'approval', -15, 0, 100); log("Revolutionary Emergency State declared."); } },
            { text: "🤝 Offer Amnesty to Loyalists (+10 Stability, prevents Civil War)", act: () => { game.adjustMetric(game.realm, 'stability', 10, 0, 100); r.civilWar = false; log("General amnesty offered to former regime loyalists."); } }
        ]
    });
}

// ─── REVOLUTION CRUSHED ───────────────────────────────────────────────────────
function triggerRevolutionCrushed() {
    const r = game.revolution;
    r.crushed = true;
    r.active = false;
    r.stage = "dormant";

    log("⚔️ THE REVOLUTION HAS BEEN CRUSHED. Royal order restored.");
    game.realm.stability = Math.min(100, game.realm.stability + 20);
    game.military.readiness = Math.min(100, game.military.readiness + 10);
    game.regime.revolutionaryPressure = Math.max(0, game.regime.revolutionaryPressure - 40);

    // Imprison revolutionary leaders
    r.leaders.forEach(lid => {
        const ldr = game.characters.find(c => c.id === lid);
        if (ldr && ldr.status === "Active") {
            ldr.status = "Imprisoned";
            ldr.imprisoned = true;
            log(`🔒 ${ldr.name} has been imprisoned.`);
        }
    });

    r.cells = [];
    r.organizations = [];

    game.aiDirector.eventQueue.push({
        id: "revolution_crushed",
        title: "⚔️ THE CAPITAL RESTORED — REVOLUTION CRUSHED",
        desc: "Royal forces have broken the back of the revolutionary movement. The capital is secured. Revolutionary leaders are in custody.\n\nConsequences: Underground movement remains. Children of imprisoned leaders will remember.",
        choices: [
            { text: "🔒 Order mass show trials (+20 Stability, +15 Repression)", act: () => { game.realm.stability += 20; log("Show trials of revolutionary leaders ordered."); } },
            { text: "🕊️ Offer limited amnesty to followers (+10 Approval, -5 Stability)", act: () => { game.realm.approval += 10; game.realm.stability -= 5; log("Amnesty offered to rank-and-file revolutionary followers."); } }
        ]
    });
}

// ─── DEDICATED REVOLUTION EVENT QUEUE ────────────────────────────────────────
// These events are NOT in the generic usedEvents pool — they repeat-cycle through the escalation arc.

const revolutionEventChain = [
    {
        id: "rev_underground_awakens",
        stage: "agitation",
        title: "⚑ THE UNDERGROUND AWAKENS",
        desc: () => {
            const r = game.revolution;
            const leader = r.leaders[0] ? game.characters.find(c => c.id === r.leaders[0]) : null;
            return `For months, officials dismissed coordinated revolutionary activity as isolated unrest.\n\nTonight, that assumption collapses.\n\nThousands have gathered across the capital. Underground pamphlets circulate openly. University students occupied several government buildings. Workers in three industrial districts declared a general strike.\n\nIntelligence believes a previously unknown organization is coordinating the demonstrations.${leader ? `\n\nOne name is mentioned in every report: ${leader.name}.` : ''}`;
        },
        choices: [
            {
                text: "🤝 Open negotiations with opposition leaders (+5 Approval, delay escalation)",
                act: () => { const r = game.revolution; r.organization += 10; r.cooldown += 3; game.realm.approval += 5; game.realm.stability += 5; log("Opened negotiations with revolutionary opposition."); }
            },
            {
                text: "🚨 Declare State of Emergency (+15 Military Power, -15 Approval, Fervor +5)",
                act: () => { const r = game.revolution; game.military.readiness += 15; game.realm.approval -= 15; game.regime.revolutionaryPressure = Math.min(100, game.regime.revolutionaryPressure + 5); r.governmentResponse += 25; log("State of Emergency declared."); }
            },
            {
                text: "🔒 Arrest suspected leaders (chance to capture, +20 underground org if martyr)",
                act: () => {
                    const r = game.revolution;
                    r.governmentResponse += 20;
                    if (r.leaders.length > 0 && Math.random() < 0.45) {
                        const lid = r.leaders[0];
                        const ldr = game.characters.find(c => c.id === lid);
                        if (ldr && !ldr.imprisoned) {
                            ldr.status = "Imprisoned"; ldr.imprisoned = true;
                            log(`🔒 ${ldr.name} ARRESTED. Martyrdom risk rises.`);
                            r.organization += 20; r.popularSupport += 10; // martyr effect
                        }
                    } else {
                        r.organization += 15;
                        log("Raid failed — leaders escaped. Underground reorganizes.");
                    }
                }
            },
            {
                text: "🪑 Do nothing (organization +15, popular support +10)",
                act: () => { const r = game.revolution; r.organization += 15; r.popularSupport += 10; log("Government paralysis emboldens the movement."); }
            }
        ]
    },
    {
        id: "rev_leader_dossier",
        stage: "agitation",
        title: "🕵️ A NAME EMERGES FROM THE SHADOWS",
        desc: () => {
            const r = game.revolution;
            const leader = r.leaders[0] ? game.characters.find(c => c.id === r.leaders[0]) : null;
            if (!leader) return "Intelligence has identified the revolutionary leadership structure.";
            return `Intelligence Directorate dossier — CLASSIFIED:\n\n${leader.name.toUpperCase()}, Age ${leader.age}\nFormer: ${rChoice(["university lecturer","trade union advocate","dissident journalist","military court-martialed officer","opposition MP"])}\nIdeology: ${leader.ideology || "Unknown"}\n\nPopularity: ${leader.popularity || rInt(50,75)}%\nInfluence: ${leader.influence || rInt(45,70)}%\nGovernment Opinion: ${leader.opinion}\n\nDirectorate assesses ${leader.name} is the principal coordinator of the underground movement.`;
        },
        choices: [
            {
                text: "🔭 Place under 24/7 surveillance (+25 Intel, learn org plans)",
                act: () => { const r = game.revolution; const ldr = r.leaders[0] ? game.characters.find(c => c.id === r.leaders[0]) : null; game.intelligence ||= {}; game.intelligenceSystem ||= {}; game.intelligenceSystem.activeWiretaps ||= new Set(); if (ldr) { ldr.underSurveillance = true; game.intelligenceSystem.activeWiretaps.add(ldr.id); } game.intelligence.domesticControl = Math.min(100, (game.intelligence.domesticControl || 0) + 25); r.organization = Math.max(0, r.organization - 8); r.governmentResponse = Math.min(100, (r.governmentResponse || 0) + 10); log("Surveillance placed on revolutionary leader; intelligence gained insight into movement plans."); }
            },
            {
                text: "📰 Run state media discrediting campaign (-20 popularity, +5 org from backlash)",
                act: () => { const r = game.revolution; const ldr = r.leaders[0] ? game.characters.find(c => c.id === r.leaders[0]) : null; if (ldr) ldr.popularity = Math.max(0, (ldr.popularity || 50) - 20); r.organization = Math.min(100, (r.organization || 0) + 5); r.popularSupport = Math.max(0, (r.popularSupport || 0) - 8); game.politics.opposition = Math.min(100, (game.politics.opposition || 0) + 4); game.realm.approval = Math.max(0, (game.realm.approval || 0) - 5); game.media ||= {}; game.media.revolutionaryPropaganda = (game.media.revolutionaryPropaganda || 0) + 1; log("Discrediting media campaign launched against revolutionary leader."); }
            },
            {
                text: "🤝 Secretly offer ministerial post in exchange for ending the movement",
                act: () => { const r = game.revolution; if (Math.random() < 0.35) { r.active = false; r.stage = "dormant"; r.cooldown = 12; r.organization = 0; r.popularSupport = 0; r.armedSupport = 0; log("Revolutionary leader secretly co-opted — movement disbands."); game.realm.approval = Math.min(100, (game.realm.approval || 0) + 10); game.realm.stability = Math.min(100, (game.realm.stability || 0) + 6); } else { r.popularSupport = Math.min(100, (r.popularSupport || 0) + 15); r.organization = Math.min(100, (r.organization || 0) + 10); game.regime.revolutionaryPressure = Math.min(100, (game.regime.revolutionaryPressure || 0) + 5); log("Offer rejected publicly. Leader uses it as propaganda."); } }
            },
            {
                text: "⚔️ Issue warrant for immediate arrest",
                act: () => {
                    const r = game.revolution;
                    const ldr = r.leaders[0] ? game.characters.find(c => c.id === r.leaders[0]) : null;
                    if (ldr && Math.random() < 0.5) {
                        ldr.status = "Imprisoned"; ldr.imprisoned = true;
                        log(`${ldr.name} ARRESTED AND IMPRISONED.`);
                        r.organization += 25; r.popularSupport += 15; // martyr spike
                    } else {
                        r.organization += 10;
                        log("Arrest warrant issued but leader has gone underground.");
                    }
                    r.governmentResponse = Math.min(100, (r.governmentResponse || 0) + 30);
                    game.realm.stability = Math.max(0, (game.realm.stability || 0) - 5);
                    game.realm.approval = Math.max(0, (game.realm.approval || 0) - 8);
                }
            }
        ]
    },
    {
        id: "rev_pamphlets",
        stage: "organization",
        title: "📄 THE UNDERGROUND PRESS RUNS ALL NIGHT",
        desc: () => "Underground pamphlets titled 'THE VANGUARD SPEAKS' have flooded every district. Print-shops raided, but new ones appear overnight. Citizens read them openly at tram stops and factory gates.\n\nThe revolutionary narrative is spreading faster than censors can suppress it.",
        choices: [
            {
                text: "📵 Invoke Press Emergency Decree (arrest editors, -15 Press Freedom)",
                act: () => { const r = game.revolution; r.governmentResponse = Math.min(100, (r.governmentResponse || 0) + 15); r.organization = Math.min(100, (r.organization || 0) + 8); game.constitution.pressFreedom = "Emergency Censorship"; game.politics.opposition = Math.min(100, (game.politics.opposition || 0) + 8); game.realm.stability = Math.max(0, (game.realm.stability || 0) - 5); if (typeof changeApproval === "function") changeApproval(-10); else game.realm.approval = Math.max(0, game.realm.approval - 10); game.media ||= {}; game.media.pressEmergency = true; log("Underground press crackdown ordered; emergency censorship imposed."); }
            },
            {
                text: "📢 Launch state propaganda counter-campaign (-$0.2B, -5 Rev. Popular Support)",
                act: () => { const r = game.revolution; game.realm.treasury = Math.max(0, game.realm.treasury - 0.2); r.popularSupport = Math.max(0, (r.popularSupport || 0) - 5); r.organization = Math.max(0, (r.organization || 0) - 3); game.realm.stability = Math.min(100, (game.realm.stability || 0) + 2); game.media ||= {}; game.media.statePropaganda = (game.media.statePropaganda || 0) + 1; log("State propaganda campaign deployed against revolutionary press."); }
            }
        ]
    },
    {
        id: "rev_general_strike",
        stage: "unrest",
        title: "✊ GENERAL INDUSTRIAL STRIKE — DAY 1",
        desc: () => `Workers across iron coast, energy basin, and the capital's financial district have walked off the job.\n\nGDP impact estimated at -$${rInt(1,4)}.${rInt(0,9)}B if the strike lasts more than 3 weeks.\n\nMilitary intelligence reports that armed security personnel are nervously watching from perimeters.`,
        choices: [
            {
                text: "💰 Meet union wage demands (+$0.5B/mo cost, strike ends, +10 Approval)",
                act: () => { game.realm.treasury -= 0.5; game.budget.expenditure.healthcare += 0.1; game.realm.approval += 10; game.revolution.popularSupport -= 10; log("Union wage demands met. Strike collapses."); }
            },
            {
                text: "⚔️ Deploy gendarmerie to reopen plants (-20 Approval, +10 Rev. Support if violence)",
                act: () => { game.realm.approval -= 20; game.revolution.popularSupport += 15; game.revolution.organization += 10; game.revolution.governmentResponse += 20; log("Gendarmerie deployed to break the strike."); }
            },
            {
                text: "🕰️ Wait out the strike (GDP penalty, organization +5 per week)",
                act: () => { game.realm.gdp = Math.max(20, game.realm.gdp - rInt(1,3)); game.revolution.organization += 10; log("Government waits. Strike drags on."); }
            }
        ]
    },
    {
        id: "rev_army_defection",
        stage: "insurrection",
        title: "⚔️ GARRISON REGIMENT DEFECTS TO THE REVOLUTION",
        desc: () => {
            const prov = rChoice(game.provinces);
            return `The 3rd Garrison Battalion stationed in ${prov.name} has announced its defection to the Revolutionary Council.\n\nThe commanding colonel issued a statement: "We can no longer point weapons at the people we swore to protect."\n\nHigh Command is paralyzed. Two other regiments are reported to be watching.`;
        },
        choices: [
            {
                text: "🔴 Dispatch elite units to arrest the defecting officers",
                act: () => { const r = game.revolution; if (Math.random() < 0.55) { r.armedSupport += 10; game.military.readiness -= 10; log("Defectors arrested. Armed support absorbed into underground."); } else { r.armedSupport += 25; game.military.readiness -= 20; log("Crackdown failed. More units defect."); } r.governmentResponse += 20; }
            },
            {
                text: "🤝 Offer clemency if they return to barracks",
                act: () => { game.revolution.armedSupport += 5; game.military.readiness -= 5; game.realm.stability -= 5; log("Clemency offered. Half return. Half disappear with weapons."); }
            }
        ]
    },
    {
        id: "rev_march_on_citadel",
        stage: "revolution",
        title: "🔴 THE MARCH ON THE CITADEL",
        desc: () => {
            const r = game.revolution;
            const ldr = r.leaders[0] ? game.characters.find(c => c.id === r.leaders[0]) : null;
            return `A column of tens of thousands converges on the Capital Citadel. ${ldr ? ldr.name + " leads from the front." : "The Revolutionary Council leads the column."}\n\nArmed revolutionary militia walk alongside unarmed protesters. Three military checkpoints have already stood aside without firing.\n\nThe throne room is three blocks away.`;
        },
        choices: [
            {
                text: "🔥 Order the Guard to open fire (civil war risk, -30 Legitimacy)",
                act: () => { const r = game.revolution; game.adjustMetric(game.realm, 'legitimacy', -30, 0, 100); game.adjustMetric(game.realm, 'approval', -25, 0, 100); r.civilWar = true; r.armedSupport += 20; log("Massacre order given. Civil war begins."); advanceRevStage(); }
            },
            {
                text: "🏳️ Negotiate immediate power transfer to constitutional committee",
                act: () => { const r = game.revolution; r.active = false; r.stage = "new_regime"; game.constitution.headOfState = "Constitutional Transitional Government"; game.adjustMetric(game.realm, 'legitimacy', 10, 0, 100); log("Power transferred. Transitional republic begins."); triggerRegimeChange(); }
            },
            {
                text: "✈️ Flee the capital with treasury reserves (-$2B, dynasty survives in exile)",
                act: () => { const r = game.revolution; game.realm.treasury -= 2.0; r.revolutionSucceeded = true; r.active = false; r.stage = "new_regime"; log("The Duke has fled the capital. Dynasty survives in exile."); triggerRegimeChange(); }
            }
        ]
    }
];

// ─── FIRE NEXT REVOLUTION EVENT ───────────────────────────────────────────────
function fireNextRevolutionEvent() {
    const r = game.revolution;
    if (r.cooldown > 0 || game.activeEvent) return;

    const stageOrder = ["agitation","agitation","organization","unrest","insurrection","revolution"];
    const eligibleEvents = revolutionEventChain.filter(ev =>
        stageOrder.indexOf(ev.stage) <= stageOrder.indexOf(r.stage) &&
        !r.eventHistory.includes(ev.id)
    );

    if (!eligibleEvents.length) return;

    const ev = eligibleEvents[0]; // deterministic: fire in order
    r.eventHistory.push(ev.id);
    r.cooldown = rInt(2, 4); // months gap between revolution events

    const builtEv = {
        id: ev.id,
        title: ev.title,
        desc: typeof ev.desc === 'function' ? ev.desc() : ev.desc,
        choices: ev.choices
    };

    setSpeed(0);
    triggerEventModal(builtEv);
}

// ─── ACTIVATION: SPAWN THE FULL MOVEMENT ─────────────────────────────────────
function activateRevolutionaryMovement() {
    const r = game.revolution;
    r.active = true;
    r.stage = "agitation";
    r.fervor = game.regime.revolutionaryPressure;
    r.popularSupport = rInt(25, 40);
    r.organization = rInt(10, 20);

    log("⚠️ REVOLUTIONARY MOVEMENT DETECTED — The underground has broken the surface.");

    // Spawn primary leader
    const ideology = rChoice(["Republican","Socialist","Nationalist","Democratic","Radical"]);
    const leader = spawnRevolutionaryLeader("Revolutionary Leader", ideology);

    // Spawn 1-2 supporting revolutionary characters
    const supportRoles = [
        { role: "Underground Organizer", ideology },
        { role: "Popular Agitator",      ideology: rChoice(["Democratic","Socialist"]) }
    ];
    supportRoles.slice(0, rInt(1,2)).forEach(s => spawnRevolutionaryLeader(s.role, s.ideology));

    // Spawn primary organization
    spawnRevolutionaryOrganization(ideology);

    // Seed 1-2 initial cells
    for (let i = 0; i < rInt(1, 2); i++) spawnRevolutionaryCell();

    // Queue initial deterministic crisis event
    r.cooldown = 0;
    fireNextRevolutionEvent();

    game.generationalTimeline.unshift({
        year: game.date.getFullYear(),
        text: `REVOLUTIONARY CRISIS: ${leader.name} emerged as the face of the underground movement.`
    });
}

// ─── MAIN MONTHLY TICK (called from simulateMonth) ───────────────────────────
function simulateRevolution() {
    const r = game.revolution;

    // 1. TRIGGER: Force activation at 100% fervor
    if (game.regime.revolutionaryPressure >= 100 && !r.active && !r.crushed && !r.revolutionSucceeded) {
        activateRevolutionaryMovement();
        return;
    }

    // 2. Allow reactivation if fervor hits 100% again after being crushed
    if (game.regime.revolutionaryPressure >= 100 && r.crushed) {
        r.crushed = false;
        r.leaders = [];
        r.organizations = [];
        r.cells = [];
        r.eventHistory = [];
        r.monthsActive = 0;
        activateRevolutionaryMovement();
        return;
    }

    if (!r.active) return;

    // 3. MONTHLY TICK
    r.monthsActive++;
    tickRevolutionStats();
    expandRevolutionaryCells();
    checkRevolutionStageTransitions();
    checkRegimeChangeConditions();

    // 4. CRISIS EVENT PROBABILITY
    let probability = 0.22;
    if (game.regime.revolutionaryPressure >= 100) probability += 0.20;
    if (r.organization >= 50)  probability += 0.15;
    if (r.popularSupport >= 60) probability += 0.15;
    if (r.stage === "insurrection" || r.stage === "revolution") probability += 0.20;

    if (Math.random() < probability) fireNextRevolutionEvent();

    // 5. SUPPRESSION: if govt response very high and popular support collapses
    if (r.governmentResponse >= 80 && r.popularSupport < 20 && r.armedSupport < 15) {
        triggerRevolutionCrushed();
    }
}
