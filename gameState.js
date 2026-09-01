// gameState.js – Complete State Registry & Generational Population Engine Model

const game = {};
if (typeof window !== 'undefined') window.game = game;
if (typeof global !== 'undefined') global.game = game;
if (typeof module !== 'undefined') module.exports = game;

// A fresh campaign always starts from the same simple historical baseline.
game.date = new Date(2026, 0, 1);
game.speed = 0;
game.timer = null;
game.currentTab = 'family';
game.selectedProvinceId = 3;
game.monthActions = [];
game.totalMonthsPassed = 0;

// Config
game.config = {
    surveillanceSetupCost: 0.5,
    surveillanceMonthlyCost: 0.150,
    concessionCooldownMonths: 6,
    bondInterestRate: 0.042 // 4.2% annual interest on sovereign bonds
};

// Macro Realm Metrics
game.realm = {
    rulerId: 1,
    heirId: 2,
    treasury: 5.0,
    gdp: 82.4,
    approval: 48,
    legitimacy: 72,
    prestige: 890,
    stability: 64,
    inflation: 3.4,
    unemployment: 6.8,
    stress: 15,
    taxRate: 1.0,
    activePlot: null
};

function bindMetric(target, key, min = 0, max = 100) {
    if (!target || !key) return;
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor && descriptor.set) return;
    let value = Number(target[key]) || 0;
    value = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
    Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        get() { return value; },
        set(next) {
            const numeric = Number(next);
            value = Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : min;
        }
    });
}

// Currency Engine (Vancurian Krona - KR)
game.currency = {
    code: "KR",
    usdExchange: 0.25,
    trend: "+0.2%",
    confidence: "Stable Sovereign Backing"
};

// Detailed Sovereign Budget & Debt Engine
game.budget = {
    revenue: {
        corporateTax: 4.2,
        energyExports: 1.8,
        customsTariffs: 0.9,
        total: 6.9
    },
    expenditure: {
        military: 2.1,
        healthcare: 1.5,
        infrastructure: 1.2,
        education: 0.8,
        administration: 0.5,
        debtServicing: 0.21,
        total: 6.31
    },
    sovereignDebt: 5.0,
    issuedBonds: 5.0
};

game.economy = {
    industrialCapacity: 75
};

game.economyPolicies = {
    devalued: false,
    monopolyTaxBreaks: []
};

// Constitutional Articles Engine
game.constitution = {
    headOfState: "Monarchic Supreme Executive",
    parliamentPower: "Limited Monarchical Veto",
    judiciaryIndependence: "Medium Independent Bench",
    pressFreedom: "Regulated State Oversight",
    emergencyPowers: "Sovereign Executive Decree",
    emergencyActive: false
};

// 6 Competing Great Houses
game.houses = [
    { id: "house_vance", name: "House Vance", type: "Royal Dynasty", headId: 1, wealth: 8.7, prestige: 1420, loyaltyToCrown: 100, status: "Active" },
    { id: "house_berezov", name: "House Berezov", type: "Industrial Oligarchs", headId: 8, wealth: 14.8, prestige: 890, loyaltyToCrown: 55, status: "Active" },
    { id: "house_qamar", name: "House Qamar", type: "Military Aristocracy", headId: 5, wealth: 6.2, prestige: 750, loyaltyToCrown: 82, status: "Active" },
    { id: "house_rashid", name: "House Al-Rashid", type: "Merchant Dynasty", headId: 7, wealth: 11.5, prestige: 680, loyaltyToCrown: 70, status: "Active" },
    { id: "house_northreach", name: "House Northreach", type: "Provincial Nobility", headId: 4, wealth: 4.5, prestige: 520, loyaltyToCrown: 48, status: "Active" },
    { id: "house_valerian", name: "House Valerian", type: "Foreign Aristocratic House", headId: 6, wealth: 9.1, prestige: 610, loyaltyToCrown: 60, status: "Active" }
];

// 9 Life Stages Rules Engine
game.lifeStages = {
    INFANT: { name: "Infant", minAge: 0, maxAge: 5 },
    CHILD: { name: "Child", minAge: 6, maxAge: 11 },
    ADOLESCENT: { name: "Adolescent", minAge: 12, maxAge: 15 },
    EDUCATION: { name: "Education", minAge: 16, maxAge: 17 },
    YOUNG_ADULT: { name: "Young Adult", minAge: 18, maxAge: 24 },
    ADULT: { name: "Adult", minAge: 25, maxAge: 39 },
    MATURE: { name: "Mature", minAge: 40, maxAge: 59 },
    ELDER: { name: "Elder", minAge: 60, maxAge: 74 },
    VERY_ELDER: { name: "Very Elder", minAge: 75, maxAge: 120 }
};

game.getLifeStage = function(age) {
    if (age <= 5) return "Infant";
    if (age <= 11) return "Child";
    if (age <= 15) return "Adolescent";
    if (age <= 17) return "Education";
    if (age <= 24) return "Young Adult";
    if (age <= 39) return "Adult";
    if (age <= 59) return "Mature";
    if (age <= 74) return "Elder";
    return "Very Elder";
};

