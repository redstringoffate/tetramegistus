/* static/world/albedo/modules/a8.js - CODEX LUCIS (Full Code) */

const TROPICAL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ELEMENT_CYCLE = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri', desc: 'Standard Vedic (Chitra Paksha)' },
    { id: 'raman', label: 'Raman', desc: 'B.V. Raman' },
    { id: 'kp', label: 'KP', desc: 'Krishnamurti Paddhati' },
    { id: 'fagan-bradley', label: 'Fagan-Bradley', desc: 'Fagan-Bradley' },
    { id: 'yukteswar', label: 'Yukteswar', desc: 'Sri Yukteswar' }
];

// Column Definitions for Mapping
const COL_DEFS = {
    'minor_asteroids': { label: 'Asteroids', type: 'min' },
    'tropical': { label: 'Tropical', type: 'tro' },
    'sidereal': { label: 'Sidereal', type: 'sid' },
    'draconic': { label: 'Draconic', type: 'dra' },
    'ketunic': { label: 'Ketunic', type: 'ket' },
    'arabic_lots': { label: 'Arabic Lots', type: 'lot' },
    'main': { label: 'Composite', type: 'comp' },
    'anti': { label: 'Anti-Comp', type: 'anti' }
};

// 🚀 [Airtight Fix 1]: 완벽한 디폴트 상태 정의 (기존 let STATE = {...} 부분을 통째로 교체)
const DEFAULT_ENTITIES = {
    'composite': { active: true, subs: ['main'] },
    'davison': { active: true, subs: ['tropical'] },
    'seed': { active: true, subs: ['tropical'] },
    'partner': { active: true, subs: ['tropical'] }
};

let STATE = {
    ayanamsa: 'lahiri',
    lang: localStorage.getItem('tetramegistus_lang') || 'en',
    sabianSymbols: null,
    asteroidDefs: null, 
    arabicDefs: null,   
    codexData: null,
    dichotomy: 'traditional',
    config: {
        sortMode: 'seed',
        // 🚀 초기 상태를 하드코딩하지 않고 위의 디폴트 값으로 강제 동기화
        entities: JSON.parse(JSON.stringify(DEFAULT_ENTITIES))
    }
};

const SUB_LABELS = {
    'minor_asteroids': 'Asteroids',
    'tropical': 'Tropical',
    'sidereal': 'Sidereal',
    'draconic': 'Draconic',
    'ketunic': 'Ketunic',
    'arabic_lots': 'Arabic Lots',
    'main': 'Main',
    'anti': 'Anti'
};

const IDENTITY_MAP = {
    'composite': { 'main': 'Composite', 'anti': 'anticomposite' },
    'davison': {
        'minor_asteroids': 'Davison_ast', 'tropical': 'Davison_T', 'sidereal': 'Davison_S',
        'draconic': 'Davison_D', 'ketunic': 'Davison_K', 'arabic_lots': 'Davison_lot'
    },
    'seed': {
        'minor_asteroids': 'A_asteroids', 'tropical': 'A_Tropical', 'sidereal': 'A_Sidereal',
        'draconic': 'A_Draconic', 'ketunic': 'A_Ketunic', 'arabic_lots': 'A_Lots' // 🚀 수복
    },
    'partner': {
        'minor_asteroids': 'B_asteroids', 'tropical': 'B_Tropical', 'sidereal': 'B_Sidereal',
        'draconic': 'B_Draconic', 'ketunic': 'B_Ketunic', 'arabic_lots': 'B_Lots' // 🚀 수복
    }
};

function saveLucisConfig() {
    const configToSave = {
        sortMode: STATE.config.sortMode,
        entities: STATE.config.entities,
        dichotomy: STATE.dichotomy,
        ayanamsa: STATE.ayanamsa
    };
    localStorage.setItem('tetramegistus_a8_prefs', JSON.stringify(configToSave));
    console.log("[A8] Preferences Saved.");
}

