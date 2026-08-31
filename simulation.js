// simulation.js – Full Propagation & Generational Lifecycle Engine
// Propagation Graph: PERSON -> FAMILY -> COURT -> GOVERNMENT -> SOCIETY -> ECONOMY -> WORLD -> HISTORY

let totalSurveillanceUpkeep = 0;

function simulateMonth() {
    if (game.activeEvent) return;

    if (game.constitution?.emergencyActive) {
        game.constitution.emergencyMonths = (game.constitution.emergencyMonths || 0) + 1;
        game.realm.stability = Math.min(100, (game.realm.stability || 0) + 1);
        game.realm.approval = Math.max(0, (game.realm.approval || 0) - 1);
        game.politics.opposition = Math.min(100, (game.politics.opposition || 0) + 1);
    }

    // Generational Population Engine Tick
    simulatePopulation();

    // Propagation Graph Execution
    simulateGovernorsAndProvinces();
    simulateMacroEconomyAndCorporations();
    simulateDemographicsAndElections();
    simulateMilitaryAndGenerals();
    simulateDiplomacyAndForeignPowers();
    simulateRevolution();          // ← Revolutionary State Machine
    simulateIntelligenceCases();   // Dynamic Intel Case Pipeline
    runNarrativeAIDirector();

    // Advance Calendar safely
    if (!(game.date instanceof Date) || isNaN(game.date.getTime())) {
        game.date = new Date(game.date || Date.now());
    }

    game.date.setMonth(game.date.getMonth() + 1);
    game.totalMonthsPassed = (game.totalMonthsPassed || 0) + 1;

    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        dateDisplay.innerText = game.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // Monthly event processor
    processEventsMonthly();

    publishWorldInformationEcosystem();
    game.monthActions = [];

    // Auto-save state
    saveGame();
    updateUI();
}

// 1. GENERATIONAL POPULATION ENGINE
function simulatePopulation() {
    game.sanitizeState();

    // January Annual Lifecycle Tick
    if (game.date.getMonth() === 0) {
        ageAllCharacters();
        processPregnanciesAndBirths();
        simulateMarriageMarket();
        generateRisingGeneration();
        simulateCompetingHouses();
    }

    processMortalityAndConsequences();
}

function ageAllCharacters() {
    game.characters.forEach(c => {
        if (c.status === "Deceased") return;
        c.age += 1;

        // Health Decay for Elders
        if (c.age > 65) {
            c.health -= Math.floor(Math.random() * 4) + 1;
        }

        // Life Stage Milestones
        if (c.age === 6) {
            log(`${c.name} has reached age 6 and commenced formal education.`);
        } else if (c.age === 12) {
            log(`${c.name} has reached adolescence (Age 12), displaying strong aptitude.`);
        } else if (c.age === 16 && c.houseId === "house_vance") {
            // Queue Education Choice Event for Royal Lineage
            game.aiDirector.eventQueue.push({
                id: `edu_${c.id}`,
                title: `EDUCATION MILESTONE: ${c.name.toUpperCase()} (AGE 16)`,
                desc: `${c.name} has reached age 16. Select their specialized royal education field to shape future traits and career capability.`,
                choices: [
                    { text: "🎖️ Military Officer Academy (+20 Mil Favor, Hawk Trait)", act: () => { c.militarySupport += 20; c.traits.push("Hawk"); log(`${c.name} entered the Military Officer Academy.`); } },
                    { text: "🏛️ Royal University of Law & Politics (+20 Public Support, Diplomat)", act: () => { c.publicSupport += 20; c.traits.push("Diplomat"); log(`${c.name} entered the Royal University.`); } },
                    { text: "📈 Sovereign Economic Institute (+20 Aristocratic Favor, Wealthy)", act: () => { c.aristocraticSupport += 20; c.traits.push("Wealthy"); log(`${c.name} entered the Economic Institute.`); } }
                ]
            });
        }
    });
}