// Military System with 6 Branches
game.military = {
    readiness: 105,
    modernization: 35,
    equipment: 60,
    manpower: 420000,
    airPower: 48,
    navalPower: 35,
    armyPower: 70,
    procurementBudget: 0,
    procurementHistory: [],
    procurementPrograms: [],
    warExhaustion: 8,
    coupRisk: 8,
    officerConspiracy: 38,
    branches: [
        { id: "army", name: "Royal Army", readiness: 74, commanderId: 5, budget: 0.8 },
        { id: "navy", name: "Sovereign Navy", readiness: 61, commanderId: 7, budget: 0.5 },
        { id: "airforce", name: "Air Force", readiness: 83, commanderId: 2, budget: 0.4 },
        { id: "missiles", name: "Strategic Missiles", readiness: 42, commanderId: 5, budget: 0.2 },
        { id: "cyber", name: "Cyber Warfare Command", readiness: 76, commanderId: 6, budget: 0.15 },
        { id: "space", name: "Orbital Space Force", readiness: 18, commanderId: 8, budget: 0.05 }
    ]
};

// Politics & Parliament
game.politics = {
    parliamentSupport: 54,
    opposition: 31,
    corruption: 28,
    authoritarianism: 42,
    activeBill: null,
    nextElectionYear: game.date.getFullYear() + 4
};

// Regime Stability
game.regime = {
    revolutionaryPressure: 14,
    stability: 64
};

game.bindStateMetrics = function() {
    bindMetric(game.realm, 'approval', 0, 100);
    bindMetric(game.realm, 'legitimacy', 0, 100);
    bindMetric(game.realm, 'stability', 0, 100);
    if (game.regime) bindMetric(game.regime, 'revolutionaryPressure', 0, 100);
    if (game.revolution) {
        bindMetric(game.revolution, 'organization', 0, 100);
        bindMetric(game.revolution, 'popularSupport', 0, 100);
        bindMetric(game.revolution, 'armedSupport', 0, 100);
        bindMetric(game.revolution, 'revolutionaryLegitimacy', 0, 100);
        bindMetric(game.revolution, 'governmentResponse', 0, 100);
        bindMetric(game.revolution, 'fervor', 0, 100);
    }
    if (typeof game.sanitizeState === 'function') game.sanitizeState();
    return game;
};

// ─── REVOLUTIONARY STATE MACHINE ──────────────────────────────────────────────
// Stages: dormant → agitation → organization → unrest → insurrection → revolution → civil_war → new_regime
game.revolution = {
    active: false,
    stage: "dormant",       // current stage string
    fervor: 0,              // mirrors revolutionaryPressure at activation
    organization: 0,        // 0-100: how coordinated the movement is
    popularSupport: 0,      // 0-100: civilian sympathy
    armedSupport: 0,        // 0-100: armed militia / defected soldiers
    revolutionaryLegitimacy: 0, // 0-100: perceived moral right to govern
    governmentResponse: 0,  // 0-100: repression / concession score

    leaders: [],            // array of character IDs
    organizations: [],      // [{id, name, ideology, support, organization, armedCells, discovered}]
    cells: [],              // [{id, province, strength, support, secrecy, armed}]
    eventHistory: [],       // ids of revolution events already fired
    activeChains: [],       // ids of currently running event chains
    cooldown: 0,            // months until next crisis event is allowed

    monthsActive: 0,
    capitalControlled: false,
    civilWar: false,
    revolutionSucceeded: false,
    crushed: false
};

// Estate Factions
game.factions = [
    { id: 1, name: "Industrial Oligarchs", loyalty: 72, power: 85, demands: "Low corporate tax & energy subsidies", underSurveillance: false },
    { id: 2, name: "Military High Command", loyalty: 88, power: 90, demands: "Increased defense procurement & border security", underSurveillance: false },
    { id: 3, name: "Parliamentary Reformists", loyalty: 45, power: 60, demands: "Constitutional oversight & free press", underSurveillance: false },
    { id: 4, name: "Labor Unions & Workers", loyalty: 52, power: 55, demands: "Higher minimum wage & price caps", underSurveillance: false }
];

game.factionCooldowns = {};

// Political Parties
game.parties = [
    { id: "rcp", name: "Royal Conservative Party", seats: 34, popularity: 38, ideology: "Monarchist / Military", leaderId: 5, stance: "Pro-Crown" },
    { id: "ndp", name: "National Development Party", seats: 28, popularity: 30, ideology: "Technocratic Capitalism", leaderId: 8, stance: "Industrial" },
    { id: "rc",  name: "Reform Coalition", seats: 20, popularity: 22, ideology: "Civil Liberties & Transparency", leaderId: 7, stance: "Moderate" },
    { id: "wa",  name: "Workers' Alliance", seats: 12, popularity: 15, ideology: "Unions & Welfare", leaderId: 3, stance: "Left" },
    { id: "rf",  name: "Republican Front", seats: 6, popularity: 8, ideology: "Abolish Monarchy", leaderId: 4, stance: "Anti-Crown" }
];

