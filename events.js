// ============================================================
// events.js
// Dynasty & State — Emergent Narrative Event Engine
//
// Supports:
// • Random events
// • Conditional events
// • Multi-stage event chains
// • Revolutionary crises
// • Births / children / generational milestones
// • Character deaths / succession
// • Political scandals
// • Military crises / coups
// • Economy
// • Foreign affairs
// • Intelligence
// • Media
// • Dynasty / cadet branches
// • Mega-projects
// ============================================================


// ============================================================
// SAFE HELPERS
// ============================================================

function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getCharacter(id) {
    if (id === null || id === undefined) return null;
    return game.characters?.find(c => c.id === id) || null;
}

function getHeadId() {
    return game.dynasty?.headId || game.realm?.rulerId || game.characters?.find(c => c.isPlayer)?.id || 1;
}

function getHeirId() {
    return game.dynasty?.heirId || game.realm?.heirId || game.characters?.find(c => c.role?.includes("Heir") || c.role?.includes("Crown Prince"))?.id || 2;
}

function getRulerCharacter() {
    return getCharacter(getHeadId()) || game.characters?.find(c => c.isPlayer) || game.characters?.[0] || null;
}

function getHeirCharacter() {
    return getCharacter(getHeirId()) || game.characters?.find(c => c.id !== getHeadId() && c.type === "family") || null;
}

function getFaction(id) {
    return game.factions?.find(f => f.id === id);
}

function getProvince(id) {
    return game.provinces?.find(p => p.id === id);
}

function changeApproval(amount) {
    if (!game.realm) return;
    game.realm.approval = clamp((game.realm.approval || 0) + amount);
    game.realm.approvalEventModifier = clamp(
        (game.realm.approvalEventModifier || 0) + amount,
        -30,
        30
    );
}

function changePrestige(amount) {
    if (!game.realm) return;
    game.realm.prestige = Math.max(0, (game.realm.prestige || 0) + amount);
}

function changeTreasury(amount) {
    if (!game.realm) return;
    game.realm.treasury = Math.max(0, (game.realm.treasury || 0) + amount);
}

function changeFervor(amount) {
    if (!game.revolution) return;

    game.revolutionaryFervor = clamp(
        (game.revolutionaryFervor || 0) + amount
    );

    game.revolution.fervor = clamp(
        (game.revolution.fervor || 0) + amount
    );
}

function addMemory(character, delta, reason) {
    if (!character) return;

    if (!Array.isArray(character.memory)) {
        character.memory = [];
    }

    character.memory.push({
        year: game.date?.getFullYear?.() || 0,
        delta,
        reason
    });
}

function changeOpinion(id, amount, reason = "Political interaction") {
    const c = getCharacter(id);
    if (!c) return;

    c.opinion = clamp((c.opinion || 0) + amount);
    addMemory(c, amount, reason);
}

function logEvent(message) {
    if (typeof log === "function") {
        log(message);
    } else {
        console.log(message);
    }
}


// ============================================================
// CHARACTER GENERATION
// ============================================================

const firstNames = [
    "Adrian",
    "Alexander",
    "Victor",
    "Julian",
    "Marcus",
    "Leon",
    "Daniel",
    "Nikolai",
    "Samir",
    "Omar",
    "Elias",
    "Rafael",
    "Damian",
    "Gabriel",
    "Arthur",
    "Emil",
    "Karim",
    "Yusuf",
    "Thomas",
    "Sebastian"
];

const lastNames = [
    "Vance",
    "Haddad",
    "Kravitz",
    "Berezov",
    "Vale",
    "Mercer",
    "Ashford",
    "Rosen",
    "Qadir",
    "Moreau",
    "Darian",
    "Volkov"
];

const revolutionaryIdeologies = [
    "Republican",
    "Socialist",
    "Nationalist",
    "Democratic",
    "Radical",
    "Workers' Movement"
];