function processPregnanciesAndBirths() {
    game.characters.forEach(parent => {
        const spouse = game.getSpouse(parent);
        const isEligible = parent.gender === "Female" && parent.status === "Active" && parent.age >= 18 && parent.age <= 44;
        if (!isEligible || !(parent.married || spouse)) return;

        if (Math.random() < 0.18) {
            const father = spouse || game.characters.find(sp => sp.isPlayer && sp.status === "Active") || null;
            const fatherName = father ? father.name : "Vance";
            const lastName = fatherName.split(' ').pop() || "Vance";

            const fatherTraits = father ? father.traits : ["Charismatic"];
            const motherTraits = parent.traits || ["Calculating"];
            const inherited = [
                fatherTraits[Math.floor(Math.random() * fatherTraits.length)],
                motherTraits[Math.floor(Math.random() * motherTraits.length)]
            ];
            if (Math.random() < 0.15) inherited.push("Ambitious");

            const child = game.generateCharacter({
                lastName,
                age: 0,
                houseId: parent.houseId,
                type: parent.houseId === "house_vance" ? "family" : "cabinet",
                role: parent.houseId === "house_vance" ? "Royal Prince / Princess" : "Noble Heir",
                parentId: father ? father.id : null,
                motherId: parent.id,
                traits: inherited
            });

            if (father && !father.spouseId) game.setSpouse(parent, father);
            else if (!parent.spouseId && father) game.setSpouse(parent, father);

            log(`👶 A CHILD IS BORN: ${child.name} born to ${parent.name} and ${father ? father.name : 'Consort'}.`);
            game.generationalTimeline.unshift({
                year: game.date.getFullYear(),
                text: `${child.name} was born into ${parent.houseId === "house_vance" ? "House Vance" : "Great Noble House"}.`
            });

            if (parent.houseId === "house_vance") {
                game.monthActions.push({
                    headline: `ROYAL BIRTH: ${child.name.toUpperCase()} BORN IN CITADEL`,
                    lead: `The throne celebrated the formal addition of ${child.name} to the royal dynastic line.`
                });
            }
        }
    });
}

function simulateMarriageMarket() {
    // Generate marriage proposals for unmarried Vance adults age 18-35
    const unmarriedVance = game.characters.find(c => c.houseId === "house_vance" && !c.married && c.age >= 18 && c.age <= 35 && c.status === "Active");
    
    if (unmarriedVance && game.marriageProposals.length < 2 && Math.random() < 0.35) {
        const rivalHouses = game.houses.filter(h => h.id !== "house_vance" && h.status === "Active");
        const pickedHouse = rivalHouses[Math.floor(Math.random() * rivalHouses.length)];
        
        if (pickedHouse) {
            const proposalId = Date.now();
            const candidateName = game.makeCharacterName({
                gender: Math.random() < 0.5 ? 'Male' : 'Female',
                lastName: pickedHouse.name.replace('House ', '') || 'Vance'
            });
            const polVal = Math.floor(Math.random() * 20) + 10;
            const wealthVal = +(Math.random() * 1.5 + 0.5).toFixed(1);

            game.marriageProposals.push({
                id: proposalId,
                vanceCharId: unmarriedVance.id,
                vanceCharName: unmarriedVance.name,
                houseId: pickedHouse.id,
                houseName: pickedHouse.name,
                candidateName,
                politicalValue: polVal,
                wealthGain: wealthVal,
                loyaltyGain: 20
            });

            log(`MARRIAGE PROPOSAL: ${pickedHouse.name} offered match for ${unmarriedVance.name} (+${polVal} Pol. Value, +$${wealthVal}B).`);
        }
    }
}

function generateRisingGeneration() {
    // Periodically spawn new MPs, CEOs, Generals, Journalists (15% annual chance)
    if (Math.random() < 0.15 && game.characters.length < 25) {
        const roles = ["Rising Member of Parliament", "Corporate Executive", "Garrison Commandant", "Investigative Journalist", "Political Activist"];
        const chosenRole = roles[Math.floor(Math.random() * roles.length)];
        const newChar = game.generateCharacter({
            role: chosenRole,
            type: "cabinet",
            age: Math.floor(Math.random() * 20) + 25
        });
        log(`RISING CITIZEN: ${newChar.name} entered public prominence as ${chosenRole}.`);
    }
}

function simulateCompetingHouses() {
    game.houses.forEach(h => {
        if (h.id === "house_vance" || h.status !== "Active") return;

        // Wealth & Prestige drift
        if (game.realm.gdp > 80) h.wealth = +(h.wealth + 0.05).toFixed(2);
        
        // House Head check
        const head = game.characters.find(c => c.id === h.headId);
        if (!head || head.status === "Deceased") {
            const newHead = game.characters.find(c => c.houseId === h.id && c.status === "Active");
            if (newHead) {
                h.headId = newHead.id;
                log(`GREAT HOUSE SUCCESSION: ${newHead.name} assumed leadership of ${h.name}.`);
            } else {
                h.status = "Extinct";
                log(`EXTINCTION: ${h.name} has no living heirs and has been declared extinct!`);
            }
        }
    });
}

function processMortalityAndConsequences() {
    game.characters.forEach(c => {
        if (c.status === "Deceased") return;

        // Check death condition
        if (c.health <= 0 || (c.age >= 80 && Math.random() < 0.15)) {
            c.status = "Deceased";
            log(`DEATH: ${c.name} (${c.role}, Age ${c.age}) has passed away.`);
            game.generationalTimeline.unshift({
                year: game.date.getFullYear(),
                text: `${c.name} (${c.role}) passed away at age ${c.age}.`
            });

            if (c.spouseId) {
                const spouse = game.characters.find(ch => ch.id === c.spouseId);
                if (spouse && spouse.status !== "Deceased") {
                    spouse.married = false;
                    spouse.spouseId = null;
                }
            }

            // Consequence Propagation
            if (c.isPlayer) {
                evaluateSuccessionContest(c);
            } else if (c.role.includes("Minister")) {
                game.realm.stability = Math.max(0, game.realm.stability - 5);
                log(`CONSEQUENCE: Death of ${c.name} caused cabinet instability.`);
            }
        }
    });

    // Refill vital cabinet positions if deceased
    ensureGovernmentContinuity();

    evaluateDynastyExtinction();
}

