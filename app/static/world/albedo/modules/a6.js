/* static/world/albedo/modules/a6.js — v20.7 Root-Scoped Isolation Removed */

// 1. Constants (N6와 이름이 같아도 안전)
const CELESTIALS = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", 
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", 
    "Chiron", "Mean Lilith", "True Lilith", "North Node (t)"
];

const H_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 32];

const GRAHAS = [
    {id: 'Lagna', label: 'Ascendant'}, {id: 'Surya', label: 'Sun'}, 
    {id: 'Chandra', label: 'Moon'}, {id: 'Budha', label: 'Mercury'},
    {id: 'Shukra', label: 'Venus'}, {id: 'Mangala', label: 'Mars'},
    {id: 'Brihaspati', label: 'Jupiter'}, {id: 'Shani', label: 'Saturn'},
    {id: 'Ketu', label: 'South Node'}, {id: 'Rahu', label: 'North Node'}
];

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri', desc: 'Standard Vedic (Chitra Paksha)' },
    { id: 'raman', label: 'Raman', desc: 'B.V. Raman' },
    { id: 'kp', label: 'KP', desc: 'Krishnamurti Paddhati' },
    { id: 'fagan-bradley', label: 'Fagan-Bradley', desc: 'Fagan-Bradley' },
    { id: 'yukteswar', label: 'Yukteswar', desc: 'Sri Yukteswar' }
];

const VARGA_DIVISIONS = [
    "D1", "D2", "D3", "D4", "D6", "D7", "D8", "D9", "D10", "D12", 
    "D16", "D20", "D24", "D30", "D60"
];

const SIGN_RULERS = {
    "Mesha": "Mars", "Vrishabha": "Venus", "Mithuna": "Mercury", "Karka": "Moon",
    "Simha": "Sun", "Kanya": "Mercury", "Tula": "Venus", "Vrishchika": "Mars",
    "Dhanu": "Jupiter", "Makara": "Saturn", "Kumbha": "Saturn", "Meena": "Jupiter"
};

const NAK_LIST = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const NAK_RULERS_CYCLE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];

const ASPECT_GROUPS = {
    "Major": ["Conjunction", "Opposition", "Trine", "Square", "Sextile"],
    "Minor": ["Quintile", "Septile", "Octile", "Novile", "Decile", "Undecile", "Semi-sextile", "Quincunx"]
};

// 로컬 State
let STATE = {
    mode: 'harmonics',
    view: 'positions',
    h_level: 1,
    v_graha: 'Lagna',
    ayanamsa: 'lahiri',
    data: null,      
    vargaDefs: null, 
    selectedVarga: null,
    selectedBody: null,
    selectedAspect: null
};

// 2. Initialization Logic
(async function initA6() {
    const params = new URLSearchParams(window.location.search);
    STATE.mode = params.get('mode') || 'harmonics';
    STATE.view = params.get('view') || 'positions';
    STATE.ayanamsa = params.get('ayanamsa') || 'lahiri';
    STATE.h_level = parseInt(params.get('h')) || 1;

    initUI();
    fetchVargaDefinitions();

    // Albedo Session Sync Loop
    let isStationReady = false;
    while (!isStationReady) {
        isStationReady = await ensureAlbedoSession();
        if (!isStationReady) await new Promise(r => setTimeout(r, 200));
    }

    fetchMultiplicatioData();

    // 🚀 [KEY FIX]: document가 아닌 'a6-multiplicatio' 컨테이너 내부 클릭만 감지
    // N6 화면에서 클릭 시 이 리스너는 반응하지 않으므로 안전합니다.
    const root = document.querySelector('.a6-multiplicatio');
    if (root) {
        root.addEventListener('click', (e) => {
            const popover = document.getElementById('a6-varga-popover');
            if (popover && !e.target.closest('.varga-division-cell') && !e.target.closest('.varga-popover-box')) {
                popover.style.display = 'none';
                document.querySelectorAll('.varga-division-cell').forEach(el => el.classList.remove('active'));
                STATE.selectedVarga = null;
            }
        });
    }
})();

async function ensureAlbedoSession() {
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (!activeSeed) return false;
    try {
        const res = await fetch('/api/astro/coagulatio/sync-active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activeSeed)
        });
        return res.ok;
    } catch (e) { return false; }
}