function generateName() {
    return `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
}

function generateCharacter(options = {}) {

    const gender = options.gender || (Math.random() < 0.5 ? "Male" : "Female");

    const character = {
        id: Date.now() + Math.floor(Math.random() * 100000),

        name: options.name || generateName(),

        gender,

        type: options.type || "political",

        role: options.role || "Political Figure",

        age: options.age ?? randomInt(20, 60),

        health: options.health ?? randomInt(60, 100),

        opinion: options.opinion ?? randomInt(20, 80),

        traits: options.traits || [
            randomChoice([
                "Ambitious",
                "Charismatic",
                "Cautious",
                "Reckless",
                "Diplomatic",
                "Paranoid",
                "Idealistic",
                "Calculating"
            ]),
            randomChoice([
                "Brave",
                "Greedy",
                "Calm",
                "Deceitful",
                "Zealous",
                "Loyal",
                "Cynical"
            ])
        ],

        hiddenTraits: options.hiddenTraits || [],

        memory: [],

        status: "Active",

        married: false,

        spouseId: options.spouseId || null,

        parentId: options.parentId || null,

        motherId: options.motherId || null,

        parents: Array.isArray(options.parents) ? options.parents : [],

        children: [],

        politicalInfluence: options.politicalInfluence || randomInt(10, 50),

        popularity: options.popularity || randomInt(10, 60),

        stress: randomInt(0, 30),

        ideology: options.ideology || null,

        revolutionary: options.revolutionary || false,

        militarySupport: options.militarySupport || 0
    };

    if (!Array.isArray(game.characters)) {
        game.characters = [];
    }

    game.characters.push(character);

    return character;
}


// ============================================================
// REVOLUTIONARY MOVEMENT GENERATION
// ============================================================

function spawnRevolutionaryLeader() {

    const existing = game.characters?.find(
        c => c.revolutionary &&
             c.role === "Revolutionary Leader" &&
             c.status === "Active"
    );

    if (existing) return existing;

    const ideologies = revolutionaryIdeologies;

    const leader = generateCharacter({
        role: "Revolutionary Leader",

        age: randomInt(28, 52),

        ideology: randomChoice(ideologies),

        revolutionary: true,

        popularity: randomInt(45, 80),

        politicalInfluence: randomInt(35, 75),

        opinion: -90,

        traits: [
            randomChoice([
                "Charismatic",
                "Idealistic",
                "Ambitious"
            ]),
            randomChoice([
                "Ruthless",
                "Brave",
                "Cunning",
                "Zealous"
            ])
        ]
    });

    if (!game.revolution) {
        game.revolution = {
            active: false,
            stage: "dormant",
            fervor: 0,
            organization: 0,
            popularSupport: 0,
            armedSupport: 0,
            revolutionaryLegitimacy: 0,
            leaders: [],
            organizations: [],
            cells: [],
            monthsActive: 0
        };
    }

    game.revolution.leaders ||= [];

    game.revolution.leaders.push(leader.id);

    logEvent(
        `A revolutionary leader has emerged: ${leader.name}.`
    );

    return leader;
}


function spawnRevolutionaryOrganization() {

    if (!game.revolution) return;

    game.revolution.organizations ||= [];

    if (game.revolution.organizations.length > 0) {
        return;
    }

    const names = [
        "People's Liberation Committee",
        "Vancurian Republican Movement",
        "Workers' Revolutionary Front",
        "National Renewal Movement",
        "Free Vancuria Coalition",
        "United Popular Front",
        "Committee for National Liberation"
    ];

    const organization = {
        id: Date.now() + randomInt(1, 9999),

        name: randomChoice(names),

        ideology: randomChoice(revolutionaryIdeologies),

        support: randomInt(15, 35),

        organization: randomInt(10, 30),

        armedCells: 0,

        discovered: false,

        leadership: []
    };

    game.revolution.organizations.push(organization);

    logEvent(
        `Underground organization formed: ${organization.name}.`
    );

    return organization;
}


function spawnRevolutionaryCell() {

    if (!game.revolution) return;

    game.revolution.cells ||= [];

    const provinces = game.provinces || [];

    const province =
        provinces.length > 0
            ? randomChoice(provinces)
            : null;

    const cell = {
        id: Date.now() + randomInt(1, 9999),

        provinceId: province?.id || null,

        strength: randomInt(10, 30),

        support: randomInt(20, 65),

        secrecy: randomInt(50, 90),

        armed: Math.random() < 0.25
    };

    game.revolution.cells.push(cell);

    if (cell.armed) {
        game.revolution.armedSupport =
            clamp((game.revolution.armedSupport || 0) + 5);
    }

    logEvent(
        `A revolutionary underground cell has been detected in ${province?.name || "a major province"}.`
    );
}


// ============================================================
// REVOLUTION ACTIVATION
// ============================================================

function activateRevolution() {

    if (!game.revolution) {

        game.revolution = {
            active: false,
            stage: "dormant",
            fervor: 0,
            organization: 0,
            popularSupport: 0,
            armedSupport: 0,
            revolutionaryLegitimacy: 0,
            leaders: [],
            organizations: [],
            cells: [],
            monthsActive: 0
        };
    }

    const r = game.revolution;

    if (r.active) return;

    r.active = true;
    r.stage = "agitation";
    r.fervor = 100;
    r.monthsActive = 0;

    game.revolutionaryFervor = 100;

    spawnRevolutionaryOrganization();
    spawnRevolutionaryLeader();

    logEvent(
        "⚠ REVOLUTIONARY MOVEMENT ACTIVATED."
    );

    triggerNamedEvent("revolution_begins");
}


// ============================================================
// REVOLUTIONARY PROGRESSION
// ============================================================

function processRevolution() {

    if (!game.revolution) return;

    const r = game.revolution;

    const fervor =
        game.revolutionaryFervor ??
        r.fervor ??
        0;

    // 100% fervor automatically activates movement
    if (fervor >= 100 && !r.active) {
        activateRevolution();
        return;
    }

    if (!r.active) return;

    r.monthsActive++;

    // Organization grows
    r.organization = clamp(
        (r.organization || 0) +
        randomInt(2, 6)
    );

    // Popular support grows slowly
    if (game.realm.approval < 40) {
        r.popularSupport = clamp(
            (r.popularSupport || 0) + randomInt(1, 4)
        );
    }

    // Spawn underground cells
    if (
        r.organization >= 20 &&
        Math.random() < 0.35
    ) {
        spawnRevolutionaryCell();
    }

    // Determine stage
    if (
        r.organization >= 70 &&
        r.popularSupport >= 60
    ) {
        r.stage = "insurrection";
    }
    else if (
        r.organization >= 45
    ) {
        r.stage = "unrest";
    }
    else if (
        r.organization >= 20
    ) {
        r.stage = "organization";
    }
    else {
        r.stage = "agitation";
    }

    // Revolutionary event
    processRevolutionaryEvent();

    // Military defection
    if (
        r.stage === "insurrection" &&
        Math.random() < 0.15
    ) {
        r.armedSupport = clamp(
            (r.armedSupport || 0) + randomInt(3, 10)
        );

        logEvent(
            "Military units are beginning to question their loyalty to the government."
        );
    }
}


function processRevolutionaryEvent() {

    const r = game.revolution;

    if (!r || !r.active) return;

    const events = {

        agitation: [
            "revolutionary_manifesto",
            "student_protests",
            "underground_press"
        ],

        organization: [
            "workers_strike",
            "revolutionary_leader_speaks",
            "regional_governor_defects",
            "police_station_attack"
        ],

        unrest: [
            "general_strike",
            "red_week",
            "martyr_event",
            "army_refusal"
        ],

        insurrection: [
            "revolutionary_council",
            "capital_protests",
            "armed_uprising",
            "final_ultimatum"
        ]
    };

    const pool = events[r.stage] || [];

    if (
        pool.length > 0 &&
        Math.random() < 0.35
    ) {
        triggerNamedEvent(
            randomChoice(pool)
        );
    }
}


// ============================================================
// EVENT POOL
// ============================================================

const eventPool = [

    // ========================================================
    // POLITICAL
    // ========================================================

    {
        id: "alexander_plot",

        title: "Crown Prince Meets Military Clique",

        desc:
            "Intelligence Director Kravitz intercepted Crown Prince Alexander holding unannounced meetings with elite garrison commanders in the Capital Citadel.",

        choices: [

            {
                text:
                    "Confront Alexander privately (-15 Opinion, Contain scandal)",

                act: () => {

                    const a = getHeirCharacter() || getCharacter(2);

                    if (a) {

                        changeOpinion(
                            a.id,
                            -15,
                            "Confronted over officer meetings"
                        );

                    }

                    logEvent(
                        "Confronted Alexander privately regarding unauthorized military meetings."
                    );
                }
            },

            {
                text:
                    "Promote Alexander to Inspector General (+15 Loyalty, +10 Military Power)",

                act: () => {

                    const a = getHeirCharacter() || getCharacter(2);

                    if (a) {

                        changeOpinion(
                            a.id,
                            15,
                            "Promoted to Inspector General"
                        );

                        a.militarySupport =
                            (a.militarySupport || 0) + 10;
                    }

                    if (game.military) {
                        game.military.readiness =
                            clamp(
                                (game.military.readiness || 0) + 10,
                                0,
                                200
                            );
                        game.military.officerConspiracy = Math.max(
                            0,
                            (game.military.officerConspiracy || 0) - 10
                        );
                        game.military.coupRisk = Math.max(
                            0,
                            (game.military.coupRisk || 0) - 5
                        );
                        const army = game.military.branches?.find(branch => branch.id === "army");
                        if (army) army.readiness = clamp((army.readiness || 0) + 12);
                    }

                    const militaryFaction = getFaction(2);
                    if (militaryFaction) militaryFaction.loyalty = clamp((militaryFaction.loyalty || 0) + 10);
                    game.budget.expenditure.military = +(game.budget.expenditure.military + 0.6).toFixed(2);
                    changeApproval(2);

                    logEvent(
                        "Promoted Alexander to Inspector General to appease the officer corps."
                    );
                }
            },

            {
                text:
                    "Plant secret wiretaps on his quarters",

                act: () => {

                    game.intelligence ||= {};
                    game.intelligence.domesticControl =
                        Math.min(100, (game.intelligence.domesticControl || 0) + 15);
                    game.intelligenceSystem ||= {};
                    game.intelligenceSystem.activeWiretaps ||= new Set();
                    game.intelligenceSystem.activeWiretaps.add(8);
                    game.intelligenceSystem.counterIntel = Math.min(
                        100,
                        (game.intelligenceSystem.counterIntel || 0) + 10
                    );
                    game.intelligence.doubleAgentUnderSurveillance = 8;
                    changeTreasury(-0.25);
                    changeApproval(2);

                    game.intelligenceSystem ||= {};
                    game.intelligenceSystem.activeWiretaps ||= new Set();

                    game.intelligenceSystem.activeWiretaps.add(2);

                    logEvent(
                        "Installed electronic surveillance on Crown Prince Alexander."
                    );
                }
            }
        ]
    },


    {
        id: "south_unrest",

        title: "Agrarian Tax Boycott in South Reach",

        desc:
            "Farmers and local trade councils in South Arable Reach refuse to remit grain tariffs, citing unfair capital subsidies.",

        choices: [

            {
                text:
                    "Deploy Gendarmerie to enforce collection",

                act: () => {

                    const p = getProvince(5);

                    if (p) {

                        p.unrest =
                            (p.unrest || 0) + 15;

                        p.loyalty =
                            clamp(
                                (p.loyalty || 0) - 10
                            );
                    }

                    changeTreasury(0.3);
                    changeApproval(-8);
                    changeFervor(5);

                    logEvent(
                        "Enforced agricultural tax collection with military gendarmes."
                    );
                }
            },

            {
                text:
                    "Grant agrarian subsidies (-$0.4B Treasury)",

                act: () => {

                    const p = getProvince(5);

                    if (p) {

                        p.loyalty =
                            clamp(
                                (p.loyalty || 0) + 20
                            );

                        p.unrest =
                            Math.max(
                                0,
                                (p.unrest || 0) - 20
                            );
                    }

                    changeTreasury(-0.4);

                    logEvent(
                        "Issued emergency agrarian subsidies to appease southern farmers."
                    );
                }
            }
        ]
    },


    {
        id: "ai_governance",

        title: "National AI Governance & Privacy Bill",

        desc:
            "Parliament has introduced a landmark bill regarding sovereign AI surveillance rights versus civil data privacy.",

        choices: [

            {
                text:
                    "Authorize Unrestricted State AI (+15 Intel, -12 Approval, +Opposition)",

                act: () => {

                    game.intelligence ||= {};

                    game.intelligence.capability =
                        Math.min(100, (game.intelligence.capability || 0) + 15);
                    game.intelligenceSystem ||= {};
                    game.intelligenceSystem.domestic = Math.min(100, (game.intelligenceSystem.domestic || 0) + 12);
                    game.constitution.pressFreedom = "Regulated State Oversight";
                    game.politics.authoritarianism = Math.min(100, (game.politics.authoritarianism || 0) + 10);
                    game.politics.opposition = Math.min(100, (game.politics.opposition || 0) + 6);
                    game.regime.revolutionaryPressure = Math.min(100, (game.regime.revolutionaryPressure || 0) + 3);

                    changeApproval(-12);

                    logEvent(
                        "Enacted Unrestricted State AI Surveillance Act."
                    );
                }
            },

            {
                text:
                    "Enforce Data Privacy Protections (+15 Approval, +10 Legitimacy, -Opposition)",

                act: () => {

                    changeApproval(15);

                    game.realm.legitimacy =
                        clamp(
                            (game.realm.legitimacy || 0) + 10
                        );
                    game.intelligence ||= {};
                    game.intelligence.capability = Math.max(0, (game.intelligence.capability || 0) - 5);
                    game.constitution.pressFreedom = "Protected Civil Privacy";
                    game.politics.authoritarianism = Math.max(0, (game.politics.authoritarianism || 0) - 10);
                    game.politics.opposition = Math.max(0, (game.politics.opposition || 0) - 5);
                    game.regime.revolutionaryPressure = Math.max(0, (game.regime.revolutionaryPressure || 0) - 3);

                    logEvent(
                        "Signed Digital Data Privacy Protection Act."
                    );
                }
            }
        ]
    },


    {
        id: "cadet_autonomy",

        title: "Vance-Northreach Autonomy Demands",

        desc:
            "Branch Head Governor Alexander Vance II has formally requested regional energy tax retention rights for Northreach.",

        choices: [

            {
                text:
                    "Grant Energy Tax Autonomy",

                act: () => {

                    const b =
                        game.dynasty?.branches
                            ?.find(x => x.id === "vance_north");

                    if (b) {
                        b.loyalty =
                            clamp(
                                (b.loyalty || 0) + 25
                            );
                    }

                    changeTreasury(-0.3);
                    game.economyPolicies ||= {};
                    game.economyPolicies.northreachTaxAutonomy = true;
                    const northProvince = game.provinces?.find(province => province.id === 1);
                    if (northProvince) {
                        northProvince.loyalty = clamp((northProvince.loyalty || 0) + 10);
                        northProvince.unrest = Math.max(0, (northProvince.unrest || 0) - 8);
                    }
                    changeApproval(3);

                    logEvent(
                        "Granted fiscal autonomy to House Vance-Northreach."
                    );
                }
            },

            {
                text:
                    "Reject Autonomy & Assert Sovereign Supremacy",

                act: () => {

                    const b =
                        game.dynasty?.branches
                            ?.find(x => x.id === "vance_north");

                    if (b) {
                        b.loyalty =
                            clamp(
                                (b.loyalty || 0) - 20
                            );
                    }

                    changePrestige(100);
                    game.economyPolicies ||= {};
                    game.economyPolicies.northreachTaxAutonomy = false;
                    const northProvince = game.provinces?.find(province => province.id === 1);
                    if (northProvince) {
                        northProvince.loyalty = clamp((northProvince.loyalty || 0) - 12);
                        northProvince.unrest = clamp((northProvince.unrest || 0) + 10);
                    }
                    changeApproval(-4);

                    logEvent(
                        "Asserted sovereign supremacy over Vance-Northreach branch."
                    );
                }
            }
        ]
    },


    {
        id: "oligarch_ultimatum",

        title: "Oligarch Berezov Demands Energy Privatization",

        desc:
            "Oligarch Berezov and the Vance Energy Group board have conditioned corporate political funding on state energy deregulation.",

        choices: [

            {
                text:
                    "Grant Energy Deregulation",

                act: () => {

                    const f = getFaction(1);

                    if (f) {
                        f.loyalty =
                            clamp(
                                (f.loyalty || 0) + 15
                            );
                    }

                    const energyGroup = game.corporations?.find(corporation => corporation.id === "veg");
                    if (energyGroup) {
                        energyGroup.influence = clamp((energyGroup.influence || 0) + 10);
                        energyGroup.valuation = +(energyGroup.valuation * 1.12).toFixed(1);
                    }
                    game.economyPolicies ||= {};
                    if (!Array.isArray(game.economyPolicies.monopolyTaxBreaks)) {
                        game.economyPolicies.monopolyTaxBreaks = [];
                    }
                    if (!game.economyPolicies.monopolyTaxBreaks.includes("veg")) {
                        game.economyPolicies.monopolyTaxBreaks.push("veg");
                    }
                    game.realm.taxRate = Math.max(0.5, (game.realm.taxRate || 1) - 0.1);
                    game.realm.gdp = +(game.realm.gdp * 1.01).toFixed(2);

                    changeApproval(-10);

                    logEvent(
                        "Granted energy deregulation to Oligarch Berezov."
                    );
                }
            },

            {
                text:
                    "Reject Monopoly Demand",

                act: () => {

                    const f = getFaction(1);

                    if (f) {
                        f.loyalty =
                            clamp(
                                (f.loyalty || 0) - 20
                            );
                    }

                    const energyGroup = game.corporations?.find(corporation => corporation.id === "veg");
                    if (energyGroup) {
                        energyGroup.influence = clamp((energyGroup.influence || 0) - 10);
                        energyGroup.valuation = +(energyGroup.valuation * 0.95).toFixed(1);
                    }
                    if (game.economyPolicies?.monopolyTaxBreaks) {
                        game.economyPolicies.monopolyTaxBreaks = game.economyPolicies.monopolyTaxBreaks
                            .filter(id => id !== "veg");
                    }

                    changeApproval(10);

                    logEvent(
                        "Rejected Oligarch Berezov's privatization demand."
                    );
                }
            }
        ]
    },


    // ========================================================
    // ECONOMY
    // ========================================================

    {
        id: "market_crash",

        title: "MARKET PANIC",

        desc:
            "Financial markets have entered a sudden downward spiral. Banks are demanding emergency liquidity from the state.",

        choices: [

            {
                text:
                    "Emergency Bank Bailout (-$1B, Stabilize Markets, Protect GDP)",

                act: () => {

                    changeTreasury(-1);

                    changeApproval(-3);
                    game.economyPolicies ||= {};
                    game.economyPolicies.marketStabilized = true;
                    game.realm.gdp = +(game.realm.gdp * 0.99).toFixed(2);
                    game.realm.inflation = Math.max(1.5, +(game.realm.inflation + 0.3).toFixed(1));
                    game.corporations?.forEach(corporation => {
                        corporation.valuation = +(corporation.valuation * 1.04).toFixed(1);
                    });

                    logEvent(
                        "Authorized emergency stabilization funding for national banks."
                    );
                }
            },

            {
                text:
                    "Allow Markets to Correct Themselves (-5% GDP, +Inflation, -Stability)",

                act: () => {

                    changeApproval(-10);

                    changeFervor(5);
                    game.economyPolicies ||= {};
                    game.economyPolicies.marketStabilized = false;
                    game.realm.gdp = Math.max(20, +(game.realm.gdp * 0.95).toFixed(2));
                    game.realm.inflation = Math.min(25, +(game.realm.inflation + 1.2).toFixed(1));
                    game.realm.stability = clamp((game.realm.stability || 0) - 8);
                    game.corporations?.forEach(corporation => {
                        corporation.valuation = +(corporation.valuation * 0.85).toFixed(1);
                    });

                    logEvent(
                        "Government refused to intervene in the market collapse."
                    );
                }
            },

            {
                text:
                    "Nationalize Strategic Banks (+State Control, +Stability, -Oligarch Loyalty)",

                act: () => {

                    changePrestige(20);

                    changeApproval(5);
                    game.economyPolicies ||= {};
                    game.economyPolicies.bankNationalization = true;
                    game.economyPolicies.marketStabilized = true;
                    game.realm.gdp = +(game.realm.gdp * 0.98).toFixed(2);
                    game.realm.stability = clamp((game.realm.stability || 0) + 5);
                    game.budget.expenditure.administration = +(game.budget.expenditure.administration + 0.4).toFixed(2);

                    if (game.factions?.[0]) {
                        game.factions[0].loyalty =
                            clamp(
                                game.factions[0].loyalty - 15
                            );
                    }

                    logEvent(
                        "The Crown nationalized several strategic financial institutions."
                    );
                }
            }
        ]
    },


    {
        id: "grain_shortage",

        title: "NATIONAL GRAIN SHORTAGE",

        desc:
            "Poor harvests have caused food prices to rise sharply across the realm.",

        choices: [

            {
                text:
                    "Import Emergency Grain (-$0.5B)",

                act: () => {

                    changeTreasury(-0.5);

                    const grain = game.commodities?.find(commodity => commodity.id === "grain");
                    if (grain) {
                        grain.price = +(grain.price * 0.80).toFixed(2);
                        grain.trend = "-20% (Emergency Imports)";
                    }
                    const farmers = game.demographics?.find(group => group.id === "farmers");
                    if (farmers) farmers.approval = clamp((farmers.approval || 0) + 4);

                    changeApproval(8);

                    logEvent(
                        "Authorized emergency grain imports."
                    );
                }
            },

            {
                text:
                    "Impose Price Controls",

                act: () => {

                    const grain = game.commodities?.find(commodity => commodity.id === "grain");
                    if (grain) {
                        grain.price = +(grain.price * 0.65).toFixed(2);
                        grain.trend = "-35% (Price Controls)";
                    }
                    game.budget ||= {};
                    game.budget.expenditure ||= {};
                    game.budget.expenditure.subsidies = +(
                        (game.budget.expenditure.subsidies || 0) + 0.5
                    ).toFixed(2);
                    game.economyPolicies ||= {};
                    game.economyPolicies.grainPriceControls = true;

                    changeApproval(3);

                    changeFervor(3);

                    logEvent(
                        "Imposed temporary food price controls."
                    );
                }
            },

            {
                text:
                    "Let the Market Decide",

                act: () => {

                    const grain = game.commodities?.find(commodity => commodity.id === "grain");
                    if (grain) {
                        grain.price = +(grain.price * 1.35).toFixed(2);
                        grain.trend = "+35% (Market Rationing)";
                    }
                    const farmers = game.demographics?.find(group => group.id === "farmers");
                    if (farmers) farmers.approval = clamp((farmers.approval || 0) - 8);
                    const poorestProvince = game.provinces?.find(province => province.id === 5);
                    if (poorestProvince) {
                        poorestProvince.unrest = clamp((poorestProvince.unrest || 0) + 12);
                    }

                    changeApproval(-12);

                    changeFervor(8);

                    logEvent(
                        "Government refused to intervene in food markets."
                    );
                }
            }
        ]
    },


    // ========================================================
    // MILITARY
    // ========================================================

    {
        id: "general_warning",

        title: "THE GENERAL'S WARNING",

        desc:
            "Defense Minister Roger Vance warns that morale within the officer corps is deteriorating.",

        choices: [

            {
                text:
                    "Increase Military Funding (-$0.6B)",

                act: () => {

                    changeTreasury(-0.6);

                    if (game.military) {
                        game.military.readiness =
                            clamp(
                                (game.military.readiness || 0) + 12,
                                0,
                                200
                            );
                        game.military.officerConspiracy = Math.max(0, (game.military.officerConspiracy || 0) - 10);
                        game.military.coupRisk = Math.max(0, (game.military.coupRisk || 0) - 5);
                        const army = game.military.branches?.find(branch => branch.id === "army");
                        if (army) army.readiness = clamp((army.readiness || 0) + 12);
                    }

                    const militaryFaction = getFaction(2);
                    if (militaryFaction) militaryFaction.loyalty = clamp((militaryFaction.loyalty || 0) + 10);
                    game.budget.expenditure.military = +(game.budget.expenditure.military + 0.6).toFixed(2);
                    changeApproval(2);

                    logEvent(
                        "Increased military procurement funding."
                    );
                }
            },

            {
                text:
                    "Dismiss the General",

                act: () => {

                    const general =
                        game.characters?.find(
                            c => c.role === "Minister of Defense"
                        );

                    if (general) {
                        general.status = "Retired";
                        changeOpinion(
                            general.id,
                            -50,
                            "Dismissed from command"
                        );
                    }

                    const militaryFaction = getFaction(2);
                    if (militaryFaction) militaryFaction.loyalty = clamp((militaryFaction.loyalty || 0) - 18);
                    if (game.military) {
                        game.military.officerConspiracy = Math.min(100, (game.military.officerConspiracy || 0) + 15);
                        game.military.coupRisk = Math.min(100, (game.military.coupRisk || 0) + 12);
                    }

                    changeApproval(-5);

                    logEvent(
                        "Dismissed the Defense Minister."
                    );
                }
            }
        ]
    },


    {
        id: "coup_warning",

        title: "THE OFFICERS' CLUB",

        desc:
            "Intelligence reports indicate that several senior officers have begun discussing the possibility of military intervention.",

        choices: [

            {
                text:
                    "Promote Loyal Officers",

                act: () => {

                    if (game.military) {
                        game.military.loyalty =
                            clamp(
                                (game.military.loyalty || 0) + 12
                            );
                        game.military.officerConspiracy = Math.max(0, (game.military.officerConspiracy || 0) - 18);
                        game.military.coupRisk = Math.max(0, (game.military.coupRisk || 0) - 10);
                        game.military.readiness = clamp((game.military.readiness || 0) + 8, 0, 200);
                    }
                    const militaryFaction = getFaction(2);
                    if (militaryFaction) militaryFaction.loyalty = clamp((militaryFaction.loyalty || 0) + 15);
                    game.realm.stability = clamp((game.realm.stability || 0) + 4);
                    changeApproval(2);

                    logEvent(
                        "Promoted officers known for their loyalty to the Crown."
                    );
                }
            },

            {
                text:
                    "Arrest the Suspected Conspirators",

                act: () => {

                    changeApproval(-6);
                    changePrestige(10);
                    if (game.military) {
                        game.military.officerConspiracy = Math.max(0, (game.military.officerConspiracy || 0) - 30);
                        game.military.coupRisk = Math.max(0, (game.military.coupRisk || 0) - 15);
                    }
                    const militaryFaction = getFaction(2);
                    if (militaryFaction) militaryFaction.loyalty = clamp((militaryFaction.loyalty || 0) - 8);
                    game.realm.stability = clamp((game.realm.stability || 0) - 5);

                    logEvent(
                        "Security services arrested several suspected military conspirators."
                    );
                }
            },

            {
                text:
                    "Open Dialogue With the Generals",

                act: () => {

                    if (game.military) {
                        game.military.loyalty =
                            clamp(
                                (game.military.loyalty || 0) + 5
                            );
                        game.military.officerConspiracy = Math.max(0, (game.military.officerConspiracy || 0) - 10);
                        game.military.coupRisk = Math.max(0, (game.military.coupRisk || 0) - 6);
                    }
                    const militaryFaction = getFaction(2);
                    if (militaryFaction) militaryFaction.loyalty = clamp((militaryFaction.loyalty || 0) + 8);
                    game.realm.stability = clamp((game.realm.stability || 0) + 2);

                    changeApproval(3);

                    logEvent(
                        "The Crown opened negotiations with senior military commanders."
                    );
                }
            }
        ]
    },


    // ========================================================
    // FOREIGN AFFAIRS
    // ========================================================

    {
        id: "belvar_tension",

        title: "Belvar Republic Border Mobilization",

        desc:
            "Belvarian armored divisions have initiated unannounced live-fire maneuvers near the Eastern Trade Corridor.",

        choices: [

            {
                text:
                    "Deploy Frontier Brigades",

                act: () => {

                    changeTreasury(-0.4);

                    if (game.military) {
                        game.military.readiness =
                            clamp(
                                (game.military.readiness || 0) + 15,
                                0,
                                200
                            );
                        const frontierBranch = game.military.branches?.find(
                            branch => /army|frontier/i.test(branch.id || branch.name || "")
                        );
                        if (frontierBranch) {
                            frontierBranch.readiness = clamp(
                                (frontierBranch.readiness || 0) + 15,
                                0,
                                100
                            );
                        }
                    }

                    logEvent(
                        "Deployed border brigades in response to Belvar maneuvers."
                    );
                }
            },

            {
                text:
                    "Dispatch Foreign Minister Cassandra",

                act: () => {

                    const b =
                        game.diplomacy?.powers
                            ?.find(p => p.id === "belvar");

                    if (b) {
                        b.relations =
                            clamp(
                                (b.relations || 0) + 15,
                                -100,
                                100
                            );
                        b.borderTension = clamp(
                            (b.borderTension || 0) - 20,
                            0,
                            100
                        );
                    }

                    logEvent(
                        "Dispatched Foreign Minister Cassandra to de-escalate Belvar tension."
                    );
                }
            }
        ]
    },


    {
        id: "belvar_war_crisis",

        title: "BELVAR ISSUES A FINAL ULTIMATUM",

        desc:
            "Belvarian forces have crossed into the Eastern Trade Corridor. The Crown must either authorize a military response or accept humiliating negotiations.",

        choices: [

            {
                text: "Declare War and Mobilize",

                act: () => {
                    const belvar = game.diplomacy?.powers?.find(power => power.id === "belvar");
                    if (belvar) {
                        belvar.war = true;
                        belvar.embargo = true;
                        belvar.boycotted = true;
                        belvar.relations = -100;
                        belvar.borderTension = 100;
                        belvar.trade = 0;
                    }
                    game.military ||= {};
                    game.military.warExhaustion = Math.min(100, (game.military.warExhaustion || 0) + 15);
                    game.military.readiness = clamp((game.military.readiness || 0) + 20, 0, 200);
                    const frontier = game.provinces?.find(province => province.id === 2);
                    if (frontier) {
                        frontier.unrest = clamp((frontier.unrest || 0) + 15);
                        frontier.hasGarrison = true;
                    }
                    const militaryFaction = getFaction(2);
                    if (militaryFaction) militaryFaction.loyalty = clamp((militaryFaction.loyalty || 0) + 8);
                    game.monthActions.push({
                        headline: "WAR DECLARED ON BELVAR",
                        lead: "The Crown ordered general mobilization after Belvarian forces crossed the Eastern Trade Corridor."
                    });
                    changeTreasury(-1.5);
                    changeApproval(-8);
                    game.realm.stability = clamp((game.realm.stability || 0) - 6);
                    logEvent("The Crown declared war on Belvar and ordered general mobilization.");
                }
            },

            {
                text: "Accept Emergency Peace Talks",

                act: () => {
                    const belvar = game.diplomacy?.powers?.find(power => power.id === "belvar");
                    if (belvar) {
                        belvar.borderTension = Math.max(0, (belvar.borderTension || 0) - 35);
                        belvar.relations = Math.min(100, (belvar.relations || 0) + 10);
                    }
                    changeTreasury(-0.6);
                    changeApproval(4);
                    game.realm.legitimacy = clamp((game.realm.legitimacy || 0) - 3);
                    game.realm.stability = clamp((game.realm.stability || 0) + 3);
                    game.monthActions.push({
                        headline: "EMERGENCY PEACE TALKS WITH BELVAR",
                        lead: "Diplomats were dispatched to prevent the border crisis from becoming a wider war."
                    });
                    logEvent("The Crown accepted emergency peace talks with Belvar.");
                }
            }
        ]
    },


    // ========================================================
    // REVOLUTION EVENTS
    // ========================================================

    {
        id: "revolution_begins",

        title: "THE UNDERGROUND AWAKENS",

        desc:
            "For months the government dismissed scattered protests as isolated unrest. Tonight, coordinated demonstrations have erupted across the capital. An organized revolutionary movement has emerged.",

        choices: [

            {
                text:
                    "Negotiate With the Opposition",

                act: () => {

                    game.revolution.organization =
                        clamp(
                            game.revolution.organization - 10
                        );

                    changeApproval(5);

                    logEvent(
                        "The Crown opened negotiations with revolutionary representatives."
                    );
                }
            },

            {
                text:
                    "Declare a State of Emergency",

                act: () => {

                    game.revolution.organization =
                        clamp(
                            game.revolution.organization + 10
                        );

                    changeApproval(-12);

                    logEvent(
                        "A nationwide state of emergency was declared."
                    );
                }
            },

            {
                text:
                    "Arrest the Suspected Leadership",

                act: () => {

                    const leader =
                        spawnRevolutionaryLeader();

                    if (leader) {

                        if (Math.random() < 0.45) {

                            leader.status = "Imprisoned";

                            game.revolution.popularSupport =
                                clamp(
                                    game.revolution.popularSupport + 10
                                );

                            logEvent(
                                `${leader.name} was arrested by state security.`
                            );

                        } else {

                            logEvent(
                                `${leader.name} escaped into the underground.`
                            );
                        }
                    }
                }
            }
        ]
    },


    {
        id: "revolutionary_manifesto",

        title: "THE MANIFESTO",

        desc:
            "A revolutionary manifesto calling for the end of the existing political order is circulating throughout the capital.",

        choices: [

            {
                text:
                    "Ban the Manifesto",

                act: () => {

                    changeFervor(8);
                    changeApproval(-5);

                    logEvent(
                        "The revolutionary manifesto was declared illegal."
                    );
                }
            },

            {
                text:
                    "Allow Political Expression",

                act: () => {

                    changeApproval(5);

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport - 5
                        );

                    logEvent(
                        "The government permitted the manifesto to circulate."
                    );
                }
            }
        ]
    },


    {
        id: "student_protests",

        title: "UNIVERSITIES OCCUPIED",

        desc:
            "Students have occupied several universities, demanding constitutional reform and political freedoms.",

        choices: [

            {
                text:
                    "Negotiate With Student Leaders",

                act: () => {

                    changeApproval(5);

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport - 5
                        );

                    logEvent(
                        "Government negotiators opened talks with student leaders."
                    );
                }
            },

            {
                text:
                    "Clear the Universities",

                act: () => {

                    changeApproval(-10);
                    changeFervor(8);

                    logEvent(
                        "Security forces cleared occupied universities."
                    );
                }
            }
        ]
    },


    {
        id: "underground_press",

        title: "THE SECRET PRINTING PRESS",

        desc:
            "Underground newspapers are being printed throughout the capital and distributed by a growing network of activists.",

        choices: [

            {
                text:
                    "Shut Down the Presses",

                act: () => {

                    game.revolution.organization =
                        clamp(
                            game.revolution.organization - 5
                        );

                    changeApproval(-5);

                    logEvent(
                        "Security forces raided several underground printing presses."
                    );
                }
            },

            {
                text:
                    "Ignore Them",

                act: () => {

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport + 5
                        );

                    logEvent(
                        "The government chose not to interfere with underground newspapers."
                    );
                }
            }
        ]
    },


    {
        id: "revolutionary_leader_speaks",

        title: "A VOICE FROM THE SHADOWS",

        desc:
            "The revolutionary leader has appeared in a clandestine broadcast watched by millions.",

        choices: [

            {
                text:
                    "Counter the Broadcast",

                act: () => {

                    changeTreasury(-0.2);

                    changeApproval(2);

                    logEvent(
                        "The Crown launched a nationwide counter-propaganda campaign."
                    );
                }
            },

            {
                text:
                    "Attempt to Capture the Leader",

                act: () => {

                    const leaderId =
                        game.revolution.leaders?.[0];

                    const leader =
                        getCharacter(leaderId);

                    if (
                        leader &&
                        Math.random() < 0.5
                    ) {

                        leader.status = "Imprisoned";

                        logEvent(
                            `${leader.name} was captured by intelligence forces.`
                        );

                    } else {

                        game.revolution.organization =
                            clamp(
                                game.revolution.organization + 10
                            );

                        logEvent(
                            "The revolutionary leader escaped the security operation."
                        );
                    }
                }
            }
        ]
    },


    {
        id: "workers_strike",

        title: "THE WORKERS WALK OUT",

        desc:
            "Industrial workers in three major cities have launched coordinated strikes.",

        choices: [

            {
                text:
                    "Accept Wage Negotiations",

                act: () => {

                    changeTreasury(-0.4);

                    changeApproval(8);

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport - 8
                        );

                    logEvent(
                        "Government accepted emergency wage negotiations."
                    );
                }
            },

            {
                text:
                    "Declare the Strike Illegal",

                act: () => {

                    changeApproval(-10);
                    changeFervor(10);

                    game.revolution.organization =
                        clamp(
                            game.revolution.organization + 8
                        );

                    logEvent(
                        "The government declared the general strike illegal."
                    );
                }
            }
        ]
    },


    {
        id: "regional_governor_defects",

        title: "THE GOVERNOR DEFECTS",

        desc:
            "A provincial governor has publicly declared that his administration will no longer enforce several central government directives.",

        choices: [

            {
                text:
                    "Remove the Governor",

                act: () => {

                    changePrestige(5);

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport + 5
                        );

                    logEvent(
                        "The governor was removed from office."
                    );
                }
            },

            {
                text:
                    "Offer Regional Autonomy",

                act: () => {

                    changeTreasury(-0.3);

                    game.revolution.organization =
                        clamp(
                            game.revolution.organization - 5
                        );

                    logEvent(
                        "The Crown offered temporary regional autonomy."
                    );
                }
            }
        ]
    },


    {
        id: "police_station_attack",

        title: "THE FIRST ARMED ATTACK",

        desc:
            "An underground revolutionary cell has attacked a police facility and seized weapons.",

        choices: [

            {
                text:
                    "Launch Security Operations",

                act: () => {

                    game.revolution.armedSupport =
                        clamp(
                            game.revolution.armedSupport - 5
                        );

                    changeApproval(-5);

                    logEvent(
                        "Security forces launched raids against suspected revolutionary cells."
                    );
                }
            },

            {
                text:
                    "Offer Amnesty",

                act: () => {

                    game.revolution.armedSupport =
                        clamp(
                            game.revolution.armedSupport - 10
                        );

                    changeApproval(5);

                    logEvent(
                        "The government offered amnesty to armed revolutionary members who surrendered."
                    );
                }
            }
        ]
    },


    {
        id: "general_strike",

        title: "GENERAL STRIKE",

        desc:
            "Workers, transport unions and civil servants have coordinated the largest strike in modern Vancurian history.",

        choices: [

            {
                text:
                    "Negotiate Immediately",

                act: () => {

                    changeTreasury(-0.7);
                    changeApproval(10);

                    game.revolution.organization =
                        clamp(
                            game.revolution.organization - 10
                        );

                    logEvent(
                        "Emergency negotiations ended the general strike."
                    );
                }
            },

            {
                text:
                    "Use Emergency Powers",

                act: () => {

                    changeApproval(-20);
                    changeFervor(15);

                    game.revolution.armedSupport =
                        clamp(
                            game.revolution.armedSupport + 5
                        );

                    logEvent(
                        "Emergency powers were used to break the general strike."
                    );
                }
            }
        ]
    },


    {
        id: "martyr_event",

        title: "THE MARTYR",

        desc:
            "A protester has died during a confrontation with security forces. Images of the incident have spread across the country.",

        choices: [

            {
                text:
                    "Open an Independent Investigation",

                act: () => {

                    changeApproval(5);

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport - 5
                        );

                    logEvent(
                        "An independent inquiry was opened into the protester's death."
                    );
                }
            },

            {
                text:
                    "Defend the Security Forces",

                act: () => {

                    changeFervor(20);

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport + 10
                        );

                    logEvent(
                        "The government defended the actions of security forces."
                    );
                }
            }
        ]
    },


    {
        id: "army_refusal",

        title: "THE SOLDIERS REFUSE",

        desc:
            "A military unit has refused orders to confront demonstrators.",

        choices: [

            {
                text:
                    "Replace the Commanding Officers",

                act: () => {

                    if (game.military) {
                        game.military.loyalty =
                            clamp(
                                (game.military.loyalty || 0) - 8
                            );
                    }

                    logEvent(
                        "Commanding officers were removed for refusing orders."
                    );
                }
            },

            {
                text:
                    "Withdraw the Unit",

                act: () => {

                    game.revolution.armedSupport =
                        clamp(
                            game.revolution.armedSupport + 10
                        );

                    logEvent(
                        "The government withdrew the disobedient unit."
                    );
                }
            }
        ]
    },


    {
        id: "revolutionary_council",

        title: "THE REVOLUTIONARY COUNCIL",

        desc:
            "Opposition leaders have formed a provisional Revolutionary Council and claim authority over several cities.",

        choices: [

            {
                text:
                    "Declare Them Traitors",

                act: () => {

                    changeApproval(-8);
                    changeFervor(10);

                    logEvent(
                        "The Revolutionary Council was declared an illegal organization."
                    );
                }
            },

            {
                text:
                    "Recognize the Council",

                act: () => {

                    game.revolution.revolutionaryLegitimacy =
                        clamp(
                            (game.revolution.revolutionaryLegitimacy || 0) + 20
                        );

                    logEvent(
                        "The Crown recognized the Revolutionary Council as a negotiating partner."
                    );
                }
            }
        ]
    },


    {
        id: "capital_protests",

        title: "THE CAPITAL RISES",

        desc:
            "Hundreds of thousands have filled the capital. Government buildings are surrounded by demonstrators.",

        choices: [

            {
                text:
                    "Address the Nation",

                act: () => {

                    changeApproval(8);

                    game.revolution.popularSupport =
                        clamp(
                            game.revolution.popularSupport - 8
                        );

                    logEvent(
                        "The ruler addressed the nation from the Royal Palace."
                    );
                }
            },

            {
                text:
                    "Deploy the Military",

                act: () => {

                    changeApproval(-20);
                    changeFervor(15);

                    game.revolution.armedSupport =
                        clamp(
                            game.revolution.armedSupport + 10
                        );

                    logEvent(
                        "Military units were deployed around the capital."
                    );
                }
            }
        ]
    },


    {
        id: "armed_uprising",

        title: "THE ARMED UPRISING",

        desc:
            "Revolutionary cells have launched coordinated attacks across several provinces. The political crisis has become an armed conflict.",

        choices: [

            {
                text:
                    "Declare Martial Law",

                act: () => {

                    game.revolution.stage =
                        "insurrection";

                    changeApproval(-15);

                    if (game.military) {
                        game.military.readiness =
                            clamp(
                                (game.military.readiness || 0) + 15,
                                0,
                                200
                            );
                    }

                    logEvent(
                        "Martial law has been declared."
                    );
                }
            },

            {
                text:
                    "Offer a Political Transition",

                act: () => {

                    game.revolution.revolutionaryLegitimacy =
                        clamp(
                            (game.revolution.revolutionaryLegitimacy || 0) + 20
                        );

                    changeApproval(5);

                    logEvent(
                        "The Crown offered negotiations over a political transition."
                    );
                }
            }
        ]
    },


    {
        id: "final_ultimatum",

        title: "THE FINAL ULTIMATUM",

        desc:
            "The Revolutionary Council has issued a final ultimatum: abdication, constitutional reform, or armed confrontation.",

        choices: [

            {
                text:
                    "Abdicate",

                act: () => {

                    triggerSuccession();
                    game.revolution.active = false;
                    game.revolution.stage = "dormant";
                    game.revolution.revolutionSucceeded = false;
                    game.revolution.organization = 0;
                    game.revolution.popularSupport = 0;
                    game.revolution.armedSupport = 0;
                    game.realm.legitimacy = clamp((game.realm.legitimacy || 0) - 12);
                    game.realm.stability = clamp((game.realm.stability || 0) - 8);
                    changeApproval(-5);

                    logEvent(
                        "The ruler abdicated to prevent further bloodshed."
                    );
                }
            },

            {
                text:
                    "Accept Constitutional Reform",

                act: () => {

                    game.realm.regime =
                        "Constitutional Monarchy";

                    game.revolution.active = false;
                    game.revolution.stage = "dormant";
                    game.revolution.organization = 0;
                    game.revolution.popularSupport = 0;
                    game.revolution.armedSupport = 0;
                    game.revolution.revolutionaryLegitimacy = 0;
                    game.realm.legitimacy = clamp((game.realm.legitimacy || 0) + 8);
                    game.realm.stability = clamp((game.realm.stability || 0) + 6);
                    game.politics.parliamentSupport = clamp((game.politics.parliamentSupport || 0) + 10);

                    changeApproval(15);

                    logEvent(
                        "A new constitutional settlement ended the revolutionary crisis."
                    );
                }
            },

            {
                text:
                    "Defend the Throne",

                act: () => {

                    const r = game.revolution;
                    const military = game.military;
                    const militaryFaction = getFaction(2);

                    if (
                        (r.armedSupport || 0) >= 50 &&
                        ((militaryFaction?.loyalty || military?.loyalty || 100) <= 30)
                    ) {

                        triggerRevolutionVictory();

                    } else {

                        logEvent(
                            "The Crown ordered the armed forces to defend the regime."
                        );
                        if (military) {
                            military.readiness = Math.max(0, (military.readiness || 0) - 15);
                            military.warExhaustion = Math.min(100, (military.warExhaustion || 0) + 12);
                        }
                        game.realm.stability = clamp((game.realm.stability || 0) - 10);
                        changeApproval(-12);
                        r.governmentResponse = Math.min(100, (r.governmentResponse || 0) + 25);
                        r.organization = Math.min(100, (r.organization || 0) + 15);

                        if (Math.random() < 0.4) {
                            triggerRevolutionVictory();
                        }
                    }
                }
            }
        ]
    },


    // ========================================================
    // DYNASTY / GENERATIONAL
    // ========================================================

    {
        id: "child_birth",

        title: "A CHILD IS BORN",

        desc:
            "A new child has been born into the ruling dynasty.",

        choices: [

            {
                text:
                    "Celebrate the Birth",

                act: () => {

                    const child = spawnDynastyChild();

                    if (child) {
                        child.role = "Royal Prince / Princess";
                        child.popularity = 15;
                    }

                    changePrestige(20);

                    changeApproval(3);
                    game.dynasty.successionSecurity = clamp((game.dynasty.successionSecurity || 0) + 5);
                    game.monthActions.push({
                        headline: `ROYAL BIRTH: ${child?.name || "NEW HEIR"} CELEBRATED`,
                        lead: "The realm celebrated the newest member of the ruling dynasty."
                    });

                    logEvent(
                        "The realm celebrates the birth of a new member of House Vance."
                    );
                }
            },

            {
                text:
                    "Keep the Birth Private",

                act: () => {

                    const child = spawnDynastyChild();

                    if (child) {
                        child.role = "Private Dynasty Child";
                        child.popularity = 5;
                    }

                    game.dynasty.successionSecurity = clamp((game.dynasty.successionSecurity || 0) + 2);
                    game.intelligence ||= {};
                    game.intelligence.hiddenDynastyBirths = (game.intelligence.hiddenDynastyBirths || 0) + 1;

                    logEvent(
                        "A new dynasty child has been born in private."
                    );
                }
            }
        ]
    },


    {
        id: "dynastic_marriage",

        title: "THE ROYAL WEDDING",

        desc:
            "A marriage alliance has been proposed between two influential families.",

        choices: [

            {
                text:
                    "Accept the Marriage",

                act: () => {

                    changeTreasury(-0.5);
                    changePrestige(80);

                    const eligible = game.characters.find(character =>
                        character.type === "family" &&
                        character.status === "Active" &&
                        !character.married &&
                        character.age >= 18 &&
                        character.age <= 45 &&
                        !character.isPlayer
                    ) || game.characters.find(character =>
                        character.type === "family" &&
                        character.status === "Active" &&
                        !character.married &&
                        character.age >= 18 &&
                        character.age <= 45
                    );

                    if (eligible && typeof game.generateCharacter === "function") {
                        const partnerGender = eligible.gender === "Male" ? "Female" : "Male";
                        const partner = game.generateCharacter({
                            gender: partnerGender,
                            houseId: "house_vance",
                            type: "family",
                            role: "Spouse & Consort",
                            age: Math.max(18, Math.min(45, eligible.age + randomInt(-3, 3))),
                            traits: ["Diplomatic", "Calm"]
                        });
                        game.setSpouse(eligible, partner);
                        game.generationalTimeline?.unshift({
                            year: game.date.getFullYear(),
                            text: `${eligible.name} married ${partner.name} in a royal dynastic alliance.`
                        });
                        logEvent(`${eligible.name} married ${partner.name}; the dynastic alliance is now active.`);
                    } else {
                        changeApproval(-5);
                        logEvent("The proposed marriage was celebrated symbolically, but no eligible dynastic match was available.");
                    }

                    logEvent(
                        "A major dynastic marriage has been celebrated."
                    );
                }
            },

            {
                text:
                    "Reject the Proposal",

                act: () => {

                    changePrestige(-20);
                    changeApproval(-3);

                    logEvent(
                        "The Crown rejected the proposed dynastic marriage."
                    );
                }
            }
        ]
    },


    {
        id: "heir_scandal",

        title: "THE HEIR'S SCANDAL",

        desc:
            "The Crown Prince has become the subject of a damaging public scandal.",

        choices: [

            {
                text:
                    "Protect the Heir",

                act: () => {

                    changeApproval(-8);

                    const heirId = getHeirId();
                    changeOpinion(
                        heirId,
                        10,
                        "Protected from public scandal"
                    );
                    game.dynasty.successionSecurity = clamp((game.dynasty.successionSecurity || 0) - 8);
                    game.politics.opposition = clamp((game.politics.opposition || 0) + 7);
                    game.realm.legitimacy = clamp((game.realm.legitimacy || 0) - 4);
                    game.media ||= {};
                    game.media.heirScandalSuppressed = true;

                    logEvent(
                        "The Crown protected the heir from the scandal."
                    );
                }
            },

            {
                text:
                    "Force a Public Apology",

                act: () => {

                    const heirId = getHeirId();
                    changeOpinion(
                        heirId,
                        -10,
                        "Forced public apology"
                    );

                    changeApproval(5);
                    game.dynasty.successionSecurity = clamp((game.dynasty.successionSecurity || 0) + 5);
                    game.politics.opposition = clamp((game.politics.opposition || 0) - 4);
                    game.realm.legitimacy = clamp((game.realm.legitimacy || 0) + 3);
                    game.media ||= {};
                    game.media.heirScandalSuppressed = false;

                    logEvent(
                        "The Crown Prince issued a public apology."
                    );
                }
            }
        ]
    },


    // ========================================================
    // MEDIA
    // ========================================================

    {
        id: "viral_video",

        title: "THE VIRAL VIDEO",

        desc:
            "A citizen-recorded video showing security forces confronting demonstrators has spread across Vancuria Now.",

        choices: [

            {
                text:
                    "Launch an Investigation",

                act: () => {

                    changeApproval(5);
                    game.intelligence ||= {};
                    game.intelligence.domesticControl = Math.min(100, (game.intelligence.domesticControl || 0) + 8);
                    game.realm.stability = clamp((game.realm.stability || 0) + 3);
                    game.regime.revolutionaryPressure = clamp(
                        (game.regime.revolutionaryPressure || 0) - 3
                    );
                    game.media ||= {};
                    game.media.investigations = (game.media.investigations || 0) + 1;

                    logEvent(
                        "The government announced an investigation into the viral footage."
                    );
                }
            },

            {
                text:
                    "Dismiss the Video as Misinformation",

                act: () => {

                    changeApproval(-10);
                    changeFervor(5);
                    game.politics.opposition = clamp((game.politics.opposition || 0) + 6);
                    game.realm.stability = clamp((game.realm.stability || 0) - 4);
                    game.regime.revolutionaryPressure = clamp(
                        (game.regime.revolutionaryPressure || 0) + 5
                    );
                    game.media ||= {};
                    game.media.censorshipBacklash = (game.media.censorshipBacklash || 0) + 1;

                    logEvent(
                        "Officials dismissed the viral video as misinformation."
                    );
                }
            }
        ]
    },


    {
        id: "palace_whisper",

        title: "PALACE WHISPER",

        desc:
            "A tabloid claims that a senior member of the dynasty is secretly planning to replace the Crown Prince.",

        choices: [

            {
                text:
                    "Ignore the Rumor (-6 Approval, +5 Opposition, +3 Rev. Pressure)",

                act: () => {

                    changeApproval(-6);
                    game.politics.opposition = clamp((game.politics.opposition || 0) + 5);
                    game.regime.revolutionaryPressure = clamp(
                        (game.regime.revolutionaryPressure || 0) + 3
                    );
                    game.intelligence ||= {};
                    game.intelligence.palaceRumorActive = true;

                    logEvent(
                        "The palace refused to comment on the succession rumor."
                    );
                }
            },

            {
                text:
                    "Launch a Leak Investigation (-$0.2B, +Intel, -Opposition, -Rev. Pressure)",

                act: () => {

                    game.intelligence ||= {};

                    game.intelligence.domesticControl =
                        (game.intelligence.domesticControl || 0) + 10;

                    changeTreasury(-0.2);
                    changeApproval(2);
                    game.politics.opposition = clamp((game.politics.opposition || 0) - 4);
                    game.regime.revolutionaryPressure = clamp(
                        (game.regime.revolutionaryPressure || 0) - 2
                    );
                    game.intelligence.palaceRumorActive = false;

                    logEvent(
                        "Intelligence launched an investigation into the palace leak."
                    );
                }
            }
        ]
    },


    // ========================================================
    // INTELLIGENCE
    // ========================================================

    {
        id: "double_agent",

        title: "THE DOUBLE AGENT",

        desc:
            "The Intelligence Directorate believes that a senior official is secretly working for a foreign intelligence service.",

        choices: [

            {
                text:
                    "Surveil the Suspect",

                act: () => {

                    game.intelligence ||= {};

                    game.intelligence.domesticControl =
                        (game.intelligence.domesticControl || 0) + 15;

                    game.intelligenceSystem ||= {};
                    game.intelligenceSystem.activeWiretaps ||= new Set();
                    game.intelligenceSystem.activeWiretaps.add(8);
                    game.intelligenceSystem.counterIntel = Math.min(100, (game.intelligenceSystem.counterIntel || 0) + 10);
                    game.intelligence.doubleAgentUnderSurveillance = 8;
                    changeTreasury(-0.25);
                    changeApproval(2);

                    logEvent(
                        "The Directorate placed the suspected double agent under surveillance."
                    );
                }
            },

            {
                text:
                    "Arrest Immediately",

                act: () => {

                    changeApproval(-3);
                    const suspect = game.characters?.find(character => character.id === 8);
                    if (suspect) {
                        suspect.status = "Imprisoned";
                        suspect.opinion = Math.max(0, (suspect.opinion || 0) - 20);
                    }
                    const industrialFaction = getFaction(1);
                    if (industrialFaction) industrialFaction.loyalty = clamp((industrialFaction.loyalty || 0) - 12);
                    game.intelligence ||= {};
                    game.intelligence.foreignNetwork = Math.max(0, (game.intelligence.foreignNetwork || 0) - 8);
                    game.intelligence.doubleAgentArrested = true;
                    game.realm.stability = clamp((game.realm.stability || 0) - 3);

                    logEvent(
                        "The suspected double agent was arrested."
                    );
                }
            }
        ]
    },


    // ========================================================
    // PROJECTS
    // ========================================================

    {
        id: "project_overrun",

        title: "MEGA-PROJECT COST OVERRUN",

        desc:
            "Engineers report that one of the realm's flagship infrastructure projects is dramatically over budget.",

        choices: [

            {
                text:
                    "Provide Additional Funding",

                act: () => {

                    changeTreasury(-1);

                    logEvent(
                        "Additional funding was approved to keep the project on schedule."
                    );
                }
            },

            {
                text:
                    "Suspend Construction",

                act: () => {

                    changePrestige(-25);

                    logEvent(
                        "Construction of the troubled project has been suspended."
                    );
                }
            }
        ]
    }

];


// ============================================================
// EVENT LOOKUP
// ============================================================

function getEventById(id) {
    return eventPool.find(e => e.id === id);
}


// ============================================================
// EVENT TRIGGERING
// ============================================================

function triggerNamedEvent(id) {

    const ev = getEventById(id);

    if (!ev) {
        console.warn("Event not found:", id);
        return;
    }

    setSpeed?.(0);

    triggerEventModal(ev);
}


function triggerRandomEvent() {

    if (!game) return;

    // Do not interrupt an existing event
    if (game.activeEvent) return;

    // Revolution gets its own event pipeline
    if (
        game.revolution?.active &&
        Math.random() < 0.65
    ) {
        processRevolutionaryEvent();
        return;
    }

    const available = eventPool.filter(ev => {

        // Revolutionary events are handled separately
        if (
            [
                "revolution_begins",
                "revolutionary_manifesto",
                "student_protests",
                "underground_press",
                "revolutionary_leader_speaks",
                "workers_strike",
                "regional_governor_defects",
                "police_station_attack",
                "general_strike",
                "martyr_event",
                "army_refusal",
                "revolutionary_council",
                "capital_protests",
                "armed_uprising",
                "final_ultimatum"
            ].includes(ev.id)
        ) {
            return false;
        }

        // One-off normal events
        if (!game.usedEvents) {
            game.usedEvents = new Set();
        }

        return !game.usedEvents.has(ev.id);
    });

    if (available.length === 0) {
        return;
    }

    const ev =
        available[
            Math.floor(
                Math.random() * available.length
            )
        ];

    game.usedEvents.add(ev.id);

    setSpeed?.(0);

    triggerEventModal(ev);
}


// ============================================================
// EVENT MODAL
// ============================================================

function triggerEventModal(ev) {

    if (!ev) return;

    if (typeof setSpeed === "function") {
        setSpeed(0);
    }

    game.activeEvent = ev;

    const titleEl =
        document.getElementById(
            "event-modal-title"
        );

    const descEl =
        document.getElementById(
            "event-modal-desc"
        );

    if (titleEl) {
        titleEl.innerText = ev.title;
    }

    if (descEl) {
        descEl.innerText = ev.desc;
    }

    const choicesBox =
        document.getElementById(
            "event-modal-choices"
        );

    if (choicesBox) {

        choicesBox.innerHTML =
            ev.choices
                .map(
                    (choice, idx) => `
                        <button
                            class="choice-btn action-btn primary"
                            onclick="resolveEventChoice(${idx})"
                        >
                            👉 ${choice.text}
                        </button>
                    `
                )
                .join("");
    }

    const modal =
        document.getElementById(
            "event-modal"
        );

    if (modal) {
        modal.style.display = "flex";
    }
}


// ============================================================
// RESOLVE EVENT
// ============================================================

function resolveEventChoice(idx) {

    const event = game.activeEvent;

    if (
        event &&
        event.choices &&
        event.choices[idx]
    ) {

        try {

            event.choices[idx].act();

        } catch (error) {

            console.error(
                "Event resolution error:",
                event.id,
                error
            );
        }
    }

    const modal =
        document.getElementById(
            "event-modal"
        );

    if (modal) {
        modal.style.display = "none";
    }

    game.activeEvent = null;

    // Persist the choice immediately so its gameplay effects survive reloads.
    if (!game.resetting && typeof saveGame === "function") {
        saveGame();
    }

    if (typeof updateUI === "function") {
        updateUI();
    }
}


// ============================================================
// DYNASTY CHILD GENERATOR
// ============================================================

function spawnDynastyChild() {

    const parent =
        getHeirCharacter() ||
        getRulerCharacter() ||
        game.characters?.find(
            c =>
                c.type === "family" ||
                c.dynastyMember
        );

    const spouse = parent && typeof game.getSpouse === "function"
        ? game.getSpouse(parent)
        : parent && parent.spouseId
            ? getCharacter(parent.spouseId)
            : null;
    const mother = [parent, spouse].find(c => c?.gender === "Female") || null;
    const father = [parent, spouse].find(c => c?.gender === "Male") || null;
    const parentIds = [parent, spouse]
        .filter(Boolean)
        .map(c => c.id)
        .filter((id, index, ids) => ids.indexOf(id) === index);

    const child = generateCharacter({

        name: generateName(),

        type: "family",

        houseId: parent?.houseId || "house_vance",

        role: "Dynasty Child",

        age: 0,

        gender: Math.random() < 0.5 ? "Male" : "Female",

        parentId: father ? father.id : (!mother && parent ? parent.id : null),

        motherId: mother ? mother.id : null,

        parents: parentIds,

        opinion: 75,

        politicalInfluence: 0,

        popularity: 5,

        traits: [
            randomChoice([
                "Charismatic",
                "Cautious",
                "Ambitious",
                "Idealistic",
                "Reckless",
                "Calm"
            ])
        ]
    });

    child.dynastyMember = true;

    child.potential =
        randomInt(40, 95);

    child.education = null;

    child.career = null;

    [parent, spouse].filter(Boolean).forEach(parentCharacter => {
        parentCharacter.children ||= [];
        if (!parentCharacter.children.includes(child.id)) {
            parentCharacter.children.push(child.id);
        }
    });

    logEvent(
        `A new dynasty member has been born: ${child.name}.`
    );

    return child;
}


// ============================================================
// GENERATIONAL MILESTONES
// ============================================================

function processGenerationalMilestones() {

    if (!game.characters) return;

    game.characters.forEach(character => {

        if (
            character.status !== "Active"
        ) {
            return;
        }

        // Age 5
        if (
            character.age === 5 &&
            !character.milestones?.includes("age5")
        ) {

            character.milestones ||= [];

            character.milestones.push(
                "age5"
            );

            character.traits.push(
                randomChoice([
                    "Curious",
                    "Bold",
                    "Quiet",
                    "Empathetic"
                ])
            );

            logEvent(
                `${character.name} has reached childhood and begins developing a distinct personality.`
            );
        }


        // Age 16
        if (
            character.age === 16 &&
            !character.milestones?.includes("age16")
        ) {

            character.milestones ||= [];

            character.milestones.push(
                "age16"
            );

            const education =
                randomChoice([
                    "Military Academy",
                    "Royal University",
                    "Foreign University",
                    "Political Academy",
                    "Scientific Institute"
                ]);

            character.education =
                education;

            logEvent(
                `${character.name} has begun studying at ${education}.`
            );
        }


        // Age 18
        if (
            character.age === 18 &&
            !character.milestones?.includes("age18")
        ) {

            character.milestones ||= [];

            character.milestones.push(
                "age18"
            );

            const career =
                randomChoice([
                    "Military",
                    "Diplomacy",
                    "Politics",
                    "Business",
                    "Academia",
                    "Intelligence"
                ]);

            character.career =
                career;

            character.role =
                `${career} Candidate`;

            character.politicalInfluence =
                randomInt(5, 20);

            logEvent(
                `${character.name} has entered public life as a ${career} candidate.`
            );
        }


        // Age 25
        if (
            character.age === 25 &&
            !character.milestones?.includes("age25")
        ) {

            character.milestones ||= [];

            character.milestones.push(
                "age25"
            );

            if (
                character.type === "family"
            ) {

                character.marriageEligible =
                    true;

                logEvent(
                    `${character.name} has reached marriageable age and may now become involved in a dynastic alliance.`
                );
            }
        }


        // Age 30
        if (
            character.age === 30 &&
            !character.milestones?.includes("age30")
        ) {

            character.milestones ||= [];

            character.milestones.push(
                "age30"
            );

            character.politicalInfluence =
                (character.politicalInfluence || 0) +
                randomInt(10, 25);

            logEvent(
                `${character.name} has entered full political maturity.`
            );
        }
    });
}


// ============================================================
// NATURAL DEATH / SUCCESSION
// ============================================================

function processCharacterDeaths() {

    if (!game.characters) return;

    game.characters.forEach(character => {

        if (
            character.status !== "Active"
        ) {
            return;
        }

        let deathChance = 0;

        if (character.age >= 70) {
            deathChance += 0.015;
        }

        if (character.age >= 80) {
            deathChance += 0.04;
        }

        if (character.health < 30) {
            deathChance += 0.02;
        }

        if (
            character.age >= 90
        ) {
            deathChance += 0.15;
        }

        if (
            Math.random() < deathChance
        ) {

            character.status = "Deceased";

            logEvent(
                `${character.name} has died at the age of ${character.age}.`
            );

            if (
                character.id === game.realm?.rulerId
            ) {
                triggerSuccession();
            }
        }
    });
}


function triggerSuccession() {

    const oldRuler = getRulerCharacter();
    const heir = getHeirCharacter();

    if (!heir) {

        logEvent(
            "SUCCESSION CRISIS: No recognized heir exists."
        );

        return;
    }

    if (oldRuler) {

        oldRuler.status =
            "Deceased";

        oldRuler.legacy = {

            title:
                generateLegacyTitle(
                    oldRuler
                ),

            reignEnd:
                game.date?.getFullYear?.() || 0,

            prestige:
                game.realm?.prestige || 0,

            approval:
                game.realm?.approval || 0
        };
    }

    if (game.dynasty) game.dynasty.headId = heir.id;
    if (game.realm) game.realm.rulerId = heir.id;

    heir.role =
        "Grand Duke";

    heir.isPlayer =
        true;

    if (oldRuler) {
        oldRuler.isPlayer = false;
    }

    // Find next heir
    const nextHeir =
        game.characters.find(
            c =>
                c.status === "Active" &&
                c.type === "family" &&
                c.id !== heir.id &&
                c.age >= 16
        );

    if (nextHeir) {

        if (game.dynasty) game.dynasty.heirId = nextHeir.id;
        if (game.realm) game.realm.heirId = nextHeir.id;

        nextHeir.role =
            "Crown Prince (Heir)";
    }

    changePrestige(100);

    logEvent(
        `THE SUCCESSION: ${heir.name} has inherited the throne.`
    );

    if (
        typeof showSuccessionModal === "function"
    ) {
        showSuccessionModal(
            oldRuler,
            heir
        );
    }
}


function generateLegacyTitle(character) {

    const titles = [];

    if (
        (game.realm?.approval || 0) >= 75
    ) {
        titles.push(
            "THE BELOVED"
        );
    }

    if (
        (game.realm?.military || 0) >= 130
    ) {
        titles.push(
            "THE CONQUEROR"
        );
    }

    if (
        (game.realm?.approval || 0) <= 25
    ) {
        titles.push(
            "THE TYRANT"
        );
    }

    if (
        (game.realm?.prestige || 0) >= 1200
    ) {
        titles.push(
            "THE GREAT"
        );
    }

    if (
        game.revolution?.active
    ) {
        titles.push(
            "THE LAST SOVEREIGN"
        );
    }

    if (titles.length === 0) {
        titles.push(
            "THE STEADFAST"
        );
    }

    return randomChoice(
        titles
    );
}


// ============================================================
// REVOLUTION VICTORY
// ============================================================

function triggerRevolutionVictory() {

    const r =
        game.revolution;

    if (!r) return;

    r.revolutionSucceeded =
        true;

    r.active =
        false;

    r.stage =
        "victory";

    const leaderId =
        r.leaders?.[0];

    const leader =
        getCharacter(
            leaderId
        );

    if (leader) {

        leader.role =
            "Head of Revolutionary Government";

        leader.isPlayer =
            true;

        if (game.dynasty) game.dynasty.headId = leader.id;
        if (game.realm) game.realm.rulerId = leader.id;
    }

    game.realm.regime =
        "Republic";

    game.realm.approval =
        55;

    game.realm.legitimacy =
        60;

    changePrestige(-200);

    logEvent(
        "THE OLD ORDER FALLS. A REVOLUTIONARY GOVERNMENT HAS TAKEN POWER."
    );

    if (
        typeof showRevolutionVictoryModal ===
        "function"
    ) {

        showRevolutionVictoryModal(
            leader
        );
    }
}


// ============================================================
// MONTHLY EVENT PROCESSOR
// ============================================================

function processEventsMonthly() {

    if (!game) return;

    // Events created by the simulation (AI, elections, milestones, etc.)
    // must enter the same playable modal pipeline as random events.
    if (!game.aiDirector || !Array.isArray(game.aiDirector.eventQueue)) {
        if (!game.aiDirector) game.aiDirector = {};
        game.aiDirector.eventQueue = [];
    }

    // --------------------------------------------
    // 1. Generations
    // --------------------------------------------

    processGenerationalMilestones();

    // --------------------------------------------
    // 2. Death
    // --------------------------------------------

    processCharacterDeaths();

    // --------------------------------------------
    // 3. Revolution
    // --------------------------------------------

    processRevolution();

    const belvar = game.diplomacy?.powers?.find(power => power.id === "belvar");
    if (
        !game.activeEvent &&
        belvar &&
        !belvar.war &&
        (belvar.borderTension || 0) >= 75 &&
        !game.usedEvents?.has("belvar_war_crisis")
    ) {
        game.usedEvents ||= new Set();
        game.usedEvents.add("belvar_war_crisis");
        triggerNamedEvent("belvar_war_crisis");
        return;
    }

    // --------------------------------------------
    // 4. Queued consequential event
    // --------------------------------------------

    if (!game.activeEvent && game.aiDirector.eventQueue.length > 0) {
        const queuedEvent = game.aiDirector.eventQueue.shift();
        if (queuedEvent && Array.isArray(queuedEvent.choices)) {
            triggerEventModal(queuedEvent);
            return;
        }
    }

    // --------------------------------------------
    // 5. Random world event
    // --------------------------------------------

    if (
        !game.activeEvent &&
        Math.random() < 0.30
    ) {

        triggerRandomEvent();
    }
}


// ============================================================
// EXPORT / GLOBAL COMPATIBILITY
// ============================================================
//
// This file is designed for direct browser execution.
// Functions intentionally remain global so existing
// simulation.js / ui.js / actions.js can call them.
//
// Main functions:
// • triggerRandomEvent()
// • triggerNamedEvent(id)
// • triggerEventModal(event)
// • resolveEventChoice(index)
// • processEventsMonthly()
// • processRevolution()
// • spawnDynastyChild()
// • triggerSuccession()
//
// ============================================================