function ensureGovernmentContinuity() {
    // Ensure key cabinet roles are never vacant long-term
    const activeCabinet = game.characters.filter(c => c.type === "cabinet" && c.status === "Active");
    if (activeCabinet.length < 4) {
        const firstNames = ["Marcus", "Helena", "Victor", "Seraphina", "Dorian", "Valerie"];
        const lastNames = ["Vane", "Stirling", "Blackwood", "Kovacs", "Thorne", "Mercer"];
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];

        const newMinister = game.generateCharacter({
            name: `${fn} ${ln}`,
            gender: Math.random() < 0.5 ? "Male" : "Female",
            age: Math.floor(35 + Math.random() * 25),
            role: "State Minister",
            type: "cabinet",
            houseId: null,
            opinion: 60,
            traits: ["Calculating", "Diplomat"],
            health: 90
        });

        if (typeof log === 'function') log(`🏛️ ${newMinister.name} was appointed to fill a vacant State Ministry.`);
    }
}

function evaluateDynastyExtinction() {
    const livingVance = game.characters.filter(c => c.houseId === "house_vance" && c.status === "Active");
    const playerAlive = game.characters.some(c => c.isPlayer && c.status === "Active");

    if (livingVance.length === 0 && !game.revolution.active && !game.revolution.revolutionSucceeded && !playerAlive) {
        const fallbackLeader = game.characters.find(c => c.status === "Active" && c.type === "family") ||
            game.characters.find(c => c.status === "Active");

        if (fallbackLeader) {
            game.dynasty.headId = fallbackLeader.id;
            game.dynasty.heirId = fallbackLeader.id;
            fallbackLeader.isPlayer = true;
            fallbackLeader.role = "Interim Executive (You)";
        } else {
            game.dynasty.headId = null;
            game.dynasty.heirId = null;
        }

        game.constitution.headOfState = "Interim National Council";
        game.realm.legitimacy = Math.min(35, game.realm.legitimacy);
        game.realm.stability = Math.max(0, game.realm.stability - 20);
        log("CRITICAL DYNASTIC CRISIS: House Vance has no living heirs. The realm enters an interim council and the monarchy collapses.");
        triggerRegimeChange();
    }
}

function triggerRepublicElection(deadRuler) {
    const candidates = game.characters.filter(c => c.status === "Active" && c.id !== deadRuler.id && (c.type === "family" || c.type === "cabinet"));

    if (!candidates.length) {
        const fallback = game.characters.find(c => c.status === "Active");
        if (!fallback) {
            log("NATIONAL CRISIS: No viable candidate exists; the republic cannot elect a leader.");
            return;
        }
        fallback.isPlayer = true;
        fallback.role = "President of the Republic (You)";
        game.constitution.headOfState = "President of the Republic";
        game.dynasty.headId = fallback.id;
        log(`EMERGENCY APPOINTMENT: ${fallback.name} assumed the presidency by provisional mandate.`);
        return;
    }

    const winner = candidates
        .map(c => ({
            char: c,
            score: (Number(c.publicSupport) || 0) + (Number(c.militarySupport) || 0) + (Number(c.aristocraticSupport) || 0) + (Number(c.opinion) || 0) + (Number(c.claimStrength) || 0)
        }))
        .sort((a, b) => b.score - a.score)[0].char;

    game.characters.forEach(c => {
        if (c !== winner) c.isPlayer = false;
    });

    winner.isPlayer = true;
    winner.role = "President of the Republic (You)";
    game.constitution.headOfState = "President of the Republic";
    game.dynasty.headId = winner.id;
    game.dynasty.heirId = winner.id;

    log(`NATIONAL ELECTION: ${winner.name} wins the presidency by broad popular and elite support.`);
    triggerEventModal({
        title: "PRESIDENTIAL ELECTION",
        desc: `${winner.name} has won the republic's national election and is now the new president. The government continues under a new elected leader.`,
        choices: [
            { text: `Confirm ${winner.name} as President`, act: () => { game.adjustMetric(game.realm, 'legitimacy', 10, 0, 100); updateUI(); } }
        ]
    });
}