// 🚀 [Public API]: HTML onclick용 전역 함수 (이름 충돌 방지 a6_)
window.a6_toggleMultiplicatioMode = function() {
    const isLocked = STATE.data && STATE.data.meta && Number(STATE.data.meta.is_time_unknown) === 1;
    
    if (isLocked) {
        showLockWarning();
        STATE.mode = 'harmonics';
        syncUI(); 
        return;
    }

    STATE.mode = (STATE.mode === 'harmonics') ? 'varga' : 'harmonics';
    updateUrl(); 
    syncUI(); 
    refreshAllViews();
};

window.a6_toggleHarmonicView = function() {
    STATE.view = (STATE.view === 'positions') ? 'aspects' : 'positions';
    updateUrl(); 
    syncUI(); 
    refreshAllViews();
};

window.a6_switchAyanamsa = function(ayan) {
    STATE.ayanamsa = ayan; 
    updateUrl(); 
    renderAyanamsaButtons(); 
    fetchMultiplicatioData();
};

/* ─────────────────────────────────────────────────────────────
   Internal Functions (외부 노출 X)
   ───────────────────────────────────────────────────────────── */

async function fetchVargaDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/vargas/definitions');
        if (res.ok) {
            STATE.vargaDefs = await res.json();
            if (STATE.mode === 'varga') renderVargaTable();
        }
    } catch (e) { console.error("Varga Defs Load Fail:", e); }
}

