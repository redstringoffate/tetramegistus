/* static/world/nigredo/modules/n8.js */

const TROPICAL_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

// 🚀 [FIX]: 이 상수가 누락되어 렌더링이 멈췄었습니다. 복구 완료.
const ELEMENT_CYCLE = ['elem-fire', 'elem-earth', 'elem-air', 'elem-water'];

const AYANAMSAS = [
    { id: 'lahiri', label: 'Lahiri', desc: 'Standard Vedic (Chitra Paksha)' },
    { id: 'raman', label: 'Raman', desc: 'B.V. Raman' },
    { id: 'kp', label: 'KP', desc: 'Krishnamurti Paddhati' },
    { id: 'fagan-bradley', label: 'Fagan-Bradley', desc: 'Fagan-Bradley' },
    { id: 'yukteswar', label: 'Yukteswar', desc: 'Sri Yukteswar' }
];

let STATE = {
    ayanamsa: 'lahiri',
    lang: localStorage.getItem('tetramegistus_lang') || 'ko',
    sabianSymbols: null,
    codexData: null // 백엔드에서 올 실제 천체 위치 데이터
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[N8] Initializing CODEX TENEBRIS...");
    
    const params = new URLSearchParams(window.location.search);
    STATE.ayanamsa = params.get('ayanamsa') || 'lahiri';
    
    // 🚀 [FIX 1]: 초기화 함수 호출 추가 (이게 없어서 클릭 이벤트가 안 먹혔습니다)
    initDichotomySwitch(); 

    renderAyanamsaButtons();
    generateStaticRows();
    
    await ensureSession(); 

    console.log("[N8] Fetching All Data Streams...");
    await Promise.all([
        fetchSabianSymbols(),
        fetchArabicDefinitions(),
        fetchAsteroidDefinitions(),
        fetchCodexData() 
    ]);
});

async function fetchAsteroidDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/asteroids/definitions');
        if(res.ok) STATE.asteroidDefs = await res.json();
    } catch(e) { console.warn("[N8] Asteroid Meanings Missing"); }
}

// 🚀 [Updated]: N2 Style Toggle Logic
function initDichotomySwitch() {
    const switchEl = document.getElementById('dicho-switch'); // 클릭 영역
    const knob = document.getElementById('dicho-knob');
    const labelTrad = document.getElementById('label-trad');
    const labelMod = document.getElementById('label-mod');
    const container = document.querySelector('.n8-dichotomy-module');

    if (!switchEl) return;

    updateUI(); // 초기 상태 반영

    switchEl.addEventListener('click', () => {
        // Toggle State
        STATE.dichotomy = (STATE.dichotomy === 'traditional') ? 'modern' : 'traditional';
        updateUI();
        fetchCodexData(); // 데이터 재요청
    });

    function updateUI() {
        if (STATE.dichotomy === 'modern') {
            // Modern Mode (Right)
            knob.classList.add('right');
            labelMod.classList.add('active');
            labelTrad.classList.remove('active');
            if(container) container.setAttribute('data-tooltip', 'Arabic Lots');
        } else {
            // Traditional Mode (Left)
            knob.classList.remove('right');
            labelTrad.classList.add('active');
            labelMod.classList.remove('active');
            if(container) container.setAttribute('data-tooltip', 'Arabic Lots');
        }
    }
}

async function ensureSession() {
    try {
        // 로컬 스토리지에서 아무거나 잡히는 대로 시도
        let seed = JSON.parse(localStorage.getItem('current_seed'));
        if (!seed) seed = JSON.parse(localStorage.getItem('active_seed'));
        
        if (seed) {
            await fetch('/api/astro/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(seed)
            });
            console.log("[N8] Session Refreshed locally.");
        } else {
            console.warn("[N8] No local seed. Hoping server remembers us.");
        }
    } catch (e) { console.warn(e); }
}