// 🚀 [Airtight Fix 2]: 초기화 직후 설정창과의 동기화를 위한 loadLucisConfig 전면 교체
function loadLucisConfig() {
    const saved = localStorage.getItem('tetramegistus_a8_prefs');
    
    // 🚀 스토리지가 비어있다면(Reincarnate 직후), 메모리만 쓰지 말고 즉시 스토리지에 디폴트 값을 저장!
    if (!saved) {
        saveLucisConfig();
        return;
    }
    
    try {
        const prefs = JSON.parse(saved);
        STATE.config.sortMode = prefs.sortMode || 'seed';
        
        if (prefs.entities) {
            // 🚀 병합(Merge): 스토리지에 누락된 키가 있어도 디폴트가 뼈대를 잡아줌
            STATE.config.entities = { ...JSON.parse(JSON.stringify(DEFAULT_ENTITIES)), ...prefs.entities };
            
            // Composite 찌꺼기 데이터 방어 로직
            if (STATE.config.entities['composite'] && STATE.config.entities['composite'].subs) {
                STATE.config.entities['composite'].subs = STATE.config.entities['composite'].subs.filter(s => ['main', 'anti'].includes(s));
                if (STATE.config.entities['composite'].subs.length === 0) {
                    STATE.config.entities['composite'].subs = ['main'];
                }
            }
        }
        
        STATE.dichotomy = prefs.dichotomy || 'traditional';
        STATE.ayanamsa = prefs.ayanamsa || 'lahiri';
        console.log("[A8] Preferences Restored.");
    } catch (e) { 
        console.error("[A8] Load Fail", e); 
    }
}

function toggleLoading(show) {
    const container = document.querySelector('.n8-codex-tenebris');
    let overlay = document.getElementById('lucis-loading-overlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lucis-loading-overlay';
        overlay.innerHTML = '<div class="loader-text">MANIFESTING LUCIS...</div>';
        document.body.appendChild(overlay);
    }

    if (show) {
        overlay.style.display = 'flex';
        if (container) container.classList.add('dimmed-blur');
    } else {
        overlay.style.display = 'none';
        if (container) container.classList.remove('dimmed-blur');
    }
}

async function ensureSession() {
    try {
        const s1 = JSON.parse(localStorage.getItem('seed1'));
        const s2 = JSON.parse(localStorage.getItem('seed2'));
        if (s1 && s2) {
            await fetch('/api/astro/coagulatio/sync-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seed1: s1, seed2: s2 })
            });
        }
    } catch (e) { console.error("[A8] Session Sync Fail", e); }
}

// 🚀 [수복]: 초기 로드 시퀀스 정형화
document.addEventListener('DOMContentLoaded', async () => {
    loadLucisConfig(); // 1. 저장된 설정 먼저 불러오기
    
    renderAyanamsaButtons();
    initDichotomySwitch();
    initSortSwitch();
    initSettingsModal();
    generateStaticRows(); 

    await ensureSession(); 

    await Promise.all([
        fetchSabianSymbols(),
        fetchArabicDefinitions(),
        fetchAsteroidDefinitions(),
        fetchLucisData() 
    ]);
});

async function fetchAsteroidDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/asteroids/definitions');
        if(res.ok) STATE.asteroidDefs = await res.json();
    } catch(e) { console.warn("[A8] Asteroid Meanings Missing"); }
}

async function fetchArabicDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/arabic/definitions');
        if(res.ok) STATE.arabicDefs = await res.json();
    } catch(e) { console.warn("[A8] Arabic Defs Missing"); }
}

/* ─────────────────────────────────────────────────────────────
   1. UI INITIALIZATION & HANDLERS
   ───────────────────────────────────────────────────────────── */

function initDichotomySwitch() {
    const switchEl = document.getElementById('dicho-switch'); 
    const knob = document.getElementById('dicho-knob');
    const labelTrad = document.getElementById('label-trad');
    const labelMod = document.getElementById('label-mod');
    const container = document.querySelector('.n8-dichotomy-module');

    if (!switchEl) return;

    function updateUI() {
        if (STATE.dichotomy === 'modern') {
            knob.classList.add('right');
            labelMod.classList.add('active');
            labelTrad.classList.remove('active');
            if(container) container.setAttribute('data-tooltip', 'Modern Rulers');
        } else {
            knob.classList.remove('right');
            labelTrad.classList.add('active');
            labelMod.classList.remove('active');
            if(container) container.setAttribute('data-tooltip', 'Traditional Rulers');
        }
    }
    updateUI(); // Init state

    switchEl.addEventListener('click', () => {
        STATE.dichotomy = (STATE.dichotomy === 'traditional') ? 'modern' : 'traditional';
        saveLucisConfig();
        updateUI();
        fetchLucisData();
    });
}