async function fetchMultiplicatioData() {
    const mask = document.getElementById('a6-loading-mask');
    if (mask) mask.style.display = 'flex';

    try {
        const url = `/api/astro/multiplicatio/reading?ayanamsa=${STATE.ayanamsa}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.status === "retry" || json.error || !json.data) {
            // console.warn("[A6] Retry...");
            setTimeout(fetchMultiplicatioData, 500); 
            return;
        }

        if (json.status === "success") {
            STATE.data = json.data;
            STATE.data.meta = json.meta;

            const isLocked = json.meta && json.meta.is_time_unknown === 1;
            handleVargaLock(isLocked);

            refreshAllViews();
            if (mask) mask.style.display = 'none';
        }
    } catch (e) {
        setTimeout(fetchMultiplicatioData, 800);
    }
}

function handleVargaLock(isLocked) {
    const vargaLabel = document.getElementById('a6-label-varga');
    const modeKnob = document.getElementById('a6-mode-knob');
    const modeToggle = modeKnob?.parentElement;

    if (isLocked) {
        vargaLabel?.classList.add('locked');
        if (vargaLabel) { vargaLabel.style.opacity = '0.3'; vargaLabel.innerHTML = 'Varga 🔒'; }
        if (modeToggle) modeToggle.style.opacity = '0.5';

        if (STATE.mode === 'varga') {
            STATE.mode = 'harmonics';
            updateUrl();
            syncUI();
        }
    } else {
        vargaLabel?.classList.remove('locked');
        if (vargaLabel) { vargaLabel.style.opacity = '1'; vargaLabel.innerHTML = 'Varga'; }
        if (modeToggle) modeToggle.style.opacity = '1';
    }
}

function refreshAllViews() {
    if (STATE.mode === 'varga') {
        renderVargaTable();
    } else {
        renderHarmonicTable(); 
        if (STATE.view === 'aspects') {
            renderAspectExplorer(); 
        }
    }
}

function updateUrl() {
    const p = new URLSearchParams(window.location.search);
    p.set('module', 'a6'); p.set('mode', STATE.mode); p.set('view', STATE.view); p.set('h', STATE.h_level);
    window.history.replaceState({}, '', `${window.location.pathname}?${p.toString()}`);
}

function syncUI() {
    const mKnob = document.getElementById('a6-mode-knob');
    const vKnob = document.getElementById('a6-view-knob');
    const subSwitch = document.getElementById('a6-sub-switch-container');
    const vargaControls = document.getElementById('a6-varga-controls');
    
    const viewPos = document.getElementById('a6-view-harmonic-positions');
    const viewAsp = document.getElementById('a6-view-harmonic-aspects');
    const viewVarga = document.getElementById('a6-view-varga');
    const harmonicWrapper = document.getElementById('a6-harmonic-wrapper'); 

    if (STATE.mode === 'varga') {
        mKnob.classList.add('right');
        
        if(subSwitch) subSwitch.style.display = 'none'; 
        if(vargaControls) vargaControls.style.display = 'block';
        
        if(viewPos) viewPos.style.display = 'none';
        if(viewAsp) viewAsp.style.display = 'none';
        if(harmonicWrapper) harmonicWrapper.style.display = 'none'; 
        if(viewVarga) viewVarga.style.display = 'block';

    } else {
        mKnob.classList.remove('right');
        
        if(subSwitch) subSwitch.style.display = 'flex'; 
        if(vargaControls) vargaControls.style.display = 'none';
        
        if(viewVarga) viewVarga.style.display = 'none';
        if(harmonicWrapper) harmonicWrapper.style.display = 'block';

        if (STATE.view === 'aspects') {
            vKnob.classList.add('right'); 
            if(viewPos) viewPos.style.display = 'none'; 
            if(viewAsp) viewAsp.style.display = 'block';
        } else {
            vKnob.classList.remove('right'); 
            if(viewPos) viewPos.style.display = 'block'; 
            if(viewAsp) viewAsp.style.display = 'none';
        }
    }
}

function renderAspectExplorer() {
    const listH = document.getElementById('a6-list-h-bodies');
    if (!listH) return;
    
    listH.innerHTML = '';

    CELESTIALS.forEach(name => {
        const btn = document.createElement('button');
        btn.className = `explorer-btn ${STATE.selectedBody === name ? 'active' : ''}`;
        btn.innerHTML = `<span>${name}</span>`;
        
        if (STATE.data && STATE.data.harmonics && STATE.data.harmonics[name]) {
            const pos = STATE.data.harmonics[name][`H${STATE.h_level}`];
            btn.title = `${name}: ${pos}`; 
        }

        btn.onclick = () => {
            STATE.selectedBody = name;
            STATE.selectedAspect = null;
            const listO = document.getElementById('a6-list-h-objects');
            if(listO) listO.innerHTML = ''; 

            renderAspectExplorer(); 
            fetchAspects(name);     
        };
        listH.appendChild(btn);
    });

    if (!STATE.selectedBody) {
        const listA = document.getElementById('a6-list-h-aspects');
        if(listA) listA.innerHTML = '<div class="placeholder-text" style="text-align: center; color: #444; margin-top: 50px;">Select Body</div>';
        const listO = document.getElementById('a6-list-h-objects');
        if(listO) listO.innerHTML = '';
    }
}

async function fetchAspects(bodyName) {
    const container = document.getElementById('a6-list-h-aspects');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-mini" style="text-align:center; padding:20px; color:#49dce1;">SCANNING...</div>';
    
    try {
        // 🚀 [원인 해결]: Nigredo 엔드포인트가 아닌 Albedo 전용 엔드포인트로 변경!
        const safeBody = encodeURIComponent(bodyName);
        const url = `/api/astro/aspects/harmonic/albedo/${STATE.h_level}?body=${safeBody}&ayanamsa=${STATE.ayanamsa}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        // 파이썬 에러 감지 로직 추가
        if (data.error) {
            console.error("[A6 Backend Error]:", data.error);
            container.innerHTML = '<div class="error-text" style="color:#ff6b6b; text-align:center;">DATA ERROR</div>';
            return;
        }

        STATE.currentAspectData = data.aspects || [];
        renderAspectList(); 

    } catch (e) {
        console.error("[A6 Fetch Error]:", e);
        container.innerHTML = '<div class="error-text" style="color:#ff6b6b; text-align:center;">API ERROR</div>';
    }
}

