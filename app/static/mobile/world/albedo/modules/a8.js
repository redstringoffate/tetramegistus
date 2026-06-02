/* static/mobile/world/albedo/modules/a8.js - CODEX LUCIS (The Ultimate Rebuild) */

const TROPICAL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ELEMENT_CYCLE = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri', desc: 'Standard Vedic (Chitra Paksha)' },
    { id: 'raman', label: 'Raman', desc: 'B.V. Raman' },
    { id: 'kp', label: 'KP', desc: 'Krishnamurti Paddhati' },
    { id: 'fagan-bradley', label: 'Fagan-Bradley', desc: 'Fagan-Bradley' },
    { id: 'yukteswar', label: 'Yukteswar', desc: 'Sri Yukteswar' }
];

const DEFAULT_ENTITIES = {
    'composite': { active: true, subs: ['main'] },
    'davison': { active: true, subs: ['tropical'] },
    'seed': { active: true, subs: ['tropical'] },
    'partner': { active: true, subs: ['tropical'] }
};

const IDENTITY_MAP = {
    'composite': { 'main': 'Composite', 'anti': 'anticomposite' },
    'davison': {
        'minor_asteroids': 'Davison_ast', 'tropical': 'Davison_T', 'sidereal': 'Davison_S',
        'draconic': 'Davison_D', 'ketunic': 'Davison_K', 'arabic_lots': 'Davison_lot'
    },
    'seed': {
        'minor_asteroids': 'A_asteroids', 'tropical': 'A_Tropical', 'sidereal': 'A_Sidereal',
        'draconic': 'A_Draconic', 'ketunic': 'A_Ketunic', 'arabic_lots': 'A_Lots'
    },
    'partner': {
        'minor_asteroids': 'B_asteroids', 'tropical': 'B_Tropical', 'sidereal': 'B_Sidereal',
        'draconic': 'B_Draconic', 'ketunic': 'B_Ketunic', 'arabic_lots': 'B_Lots'
    }
};

window.A8_STATE = {
    ayanamsa: 'lahiri',
    lang: localStorage.getItem('tetramegistus_lang') || 'en',
    sabianSymbols: null,
    asteroidDefs: null, 
    arabicDefs: null,   
    codexData: null,
    dichotomy: 'traditional',
    sortMode: 'seed',
    config: null
};

let a8ToastTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 🚀 [수복]: 모달 및 로딩 화면을 부모 컨테이너(z-index: 1)에서 탈출시킴
    document.body.appendChild(document.getElementById('m-a8-settings-modal'));
    document.body.appendChild(document.getElementById('lucis-loading-overlay'));

    loadLucisConfig();
    updateDichotomyUI();
    renderAyanamsaButtons();
    generateStaticRows();
    
    bindGlobalInteractions(); // 🚀 [복구]: N8의 토스트 및 팝업 클릭 감지기

    await ensureSession(); 

    await Promise.all([
        fetchSabianSymbols(),
        fetchArabicDefinitions(),
        fetchAsteroidDefinitions(),
        fetchLucisData() 
    ]);
});

function loadLucisConfig() {
    const saved = localStorage.getItem('m_a8_config');
    if (saved) {
        A8_STATE.config = JSON.parse(saved);
    } else {
        A8_STATE.config = JSON.parse(JSON.stringify(DEFAULT_ENTITIES));
        localStorage.setItem('m_a8_config', JSON.stringify(A8_STATE.config));
    }
    A8_STATE.dichotomy = localStorage.getItem('m_a8_dichotomy') || 'traditional';
}

async function ensureSession() {
    try {
        let s1 = JSON.parse(localStorage.getItem('seed1'));
        let s2 = JSON.parse(localStorage.getItem('seed2'));
        if (s1 && s2) {
            await fetch('/api/astro/coagulatio/sync-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seed1: s1, seed2: s2 })
            });
        }
    } catch (e) { }
}

function toggleLoading(show) {
    const overlay = document.getElementById('lucis-loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

/* ─────────────────────────────────────────────────────────────
   N8 STYLE TOAST & POPOVER (완벽 복원)
   ───────────────────────────────────────────────────────────── */

function bindGlobalInteractions() {
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.codex-item');
        if (cell && cell.dataset.item) {
            e.stopPropagation();
            const item = JSON.parse(decodeURIComponent(cell.dataset.item));
            const type = cell.dataset.type;
            triggerItemFeedback(item, type);
        } else {
            const popover = document.getElementById('m-a8-popover');
            if (popover && popover.classList.contains('active')) {
                popover.classList.remove('active');
            }
        }
    });
}