function evaluateSuccessionContest(deadRuler) {
    deadRuler.isPlayer = false;

    const isRepublicLeader = /President|Prime Minister|Executive/i.test(deadRuler.role || '') ||
        ["Revolutionary Republic", "Constitutional Transitional Government", "President of the Republic", "Interim National Council"].includes(game.constitution.headOfState);

    if (isRepublicLeader) {
        triggerRepublicElection(deadRuler);
        return;
    }

    // Generate Reign Legacy
    let titleStr = "THE INDUSTRIALIST";
    if (game.realm.approval > 75) titleStr = "THE BELOVED";
    else if (game.realm.stability < 30) titleStr = "THE TYRANT";
    else if (game.realm.prestige > 1500) titleStr = "THE MAGNIFICENT";

    const legacyEntry = {
        name: deadRuler.name,
        title: titleStr,
        reignEndYear: game.date.getFullYear(),
        gdp: game.realm.gdp,
        approval: game.realm.approval,
        prestige: game.realm.prestige,
        bio: `${deadRuler.name} ruled during a crucial era of state development, leaving behind a legacy marked as '${titleStr}'. HISTORY JUDGES YOU.`
    };
    game.legacy.unshift(legacyEntry);
    game.dynastyReputation.totalReigns += 1;

    let successor = game.characters.find(c => c.id === game.dynasty.heirId && c.status === "Active");
    if (!successor) {
        successor = game.characters.filter(c => c.type === "family" && c.status === "Active").sort((a,b) => b.claimStrength - a.claimStrength)[0];
    }

    if (successor) {
        successor.isPlayer = true;
        successor.role = "Grand Duke (You)";
        game.dynasty.headId = successor.id;
        
        const newHeir = game.characters.find(c => c.type === "family" && c.id !== successor.id && c.status === "Active");
        if (newHeir) game.dynasty.heirId = newHeir.id;

        // Determine Succession Outcome
        const milSupport = game.military.readiness;
        const oppSupport = game.politics.opposition;
        let contestOutcome = "Peaceful Coronation";
        let descStr = `${deadRuler.name} has passed away. Crown Prince ${successor.name} ascended the throne with full court support.`;

        if (oppSupport > 45) {
            contestOutcome = "Parliamentary Succession Crisis";
            descStr = `${deadRuler.name} has passed. Opposition MPs in Parliament refuse to recognize ${successor.name}'s claim without constitutional concessions!`;
        } else if (milSupport < 50) {
            contestOutcome = "Military Succession Intervention";
            descStr = `${deadRuler.name} has passed. High Command generals have temporarily suspended formal coronation ceremonies!`;
        }

        log(`SUCCESSION CONTEST: ${contestOutcome.toUpperCase()}! LONG LIVE ${successor.name.toUpperCase()}!`);
        triggerEventModal({
            title: `SUCCESSION: ${contestOutcome.toUpperCase()}`,
            desc: descStr,
            choices: [
                { text: `Crown ${successor.name} Grand Duke and pledge stability`, act: () => { game.adjustMetric(game.realm, 'legitimacy', 10, 0, 100); updateUI(); } }
            ]
        });
    } else {
        log("CRITICAL DYNASTIC CRISIS: House Vance has no eligible heirs!");
    }
}

// 2. GOVERNORS & PROVINCES
function simulateGovernorsAndProvinces() {
    game.provinces.forEach(p => {
        p.actionTakenThisMonth = false;
        const gov = game.characters.find(c => c.id === p.governorId);

        if (gov) {
            if (gov.opinion < 40) {
                p.separatism = Math.min(100, p.separatism + 0.8);
                p.loyalty = Math.max(0, p.loyalty - 0.5);
            } else if (gov.opinion > 70) {
                p.separatism = Math.max(0, p.separatism - 0.4);
                p.loyalty = Math.min(100, p.loyalty + 0.5);
            }
        }

        if (p.hasGarrison) p.unrest = Math.max(0, p.unrest - 2);

        if (p.unrest > 40) {
            p.loyalty = Math.max(0, p.loyalty - 1);
            game.realm.stability = Math.max(0, game.realm.stability - 0.4);
        }
    });
}