// Demographic Sectors
game.demographics = [
    { id: "workers", name: "Industrial Workers", pop: 3.4, approval: 44, weight: 22, demand: "Public healthcare & wage subsidies" },
    { id: "farmers", name: "Agrarian Farmers", pop: 2.1, approval: 68, weight: 15, demand: "Agricultural diesel subsidies" },
    { id: "urban",   name: "Urban Professionals", pop: 4.8, approval: 52, weight: 25, demand: "Free press & tech investment" },
    { id: "youth",   name: "Students & Youth", pop: 1.9, approval: 39, weight: 10, demand: "University funding & democratic reform" },
    { id: "military",name: "Military Families", pop: 1.2, approval: 82, weight: 14, demand: "Defense procurement & border defense" },
    { id: "elite",   name: "Business Elite & Oligarchs", pop: 0.1, approval: 74, weight: 14, demand: "Low corporate tax & privatization" }
];

// 5 Powerful Mega-Corporations & Oligarchs
game.corporations = [
    { id: "veg", name: "Vance Energy Group", ceoId: 8, valuation: 18.4, influence: 85, militia: "Medium Private Guard", sector: "Oil & Natural Gas" },
    { id: "nsteel", name: "Northreach Heavy Steel", ceoId: 4, valuation: 12.1, influence: 70, militia: "Industrial Security", sector: "Metallurgy & Construction" },
    { id: "vtech", name: "Vancuria Tech Systems", ceoId: 7, valuation: 22.5, influence: 75, militia: "Cyber Defense", sector: "AI & Microchips" },
    { id: "rmaritime", name: "Royal Maritime Shipping", ceoId: 3, valuation: 9.8, influence: 60, militia: "Port Customs Guard", sector: "Logistics & Ports" },
    { id: "helios", name: "Helios Aerospace & Defense", ceoId: 5, valuation: 15.2, influence: 88, militia: "Elite Air Defense", sector: "Defense Procurement" }
];

// Strategic Commodity Markets
game.commodities = [
    { id: "oil", name: "Crude Oil", price: 78.5, unit: "bbl", trend: "+1.2%", playerOutput: "Medium" },
    { id: "gas", name: "Natural Gas", price: 4.20, unit: "MMBtu", trend: "+3.4%", playerOutput: "High" },
    { id: "steel", name: "Heavy Steel", price: 620.0, unit: "ton", trend: "-0.5%", playerOutput: "Very High" },
    { id: "grain", name: "Grain Yields", price: 240.0, unit: "ton", trend: "+0.8%", playerOutput: "High" },
    { id: "semis", name: "AI Chips & Tech", price: 1250.0, unit: "unit", trend: "+5.1%", playerOutput: "Medium" }
];

// Foreign Powers
game.diplomacy = {
    powers: [
        {
            id: "belvar",
            name: "Belvar Republic",
            leader: "President Amira Qadir",
            stance: "Regional Rival",
            relations: 15,
            trade: 2.4,
            defensePact: false,
            militaryAccess: false,
            economicAgreement: false,
            embargo: false,
            boycotted: false,
            war: false,
            borderTension: 28,
            sanctions: 0
        },
        {
            id: "orlov",
            name: "Orlov Empire",
            leader: "Emperor Orlov IV",
            stance: "Conservative Ally",
            relations: 65,
            trade: 4.1,
            defensePact: true,
            militaryAccess: true,
            economicAgreement: true,
            embargo: false,
            boycotted: false,
            war: false,
            borderTension: 8,
            sanctions: 0
        },
        {
            id: "qamar",
            name: "Qamar Sultanate",
            leader: "Sultan Tariq",
            stance: "Energy Partner",
            relations: 50,
            trade: 3.8,
            defensePact: false,
            militaryAccess: false,
            economicAgreement: true,
            embargo: false,
            boycotted: false,
            war: false,
            borderTension: 12,
            sanctions: 0
        },
        {
            id: "norland",
            name: "Norland Coalition",
            leader: "Chancellor Lindqvist",
            stance: "Reformist Observer",
            relations: -20,
            trade: 1.2,
            defensePact: false,
            militaryAccess: false,
            economicAgreement: false,
            embargo: false,
            boycotted: false,
            war: false,
            borderTension: 34,
            sanctions: 0
        }
    ]
};

// Intelligence Directorate
game.intelligence = {
    capability: 61,
    domesticControl: 35,
    foreignNetwork: 27
};

// Dynasty & Cadet Branches
game.dynasty = {
    name: "House Vance",
    headId: 1,
    heirId: 2,
    prestige: 1420,
    wealth: 8.7, // Billions
    publicFavor: 61,
    influence: 74,
    successionSecurity: 83,
    reputation: "Strong but Arrogant",
    branches: [
        { id: "main", name: "Main Branch", headId: 1, seats: ["Capital Citadel"], loyalty: 100, ambition: "Maintain Throne" },
        { id: "vance_north", name: "Vance-Northreach", headId: 4, seats: ["North Energy Basin"], loyalty: 52, ambition: "Regional Autonomy" },
        { id: "vance_iron", name: "Vance-Iron Coast", headId: 5, seats: ["Iron Coast"], loyalty: 88, ambition: "Defense Command Supremacy" },
        { id: "vance_qamar", name: "Vance-Qamar", headId: 3, seats: ["Foreign Diplomatic Envoy"], loyalty: 74, ambition: "International Alliance" }
    ]
};