function renderAspectList() {
    const container = document.getElementById('a6-list-h-aspects');
    if (!container) return;
    container.innerHTML = '';

    const aspects = STATE.currentAspectData;

    if (!aspects || aspects.length === 0) {
        container.innerHTML = '<div class="placeholder-text" style="text-align: center; color: #444; margin-top: 50px;">No Aspects</div>';
        const objContainer = document.getElementById('a6-list-h-objects');
        if (objContainer) objContainer.innerHTML = '';
        return;
    }

    const foundNames = [...new Set(aspects.map(a => a.aspect))];

    ["Major", "Minor"].forEach(group => {
        const list = ASPECT_GROUPS[group].filter(n => foundNames.includes(n));
        
        if (list.length > 0) {
            const h = document.createElement('div');
            h.style.cssText = 'font-size: 0.65rem; color: #444; margin: 15px 0 5px 15px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;';
            h.textContent = group;
            container.appendChild(h);

            list.forEach(aspName => {
                const count = aspects.filter(a => a.aspect === aspName).length;
                const btn = document.createElement('button');
                btn.className = `explorer-btn ${STATE.selectedAspect === aspName ? 'active' : ''}`;
                btn.innerHTML = `<span>${aspName}</span><span class="count-tag" style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:10px; font-size:0.7rem;">${count}</span>`;
                
                btn.onclick = () => {
                    STATE.selectedAspect = aspName;
                    renderAspectList(); 
                    renderObjectList(aspName); 
                };
                container.appendChild(btn);
            });
        }
    });
}

function renderObjectList(aspectName) {
    const container = document.getElementById('a6-list-h-objects');
    if (!container) return;
    container.innerHTML = '';
    
    const targets = STATE.currentAspectData.filter(a => a.aspect === aspectName);
    
    targets.forEach(obj => {
        const div = document.createElement('div');
        div.className = 'explorer-btn static'; 
        div.style.cursor = 'help';
        
        const orbText = `${obj.orb.toFixed(2)}°`;
        div.innerHTML = `<span>${obj.target}</span><span class="orb-tag" style="color:#7CFF9B; font-size:0.75rem;">${orbText}</span>`;
        
        if (STATE.data && STATE.data.harmonics && STATE.data.harmonics[obj.target]) {
            const pos = STATE.data.harmonics[obj.target][`H${STATE.h_level}`];
            div.title = `${obj.target}: ${pos}`; 
        }

        container.appendChild(div);
    });
}