function renderAyanamsaButtons() {
    const nav = document.getElementById('ayanamsa-nav-container');
    if (!nav) return; 
    nav.innerHTML = ''; 
    AYANAMSAS.forEach(ay => {
        const btn = document.createElement('button');
        btn.dataset.id = ay.id; 
        btn.className = `ayan-tab ${STATE.ayanamsa === ay.id ? 'active' : ''}`;
        btn.textContent = ay.label; 
        
        // ✨ N6 Style Hover Logic: 네이티브 툴팁 적용
        btn.title = ay.desc; 
        
        btn.onclick = () => switchAyanamsa(ay.id);
        nav.appendChild(btn);
    });
}

window.switchAyanamsa = function(id) {
    STATE.ayanamsa = id;
    const params = new URLSearchParams(window.location.search);
    params.set('ayanamsa', id);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    
    const buttons = document.querySelectorAll('#ayanamsa-nav-container .ayan-tab');
    buttons.forEach(btn => {
        if (btn.dataset.id === id) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    fetchCodexData(); 
};

// 🚀 [Static Rows]: 4원소 색상 적용 및 Sabian Number 고정
function generateStaticRows() {
    const tbody = document.getElementById('codex-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < 360; i++) {
        const signIdx = Math.floor(i / 30);
        const degree = (i % 30) + 1;
        const signName = TROPICAL_SIGNS[signIdx];
        
        // 🚀 [Logic]: 4원소 클래스 계산 (Aries=0=Fire, Taurus=1=Earth...)
        const elemClass = ELEMENT_CYCLE[signIdx % 4];

        const tr = document.createElement('tr');
        tr.dataset.absDeg = i; 

        if (degree === 30) tr.classList.add('sign-boundary');

        tr.innerHTML = `
            <td class="sticky-col ${elemClass}">${signName} ${degree}</td>
            <td class="col-minor-asteroids">-</td>
            <td class="col-tropical">-</td>
            <td class="col-sidereal">-</td>
            <td class="col-draconic">-</td>
            <td class="col-ketunic">-</td>
            <td class="col-arabic-lots">-</td>
            <td class="col-sabian-symbol">Loading...</td>
        `;
        tbody.appendChild(tr);
    }
}

async function fetchSabianSymbols() {
    try {
        // 🚀 [Note]: app/data 경로는 보안상 직접 접근이 안될 수 있으므로, 
        // 404가 뜬다면 추후 Python 라우터(/api/astro/theory/sabian)를 뚫어야 합니다.
        const res = await fetch('/api/astro/theory/sabian/definitions'); 
        if(res.ok) {
            STATE.sabianSymbols = await res.json();
            renderSabianSymbols();
        } else {
            console.warn("Sabian JSON not found. Check static path or router.");
        }
    } catch (e) { console.error("Sabian Load Fail", e); }
}

function renderSabianSymbols() {
    if (!STATE.sabianSymbols) return;
    for (let i = 0; i < 360; i++) {
        const row = document.querySelector(`tr[data-abs-deg="${i}"] .col-sabian-symbol`);
        if (row && STATE.sabianSymbols[i]) {
            const symbolData = STATE.sabianSymbols[i];
            row.textContent = symbolData[STATE.lang] || symbolData['en'];
        }
    }
}

async function fetchArabicDefinitions() {
    try {
        const res = await fetch('/api/astro/theory/arabic/definitions');
        if(res.ok) STATE.arabicDefs = await res.json();
    } catch(e) { console.warn("[N8] Arabic Defs Missing"); }
}

async function fetchCodexData() {
    try {
        // 1. Traditional/Modern 스위치 (Arabic Lots 용)
        const currentDicho = STATE.dichotomy || 'traditional';
        
        // 2. 🚀 [수복]: 전역 설정 읽기 (스위치와 완전 분리)
        // world.js의 tetramegistus_house 키값을 따름
        const savedHouse = localStorage.getItem('tetramegistus_house') || 'placidus';
        const houseMap = { 'placidus': 'P', 'whole': 'W', 'koch': 'K' };
        const hSys = houseMap[savedHouse] || 'P'; 
        
        let orbValue = 1.5; 
        const savedOrb = localStorage.getItem('tetramegistus_orb');
        if (savedOrb) {
            const parsed = parseFloat(savedOrb);
            if (!isNaN(parsed)) orbValue = parsed;
        }

        // 🔗 파라미터 독립 전달: dichotomy와 h_sys가 각자의 설정값을 가지고 전송됨
        const url = `/api/astro/codex/reading?ayanamsa=${STATE.ayanamsa}&dichotomy=${currentDicho}&orb=${orbValue}&h_sys=${hSys}`;
        
        console.log(`[N8] Independent Request | Dichotomy: ${currentDicho} | House: ${hSys}`);

        const res = await fetch(url);
        const json = await res.json();
        
        if (json.grid) {
            STATE.codexData = json.grid;
            
            // 🚀 [New Feature]: Time Unknown 시 Arabic Lots 컬럼 숨김 처리
            const isUnknown = json.meta && json.meta.is_time_unknown === 1;
            handleTimeUnknownUI(isUnknown);

            renderCodexGrid();
            
            const container = document.querySelector('.n8-dichotomy-module');
            if (container) {
                const modeLabel = currentDicho.charAt(0).toUpperCase() + currentDicho.slice(1);
                const houseName = hSys === 'W' ? 'Whole' : (hSys === 'K' ? 'Koch' : 'Placidus');
                container.setAttribute('data-tooltip', `Ruler: ${modeLabel} / House: ${houseName}`);
            }
        }
    } catch (e) { console.error("[N8] Fetch Error:", e); }
}

// 🚀 [Helper]: 생시 미상 시 Arabic Lots 컬럼(헤더 및 셀)의 가시성 제어
function handleTimeUnknownUI(isUnknown) {
    const displayStyle = isUnknown ? 'none' : 'table-cell';
    
    // 1. Data Cells (JS가 생성한 td)
    document.querySelectorAll('.col-arabic-lots').forEach(td => {
        td.style.display = displayStyle;
    });

    // 2. Header (HTML에 고정된 th)
    // ID가 있다면 ID로, 없다면 텍스트로 찾아서 숨김
    const th = document.getElementById('th-arabic-lots');
    if (th) {
        th.style.display = displayStyle;
    } else {
        // Fallback: 텍스트로 찾기 (안전장치)
        document.querySelectorAll('th').forEach(h => {
            if(h.textContent.includes('ARABIC') || h.textContent.includes('Arabic')) {
                h.style.display = displayStyle;
            }
        });
    }
}

// 🚀 [Updated]: 데이터 렌더링 핵심 함수
function renderCodexGrid() {
    if (!STATE.codexData) return;

    STATE.codexData.forEach((row, i) => {
        const tr = document.querySelector(`tr[data-abs-deg="${i}"]`);
        if (!tr) return;

        // 1. Render Cells (각 셀 내용 채우기)
        renderCell(tr.querySelector('.col-minor-asteroids'), row.minor_asteroids);
        renderCell(tr.querySelector('.col-tropical'), row.tropical);
        renderCell(tr.querySelector('.col-sidereal'), row.sidereal);
        renderCell(tr.querySelector('.col-draconic'), row.draconic);
        renderCell(tr.querySelector('.col-ketunic'), row.ketunic);
        renderArabicCell(tr.querySelector('.col-arabic-lots'), row.arabic_lots);

        // 2. 🚀 [House Tint]: 하우스 배경색 적용 (엔진 v27.3 호환)
        // tropical_h 필드가 있으면 해당 하우스 클래스(bg-house-N)를 추가
        if (row.tropical_h) tr.querySelector('.col-tropical').classList.add(`bg-house-${row.tropical_h}`);
        if (row.sidereal_h) tr.querySelector('.col-sidereal').classList.add(`bg-house-${row.sidereal_h}`);
        if (row.draconic_h) tr.querySelector('.col-draconic').classList.add(`bg-house-${row.draconic_h}`);
        if (row.ketunic_h) tr.querySelector('.col-ketunic').classList.add(`bg-house-${row.ketunic_h}`);

        // 3. 🚀 [Sabian Line]: 줄 긋기 로직 실행
        updateSabianLine(tr.querySelector('.sticky-col'), row);
    });
}

// 🚀 [New]: 사비안 라인 생성기
function updateSabianLine(td, row) {
    // 기존 라인이 있다면 제거 (재렌더링 대비)
    const oldLine = td.querySelector('.sabian-line-box');
    if(oldLine) oldLine.remove();

    // 🚀 [Whole House 방역]: 설정 확인
    const isWholeHouse = (localStorage.getItem('tetramegistus_house') === 'whole');

    // 라인 판단용 필터 헬퍼 함수
    const getValidItems = (items) => {
        if (!items) return [];
        if (!isWholeHouse) return items; // Whole House가 아니면 그대로 반환
        return items.filter(item => !(item.css && item.css.includes('p-cusp')) && !(item.text && item.text.toLowerCase().includes('cusp')));
    };

    // 데이터 존재 여부 확인 (Cusp 필터링 후)
    // Major: T/S/D/K 4개 시스템 중 하나라도 유효한 데이터가 있으면 굵은 줄 대상
    const hasMajor = (getValidItems(row.tropical).length > 0 || getValidItems(row.sidereal).length > 0 || getValidItems(row.draconic).length > 0 || getValidItems(row.ketunic).length > 0);
    // Minor: 소행성이나 아라빅 랏이 있으면 가는 줄 대상
    const hasMinor = (getValidItems(row.minor_asteroids).length > 0 || getValidItems(row.arabic_lots).length > 0);

    if (!hasMajor && !hasMinor) return; // 데이터 없으면 종료

    const lineBox = document.createElement('div');
    lineBox.className = 'sabian-line-box';

    // 굵은 줄 (Major) - 우선순위 높음 (오른쪽 끝)
    if (hasMajor) {
        const thick = document.createElement('div');
        thick.className = 's-line-thick';
        lineBox.appendChild(thick);
    }

    // 가는 줄 (Minor) - 굵은 줄 옆에 배치
    if (hasMinor) {
        const thin = document.createElement('div');
        thin.className = 's-line-thin';
        lineBox.appendChild(thin);
    }

    td.appendChild(lineBox);
}

// 🚀 [Updated]: 일반 천체 렌더링 (Fixed Star * 마커 복구)
function renderCell(td, items) {
    td.innerHTML = ''; 
    if (!items || items.length === 0) return;
    
    td.innerHTML = items.map(item => {
        const title = item.dms; 
        const suffix = item.html_suffix || ''; 
        const className = item.css || 'p-minor'; 

        // 정의 데이터가 있는지 확인 (item.name 기준)
        const hasMeaning = STATE.asteroidDefs && STATE.asteroidDefs[item.name];
        const clickAttr = hasMeaning ? `onclick="showAsteroidMeaning('${item.name}', event)"` : '';
        const cursorClass = hasMeaning ? 'clickable' : '';

        return `<div class="codex-item ${className} ${cursorClass}" title="${title}" ${clickAttr}>
                    ${item.text}<span class="star-marker">${suffix}</span>
                </div>`;
    }).join('');
}

window.showAsteroidMeaning = function(name, event) {
    if (!STATE.asteroidDefs || !STATE.asteroidDefs[name]) return;
    
    const def = STATE.asteroidDefs[name];
    const popover = document.getElementById('lot-meaning-popover');
    
    const meaning = def[STATE.lang] || def['en'];

    popover.innerHTML = `
        <div style="font-weight:bold; color:#54FF5F; margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:3px;">
            ${name}
        </div>
        <div style="color:#ddd; font-size:0.85rem;">${meaning}</div>
    `;

    let left = event.pageX + 5;
    let top = event.pageY + 5;
    if (left + 260 > window.innerWidth) left = event.pageX - 270;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.display = 'block';

    setTimeout(() => {
        const closeHandler = function(e) {
            popover.style.display = 'none';
            document.removeEventListener('click', closeHandler);
        };
        document.addEventListener('click', closeHandler);
    }, 0);
};

// ... (renderArabicCell, showLotMeaning 등 나머지 함수는 기존 유지) ...
// Arabic Lots 전용 렌더링 (JSON 정의에 따른 색상 적용)
function renderArabicCell(td, items) {
    td.innerHTML = '';
    if (!items || items.length === 0) return;

    td.innerHTML = items.map(item => {
        // JSON에서 Lot 이름으로 정의를 찾음
        const def = STATE.arabicDefs ? STATE.arabicDefs[item.name] : null;
        // 정의가 있으면 category(색상) 적용, 없으면 기본값
        const colorClass = def ? def.category : 'white'; 
        
        return `<div class="codex-item lot-item ${colorClass}" 
                    title="${item.dms}" 
                    onclick="showLotMeaning('${item.name}', event)">
                    ${item.text}
                </div>`;
    }).join('');
}

// 🚀 [Interaction]: Arabic Lot 클릭 시 의미 표시 (Popover)
window.showLotMeaning = function(lotName, event) {
    if (!STATE.arabicDefs || !STATE.arabicDefs[lotName]) return;
    
    const def = STATE.arabicDefs[lotName];
    const popover = document.getElementById('lot-meaning-popover');
    
    // 언어 설정 반영
    const meaning = def.meaning[STATE.lang] || def.meaning['en'];
    const title = def.name; // 이름은 영어 고정

    popover.innerHTML = `
        <div style="font-weight:bold; color:#49dce1; margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:3px;">
            ${title}
        </div>
        <div style="color:#ddd; font-size:0.85rem;">${meaning}</div>
    `;

    // 위치 조정 (마우스 근처)
    let left = event.pageX + 5;
    let top = event.pageY + 5;
    
    // 화면 오른쪽 밖으로 나가는 것 방지
    if (left + 260 > window.innerWidth) left = event.pageX - 270;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.display = 'block';

    // 외부 클릭 시 닫기 (이벤트 버블링 방지 위해 setTimeout 사용)
    setTimeout(() => {
        const closeHandler = function(e) {
            popover.style.display = 'none';
            document.removeEventListener('click', closeHandler);
        };
        document.addEventListener('click', closeHandler);
    }, 0);
};

/* ─────────────────────────────────────────────────────────────
   X. GRIMOIRE MANIFESTATION (N8 Codex Tenebris -> Archive)
   ───────────────────────────────────────────────────────────── */
window.saveToGrimoire = async function() {
    // 1. 현재 열려있는 차트의 시드 가져오기
    const activeSeed = JSON.parse(localStorage.getItem('active_seed'));
    if (!activeSeed) {
        alert("No active seed found. Please return to the main station.");
        return false;
    }

    const targetName = activeSeed.name || "Unknown_Seed";
    const seedId = activeSeed.id || activeSeed.idx || "unknown";

    // 2. 테트라메기스투스 전역 설정 로드 (언어, 하우스, 아라빅 룰러)
    const currentLang = localStorage.getItem('tetramegistus_lang') || 'en';
    const params = new URLSearchParams(window.location.search);
    const hSys = params.get('h_sys') || localStorage.getItem('tetramegistus_house') || 'P';
    
    // N8 전용: Arabic Lots 계산을 위한 전통/현대 룰러 설정
    const arabicRuler = localStorage.getItem('tetramegistus_arabic_ruler') || 'traditional'; 

    // 3. 다이나믹 컴파일러 라우팅 (Codex는 언어별로 n8_en, n8_ko 로 나뉨)
    const compilerId = `n8_${currentLang}`;

    // 4. Payload 조립 (Python N8 컴파일러가 읽을 수 있도록 구성)
    const payload = {
        seed_id: seedId,        
        stage: 'nigredo',       
        target_name: targetName,
        language: currentLang,
        metadata: {
            ayanamsa: STATE.ayanamsa,
            h_sys: hSys,
            arabic_ruler: arabicRuler
        },
        seed: activeSeed 
    };

    // 5. 백엔드 API로 전송
    try {
        console.log(`[GRIMOIRE] Manifesting Codex Tenebris to Archive using [ ${compilerId} ]...`, payload);
        const res = await fetch(`/api/grimoire/save/excel/${compilerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (res.ok) {
            console.log(`[GRIMOIRE] Archive [${targetName}] Saved Successfully!`);
            return true; 
        } else {
            alert('Failed to manifest Grimoire: ' + (result.detail || result.error));
            throw new Error(result.detail || result.error); 
        }
    } catch (e) {
        console.error("[GRIMOIRE] Manifestation Error:", e);
        alert("Network Error during Grimoire Save.");
        throw e;
    }
};