// Intelligence System (Clean initial state - no unexplained cases/rumors at start)
game.intelligenceSystem = {
    agency: "Directorate of National Security",
    domestic: 72,
    foreign: 48,
    cyber: 81,
    counterIntel: 64,
    activeWiretaps: new Set(),
    discoveredSecrets: new Set(),
    rumors: [],
    cases: []
};

// Relationships – key: "fromId_toId"
game.relationships = {};
game.getRelation = function(fromId, toId) {
    const key = `${fromId}_${toId}`;
    return game.relationships[key] || { value: 0, type: "Neutral", alliance: false };
};
game.setRelation = function(fromId, toId, value, type, alliance = false) {
    game.relationships[`${fromId}_${toId}`] = { value, type, alliance };
};

game.clampMetric = function(value, min = 0, max = 100) {
    const num = Number(value);
    if (!isFinite(num)) return min;
    return Math.min(max, Math.max(min, num));
};

game.sanitizeState = function() {
    if (!game.realm) game.realm = {};
    if (!game.politics) game.politics = {};
    if (!game.regime) game.regime = {};
    if (!game.revolution) game.revolution = {};
    if (!game.military) game.military = {};
    game.economy ||= {};
    game.economy.industrialCapacity = game.clampMetric(game.economy.industrialCapacity, 0, 100);
    game.military.modernization = game.clampMetric(game.military.modernization, 0, 100);
    game.military.equipment = game.clampMetric(game.military.equipment, 0, 100);
    game.military.airPower = game.clampMetric(game.military.airPower, 0, 100);
    game.military.navalPower = game.clampMetric(game.military.navalPower, 0, 100);
    game.military.armyPower = game.clampMetric(game.military.armyPower, 0, 100);
    game.military.procurementHistory ||= [];
    game.military.procurementPrograms ||= [];

    game.realm.approval = game.clampMetric(game.realm.approval, 0, 100);
    game.realm.legitimacy = game.clampMetric(game.realm.legitimacy, 0, 100);
    game.realm.stability = game.clampMetric(game.realm.stability, 0, 100);
    game.realm.treasury = Math.max(0, Number(game.realm.treasury) || 0);
    game.realm.prestige = Number(game.realm.prestige) || 0;

    game.politics.parliamentSupport = game.clampMetric(game.politics.parliamentSupport, 0, 100);
    game.politics.opposition = game.clampMetric(game.politics.opposition, 0, 100);
    game.politics.corruption = game.clampMetric(game.politics.corruption, 0, 100);
    game.politics.authoritarianism = game.clampMetric(game.politics.authoritarianism, 0, 100);

    game.regime.revolutionaryPressure = game.clampMetric(game.regime.revolutionaryPressure, 0, 100);

    game.revolution.organization = game.clampMetric(game.revolution.organization, 0, 100);
    game.revolution.popularSupport = game.clampMetric(game.revolution.popularSupport, 0, 100);
    game.revolution.armedSupport = game.clampMetric(game.revolution.armedSupport, 0, 100);
    game.revolution.revolutionaryLegitimacy = game.clampMetric(game.revolution.revolutionaryLegitimacy, 0, 100);
    game.revolution.governmentResponse = game.clampMetric(game.revolution.governmentResponse, 0, 100);
    game.revolution.fervor = game.clampMetric(game.revolution.fervor, 0, 100);

    return game;
};

game.adjustMetric = function(target, key, delta, min = 0, max = 100) {
    if (!target || !key) return null;
    const current = Number(target[key]) || 0;
    const next = Number(delta) || 0;
    target[key] = game.clampMetric(current + next, min, max);
    return target[key];
};

game.adjustLegitimacy = function(delta) {
    if (!game.realm) game.realm = {};
    return game.adjustMetric(game.realm, 'legitimacy', delta, 0, 100);
};

game.bindStateMetrics();

game.improveRelation = function(fromId, toId, amount) {
    const rel = game.getRelation(fromId, toId);
    rel.value = Math.min(100, rel.value + amount);
    if (rel.type === "Neutral" && rel.value > 20) rel.type = "Friendship";
    if (rel.value > 60 && !rel.alliance) rel.type = "Loyalty";
    game.setRelation(fromId, toId, rel.value, rel.type, rel.alliance);
    return rel;
};

game.worsenRelation = function(fromId, toId, amount) {
    const rel = game.getRelation(fromId, toId);
    rel.value = Math.max(-100, rel.value - amount);
    if (rel.type === "Neutral" && rel.value < -20) rel.type = "Rivalry";
    if (rel.value < -60) rel.type = "Hatred";
    game.setRelation(fromId, toId, rel.value, rel.type, rel.alliance);
    return rel;
};

game.formAlliance = function(fromId, toId) {
    const rel = game.getRelation(fromId, toId);
    rel.alliance = true;
    rel.type = "Political Alliance";
    game.setRelation(fromId, toId, rel.value, rel.type, rel.alliance);
    return rel;
};

