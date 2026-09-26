/* static/world/nigredo/modules/n6.js — v20.7 Pure Global & Grimoire Sync */

// 1. Constants & Mappings
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

// 🚀 [NEW] Jyotish 행성 기호 매핑
const GRAHA_SYMBOLS = {
    'Surya': '☉', 'Chandra': '☽', 'Budha': '☿', 'Shukra': '♀',
    'Mangala': '♂', 'Brihaspati': '♃', 'Shani': '♄',
    'Ketu': '☋', 'Rahu': '☊'
};

let STATE = {
    mode: 'harmonics',
    view: 'positions',
    varga_view: 'amsa',   // 🚀 [NEW] 'amsa' or 'graha'
    v_amsa: 'D1',         // 🚀 [NEW] 선택된 Amsa Division
    h_level: 1,
    v_graha: 'Lagna',
    ayanamsa: 'lahiri',
    data: null,      
    vargaDefs: null, 
    selectedVarga: null,
    selectedBody: null,
    selectedAspect: null
};

let root = null;

// 2. Initialization Logic
(async function initN6() {
    const params = new URLSearchParams(window.location.search);
    STATE.mode = params.get('mode') || 'harmonics';
    STATE.view = params.get('view') || 'positions';
    STATE.varga_view = params.get('varga_view') || 'amsa'; // 🚀
    STATE.v_amsa = params.get('v_amsa') || 'D1';           // 🚀
    STATE.ayanamsa = params.get('ayanamsa') || 'lahiri';
    STATE.h_level = parseInt(params.get('h')) || 1;

    initUI();
    
    await ensureN6Session();
    
    fetchVargaDefinitions();
    fetchDivisioData();

    // 팝업 닫기 이벤트
    root = document.querySelector('.n6-divisio');
    if (root) {
        root.addEventListener('click', (e) => {
            const popover = document.getElementById('varga-popover');
            if (popover && !e.target.closest('.varga-division-cell') && !e.target.closest('.varga-popover-box')) {
                popover.style.display = 'none';
                root.querySelectorAll('.varga-division-cell').forEach(el => el.classList.remove('active'));
                STATE.selectedVarga = null;
            }
        });
    }
})();

async function ensureN6Session() {
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (!activeSeed) return false;
    try {
        const res = await fetch('/api/astro/principia/sync-active', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(activeSeed)
        });
        return res.ok;
    } catch(e) { return false; }
}