// 3. MACRO ECONOMY, BUDGET & CORPORATIONS
function simulateMacroEconomyAndCorporations() {
    // 0. Sanitize State against Infinity/NaN
    if (!isFinite(game.realm.treasury)) game.realm.treasury = 10.45;
    if (!isFinite(game.realm.gdp) || game.realm.gdp <= 0) game.realm.gdp = 82.4;
    if (!isFinite(game.budget.sovereignDebt)) game.budget.sovereignDebt = 5.0;
    if (!isFinite(game.realm.taxRate)) game.realm.taxRate = 1.0;

    // 1. Calculate Provincial Average Development & Infrastructure
    let totalInfra = 0;
    game.provinces.forEach(p => { 
        if (!isFinite(p.infra)) p.infra = 50;
        totalInfra += p.infra; 
    });
    const avgInfra = game.provinces.length > 0 ? (totalInfra / game.provinces.length) : 50;

    // 2. Corporate Valuations Sum & Sanitization
    let totalCorpValuation = 0;
    game.corporations.forEach(c => { 
        if (!isFinite(c.valuation) || c.valuation <= 0) c.valuation = 15.0;
        c.valuation = Math.min(300.0, c.valuation);
        totalCorpValuation += c.valuation; 
    });

    // 3. Commodity Market Effects
    const oilObj = game.commodities.find(c => c.id === 'oil');
    const gasObj = game.commodities.find(c => c.id === 'gas');
    const oilPrice = (oilObj && isFinite(oilObj.price)) ? oilObj.price : 75;
    const gasPrice = (gasObj && isFinite(gasObj.price)) ? gasObj.price : 4.0;

    // 4. Calculate Revenues
    const rev = game.budget.revenue;
    const corpBaseTax = totalCorpValuation * 0.003 * game.realm.taxRate;
    const stateCorpRevenue = game.corporations.reduce((total, corporation) => {
        if (!corporation.stateOwned) return total;
        return total + (corporation.valuation * (corporation.stateRevenueRate || 0.01));
    }, 0);
    rev.corporateTax = +(corpBaseTax + stateCorpRevenue).toFixed(2);
    rev.energyExports = +((gasPrice * 0.25) + (oilPrice * 0.01)).toFixed(2);
    rev.customsTariffs = +(game.realm.gdp * 0.005).toFixed(2);
    rev.total = +(rev.corporateTax + rev.energyExports + rev.customsTariffs).toFixed(2);

    // 5. Calculate Expenditures & Debt Servicing
    const exp = game.budget.expenditure;
    if (game.realm.bankrupt) {
        // Insolvent states cannot keep funding discretionary programs at full scale.
        exp.military = Math.max(0.1, +(exp.military * 0.85).toFixed(2));
        exp.infrastructure = Math.max(0.1, +(exp.infrastructure * 0.75).toFixed(2));
        exp.education = Math.max(0.1, +(exp.education * 0.85).toFixed(2));
    }
    const debtRatio = game.realm.gdp > 0 ? (game.budget.sovereignDebt / game.realm.gdp) : 0.05;
    // Bond rates follow inflation, then add a risk premium for excessive debt.
    const inflationRate = Math.max(0, (game.realm.inflation || 0) / 100);
    const riskPremium = Math.max(0, debtRatio - 0.5) * 0.08;
    const effectiveInterestRate = Math.min(0.35, inflationRate + 0.02 + riskPremium);
    game.budget.effectiveInterestRate = effectiveInterestRate;
    
    exp.debtServicing = +(game.budget.sovereignDebt * effectiveInterestRate / 12).toFixed(2);
    exp.total = +(exp.military + exp.healthcare + exp.infrastructure + exp.education + exp.administration + exp.debtServicing).toFixed(2);

    // 6. Surveillance & Faction Costs
    totalSurveillanceUpkeep = 0;
    game.factions.forEach(f => {
        if (f.underSurveillance) totalSurveillanceUpkeep += game.config.surveillanceMonthlyCost;
    });

    // 7. Monthly Treasury Balance Net Change
    const monthlyNetBalance = rev.total - (exp.total + totalSurveillanceUpkeep);
    const projectedTreasury = game.realm.treasury + monthlyNetBalance;
    if (projectedTreasury < 0) {
        game.realm.bankrupt = true;
        game.realm.unpaidBills = +(Math.abs(projectedTreasury) + (game.realm.unpaidBills || 0)).toFixed(2);
        game.realm.treasury = 0;
        game.realm.stability = Math.max(0, game.realm.stability - 3);
        game.realm.approval = Math.max(0, game.realm.approval - 2);
        log(`SOVEREIGN INSOLVENCY: $${game.realm.unpaidBills.toFixed(2)}B in unpaid obligations. Emergency austerity is active.`);
    } else {
        game.realm.treasury = +Math.min(999.0, projectedTreasury).toFixed(2);
        if (game.realm.bankrupt && game.realm.treasury >= 1.0) {
            game.realm.bankrupt = false;
            game.realm.unpaidBills = Math.max(0, (game.realm.unpaidBills || 0) - 1.0);
            log("SOVEREIGN FINANCES STABILIZED: Emergency austerity measures are easing.");
        }
    }

    // Bankruptcy Warning Check
    if (game.realm.bankrupt && !game.usedEvents.has("treasury_deficit_warning")) {
        game.realm.stability = Math.max(0, game.realm.stability - 15);
        log("⚠️ SOVEREIGN TREASURY DEFICIT! Sovereign reserves depleted below $0B.");
        game.aiDirector.eventQueue.push({
            id: "treasury_deficit_warning",
            title: "SOVEREIGN TREASURY BANKRUPTCY WARNING",
            desc: "State reserves have fallen into deficit (< $0B). Sovereign credit rating has been downgraded. Issue sovereign bonds or cut public spending immediately!",
            choices: [
                { text: "📜 Emergency Issue $5B Sovereign Bonds", act: () => { issueSovereignBonds(5.0); } },
                { text: "📈 Enforce Emergency Tax Levies (+Tax Rate, -10 Approval)", act: () => { adjustTax(1); } }
            ]
        });
        game.usedEvents.add("treasury_deficit_warning");
    }

    // 8. Bounded Macro GDP Growth Mechanics (Capped at -1.0% to +0.8% monthly)
    const infraGrowthBonus = Math.min(0.003, (avgInfra - 50) * 0.0001);
    const corpGrowthBonus = Math.min(0.003, (totalCorpValuation - 75) * 0.00002);
    const taxBurdenPenalty = (game.realm.taxRate - 1.0) * 0.002;
    
    const rawGdpGrowthRate = (0.002 + infraGrowthBonus + corpGrowthBonus - taxBurdenPenalty);
    const monthlyGdpGrowthRate = Math.max(-0.01, Math.min(0.008, rawGdpGrowthRate));
    
    const gdpDelta = game.realm.gdp * monthlyGdpGrowthRate;
    game.realm.gdp = Math.max(20.0, Math.min(500.0, +(game.realm.gdp + gdpDelta).toFixed(2)));

    // 9. Inflation & Unemployment Physics
    const stateSpendingPressure = (exp.infrastructure + exp.healthcare) * 0.03;
    if (stateSpendingPressure > 0.12 || game.economyPolicies?.devalued) {
        game.realm.inflation = Math.min(25.0, +(game.realm.inflation + 0.1).toFixed(1));
    } else {
        game.realm.inflation = Math.max(1.5, +(game.realm.inflation - 0.05).toFixed(1));
    }

    if (gdpDelta > 0.1 || exp.infrastructure > 1.5) {
        game.realm.unemployment = Math.max(2.5, +(game.realm.unemployment - 0.08).toFixed(1));
    } else {
        game.realm.unemployment = Math.min(18.0, +(game.realm.unemployment + 0.05).toFixed(1));
    }

    // 10. Currency Exchange Engine
    if (debtRatio > 0.5 || game.realm.bankrupt || game.realm.inflation > 8.0) {
        game.currency.usdExchange = Math.max(0.08, +(game.currency.usdExchange * 0.995).toFixed(3));
        game.currency.trend = "-0.5%";
        game.currency.confidence = "Weaken Foreign Reserve Backing";
    } else {
        game.currency.usdExchange = Math.min(0.60, +(game.currency.usdExchange * 1.002).toFixed(3));
        game.currency.trend = "+0.2%";
        game.currency.confidence = "Strong Sovereign Fiscal Solvency";
    }

    // 11. Corporate Stock Drift (Capped monthly growth -0.5% to +0.8%)
    game.corporations.forEach(corp => {
        const ceo = game.characters.find(c => c.id === corp.ceoId);
        const ceoFactor = ceo ? (ceo.opinion - 50) * 0.0001 : 0;
        const valGrowth = Math.max(-0.005, Math.min(0.008, (monthlyGdpGrowthRate * 0.5) + ceoFactor));
        const valuationFloor = corp.stateOwned ? 0.5 : 3.0;
        corp.valuation = Math.max(valuationFloor, Math.min(300.0, +(corp.valuation * (1 + valGrowth)).toFixed(1)));
    });

    // 12. Commodity Market Fluctuations
    game.commodities.forEach(c => {
        const deltaPercent = (Math.random() * 3.0 - 1.4);
        c.price = Math.max(1.0, Math.min(5000.0, +(c.price * (1 + deltaPercent / 100)).toFixed(2)));
        c.trend = `${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`;
    });

    // 13. Infrastructure & Black Projects Progress
    game.projects.forEach(p => {
        if (p.active && p.progress < 100) {
            p.progress += 20;
            if (p.progress >= 100) {
                p.active = false;
                if (typeof p.reward === 'function') p.reward();
                log(`MEGA-PROJECT COMPLETED: ${p.name.toUpperCase()}.`);
                game.monthActions.push({
                    headline: `NATIONAL WORKS: ${p.name.toUpperCase()} COMMISSIONED`,
                    lead: `The throne celebrated the formal completion of ${p.name}.`
                });
            }
        }
    });

    game.blackProjects.forEach(bp => {
        if (bp.active && bp.progress < 100) {
            bp.progress += 25;
            if (bp.progress >= 100) {
                bp.active = false;
                if (typeof bp.reward === 'function') bp.reward();
                log(`BLACK PROJECT ACHIEVED: ${bp.name.toUpperCase()} ONLINE.`);
            }
        }
    });
}