function triggerItemFeedback(item, type) {
    let nameColor = '#06F8FF'; 
    if (type === 'asteroid') nameColor = '#54FF5F';
    if (type === 'lot') nameColor = '#49dce1';

    let toastHtml = `<div style="font-weight:bold; color:${nameColor}; margin-bottom:4px; font-size:1.1em; text-transform:uppercase;">${item.name}</div>`;
    
    let rawDms = item.dms || "";
    let isDay = /\[Day Lord\]/i.test(rawDms);
    let isHour = /\[Hour Lord\]/i.test(rawDms);
    rawDms = rawDms.replace(/\[Day Lord\]/gi, '').replace(/\[Hour Lord\]/gi, '');

    // 2. 🚀 [핵심 수복]: 별자리 Info 크로스 렌더링 버그 완전 해결 (구분자 대통합 파서)
    let extractedStarInfos = [];
    if (rawDms.includes('★')) {
        // 백엔드가 '|', ':', '★' 중 무엇을 섞어 썼든 전부 '★' 하나로 통일하고 빈칸을 날림
        let tokens = rawDms.replace(/[|:]/g, '★').split('★').map(t => t.trim()).filter(t => t !== '');
        
        // 토큰 구조는 이제 무조건 [행성도수, 별1이름, 별1도수, 별2이름, 별2도수...] 로 평탄화됨
        if (tokens.length > 0) {
            rawDms = tokens[0]; // 1) 첫 번째 덩어리는 찌꺼기 없는 순수 달(행성) 도수
            
            // 2) 나머지는 2개씩(이름-도수) 짝지어서 완벽하게 복원
            for (let i = 1; i < tokens.length; i += 2) {
                let starName = tokens[i];
                let starDms = tokens[i+1] || "";
                extractedStarInfos.push(`★ ${starName} : ${starDms}`);
            }
        }
    }

    if (isDay && isHour) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord] [Hour Lord]</strong><br>`;
    else if (isDay) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Day Lord]</strong><br>`;
    else if (isHour) toastHtml += `<strong style="color:#FFD700; font-size:0.85em;">[Hour Lord]</strong><br>`;

    let infoArr = [];
    if (rawDms) infoArr.push(rawDms);
    if (item.dignity && item.dignity !== '-') infoArr.push(item.dignity);
    if (item.ruler && item.ruler !== '-') infoArr.push(`Lord: ${item.ruler}`);
    
    if (infoArr.length > 0) {
        toastHtml += `<div style="color:#ddd; font-size:0.85rem; margin-bottom:6px; margin-top:4px;">${infoArr.join(' | ')}</div>`;
    }

    if (item.fixed_stars && item.fixed_stars.length > 0) {
        toastHtml += `<div style="border-top:1px solid #333; margin-top:6px; padding-top:6px; text-align:center; display:inline-block; width:100%; box-sizing:border-box;">`;
        item.fixed_stars.forEach(star => {
            const sName = star.star_name || star.name || "Unknown Star";
            const sOrb = star.orb !== undefined ? star.orb.toFixed(2) : "0.00";
            let sInfo = star.meaning_ko || star.meaning || star.nature || "";
            if (!sInfo) {
                let found = extractedStarInfos.find(t => t.toLowerCase().includes(sName.toLowerCase()));
                if (found) {
                    let regex = new RegExp(`★?\\s*${sName}[\\s\\-\\:\\(]*`, 'i');
                    let infoPart = found.replace(regex, '').replace(/\)$/, '').trim();
                    if (infoPart) sInfo = infoPart;
                }
            }
            const infoStr = sInfo ? ` | <span style="color:#999999;">${sInfo}</span>` : "";
            toastHtml += `<div style="font-size:0.75rem; color:#aaa; margin-bottom:3px; line-height:1.2;">
                <span style="color:#fff; font-weight:bold;">*${sName}</span>${infoStr} | Orb: ${sOrb}°
            </div>`;
        });
        toastHtml += `</div>`;
    }

    showA8Toast(toastHtml);

    let meaning = null;
    if (type === 'asteroid' && A8_STATE.asteroidDefs && A8_STATE.asteroidDefs[item.name]) {
        meaning = A8_STATE.asteroidDefs[item.name][A8_STATE.lang] || A8_STATE.asteroidDefs[item.name]['en'];
    } else if (type === 'lot' && A8_STATE.arabicDefs && A8_STATE.arabicDefs[item.name]) {
        meaning = A8_STATE.arabicDefs[item.name].meaning[A8_STATE.lang] || A8_STATE.arabicDefs[item.name].meaning['en'];
    }

    if (meaning) showA8Popup(item.name, meaning);
}