// Window Public Handlers
window.n6_toggleDivisioMode = function() {
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

window.n6_toggleHarmonicView = function() {
    STATE.view = (STATE.view === 'positions') ? 'aspects' : 'positions';
    updateUrl(); 
    syncUI(); 
    refreshAllViews();
};

window.n6_switchAyanamsa = function(ayan) {
    STATE.ayanamsa = ayan; 
    updateUrl(); 
    renderAyanamsaButtons(); 
    fetchDivisioData();
};

// 🚀 [NEW] Varga 하위 모드 (Amsa <-> Graha) 토글
window.n6_toggleVargaView = function() {
    STATE.varga_view = (STATE.varga_view === 'amsa') ? 'graha' : 'amsa';
    updateUrl(); 
    syncUI(); 
    refreshAllViews();
};

/* ─────────────────────────────────────────────────────────────
    Internal Functions
    ───────────────────────────────────────────────────────────── */

async function fetchDivisioData() {
    try {
        const url = `/api/astro/divisio/reading?ayanamsa=${STATE.ayanamsa}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === "success") {
            STATE.data = json.data;
            STATE.data.meta = json.meta;
            
            const isLocked = json.meta && json.meta.is_time_unknown === 1;
            handleVargaLock(isLocked);

            refreshAllViews();
        }
    } catch (e) { console.error("[N6] Data Load Error:", e); }
}

function handleVargaLock(isLocked) {
    const vargaLabel = document.getElementById('n6-label-varga');
    const modeKnob = document.getElementById('n6-mode-knob');
    const modeToggle = modeKnob?.parentElement;

    if (isLocked) {
        vargaLabel?.classList.add('locked');
        if (vargaLabel) vargaLabel.innerHTML = 'Varga 🔒';
        modeToggle?.classList.add('locked');

        if (STATE.mode === 'varga') {
            STATE.mode = 'harmonics';
            updateUrl(); syncUI();
        }
    } else {
        vargaLabel?.classList.remove('locked');
        if (vargaLabel) vargaLabel.innerHTML = 'Varga';
        modeToggle?.classList.remove('locked');
    }
}

function refreshAllViews() {
    if (STATE.mode === 'varga') {
        // 🚀 모드 분기
        if (STATE.varga_view === 'amsa') {
            renderVargaAmsaTable();
        } else {
            renderVargaTable(); // (기존 Graha Table)
        }
    } else {
        renderHarmonicTable(); 
        if (STATE.view === 'aspects') renderAspectExplorer(); 
    }
}

function syncUI() {
    const mKnob = document.getElementById('n6-mode-knob');
    const vKnob = document.getElementById('n6-view-knob');
    const vargaViewKnob = document.getElementById('n6-varga-view-knob'); // 🚀
    
    const subSwitchHarmonic = document.getElementById('n6-sub-switch-container');
    const subSwitchVarga = document.getElementById('n6-varga-sub-switch'); // 🚀
    const vargaControls = document.getElementById('n6-varga-controls');
    
    const labelHarm = document.getElementById('n6-label-harmonics');
    const labelVarg = document.getElementById('n6-label-varga');
    const labelPos = document.getElementById('n6-label-positions');
    const labelAsp = document.getElementById('n6-label-aspects');
    const labelAmsa = document.getElementById('n6-label-amsa');   // 🚀
    const labelGraha = document.getElementById('n6-label-graha'); // 🚀

    const viewPos = document.getElementById('n6-view-harmonic-positions');
    const viewAsp = document.getElementById('n6-view-harmonic-aspects');
    const viewVargaGraha = document.getElementById('n6-view-varga-graha'); // 🚀
    const viewVargaAmsa = document.getElementById('n6-view-varga-amsa');   // 🚀
    
    const gridGraha = document.getElementById('n6-graha-grid'); // 🚀
    const gridAmsa = document.getElementById('n6-amsa-grid');   // 🚀

    if (STATE.mode === 'varga') {
        mKnob?.classList.add('right');
        labelHarm?.classList.remove('active');
        labelVarg?.classList.add('active');

        if(subSwitchHarmonic) subSwitchHarmonic.style.display = 'none'; 
        if(subSwitchVarga) subSwitchVarga.style.display = 'flex'; // 🚀 Varga 토글 ON
        if(vargaControls) vargaControls.style.display = 'block';
        
        if(viewPos) viewPos.style.display = 'none';
        if(viewAsp) viewAsp.style.display = 'none';

        // 🚀 Amsa / Graha 서브 뷰 분기
        if (STATE.varga_view === 'graha') {
            vargaViewKnob?.classList.add('right');
            labelAmsa?.classList.remove('active');
            labelGraha?.classList.add('active');
            
            if(gridAmsa) gridAmsa.style.display = 'none';
            if(gridGraha) gridGraha.style.display = 'grid';

            if(viewVargaAmsa) viewVargaAmsa.style.display = 'none';
            if(viewVargaGraha) viewVargaGraha.style.display = 'block';
        } else {
            vargaViewKnob?.classList.remove('right');
            labelAmsa?.classList.add('active');
            labelGraha?.classList.remove('active');
            
            if(gridGraha) gridGraha.style.display = 'none';
            if(gridAmsa) gridAmsa.style.display = 'grid';

            if(viewVargaGraha) viewVargaGraha.style.display = 'none';
            if(viewVargaAmsa) viewVargaAmsa.style.display = 'block';
        }

    } else {
        mKnob?.classList.remove('right');
        labelHarm?.classList.add('active');
        labelVarg?.classList.remove('active');

        if(subSwitchHarmonic) subSwitchHarmonic.style.display = 'flex'; 
        if(subSwitchVarga) subSwitchVarga.style.display = 'none';
        if(vargaControls) vargaControls.style.display = 'none';
        
        if(viewVargaGraha) viewVargaGraha.style.display = 'none';
        if(viewVargaAmsa) viewVargaAmsa.style.display = 'none';

        if (STATE.view === 'aspects') {
            vKnob?.classList.add('right'); 
            labelPos?.classList.remove('active');
            labelAsp?.classList.add('active');
            if(viewPos) viewPos.style.display = 'none'; 
            if(viewAsp) viewAsp.style.display = 'block';
        } else {
            vKnob?.classList.remove('right'); 
            labelPos?.classList.add('active');
            labelAsp?.classList.remove('active');
            if(viewPos) viewPos.style.display = 'block'; 
            if(viewAsp) viewAsp.style.display = 'none';
        }
    }
}

function renderHarmonicTable() {
    const tbody = document.getElementById('n6-h-pos-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    CELESTIALS.forEach(name => {
        const tr = document.createElement('tr');

        if (name === 'Chiron') {
            tr.classList.add('n6-divider-cyan');
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
    const tbody = document.getElementById('n6-varga-body');
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
    let popover = document.getElementById('varga-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'varga-popover';
        popover.className = 'varga-popover-box'; 
        document.body.appendChild(popover);
    }
    if (STATE.selectedVarga === divKey && popover.style.display !== 'none') {
        popover.style.display = 'none'; cellElement.classList.remove('active'); STATE.selectedVarga = null; return;
    }
    
    if (root) root.querySelectorAll('.varga-division-cell').forEach(el => el.classList.remove('active'));
    
    cellElement.classList.add('active'); STATE.selectedVarga = divKey;
    if (!STATE.vargaDefs || !STATE.vargaDefs[divKey]) return;
    const def = STATE.vargaDefs[divKey];
    const userLang = localStorage.getItem('tetramegistus_lang') || 'ko'; 
    const targetLang = (userLang === 'ko') ? 'ko' : 'en';
    popover.innerHTML = `<div class="varga-popover-title">${divKey} - ${def.amsa}</div><div class="varga-popover-content">${def[targetLang] || def['en']}</div>`;
    popover.style.left = `${event.pageX + 15}px`; popover.style.top = `${event.pageY + 15}px`; popover.style.display = 'block'; 
}

function renderHButtons() {
    const grid = document.getElementById('n6-h-btn-grid');
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
                const listO = document.getElementById('n6-list-h-objects');
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
    const nav = document.getElementById('n6-ayanamsa-nav-container');
    if (!nav) return; nav.innerHTML = ''; 
    AYANAMSAS.forEach(ay => {
        const btn = document.createElement('button');
        btn.className = `ayan-tab ${STATE.ayanamsa === ay.id ? 'active' : ''}`;
        btn.textContent = ay.label; btn.title = ay.desc; 
        btn.onclick = () => window.n6_switchAyanamsa(ay.id);
        nav.appendChild(btn);
    });
}

function renderGrahaButtons() {
    const grid = document.getElementById('n6-graha-grid');
    if(!grid) return; grid.innerHTML = '';
    GRAHAS.forEach(g => {
        const btn = document.createElement('div');
        btn.className = `graha-btn ${STATE.v_graha === g.id ? 'active' : ''}`;
        btn.textContent = g.id; btn.title = g.label;
        btn.onclick = () => { STATE.v_graha = g.id; renderGrahaButtons(); renderVargaTable(); };
        grid.appendChild(btn);
    });
}

// 🚀 [NEW] Amsa 버튼 (5x3 Grid) 렌더링
function renderAmsaButtons() {
    const grid = document.getElementById('n6-amsa-grid');
    if(!grid) return; 
    grid.innerHTML = '';
    
    VARGA_DIVISIONS.forEach(d => {
        const btn = document.createElement('div');
        btn.className = `amsa-btn ${STATE.v_amsa === d ? 'active' : ''}`;
        btn.textContent = d;
        
        // vargas.json 에서 로드된 amsa 이름을 툴팁으로 삽입
        if (STATE.vargaDefs && STATE.vargaDefs[d]) {
            btn.title = STATE.vargaDefs[d].amsa; 
        }
        
        btn.onclick = () => { 
            STATE.v_amsa = d; 
            renderAmsaButtons(); 
            renderVargaAmsaTable(); 
        };
        grid.appendChild(btn);
    });
}

// vargas.json 을 받아왔을 때 버튼 이름도 업데이트 하도록 연결
async function fetchVargaDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/vargas/definitions');
        if (res.ok) {
            STATE.vargaDefs = await res.json();
            renderAmsaButtons(); // 🚀 버튼 툴팁 갱신
            if (STATE.mode === 'varga') refreshAllViews();
        }
    } catch (e) { console.error("Varga Defs Load Fail:", e); }
}

// 🚀 [NEW] Amsa 기준 행성 정렬 테이블 (기호 포함)
window.renderVargaAmsaTable = function() {
    const tbody = document.getElementById('n6-varga-amsa-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const vData = (STATE.data && STATE.data.varga) ? STATE.data.varga : null;

    GRAHAS.forEach(g => {
        const tr = document.createElement('tr');
        
        // 1. Graha 열 (기호 + 이름 결합)
        const tdGraha = document.createElement('td');
        tdGraha.className = 'sticky-col';
        if (g.id === 'Lagna') {
            tdGraha.textContent = g.id;
        } else {
            // 🚀 기호 선행 배치
            tdGraha.innerHTML = `<strong>${GRAHA_SYMBOLS[g.id]}</strong> ${g.id}`;
        }
        tr.appendChild(tdGraha);

        // 2. Info & Nakshatra 처리
        const tdInfo = document.createElement('td');
        const tdNak = document.createElement('td');

        const grahaMap = {
            'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
            'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
            'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
            'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
        };
        const targetKey = grahaMap[g.id];

        if (vData && vData[targetKey] && vData[targetKey][STATE.v_amsa]) {
            const subData = vData[targetKey][STATE.v_amsa];
            
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
            // D1 일 때는 녹색 강조 (기존 UI 통일성)
            if (STATE.v_amsa === 'D1') tdNak.style.color = '#aaffaa';
            
            if (nakText !== '-') {
                const nakName = nakText.split('-')[0];
                const idx = NAK_LIST.indexOf(nakName);
                if (idx !== -1) {
                    tdNak.title = `Nakshatra #${idx + 1} | Ruler: ${NAK_RULERS_CYCLE[idx % 9]}`;
                    tdNak.style.cursor = "help";
                }
            }
        } else {
            tdInfo.textContent = '-'; tdNak.textContent = '-';
        }

        tr.appendChild(tdInfo);
        tr.appendChild(tdNak);
        tbody.appendChild(tr);
    });
};