// 4. DEMOGRAPHICS & ELECTIONS
function simulateDemographicsAndElections() {
    game.sanitizeState();

    let weightedApprovalSum = 0;
    let totalWeight = 0;

    game.demographics.forEach(d => {
        if (game.realm.inflation > 6) d.approval = Math.max(5, d.approval - 0.4);
        if (game.realm.unemployment > 8) d.approval = Math.max(5, d.approval - 0.5);
        if (game.realm.stability > 70) d.approval = Math.min(95, d.approval + 0.3);

        weightedApprovalSum += (d.approval * d.weight);
        totalWeight += d.weight;
    });

    if (totalWeight > 0) {
        const netPollApproval = Math.round(weightedApprovalSum / totalWeight);
        const eventModifier = game.realm.approvalEventModifier || 0;
        game.realm.approval = Math.max(5, Math.min(98, netPollApproval + eventModifier));
        game.realm.approvalEventModifier *= 0.85;
        if (Math.abs(game.realm.approvalEventModifier) < 0.1) {
            game.realm.approvalEventModifier = 0;
        }
    }

    const miseryIndex = game.realm.inflation + game.realm.unemployment;
    if (miseryIndex > 14 || game.realm.approval < 30) {
        game.regime.revolutionaryPressure = Math.min(100, game.regime.revolutionaryPressure + 0.8);
    } else {
        game.regime.revolutionaryPressure = Math.max(0, game.regime.revolutionaryPressure - 0.4);
    }

    if (game.date.getFullYear() >= game.politics.nextElectionYear && game.date.getMonth() === 9) {
        triggerGeneralElectionEvent();
    }

    game.sanitizeState();
}