function initSortSwitch() {
    const labels = document.querySelectorAll('.sort-label');
    labels.forEach(lbl => {
        // 🚀 [수복]: 초기화 시 기존 HTML의 active를 무시하고 STATE에 따라 강제 토글 (불 두 개 켜짐 방지)
        lbl.classList.toggle('active', lbl.dataset.mode === STATE.config.sortMode);
        
        lbl.onclick = () => {
            STATE.config.sortMode = lbl.dataset.mode;
            saveLucisConfig(); // 🚀 정렬 모드 저장
            labels.forEach(l => l.classList.toggle('active', l.dataset.mode === STATE.config.sortMode));
            updateUrl();
            renderLucisGrid(); 
        };
    });
}

/* static/world/albedo/modules/a8.js (Partial Update) */

// ... (기존 상수 및 init 함수들 유지) ...

/* 🚀 [수복]: renderSettingsUI, toggleEntity, toggleSub 함수는 
   이제 a8_settings.js로 이관되었으므로 삭제합니다.
*/

function initSettingsModal() {
    // 🚀 [Updated Logic]: Dynamic Module Loading
    const btnOpen = document.getElementById('btn-open-settings');
    
    if (btnOpen) {
        btnOpen.onclick = async () => {
            // URL State Update
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('modal', 'settings');
            window.history.pushState({modal: 'settings'}, '', newUrl);

            await openA8Settings();
        };
    }
    
    // Window Popstate Listener (뒤로가기 지원)
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.modal === 'settings') {
            openA8Settings();
        } else {
            closeA8Settings();
        }
    });
}

// 🚀 [New]: C1 Style Module Loader
async function openA8Settings() {
    const modal = document.getElementById('settings-modal');
    const container = document.getElementById('settings-rows-container');
    const btnConfirm = document.getElementById('btn-confirm-settings');
    
    modal.style.display = 'flex';

    // 1. Load HTML Template if empty
    if (container.innerHTML.trim() === '') {
        const tpl = document.getElementById('tpl-a8-settings');
        if (tpl) {
             // 템플릿 사용
             container.innerHTML = tpl.innerHTML;
        } else {
            // Fallback: Fetch directly (C1 style)
            try {
                const res = await fetch('/static/world/albedo/modules/a8_settings.html');
                if(res.ok) container.innerHTML = await res.text();
            } catch(e) { container.innerHTML = "Error Loading Module"; }
        }
    }

    // 2. Load CSS & JS if needed
    if (!document.getElementById('css-a8-settings')) {
        const link = document.createElement('link');
        link.id = 'css-a8-settings'; link.rel = 'stylesheet';
        link.href = '/static/world/albedo/modules/a8_settings.css';
        document.head.appendChild(link);
    }

    if (!window.initA8Settings) {
        const script = document.createElement('script');
        script.src = '/static/world/albedo/modules/a8_settings.js';
        script.onload = () => window.initA8Settings();
        document.body.appendChild(script);
    } else {
        window.initA8Settings(); // Re-run init to refresh state from localStorage
    }

    // 3. Confirm Logic
    if (btnConfirm) {
        btnConfirm.onclick = () => {
            // URL Clean
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('modal');
            window.history.pushState({}, '', newUrl);

            closeA8Settings();
            
            // 🚀 [Important]: Settings closed, NOW we update the grid.
            loadLucisConfig(); // Reload from localStorage (updated by settings js)
            renderLucisGrid(); // Heavy Re-render
        };
    }
}

function closeA8Settings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = 'none';
}

// ... (나머지 Grid Rendering 로직 유지) ...