function renderHarmonicTable() {
    const tbody = document.getElementById('a6-h-pos-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    CELESTIALS.forEach(name => {
        const tr = document.createElement('tr');

        if (name === 'Chiron') {
            tr.classList.add('a6-divider-green');
        }
        const th = document.createElement('td');
        th.className = 'sticky-col';
        th.textContent = name;
        tr.appendChild(th);
        H_LEVELS.forEach(h => {
            const td = document.createElement('td');
            let val = '-';
            if (STATE.data && STATE.data.harmonics && STATE.data.harmonics[name]) {
                val = STATE.data.harmonics[name][`H${h}`] || '-';
            }
            td.textContent = val; 
            if (h === STATE.h_level) td.style.color = '#7CFF9B'; 
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function renderVargaTable() {
    const tbody = document.getElementById('a6-varga-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const grahaMap = {
        'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
        'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
        'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
        'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
    };
    
    const targetKey = grahaMap[STATE.v_graha] || 'Sun';
    const vData = (STATE.data && STATE.data.varga) ? STATE.data.varga[targetKey] : null;

    VARGA_DIVISIONS.forEach(div => {
        const tr = document.createElement('tr');
        const tdDiv = document.createElement('td');
        tdDiv.textContent = div;
        tdDiv.className = 'varga-division-cell'; 
        if (STATE.selectedVarga === div) tdDiv.classList.add('active');

        const def = (STATE.vargaDefs && STATE.vargaDefs[div]) ? STATE.vargaDefs[div] : null;
        if (def) tdDiv.title = def.amsa; 

        tdDiv.onclick = (e) => { e.stopPropagation(); toggleVargaMeaning(div, tdDiv, e); };
        tr.appendChild(tdDiv);

        const tdInfo = document.createElement('td');
        const tdNak = document.createElement('td');
        const tdPur = document.createElement('td');

        if (vData && vData[div]) {
            const subData = vData[div];
            const infoText = subData.formatted || '-';
            tdInfo.textContent = infoText;
            if (infoText !== '-') {
                const signMatch = infoText.match(/^([a-zA-Z]+)/);
                if (signMatch) {
                    const ruler = SIGN_RULERS[signMatch[1]];
                    if (ruler) { tdInfo.title = `Ruler: ${ruler}`; tdInfo.style.cursor = "help"; }
                }
            }
            const nakText = subData.nakshatra || '-';
            tdNak.textContent = nakText;
            if (div === 'D1') tdNak.style.color = '#aaffaa';
            if (nakText !== '-') {
                const nakName = nakText.split('-')[0];
                const idx = NAK_LIST.indexOf(nakName);
                if (idx !== -1) {
                    tdNak.title = `Nakshatra #${idx + 1} | Ruler: ${NAK_RULERS_CYCLE[idx % 9]}`;
                    tdNak.style.cursor = "help";
                }
            }
            const purVal = subData.purushartha || '-';
            tdPur.textContent = purVal;
            if (purVal.startsWith('Dharma')) tdPur.style.color = '#ffcc00';
            else if (purVal.startsWith('Artha')) tdPur.style.color = '#00cc00';
            else if (purVal.startsWith('Kama')) tdPur.style.color = '#ff4444';
            else if (purVal.startsWith('Moksha')) tdPur.style.color = '#4488ff';
        } else { tdInfo.textContent = '-'; tdNak.textContent = '-'; tdPur.textContent = '-'; }

        tr.appendChild(tdInfo); tr.appendChild(tdNak); tr.appendChild(tdPur);
        tbody.appendChild(tr);
    });
}

function toggleVargaMeaning(divKey, cellElement, event) {
    let popover = document.getElementById('a6-varga-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'a6-varga-popover';
        popover.className = 'varga-popover-box'; 
        document.body.appendChild(popover);
    }
    if (STATE.selectedVarga === divKey && popover.style.display !== 'none') {
        popover.style.display = 'none'; cellElement.classList.remove('active'); STATE.selectedVarga = null; return;
    }
    document.querySelectorAll('.varga-division-cell').forEach(el => el.classList.remove('active'));
    cellElement.classList.add('active'); STATE.selectedVarga = divKey;
    if (!STATE.vargaDefs || !STATE.vargaDefs[divKey]) return;
    const def = STATE.vargaDefs[divKey];
    const userLang = localStorage.getItem('tetramegistus_lang') || 'ko'; 
    const targetLang = (userLang === 'ko') ? 'ko' : 'en';
    popover.innerHTML = `<div class="varga-popover-title">${divKey} - ${def.amsa}</div><div class="varga-popover-content">${def[targetLang] || def['en']}</div>`;
    let left = event.pageX + 15; let top = event.pageY + 15;
    if (left + 300 > window.innerWidth) left = event.pageX - 310; 
    popover.style.left = `${left}px`; popover.style.top = `${top}px`; popover.style.display = 'block'; 
}

function renderHButtons() {
    const grid = document.getElementById('a6-h-btn-grid');
    if(!grid) return;
    grid.innerHTML = '';
    H_LEVELS.forEach(h => {
        const btn = document.createElement('div');
        btn.className = `keyboard-btn ${STATE.h_level === h ? 'active' : ''}`;
        btn.textContent = `H${h}`;
        btn.onclick = () => { 
            STATE.h_level = h; 
            updateUrl(); 
            renderHButtons(); 
            if (STATE.view === 'aspects') {
                STATE.selectedAspect = null;
                const listO = document.getElementById('a6-list-h-objects');
                if(listO) listO.innerHTML = '';
                renderAspectExplorer(); 
                if (STATE.selectedBody) fetchAspects(STATE.selectedBody);
            } else {
                renderHarmonicTable();
            }
        };
        grid.appendChild(btn);
    });
}

function renderAyanamsaButtons() {
    const nav = document.getElementById('a6-ayanamsa-nav-container');
    if (!nav) return; nav.innerHTML = ''; 
    AYANAMSAS.forEach(ay => {
        const btn = document.createElement('button');
        btn.className = `ayan-tab ${STATE.ayanamsa === ay.id ? 'active' : ''}`;
        btn.textContent = ay.label; btn.title = ay.desc; 
        btn.onclick = () => window.a6_switchAyanamsa(ay.id);
        nav.appendChild(btn);
    });
}

function renderGrahaButtons() {
    const grid = document.getElementById('a6-graha-grid');
    if(!grid) return; grid.innerHTML = '';
    GRAHAS.forEach(g => {
        const btn = document.createElement('div');
        btn.className = `graha-btn ${STATE.v_graha === g.id ? 'active' : ''}`;
        btn.textContent = g.id; btn.title = g.label;
        btn.onclick = () => { STATE.v_graha = g.id; renderGrahaButtons(); renderVargaTable(); };
        grid.appendChild(btn);
    });
}

function initUI() {
    renderHButtons();
    renderAyanamsaButtons();
    renderGrahaButtons();
    syncUI();
    
    if (STATE.view === 'aspects') renderAspectExplorer();
    else renderHarmonicTable();
}

function showLockWarning() {
    let tooltip = document.getElementById('a6-varga-popover');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'a6-varga-popover';
        tooltip.className = 'varga-popover-box'; 
        document.body.appendChild(tooltip);
    }

    tooltip.innerHTML = `
        <div class="varga-popover-title" style="color: #ff6b6b;">! Time Unknown !</div>
        <div class="varga-popover-content">Varga (Divisional Charts) requires precise birth time for both seeds. This feature is currently locked.</div>
    `;

    const knob = document.getElementById('a6-mode-knob');
    if (knob) {
        const rect = knob.getBoundingClientRect();
        tooltip.style.left = `${rect.left - 100}px`; 
        tooltip.style.top = `${rect.bottom + window.scrollY + 15}px`;
        tooltip.style.display = 'block';

        setTimeout(() => { tooltip.style.display = 'none'; }, 3000);
    }
}

/* ─────────────────────────────────────────────────────────────
    3. GRIMOIRE MANIFESTATION (A6 -> Archive)
    ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    // 1. Albedo Station 시드 데이터 추출 (a3.js 로직 차용)
    const activeDavison = JSON.parse(localStorage.getItem('active_davison'));
    const activeComposite = JSON.parse(localStorage.getItem('active_composite'));
    const albedoStation = activeDavison || activeComposite || {};

    let s1Name = albedoStation.seed1?.name || "";
    let s2Name = albedoStation.seed2?.name || "";
    let seedId = albedoStation.id;

    if (!seedId) {
        let id1 = albedoStation.seed1?.idx || albedoStation.seed1?.id || "unknown1";
        let id2 = albedoStation.seed2?.idx || albedoStation.seed2?.id || "unknown2";
        seedId = `${id1}_${id2}`;
    }

    let targetName = (s1Name && s2Name) ? `${s1Name} & ${s2Name}` : "Unknown Coniunctio";

    // 2. 🚀 Varga 모드 방역: 부모 중 하나라도 생시를 모르면 세이브 차단
    const isTimeUnknown = STATE.data && STATE.data.meta && Number(STATE.data.meta.is_time_unknown) === 1;
    if (STATE.mode === 'varga' && isTimeUnknown) {
        alert("Varga requires precise birth time for both seeds. Feature locked.");
        return false;
    }

    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    // 3. 현재 상태에 따른 컴파일러(Compiler ID) 다이나믹 라우팅 (A6 전용)
    let compilerId = '';
    if (STATE.mode === 'harmonics') {
        compilerId = STATE.view === 'positions' ? 'a6' : 'a6_aspects';
    } else if (STATE.mode === 'varga') {
        compilerId = STATE.ayanamsa === 'kp' ? 'a6_varga_kp' : 'a6_varga';
    }

    if (!compilerId) {
        console.error("[GRIMOIRE] Invalid A6 state for compilation.");
        alert("System State Error: Cannot determine compiler.");
        return false;
    }

    // 산스크리트어 Graha 이름을 영어 기본 명칭으로 변환
    const grahaMap = {
        'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
        'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
        'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
        'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
    };
    const targetBody = grahaMap[STATE.v_graha] || 'Sun';

    // 4. Payload 조립
    const payload = {
        seed_id: seedId,
        stage: 'albedo', // 🚀 스테이지는 Albedo
        target_name: targetName,
        language: lang,
        metadata: {
            sys_tab: 'tropical',
            ayanamsa: STATE.ayanamsa,
            h_level: `H${STATE.h_level}`,
            graha: targetBody,
            target_body: targetBody
        }
    };

    try {
        console.log(`[GRIMOIRE] Manifesting A6 Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();

        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            const saveBtn = document.querySelector('.btn-save-grimoire');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '✔ Archived';
                saveBtn.classList.add('success');
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.classList.remove('success');
                }, 3000);
            }
            return true; 
        } else {
            alert(`Manifestation Failed: ${result.detail || result.error || 'Unknown Error'}`);
            throw new Error(result.detail || result.error);
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};