game.breakAlliance = function(fromId, toId) {
    const rel = game.getRelation(fromId, toId);
    rel.alliance = false;
    if (rel.value > 40) rel.type = "Friendship";
    else rel.type = "Neutral";
    game.setRelation(fromId, toId, rel.value, rel.type, rel.alliance);
    return rel;
};

game.getSpouse = function(characterOrId) {
    const c = typeof characterOrId === "object" ? characterOrId : game.characters.find(ch => ch.id === characterOrId);
    if (!c) return null;

    if (c.spouseId) {
        const spouse = game.characters.find(ch => ch.id === c.spouseId && ch.status !== "Deceased");
        if (spouse) return spouse;
    }

    const reverse = game.characters.find(ch => ch.id !== c.id && ch.spouseId === c.id && ch.status !== "Deceased");
    if (reverse) return reverse;
    return null;
};

game.setSpouse = function(character, spouse) {
    if (!character || !spouse || character.id === spouse.id) return;
    character.married = true;
    character.spouseId = spouse.id;
    spouse.married = true;
    spouse.spouseId = character.id;
    return { character, spouse };
};

// 8 Provinces
game.provinces = [
    { id: 1, name: "North Energy Basin", population: 2.8, dev: 62, wealth: 68, loyalty: 70, unrest: 14,
        industry: 75, resource: "Natural Gas & Hydro", governorId: 4, infra: 70, separatism: 25,
        hasGarrison: false, actionTakenThisMonth: false },
    { id: 2, name: "East Trade Corridor", population: 3.9, dev: 78, wealth: 85, loyalty: 58, unrest: 22,
        industry: 80, resource: "Commercial Ports", governorId: 7, infra: 85, separatism: 15,
        hasGarrison: false, actionTakenThisMonth: false },
    { id: 3, name: "Capital Citadel", population: 6.4, dev: 92, wealth: 95, loyalty: 82, unrest: 8,
        industry: 90, resource: "Financial Tech", governorId: 5, infra: 95, separatism: 5,
        hasGarrison: false, actionTakenThisMonth: false },
    { id: 4, name: "Iron Coast", population: 4.2, dev: 49, wealth: 72, loyalty: 54, unrest: 31,
        industry: 82, resource: "Heavy Steel", governorId: 8, infra: 55, separatism: 40,
        hasGarrison: false, actionTakenThisMonth: false },
    { id: 5, name: "South Arable Reach", population: 3.1, dev: 42, wealth: 45, loyalty: 48, unrest: 38,
        industry: 35, resource: "Grain & Livestock", governorId: 3, infra: 40, separatism: 30,
        hasGarrison: false, actionTakenThisMonth: false },
    { id: 6, name: "Highland Marches", population: 1.8, dev: 55, wealth: 50, loyalty: 65, unrest: 18,
        industry: 50, resource: "Strategic Fortress & Hydro", governorId: 6, infra: 60, separatism: 20,
        hasGarrison: false, actionTakenThisMonth: false },
    { id: 7, name: "Qamar Reach", population: 2.2, dev: 70, wealth: 75, loyalty: 74, unrest: 12,
        industry: 65, resource: "Refining & Trade Envoy", governorId: 2, infra: 75, separatism: 10,
        hasGarrison: false, actionTakenThisMonth: false },
    { id: 8, name: "Western Frontier", population: 1.4, dev: 38, wealth: 52, loyalty: 50, unrest: 25,
        industry: 40, resource: "Rare Earth Minerals", governorId: 1, infra: 45, separatism: 35,
        hasGarrison: false, actionTakenThisMonth: false }
];

// Procedural Character Counter
let nextCharId = 100;

game.makeCharacterName = function(opts = {}) {
    const maleNames = ["Marcus", "Adrian", "Christian", "Leo", "Dmitri", "Gabriel", "Viktor", "Lucas", "Alexander", "Valentin"];
    const femaleNames = ["Victoria", "Sophia", "Elena", "Clara", "Isabella", "Aria", "Anastasia", "Helena", "Camilla", "Valerie"];
    const familyNames = ["Vance", "Berezov", "Qamar", "Al-Rashid", "Northreach", "Valerian", "Kravitz", "Mirov"];

    const genderIsMale = opts.gender === "Male" || (!opts.gender && Math.random() < 0.5);
    const firstName = (opts.firstName || (genderIsMale ? maleNames[Math.floor(Math.random() * maleNames.length)] : femaleNames[Math.floor(Math.random() * femaleNames.length)]) || "Alden").trim();
    const lastName = (opts.lastName || familyNames[Math.floor(Math.random() * familyNames.length)] || "Vance").trim();
    const candidate = [firstName, lastName].filter(Boolean).join(' ');
    return (opts.name || candidate || `${genderIsMale ? "Alden" : "Aurelia"} Vance`).trim();
};