// 5. MILITARY & GENERALS
function simulateMilitaryAndGenerals() {
    const militaryFaction = game.factions.find(f => f.id === 2);
    if (!militaryFaction) return;

    const militaryLoyalty = militaryFaction.loyalty;
    game.military.coupRisk = Math.max(0, Math.min(100, 8 + (88 - militaryLoyalty) * 0.9));
    game.military.officerConspiracy = Math.min(100, 38 + (88 - militaryLoyalty) * 0.4);

    if (militaryLoyalty < 40 && game.dynasty.successionSecurity < 50 && Math.random() < 0.2) {
        triggerCoupEvent();
    }
}

// 6. DIPLOMACY & FOREIGN POWERS
function simulateDiplomacyAndForeignPowers() {
    game.diplomacy.powers.forEach(p => {
        if (!p) return;

        if (p.war) {
            p.relations = Math.max(-100, p.relations - 1.4);
            p.borderTension = Math.min(100, (p.borderTension || 0) + 1.6);
            p.trade = Math.max(0, (p.trade || 0) - 0.8);
            game.realm.gdp = Math.max(20, +(game.realm.gdp * 0.995).toFixed(2));
            game.realm.inflation = Math.min(25, +(game.realm.inflation + 0.2).toFixed(1));
            game.realm.stability = Math.max(0, game.realm.stability - 0.5);
            game.military.warExhaustion = Math.min(100, (game.military.warExhaustion || 0) + 1.2);
            return;
        }

        if (p.embargo) {
            p.relations = Math.max(-100, p.relations - 0.8);
            p.trade = Math.max(0, (p.trade || 0) - 0.5);
            p.borderTension = Math.min(100, (p.borderTension || 0) + 0.7);
        }

        if (p.boycotted) {
            p.trade = Math.max(0, (p.trade || 0) - 0.4);
            p.relations = Math.max(-100, p.relations - 0.6);
        }

        if (p.economicAgreement) {
            p.trade = Math.min(15, (p.trade || 0) + 0.25);
            p.relations = Math.min(100, p.relations + 0.35);
        }

        if (game.realm.prestige > 1200) p.relations = Math.min(100, p.relations + 0.2);

        p.borderTension = Math.max(0, Math.min(100, (p.borderTension || 0) - 0.15));
    });
}

// 7. NARRATIVE AI DIRECTOR
function simulateIntelligenceCases() {
    if (!game.intelligenceSystem) return;
    if (!game.intelligenceSystem.rumors) game.intelligenceSystem.rumors = [];
    if (!game.intelligenceSystem.cases) game.intelligenceSystem.cases = [];

    // Calculate dynamic intelligence case generation chance based on fervor, approval, and faction hostility
    const fervor = game.revolution?.fervor || 0;
    const approval = game.realm?.approval || 50;
    const baseChance = 0.05 + (fervor / 200) + ((100 - approval) / 300);

    if (Math.random() < baseChance && game.intelligenceSystem.rumors.length < 5) {
        // Pick dynamic target character with secrets or high ambition
        const potentialTargets = game.characters.filter(c => c.status === 'Active' && c.id !== getHeadId());
        if (potentialTargets.length > 0) {
            const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            const rumorTemplates = [
                `Held off-the-record meetings with regional garrison commandants.`,
                `Diverted southern tariff revenue into offshore accounts.`,
                `Held secret midnight consultations with opposition party whips.`,
                `Reported to be in private correspondence with foreign ambassadors.`,
                `Financed illegal student political committees in the capital.`
            ];
            const chosenText = `${target.name} ${rumorTemplates[Math.floor(Math.random() * rumorTemplates.length)]}`;
            
            // Check if rumor already exists
            const exists = game.intelligenceSystem.rumors.some(r => r.sourceId === target.id);
            if (!exists) {
                const newRumor = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    text: chosenText,
                    sourceId: target.id,
                    confidence: Math.floor(50 + Math.random() * 40),
                    verified: false,
                    risk: Math.random() > 0.5 ? "High" : "Medium",
                    createdAt: new Date(game.date)
                };
                game.intelligenceSystem.rumors.push(newRumor);
                if (typeof log === 'function') log(`🕵️ Counterintelligence flagged a new court rumor regarding ${target.name}.`);
            }
        }
    }

    // Auto-autosave check every 6 months
    if (game.totalMonthsPassed && game.totalMonthsPassed % 6 === 0) {
        if (typeof saveGameToAutosave === 'function') saveGameToAutosave();
    }
}