function renderAyanamsaButtons() {
    const nav = document.getElementById('ayanamsa-nav-container');
    if (!nav) return; 
    nav.innerHTML = ''; 
    AYANAMSAS.forEach(ay => {
        const btn = document.createElement('button');
        btn.className = `ayan-tab ${STATE.ayanamsa === ay.id ? 'active' : ''}`;
        btn.textContent = ay.label; 
        btn.title = ay.desc; 
        btn.onclick = () => switchAyanamsa(ay.id);
        nav.appendChild(btn);
    });
}

window.switchAyanamsa = function(id) {
    STATE.ayanamsa = id;
    saveLucisConfig();
    renderAyanamsaButtons();
    updateUrl();
    fetchLucisData();
};

function updateUrl() {
    const params = new URLSearchParams(window.location.search);
    params.set('sort', STATE.config.sortMode);
    params.set('ayanamsa', STATE.ayanamsa);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

/* ─────────────────────────────────────────────────────────────
   2. DATA FETCHING
   ───────────────────────────────────────────────────────────── */

async function fetchSabianSymbols() {
    try {
        const res = await fetch('/api/astro/theory/sabian/definitions');
        if (res.ok) {
            STATE.sabianSymbols = await res.json();
            // 🚀 [FIX]: 데이터 로딩 여부와 상관없이 사비안만 있으면 즉시 리렌더링
            renderLucisGrid(); 
        }
    } catch (e) { console.warn(e); }
}

async function fetchArabicDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/arabic/definitions');
        if(res.ok) STATE.arabicDefs = await res.json();
    } catch(e) { console.warn("Arabic Defs Fail"); }
}

/* static/world/albedo/modules/a8.js — v19.9.6 House System Sync */

async function fetchLucisData() {
    toggleLoading(true); // 로딩 UI 활성화
    try {
        // 1. 하우스 시스템 독립 로드 (Settings 우선)
        const savedHouse = localStorage.getItem('tetramegistus_house') || 'placidus';
        const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
        const hSys = houseMap[savedHouse] || 'P'; 

        // 2. Orb 설정 로드
        let orbValue = 1.5;
        const savedOrb = localStorage.getItem('tetramegistus_orb');
        if (savedOrb) {
            const parsed = parseFloat(savedOrb);
            if (!isNaN(parsed)) orbValue = parsed;
        }

        // 3. 파라미터 구성
        const params = new URLSearchParams({
            ayanamsa: STATE.ayanamsa,
            dichotomy: STATE.dichotomy || 'traditional', // 스위치 상태
            orb: orbValue,
            h_sys: hSys // 🚀 [수복]: 독립된 하우스 설정 전달
        });

        const url = `/api/astro/codex/lucis/reading?${params.toString()}`;
        console.log(`[A8] Requesting Lucis | Ruler: ${STATE.dichotomy} | House: ${hSys}`);

        const res = await fetch(url);
        
        if (res.ok) {
            const data = await res.json();
            
            // 🚀 [DEBUG]: 서버 에러 체크
            if (data.error) {
                console.error("[A8 SERVER ERROR]", data.error);
                return;
            }

            if (data.grids) {
                STATE.codexData = extractGridData(data.grids);
                renderLucisGrid();
                
                // 🚀 [UI Sync]: 툴팁에 현재 상태 반영 (N8 스타일)
                const container = document.querySelector('.n8-dichotomy-module');
                if (container) {
                    const modeLabel = (STATE.dichotomy || 'traditional').toUpperCase();
                    const houseLabel = (hSys === 'W') ? 'Whole Sign' : (hSys === 'K' ? 'Koch' : 'Placidus');
                    container.setAttribute('data-tooltip', `Ruler: ${modeLabel} / House: ${houseLabel}`);
                }
            }
        } else {
            console.error("[A8] Network Error:", res.status);
        }
    } catch (e) { 
        console.error("[A8] Fetch Logic Fail:", e); 
    } finally { 
        toggleLoading(false); // 로딩 UI 비활성화
    }
}