function showA8Toast(html) {
    const toast = document.getElementById('m-a8-toast');
    if (!toast) return;
    toast.innerHTML = html;
    if (toast.classList.contains('m-toast-hidden')) toast.classList.remove('m-toast-hidden');
    if (a8ToastTimer) clearTimeout(a8ToastTimer);
    a8ToastTimer = setTimeout(() => toast.classList.add('m-toast-hidden'), 4000);
}

function showA8Popup(title, text) {
    const popover = document.getElementById('m-a8-popover');
    if (!popover) return;
    popover.innerHTML = `
        <div style="font-weight:bold; margin-bottom:10px; color:#49dce1; border-bottom:1px solid #49dce1; padding-bottom:5px; text-transform:uppercase; text-align:center;">
            ${title}
        </div>
        <div style="line-height:1.5; font-size:0.85rem; color:#ddd; text-align:center;">
            ${text.replace(/\\n/g, '<br>')}
        </div>
    `;
    popover.classList.add('active');
}

/* ─────────────────────────────────────────────────────────────
   MOBILE INTERACTION HANDLERS 
   ───────────────────────────────────────────────────────────── */

window.switchA8SortMode = function(mode) {
    A8_STATE.sortMode = mode;
    document.getElementById('btn-sort-seed').classList.toggle('active', mode === 'seed');
    document.getElementById('btn-sort-system').classList.toggle('active', mode === 'system');
    renderLucisGrid();
};

window.switchA8Dichotomy = function() {
    A8_STATE.dichotomy = (A8_STATE.dichotomy === 'traditional') ? 'modern' : 'traditional';
    localStorage.setItem('m_a8_dichotomy', A8_STATE.dichotomy);
    updateDichotomyUI();
    fetchLucisData();
};

function updateDichotomyUI() {
    const knob = document.getElementById('a8-dicho-knob');
    const labelTrad = document.getElementById('a8-label-trad');
    const labelMod = document.getElementById('a8-label-mod');
    const container = document.querySelector('.m-dichotomy-module');

    if (!knob) return;

    if (A8_STATE.dichotomy === 'modern') {
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

// 🚀 [복구]: 세팅창 열기 (에러 방지를 위해 강제로 renderA8SettingsUI 내장 호출)
window.openA8SettingsModal = function() {
    const modal = document.getElementById('m-a8-settings-modal');
    if (modal) {
        modal.style.display = 'flex'; 
        modal.classList.add('active');
    }
    // a8_settings.js 파일 분리로 인한 텅 빈 화면 오류 방지
    renderA8SettingsUI(); 
};

window.closeA8SettingsModal = function() {
    const modal = document.getElementById('m-a8-settings-modal');
    if (modal) {
        modal.style.display = 'none'; 
        modal.classList.remove('active');
    }
    loadLucisConfig(); 
    renderLucisGrid();
};

window.showToggleTooltip = function(id, text1, text2, condition) {
    const tooltip = document.getElementById(id);
    if (tooltip) {
        tooltip.textContent = condition ? text1 : text2;
        tooltip.style.display = 'block';
    }
};

window.hideToggleTooltip = function(id) {
    const tooltip = document.getElementById(id);
    if (tooltip) tooltip.style.display = 'none';
};

function renderAyanamsaButtons() {
    const nav = document.getElementById('a8-ayanamsa-bar');
    if (!nav) return; 
    nav.innerHTML = ''; 
    AYANAMSAS.forEach(ay => {
        const btn = document.createElement('button');
        btn.className = `m-tab ${A8_STATE.ayanamsa === ay.id ? 'active' : ''}`;
        btn.textContent = ay.label.toUpperCase(); 
        btn.onclick = () => {
            A8_STATE.ayanamsa = ay.id;
            renderAyanamsaButtons();
            fetchLucisData();
        };
        nav.appendChild(btn);
    });
}

/* ─────────────────────────────────────────────────────────────
   DATA FETCHING 
   ───────────────────────────────────────────────────────────── */

async function fetchAsteroidDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/asteroids/definitions');
        if(res.ok) A8_STATE.asteroidDefs = await res.json();
    } catch(e) {}
}