function initUI() {
    renderHButtons();
    renderAyanamsaButtons();
    renderGrahaButtons();
    renderAmsaButtons(); // 🚀 [NEW]
    syncUI();
    if (STATE.view === 'aspects') renderAspectExplorer();
    else renderHarmonicTable();
}

function showLockWarning() {
    let tooltip = document.getElementById('varga-popover');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'varga-popover';
        tooltip.className = 'varga-popover-box'; 
        document.body.appendChild(tooltip);
    }
    tooltip.innerHTML = `<div class="varga-popover-title" style="color: #ff6b6b;">! Time Unknown !</div><div class="varga-popover-content">Varga requires precise birth time. Feature locked.</div>`;
    const knob = document.getElementById('n6-mode-knob');
    if (knob) {
        const rect = knob.getBoundingClientRect();
        tooltip.style.left = `${rect.left - 100}px`; 
        tooltip.style.top = `${rect.bottom + window.scrollY + 15}px`;
        tooltip.style.display = 'block';
        setTimeout(() => { tooltip.style.display = 'none'; }, 3000);
    }
}

function updateUrl() {
    const params = new URLSearchParams(window.location.search);
    params.set('module', 'n6'); 
    params.set('mode', STATE.mode); 
    params.set('view', STATE.view); 
    params.set('varga_view', STATE.varga_view); // 🚀
    params.set('h', STATE.h_level);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

function renderAspectExplorer() {
    const listH = document.getElementById('n6-list-h-bodies');
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
            const listO = document.getElementById('n6-list-h-objects');
            if(listO) listO.innerHTML = ''; 
            renderAspectExplorer(); 
            fetchAspects(name);     
        };
        listH.appendChild(btn);
    });

    if (!STATE.selectedBody) {
        const listA = document.getElementById('n6-list-h-aspects');
        if(listA) listA.innerHTML = '<div class="placeholder-text" style="text-align: center; color: #444; margin-top: 50px;">Select Body</div>';
        const listO = document.getElementById('n6-list-h-objects');
        if(listO) listO.innerHTML = '';
    }
}