// Procedural Character Generator Engine
game.generateCharacter = function(opts = {}) {
    const id = nextCharId++;
    const isMale = opts.gender ? opts.gender === "Male" : Math.random() < 0.5;
    const genderStr = isMale ? "Male" : "Female";
    
    const maleNames = ["Marcus", "Adrian", "Christian", "Leo", "Dmitri", "Gabriel", "Viktor", "Lucas", "Alexander", "Valentin"];
    const femaleNames = ["Victoria", "Sophia", "Elena", "Clara", "Isabella", "Aria", "Anastasia", "Helena", "Camilla", "Valerie"];
    const familyNames = ["Vance", "Berezov", "Qamar", "Al-Rashid", "Northreach", "Valerian", "Kravitz", "Mirov"];

    const chosenFirstName = isMale ? maleNames[Math.floor(Math.random() * maleNames.length)] : femaleNames[Math.floor(Math.random() * femaleNames.length)];
    const chosenLastName = opts.lastName || familyNames[Math.floor(Math.random() * familyNames.length)];

    const name = (opts.name || `${chosenFirstName} ${chosenLastName}` || `${chosenFirstName} ${chosenLastName}`).trim();
    const age = opts.age !== undefined ? opts.age : Math.floor(Math.random() * 40) + 18;
    const houseId = opts.houseId || (chosenLastName === "Vance" ? "house_vance" : (chosenLastName === "Berezov" ? "house_berezov" : "house_northreach"));

    // Trait Pool
    const traitPool = ["Charismatic", "Paranoid", "Calculating", "Reckless", "Ambitious", "Diplomatic", "Hawk", "Zealot", "Deceitful", "Greedy", "Brave", "Calm", "Corrupt", "Wealthy", "Stoic", "Visionary", "Fanatical", "Pragmatic"];
    const backgroundPool = ["Court-born noble", "Provincial soldier", "Rural landowner", "Merchant dynasty scion", "Religious reformist", "University scholar", "Industrial manager", "Military cadet", "Frontier war veteran", "Urban activist"];
    const educationPool = ["Royal Academy", "Imperial University", "Military Staff College", "Private Tutors", "Trade Institute", "Provincial Seminary", "Foreign Embassy School", "Self-taught strategist"];
    const motivePool = ["Restore family honor", "Win public acclaim", "Expand the estate", "Secure dynastic succession", "Break institutional corruption", "Build a lasting legacy", "Protect the realm from collapse", "Dominate the political arena"];
    const fearPool = ["Losing status", "Military betrayal", "Public humiliation", "A rival claim", "Financial ruin", "Revolutionary mobs", "The court's intrigue", "A failed heir"];
    const demeanorPool = ["Measured and formal", "Warm but ambitious", "Sharply pragmatic", "Easily provoked", "Quietly calculating", "Publicly charismatic", "Ruthlessly efficient", "Morally rigid"];

    const selectedTraits = opts.traits || [traitPool[Math.floor(Math.random() * traitPool.length)], traitPool[Math.floor(Math.random() * traitPool.length)]];
    const background = opts.background || backgroundPool[Math.floor(Math.random() * backgroundPool.length)];
    const education = opts.education || educationPool[Math.floor(Math.random() * educationPool.length)];
    const motive = opts.goal || motivePool[Math.floor(Math.random() * motivePool.length)];
    const fear = opts.fear || fearPool[Math.floor(Math.random() * fearPool.length)];
    const demeanor = opts.demeanor || demeanorPool[Math.floor(Math.random() * demeanorPool.length)];

    const newChar = {
        id,
        name,
        gender: genderStr,
        houseId,
        type: opts.type || "cabinet",
        role: opts.role || "Rising Citizen",
        age,
        health: opts.health || Math.floor(Math.random() * 30) + 70,
        opinion: opts.opinion !== undefined ? opts.opinion : 60,
        ambition: opts.ambition || Math.floor(Math.random() * 50) + 40,
        claimStrength: opts.claimStrength || 0,
        militarySupport: opts.militarySupport || Math.floor(Math.random() * 40) + 20,
        aristocraticSupport: opts.aristocraticSupport || Math.floor(Math.random() * 40) + 20,
        publicSupport: opts.publicSupport || Math.floor(Math.random() * 40) + 20,
        traits: selectedTraits,
        background,
        education,
        goal: motive,
        fear,
        demeanor,
        isPlayer: false,
        status: "Active",
        married: opts.married || false,
        spouseId: opts.spouseId || null,
        parentId: opts.parentId || null,
        motherId: opts.motherId || null,
        children: opts.children || [],
        hiddenAmbition: Math.floor(Math.random() * 60) + 40,
        secret: opts.secret || "Maintains discreet private investments.",
        memory: [{ year: game.date.getFullYear(), delta: 0, reason: "Entered Public Life" }]
    };

    game.characters.push(newChar);
    return newChar;
};

