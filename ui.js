// ui.js – Dynamic View Renderers for 9 Navigation Systems & Generational Visual Tree

let currentMediaOutlet = 'state';

function setSafeText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function switchMediaOutlet(outlet) {
    currentMediaOutlet = outlet;
    document.querySelectorAll('.media-tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-press-${outlet}`);
    if (activeBtn) activeBtn.classList.add('active');
    publishNewspaper();
}

function updateUI() {
    if (typeof game.sanitizeState === 'function') game.sanitizeState();

    // Sanitize any non-finite numeric state
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

    const ruler = (typeof getRulerCharacter === 'function' ? getRulerCharacter() : game.characters.find(x => x.isPlayer && (x.status === "Active" || x.status === "Alive"))) || game.characters.find(c => c.status === "Active" || c.status === "Alive");
    if (ruler) setSafeText('ruler-title-name', `${ruler.role && ruler.role.includes("Grand Duke") ? "" : "Grand Duke "}${ruler.name}`);
    setSafeText('dynasty-name', `${game.dynasty?.name || 'House Vance'} of ${game.realm?.name || 'Vancuria'} • ${game.realm?.government || 'Constitutional Monarchy'} • ${game.realm?.difficulty || 'Normal'}`);

    setSafeText('stat-treasury', `$${(game.realm?.treasury ?? 10).toFixed(2)}B`);
    setSafeText('stat-gdp', `$${(game.realm?.gdp ?? 80).toFixed(1)}B`);
    setSafeText('stat-debt', `$${(game.budget?.sovereignDebt ?? 5).toFixed(1)}B`);
    setSafeText('stat-currency', `1 KR = $${(game.currency?.usdExchange ?? 0.25).toFixed(2)}`);
    setSafeText('stat-legitimacy', `${game.realm?.legitimacy ?? 0}%`);
    setSafeText('stat-stability', `${(game.realm?.stability ?? 0).toFixed(0)}%`);
    setSafeText('stat-approval', `${game.realm?.approval ?? 0}%`);
    setSafeText('stat-coup', `${(game.military?.coupRisk ?? 8).toFixed(0)}%`);
    setSafeText('stat-prestige', `${game.realm?.prestige ?? 0}`);
    setSafeText('stat-stress', `${game.realm?.stress ?? 0}/100`);

    setSafeText('dash-parliament', `${game.politics?.parliamentSupport ?? 54}%`);
    setSafeText('dash-opp', `${game.politics?.opposition ?? 31}%`);
    setSafeText('dash-econ', `${(game.realm?.inflation ?? 3.4).toFixed(1)}% / ${(game.realm?.unemployment ?? 6.8).toFixed(1)}%`);
    setSafeText('dash-regime', `${game.constitution?.headOfState ?? 'Monarchic'}`);
    setSafeText('dash-legitimacy', `${game.realm?.legitimacy ?? 72}%`);
    setSafeText('dash-security', `${game.dynasty?.successionSecurity ?? 83}%`);
    setSafeText('dash-rev', `${(game.regime?.revolutionaryPressure ?? 14).toFixed(0)}%`);
    setSafeText('dash-judiciary', `${game.constitution?.judiciaryIndependence ?? 'Medium'}`);

    renderCourt();
    renderBudgetLedger();
    renderCorporations();
    renderConstitutionEditor();
    renderMilitaryBranches();
    renderDiplomacyPowers();
    renderProjects();
    renderBlackProjects();
    renderPartiesAndParliament();
    renderDemographicsAndPolls();
    renderFactions();
    renderCommodities();
    renderDynastyView();
    renderCompetingHouses();
    renderMarriageProposals();
    renderDynastyTreeVisualizer();
    renderGenerationalTimeline();
    renderIntelligenceDashboard();
    renderLegacyHistory();
    renderRevolutionDashboard();
    publishNewspaper();
}

function renderCourt() {
    const list = document.getElementById('court-list');
    if (!list) return;
    list.innerHTML = "";
    const filtered = game.characters.filter(c => c.type === game.currentTab && c.status !== "Deceased");

    filtered.forEach(c => {
        let color = c.opinion >= 60 ? 'var(--success)' : (c.opinion <= 35 ? 'var(--danger)' : 'var(--accent-gold)');
        let statusBadge = c.status === "Imprisoned" ? "<span style='color:var(--danger);font-size:0.7rem'>[PRISON]</span>" : "";
        const lifeStage = game.getLifeStage(c.age);

        list.innerHTML += `
            <div class="char-card" onclick="openCharModal(${c.id})">
                <div class="char-header">
                    <span class="char-name">${c.name} (${c.age}) ${statusBadge}</span>
                    <span class="char-opinion" style="color:${color}">${c.isPlayer ? 'YOU' : c.opinion + ' Op.'}</span>
                </div>
                <div class="char-role">${c.role} • <small style="color:var(--accent-gold);">${lifeStage}</small> • ${c.gender || 'Unknown'} ${c.married ? '• 💍' : ''}</div>
                <div class="char-metrics">
                    <span>Mil: ${c.militarySupport}%</span>
                    <span>Nobles: ${c.aristocraticSupport}%</span>
                    <span>Claim: ${c.claimStrength}%</span>
                </div>
                <div style="display:flex; gap:4px; margin-top:5px; flex-wrap:wrap;">
                    ${(c.traits || []).map(t => `<span class="trait-tag">${t}</span>`).join('')}
                </div>
            </div>
        `;
    });
}

function renderBudgetLedger() {
    const container = document.getElementById('budget-ledger-container');
    if (!container) return;
    const rev = game.budget.revenue;
    const exp = game.budget.expenditure;
    const net = rev.total - exp.total;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; font-size:0.82rem; margin-bottom:12px; background:#0b1120; padding:10px; border-radius:6px; border:1px solid #1e293b;">
            <div><span style="color:var(--text-muted)">REVENUES</span>: <strong style="color:var(--success)">+$${rev.total.toFixed(2)}B/mo</strong></div>
            <div><span style="color:var(--text-muted)">EXPENDITURES</span>: <strong style="color:var(--danger)">-$${exp.total.toFixed(2)}B/mo</strong></div>
            <div><span style="color:var(--text-muted)">NET MONTHLY</span>: <strong style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">${net >= 0 ? '+' : ''}$${net.toFixed(2)}B/mo</strong></div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:0.75rem; margin-bottom:12px;">
            <div style="background:#070a12; padding:8px; border-radius:4px;">
                <h5 style="color:var(--success); margin-bottom:4px;">Itemized Monthly Revenues</h5>
                <div>• Corporate Tax Yield: <strong>$${rev.corporateTax.toFixed(2)}B</strong></div>
                <div>• Energy State Exports: <strong>$${rev.energyExports.toFixed(2)}B</strong></div>
                <div>• Customs & Ports Tariffs: <strong>$${rev.customsTariffs.toFixed(2)}B</strong></div>
            </div>
            <div style="background:#070a12; padding:8px; border-radius:4px;">
                <h5 style="color:var(--danger); margin-bottom:4px;">Itemized Monthly Expenditures</h5>
                <div>• Military Budget: <strong>$${exp.military.toFixed(2)}B</strong> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('military', 0.1)">+</button> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('military', -0.1)">-</button></div>
                <div>• Healthcare & Welfare: <strong>$${exp.healthcare.toFixed(2)}B</strong> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('healthcare', 0.1)">+</button> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('healthcare', -0.1)">-</button></div>
                <div>• Infrastructure Works: <strong>$${exp.infrastructure.toFixed(2)}B</strong> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('infrastructure', 0.1)">+</button> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('infrastructure', -0.1)">-</button></div>
                <div>• Education & R&D: <strong>$${exp.education.toFixed(2)}B</strong> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('education', 0.1)">+</button> <button class="action-btn" style="padding:1px 4px; font-size:0.65rem;" onclick="adjustBudgetSector('education', -0.1)">-</button></div>
            <div>• Debt Servicing (Interest): <strong>$${exp.debtServicing.toFixed(2)}B</strong> <small>(${((game.budget.effectiveInterestRate || game.config.bondInterestRate) * 100).toFixed(1)}% annual)</small></div>
            </div>
        </div>
    `;
}

function renderCorporations() {
    const grid = document.getElementById('corporations-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.corporations.forEach(c => {
        const ceo = game.characters.find(ch => ch.id === c.ceoId);
        grid.innerHTML += `
            <div class="dash-card">
                <h4 style="color:var(--accent-gold); margin-bottom:2px;">${c.name.toUpperCase()}</h4>
                <p style="font-size:0.72rem; color:var(--text-muted);">Sector: ${c.sector} • CEO: <strong>${ceo ? ceo.name : 'Unknown'}</strong></p>
                <div style="font-size:0.78rem; margin:4px 0;">Valuation: <strong style="color:white">$${c.valuation}B</strong></div>
                <div style="font-size:0.72rem; color:var(--accent-blue); margin-bottom:8px;">Lobbying Influence: <strong>${c.influence}%</strong></div>
                <div style="display:flex; gap:6px;">
                    <button class="action-btn" style="flex:1; font-size:0.7rem; text-align:center;" onclick="investInCorporation('${c.id}')">📈 Invest $0.5B</button>
                    <button class="action-btn primary" style="flex:1; font-size:0.7rem; text-align:center; border-color:var(--danger);" onclick="nationalizeCorporation('${c.id}')">⚡ Nationalize</button>
                </div>
            </div>
        `;
    });
}

function renderConstitutionEditor() {
    const container = document.getElementById('constitution-editor-container');
    if (!container) return;
    const consti = game.constitution;
    container.innerHTML = `
        <div class="dash-card">
            <h4 style="color:white;">Head of State Power</h4>
            <p style="font-size:0.75rem; color:var(--accent-gold); margin:4px 0;">Current: ${consti.headOfState}</p>
            <small>Choose between executive control, compromise, or parliamentary legitimacy.</small>
            <button class="action-btn" onclick="amendConstitution('headOfState', 'Monarchic Supreme Executive')">Crown Executive (+stability, +control)</button>
            <button class="action-btn" onclick="amendConstitution('headOfState', 'Constitutional Crown')">Constitutional Crown (+approval, +parliament)</button>
            <button class="action-btn" onclick="amendConstitution('headOfState', 'Ceremonial Monarch')">Ceremonial Monarch (+legitimacy, -control)</button>
        </div>
        <div class="dash-card">
            <h4 style="color:white;">Judicial Independence</h4>
            <p style="font-size:0.75rem; color:var(--accent-gold); margin:4px 0;">Current: ${consti.judiciaryIndependence}</p>
            <small>Courts can serve the Crown, balance power, or become fully independent.</small>
            <button class="action-btn" onclick="amendConstitution('judiciaryIndependence', 'Royal Courts')">Royal Courts (+stability, +control)</button>
            <button class="action-btn" onclick="amendConstitution('judiciaryIndependence', 'Medium Independent Bench')">Balanced Courts (+legitimacy)</button>
            <button class="action-btn" onclick="amendConstitution('judiciaryIndependence', 'Independent Supreme Bench')">Empower Judiciary (+legitimacy, -control)</button>
        </div>
        <div class="dash-card">
            <h4 style="color:white;">Emergency Powers Status</h4>
            <p style="font-size:0.75rem; color:${consti.emergencyActive ? 'var(--danger)' : 'var(--success)'}; margin:4px 0;">State: ${consti.emergencyActive ? 'ACTIVE DECREE' : 'Standard Law'}</p>
            <small>${consti.emergencyActive ? 'Immediate stability, but rising opposition and authoritarianism.' : 'Normal law: no emergency stability bonus or political backlash.'}</small>
            <button class="action-btn primary" onclick="toggleEmergencyPowers()">${consti.emergencyActive ? 'Revoke Emergency' : 'Declare Emergency'}</button>
        </div>
    `;
}

function renderMilitaryBranches() {
    const grid = document.getElementById('military-branches-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.military.branches.forEach(b => {
        const cmd = game.characters.find(c => c.id === b.commanderId);
        grid.innerHTML += `
            <div class="dash-card">
                <h4 style="color:white; margin-bottom:2px;">${b.name.toUpperCase()}</h4>
                <p style="font-size:0.72rem; color:var(--accent-blue); margin-bottom:4px;">Commander: <strong>${cmd ? cmd.name : 'Unassigned'}</strong></p>
                <div style="font-size:0.75rem;">Force Readiness: <strong style="color:var(--success);">${b.readiness}%</strong></div>
                <div class="progress-bar"><div class="progress-fill" style="width:${b.readiness}%"></div></div>
            </div>
        `;
    });
}

function renderDiplomacyPowers() {
    const grid = document.getElementById('foreign-powers-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.diplomacy.powers.forEach(p => {
        let color = p.relations >= 50 ? 'var(--success)' : (p.relations <= 0 ? 'var(--danger)' : 'var(--accent-gold)');
        const status = p.war ? 'WAR' : (p.embargo ? 'SANCTIONS' : (p.boycotted ? 'BOYCOTT' : (p.economicAgreement ? 'TRADE PACT' : 'NORMAL')));
        const statusColor = p.war ? 'var(--danger)' : (p.embargo ? 'var(--warning)' : 'var(--success)');
        grid.innerHTML += `
            <div class="dash-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <h4 style="color:white;">${p.name}</h4>
                    <span style="color:${color}; font-weight:bold; font-size:0.8rem;">Rel: ${p.relations}</span>
                </div>
                <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:4px;">Leader: ${p.leader} • Stance: ${p.stance}</p>
                <p style="font-size:0.75rem; color:var(--accent-blue); margin-bottom:4px;">Bilateral Trade: <strong>$${p.trade}B/yr</strong></p>
                <p style="font-size:0.68rem; color:${statusColor}; margin-bottom:8px;">Status: <strong>${status}</strong> • Tension ${p.borderTension || 0}%</p>
                <div style="display:grid; gap:6px;">
                    <button class="action-btn" style="width:100%; text-align:center;" onclick="negotiateTreaty('${p.id}')">🤝 Embassy</button>
                    <button class="action-btn" style="width:100%; text-align:center;" onclick="signEconomicAgreement('${p.id}')">💼 Economic Pact</button>
                    <button class="action-btn" style="width:100%; text-align:center;" onclick="imposeSanctions('${p.id}')">🛑 ${p.embargo ? 'Lift Sanctions' : 'Sanctions'}</button>
                    <button class="action-btn" style="width:100%; text-align:center;" onclick="imposeBoycott('${p.id}')">🚫 ${p.boycotted ? 'Lift Boycott' : 'Boycott'}</button>
                    <button class="action-btn primary" style="width:100%; text-align:center;" onclick="${p.war ? `offerCeasefire('${p.id}')` : `declareWarOnPower('${p.id}')`}">${p.war ? '🕊️ Ceasefire' : '⚔️ Declare War'}</button>
                </div>
            </div>
        `;
    });
}

function renderCompetingHouses() {
    const grid = document.getElementById('competing-houses-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.houses.forEach(h => {
        const head = game.characters.find(c => c.id === h.headId);
        grid.innerHTML += `
            <div class="dash-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <h4 style="color:var(--accent-gold);">${h.name.toUpperCase()}</h4>
                    <span style="font-size:0.7rem; color:var(--text-muted);">${h.type}</span>
                </div>
                <p style="font-size:0.75rem; color:var(--text-muted);">Head: <strong>${head ? head.name : 'Unassigned'}</strong></p>
                <div style="font-size:0.75rem; display:flex; justify-content:space-between; margin-top:4px;">
                    <span>Wealth: <strong>$${h.wealth}B</strong></span>
                    <span>Prestige: <strong>${h.prestige}</strong></span>
                </div>
                <div style="font-size:0.72rem; color:${h.loyaltyToCrown > 60 ? 'var(--success)' : 'var(--warning)'}; margin-top:2px;">Loyalty to Crown: ${h.loyaltyToCrown}%</div>
            </div>
        `;
    });
}

function renderMarriageProposals() {
    const container = document.getElementById('marriage-proposals-container');
    if (!container) return;

    if (game.marriageProposals.length === 0) {
        container.innerHTML = `<div class="dash-card"><span style="color:var(--text-muted)">No active marriage proposals. Eligible unmarried family members will attract match offers over time.</span></div>`;
    } else {
        container.innerHTML = game.marriageProposals.map(p => `
            <div class="dash-card" style="border-color:var(--accent-gold);">
                <h4 style="color:var(--accent-gold); margin-bottom:4px;">PROPOSAL FROM ${p.houseName.toUpperCase()}</h4>
                <p style="font-size:0.78rem; color:var(--text-main); margin-bottom:6px;">Match offer of <strong>${p.candidateName}</strong> for <strong>${p.vanceCharName}</strong>.</p>
                <div style="font-size:0.72rem; display:flex; justify-content:space-between; margin-bottom:8px;">
                    <span>Pol. Value: <strong style="color:var(--success)">+${p.politicalValue}</strong></span>
                    <span>Wealth Gain: <strong style="color:var(--accent-gold)">+$${p.wealthGain}B</strong></span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="action-btn primary" style="flex:1; text-align:center;" onclick="acceptMarriageProposal(${p.id})">💍 Accept Match</button>
                    <button class="action-btn" style="flex:1; text-align:center;" onclick="rejectMarriageProposal(${p.id})">❌ Decline</button>
                </div>
            </div>
        `).join('');
    }
}

function renderDynastyTreeVisualizer() {
    const container = document.getElementById('dynasty-tree-visualizer');
    if (!container) return;

    const ruler = (typeof getRulerCharacter === 'function' ? getRulerCharacter() : game.characters.find(x => x.isPlayer && (x.status === "Active" || x.status === "Alive"))) || game.characters.find(c => c.status === "Active" || c.status === "Alive");
    if (!ruler) return;

    let treeHtml = `<div><strong>👑 ${ruler.name.toUpperCase()}</strong> (${ruler.role}, Age ${ruler.age}) • <span style="color:var(--accent-gold)">${game.getLifeStage(ruler.age)}</span></div>`;
    treeHtml += `<div>│</div>`;

    // Children & descendants
    const children = game.characters.filter(c => c.parentId === ruler.id || c.motherId === ruler.id);
    if (children.length === 0) {
        treeHtml += `<div>└── <span style="color:var(--text-muted)">(No direct heirs yet)</span></div>`;
    } else {
        children.forEach((ch, idx) => {
            const isLast = idx === children.length - 1;
            const prefix = isLast ? '└── ' : '├── ';
            const stage = game.getLifeStage(ch.age);
            treeHtml += `<div>${prefix}<strong>${ch.name}</strong> (Age ${ch.age}, ${stage}) ${ch.married ? '💍' : ''} — Claim: ${ch.claimStrength}%</div>`;
            
            // Grandchildren
            const grandChildren = game.characters.filter(gc => gc.parentId === ch.id || gc.motherId === ch.id);
            grandChildren.forEach(gc => {
                treeHtml += `<div>│   └── ${gc.name} (Age ${gc.age}, ${game.getLifeStage(gc.age)})</div>`;
            });
        });
    }

    container.innerHTML = treeHtml;
}

function renderGenerationalTimeline() {
    const container = document.getElementById('generational-timeline-container');
    if (!container) return;
    container.innerHTML = game.generationalTimeline.map(t => `
        <div><strong style="color:var(--accent-blue)">[${t.year}]</strong> ${t.text}</div>
    `).join('');
}

function selectProvince(id) {
    game.selectedProvinceId = id;
    if (typeof document !== 'undefined' && document.querySelectorAll) {
        document.querySelectorAll('.province-path').forEach(p => p && p.classList && p.classList.remove('selected'));
    }
    const activeSvg = typeof document !== 'undefined' && document.getElementById ? document.getElementById(`prov-${id}`) : null;
    if (activeSvg && activeSvg.classList) activeSvg.classList.add('selected');

    const p = game.provinces.find(x => x.id === id);
    if (!p) return;
    const details = document.getElementById('province-details');
    if (!details) return;

    const gov = game.characters.find(c => c.id === p.governorId);

    const investBtn = p.infra >= 100 ?
        `<button class="action-btn" disabled style="opacity:0.5;">🏗️ Max Infrastructure Reached</button>` :
        `<button class="action-btn" onclick="provinceAction(${p.id}, 'invest')">🏗️ Infrastructure Investment (-$0.3B, +Dev, -Unrest)</button>`;

    const garrisonBtn = p.hasGarrison ?
        `<button class="action-btn" disabled style="opacity:0.5;">🛡️ Security Forces Active</button>` :
        `<button class="action-btn" onclick="provinceAction(${p.id}, 'garrison')">🛡️ Deploy Gendarmerie Watch (-Unrest, -Loyalty)</button>`;

    const taxBtn = p.actionTakenThisMonth ?
        `<button class="action-btn" disabled style="opacity:0.5;">💰 Decrees Executed This Month</button>` :
        `<button class="action-btn" onclick="provinceAction(${p.id}, 'tax')">💰 Levy Emergency Duties (+$0.2B, +Unrest)</button>`;

    details.innerHTML = `
        <div>
            <h3 style="color:var(--accent-gold); margin-bottom: 4px;">${p.name.toUpperCase()}</h3>
            <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom: 12px;">Governor: <strong>${gov ? gov.name : 'State Admin'}</strong> • Output: <strong>${p.resource}</strong></p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size:0.8rem; margin-bottom: 12px;">
                <div>Population: <strong>${p.population}M</strong></div>
                <div>Development: <strong>${p.dev}/100</strong></div>
                <div>Loyalty: <strong style="color:${p.loyalty > 50 ? 'var(--success)' : 'var(--danger)'}">${p.loyalty}%</strong></div>
                <div>Unrest: <strong style="color:${p.unrest > 30 ? 'var(--danger)' : 'var(--success)'}">${p.unrest}%</strong></div>
                <div>Separatism Risk: <strong style="color:${p.separatism > 30 ? 'var(--warning)' : 'var(--success)'}">${p.separatism}%</strong></div>
                <div>Security: <strong>${p.hasGarrison ? 'Garrisoned' : 'Standard'}</strong></div>
            </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
            <h4 style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Provincial Decrees</h4>
            ${investBtn}
            ${garrisonBtn}
            ${taxBtn}
        </div>
    `;
}

function provinceAction(id, act) {
    const p = game.provinces.find(x => x.id === id);
    if (!p) return;

    if (p.actionTakenThisMonth) {
        log(`Provincial administration in ${p.name} is executing decrees for this month.`);
        selectProvince(id);
        return;
    }

    if (act === 'garrison') {
        if (p.hasGarrison) return;
        p.hasGarrison = true;
        p.unrest = Math.max(0, p.unrest - 15);
        p.loyalty = Math.max(0, p.loyalty - 8);
        p.actionTakenThisMonth = true;
        log(`Stationed internal security forces across ${p.name}.`);
    } else if (act === 'invest') {
        if (p.infra >= 100 || game.realm.treasury < 0.3) return;
        game.realm.treasury -= 0.3;
        p.dev = Math.min(100, p.dev + 4);
        p.infra = Math.min(100, p.infra + 6);
        p.unrest = Math.max(0, p.unrest - 5);
        p.actionTakenThisMonth = true;
        log(`Funded regional infrastructure in ${p.name}.`);
    } else if (act === 'tax') {
        game.realm.treasury += 0.2;
        p.unrest = Math.min(100, p.unrest + 10);
        p.loyalty = Math.max(0, p.loyalty - 5);
        p.actionTakenThisMonth = true;
        log(`Levied emergency duties in ${p.name}.`);
    }

    selectProvince(id);
    updateUI();
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.projects.forEach(p => {
        let statusBtn = p.progress >= 100 ?
            `<button class="action-btn" style="width:100%; text-align:center;" disabled>✅ Works Completed</button>` :
            (p.active ?
                `<button class="action-btn" style="width:100%; text-align:center; border-color:var(--accent-gold);" disabled>⚙️ In Construction (${p.progress}%)</button>` :
                `<button class="action-btn" style="width:100%; text-align:center;" onclick="startProject(${p.id})">🏗️ Authorize ($${p.cost}B)</button>`);

        grid.innerHTML += `
            <div class="dash-card">
                <h4 style="color:var(--accent-gold); margin-bottom:4px;">${p.name}</h4>
                <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px;">${p.desc}</p>
                <div class="progress-bar"><div class="progress-fill" style="width:${p.progress}%"></div></div>
                ${statusBtn}
            </div>
        `;
    });
}

function renderBlackProjects() {
    const grid = document.getElementById('black-projects-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.blackProjects.forEach(bp => {
        let statusBtn = bp.progress >= 100 ?
            `<button class="action-btn" style="width:100%; text-align:center;" disabled>⚡ Operational</button>` :
            (bp.active ?
                `<button class="action-btn" style="width:100%; text-align:center; border-color:var(--danger);" disabled>🔬 Classified R&D (${bp.progress}%)</button>` :
                `<button class="action-btn primary" style="width:100%; text-align:center;" onclick="startBlackProject('${bp.id}')">☣️ Authorize ($${bp.cost}B)</button>`);

        grid.innerHTML += `
            <div class="dash-card" style="border-color: rgba(239, 68, 68, 0.3);">
                <h4 style="color:var(--danger); margin-bottom:4px;">${bp.name}</h4>
                <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px;">${bp.desc}</p>
                <div class="progress-bar"><div class="progress-fill" style="width:${bp.progress}%; background:var(--danger);"></div></div>
                ${statusBtn}
            </div>
        `;
    });
}

function renderPartiesAndParliament() {
    const bar = document.getElementById('parliament-seat-bar');
    if (bar) {
        const colors = { rcp: "#f59e0b", ndp: "#38bdf8", rc: "#10b981", wa: "#ec4899", rf: "#ef4444" };
        bar.innerHTML = game.parties.map(p => `
            <div class="seat-segment" style="width:${p.seats}%; background:${colors[p.id] || '#94a3b8'};" title="${p.name}: ${p.seats} seats">
                ${p.seats > 8 ? p.id.toUpperCase() + ' (' + p.seats + ')' : ''}
            </div>
        `).join('');
    }

    const grid = document.getElementById('parties-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.parties.forEach(p => {
        const leader = game.characters.find(c => c.id === p.leaderId);
        grid.innerHTML += `
            <div class="dash-card">
                <h4 style="color:white; margin-bottom:2px;">${p.name}</h4>
                <p style="font-size:0.72rem; color:var(--accent-blue); margin-bottom:6px;">Leader: ${leader ? leader.name : 'Unknown'} • Seats: <strong>${p.seats}%</strong></p>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">Ideology: ${p.ideology}</p>
                <div style="font-size:0.75rem;">Public Support: <strong style="color:var(--accent-gold);">${p.popularity}%</strong></div>
            </div>
        `;
    });
}

function renderDemographicsAndPolls() {
    const grid = document.getElementById('demographics-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.demographics.forEach(d => {
        let color = d.approval >= 60 ? 'var(--success)' : (d.approval <= 40 ? 'var(--danger)' : 'var(--accent-gold)');
        grid.innerHTML += `
            <div class="dash-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <h4 style="color:white;">${d.name}</h4>
                    <span style="color:${color}; font-weight:bold; font-size:0.82rem;">${d.approval}% Appr.</span>
                </div>
                <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:4px;">Pop: ${d.pop}M • Weight: ${d.weight}%</p>
                <p style="font-size:0.75rem; color:var(--accent-blue);"><strong>Primary Demand:</strong> ${d.demand}</p>
            </div>
        `;
    });
}

function renderFactions() {
    const grid = document.getElementById('factions-grid');
    if (!grid) return;
    grid.innerHTML = "";
    const setupCost = game.config?.surveillanceSetupCost ?? 0.5;
    const monthlyCost = game.config?.surveillanceMonthlyCost ?? 0.1;

    game.factions.forEach(f => {
        let color = f.loyalty >= 60 ? 'var(--success)' : (f.loyalty <= 35 ? 'var(--danger)' : 'var(--accent-gold)');
        const cooldown = game.factionCooldowns?.[f.id]?.concession;
        const isConcessionOnCooldown = cooldown && (game.totalMonthsPassed - cooldown) < game.config.concessionCooldownMonths;

        const surveillanceBtnText = f.underSurveillance 
            ? `Cancel Surveillance (-$${monthlyCost}B/mo)` 
            : `👁️ Surveillance ($${setupCost}B + $${monthlyCost}B/mo)`;

        grid.innerHTML += `
            <div class="dash-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <h4 style="color:white;">${f.name}</h4>
                    <span style="color:${color}; font-weight:bold; font-size:0.8rem;">Loyalty: ${f.loyalty}%</span>
                </div>
                <p style="font-size:0.72rem; color:var(--text-muted); margin-bottom:6px;">Influence: ${f.power}%</p>
                <p style="font-size:0.76rem; color:var(--accent-blue); margin-bottom:10px;"><strong>Demands:</strong> ${f.demands}</p>
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <button class="action-btn" onclick="mollifyFaction(${f.id})" ${isConcessionOnCooldown ? 'disabled' : ''}>
                        💰 Concession ($0.3B) ${isConcessionOnCooldown ? '(Cooldown)' : ''}
                    </button>
                    <button class="action-btn" onclick="toggleSurveillance(${f.id})">${surveillanceBtnText}</button>
                </div>
            </div>
        `;
    });
}

function renderCommodities() {
    const grid = document.getElementById('commodities-grid');
    if (!grid) return;
    grid.innerHTML = "";
    game.commodities.forEach(c => {
        const isPositive = c.trend.startsWith('+');
        grid.innerHTML += `
            <div class="dash-card">
                <small style="color:var(--text-muted); text-transform:uppercase;">${c.name}</small>
                <h3 style="color:white; margin:2px 0;">$${c.price} <small style="font-size:0.7rem; color:var(--text-muted);">/${c.unit}</small></h3>
                <div style="display:flex; justify-content:space-between; font-size:0.72rem; margin-top:4px;">
                    <span>Trend: <strong style="color:${isPositive ? 'var(--success)' : 'var(--danger)'}">${c.trend}</strong></span>
                    <span>Output: <strong>${c.playerOutput}</strong></span>
                </div>
            </div>
        `;
    });
}

function renderDynastyView() {
    const dyn = game.dynasty;
    if (!dyn) return;
    setSafeText('dyn-prestige', dyn.prestige ?? 1420);
    setSafeText('dyn-wealth', `$${dyn.wealth?.toFixed(1) ?? 8.7}B`);
    setSafeText('dyn-favor', `${dyn.publicFavor ?? 61}%`);
    setSafeText('dyn-influence', `${dyn.influence ?? 74}%`);
    setSafeText('dyn-security', `${dyn.successionSecurity ?? 83}%`);
}

function renderIntelligenceDashboard() {
    const wiretapsContainer = document.getElementById('wiretaps-container');
    if (wiretapsContainer) {
        if (game.intelligenceSystem.activeWiretaps.size === 0) {
            wiretapsContainer.innerHTML = `<span style="color:var(--text-muted)">No active electronic wiretaps deployed.</span>`;
        } else {
            let html = '<ul style="margin-left:18px;">';
            game.intelligenceSystem.activeWiretaps.forEach(targetId => {
                const target = game.characters.find(c => c.id === targetId);
                const hasDossier = game.intelligenceSystem.discoveredSecrets.has(targetId);
                html += `<li>Target: <strong>${target ? target.name : 'Unknown'}</strong> — ${hasDossier ? `<span style="color:var(--danger)">Dossier Unlocked: "${target.secret}"</span>` : 'Monitoring conversations...'}</li>`;
            });
            html += '</ul>';
            wiretapsContainer.innerHTML = html;
        }
    }

    const rumorsContainer = document.getElementById('rumors-container');
    if (rumorsContainer) {
        if (game.intelligenceSystem.rumors.length === 0) {
            rumorsContainer.innerHTML = `<div class="dash-card"><span style="color:var(--text-muted)">No court rumors flagged by counterintelligence.</span></div>`;
        } else {
            rumorsContainer.innerHTML = game.intelligenceSystem.rumors.map(r => `
                <div class="dash-card">
                    <h4 style="color:var(--warning); margin-bottom:4px;">RUMOR DOSSIER</h4>
                    <p style="font-size:0.78rem; color:var(--text-main); margin-bottom:6px;">"${r.text}"</p>
                    <div style="font-size:0.72rem; display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span>Confidence: <strong>${r.confidence}%</strong></span>
                        <span>Threat Level: <strong style="color:var(--danger)">${r.risk}</strong></span>
                    </div>
                    <button class="action-btn primary" style="width:100%; text-align:center;" onclick="investigateRumor(${r.id})">🔍 Investigate Rumor (-$0.2B)</button>
                </div>
            `).join('');
        }
    }
}

function renderLegacyHistory() {
    const container = document.getElementById('legacy-history-container');
    if (!container) return;
    if (game.legacy.length === 0) {
        container.innerHTML = `<div class="dash-card"><span style="color:var(--text-muted)">Your reign is currently active. Historical reign biographies will be generated upon ruler death. HISTORY JUDGES YOU.</span></div>`;
    } else {
        container.innerHTML = game.legacy.map(l => `
            <div class="dash-card" style="border-left: 3px solid var(--accent-gold);">
                <h4 style="color:var(--accent-gold); margin-bottom:2px;">${l.name.toUpperCase()} — ${l.title}</h4>
                <small style="color:var(--text-muted);">Reign Ended: ${l.reignEndYear} • State GDP: $${l.gdp.toFixed(1)}B • Historical Approval: ${l.approval}%</small>
                <p style="font-size:0.8rem; margin-top:6px; line-height:1.4;">${l.bio}</p>
            </div>
        `).join('');
    }
}

function publishNewspaper() {
    const dateEl = document.getElementById('news-date');
    const headlineEl = document.getElementById('news-headline');
    const leadEl = document.getElementById('news-lead');
    const sidesEl = document.getElementById('news-sides');
    const titleEl = document.getElementById('news-outlet-title');
    const biasTagEl = document.getElementById('news-bias-tag');
    const paperPanel = document.getElementById('newspaper-panel');

    if (!dateEl || !headlineEl || !leadEl || !sidesEl) return;

    const dateStr = game.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
    dateEl.innerText = `${dateStr} EDITION`;

    if (paperPanel) {
        paperPanel.className = 'newspaper-panel ' + (currentMediaOutlet === 'opposition' ? 'opposition' : (currentMediaOutlet === 'tabloid' ? 'tabloid' : ''));
    }

    if (currentMediaOutlet === 'state') {
        if (titleEl) titleEl.innerText = "The Crown Gazette";
        if (biasTagEl) biasTagEl.innerText = "OFFICIAL STATE DISPATCH • CAPITAL CITADEL";
    } else if (currentMediaOutlet === 'opposition') {
        if (titleEl) titleEl.innerText = "The Vanguard";
        if (biasTagEl) biasTagEl.innerText = "INDEPENDENT REFORMIST PRESS • POPULAR VOICE";
    } else {
        if (titleEl) titleEl.innerText = "Palace Whisper";
        if (biasTagEl) biasTagEl.innerText = "TABLOID DISPATCH • UNCONFIRMED RUMORS";
    }

    let headline = "", lead = "";
    if (game.monthActions && game.monthActions.length > 0) {
        const act = game.monthActions[game.monthActions.length - 1];
        headline = currentMediaOutlet === 'opposition' ? `QUESTIONS RAISED OVER: ${act.headline}` : act.headline;
        lead = act.lead;
    } else {
        if (currentMediaOutlet === 'state') {
            headline = "TREASURY ANNOUNCES QUARTERLY FISCAL BALANCING";
            lead = "Finance technocrats reported steady revenues amid fluctuating regional energy and commodity markets.";
        } else if (currentMediaOutlet === 'opposition') {
            headline = "SOVEREIGN DEBT REACHES $5B AS CITADEL SPENDS ON R&D";
            lead = "Opposition MPs questioned state expenditure priorities following another delay in provincial infrastructure funding.";
        } else {
            headline = "WHO IS REALLY RUNNING THE CITADEL CABINET?";
            lead = "Insiders claim secret tensions have erupted between the High Command and the Crown Prince behind closed doors.";
        }
    }

    headlineEl.innerText = headline;
    leadEl.innerText = lead;

    const sidePool = [
        { h: "Diplomatic Envoy Arrives", p: "Eastern trade emissaries dock at royal harbor for maritime talks." },
        { h: "Energy Pipeline Overhaul", p: "Technicians conclude quarterly servicing of the northern gas corridor." },
        { h: "Provincial Grain Forecast", p: "Southern agriculture cooperatives project a stable autumn yield." },
        { h: "Defense Exercise Held", p: "Rapid response brigades completed live-fire readiness maneuvers." }
    ];
    const shuffled = sidePool.sort(() => 0.5 - Math.random());
    sidesEl.innerHTML = `
        <div class="side-story"><h4>${shuffled[0].h}</h4><p>${shuffled[0].p}</p></div>
        <div class="side-story"><h4>${shuffled[1].h}</h4><p>${shuffled[1].p}</p></div>
    `;

    const socialFeedContainer = document.getElementById('social-feed-container');
    if (socialFeedContainer) {
        const posts = [
            { handle: "@citizen_482", text: "My monthly electricity bill doubled again.", tag: "#VancuriaNow" },
            { handle: "@royalist_91", text: "At least the regional maglev transit lines are actually running on schedule.", tag: "#VanceStrong" },
            { handle: "@reformist_voice", text: `Crown spending on digital surveillance reaches unprecedented highs.`, tag: "#PrivacyFirst" },
            { handle: "@trade_analyst", text: `Vancurian Krona trading at 1 KR = $${game.currency.usdExchange} USD.`, tag: "#MarketWatch" }
        ];
        socialFeedContainer.innerHTML = posts.map(p => `
            <div class="social-card">
                <div class="social-author">${p.handle} <span class="social-hashtag">${p.tag}</span></div>
                <div>${p.text}</div>
            </div>
        `).join('');
    }
}

// ─── REVOLUTION DASHBOARD ─────────────────────────────────────────────────────
function renderRevolutionDashboard() {
    const container = document.getElementById('revolution-dashboard');
    if (!container) return;
    const r = game.revolution;

    const stageBadgeColor = {
        dormant:      '#4b5563',
        agitation:    '#d97706',
        organization: '#b45309',
        unrest:       '#dc2626',
        insurrection: '#991b1b',
        revolution:   '#7f1d1d',
        civil_war:    '#450a0a',
        new_regime:   '#166534'
    };

    const stageColor = stageBadgeColor[r.stage] || '#4b5563';
    const fervor = game.regime.revolutionaryPressure;

    const leaderCards = r.leaders.map(lid => {
        const ldr = game.characters.find(c => c.id === lid);
        if (!ldr) return '';
        const statusColor = ldr.status === 'Imprisoned' ? 'var(--danger)' : ldr.exiled ? '#a78bfa' : '#34d399';
        const statusLabel = ldr.status === 'Imprisoned' ? '🔒 IMPRISONED' : ldr.exiled ? '✈️ EXILED' : '⚡ ACTIVE';
        return `
            <div style="background:#0f172a;border:1px solid ${stageColor};border-radius:8px;padding:10px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <span style="font-weight:700;color:#f1f5f9;">${ldr.name}</span>
                    <span style="font-size:0.7rem;color:${statusColor};">${statusLabel}</span>
                </div>
                <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">${ldr.role} • ${ldr.ideology || 'Unknown ideology'} • Age ${ldr.age}</div>
                <div style="font-size:0.72rem;color:#64748b;margin-bottom:8px;">Popularity ${ldr.popularity || ldr.publicSupport || 0}% • Influence ${ldr.influence || ldr.militarySupport || 0}%</div>
                ${ldr.status !== 'Imprisoned' && !ldr.exiled ? `
                <div style="display:flex;gap:5px;flex-wrap:wrap;">
                    <button onclick="revActionNegotiate(${ldr.id})" style="font-size:0.68rem;padding:3px 7px;background:#1e3a5f;border:none;color:#93c5fd;border-radius:4px;cursor:pointer;">🤝 Negotiate</button>
                    <button onclick="revActionSurveil(${ldr.id})" style="font-size:0.68rem;padding:3px 7px;background:#1c2f3a;border:none;color:#67e8f9;border-radius:4px;cursor:pointer;">🔭 Surveil</button>
                    <button onclick="revActionArrest(${ldr.id})" style="font-size:0.68rem;padding:3px 7px;background:#3b0a0a;border:none;color:#fca5a5;border-radius:4px;cursor:pointer;">🔒 Arrest</button>
                    <button onclick="revActionExile(${ldr.id})" style="font-size:0.68rem;padding:3px 7px;background:#2d1f5e;border:none;color:#c4b5fd;border-radius:4px;cursor:pointer;">✈️ Exile</button>
                    <button onclick="revActionCoopt(${ldr.id})" style="font-size:0.68rem;padding:3px 7px;background:#14352e;border:none;color:#6ee7b7;border-radius:4px;cursor:pointer;">🎖️ Co-opt</button>
                </div>` : ''}
            </div>
        `;
    }).join('');

    const orgList = r.organizations.map(o => `
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;margin-bottom:6px;font-size:0.75rem;">
            <div style="font-weight:700;color:#fbbf24;">${o.discovered ? '🔓' : '🕳️'} ${o.name}</div>
            <div style="color:#64748b;">${o.ideology} • Support ${o.support}% • Org ${o.organization}% • Armed Cells: ${o.armedCells || 0}</div>
        </div>
    `).join('');

    const cellList = r.cells.map(cell => {
        const province = game.provinces.find(p => p.id === cell.provinceId);
        const provinceName = cell.province || cell.provinceName || province?.name || "Unknown Province";
        // Normalize older saves that stored the province under another key.
        if (!cell.province) cell.province = provinceName;
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#0f172a;border:1px solid #1e293b;border-radius:5px;font-size:0.72rem;margin-bottom:4px;">
            <span style="color:#94a3b8;">${cell.armed ? '⚔️' : '🕳️'} ${provinceName}</span>
            <span style="color:#64748b;">Str ${cell.strength}% • Sec ${cell.secrecy}%</span>
        </div>
    `;
    }).join('');

    function bar(val, color) {
        return `<div style="height:5px;background:#1e293b;border-radius:3px;margin-top:3px;"><div style="height:5px;width:${val}%;background:${color};border-radius:3px;transition:width 0.4s;"></div></div>`;
    }

    container.innerHTML = `
        <div style="border:1px solid ${stageColor};border-radius:10px;padding:16px;background:#080f1c;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div>
                    <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:2px;">REVOLUTIONARY CRISIS ENGINE</div>
                    <div style="font-size:1.1rem;font-weight:800;color:#f1f5f9;margin-top:2px;">
                        ${r.active ? '⚑ REVOLUTION ACTIVE' : (r.crushed ? '⚔️ REVOLUTION CRUSHED' : (r.revolutionSucceeded ? '🔴 NEW REGIME' : '● DORMANT'))}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.68rem;color:#64748b;">STAGE</div>
                    <div style="font-size:0.82rem;font-weight:700;color:${stageColor};text-transform:uppercase;">${r.stage}</div>
                    ${r.active ? `<div style="font-size:0.65rem;color:#4b5563;">Month ${r.monthsActive} active</div>` : ''}
                </div>
            </div>

            ${fervor >= 80 ? `<div style="background:#3b0a0a;border:1px solid #dc2626;border-radius:6px;padding:8px;margin-bottom:12px;font-size:0.75rem;color:#fca5a5;">⚠️ REVOLUTIONARY PRESSURE: <strong>${fervor}%</strong>${fervor >= 100 ? ' — CRITICAL: MOVEMENT ACTIVATING' : ''}</div>` : ''}

            ${r.active ? `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
                <div style="background:#0b1324;padding:10px;border-radius:6px;">
                    <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Organization</div>
                    <div style="font-size:1rem;font-weight:700;color:#fbbf24;">${r.organization}%</div>
                    ${bar(r.organization,'#d97706')}
                </div>
                <div style="background:#0b1324;padding:10px;border-radius:6px;">
                    <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Popular Support</div>
                    <div style="font-size:1rem;font-weight:700;color:#f87171;">${r.popularSupport}%</div>
                    ${bar(r.popularSupport,'#dc2626')}
                </div>
                <div style="background:#0b1324;padding:10px;border-radius:6px;">
                    <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Armed Support</div>
                    <div style="font-size:1rem;font-weight:700;color:#ef4444;">${r.armedSupport}%</div>
                    ${bar(r.armedSupport,'#b91c1c')}
                </div>
                <div style="background:#0b1324;padding:10px;border-radius:6px;">
                    <div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Rev. Legitimacy</div>
                    <div style="font-size:1rem;font-weight:700;color:#a78bfa;">${r.revolutionaryLegitimacy}%</div>
                    ${bar(r.revolutionaryLegitimacy,'#7c3aed')}
                </div>
            </div>

            ${r.leaders.length > 0 ? `<div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">REVOLUTIONARY LEADERSHIP</div>${leaderCards}` : ''}
            ${r.organizations.length > 0 ? `<div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;margin-top:10px;">UNDERGROUND ORGANIZATIONS</div>${orgList}` : ''}
            ${r.cells.length > 0 ? `<div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;margin-top:10px;">PROVINCIAL CELLS (${r.cells.length})</div>${cellList}` : ''}
            ` : `<div style="color:#4b5563;font-size:0.8rem;text-align:center;padding:20px 0;">No active revolutionary movement.<br>Revolutionary Pressure: <strong style="color:${fervor > 60 ? '#d97706' : '#64748b'};">${fervor}%</strong></div>`}
        </div>
    `;
}