function extractGridData(grids) {
    const combined = [];
    for(let i=0; i<360; i++) {
        combined[i] = {
            'seed': grids.seed[i],
            'partner': grids.partner[i],
            'davison': grids.davison[i],     // ordinatio -> davison
            'composite': grids.composite[i]  // coagulatio -> composite
        };
    }
    return combined;
}

/* ─────────────────────────────────────────────────────────────
   3. GRID RENDERING
   ───────────────────────────────────────────────────────────── */

// Sabian Number 기둥 생성 (불변)
function generateStaticRows() {
    const tbody = document.getElementById('codex-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < 360; i++) {
        const tr = document.createElement('tr');
        tr.dataset.absDeg = i;
        if ((i % 30) + 1 === 30) tr.classList.add('sign-boundary');

        // Sticky Column (Left Pillar) - 데이터 무관하게 항상 존재
        const sabianTd = document.createElement('td');
        sabianTd.className = `sticky-col ${getElemClass(i)}`; // getElemClass는 n8.js 공유 혹은 복사 필요
        sabianTd.innerHTML = getSabianLabel(i); // N8 벤치마킹 함수
        tr.appendChild(sabianTd);

        tbody.appendChild(tr);
    }
}

/* static/world/albedo/modules/a8.js */

function renderLucisGrid() {
    const columns = calculateColumns(); 
    renderHeader(document.getElementById('codex-head-row'), columns);

    for (let i = 0; i < 360; i++) {
        const tr = document.querySelector(`tr[data-abs-deg="${i}"]`);
        if (!tr) continue;

        const sticky = tr.firstElementChild; // SABIAN NUMBER td
        tr.innerHTML = '';
        tr.appendChild(sticky);

        const rowData = STATE.codexData ? STATE.codexData[i] : null;

        // 1. 각 컬럼별 데이터 렌더링 (하우스 틴트 포함)
        columns.forEach(col => {
            const td = document.createElement('td');
            const entityData = rowData ? rowData[col.entity] : null;
            let items = entityData ? entityData[col.sub] || [] : [];
            
            const hKey = `${col.sub}_h`;
            const hIdx = entityData ? entityData[hKey] : 0;
            if (hIdx > 0) td.className = `bg-house-${hIdx}`;

            if (col.sub === 'arabic_lots') renderArabicCell(td, items);
            else renderCell(td, items);
            tr.appendChild(td);
        });

        // 2. 사비안 심볼 렌더링
        const symTd = document.createElement('td');
        symTd.className = 'col-sabian-symbol';
        if (STATE.sabianSymbols && STATE.sabianSymbols[i]) {
            symTd.textContent = STATE.sabianSymbols[i][STATE.lang] || STATE.sabianSymbols[i]['en'];
        }
        tr.appendChild(symTd);

        // 🚀 [핵심 수복]: 사비안 넘버 기둥에 출처별 데이터 밀도 줄 생성
        updateLucisLine(sticky, rowData, columns);
    }
}

function renderArabicCell(td, items) {
    td.innerHTML = '';
    if (!items || items.length === 0) return;

    td.innerHTML = items.map(item => {
        const def = STATE.arabicDefs ? STATE.arabicDefs[item.name] : null;
        const colorClass = def ? def.category : 'white'; // 🚀 JSON의 category 필드 사용 [cite: 90]
        
        return `<div class="codex-item lot-item ${colorClass} clickable" 
                    title="${item.dms}" 
                    onclick="showLotMeaning('${item.name}', event)">
                    ${item.text}
                </div>`;
    }).join('');
}