function runNarrativeAIDirector() {
    const ai = game.aiDirector;

    if (game.budget.sovereignDebt > 12.0 && !game.usedEvents.has("debt_crisis")) {
        ai.tensions.deficit = "Critical";
        ai.eventQueue.push({
            id: "debt_crisis",
            title: "SOVEREIGN DEBT CRISIS",
            desc: "Foreign bondholders and credit agencies have downgraded Vancurian sovereign debt. Interest rates have spiked.",
            choices: [
                { text: "Enforce austerity package (-15 Approval, -$2.0B Debt)", act: () => { game.budget.sovereignDebt -= 2.0; game.realm.approval -= 15; log("Enforced sovereign austerity package."); } },
                { text: "Seek emergency IMF restructuring loan (+10 Inflation, -$3.0B Debt)", act: () => { game.budget.sovereignDebt -= 3.0; game.realm.inflation += 4.0; log("Accepted IMF restructuring loan."); } }
            ]
        });
        game.usedEvents.add("debt_crisis");
    }

    const rebelliousProv = game.provinces.find(p => p.separatism > 55);
    if (rebelliousProv && !game.usedEvents.has(`revolt_${rebelliousProv.id}`)) {
        ai.tensions.separatism = "High";
        const gov = game.characters.find(c => c.id === rebelliousProv.governorId);
        ai.eventQueue.push({
            id: `revolt_${rebelliousProv.id}`,
            title: `PROVINCIAL DEFIANCE IN ${rebelliousProv.name.toUpperCase()}`,
            desc: `Governor ${gov ? gov.name : 'Emissary'} has formally refused to remit provincial tax revenues to the Citadel Treasury!`,
            choices: [
                { text: `Deploy Gendarmerie to arrest Governor ${gov ? gov.name : ''} (+20 Unrest, Restore Tax)`, act: () => { rebelliousProv.unrest += 20; rebelliousProv.separatism -= 15; log(`Deployed gendarmes to quell tax revolt in ${rebelliousProv.name}.`); } },
                { text: "Grant regional tax retention rights (-$0.3B Monthly Revenue, +15 Loyalty)", act: () => { rebelliousProv.separatism -= 25; rebelliousProv.loyalty += 15; log(`Granted regional tax concessions to ${rebelliousProv.name}.`); } }
            ]
        });
        game.usedEvents.add(`revolt_${rebelliousProv.id}`);
    }
}

function triggerGeneralElectionEvent() {
    game.politics.nextElectionYear = game.date.getFullYear() + 4;
    log("NATIONAL GENERAL ELECTION CONCLUDED ACROSS ALL PROVINCES!");

    const rcp = game.parties.find(p => p.id === 'rcp');
    const rc = game.parties.find(p => p.id === 'rc');

    if (game.realm.approval > 50) {
        if (rcp) rcp.seats = 42;
        if (rc) rc.seats = 18;
    } else {
        if (rcp) rcp.seats = 22;
        if (rc) rc.seats = 36;
    }

    triggerEventModal({
        title: `GENERAL ELECTION — ${game.date.getFullYear()}`,
        desc: `Voters across all 8 provinces have cast their ballots. ${game.realm.approval > 50 ? 'The Royal Conservative Coalition retained parliamentary majority.' : 'The Reformist Opposition gained significant parliamentary seats.'}`,
        choices: [
            { text: "Accept Parliamentary Certified Election Results", act: () => { game.adjustMetric(game.realm, 'legitimacy', 10, 0, 100); updateUI(); } }
        ]
    });
}

function triggerCoupEvent() {
    log("CRITICAL CRISIS: High Command has issued an ultimatum to House Vance!");
    game.realm.stability = Math.max(0, game.realm.stability - 30);
    triggerEventModal({
        title: "MILITARY COUP IN PROGRESS",
        desc: "Generals have seized key broadcasting towers. Purge the High Command or negotiate terms immediately.",
        choices: [
            { text: "Purge the High Command (-20 Readiness, +30 Stability)", act: () => { game.military.readiness = Math.max(10, game.military.readiness - 20); game.realm.stability += 30; log("You purged the High Command. Order restored."); } },
            { text: "Concede defense budget & cabinet posts (+15 Loyalty, -$0.8B)", act: () => { game.factions.find(f=>f.id===2).loyalty += 15; game.realm.treasury -= 0.8; log("You granted military concessions."); } }
        ]
    });
}

function publishWorldInformationEcosystem() {
    publishNewspaper();
}