async function fetchArabicDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/arabic/definitions');
        if(res.ok) A8_STATE.arabicDefs = await res.json();
    } catch(e) {}
}

async function fetchSabianSymbols() {
    try {
        const res = await fetch('/api/astro/theory/sabian/definitions');
        if (res.ok) {
            A8_STATE.sabianSymbols = await res.json();
            renderLucisGrid(); 
        }
    } catch (e) {}
}

async function fetchLucisData() {
    toggleLoading(true);
    try {
        const savedHouse = localStorage.getItem('tetramegistus_house') || 'placidus';
        const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
        const hSys = houseMap[savedHouse] || 'P'; 

        let orbValue = 1.5;
        const savedOrb = localStorage.getItem('tetramegistus_orb');
        if (savedOrb) {
            const parsed = parseFloat(savedOrb);
            if (!isNaN(parsed)) orbValue = parsed;
        }

        const params = new URLSearchParams({
            ayanamsa: A8_STATE.ayanamsa,
            dichotomy: A8_STATE.dichotomy,
            orb: orbValue,
            h_sys: hSys
        });

        const url = `/api/astro/codex/lucis/reading?${params.toString()}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.grids) {
            A8_STATE.codexData = extractGridData(data.grids);
            renderLucisGrid();
        }
    } catch (e) { 
    } finally { 
        toggleLoading(false);
    }
}

function extractGridData(grids) {
    const combined = [];
    for(let i=0; i<360; i++) {
        combined[i] = {
            'seed': grids.seed[i],
            'partner': grids.partner[i],
            'davison': grids.davison[i],     
            'composite': grids.composite[i]  
        };
    }
    return combined;
}

/* ─────────────────────────────────────────────────────────────
   GRID RENDERING 
   ───────────────────────────────────────────────────────────── */

function generateStaticRows() {
    const tbody = document.getElementById('a8-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < 360; i++) {
        const signIdx = Math.floor(i / 30);
        const degree = (i % 30) + 1;
        const elemClass = ELEMENT_CYCLE[signIdx % 4];

        const tr = document.createElement('tr');
        tr.dataset.absDeg = i;
        if (degree === 30) tr.classList.add('sign-boundary');

        const sabianTd = document.createElement('td');
        sabianTd.className = `sticky-col ${elemClass}`;
        sabianTd.innerHTML = `${TROPICAL_SIGNS[signIdx]} ${degree}`;
        tr.appendChild(sabianTd);

        tbody.appendChild(tr);
    }
}

function renderLucisGrid() {
    const columns = calculateColumns(); 
    const thead = document.getElementById('a8-table-head');
    if(!thead) return;
    renderHeader(thead, columns);

    for (let i = 0; i < 360; i++) {
        const tr = document.querySelector(`tr[data-abs-deg="${i}"]`);
        if (!tr) continue;

        const sticky = tr.firstElementChild; 
        tr.innerHTML = '';
        tr.appendChild(sticky);

        const rowData = A8_STATE.codexData ? A8_STATE.codexData[i] : null;

        columns.forEach(col => {
            const td = document.createElement('td');
            const entityData = rowData ? rowData[col.entity] : null;
            let items = entityData ? entityData[col.sub] || [] : [];
            
            td.className = `cell-${col.entity}-${col.sub}`; 
            
            // 기존 로직 삭제하고 아래 코드로 교체
            let hIdx = entityData ? (entityData[`${col.sub}_h`] || entityData['tropical_h'] || entityData['main_h']) : null;

            if (hIdx && hIdx !== '-') {
                td.classList.add(`bg-house-${hIdx}`);
            }

            if (col.sub === 'arabic_lots') renderArabicCell(td, items);
            else {
                const type = (col.sub === 'minor_asteroids') ? 'asteroid' : 'planet';
                renderCell(td, items, type);
            }
            tr.appendChild(td);
        });

        const symTd = document.createElement('td');
        symTd.className = 'col-sabian-symbol';
        if (A8_STATE.sabianSymbols && A8_STATE.sabianSymbols[i]) {
            symTd.textContent = A8_STATE.sabianSymbols[i][A8_STATE.lang] || A8_STATE.sabianSymbols[i]['en'];
        }
        tr.appendChild(symTd);

        updateLucisLine(sticky, rowData, columns);
    }
}

function calculateColumns() {
    let cols = [];
    const ENT_ORDER = ['composite', 'davison', 'seed', 'partner']; 
    
    if (A8_STATE.sortMode === 'seed') {
        const SYS_ORDER = ['main', 'anti', 'minor_asteroids', 'tropical', 'sidereal', 'draconic', 'ketunic', 'arabic_lots'];
        ENT_ORDER.forEach(entKey => {
            const conf = A8_STATE.config[entKey];
            if (!conf || !conf.active) return;
            
            const sortedSubs = [...conf.subs].sort((a,b) => SYS_ORDER.indexOf(a) - SYS_ORDER.indexOf(b));
            sortedSubs.forEach(subKey => {
                const uniqueLabel = (IDENTITY_MAP[entKey] && IDENTITY_MAP[entKey][subKey]) 
                                    ? IDENTITY_MAP[entKey][subKey] 
                                    : subKey;
                cols.push({ entity: entKey, sub: subKey, label: uniqueLabel });
            });
        });
    } else {
        const BUCKETS = [['minor_asteroids'], ['main', 'anti', 'tropical'], ['sidereal', 'draconic', 'ketunic'], ['arabic_lots']];
        BUCKETS.forEach(bucket => {
            ENT_ORDER.forEach(entKey => {
                const conf = A8_STATE.config[entKey];
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
    const tr = document.createElement('tr');

    const thCorner = document.createElement('th');
    thCorner.className = 'sticky-corner';
    thCorner.textContent = 'SABIAN NUMBER';
    tr.appendChild(thCorner);

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        if (col.entity) {
            th.className = `src-${col.entity.replace(/_/g, '-')}`;
        }
        tr.appendChild(th);
    });

    const thEnd = document.createElement('th');
    thEnd.textContent = 'SABIAN SYMBOL';
    tr.appendChild(thEnd);
    thead.appendChild(tr);
}

// 🚀 [복구]: N8 스타일 data-item 인젝션 
function renderCell(td, items, type) {
    td.innerHTML = ''; 
    if (!items || items.length === 0) return;
    
    td.innerHTML = items.map(item => {
        const cssClass = item.css || 'p-minor';
        const itemData = encodeURIComponent(JSON.stringify(item));
        return `<div class="codex-item ${cssClass}" data-item="${itemData}" data-type="${type}">
                    ${item.text}<span class="star-marker">${item.html_suffix || ''}</span>
                </div>`;
    }).join('');
}

function renderArabicCell(td, items) {
    td.innerHTML = '';
    if (!items || items.length === 0) return;

    td.innerHTML = items.map(item => {
        const def = A8_STATE.arabicDefs ? A8_STATE.arabicDefs[item.name] : null;
        const colorClass = def ? def.category : 'white'; 
        const itemData = encodeURIComponent(JSON.stringify(item));
        return `<div class="codex-item lot-item ${colorClass}" data-item="${itemData}" data-type="lot">
                    ${item.text}
                </div>`;
    }).join('');
}

function updateLucisLine(td, row, columns) {
    const oldLine = td.querySelector('.sabian-line-box');
    if (oldLine) oldLine.remove();
    if (!row) return;

    const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');
    let hasMinor = false;
    let activeBoldSources = new Set();

    columns.forEach(col => {
        const entityData = row[col.entity];
        let items = entityData ? entityData[col.sub] || [] : [];
        
        if (isWholeHouse) {
            items = items.filter(item => !(item.css && item.css.includes('p-cusp')) && !(item.text && item.text.toLowerCase().includes('cusp')));
        }
        
        if (items.length > 0) {
            if (['minor_asteroids', 'arabic_lots'].includes(col.sub)) {
                hasMinor = true;
            } else {
                activeBoldSources.add(col.entity);
            }
        }
    });

    if (activeBoldSources.size === 0 && !hasMinor) return;

    const lineBox = document.createElement('div');
    lineBox.className = 'sabian-line-box';

    const ORDER = ['composite', 'davison', 'seed', 'partner'];
    ORDER.forEach(src => {
        if (activeBoldSources.has(src)) {
            const thick = document.createElement('div');
            thick.className = `s-line-thick s-line-${src}`;
            lineBox.appendChild(thick);
        }
    });

    if (hasMinor) {
        const thin = document.createElement('div');
        thin.className = 's-line-thin';
        lineBox.appendChild(thin);
    }
    td.appendChild(lineBox);
}

/* ─────────────────────────────────────────────────────────────
   INLINE SETTINGS RENDERER (강제 병합)
   ───────────────────────────────────────────────────────────── */

function renderA8SettingsUI() {
    const container = document.getElementById('m-a8-settings-list');
    if (!container) return;
    
    container.innerHTML = ''; 
    const currentConfig = A8_STATE.config || {
        'composite': { active: true, subs: ['main'] },
        'davison':   { active: true, subs: ['tropical'] },
        'seed':      { active: true, subs: ['tropical'] },
        'partner':   { active: true, subs: ['tropical'] }
    };

    const ENTITIES = [
        { id: 'composite', label: 'COMPOSITE' }, { id: 'davison', label: 'DAVISON' },
        { id: 'seed', label: 'PARENT A' }, { id: 'partner', label: 'PARENT B' }
    ];

    const SUB_OPTS = {
        'composite': [{ id: 'main', label: 'Main' }, { id: 'anti', label: 'Anti' }],
        'common': [ 
            { id: 'minor_asteroids', label: 'Asteroids' }, { id: 'tropical', label: 'Tropical' },
            { id: 'sidereal', label: 'Sidereal' }, { id: 'draconic', label: 'Draconic' },
            { id: 'ketunic', label: 'Ketunic' }, { id: 'arabic_lots', label: 'Arabic Lots' }
        ]
    };

    ENTITIES.forEach(entity => {
        const conf = currentConfig[entity.id] || { active: false, subs: [] };
        
        const item = document.createElement('div');
        item.className = `m-a8-setting-item ${conf.active ? 'active-node' : ''}`;

        const header = document.createElement('div');
        header.className = 'm-a8-setting-header';
        header.innerHTML = `<div class="m-a8-setting-title">${entity.label}</div>`;

        const toggle = document.createElement('div');
        toggle.className = `m-toggle-switch ${conf.active ? 'enabled' : ''}`;
        toggle.innerHTML = `<div class="m-toggle-knob ${conf.active ? 'right' : ''}"></div>`;
        
        toggle.onclick = (e) => {
            e.stopPropagation();
            conf.active = !conf.active;
            if (conf.active && (!conf.subs || conf.subs.length === 0)) {
                conf.subs = (entity.id === 'composite') ? ['main'] : ['tropical'];
            }
            A8_STATE.config = currentConfig;
            localStorage.setItem('m_a8_config', JSON.stringify(currentConfig));
            renderA8SettingsUI(); 
        };

        header.appendChild(toggle);
        item.appendChild(header);

        const optionsArea = document.createElement('div');
        optionsArea.className = `m-a8-options-area ${conf.active ? '' : 'disabled-area'}`;

        const btnGroup = document.createElement('div');
        const opts = (entity.id === 'composite') ? SUB_OPTS.composite : SUB_OPTS.common;
        
        btnGroup.className = `m-a8-btn-group ${opts.length === 2 ? 'grid-2' : 'grid-3'}`;
        
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `m-a8-opt-btn ${conf.subs.includes(opt.id) ? 'active' : ''}`;
            btn.textContent = opt.label;
            
            btn.onclick = (e) => {
                e.stopPropagation();
                if (!conf.active) return; 

                if (conf.subs.includes(opt.id)) {
                    if (conf.subs.length > 1) { 
                        conf.subs = conf.subs.filter(s => s !== opt.id);
                        btn.classList.remove('active');
                    }
                } else {
                    conf.subs.push(opt.id);
                    btn.classList.add('active');
                }
                A8_STATE.config = currentConfig;
                localStorage.setItem('m_a8_config', JSON.stringify(currentConfig));
            };
            btnGroup.appendChild(btn);
        });
        
        optionsArea.appendChild(btnGroup);
        item.appendChild(optionsArea);
        container.appendChild(item);
    });
}