function calculateColumns() {
    let cols = [];
    const ENT_ORDER = ['composite', 'davison', 'seed', 'partner']; 
    
    if (STATE.config.sortMode === 'seed') {
        const SYS_ORDER = ['main', 'anti', 'minor_asteroids', 'tropical', 'sidereal', 'draconic', 'ketunic', 'arabic_lots'];
        ENT_ORDER.forEach(entKey => {
            const conf = STATE.config.entities[entKey];
            if (!conf || !conf.active) return;
            
            const sortedSubs = [...conf.subs].sort((a,b) => SYS_ORDER.indexOf(a) - SYS_ORDER.indexOf(b));
            sortedSubs.forEach(subKey => {
                // 🚀 [핵심]: IDENTITY_MAP을 사용하여 중복되지 않는 고유 명칭 부여
                const uniqueLabel = (IDENTITY_MAP[entKey] && IDENTITY_MAP[entKey][subKey]) 
                                    ? IDENTITY_MAP[entKey][subKey] 
                                    : subKey;
                cols.push({ entity: entKey, sub: subKey, label: uniqueLabel });
            });
        });
    } else {
        // SYSTEM Sort 모드에서도 동일한 명칭 규칙 적용
        const BUCKETS = [['minor_asteroids'], ['main', 'anti', 'tropical'], ['sidereal', 'draconic', 'ketunic'], ['arabic_lots']];
        BUCKETS.forEach(bucket => {
            ENT_ORDER.forEach(entKey => {
                const conf = STATE.config.entities[entKey];
                if (!conf || !conf.active) return;
                bucket.forEach(subKey => {
                    if (conf.subs.includes(subKey)) {
                        const uniqueLabel = (IDENTITY_MAP[entKey] && IDENTITY_MAP[entKey][subKey]) 
                                            ? IDENTITY_MAP[entKey][subKey] 
                                            : subKey;
                        cols.push({ entity: entKey, sub: subKey, label: uniqueLabel });
                    }
                });
            });
        });
    }
    return cols;
}

function renderHeader(thead, columns) {
    thead.innerHTML = '';
    const thCorner = document.createElement('th');
    thCorner.className = 'sticky-col';
    thCorner.textContent = 'SABIAN NUMBER';
    thead.appendChild(thCorner);

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        
        // 🚀 [Logic Add]: 헤더에 소스별 클래스(src-seed, src-partner...) 강제 주입
        // col.entity 값(seed, partner, davison, composite)을 가져와 클래스로 만듭니다.
        if (col.entity) {
            const srcClass = `src-${col.entity.replace(/_/g, '-')}`;
            th.classList.add(srcClass);
        }
        
        thead.appendChild(th);
    });

    const thEnd = document.createElement('th');
    thEnd.textContent = 'SABIAN SYMBOL';
    thead.appendChild(thEnd);
}

/* ─────────────────────────────────────────────────────────────
   4. RENDER UTILITIES (Missing in previous version)
   ───────────────────────────────────────────────────────────── */

function renderCell(td, items) {
    td.innerHTML = ''; 
    if (!items || items.length === 0) return;
    
    td.innerHTML = items.map(item => {
        const hasMeaning = STATE.asteroidDefs && STATE.asteroidDefs[item.name];
        const clickAttr = hasMeaning ? `onclick="showAsteroidMeaning('${item.name}', event)"` : '';
        const cursorClass = hasMeaning ? 'clickable' : '';

        return `<div class="codex-item ${item.css || 'p-minor'} ${cursorClass}" title="${item.dms}" ${clickAttr}>
                    ${item.text}<span class="star-marker">${item.html_suffix || ''}</span>
                </div>`;
    }).join('');
}

window.showAsteroidMeaning = function(name, event) {
    if (!STATE.asteroidDefs || !STATE.asteroidDefs[name]) return;
    const def = STATE.asteroidDefs[name];
    const meaning = def[STATE.lang] || def['en'];
    displayLucisPopover(name, meaning, "#54FF5F", event);
};

window.showLotMeaning = function(lotName, event) {
    if (!STATE.arabicDefs || !STATE.arabicDefs[lotName]) return;
    const def = STATE.arabicDefs[lotName];
    const meaning = def.meaning[STATE.lang] || def.meaning['en'];
    displayLucisPopover(def.name, meaning, "#49dce1", event);
};