// ─── REVOLUTIONARY CHARACTER ACTION HANDLERS ──────────────────────────────────
function revActionNegotiate(charId) {
    const ldr = game.characters.find(c => c.id === charId);
    if (!ldr) return;
    const r = game.revolution;
    r.organization += 8;
    r.cooldown = Math.max(r.cooldown, 3);
    game.realm.approval += 5;
    game.realm.stability += 5;
    log(`🤝 Opened secret negotiations with ${ldr.name}. Movement gains legitimacy from the concession.`);
    updateUI();
}

function revActionSurveil(charId) {
    const ldr = game.characters.find(c => c.id === charId);
    if (!ldr) return;
    ldr.underSurveillance = true;
    if (game.intelligenceSystem) game.intelligenceSystem.activeWiretaps.add(charId);
    game.intelligence.domesticControl = Math.min(100, game.intelligence.domesticControl + 10);
    log(`🔭 24/7 surveillance placed on ${ldr.name}. Intel will reveal organization structure.`);
    updateUI();
}

function revActionArrest(charId) {
    const ldr = game.characters.find(c => c.id === charId);
    if (!ldr || ldr.status === 'Imprisoned') return;
    const r = game.revolution;
    if (Math.random() < 0.55) {
        ldr.status = 'Imprisoned';
        ldr.imprisoned = true;
        r.governmentResponse += 20;
        // Martyr effect
        r.organization += 20;
        r.popularSupport += 12;
        log(`🔒 ${ldr.name} ARRESTED AND IMPRISONED. Martyrdom effect: +20 org, +12 popular support.`);
    } else {
        r.organization += 8;
        log(`Arrest attempt on ${ldr.name} FAILED — went underground. Organization +8.`);
    }
    updateUI();
}