// Initial Core Characters
game.characters = [
    { id: 1, name: "Victor Vance", gender: "Male", houseId: "house_vance", type: "family", role: "Grand Duke (You)", age: 60, health: 80, opinion: 100,
        ambition: 90, claimStrength: 100, militarySupport: 90, aristocraticSupport: 80, publicSupport: 65,
        traits: ["Charismatic", "Paranoid"], isPlayer: true, status: "Active", married: true, spouseId: 3,
        children: [
            { name: "Prince Victor II", age: 8, education: "Royal Academy" },
            { name: "Princess Elena II", age: 5, education: "Private Tutor" }
        ],
        hiddenAmbition: 95, secret: "Maintains off-grid emergency fund in Zurich.",
        memory: [{ year: game.date.getFullYear(), delta: 100, reason: "Throne Initialized" }] },

    { id: 2, name: "Alexander Vance", gender: "Male", houseId: "house_vance", type: "family", role: "Crown Prince (Heir)", age: 30, health: 95, opinion: 75,
        ambition: 82, claimStrength: 100, militarySupport: 71, aristocraticSupport: 68, publicSupport: 74,
        traits: ["Reckless", "Charming"], isPlayer: false, status: "Active", married: true, parentId: 1, motherId: 3,
        children: [
            { name: "Prince Christian", age: 4, education: "Nursery" }
        ],
        hiddenAmbition: 91, secret: "Secretly meeting disaffected garrison officers.",
        memory: [{ year: game.date.getFullYear() - 3, delta: 20, reason: "Co-funded foundation" }] },

    { id: 3, name: "Duchess Elena", gender: "Female", houseId: "house_vance", type: "family", role: "Spouse & Consort", age: 57, health: 85, opinion: 70,
        ambition: 60, claimStrength: 30, militarySupport: 35, aristocraticSupport: 75, publicSupport: 60,
        traits: ["Calculating", "Greedy"], isPlayer: false, status: "Active", married: true, spouseId: 1,
        hiddenAmbition: 65, secret: "Monopolizes capital art market auctions.",
        memory: [{ year: game.date.getFullYear() - 4, delta: 15, reason: "Diplomatic Marriage" }] },

    { id: 4, name: "Julian Vance", gender: "Male", houseId: "house_vance", type: "family", role: "Younger Brother", age: 53, health: 78, opinion: 40,
        ambition: 88, claimStrength: 65, militarySupport: 52, aristocraticSupport: 45, publicSupport: 35,
        traits: ["Envious", "Zealot"], isPlayer: false, status: "Active", married: true, parentId: 1,
        hiddenAmbition: 94, secret: "Funneling southern provincial duties into private logistics accounts.",
        memory: [{ year: game.date.getFullYear() - 3, delta: -20, reason: "Disputed provincial duties" }] },

    { id: 5, name: "Gen. Roger Vance", gender: "Male", houseId: "house_qamar", type: "cabinet", role: "Minister of Defense", age: 69, health: 65, opinion: 82,
        ambition: 40, claimStrength: 20, militarySupport: 88, aristocraticSupport: 60, publicSupport: 50,
        traits: ["Hawk", "Brave"], isPlayer: false, status: "Active",
        hiddenAmbition: 50, secret: "Pledged military support to Crown Prince Alexander if Duke falls ill.",
        memory: [{ year: game.date.getFullYear() - 1, delta: 25, reason: "Defense procurement expanded" }] },

    { id: 6, name: "Director Kravitz", gender: "Male", houseId: "house_valerian", type: "cabinet", role: "Intel Chief", age: 52, health: 85, opinion: 60,
        ambition: 70, claimStrength: 0, militarySupport: 40, aristocraticSupport: 45, publicSupport: 25,
        traits: ["Deceitful", "Cynical"], isPlayer: false, status: "Active",
        hiddenAmbition: 85, secret: "Sells electronic wiretap logs to foreign intelligence agencies.",
        memory: [{ year: game.date.getFullYear() - 2, delta: 10, reason: "Surveillance expansion authorized" }] },

    { id: 7, name: "Lady Cassandra", gender: "Female", houseId: "house_rashid", type: "cabinet", role: "Foreign Minister", age: 47, health: 90, opinion: 75,
        ambition: 55, claimStrength: 0, militarySupport: 30, aristocraticSupport: 82, publicSupport: 68,
        traits: ["Diplomat", "Calm"], isPlayer: false, status: "Active",
        hiddenAmbition: 60, secret: "Maintains secret diplomatic backchannel with Norland Coalition.",
        memory: [{ year: game.date.getFullYear() - 1, delta: 15, reason: "Appointed Foreign Minister" }] },

    { id: 8, name: "Oligarch Berezov", gender: "Male", houseId: "house_berezov", type: "cabinet", role: "Interior Minister", age: 66, health: 60, opinion: 55,
        ambition: 85, claimStrength: 0, militarySupport: 30, aristocraticSupport: 90, publicSupport: 28,
        traits: ["Corrupt", "Wealthy"], isPlayer: false, status: "Active", married: true,
        hiddenAmbition: 88, secret: "Owns 40% of Iron Coast heavy manufacturing unlisted shares.",
        memory: [{ year: game.date.getFullYear() - 1, delta: 20, reason: "Celebrated diplomatic marriage" }] }
];

// Marriage Proposals Board Registry
game.marriageProposals = [];