function displayLucisPopover(title, content, titleColor, event) {
    const popover = document.getElementById('lot-meaning-popover');
    if (!popover) return;

    popover.innerHTML = `
        <div style="font-weight:bold; color:${titleColor}; margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:3px;">
            ${title}
        </div>
        <div style="color:#ddd; font-size:0.85rem;">${content}</div>
    `;

    let left = event.pageX + 5;
    let top = event.pageY + 5;
    
    // 화면 경계 체크
    if (left + 250 > window.innerWidth) left = event.pageX - 260;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.display = 'block';

    // 외부 클릭 시 닫기
    setTimeout(() => {
        const close = () => { 
            popover.style.display = 'none'; 
            document.removeEventListener('click', close); 
        };
        document.addEventListener('click', close);
    }, 0);
}

function updateLucisLine(td, row, columns) {
    const oldLine = td.querySelector('.sabian-line-box');
    if (oldLine) oldLine.remove();

    if (!row) return;

    // 🚀 [Whole House 방역]: 설정 확인
    const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');

    let hasMinor = false;
    let activeBoldSources = new Set(); // 중복 소스 방지

    // 현재 화면에 렌더링된 컬럼 데이터만 확인
    columns.forEach(col => {
        const entityData = row[col.entity];
        let items = entityData ? entityData[col.sub] || [] : [];
        
        // 🚀 [핵심]: 라인 생성 여부를 판단할 때만 Cusp 데이터를 제외 (텍스트 렌더링에는 영향 없음)
        if (isWholeHouse) {
            items = items.filter(item => !(item.css && item.css.includes('p-cusp')) && !(item.text && item.text.toLowerCase().includes('cusp')));
        }
        
        if (items.length > 0) {
            // 가는 줄 대상 (소행성, 아라빅 랏)
            if (['minor_asteroids', 'arabic_lots'].includes(col.sub)) {
                hasMinor = true;
            } 
            // 굵은 줄 대상 (그 외 모든 주요 시스템)
            else {
                activeBoldSources.add(col.entity);
            }
        }
    });

    if (activeBoldSources.size === 0 && !hasMinor) return;

    const lineBox = document.createElement('div');
    lineBox.className = 'sabian-line-box';

    // 굵은 줄 생성: 소스별로 개별 줄을 만들어 층층이 쌓음 (N8 규격 3px)
    // 순서: Composite -> Davison -> Parent A -> Parent B (오른쪽에서 왼쪽으로)
    const ORDER = ['composite', 'davison', 'seed', 'partner'];
    ORDER.forEach(src => {
        if (activeBoldSources.has(src)) {
            const thick = document.createElement('div');
            thick.className = `s-line-thick s-line-${src}`;
            lineBox.appendChild(thick);
        }
    });

    // 가는 줄 생성 (회색)
    if (hasMinor) {
        const thin = document.createElement('div');
        thin.className = 's-line-thin';
        lineBox.appendChild(thin);
    }

    td.appendChild(lineBox);
}

function getSabianLabel(i) {
    const signIdx = Math.floor(i / 30);
    const degree = (i % 30) + 1;
    return `${TROPICAL_SIGNS[signIdx]} ${degree}`;
}

function getElemClass(i) {
    return ELEMENT_CYCLE[Math.floor(i / 30) % 4];
}