/* UI Navigation & Title Screen Modal Functions */

function showTitleScreen() {
    const ts = document.getElementById('title-screen');
    if (ts) ts.style.display = 'flex';
    checkContinuePreview();
}

function hideTitleScreen() {
    const ts = document.getElementById('title-screen');
    if (ts) ts.style.display = 'none';
}

function showNewGameModal() {
    const m = document.getElementById('new-game-modal');
    if (m) m.style.display = 'flex';
}

function closeNewGameModal() {
    const m = document.getElementById('new-game-modal');
    if (m) m.style.display = 'none';
}

function showLoadGameModal() {
    const m = document.getElementById('load-game-modal');
    if (m) {
        m.style.display = 'flex';
        renderRecentSavesList();
    }
}

function closeLoadGameModal() {
    const m = document.getElementById('load-game-modal');
    if (m) m.style.display = 'none';
}

function openPauseMenu() {
    setSpeed(0);
    const m = document.getElementById('pause-menu-modal');
    if (m) m.style.display = 'flex';
}

function closePauseMenu() {
    const m = document.getElementById('pause-menu-modal');
    if (m) m.style.display = 'none';
}

function promptReturnToTitle() {
    closePauseMenu();
    const m = document.getElementById('return-title-modal');
    if (m) m.style.display = 'flex';
}