// 100+ Year Generational History Timeline
game.generationalTimeline = [
    { year: game.date.getFullYear() - 8, text: "House Vance established sovereign primogeniture law." },
    { year: game.date.getFullYear() - 3, text: "Prince Alexander Vance celebrated diplomatic marriage." },
    { year: game.date.getFullYear(), text: "Grand Duke Victor Vance initialized modern simulation graph." }
];

// Dynasty Reputation Database across generations
game.dynastyReputation = {
    foundingYear: 1987,
    totalRulers: 1,
    totalReigns: 1,
    warsWon: 0,
    failedSuccessions: 0,
    epithet: "Architects of the Vancurian Industrial Age"
};

// Mega-Projects
game.projects = [
    { id: 1, name: "Metropolitan Maglev Transit", cost: 1.5, progress: 0, active: false, desc: "+12% Public Approval, +$0.1B Monthly Income upon completion.",
        reward: () => { game.realm.approval = Math.min(100, game.realm.approval + 12); } },
    { id: 2, name: "Deepwater Sovereign Naval Yard", cost: 2.2, progress: 0, active: false,
        desc: "+25% Military Force Readiness, +100 Realm Prestige.",
        reward: () => { game.military.readiness += 25; game.realm.prestige += 100; } },
    { id: 3, name: "Integrated National AI Data Core", cost: 3.0, progress: 0, active: false,
        desc: "-10 Sovereign Stress, unlocks advanced intelligence decrees.",
        reward: () => { game.realm.stress = Math.max(0, game.realm.stress - 10); } },
    { id: 4, name: "Vancurian Grand Canal", cost: 4.5, progress: 0, active: false,
        desc: "+25% Trade GDP growth, +15 Realm Prestige.",
        reward: () => { game.realm.gdp += 12.0; game.realm.prestige += 150; } }
];

// Black Projects
game.blackProjects = [
    { id: "oracle", name: "PROJECT ORACLE", cost: 5.0, progress: 0, active: false, desc: "Classified Predictive AI Surveillance Network. Neutralizes coup conspiracies before they form.", reward: () => { game.military.officerConspiracy = 0; } },
    { id: "aegis", name: "PROJECT AEGIS", cost: 6.5, progress: 0, active: false, desc: "Autonomous Strategic Missile Defense System. Grants immune status to foreign military coercion.", reward: () => { game.military.readiness += 50; } },
    { id: "helios", name: "PROJECT HELIOS", cost: 8.0, progress: 0, active: false, desc: "Experimental Fusion Power Array. Generates +$2.5B monthly clean energy state revenue.", reward: () => { game.realm.gdp += 20.0; } },
    { id: "nocturne", name: "PROJECT NOCTURNE", cost: 4.0, progress: 0, active: false, desc: "Deep Cover Foreign Intelligence Syndicate. Unlocks full intelligence dossier visibility.", reward: () => { game.intelligence.foreignNetwork = 95; } }
];

// AI Director Registry
game.aiDirector = {
    tensions: {
        deficit: "Low",
        militaryUnrest: "Low",
        separatism: "Low",
        scandal: "Medium"
    },
    eventQueue: []
};

game.legacy = [];
game.usedEvents = new Set();
game.activeEvent = null;

// Seed log
const startYr = game.date.getFullYear();
const initialHistory = [
    `[Jul ${startYr - 1}] Celebrated diplomatic marriage for Oligarch Berezov.`,
    `[Apr ${startYr - 3}] Celebrated diplomatic marriage for Alexander Vance.`,
    `[Apr ${startYr - 3}] Celebrated diplomatic marriage for Julian Vance.`,
    `[Nov ${startYr - 5}] Air defense neutralized foreign drone.`,
    `[Apr ${startYr - 5}] Dispatched security forces to secure transit terminals.`,
    `[Jan ${startYr}] Throne initialized. Generational Population Engine Active.`
];

/**
 * Validate current game state integrity.
 * @returns {Array<string>} Array of error messages, if any.
 */
game.validateGameState = function() {
    const errors = [];
    if (!this.realm || isNaN(this.realm.gdp)) errors.push("Invalid realm GDP");
    if (!this.realm || isNaN(this.realm.treasury)) errors.push("Invalid treasury");
    if (!this.date || !(this.date instanceof Date) || isNaN(this.date.getTime())) errors.push("Invalid date object");
    const rulerId = this.realm?.rulerId || this.dynasty?.headId || this.characters?.find(c => c.isPlayer)?.id;
    if (!this.characters || !Array.isArray(this.characters)) {
        errors.push("Invalid characters array");
    } else {
        if (!rulerId) {
            errors.push("Missing rulerId");
        } else {
            const rulerExists = this.characters.some(c => c.id === rulerId && (c.status === "Alive" || c.status === "Active"));
            if (!rulerExists) errors.push(`Ruler ${rulerId} does not exist or is not alive/active`);
        }
        this.characters.forEach((c, index) => {
            if (!c || typeof c !== "object") {
                errors.push(`Character at index ${index} is invalid`);
            } else if (!c.id) {
                errors.push(`Character at index ${index} missing ID`);
            }
        });
    }
    return errors;
};

console.log("gameState.js loaded successfully. Generational Lifecycle & 6 Competing Great Houses initialized.");