/* ─────────────────────────────────────────────────────────────
   ★ GRIMOIRE MANIFESTATION (A8 -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    // 1. 🚀 [절대 수복]: Albedo(Coniunctio) 전용 시드 조합 가져오기 (a7.js와 완벽 동일)
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

    if (!s1Name && !s2Name) {
        alert("No active seed found. Please return to the main station.");
        return false;
    }

    let targetName = `${s1Name} & ${s2Name}`;

    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const hSys = localStorage.getItem('tetramegistus_house') || 'P';
    const arabicRuler = localStorage.getItem('tetramegistus_arabic_ruler') || 'traditional';

    // 2. A8 전용 설정(렌더링할 컬럼 데이터) 불러오기
    const savedPrefs = localStorage.getItem('tetramegistus_a8_prefs');
    
    let settings = {
        'composite': ['main'],
        'davison': ['tropical'],
        'seed': ['tropical'],
        'partner': ['tropical']
    }; 
    
    if (savedPrefs) {
        try { 
            const parsed = JSON.parse(savedPrefs);
            if (parsed && parsed.entities) {
                let hasActive = false;
                for (const key in parsed.entities) {
                    const ent = parsed.entities[key];
                    // 🚀 [FIX]: 오브젝트의 active 상태와 subs 배열 내부 요소가 있는지 정확히 검사!
                    if (ent && ent.active && ent.subs && ent.subs.length > 0) {
                        hasActive = true; 
                        break;
                    }
                }
                if (hasActive) settings = parsed.entities;
            }
        } catch(e) {
            console.warn("[A8] Settings parse error:", e);
        }
    }

    // 3. 다이나믹 컴파일러 라우팅 (Seed vs System 분기)
    // 🚀 HTML UI에서 현재 'active' 클래스가 붙어있는 모드 버튼의 data-mode 값을 직접 긁어옵니다.
    const activeModeBtn = document.querySelector('.sort-switch-module .sort-label.active');
    const viewMode = activeModeBtn ? activeModeBtn.getAttribute('data-mode') : 'seed';

    let compilerId = `a8_${currentLang}`;
    if (viewMode === 'system') {
        compilerId = `a8_sys_${currentLang}`; // System 모드가 켜져 있으면 a8_sys_en 으로 교체!
    }
    console.log(`[A8] Current View Mode: ${viewMode} -> Selected Compiler: ${compilerId}`);

    // ==========================================
    // 4. Payload 조립 및 데이터 정제 (Sanitization)
    // ==========================================

    let rawSettings = {};
    try {
        const saved = localStorage.getItem('tetramegistus_a8_prefs');
        if (saved) {
            rawSettings = JSON.parse(saved).entities || {};
        } 
    } catch(e) {}

    // 🚀 [Airtight Fix 1]: 완벽한 디폴트 주입
    if (Object.keys(rawSettings).length === 0) {
        rawSettings = {
            'composite': { active: true, subs: ['main'] },
            'davison': { active: true, subs: ['tropical'] },
            'seed': { active: true, subs: ['tropical'] },
            'partner': { active: true, subs: ['tropical'] }
        };
    }

    // 🚀 [Airtight Fix 2]: 백엔드 규격(seed/partner) 통일
    let cleanSettings = {};
    Object.keys(rawSettings).forEach(rawKey => {
        const conf = rawSettings[rawKey];
        if (!conf || conf.active !== true) return;

        let cleanSubs = [...(conf.subs || [])];
        
        let normKey = rawKey.toLowerCase().trim();
        if (['seed1', 'a', 'parent_a'].includes(normKey)) normKey = 'seed';
        if (['seed2', 'b', 'parent_b'].includes(normKey)) normKey = 'partner';

        if (normKey === 'composite') {
            cleanSubs = cleanSubs.filter(s => ['main', 'anti'].includes(s));
            if (cleanSubs.length === 0) cleanSubs = ['main'];
        }
        
        if (cleanSubs.length > 0) {
            cleanSettings[normKey] = { active: true, subs: cleanSubs };
        }
    });

    // 🚀 [오류 수복 지점]: 엉뚱한 로컬스토리지 조회를 버리고, 원래 사용하시던 albedoStation 변수에서 직접 안전하게 복사
    let s1 = albedoStation.seed1 ? JSON.parse(JSON.stringify(albedoStation.seed1)) : {};
    let s2 = albedoStation.seed2 ? JSON.parse(JSON.stringify(albedoStation.seed2)) : {};
    
    s1.city = s1.city || s1.location || "Unknown Location";
    s2.city = s2.city || s2.location || "Unknown Location";

    const payload = {
        seed_id: seedId,        
        stage: 'albedo',       
        target_name: targetName,
        language: STATE.lang || 'en',
        metadata: {
            ayanamsa: STATE.ayanamsa || 'lahiri',
            h_sys: hSys,
            arabic_ruler: arabicRuler,
            settings: cleanSettings 
        },
        seed: { seed1: s1, seed2: s2 } 
    };

    // 5. 백엔드 API로 전송
    try {
        console.log(`[GRIMOIRE] Manifesting Codex Lucis to Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            
            // 버튼 시각적 피드백 애니메이션
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