function closeReturnTitleModal() {
    const m = document.getElementById('return-title-modal');
    if (m) m.style.display = 'none';
}

function showSettingsModal() {
    const m = document.getElementById('settings-modal');
    if (m) m.style.display = 'flex';
}

function closeSettingsModal() {
    const m = document.getElementById('settings-modal');
    if (m) m.style.display = 'none';
}

function showCreditsModal() {
    const m = document.getElementById('credits-modal');
    if (m) m.style.display = 'flex';
}

function closeCreditsModal() {
    const m = document.getElementById('credits-modal');
    if (m) m.style.display = 'none';
}

function revActionExile(charId) {
    const ldr = game.characters.find(c => c.id === charId);
    if (!ldr || ldr.exiled) return;
    const r = game.revolution;
    ldr.status = 'Exiled';
    ldr.exiled = true;
    r.organization -= 10;
    r.popularSupport -= 5;
    game.realm.treasury -= 0.05;
    log(`✈️ ${ldr.name} forcibly exiled. Movement loses organizational capacity.`);
    updateUI();
}

function revActionCoopt(charId) {
    const ldr = game.characters.find(c => c.id === charId);
    if (!ldr) return;
    const r = game.revolution;
    if (Math.random() < 0.35) {
        // Success
        ldr.role = 'Minister (Co-opted)';
        ldr.opinion = 40;
        ldr.revolutionary = false;
        r.leaders = r.leaders.filter(id => id !== charId);
        r.organization -= 25;
        r.popularSupport -= 15;
        log(`🎖️ ${ldr.name} ACCEPTED ministerial post. Co-opted — movement loses principal leader.`);
        if (r.leaders.length === 0) {
            r.active = false;
            r.stage = 'dormant';
            log('Revolutionary movement collapses without leadership.');
        }
    } else {
        r.popularSupport += 12;
        r.organization += 8;
        log(`Co-optation REJECTED by ${ldr.name}. Used offer as revolutionary propaganda.`);
    }
    updateUI();
}