async function fetchAspects(bodyName) {
    const container = document.getElementById('n6-list-h-aspects');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-mini" style="text-align:center; padding:20px; color:#666;">SCANNING...</div>';
    
    try {
        const res = await fetch(`/api/astro/aspects/harmonic/${STATE.h_level}?body=${bodyName}`);
        const data = await res.json();
        STATE.currentAspectData = data.aspects || [];
        renderAspectList(); 
    } catch (e) {
        container.innerHTML = '<div class="error-text">API Error</div>';
    }
}

function renderAspectList() {
    const container = document.getElementById('n6-list-h-aspects');
    if (!container) return;
    container.innerHTML = '';

    const aspects = STATE.currentAspectData;
    if (!aspects || aspects.length === 0) {
        container.innerHTML = '<div class="placeholder-text" style="text-align: center; color: #444; margin-top: 50px;">No Aspects</div>';
        const objContainer = document.getElementById('n6-list-h-objects');
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
    const container = document.getElementById('n6-list-h-objects');
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

/* ─────────────────────────────────────────────────────────────
    3. GRIMOIRE MANIFESTATION (N6 -> Archive)
    ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    const activeSeedRaw = localStorage.getItem('active_seed');
    const activeSeed = activeSeedRaw ? JSON.parse(activeSeedRaw) : {};
    
    // 🚀 Varga 모드인데 생시를 모르면 세이브 차단
    if (STATE.mode === 'varga' && activeSeed.is_time_unknown) {
        alert("Varga requires precise birth time. Feature locked.");
        return false;
    }

    const params = new URLSearchParams(window.location.search);
    let h_sys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    const lang = localStorage.getItem('tetramegistus_lang') || 'en';

    // 🚀 현재 상태에 따른 다이나믹 컴파일러 라우팅
    let compilerId = '';
    if (STATE.mode === 'harmonics') {
        compilerId = STATE.view === 'positions' ? 'n6' : 'n6_aspects';
    } else if (STATE.mode === 'varga') {
        compilerId = STATE.ayanamsa === 'kp' ? 'n6_varga_kp' : 'n6_varga';
    }

    if (!compilerId) {
        console.error("[GRIMOIRE] Invalid N6 state for compilation.");
        alert("System State Error: Cannot determine compiler.");
        return false;
    }

    // 산스크리트어 Graha 이름을 영어 기본 명칭으로 변환하여 백엔드로 전송
    const grahaMap = {
        'Lagna': 'Ascendant', 'Surya': 'Sun', 'Chandra': 'Moon', 
        'Budha': 'Mercury', 'Shukra': 'Venus', 'Mangala': 'Mars', 
        'Brihaspati': 'Jupiter', 'Shani': 'Saturn',
        'Ketu': 'South Node (t)', 'Rahu': 'North Node (t)'
    };
    const targetBody = grahaMap[STATE.v_graha] || 'Sun';

    const payload = {
        seed_id: activeSeed.id ?? activeSeed.idx ?? "unknown",
        stage: 'Nigredo', // 🚀 스테이지 고정
        target_name: activeSeed.name || "Unknown",
        language: lang,
        metadata: {
            h_sys: h_sys,
            sys_tab: 'tropical', // N6 기준 시스템
            ayanamsa: STATE.ayanamsa,
            h_level: `H${STATE.h_level}`,
            graha: targetBody,
            target_body: targetBody
        },
        seed: activeSeed 
    };

    try {
        console.log(`[GRIMOIRE] Manifesting N6 Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();

        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${payload.target_name}] Saved Successfully!`);
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